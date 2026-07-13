const FALLBACKS = {
  activity: { tab: "timeline" },
  calendar: { tab: "calendar" },
  garden: { tab: "home-assets", category: "garden" },
  habits: { tab: "habits" },
  life: { tab: "life-lists" },
  maintenance: { tab: "home-assets" },
  notes: { tab: "life-lists" },
  pool: { tab: "pool" },
  tasks: { tab: "tasks" },
  weather: { tab: "calendar" },
};

const hasId = (rows, id) => Boolean(id && (rows || []).some(row => String(row.id) === String(id)));

export function resolveRecommendationLink(recommendation, data = {}) {
  if (!recommendation) return { tab: "home" };
  const target = recommendation.target || {};
  if (target.type === "task" && hasId(data.tasks, target.id)) return { tab: "tasks", taskId: target.id, search: target.label || "" };
  if (target.type === "calendar-event" && hasId(data.events, target.id)) return { tab: "calendar", eventId: target.id };
  if (target.type === "habit" && hasId(data.habits, target.id)) return { tab: "habits", habitId: target.id };
  if (target.type === "routine" && hasId(data.routines, target.id)) return { tab: "habits", routineId: target.id };
  if (target.type === "pool-maintenance" && hasId(data.poolSchedule, target.id)) return { tab: "pool", section: "maintenance", maintenanceId: target.id };
  if (target.type === "home-asset" && hasId(data.homeAssets, target.id)) return { tab: "home-assets", assetId: target.id };
  if (target.type === "life-item" && hasId(data.lifeItems, target.id)) return { tab: "life-lists", listId: target.listId, itemId: target.id };
  if (target.type === "note" && hasId(data.notes, target.id)) return { tab: "life-lists", noteId: target.id };
  if (recommendation.nav && typeof recommendation.nav === "object") return recommendation.nav;
  return FALLBACKS[recommendation.category] || { tab: typeof recommendation.nav === "string" ? recommendation.nav : "home" };
}

