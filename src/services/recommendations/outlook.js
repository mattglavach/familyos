const DAY = 86400000;
const dateOnly = value => String(value || "").slice(0, 10);
const eventDate = event => dateOnly(event.start?.dateTime || event.start?.date || event.date);
const addDays = (today, offset) => new Date(new Date(`${today}T12:00:00`).getTime() + offset * DAY).toISOString().slice(0, 10);
const active = item => !item.completed && String(item.status || "").toLowerCase() !== "completed" && !item.archived;

export function workloadLevel(score) {
  return score >= 12 ? "overloaded" : score >= 8 ? "heavy" : score >= 4 ? "moderate" : "light";
}

export function buildSevenDayOutlook(data = {}, today) {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = addDays(today, offset);
    const events = (data.events || []).filter(event => eventDate(event) === date);
    const timedEvents = events.filter(event => event.start?.dateTime);
    const tasks = (data.tasks || []).filter(item => active(item) && dateOnly(item.due_date) === date);
    const maintenance = (data.maintenance || []).filter(item => active(item) && dateOnly(item.next_maintenance || item.due_date) === date);
    const conflicts = Math.max(0, timedEvents.length - 1);
    const preparationItems = events.filter(event => /(trip|travel|flight|school|game|appointment|birthday|tournament|camp)/i.test(`${event.summary || event.title || ""} ${event.description || ""}`));
    const weatherImpacts = offset === 0 && Number(data.weather?.precipitationProbability) >= 70 ? ["Rain may affect outdoor plans"] : [];
    const score = events.length * 2 + tasks.length * 2 + maintenance.length * 2 + conflicts * 3 + preparationItems.length + weatherImpacts.length * 2;
    return { date, level: workloadLevel(score), score, events, tasks, maintenance, conflicts, preparationItems, weatherImpacts };
  });
}

export function buildMeaningfulChanges(data = {}, since) {
  if (!since) return [];
  const changed = item => new Date(item.updated_at || item.created_at || 0).getTime() > since;
  const changes = [];
  (data.tasks || []).filter(changed).forEach(task => {
    if (task.completed || task.status === "completed") changes.push(`Completed task: ${task.title}`);
    else if (task.due_date && task.due_date < new Date().toISOString().slice(0, 10)) changes.push(`Task became overdue: ${task.title}`);
    else changes.push(`Task changed: ${task.title}`);
  });
  (data.maintenance || []).filter(changed).forEach(item => changes.push(`Maintenance changed: ${item.name || item.title || "Household item"}`));
  (data.events || []).filter(changed).forEach(event => changes.push(`Calendar changed: ${event.summary || event.title || "Household event"}`));
  if (data.weather?.generatedAt && new Date(data.weather.generatedAt).getTime() > since && (Number(data.weather.precipitationProbability) >= 70 || Number(data.weather.low) <= 32 || Number(data.weather.high) >= 95)) changes.push("Weather conditions now affect household plans");
  (data.recommendationHistory || []).filter(item => item.action === "generated" && new Date(item.created_at).getTime() > since).forEach(item => changes.push(`Recommendation became active: ${String(item.recommendation_key).replace(/[-:]/g, " ")}`));
  return [...new Set(changes)].slice(0, 5);
}
