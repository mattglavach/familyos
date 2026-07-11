import { useMemo } from "react";
import { CalendarDays, ChevronRight, ListTodo, Wrench, Waves } from "lucide-react";
import { StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton } from "../../components/ui/skeleton";
import { useHousehold } from "../../context/HouseholdContext";
import { buildPoolContext } from "../pool/domainService";
import { buildHouseholdContext } from "../../services/householdContextService";
import { COLORS, S } from "../../theme";
import { formatCalendarEventTime } from "../../lib/calendarTime";

const severityTone = { Critical: "urgent", High: "urgent", Medium: "warning", Informational: "info" };
const severityColor = { Critical: COLORS.red, High: COLORS.red, Medium: COLORS.amber, Informational: COLORS.blue };

function AttentionCard({ item, onNavigate }) {
  return <button type="button" onClick={() => onNavigate(item.navigationDestination)} className="flex min-h-12 w-full items-start gap-2.5 border-b border-border py-2 text-left last:border-0">
    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: severityColor[item.severity] }} />
    <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-foreground">{item.title}</span><StatusBadge status={severityTone[item.severity]}>{item.severity}</StatusBadge></span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.message}</span></span>
    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  </button>;
}
function SummaryCard({ icon: Icon, title, value, detail, onClick, color = COLORS.blue }) {
  return <button type="button" onClick={onClick} className="min-h-[88px] rounded-lg border border-border bg-card p-3 text-left shadow-soft" style={{ borderLeft: `3px solid ${color}` }}>
    <span className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"><Icon className="h-4 w-4" />{title}</span><ChevronRight className="h-4 w-4 text-muted-foreground" /></span>
    <span className="mt-2 block text-base font-extrabold" style={{ color }}>{value}</span><span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">{detail}</span>
  </button>;
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
  const calendar = secureCalendar.connection ? { connected: secureCalendar.connected, events: secureCalendar.events, loading: secureCalendar.loading, error: secureCalendar.error, updatedAt: secureCalendar.lastFetchedAt } : { connected: Boolean(gc.token), events: gc.events, loading: gc.loading, error: gc.error, updatedAt: gc.lastSyncedAt };
  const loading = [tasks, readings, treatments, profiles, equipment, poolMaintenance, poolSchedule, homeMaintenance].some(table => table.loading) || calendar.loading;
  const context = useMemo(() => {
    const recommendations = readings.data[0] ? getChemRecommendations(readings.data[0], readings.data, null) : [];
    const poolContext = buildPoolContext({ householdIdentifier: household.householdId, profile: profiles.data[0] || null, readings: readings.data, treatments: treatments.data, equipment: equipment.data, maintenance: poolMaintenance.data, schedule: poolSchedule.data, tasks: tasks.data, recommendations });
    return buildHouseholdContext({ householdIdentifier: household.householdId, household: household.household, memberCount: household.memberships?.length, timezone: household.householdSettings?.timezone, range: { start: TODAY_STR, end: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) }, tasks: tasks.data, calendar: calendar.connected ? calendar.events : null, calendarConfigured: calendar.connected, calendarUpdatedAt: calendar.updatedAt, maintenance: homeMaintenance.data, poolContext });
  }, [TODAY_STR, calendar.connected, calendar.events, calendar.updatedAt, equipment.data, getChemRecommendations, homeMaintenance.data, household.household, household.householdId, household.householdSettings?.timezone, household.memberships?.length, poolMaintenance.data, poolSchedule.data, profiles.data, readings.data, tasks.data, treatments.data]);
  const todayEvents = context.calendarSummary.today;
  const upcomingEvents = context.calendarSummary.upcoming.slice(0, 4);
  const openTasks = context.taskSummary.open.slice(0, 4);
  const pool = context.poolSummary;
  const maintenanceDue = context.maintenanceSummary.due;

  return <div style={S.screen} className="space-y-3.5 overflow-x-hidden">
    <section><SectionHeader title="Attention Needed" count={context.attentionItems.length} tone={context.attentionItems.some(item => ["Critical", "High"].includes(item.severity)) ? "red" : "amber"} />
      <Card><CardContent className="px-4 py-1">{loading ? <div className="space-y-3 py-4"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/5" /></div> : context.attentionItems.length ? context.attentionItems.slice(0, 8).map(item => <AttentionCard key={item.deduplicationKey} item={item} onNavigate={onNavigate} />) : <EmptyStatePanel title="Nothing needs attention today" detail="Tasks, Calendar, Pool, and maintenance are clear based on available data." className="py-8" />}</CardContent></Card>
    </section>

    <section><SectionHeader title="Today" tone="blue" /><div className="grid grid-cols-2 gap-2.5">
      <SummaryCard icon={ListTodo} title="Tasks" value={`${context.taskSummary.dueToday.length} due`} detail={`${context.taskSummary.overdue.length} overdue`} color={context.taskSummary.overdue.length ? COLORS.red : COLORS.purple} onClick={() => onNavigate({ tab: "tasks", filter: "today" })} />
      <SummaryCard icon={CalendarDays} title="Calendar" value={`${todayEvents.length} event${todayEvents.length === 1 ? "" : "s"}`} detail={todayEvents[0]?.title || (calendar.connected ? "No events today" : "Calendar unavailable")} onClick={() => onNavigate("calendar")} />
      <SummaryCard icon={Waves} title="Pool" value={pool.testFreshness?.state || "Unavailable"} detail={pool.attentionItems?.[0]?.title || "Review current Pool status"} color={pool.attentionItems?.length ? COLORS.amber : COLORS.green} onClick={() => onNavigate("pool")} />
      <SummaryCard icon={Wrench} title="Maintenance" value={`${maintenanceDue.length} due`} detail={maintenanceDue[0]?.title || "No household maintenance due"} color={maintenanceDue.length ? COLORS.amber : COLORS.green} onClick={() => onNavigate("more")} />
    </div></section>

    <section><SectionHeader title="Upcoming" count={upcomingEvents.length} tone="blue" />
      <Card><CardContent className="px-4 py-2">{upcomingEvents.length ? upcomingEvents.map(event => <button key={event.id || `${event.date}-${event.title}`} type="button" onClick={() => onNavigate({ tab: "calendar", eventId: event.id })} className="flex min-h-12 w-full items-center gap-3 border-b border-border py-2 text-left last:border-0"><CalendarDays className="h-4 w-4 text-primary" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{event.title || event.summary || "Calendar event"}</span><span className="text-xs text-muted-foreground">{event.date} {formatCalendarEventTime(event)}</span></span></button>) : <EmptyStatePanel title="No upcoming events" detail={calendar.connected ? "The next seven days are open." : "Connect Calendar to include upcoming events."} className="py-7" />}</CardContent></Card>
    </section>

    <section><SectionHeader title="Tasks" count={openTasks.length} tone="purple" action={<Button type="button" variant="ghost" size="xs" onClick={() => onNavigate("tasks")}>View all</Button>} />
      <Card><CardContent className="px-4 py-2">{openTasks.length ? openTasks.map(task => <button key={task.id} type="button" onClick={() => onNavigate({ tab: "tasks", search: task.title || "" })} className="flex min-h-12 w-full items-center gap-3 border-b border-border py-2 text-left last:border-0"><ListTodo className="h-4 w-4 text-primary" /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{task.title}</span><span className="shrink-0 text-xs text-muted-foreground">{task.due_date || "No date"}</span></button>) : <EmptyStatePanel title="No open tasks" detail="Create a task when the household needs follow-up." action="Add task" onAction={() => onNavigate("quick-add")} className="py-7" />}</CardContent></Card>
    </section>

    <section><SectionHeader title="Pool" tone="blue" /><Card><CardContent className="grid gap-3 p-4 sm:grid-cols-3"><div><div className="text-xs font-bold uppercase text-muted-foreground">Test</div><div className="mt-1 text-sm font-bold">{pool.testFreshness?.state || "Unavailable"}</div></div><div><div className="text-xs font-bold uppercase text-muted-foreground">Retests</div><div className="mt-1 text-sm font-bold">{pool.pendingRetests?.length || 0} pending</div></div><div><div className="text-xs font-bold uppercase text-muted-foreground">Data gaps</div><div className="mt-1 text-sm font-bold">{pool.dataCompletenessFlags?.length || 0}</div></div><Button type="button" variant="secondary" className="sm:col-span-3" onClick={() => onNavigate("pool")}>Open Pool Operations</Button></CardContent></Card></section>
  </div>;
}
