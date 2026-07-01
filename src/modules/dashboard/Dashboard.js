import { useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  GraduationCap,
  ListTodo,
  NotebookText,
  Waves,
} from "lucide-react";
import { Badge, StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton } from "../../components/ui/skeleton";
import { COLORS, MEMBER_COLORS, S } from "../../theme";

const toneByColor = {
  [COLORS.red]: "red",
  [COLORS.amber]: "amber",
  [COLORS.green]: "green",
  [COLORS.blue]: "blue",
  [COLORS.purple]: "purple",
  [COLORS.slate]: "slate",
};

const memberFilters = ["All", "Aubrey", "Blake", "Brayden", "Matt", "Kalee"];
const assignableMembers = ["Aubrey", "Blake", "Brayden", "Matt", "Kalee"];

function toneForColor(color) {
  return toneByColor[color] || "slate";
}

function formatSyncTime(value) {
  if (!value) return "Not synced yet";
  return `Synced ${new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function calendarStatus(gc) {
  if (gc.loading || gc.status === "syncing") return { label: "Syncing", status: "warning", detail: "Refreshing Google Calendar events." };
  if (gc.status === "permission-error") return { label: "Permission needed", status: "warning", detail: gc.error };
  if (gc.status === "expired") return { label: "Reconnect", status: "warning", detail: gc.error };
  if (gc.error) return { label: "Sync failed", status: "failed", detail: gc.error };
  if (!gc.token) return { label: "Disconnected", status: "neutral", detail: "Connect Google Calendar to show your family schedule." };
  if (gc.status === "empty") return { label: "No events", status: "info", detail: `${formatSyncTime(gc.lastSyncedAt)} from ${gc.sourceLabel}.` };
  if (gc.status === "synced") return { label: "Synced", status: "connected", detail: `${formatSyncTime(gc.lastSyncedAt)} from ${gc.sourceLabel}.` };
  if (gc.status === "connecting" || gc.status === "script-loading") return { label: "Connecting", status: "warning", detail: "Opening Google Calendar sign-in." };
  return { label: "Connected", status: "connected", detail: `${formatSyncTime(gc.lastSyncedAt)} from ${gc.sourceLabel}.` };
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

function ActionGroup({ title, count, color, items, showAll, defaultLimit, onNavigate }) {
  const visibleItems = items.slice(0, showAll ? 99 : defaultLimit);
  if (!items.length) return null;
  return (
    <Card className="overflow-hidden" style={{ borderLeft: `3px solid ${color}` }}>
      <CardHeader className="p-4 pb-1">
        <div className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color }}>
          {title} <span className="text-muted-foreground">{count}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        {visibleItems.map((item, index) => (
          <ActionRow
            key={`${title}-${item.text}-${index}`}
            item={item}
            showDivider={index < visibleItems.length - 1}
            onNavigate={onNavigate}
          />
        ))}
        {!showAll && items.length > defaultLimit && (
          <div className="pt-2 text-xs font-medium text-muted-foreground">+{items.length - defaultLimit} more</div>
        )}
      </CardContent>
    </Card>
  );
}

function MemberFilter({ value, active, onSelect }) {
  const color = MEMBER_COLORS[value] || COLORS.blue;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="min-h-8 rounded-full border px-3 text-xs font-semibold"
      style={{
        borderColor: active ? color : COLORS.navyLight,
        background: active ? `${color}26` : "transparent",
        color: active ? color : COLORS.slateLight,
      }}
    >
      {value}
    </button>
  );
}

function ScheduleEvent({ event, reassigning, setReassigning, setOverrides, dateLabel }) {
  const memberColor = MEMBER_COLORS[event.member] || COLORS.slate;
  return (
    <div className="rounded-lg border border-border bg-card p-3" style={{ borderLeft: `3px solid ${memberColor}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{event.title}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {dateLabel ? `${dateLabel} - ` : ""}{event.time || "All day"}{event.location ? ` - ${event.location}` : ""}
          </div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {event.source || "Google Calendar"}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant={toneForColor(memberColor)} className="max-w-20 truncate">{event.member}</Badge>
          <Button type="button" variant="secondary" size="xs" onClick={() => setReassigning(reassigning === event.id ? null : event.id)}>
            Reassign
          </Button>
        </div>
      </div>
      {reassigning === event.id && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {assignableMembers.map(member => (
            <MemberFilter
              key={member}
              value={member}
              active={event.member === member}
              onSelect={() => {
                setOverrides(previous => ({ ...previous, [event.id]: member }));
                setReassigning(null);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SchedulePanel({
  gc,
  filteredEvents,
  visibleDays,
  showFullSchedule,
  setShowFullSchedule,
  filter,
  setFilter,
  reassigning,
  setReassigning,
  setOverrides,
  formatDateFull,
  todayString,
}) {
  const status = calendarStatus(gc);

  if (!gc.token) {
    return (
      <Card style={{ borderLeft: `3px solid ${gc.status === "expired" || gc.error ? COLORS.amber : COLORS.slate}` }}>
        <CardContent className="space-y-3 pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 gap-3">
              <CalendarX className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-foreground">Calendar disconnected</div>
                  <StatusBadge status={status.status}>{status.label}</StatusBadge>
                </div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">{status.detail}</div>
              </div>
            </div>
            <Button type="button" size="sm" onClick={gc.signIn} loading={gc.status === "connecting" || gc.status === "script-loading"}>Connect</Button>
          </div>
          {gc.error && (
            <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-xs leading-5 text-destructive">
              {gc.error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const visibleEvents = filteredEvents.filter(event => visibleDays.includes(event.date));
  const todayEvents = visibleEvents.filter(event => event.date === todayString);
  const upcomingEvents = visibleEvents.filter(event => event.date !== todayString);

  return (
    <Card style={{ borderLeft: `3px solid ${status.status === "failed" || status.status === "warning" ? COLORS.amber : COLORS.blue}` }}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              Schedule
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={status.status}>{status.label}</StatusBadge>
              <span className="text-xs text-muted-foreground">{status.detail}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="secondary" size="icon-xs" aria-label="Refresh calendar" onClick={gc.refresh} loading={gc.loading}>
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="secondary" size="xs" onClick={() => setShowFullSchedule(value => !value)}>
              {showFullSchedule ? "7 days" : "30 days"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {memberFilters.map(member => (
            <MemberFilter key={member} value={member} active={filter === member} onSelect={setFilter} />
          ))}
        </div>
        {gc.error && (
          <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-xs leading-5 text-destructive">
            {gc.error}
          </div>
        )}
        {gc.loading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3.5 w-3/5" />
          </div>
        ) : visibleEvents.length === 0 ? (
          <EmptyStatePanel
            title={showFullSchedule ? "No events in the next 30 days" : "No events this week"}
            detail="Calendar events will appear here after the next sync."
            className="py-8"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-secondary/45 p-3">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-primary">Today</div>
                <div className="mt-1 text-lg font-extrabold text-foreground">{todayEvents.length}</div>
              </div>
              <div className="rounded-lg border border-border bg-secondary/45 p-3">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Upcoming</div>
                <div className="mt-1 text-lg font-extrabold text-foreground">{upcomingEvents.length}</div>
              </div>
            </div>
            {todayEvents.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-primary">Today's Events</div>
                {todayEvents.map(event => (
                  <ScheduleEvent
                    key={event.id}
                    event={event}
                    reassigning={reassigning}
                    setReassigning={setReassigning}
                    setOverrides={setOverrides}
                  />
                ))}
              </div>
            )}
            {upcomingEvents.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Upcoming Events</div>
                {visibleDays.map(day => {
                  if (day === todayString) return null;
                  const eventsForDay = filteredEvents.filter(event => event.date === day);
                  if (!eventsForDay.length) return null;
                  return (
                    <div key={day} className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground">{formatDateFull(day)}</div>
                      {eventsForDay.map(event => (
                        <ScheduleEvent
                          key={event.id}
                          event={event}
                          reassigning={reassigning}
                          setReassigning={setReassigning}
                          setOverrides={setOverrides}
                          dateLabel={formatDateFull(day)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// - DASHBOARD -
export function Dashboard({ onNavigate, gc, deps }) {
  const {
    TODAY_DATE, TODAY_STR, daysAgo, daysBetween, nextDueDate, formatDate, formatDateFull,
    formatMoneyShort, maintStatus, useTable, calcRetirementProjection, getChemRecommendations,
  } = deps;

  const homeMaint = useTable("home_maintenance", "title", true);
  const deadlines = useTable("college_deadlines", "due_date", true);
  const readings = useTable("pool_readings", "logged_at");
  const assumptions = useTable("retirement_assumptions", "id", true);
  const accounts = useTable("retirement_accounts", "name", true);
  const notes = useTable("notes", "created_at");
  const taskData = useTable("tasks", "due_date", true);
  const treatments = useTable("pool_treatments", "logged_at");

  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [filter, setFilter] = useState("All");
  const [overrides, setOverrides] = useState({});
  const [reassigning, setReassigning] = useState(null);

  const isLoading = [
    homeMaint,
    deadlines,
    readings,
    assumptions,
    accounts,
    notes,
    taskData,
    treatments,
  ].some(table => table.loading);

  const assump = assumptions.data[0];
  const retProj = assump ? calcRetirementProjection(accounts.data, assump) : null;
  const lastReading = readings.data[0];
  const chemRecs = lastReading ? getChemRecommendations(lastReading, readings.data, null) : [];
  const highChemRecs = chemRecs.filter(rec => rec.priority === "high");
  const medChemRecs = chemRecs.filter(rec => rec.priority === "med");
  const poolDaysAgo = lastReading ? daysAgo(lastReading.date) : null;
  const poolStale = poolDaysAgo !== null && poolDaysAgo >= 3;

  const overdueHomeMaint = homeMaint.data.filter(item => maintStatus(item) === "overdue");
  const dueSoonHomeMaint = homeMaint.data.filter(item => maintStatus(item) === "due-soon");
  const urgentDeadlines = deadlines.data.filter(deadline => !deadline.completed && daysBetween(deadline.due_date) <= 14);
  const upcomingDeadlines = deadlines.data.filter(deadline => !deadline.completed && daysBetween(deadline.due_date) > 14 && daysBetween(deadline.due_date) <= 60);
  const urgentTasks = taskData.data.filter(task => {
    if (task.completed && !task.recurring_interval_days) return false;
    if (task.is_important) return true;
    if (task.due_date && daysBetween(task.due_date) <= 0) return true;
    return false;
  });

  const allEvents = useMemo(
    () => (gc.token ? gc.events : []).map(event => ({ ...event, member: overrides[event.id] || event.member })),
    [gc.events, gc.token, overrides]
  );
  const filteredEvents = allEvents.filter(event => filter === "All" || event.member === filter);
  const next7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(TODAY_DATE);
    date.setDate(date.getDate() + index);
    return date.toISOString().split("T")[0];
  });
  const next30Days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(TODAY_DATE);
    date.setDate(date.getDate() + index);
    return date.toISOString().split("T")[0];
  });
  const visibleDays = showFullSchedule ? next30Days : next7Days;

  const overdue = [];
  const thisWeek = [];
  const upcoming = [];

  if (poolStale) overdue.push({ text: `Pool not tested in ${poolDaysAgo} days`, color: COLORS.amber, nav: "pool", detail: "Log a reading" });
  highChemRecs.forEach(rec => overdue.push({ text: rec.action, color: COLORS.red, nav: "pool", detail: null }));
  medChemRecs.slice(0, 2).forEach(rec => thisWeek.push({ text: rec.action, color: COLORS.amber, nav: "pool", detail: null }));
  overdueHomeMaint.forEach(item => {
    const days = -daysBetween(nextDueDate(item.last_completed, item.interval_days));
    overdue.push({ text: item.title, color: COLORS.red, nav: "tasks", detail: `${days}d overdue` });
  });
  dueSoonHomeMaint.forEach(item => {
    const days = daysBetween(nextDueDate(item.last_completed, item.interval_days));
    thisWeek.push({ text: item.title, color: COLORS.amber, nav: "tasks", detail: `due in ${days}d` });
  });
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
  upcomingDeadlines.forEach(deadline => {
    upcoming.push({ text: deadline.title, color: COLORS.slate, nav: "college", detail: `in ${daysBetween(deadline.due_date)}d` });
  });
  filteredEvents.filter(event => event.date === TODAY_STR).forEach(event => {
    overdue.push({ text: event.title, color: COLORS.blue, nav: "home", detail: event.time || "Today" });
  });
  filteredEvents.filter(event => next7Days.includes(event.date) && event.date !== TODAY_STR).slice(0, 3).forEach(event => {
    thisWeek.push({
      text: event.title,
      color: MEMBER_COLORS[event.member] || COLORS.slate,
      nav: "home",
      detail: `${event.time || ""} ${formatDate(event.date)}`.trim(),
    });
  });

  const totalActions = overdue.length + thisWeek.length + upcoming.length;
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

  const tasksOverdue = overdueHomeMaint.length + urgentTasks.filter(task => task.due_date && daysBetween(task.due_date) < 0).length;
  const tasksDueSoon = dueSoonHomeMaint.length + urgentTasks.filter(task => task.is_important && (!task.due_date || daysBetween(task.due_date) >= 0)).length;
  const tasksColor = tasksOverdue > 0 ? COLORS.red : tasksDueSoon > 0 ? COLORS.amber : COLORS.green;
  const tasksLabel = tasksOverdue > 0 ? `${tasksOverdue} overdue` : tasksDueSoon > 0 ? `${tasksDueSoon} this week` : "All clear";
  const tasksDetail = tasksOverdue > 0 ? `${overdueHomeMaint[0]?.title || urgentTasks[0]?.title || ""}`.slice(0, 38) : tasksDueSoon > 0 ? "Maintenance due" : "Nothing overdue";

  const finColor = retProj ? retProj.statusColor : COLORS.slate;
  const finLabel = retProj ? retProj.statusLabel.split(" - ")[0].split("--")[0].trim().slice(0, 18) : "No data";
  const finDetail = retProj ? `Age ${assump.retirement_age} - ${retProj.gap > 0 ? `-${formatMoneyShort(retProj.gap)} gap` : `surplus ${formatMoneyShort(-retProj.gap)}`}` : "Add accounts";

  const collegeColor = urgentDeadlines.length > 0 ? COLORS.amber : COLORS.green;
  const collegeLabel = urgentDeadlines.length > 0 ? `${urgentDeadlines.length} deadline${urgentDeadlines.length > 1 ? "s" : ""}` : upcomingDeadlines.length > 0 ? "Coming up" : "On track";
  const collegeDetail = urgentDeadlines.length > 0 ? urgentDeadlines[0].title.slice(0, 38) : upcomingDeadlines.length > 0 ? `Next: ${upcomingDeadlines[0].title.slice(0, 32)}` : "No urgent deadlines";

  const modules = [
    { module: "Pool", color: poolColor, label: poolLabel, detail: poolDetail, nav: "pool", icon: Waves },
    { module: "Tasks", color: tasksColor, label: tasksLabel, detail: tasksDetail, nav: "tasks", icon: ListTodo },
    { module: "Finance", color: finColor, label: finLabel, detail: finDetail, nav: "finance", icon: DollarSign },
    { module: "College", color: collegeColor, label: collegeLabel, detail: collegeDetail, nav: "college", icon: GraduationCap },
  ];

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
    ...homeMaint.data.filter(item => item.last_completed && daysAgo(item.last_completed) <= 7).slice(0, 1).map(item => ({ date: item.last_completed, text: item.title, color: COLORS.slate })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  return (
    <div style={S.screen} className="space-y-5">
      <Card className="overflow-hidden" style={{ borderTop: `3px solid ${totalIssues === 0 ? COLORS.green : overdue.length > 0 ? COLORS.red : COLORS.amber}` }}>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">This Week</div>
            <StatusBadge status={totalIssues === 0 ? "healthy" : overdue.length > 0 ? "urgent" : "warning"}>
              {totalIssues === 0 ? "All clear" : overdue.length > 0 ? `${overdue.length} urgent` : `${thisWeek.length} due`}
            </StatusBadge>
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

      <div className="grid grid-cols-2 gap-2.5">
        {modules.map(item => <ModuleCard key={item.module} item={item} onNavigate={onNavigate} />)}
      </div>

      <section>
        <SectionHeader
          title="Action Center"
          count={totalActions}
          tone={overdue.length > 0 ? "red" : thisWeek.length > 0 ? "amber" : "green"}
          action={totalActions > 5 ? (
            <Button type="button" variant="ghost" size="xs" onClick={() => setShowAllActions(value => !value)}>
              {showAllActions ? "Less" : `All ${totalActions}`}
            </Button>
          ) : null}
        />
        {isLoading ? (
          <SectionSkeleton />
        ) : totalActions === 0 ? (
          <Card>
            <EmptyStatePanel
              icon={<CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" aria-hidden="true" />}
              title="Nothing needs attention"
              detail="The dashboard will surface urgent tasks, deadlines, calendar events, and module alerts here."
              className="py-8"
            />
          </Card>
        ) : (
          <div className="space-y-2.5">
            <ActionGroup title="Act Now" count={overdue.length} color={COLORS.red} items={overdue} showAll={showAllActions} defaultLimit={3} onNavigate={onNavigate} />
            <ActionGroup title="This Week" count={thisWeek.length} color={COLORS.amber} items={thisWeek} showAll={showAllActions} defaultLimit={3} onNavigate={onNavigate} />
            {showAllActions && <ActionGroup title="Coming Up" count={upcoming.length} color={COLORS.slate} items={upcoming} showAll defaultLimit={3} onNavigate={onNavigate} />}
          </div>
        )}
      </section>

      <SchedulePanel
        gc={gc}
        filteredEvents={filteredEvents}
        visibleDays={visibleDays}
        showFullSchedule={showFullSchedule}
        setShowFullSchedule={setShowFullSchedule}
        filter={filter}
        setFilter={setFilter}
        reassigning={reassigning}
        setReassigning={setReassigning}
        setOverrides={setOverrides}
        formatDateFull={formatDateFull}
        todayString={TODAY_STR}
      />

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

      <section>
        <SectionHeader
          title="Notes"
          count={notes.data.length}
          tone="neutral"
          action={notes.data.length > 0 ? (
            <Button type="button" variant="ghost" size="xs" onClick={() => setShowNotes(value => !value)}>
              {showNotes ? "Hide" : "Show"}
            </Button>
          ) : null}
        />
        {notes.loading ? (
          <SectionSkeleton rows={2} />
        ) : notes.data.length === 0 ? (
          <Card>
            <EmptyStatePanel
              icon={<NotebookText className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
              title="No notes yet"
              detail="Household notes added from Quick Add will show on the dashboard."
              className="py-8"
            />
          </Card>
        ) : showNotes ? (
          <div className="space-y-2.5">
            {notes.data.map(note => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {note.title && <div className="mb-1 truncate text-sm font-bold text-foreground">{note.title}</div>}
                      <div className="text-sm leading-6 text-secondary-foreground">{note.body}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <Badge variant="slate" className="shrink-0">{note.tag || "General"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>

    </div>
  );
}
