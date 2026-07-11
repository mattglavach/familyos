import { normalizeAttentionItems } from "./attentionItems";
import { formatCalendarEventTime, normalizeCalendarEvent } from "../lib/calendarTime";

export const HOUSEHOLD_CONTEXT_CONTRACT = "familyos.household-context";
export const HOUSEHOLD_CONTEXT_VERSION = "1.0";
export const DEFAULT_TIMEZONE = "America/New_York";
const SUPPORTED_TIMEZONES = new Set([DEFAULT_TIMEZONE, "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "America/Anchorage", "Pacific/Honolulu"]);

function dateOnly(value) { return value ? String(value).slice(0, 10) : null; }
function inRange(value, start, end) { const date = dateOnly(value); return date && date >= start && date <= end; }
function freshness(updatedAt, now, staleHours = 72) {
  if (!updatedAt) return { state: "unavailable", updatedAt: null, stale: false };
  const ageHours = (now.getTime() - new Date(updatedAt).getTime()) / 3600000;
  return { state: ageHours > staleHours ? "stale" : "current", updatedAt, stale: ageHours > staleHours, ageHours: Math.max(0, Math.round(ageHours)) };
}
function moduleState(source, configured = true) {
  if (!configured) return "not-configured";
  if (source === null || source === undefined) return "unavailable";
  return source.length ? "available" : "no-data";
}
function taskAttention(tasks, householdIdentifier, today) {
  return tasks.filter(task => !task.completed && task.due_date && dateOnly(task.due_date) <= today).map(task => ({
    householdIdentifier, sourceModule: "tasks", sourceRecordId: task.id, type: dateOnly(task.due_date) < today ? "task-overdue" : "task-due-today",
    severity: dateOnly(task.due_date) < today ? "High" : "Medium", title: task.title || "Task needs attention",
    message: dateOnly(task.due_date) < today ? "This task is overdue." : "This task is due today.", relevantDate: task.due_date,
    navigationDestination: { tab: "tasks", search: task.title || "" },
  }));
}
function calendarAttention(events, householdIdentifier, today) {
  return events.filter(event => dateOnly(event.date || event.start?.date || event.start?.dateTime) === today).map(event => ({
    householdIdentifier, sourceModule: "calendar", sourceRecordId: event.id, type: "calendar-today", severity: "Informational",
    title: event.title || event.summary || "Calendar event", message: `${formatCalendarEventTime(event)} today`,
    relevantDate: today, navigationDestination: { tab: "calendar", eventId: event.id },
  }));
}

export function buildHouseholdContext(input = {}) {
  const now = input.now instanceof Date ? input.now : new Date(input.now || Date.now());
  const householdIdentifier = input.householdIdentifier || null;
  const timezone = SUPPORTED_TIMEZONES.has(input.timezone) ? input.timezone : DEFAULT_TIMEZONE;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const range = { start: input.range?.start || today, end: input.range?.end || today };
  const tasks = (input.tasks || []).filter(item => !item.household_id || item.household_id === householdIdentifier);
  const calendar = (input.calendar || []).filter(item => !item.household_id || item.household_id === householdIdentifier).map(event => normalizeCalendarEvent(event));
  const maintenance = (input.maintenance || []).filter(item => !item.household_id || item.household_id === householdIdentifier);
  const birthdays = (input.birthdays || []).filter(item => !item.household_id || item.household_id === householdIdentifier);
  const reminders = (input.reminders || []).filter(item => !item.household_id || item.household_id === householdIdentifier);
  const pool = input.poolContext || null;
  const attentionItems = normalizeAttentionItems([
    ...taskAttention(tasks, householdIdentifier, today), ...calendarAttention(calendar, householdIdentifier, today),
    ...(pool?.attentionItems || []), ...(input.attentionItems || []),
  ], { householdIdentifier, now });
  const availability = {
    calendar: moduleState(input.calendar, input.calendarConfigured !== false), tasks: moduleState(input.tasks), pool: pool ? "available" : "unavailable",
    household: input.household ? "available" : "unavailable", maintenance: moduleState(input.maintenance), birthdays: moduleState(input.birthdays),
    reminders: moduleState(input.reminders), gardening: "not-configured",
  };
  return {
    contract: HOUSEHOLD_CONTEXT_CONTRACT, version: HOUSEHOLD_CONTEXT_VERSION, householdIdentifier, generatedAt: now.toISOString(), requestedDateRange: range, timezone,
    moduleAvailability: availability,
    sourceFreshness: {
      calendar: freshness(input.freshness?.calendar || input.calendarUpdatedAt, now, 24), tasks: freshness(input.freshness?.tasks || input.tasksUpdatedAt, now, 24),
      pool: pool?.sourceFreshness || freshness(pool?.generatedAt, now, 72), household: freshness(input.household?.updated_at, now, 720), maintenance: freshness(input.maintenanceUpdatedAt, now, 168),
    },
    missingOrUnavailableSources: Object.entries(availability).filter(([, state]) => state === "unavailable" || state === "not-configured").map(([source, state]) => ({ source, state })),
    attentionItems,
    calendarSummary: { state: availability.calendar, today: calendar.filter(item => item.date === today), upcoming: calendar.filter(item => inRange(item.date, range.start, range.end) && item.date > today) },
    taskSummary: { state: availability.tasks, open: tasks.filter(item => !item.completed), overdue: tasks.filter(item => !item.completed && item.due_date && dateOnly(item.due_date) < today), dueToday: tasks.filter(item => !item.completed && dateOnly(item.due_date) === today) },
    poolSummary: pool ? { state: "available", ...pool } : { state: "unavailable" },
    maintenanceSummary: { state: availability.maintenance, due: maintenance.filter(item => item.due_date && dateOnly(item.due_date) <= range.end) },
    householdSummary: input.household ? { state: "available", id: input.household.id, name: input.household.name, memberCount: input.memberCount ?? null } : { state: "unavailable" },
    upcomingDatesAndReminders: [...birthdays.map(item => ({ ...item, source: "birthdays" })), ...reminders.map(item => ({ ...item, source: "reminders" }))].filter(item => inRange(item.date || item.due_date, range.start, range.end)).sort((a, b) => dateOnly(a.date || a.due_date).localeCompare(dateOnly(b.date || b.due_date))),
  };
}
