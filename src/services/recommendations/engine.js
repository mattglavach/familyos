const DAY_MS = 86400000;

export const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const dateOnly = value => value ? String(value).slice(0, 10) : null;
const distance = (value, today) => value ? Math.round((new Date(`${dateOnly(value)}T12:00:00`) - new Date(`${today}T12:00:00`)) / DAY_MS) : null;
const eventDate = event => dateOnly(event.start?.dateTime || event.start?.date || event.date);
const active = item => !item.archived && !item.completed && String(item.status || "").toLowerCase() !== "completed";

export function insight(input) {
  return {
    id: input.id,
    severity: input.severity || "info",
    category: input.category,
    title: input.title,
    recommendedAction: input.recommendedAction,
    supportingData: input.supportingData || [],
    nav: input.nav || input.category,
    completable: input.completable !== false,
    sourceIds: input.sourceIds || [],
  };
}

export function CalendarProvider(data, context) {
  const events = (data.events || []).filter(event => { const days = distance(eventDate(event), context.today); return days !== null && days >= 0 && days <= 7; });
  const today = events.filter(event => eventDate(event) === context.today);
  const byDay = events.reduce((map, event) => ({ ...map, [eventDate(event)]: [...(map[eventDate(event)] || []), event] }), {});
  const conflicts = Object.values(byDay).reduce((count, day) => count + Math.max(0, day.filter(event => event.start?.dateTime).length - 1), 0);
  const special = events.filter(event => /(birthday|anniversary)/i.test(`${event.summary || event.title || ""}`));
  return [
    today.length && insight({ id: "calendar-today", category: "calendar", severity: "info", title: today.length === 1 ? `${today[0].summary || today[0].title || "An event"} is scheduled today.` : `${today.length} events are scheduled today.`, recommendedAction: "Review today's schedule and preparation needs.", supportingData: today.map(event => event.summary || event.title).slice(0, 4), nav: "calendar" }),
    conflicts > 0 && insight({ id: "calendar-conflicts", category: "calendar", severity: "high", title: `You have ${conflicts} possible calendar conflict${conflicts === 1 ? "" : "s"} this week.`, recommendedAction: "Review overlapping timed events.", supportingData: Object.keys(byDay).filter(day => byDay[day].filter(event => event.start?.dateTime).length > 1), nav: "calendar" }),
    ...special.map(event => insight({ id: `life-event-${event.id || eventDate(event)}`, category: "life", severity: "medium", title: `${event.summary || event.title} is coming up.`, recommendedAction: "Confirm plans, gifts, or other preparation.", supportingData: [eventDate(event)], nav: { tab: "calendar", eventId: event.id } })),
  ].filter(Boolean);
}

export function TaskProvider(data, context) {
  const tasks = (data.tasks || []).filter(active);
  const overdue = tasks.filter(task => distance(task.due_date, context.today) < 0);
  const dueToday = tasks.filter(task => distance(task.due_date, context.today) === 0);
  const important = tasks.filter(task => task.is_important || ["high", "urgent"].includes(String(task.priority).toLowerCase()));
  return [
    overdue.length && insight({ id: "tasks-overdue", category: "tasks", severity: overdue.some(task => task.is_important) ? "critical" : "high", title: `${overdue.length} task${overdue.length === 1 ? " is" : "s are"} overdue.`, recommendedAction: "Complete, delegate, or reschedule the overdue work.", supportingData: overdue.map(task => task.title).slice(0, 5), nav: { tab: "tasks", filter: "overdue" }, sourceIds: overdue.map(task => task.id) }),
    dueToday.length && insight({ id: "tasks-today", category: "tasks", severity: "medium", title: `${dueToday.length} task${dueToday.length === 1 ? " is" : "s are"} due today.`, recommendedAction: "Confirm today's owners and sequence.", supportingData: dueToday.map(task => task.title).slice(0, 5), nav: { tab: "tasks", filter: "today" }, sourceIds: dueToday.map(task => task.id) }),
    important.length && insight({ id: "tasks-important", category: "tasks", severity: "medium", title: `${important.length} important task${important.length === 1 ? " needs" : "s need"} attention.`, recommendedAction: "Protect time for the highest-priority item.", supportingData: important.map(task => task.title).slice(0, 5), nav: { tab: "tasks", filter: "important" } }),
  ].filter(Boolean);
}

