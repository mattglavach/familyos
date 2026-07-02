import { useMemo } from "react";
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  ChevronRight,
  Clock,
  DollarSign,
  GraduationCap,
  ListChecks,
  ListTodo,
  ShoppingCart,
  Waves,
} from "lucide-react";
import { StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton } from "../../components/ui/skeleton";
import { COLORS, MEMBER_COLORS, S } from "../../theme";
import { normalizeCalendarStatus } from "../../lib/calendarStatus";

function formatSyncTime(value) {
  if (!value) return "Not synced yet";
  const syncedAt = new Date(value);
  if (Number.isNaN(syncedAt.getTime())) return "Sync time unavailable";
  return `Synced ${syncedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function calendarStatus(calendar) {
  const normalized = normalizeCalendarStatus(calendar);
  if (normalized.key === "connected" && calendar.status !== "empty") {
    return { label: normalized.label, status: normalized.tone, detail: formatSyncTime(calendar.lastSyncedAt) };
  }
  if (calendar.status === "empty") return { label: "Connected", status: "info", detail: `${formatSyncTime(calendar.lastSyncedAt)}. No events found.` };
  return { label: normalized.label, status: normalized.tone, detail: normalized.detail, actionLabel: normalized.actionLabel, actionTarget: normalized.actionTarget };
}

function getMemberColor(member, fallbackName) {
  return member?.color || MEMBER_COLORS[fallbackName] || COLORS.slate;
}

function SectionSkeleton({ rows = 3 }) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActionRow({ item, showDivider, onNavigate }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.nav)}
      className={`flex min-h-12 w-full items-center gap-3 py-2.5 text-left ${showDivider ? "border-b border-border" : ""}`}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{item.text}</span>
        {item.detail && <span className="mt-0.5 block text-xs font-medium" style={{ color: item.color }}>{item.detail}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

function ModuleCard({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.nav)}
      className="min-h-[132px] rounded-lg border border-border bg-card p-3.5 text-left shadow-soft transition-colors hover:bg-accent"
      style={{ borderLeft: `3px solid ${item.color}` }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {item.module}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="mb-1 text-sm font-extrabold leading-tight" style={{ color: item.color }}>{item.label}</div>
      <div className="line-clamp-2 text-xs leading-5 text-muted-foreground">{item.detail}</div>
    </button>
  );
}

function SchedulePanel({
  calendar,
  events,
  onNavigate,
  todayString,
}) {
  const status = calendarStatus(calendar);

  if (!calendar.connected) {
    const canConnect = calendar.canConnect !== false && typeof calendar.connect === "function";
    return (
      <Card style={{ borderLeft: `3px solid ${calendar.status === "needs_reauth" || calendar.error ? COLORS.amber : COLORS.slate}` }}>
        <CardContent className="space-y-3 pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <CalendarX className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-foreground">Today&apos;s Schedule</div>
                  <StatusBadge status={status.status}>{status.label}</StatusBadge>
                </div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">{status.detail}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => onNavigate("calendar")}>Calendar</Button>
              {canConnect ? (
                <Button type="button" size="sm" onClick={calendar.connect} loading={calendar.loading}>
                  Connect Google Calendar
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={() => onNavigate(status.actionTarget || "settings")}>
                  {status.actionLabel || "Open Calendar Settings"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const todayEvents = events.filter(event => event?.date === todayString).slice(0, 3);

  return (
    <Card style={{ borderLeft: `3px solid ${status.status === "failed" || status.status === "warning" ? COLORS.amber : COLORS.blue}` }}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              Today&apos;s Schedule
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={status.status}>{status.label}</StatusBadge>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="secondary" size="icon-xs" aria-label="Refresh calendar" onClick={calendar.refresh} loading={calendar.loading}>
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="secondary" size="xs" onClick={() => onNavigate("calendar")}>Calendar</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        {calendar.error && (
          <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-xs leading-5 text-destructive">
            {calendar.error}
          </div>
        )}
        {calendar.loading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3.5 w-3/5" />
          </div>
        ) : todayEvents.length === 0 ? (
          <EmptyStatePanel
            title="No events today"
            detail="Open Calendar for the full schedule."
            action="Open Calendar"
            onAction={() => onNavigate("calendar")}
            className="py-7"
          />
        ) : (
          <div className="space-y-2">
            {todayEvents.map(event => (
              <button key={event.id} type="button" onClick={() => onNavigate("calendar")} className="flex min-h-12 w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS.blue }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{event.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{event.time || "All day"}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// - DASHBOARD -
export function Dashboard({ onNavigate, gc, secureCalendar, deps }) {
  const {
    TODAY_DATE, TODAY_STR, daysAgo, daysBetween, formatDate,
    formatMoneyShort, useTable, calcRetirementProjection, getChemRecommendations,
  } = deps;

  const deadlines = useTable("college_deadlines", "due_date", true);
  const readings = useTable("pool_readings", "logged_at");
  const assumptions = useTable("retirement_assumptions", "id", true);
  const accounts = useTable("retirement_accounts", "name", true);
  const taskData = useTable("tasks", "due_date", true);
  const treatments = useTable("pool_treatments", "logged_at");
  const lifeLists = useTable("life_lists", "updated_at");
  const lifeListItems = useTable("life_list_items", "updated_at");
  const shoppingLists = useTable("shopping_lists", "updated_at");
  const shoppingItems = useTable("shopping_items", "updated_at");
  const pantryItems = useTable("pantry_items", "updated_at");

  async function connectSecureCalendar() {
    const result = await secureCalendar.connect();
    if (result?.authorizationUrl) window.location.assign(result.authorizationUrl);
  }

  const hasServerConnection = Boolean(secureCalendar.connection);
  const calendar = hasServerConnection
    ? {
      mode: "secure",
      connected: secureCalendar.connected,
      loading: secureCalendar.loading,
      error: secureCalendar.error,
      status: secureCalendar.status,
      events: secureCalendar.events,
      lastSyncedAt: secureCalendar.connection?.last_sync_at || secureCalendar.lastFetchedAt,
      sourceLabel: "Google Calendar",
      detail: secureCalendar.error || "Connect Google Calendar in Settings to show your family schedule.",
      refresh: secureCalendar.fetchEvents,
      connect: connectSecureCalendar,
      canConnect: !secureCalendar.error,
    }
    : {
      mode: "legacy",
      connected: Boolean(gc.token),
      loading: gc.loading || gc.status === "syncing" || gc.status === "connecting" || gc.status === "script-loading",
      error: gc.error,
      status: gc.status === "synced" ? "connected" : gc.status,
      events: gc.events,
      lastSyncedAt: gc.lastSyncedAt,
      sourceLabel: gc.sourceLabel || "Google Calendar",
      detail: "Connect Google Calendar in Settings to show your family schedule.",
      refresh: gc.refresh,
      connect: gc.signIn,
      canConnect: Boolean(gc.canConnect),
    };

  const isLoading = [
    deadlines,
    readings,
    assumptions,
    accounts,
    taskData,
    treatments,
    lifeLists,
    lifeListItems,
    shoppingLists,
    shoppingItems,
    pantryItems,
  ].some(table => table.loading);

  const assump = assumptions.data[0];
  const retProj = assump ? calcRetirementProjection(accounts.data, assump) : null;
  const lastReading = readings.data[0];
  const chemRecs = lastReading ? getChemRecommendations(lastReading, readings.data, null) : [];
  const highChemRecs = chemRecs.filter(rec => rec.priority === "high");
  const medChemRecs = chemRecs.filter(rec => rec.priority === "med");
  const poolDaysAgo = lastReading ? daysAgo(lastReading.date) : null;
  const poolStale = poolDaysAgo !== null && poolDaysAgo >= 3;

  const urgentDeadlines = deadlines.data.filter(deadline => !deadline.completed && daysBetween(deadline.due_date) <= 14);
  const upcomingDeadlines = deadlines.data.filter(deadline => !deadline.completed && daysBetween(deadline.due_date) > 14 && daysBetween(deadline.due_date) <= 60);
  const urgentTasks = taskData.data.filter(task => {
    if (task.completed && !task.recurring_interval_days) return false;
    if (task.is_important) return true;
    if (task.due_date && daysBetween(task.due_date) <= 0) return true;
    return false;
  });

  const allEvents = useMemo(
    () => (calendar.connected ? calendar.events : [])
      .filter(event => event && typeof event === "object")
      .map((event, index) => {
        const eventId = event.id || `${event.date || "event"}-${index}`;
        return {
          ...event,
          id: eventId,
          title: event.title || "Untitled event",
          member: event.member || "Family",
          source: event.source || calendar.sourceLabel,
        };
      }),
    [calendar.connected, calendar.events, calendar.sourceLabel]
  );
  const next7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(TODAY_DATE);
    date.setDate(date.getDate() + index);
    return date.toISOString().split("T")[0];
  });

  const overdue = [];
  const thisWeek = [];

  if (poolStale) overdue.push({ text: `Pool not tested in ${poolDaysAgo} days`, color: COLORS.amber, nav: "pool", detail: "Log a reading" });
  highChemRecs.forEach(rec => overdue.push({ text: rec.action, color: COLORS.red, nav: "pool", detail: null }));
  medChemRecs.slice(0, 2).forEach(rec => thisWeek.push({ text: rec.action, color: COLORS.amber, nav: "pool", detail: null }));
  urgentTasks.slice(0, 4).forEach(task => {
    const days = task.due_date ? daysBetween(task.due_date) : null;
    const isOverdue = days !== null && days < 0;
    const item = {
      text: task.title,
      color: isOverdue ? COLORS.red : task.is_important ? COLORS.purple : COLORS.amber,
      nav: "tasks",
      detail: isOverdue ? `${-days}d overdue` : days === 0 ? "Today" : task.is_important ? "Important" : days !== null ? `in ${days}d` : null,
    };
    if (isOverdue) overdue.push(item);
    else thisWeek.push(item);
  });
  urgentDeadlines.forEach(deadline => {
    const days = daysBetween(deadline.due_date);
    const item = {
      text: deadline.title,
      color: days <= 4 ? COLORS.red : COLORS.amber,
      nav: "college",
      detail: days === 0 ? "Today" : days < 0 ? `${-days}d overdue` : `in ${days}d`,
    };
    if (days <= 4) overdue.push(item);
    else thisWeek.push(item);
  });
  allEvents.filter(event => event.date === TODAY_STR).forEach(event => {
    overdue.push({ text: event.title, color: COLORS.blue, nav: "calendar", detail: event.time || "Today" });
  });
  allEvents.filter(event => next7Days.includes(event.date) && event.date !== TODAY_STR).slice(0, 3).forEach(event => {
    thisWeek.push({
      text: event.title,
      color: getMemberColor(null, event.member),
      nav: "calendar",
      detail: `${event.time || ""} ${formatDate(event.date)}`.trim(),
    });
  });

  const focusItems = [...overdue, ...thisWeek].slice(0, 5);
  const totalIssues = overdue.length + thisWeek.length;
  const headline = totalIssues === 0
    ? "Nothing needs attention right now."
    : [
      overdue.length > 0 ? `${overdue.length} item${overdue.length > 1 ? "s" : ""} need action now` : null,
      thisWeek.length > 0 ? `${thisWeek.length} due this week` : null,
    ].filter(Boolean).join(", ") + ".";

  const poolColor = highChemRecs.length > 0 ? COLORS.red : medChemRecs.length > 0 ? COLORS.amber : poolStale ? COLORS.amber : COLORS.green;
  const poolLabel = highChemRecs.length > 0 ? "Action needed" : medChemRecs.length > 0 ? "Monitor" : poolStale ? `${poolDaysAgo}d since test` : "Good";
  const poolDetail = highChemRecs.length > 0 ? `${highChemRecs[0].action.slice(0, 38)}...` : lastReading ? `pH ${lastReading.ph || "--"} FC ${lastReading.free_chlorine || "--"} Salt ${lastReading.salt || "--"}` : "No readings yet";

  const tasksOverdue = urgentTasks.filter(task => task.due_date && daysBetween(task.due_date) < 0).length;
  const tasksDueSoon = urgentTasks.filter(task => task.is_important && (!task.due_date || daysBetween(task.due_date) >= 0)).length;
  const tasksColor = tasksOverdue > 0 ? COLORS.red : tasksDueSoon > 0 ? COLORS.amber : COLORS.green;
  const tasksLabel = tasksOverdue > 0 ? `${tasksOverdue} overdue` : tasksDueSoon > 0 ? `${tasksDueSoon} this week` : "All clear";
  const tasksDetail = tasksOverdue > 0 ? `${urgentTasks[0]?.title || ""}`.slice(0, 38) : tasksDueSoon > 0 ? "Important tasks due" : "Nothing overdue";

  const finColor = retProj ? retProj.statusColor : COLORS.slate;
  const finLabel = retProj ? retProj.statusLabel.split(" - ")[0].split("--")[0].trim().slice(0, 18) : "Add accounts";
  const finDetail = retProj ? `Age ${assump.retirement_age} - ${retProj.gap > 0 ? `-${formatMoneyShort(retProj.gap)} gap` : `surplus ${formatMoneyShort(-retProj.gap)}`}` : "Add accounts";

  const collegeColor = urgentDeadlines.length > 0 ? COLORS.amber : COLORS.green;
  const collegeLabel = urgentDeadlines.length > 0 ? `${urgentDeadlines.length} deadline${urgentDeadlines.length > 1 ? "s" : ""}` : upcomingDeadlines.length > 0 ? "Coming up" : "On track";
  const collegeDetail = urgentDeadlines.length > 0 ? urgentDeadlines[0].title.slice(0, 38) : upcomingDeadlines.length > 0 ? `Next: ${upcomingDeadlines[0].title.slice(0, 32)}` : "No urgent deadlines";
  const activeLifeLists = lifeLists.data.filter(list => !list.archived && list.visibility !== "personal");
  const recentLifeItems = lifeListItems.data
    .filter(item => !item.archived && item.status !== "archived")
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
    .slice(0, 4);
  const favoriteLifeLists = activeLifeLists.filter(list => list.favorite).slice(0, 3);
  const lifeListColor = recentLifeItems.length > 0 || favoriteLifeLists.length > 0 ? COLORS.purple : COLORS.slate;
  const lifeListLabel = recentLifeItems.length > 0 ? `${recentLifeItems.length} recent` : favoriteLifeLists.length > 0 ? `${favoriteLifeLists.length} favorite` : "Add lists";
  const lifeListDetail = recentLifeItems[0]?.title || favoriteLifeLists[0]?.name || "Capture family ideas";
  const neededShoppingItems = shoppingItems.data
    .filter(item => !item.purchased && !item.archived)
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
    .slice(0, 4);
  const lowPantryItems = pantryItems.data
    .filter(item => !item.archived && (item.reorder_flag || Number(item.current_quantity || 0) <= Number(item.minimum_quantity || 0)))
    .slice(0, 4);
  const favoriteShoppingLists = shoppingLists.data.filter(list => !list.archived && list.favorite).slice(0, 3);
  const shoppingColor = lowPantryItems.length > 0 ? COLORS.amber : neededShoppingItems.length > 0 ? COLORS.green : COLORS.slate;
  const shoppingLabel = lowPantryItems.length > 0 ? `${lowPantryItems.length} low` : neededShoppingItems.length > 0 ? `${neededShoppingItems.length} needed` : "Add lists";
  const shoppingDetail = lowPantryItems[0]?.name ? `${lowPantryItems[0].name} low` : neededShoppingItems[0]?.name || favoriteShoppingLists[0]?.name || "Plan the next shop";

  const modules = [
    { module: "Pool", color: poolColor, label: poolLabel, detail: poolDetail, nav: "pool", icon: Waves },
    { module: "Tasks", color: tasksColor, label: tasksLabel, detail: tasksDetail, nav: "tasks", icon: ListTodo },
    { module: "Shopping", color: shoppingColor, label: shoppingLabel, detail: shoppingDetail, nav: "shopping", icon: ShoppingCart },
    { module: "Finance", color: finColor, label: finLabel, detail: finDetail, nav: "finance", icon: DollarSign },
    { module: "College", color: collegeColor, label: collegeLabel, detail: collegeDetail, nav: "college", icon: GraduationCap },
    { module: "Life Lists", color: lifeListColor, label: lifeListLabel, detail: lifeListDetail, nav: "life-lists", icon: ListChecks },
  ];
  const dashboardTasks = taskData.data
    .filter(task => !task.completed)
    .sort((a, b) => {
      const aDue = a.due_date ? daysBetween(a.due_date) : 9999;
      const bDue = b.due_date ? daysBetween(b.due_date) : 9999;
      if (!!b.is_important !== !!a.is_important) return b.is_important ? 1 : -1;
      return aDue - bDue;
    })
    .slice(0, 4);

  const recentActivity = [
    ...readings.data.slice(0, 2).map(reading => ({ date: reading.date, text: `Pool reading - pH ${reading.ph || "--"} FC ${reading.free_chlorine || "--"}`, color: COLORS.blue })),
    ...treatments.data.slice(0, 2).map(treatment => {
      const chemicals = [
        treatment.muriatic_acid_oz && `${treatment.muriatic_acid_oz}oz acid`,
        treatment.salt_lbs && `${treatment.salt_lbs}lb salt`,
        treatment.cya_oz && `${treatment.cya_oz}oz CYA`,
      ].filter(Boolean);
      return { date: treatment.date, text: `Treatment - ${chemicals.length > 0 ? chemicals.join(", ") : "maintenance"}`, color: COLORS.green };
    }),
    ...deadlines.data.filter(deadline => deadline.completed).slice(0, 1).map(deadline => ({ date: deadline.due_date, text: `College: ${deadline.title}`, color: COLORS.green })),
    ...neededShoppingItems.slice(0, 2).map(item => ({ date: item.updated_at || item.created_at, text: `Shopping: ${item.name}`, color: COLORS.green })),
    ...recentLifeItems.slice(0, 2).map(item => ({ date: item.updated_at || item.created_at, text: `Life Lists: ${item.title}`, color: COLORS.purple })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
  const lifeListInsight = [
    ...favoriteLifeLists.map(list => ({ text: list.name, color: list.color || COLORS.purple, nav: "life-lists", detail: "Favorite list" })),
    ...recentLifeItems.map(item => ({ text: item.title, color: COLORS.blue, nav: "life-lists", detail: item.status ? item.status.replace(/_/g, " ") : "Recently updated" })),
  ].slice(0, 5);
  const shoppingInsight = [
    ...lowPantryItems.map(item => ({ text: item.name, color: COLORS.amber, nav: "shopping", detail: "Pantry low" })),
    ...neededShoppingItems.map(item => ({ text: item.name, color: item.priority === "high" ? COLORS.red : COLORS.green, nav: "shopping", detail: item.category || "Needed" })),
    ...favoriteShoppingLists.map(list => ({ text: list.name, color: list.color || COLORS.green, nav: "shopping", detail: "Favorite list" })),
  ].slice(0, 5);

  return (
    <div style={S.screen} className="space-y-5">
      <Card className="overflow-hidden" style={{ borderTop: `3px solid ${totalIssues === 0 ? COLORS.green : overdue.length > 0 ? COLORS.red : COLORS.amber}` }}>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Today&apos;s Priorities</div>
            <div className="flex items-center gap-2">
              <StatusBadge status={totalIssues === 0 ? "healthy" : overdue.length > 0 ? "urgent" : "warning"}>
                {totalIssues === 0 ? "All clear" : overdue.length > 0 ? `${overdue.length} urgent` : `${thisWeek.length} due`}
              </StatusBadge>
            </div>
          </div>
          <div className="mb-1 text-2xl font-extrabold leading-tight tracking-normal" style={{ color: totalIssues === 0 ? COLORS.green : overdue.length > 0 ? COLORS.red : COLORS.amber }}>
            {totalIssues === 0 ? "All clear" : overdue.length > 0 ? `${overdue.length} urgent` : `${thisWeek.length} this week`}
          </div>
          <p className="mb-2 text-sm leading-6 text-muted-foreground">{headline}</p>
          {isLoading ? (
            <div className="space-y-3 pt-2">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          ) : focusItems.length > 0 ? (
            <div className="mt-3 border-t border-border">
              {focusItems.map((item, index) => (
                <ActionRow
                  key={`${item.text}-${index}`}
                  item={item}
                  showDivider={index < focusItems.length - 1}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <SchedulePanel
        calendar={calendar}
        events={allEvents}
        onNavigate={onNavigate}
        todayString={TODAY_STR}
      />

      <section>
        <SectionHeader title="My Tasks" count={dashboardTasks.length} tone="purple" action={<Button type="button" variant="ghost" size="xs" onClick={() => onNavigate("tasks")}>View all</Button>} />
        {isLoading ? (
          <SectionSkeleton rows={2} />
        ) : dashboardTasks.length ? (
          <Card>
            <CardContent className="px-4 py-2">
              {dashboardTasks.map((task, index) => {
                const days = task.due_date ? daysBetween(task.due_date) : null;
                return (
                  <ActionRow
                    key={task.id || `${task.title}-${index}`}
                    item={{
                      text: task.title,
                      color: task.is_important ? COLORS.purple : days !== null && days < 0 ? COLORS.red : COLORS.blue,
                      nav: "tasks",
                      detail: days === null ? task.category || "Task" : days < 0 ? `${-days}d overdue` : days === 0 ? "Due today" : `Due in ${days}d`,
                    }}
                    showDivider={index < dashboardTasks.length - 1}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <EmptyStatePanel
              icon={<ListTodo className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
              title="No open tasks"
              detail="Create a household task when something needs follow-up."
              action="Add task"
              onAction={() => onNavigate("quick-add")}
              className="py-8"
            />
          </Card>
        )}
      </section>

      <section>
        <SectionHeader title="Life Lists" count={lifeListInsight.length} tone="purple" action={<Button type="button" variant="ghost" size="xs" onClick={() => onNavigate("life-lists")}>View all</Button>} />
        {isLoading ? (
          <SectionSkeleton rows={2} />
        ) : lifeListInsight.length ? (
          <Card>
            <CardContent className="px-4 py-2">
              {lifeListInsight.map((item, index) => (
                <ActionRow key={`${item.text}-${index}`} item={item} showDivider={index < lifeListInsight.length - 1} onNavigate={onNavigate} />
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <EmptyStatePanel
              icon={<ListChecks className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
              title="No Life Lists yet"
              detail="Create a list for ideas, books, movies, places, gifts, or plans."
              action="Open Life Lists"
              onAction={() => onNavigate("life-lists")}
              className="py-8"
            />
          </Card>
        )}
      </section>

      <section>
        <SectionHeader title="Shopping" count={shoppingInsight.length} tone="green" action={<Button type="button" variant="ghost" size="xs" onClick={() => onNavigate("shopping")}>View all</Button>} />
        {isLoading ? (
          <SectionSkeleton rows={2} />
        ) : shoppingInsight.length ? (
          <Card>
            <CardContent className="px-4 py-2">
              {shoppingInsight.map((item, index) => (
                <ActionRow key={`${item.text}-${index}`} item={item} showDivider={index < shoppingInsight.length - 1} onNavigate={onNavigate} />
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <EmptyStatePanel
              icon={<ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
              title="No shopping items yet"
              detail="Create a list or pantry item when the household needs something."
              action="Open Shopping"
              onAction={() => onNavigate("shopping")}
              className="py-8"
            />
          </Card>
        )}
      </section>

      <section>
        <SectionHeader title="Household Insights" count={modules.length} tone="blue" />
        <div className="grid grid-cols-2 gap-2.5">
          {modules.map(item => <ModuleCard key={item.module} item={item} onNavigate={onNavigate} />)}
        </div>
      </section>

      <section>
        <SectionHeader title="Recent Activity" tone="blue" />
        {isLoading ? (
          <SectionSkeleton rows={2} />
        ) : recentActivity.length > 0 ? (
          <Card>
            <CardContent className="px-4 py-2">
              {recentActivity.map((activity, index) => (
                <div key={`${activity.text}-${index}`} className={`flex min-h-11 items-center gap-3 py-2 ${index < recentActivity.length - 1 ? "border-b border-border" : ""}`}>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: activity.color }} />
                  <div className="min-w-0 flex-1 truncate text-sm text-secondary-foreground">{activity.text}</div>
                  <div className="shrink-0 text-xs text-muted-foreground">{formatDate(activity.date)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <EmptyStatePanel
              icon={<Clock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
              title="No recent activity"
              detail="Completed work and new readings will appear here."
              className="py-8"
            />
          </Card>
        )}
      </section>

    </div>
  );
}
