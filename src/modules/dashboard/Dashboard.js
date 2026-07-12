import { useMemo } from "react";
import { Bot, CalendarDays, ChevronRight, House, Landmark, ListChecks, ListTodo, Waves } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton } from "../../components/ui/skeleton";
import { useHousehold } from "../../context/HouseholdContext";
import { buildPoolContext } from "../pool/domainService";
import { buildHouseholdContext } from "../../services/householdContextService";
import { S } from "../../theme";
import { formatCalendarEventTime } from "../../lib/calendarTime";
import { useGreetingWeather } from "../../services/weatherService";
import { readAiSettings, readPromptTraces } from "../../services/aiPreferences";

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
  const { TODAY_STR, useTable, getChemRecommendations, formatMoneyShort } = deps;
  const household = useHousehold();
  const tasks = useTable("tasks", "due_date", true);
  const lifeLists = useTable("life_lists", "updated_at");
  const lifeItems = useTable("life_list_items", "updated_at");
  const readings = useTable("pool_readings", "logged_at");
  const treatments = useTable("pool_treatments", "logged_at");
  const profiles = useTable("pool_profiles", "created_at");
  const equipment = useTable("pool_equipment", "updated_at");
  const poolMaintenance = useTable("pool_maintenance", "date");
  const poolSchedule = useTable("pool_schedule", "last_completed");
  const homeMaintenance = useTable("home_maintenance", "last_completed");
  const retirementAccounts = useTable("retirement_accounts", "name", true);
  const retirementAssumptions = useTable("retirement_assumptions", "id", true);
  const mortgage = useTable("mortgage", "id", true);
  const calendar = secureCalendar.connection ? { connected: secureCalendar.connected, events: secureCalendar.events, loading: secureCalendar.loading, updatedAt: secureCalendar.lastFetchedAt } : { connected: Boolean(gc.token), events: gc.events, loading: gc.loading, updatedAt: gc.lastSyncedAt };
  const loading = [tasks, lifeLists, lifeItems, readings, treatments, profiles, equipment, poolMaintenance, poolSchedule, homeMaintenance, retirementAccounts, retirementAssumptions, mortgage].some(table => table.loading) || calendar.loading;
  const weather=useGreetingWeather(household.householdSettings);
  const aiSettings=readAiSettings(); const lastPrompt=readPromptTraces()[0];
  const context = useMemo(() => {
    const recommendations = readings.data[0] ? getChemRecommendations(readings.data[0], readings.data, null) : [];
    const poolContext = buildPoolContext({ householdIdentifier: household.householdId, profile: profiles.data[0] || null, readings: readings.data, treatments: treatments.data, equipment: equipment.data, maintenance: poolMaintenance.data, schedule: poolSchedule.data, tasks: tasks.data, recommendations });
    return buildHouseholdContext({ householdIdentifier: household.householdId, household: household.household, memberCount: household.memberships?.length, timezone: household.householdSettings?.timezone, range: { start: TODAY_STR, end: new Date(Date.now() + 7 * DAY_MS).toISOString().slice(0, 10) }, tasks: tasks.data, calendar: calendar.connected ? calendar.events : null, calendarConfigured: calendar.connected, calendarUpdatedAt: calendar.updatedAt, maintenance: homeMaintenance.data, poolContext });
  }, [TODAY_STR, calendar.connected, calendar.events, calendar.updatedAt, equipment.data, getChemRecommendations, homeMaintenance.data, household.household, household.householdId, household.householdSettings?.timezone, household.memberships?.length, poolMaintenance.data, poolSchedule.data, profiles.data, readings.data, tasks.data, treatments.data]);
  const schedule = [...context.calendarSummary.today, ...context.calendarSummary.upcoming].slice(0, 3);
  const allScheduleCount = context.calendarSummary.today.length + context.calendarSummary.upcoming.length;
  const priorities = [...tasks.data].filter(task => priorityRank(task, TODAY_STR) < 99).sort((a, b) => priorityRank(a, TODAY_STR) - priorityRank(b, TODAY_STR) || String(a.due_date || "9999").localeCompare(String(b.due_date || "9999"))).slice(0, 5);
  const qualifyingPriorityCount = tasks.data.filter(task => priorityRank(task, TODAY_STR) < 99).length;
  const contextualAttention = context.attentionItems.filter(item => !["tasks", "calendar", "shopping", "meal-planning"].includes(item.sourceModule));
  const attentionItems = [
    ...priorities.map(task => ({ key: `task-${task.id}`, title: task.title, detail: dateLabel(task.due_date, TODAY_STR), tab: { tab: "tasks", search: task.title || "" }, severity: priorityRank(task, TODAY_STR) === 0 ? "High" : "Medium", icon: ListTodo })),
    ...contextualAttention.map(item => ({ key: item.deduplicationKey, title: item.title, detail: item.message, tab: item.navigationDestination, severity: item.severity, icon: null })),
  ].slice(0, 5);
  const firstName = String(household.profile?.full_name || household.profile?.name || "").trim().split(/\s+/)[0];
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";
  const summaryParts = [];
  if (context.calendarSummary.today.length) summaryParts.push(`${context.calendarSummary.today.length} event${context.calendarSummary.today.length === 1 ? "" : "s"} today`);
  if (qualifyingPriorityCount) summaryParts.push(`${qualifyingPriorityCount} task${qualifyingPriorityCount === 1 ? "" : "s"} due or overdue`);
  if (context.poolSummary?.chemistryStatus?.warnings?.length) summaryParts.push("pool needs review");
  const dailySummary = summaryParts.length ? summaryParts.join(" · ") : "No urgent household items today.";
  const familySnapshot = useMemo(() => {
    const rows = [];
    const taskAttention=attentionItems.filter(item=>item.tab?.tab==="tasks").slice(0,2);
    if (allScheduleCount > schedule.length) rows.push({ label: "Calendar", detail: `${allScheduleCount - schedule.length} more upcoming event${allScheduleCount - schedule.length === 1 ? "" : "s"}`, tab: "calendar", icon: CalendarDays });
    const openTaskCount = tasks.data.filter(task => !task.completed && String(task.status || "").toLowerCase() !== "completed").length;
    if (openTaskCount) rows.push({ label: "Tasks", detail: `${openTaskCount} open · ${qualifyingPriorityCount} need attention`, details:taskAttention.map(item=>item.title), tab: "tasks", icon: ListTodo });
    const activeLists=lifeLists.data.filter(list=>!list.archived); const activeItems=lifeItems.data.filter(item=>!item.archived&&!item.completed_at&&!["completed","archived"].includes(String(item.status).toLowerCase()));
    rows.push({label:"Life Lists",detail:activeLists.length?`${activeLists.length} active list${activeLists.length===1?"":"s"} · ${activeItems.length} active item${activeItems.length===1?"":"s"}`:"No active lists",tab:"life-lists",icon:ListChecks});
    if (profiles.data.length || readings.data.length) {
      const freshness = context.poolSummary.testFreshness?.state;
      const warnings = context.poolSummary.chemistryStatus?.warnings?.length || 0;
      const lastTest = readings.data[0]?.date || String(readings.data[0]?.logged_at || "").slice(0, 10);
      const nextStep = warnings ? context.poolSummary.recommendedNextAction?.action || "Review pool guidance" : freshness === "stale" ? "Log a new water test" : "No action required";
      const detail = `${warnings ? "Needs attention" : freshness === "stale" ? "Test due" : "On track"} · ${nextStep}${lastTest ? ` · tested ${new Date(`${lastTest}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}`;
      rows.push({ label: "Pool", detail, tab: "pool", icon: Waves });
    }
    if (retirementAccounts.data.length || retirementAssumptions.data.length) {
      const balance = retirementAccounts.data.reduce((sum, account) => sum + Number(account.balance || 0), 0);
      const age = retirementAssumptions.data[0]?.retirement_age;
      const detail = balance > 0 ? `${formatMoneyShort(balance)} saved${age ? ` · target age ${age}` : ""}` : age ? `Target retirement age ${age}` : "Retirement plan available";
      rows.push({ label: "Retirement", detail, tab: "finance", icon: Landmark });
    }
    const mortgageRecord = mortgage.data[0];
    const dueMaintenance = homeMaintenance.data.filter(item => item.due_date && item.due_date <= TODAY_STR).length;
    if (mortgageRecord || homeMaintenance.data.length) {
      const equity = mortgageRecord ? Number(mortgageRecord.home_value || 0) - Number(mortgageRecord.current_balance || 0) : 0;
      const detail = dueMaintenance ? `${dueMaintenance} maintenance item${dueMaintenance === 1 ? "" : "s"} due` : equity > 0 ? `${formatMoneyShort(equity)} home equity` : "Home records are current";
      rows.push({ label: "Home", detail, tab: "finance", icon: House });
    }
    return rows;
  }, [TODAY_STR, allScheduleCount, attentionItems, context.poolSummary, formatMoneyShort, homeMaintenance.data, lifeItems.data, lifeLists.data, mortgage.data, profiles.data.length, qualifyingPriorityCount, readings.data, retirementAccounts.data, retirementAssumptions.data, schedule.length, tasks.data]);

  if (loading) return <div style={S.screen} className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-32" /><Skeleton className="h-20" /></div>;
  return <div style={S.screen} className="space-y-3 overflow-x-hidden">
    <Card><CardContent className="px-4 py-3">
      <div className="text-lg font-extrabold text-foreground">{greeting}{firstName ? `, ${firstName}` : ""}</div>
      <div className="mt-0.5 text-xs font-semibold text-muted-foreground">{new Date(`${TODAY_STR}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
      {weather&&<div className="mt-1 text-sm font-semibold text-foreground">{weather.temperature}° · {weather.condition} · High {weather.high}° / Low {weather.low}°{weather.note?` · ${weather.note}`:""}</div>}
      <div className="mt-2 text-sm leading-5 text-foreground">{dailySummary}</div>
    </CardContent></Card>
    {aiSettings.enabled&&<Card><CardContent className="flex items-center gap-3 p-4"><Bot className="h-5 w-5 text-primary"/><div className="min-w-0 flex-1"><div className="text-sm font-bold">AI Brief</div><div className="truncate text-xs text-muted-foreground">{lastPrompt?`Last prompt: ${lastPrompt.question}`:"Try: What needs attention this week?"}</div></div><Button type="button" size="xs" variant="secondary" onClick={()=>onNavigate("ai-workspace")}>Open AI Workspace</Button></CardContent></Card>}

    {schedule.length > 0 && <section><SectionHeader title="Today's Schedule" count={allScheduleCount} tone="blue" action={allScheduleCount > 3 ? <Button type="button" variant="ghost" size="xs" onClick={() => onNavigate("calendar")}>View All</Button> : null} />
      <Card><CardContent className="px-4 py-1">{schedule.map(event => <button key={event.id || `${event.date}-${event.title}`} type="button" onClick={() => onNavigate({ tab: "calendar", eventId: event.id })} className="flex min-h-11 w-full items-center gap-3 border-b border-border py-1.5 text-left last:border-0"><CalendarDays className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{event.title || event.summary || "Calendar event"}</span><span className="block truncate text-xs text-muted-foreground">{formatCalendarEventTime(event)}{event.location ? ` · ${event.location}` : ""}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /></button>)}</CardContent></Card>
    </section>}

    {familySnapshot.length > 0 && <section><SectionHeader title="Family Snapshot" tone="neutral" />
      <Card><CardContent className="px-4 py-1">{familySnapshot.map(row => { const Icon = row.icon; return <div key={row.label} className="border-b border-border py-1.5 last:border-0"><button type="button" onClick={() => onNavigate(row.tab)} className="flex min-h-11 w-full items-center gap-3 text-left"><Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{row.label}</span><span className="block truncate text-xs text-muted-foreground">{row.detail}</span>{row.details?.slice(0,2).map(detail=><span key={detail} className="mt-0.5 block truncate text-xs text-amber-300">• {detail}</span>)}</span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /></button></div>; })}</CardContent></Card>
    </section>}
  </div>;
}
