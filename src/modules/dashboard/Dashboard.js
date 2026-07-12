import { useMemo } from "react";
import { CalendarDays, ChevronRight, ListTodo } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton } from "../../components/ui/skeleton";
import { useHousehold } from "../../context/HouseholdContext";
import { buildPoolContext } from "../pool/domainService";
import { buildHouseholdContext } from "../../services/householdContextService";
import { COLORS, S } from "../../theme";
import { formatCalendarEventTime } from "../../lib/calendarTime";

const DAY_MS = 86400000;

function dateLabel(date, today) {
  if (!date) return "No due date";
  const days = Math.round((new Date(`${date}T12:00:00`) - new Date(`${today}T12:00:00`)) / DAY_MS);
  if (days < 0) return `Overdue by ${Math.abs(days)} day${days === -1 ? "" : "s"}`;
  if (days === 0) return "Due Today";
  if (days === 1) return "Due Tomorrow";
  if (days <= 7) return `Due in ${days} days`;
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function priorityRank(task, today) {
  if (task.completed) return 99;
  if (task.due_date) {
    const days = Math.round((new Date(`${task.due_date}T12:00:00`) - new Date(`${today}T12:00:00`)) / DAY_MS);
    if (days < 0) return 0;
    if (days === 0) return 1;
    if (days === 1) return 2;
    if (days <= 7) return 3;
    return 99;
  }
  return task.priority === "high" || task.is_important ? 4 : 99;
}

export function Dashboard({ onNavigate, gc, secureCalendar, deps }) {
  const { TODAY_STR, useTable, getChemRecommendations } = deps;
  const household = useHousehold();
  const tasks = useTable("tasks", "due_date", true);
  const readings = useTable("pool_readings", "logged_at");
  const treatments = useTable("pool_treatments", "logged_at");
  const profiles = useTable("pool_profiles", "created_at");
  const equipment = useTable("pool_equipment", "updated_at");
  const poolMaintenance = useTable("pool_maintenance", "date");
  const poolSchedule = useTable("pool_schedule", "last_completed");
  const homeMaintenance = useTable("home_maintenance", "last_completed");
  const calendar = secureCalendar.connection ? { connected: secureCalendar.connected, events: secureCalendar.events, loading: secureCalendar.loading, updatedAt: secureCalendar.lastFetchedAt } : { connected: Boolean(gc.token), events: gc.events, loading: gc.loading, updatedAt: gc.lastSyncedAt };
  const loading = [tasks, readings, treatments, profiles, equipment, poolMaintenance, poolSchedule, homeMaintenance].some(table => table.loading) || calendar.loading;
  const context = useMemo(() => {
    const recommendations = readings.data[0] ? getChemRecommendations(readings.data[0], readings.data, null) : [];
    const poolContext = buildPoolContext({ householdIdentifier: household.householdId, profile: profiles.data[0] || null, readings: readings.data, treatments: treatments.data, equipment: equipment.data, maintenance: poolMaintenance.data, schedule: poolSchedule.data, tasks: tasks.data, recommendations });
    return buildHouseholdContext({ householdIdentifier: household.householdId, household: household.household, memberCount: household.memberships?.length, timezone: household.householdSettings?.timezone, range: { start: TODAY_STR, end: new Date(Date.now() + 7 * DAY_MS).toISOString().slice(0, 10) }, tasks: tasks.data, calendar: calendar.connected ? calendar.events : null, calendarConfigured: calendar.connected, calendarUpdatedAt: calendar.updatedAt, maintenance: homeMaintenance.data, poolContext });
  }, [TODAY_STR, calendar.connected, calendar.events, calendar.updatedAt, equipment.data, getChemRecommendations, homeMaintenance.data, household.household, household.householdId, household.householdSettings?.timezone, household.memberships?.length, poolMaintenance.data, poolSchedule.data, profiles.data, readings.data, tasks.data, treatments.data]);
  const schedule = [...context.calendarSummary.today, ...context.calendarSummary.upcoming].slice(0, 3);
  const allScheduleCount = context.calendarSummary.today.length + context.calendarSummary.upcoming.length;
  const priorities = [...tasks.data].filter(task => priorityRank(task, TODAY_STR) < 99).sort((a, b) => priorityRank(a, TODAY_STR) - priorityRank(b, TODAY_STR) || String(a.due_date || "9999").localeCompare(String(b.due_date || "9999"))).slice(0, 5);
  const qualifyingPriorityCount = tasks.data.filter(task => priorityRank(task, TODAY_STR) < 99).length;
  const attention = context.attentionItems.filter(item => !["tasks", "calendar", "shopping", "meal-planning"].includes(item.sourceModule)).slice(0, 3);

  if (loading) return <div style={S.screen} className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-32" /><Skeleton className="h-20" /></div>;
  return <div style={S.screen} className="space-y-3 overflow-x-hidden">
    {schedule.length > 0 && <section><SectionHeader title="Upcoming Schedule" count={allScheduleCount} tone="blue" action={allScheduleCount > 3 ? <Button type="button" variant="ghost" size="xs" onClick={() => onNavigate("calendar")}>View All</Button> : null} />
      <Card><CardContent className="px-4 py-1">{schedule.map(event => <button key={event.id || `${event.date}-${event.title}`} type="button" onClick={() => onNavigate({ tab: "calendar", eventId: event.id })} className="flex min-h-11 w-full items-center gap-3 border-b border-border py-1.5 text-left last:border-0"><CalendarDays className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{event.title || event.summary || "Calendar event"}</span><span className="block truncate text-xs text-muted-foreground">{formatCalendarEventTime(event)}{event.location ? ` · ${event.location}` : ""}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /></button>)}</CardContent></Card>
    </section>}

    {priorities.length > 0 && <section><SectionHeader title="Priorities" count={qualifyingPriorityCount} tone="purple" action={qualifyingPriorityCount > 5 ? <Button type="button" variant="ghost" size="xs" onClick={() => onNavigate("tasks")}>View All Tasks</Button> : null} />
      <Card><CardContent className="px-4 py-1">{priorities.map(task => <button key={task.id} type="button" onClick={() => onNavigate({ tab: "tasks", search: task.title || "" })} className="flex min-h-11 w-full items-center gap-3 border-b border-border py-1.5 text-left last:border-0"><ListTodo className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{task.title}</span><span className="text-xs text-muted-foreground">{dateLabel(task.due_date, TODAY_STR)}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /></button>)}</CardContent></Card>
    </section>}

    {attention.length > 0 && <section><SectionHeader title="Needs Attention" count={attention.length} tone={attention.some(item => ["Critical", "High"].includes(item.severity)) ? "red" : "amber"} />
      <Card><CardContent className="px-4 py-1">{attention.map(item => <button key={item.deduplicationKey} type="button" onClick={() => onNavigate(item.navigationDestination)} className="flex min-h-11 w-full items-start gap-3 border-b border-border py-2 text-left last:border-0"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: item.severity === "High" || item.severity === "Critical" ? COLORS.red : COLORS.amber }} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.title}</span><span className="line-clamp-2 text-xs leading-5 text-muted-foreground">{item.message}</span></span><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /></button>)}</CardContent></Card>
    </section>}
  </div>;
}
