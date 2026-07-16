const DAY_MS = 86400000;
const dateOnly = value => value ? String(value).slice(0, 10) : null;
const daysFrom = (value, today) => value ? Math.round((new Date(`${dateOnly(value)}T12:00:00`) - new Date(`${today}T12:00:00`)) / DAY_MS) : null;
const eventDate = event => dateOnly(event.start?.dateTime || event.start?.date || event.date);
const completed = item => Boolean(item.completed) || String(item.status || "").toLowerCase() === "completed";

export const SNOOZE_PRESETS = {
  tomorrow: 1,
  weekend: "weekend",
  nextWeek: 7,
};

export function snoozeUntil(preset, now = new Date()) {
  const next = new Date(now);
  if (preset === "weekend") {
    const days = (6 - next.getDay() + 7) % 7 || 7;
    next.setDate(next.getDate() + days);
  } else next.setDate(next.getDate() + (SNOOZE_PRESETS[preset] || 1));
  next.setHours(8, 0, 0, 0);
  return next.toISOString();
}

export function lifecycleState(history = [], now = new Date()) {
  return history.reduce((map, entry) => {
    const key = entry.recommendation_key || entry.recommendationKey;
    if (!key) return map;
    const current = map[key];
    if (!current || String(entry.created_at || entry.createdAt).localeCompare(String(current.created_at || current.createdAt)) > 0) map[key] = entry;
    return map;
  }, {});
}

export function applySuppression(recommendations = [], history = [], now = new Date()) {
  const latest = lifecycleState(history, now);
  return recommendations.filter(item => {
    const state = latest[item.deduplicationKey || item.id];
    if (!state) return true;
    if (["completed", "never_remind"].includes(state.action)) return false;
    if (state.action === "dismissed" && state.trigger_signature === item.triggerSignature) return false;
    if (state.action === "snoozed" && state.remind_after && new Date(state.remind_after) > now) return false;
    return true;
  });
}

export function buildCrossModuleRecommendations(data = {}, today) {
  const events = data.events || [];
  const tasks = (data.tasks || []).filter(item => !completed(item));
  const travel = events.filter(event => {
    const days = daysFrom(eventDate(event), today);
    return days !== null && days >= 0 && days <= 14 && /(trip|travel|flight|vacation|hotel|airport)/i.test(`${event.summary || event.title || ""} ${event.description || ""}`);
  });
  const rain = Number(data.weather?.precipitationProbability) >= 70;
  const outdoor = events.filter(event => eventDate(event) === today && /(outdoor|pool|garden|game|practice|park)/i.test(`${event.summary || event.title || ""}`));
  const results = [];
  if (travel.length) {
    const trip = travel[0];
    const preparation = tasks.filter(task => /(pack|passport|reservation|travel|trip)/i.test(`${task.title || ""} ${task.notes || ""}`));
    results.push({
      id: `travel-prep-${trip.id || eventDate(trip)}`, deduplicationKey: `travel:${trip.id || eventDate(trip)}`,
      triggerSignature: `${eventDate(trip)}:${preparation.map(item => item.id).sort().join(",")}`,
      severity: daysFrom(eventDate(trip), today) <= 2 ? "high" : "medium", category: "planning", sourceModules: ["calendar", "tasks"],
      title: `Prepare for ${trip.summary || trip.title || "upcoming travel"}`,
      recommendedAction: preparation.length ? `Review ${preparation.length} related open task${preparation.length === 1 ? "" : "s"} and finish the next one.` : "Create a short travel preparation task.",
      rationale: `Travel is ${daysFrom(eventDate(trip), today)} day(s) away${preparation.length ? " with related work still open" : " and no related preparation task was found"}.`,
      supportingData: [eventDate(trip), ...preparation.slice(0, 2).map(item => item.title)], nav: { tab: "calendar", eventId: trip.id }, estimatedEffort: "moderate", estimatedTime: "15 to 30 minutes", dueTiming: eventDate(trip), urgency: daysFrom(eventDate(trip), today) <= 2 ? "immediate" : "soon", confidence: "high", sourceIds: [trip.id, ...preparation.map(item => item.id)].filter(Boolean), actionType: preparation.length ? "view" : "create_task",
    });
  }
  if (rain && outdoor.length) results.push({
    id: "weather-calendar-rain", deduplicationKey: "weather:outdoor-events:rain", triggerSignature: `${today}:${outdoor.map(item => item.id).sort().join(",")}:${data.weather.precipitationProbability}`,
    severity: "high", category: "weather", sourceModules: ["weather", "calendar"], title: "Rain may disrupt today's outdoor plans",
    recommendedAction: "Confirm backup plans or timing for outdoor events.", rationale: `${data.weather.precipitationProbability}% rain probability overlaps ${outdoor.length} outdoor event${outdoor.length === 1 ? "" : "s"}.`, supportingData: outdoor.map(item => item.summary || item.title).slice(0, 3), nav: "calendar", estimatedEffort: "quick", estimatedTime: "5 minutes", dueTiming: "Today", urgency: "immediate", confidence: "high", sourceIds: outdoor.map(item => item.id), actionType: "view",
  });
  return results;
}

export function buildFamilyBrief({ recommendations = [], data = {}, history = [], today, now = new Date() }) {
  const visible = applySuppression(recommendations, history, now);
  const isToday = item => item.urgency === "immediate" || item.dueTiming === "Today" || ["critical", "high"].includes(item.severity);
  const todayItems = visible.filter(isToday).slice(0, 5);
  const todayKeys = new Set(todayItems.map(item => item.deduplicationKey || item.id));
  const nextActions = visible.filter(item => !todayKeys.has(item.deduplicationKey || item.id)).slice(0, 5);
  const thisWeek = visible.filter(item => !todayKeys.has(item.deduplicationKey || item.id) && !nextActions.includes(item)).slice(0, 5);
  const taskWins = (data.tasks || []).filter(item => completed(item) && daysFrom(item.completed_at || item.updated_at, today) === 0).map(item => `Completed ${item.title}`);
  const habitWins = (data.habitCompletions || []).filter(item => dateOnly(item.completed_at) === today && item.status === "completed").map(() => "Kept a habit commitment");
  const wins = [...taskWins, ...habitWins].slice(0, 3);
  const changes = [
    ...(data.tasks || []).filter(item => dateOnly(item.created_at) === today).map(item => `New task: ${item.title}`),
    ...taskWins,
  ].slice(0, 5);
  const canWait = visible.filter(item => item.severity === "low" || (item.severity === "medium" && item.urgency === "when practical")).slice(0, 3).map(item => ({ ...item, waitReason: "No immediate safety, dependency, or today deadline was detected." }));
  const outcomes = visible.filter(item => ["critical", "high", "medium"].includes(item.severity)).slice(0, 3).map(item => item.title.replace(/\.$/, ""));
  const lookingAhead = (data.events || []).filter(event => {
    const days = daysFrom(eventDate(event), today);
    return days >= 7 && days <= 60 && /(trip|travel|birthday|anniversary|milestone|vacation)/i.test(event.summary || event.title || "");
  }).slice(0, 4);
  const remaining = visible.filter(isToday);
  return { today: todayItems, nextActions, thisWeek, wins, changes, canWait, outcomes, lookingAhead, remaining, tomorrow: visible.filter(item => item.dueTiming === "Tomorrow").slice(0, 3) };
}