export function HabitProvider(data, context) {
  const habits = (data.habits || []).filter(item => !item.archived && item.status !== "archived");
  const completions = data.habitCompletions || [];
  const todayDone = new Set(completions.filter(item => dateOnly(item.completed_at || item.habit_date) === context.today && item.status !== "skipped").map(item => item.habit_id));
  const missed = habits.filter(item => !todayDone.has(item.id));
  const streak = Math.max(0, ...habits.map(item => Number(item.current_streak || item.streak || 0)));
  return [
    missed.length && insight({ id: "habits-today", category: "habits", severity: "low", title: `${missed.length} habit${missed.length === 1 ? " remains" : "s remain"} today.`, recommendedAction: "Complete the smallest habit next to maintain momentum.", supportingData: missed.map(item => item.name).slice(0, 5), nav: "habits" }),
    streak > 0 && insight({ id: "habit-streak", category: "habits", severity: "info", title: `Your best current habit streak is ${streak} day${streak === 1 ? "" : "s"}.`, recommendedAction: "Keep the streak active today.", supportingData: [], nav: "habits", completable: false }),
  ].filter(Boolean);
}

export function PoolProvider(data, context) {
  const latest = [...(data.poolReadings || [])].sort((a, b) => String(b.logged_at).localeCompare(String(a.logged_at)))[0];
  const lowChlorine = latest && Number(latest.free_chlorine) < Number(data.poolProfile?.target_fc_min || 2);
  const due = (data.poolSchedule || []).filter(item => { const next = item.due_date || (item.last_completed && item.interval_days ? new Date(new Date(`${item.last_completed}T12:00:00`).getTime() + Number(item.interval_days) * DAY_MS).toISOString().slice(0, 10) : null); return next && next <= context.today; });
  return [
    lowChlorine && insight({ id: "pool-chlorine-low", category: "pool", severity: "high", title: "Pool chlorine is below its target range.", recommendedAction: "Open Pool, review the measured recommendation, and confirm any treatment manually.", supportingData: [`Free chlorine ${latest.free_chlorine}`], nav: "pool" }),
    due.length && insight({ id: "pool-maintenance", category: "pool", severity: "medium", title: `${due.length} pool maintenance item${due.length === 1 ? " is" : "s are"} due.`, recommendedAction: "Complete the maintenance checklist and log the result.", supportingData: due.map(item => item.title).slice(0, 5), nav: { tab: "pool", section: "maintenance" } }),
  ].filter(Boolean);
}

export function MaintenanceProvider(data, context) {
  const due = (data.maintenance || []).filter(item => active(item) && item.next_maintenance && dateOnly(item.next_maintenance) <= context.today);
  return due.length ? [insight({ id: "home-maintenance-due", category: "maintenance", severity: "high", title: `${due.length} home maintenance item${due.length === 1 ? " is" : "s are"} due.`, recommendedAction: "Schedule or complete the most urgent maintenance.", supportingData: due.map(item => item.name || item.title).slice(0, 5), nav: "home-assets", sourceIds: due.map(item => item.id) })] : [];
}

export function ShoppingProvider(data) {
  const needed = (data.shoppingItems || []).filter(item => !item.purchased && !item.archived);
  const inventory = needed.filter(item => item.inventory_flag || item.pantry_item_id);
  return needed.length ? [insight({ id: "shopping-needed", category: "shopping", severity: inventory.length ? "medium" : "low", title: `${needed.length} shopping item${needed.length === 1 ? " is" : "s are"} waiting.`, recommendedAction: inventory.length ? "Restock flagged inventory and group items by store." : "Review the list before the next store trip.", supportingData: needed.map(item => item.name).slice(0, 5), nav: "shopping" })] : [];
}

export function GardenProvider(data, context) {
  const due = (data.gardenReminders || []).filter(item => active(item) && dateOnly(item.due_date || item.next_maintenance) <= context.today);
  return due.map(item => insight({ id: `garden-${item.id}`, category: "garden", severity: "medium", title: `${item.name || item.title || "Garden care"} is due.`, recommendedAction: item.recommended_action || "Complete and log the garden task.", supportingData: [item.notes].filter(Boolean), nav: "home-assets", sourceIds: [item.id] }));
}

export function ActivityProvider(data, context) {
  const completed = (data.tasks || []).filter(item => item.completed && distance(item.completed_at || item.updated_at, context.today) >= -7);
  return completed.length ? [insight({ id: "recent-accomplishments", category: "activity", severity: "info", title: `${completed.length} task${completed.length === 1 ? " was" : "s were"} completed recently.`, recommendedAction: "Acknowledge progress and carry forward only what still matters.", supportingData: completed.map(item => item.title).slice(0, 5), nav: { tab: "tasks", filter: "completed" }, completable: false })] : [];
}

export const DEFAULT_PROVIDERS = [CalendarProvider, TaskProvider, HabitProvider, PoolProvider, MaintenanceProvider, ShoppingProvider, GardenProvider, ActivityProvider];

export function generateRecommendations(data = {}, options = {}) {
  const context = { today: options.today || new Date().toISOString().slice(0, 10) };
  const dismissed = new Set(options.dismissedIds || []);
  return (options.providers || DEFAULT_PROVIDERS)
    .flatMap(provider => provider(data, context) || [])
    .filter(item => item && !dismissed.has(item.id))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.id.localeCompare(b.id));
}

