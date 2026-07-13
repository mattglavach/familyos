import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, ShieldAlert, TriangleAlert, X } from "lucide-react";
import { Badge, StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { OriginDrawer } from "../../components/origin/drawer";
import { ChipGroup } from "../../components/ui/segmented-control";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { useTable } from "../../hooks/useTable";
import { buildPoolContext } from "../pool/domainService";
import { formatCalendarEventTime, normalizeCalendarEvent } from "../../lib/calendarTime";
import { dedupeNotifications, notificationIsEnabled } from "./notificationEngine";
import { briefLabel, dueBriefs } from "../../services/briefScheduling";
import { generateRecommendations } from "../../services/recommendations/engine";

const STORAGE_KEY = "familyos_notification_read_ids_v1";
const NOTIFICATION_VIEWS = [
  { value: "unread", label: "Unread" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "archive", label: "Archive" },
];
const DEFAULT_NOTIFICATION_CATEGORIES={tasks:true,calendar:true,habits:true,routines:true,briefs:true,home:true,pool:true,maintenance:true,garden:true,weather:true,life:true,system:true};

function readStoredIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function daysUntil(date) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const value = String(date);
  const target = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  target.setHours(0, 0, 0, 0);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target - today) / 86400000);
}

function iconFor(kind) {
  if (kind === "calendar") return <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (kind === "security") return <ShieldAlert className="h-4 w-4 text-amber-300" aria-hidden="true" />;
  if (kind === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />;
  return <TriangleAlert className="h-4 w-4 text-amber-300" aria-hidden="true" />;
}

export function buildNotifications(tasks, calendarEvents, household, calendar, poolContext = null, extra = {}) {
  const notifications = [];
  tasks.forEach(task => {
    if (task.completed) return;
    const days = daysUntil(task.due_date);
    if (days !== null && days < 0) {
      notifications.push({ id: `task-overdue-${task.id}`, sourceKey:`task-overdue-${task.id}`, category:"tasks", priority:100, kind: "task", tone: "urgent", title: task.title || "Task overdue", detail: `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`, nav: { tab: "tasks", filter: "overdue", search: task.title || "" }, timestamp:task.due_date });
    } else if (days === 0 || task.is_important) {
      notifications.push({ id: `task-due-${task.id}`, sourceKey:`task-due-${task.id}`, category:"tasks", priority:days===0?90:70, kind: "task", tone: task.is_important ? "important" : "warning", title: task.title || "Task due", detail: days === 0 ? "Due today" : "Upcoming priority", nav: { tab: "tasks", filter: days === 0 ? "today" : "all", search: task.title || "" }, timestamp:task.due_date });
    }
  });
  (calendarEvents || []).filter(event => {
    const days = daysUntil(event.date);
    return days !== null && days >= 0 && days <= 7;
  }).slice(0, 8).forEach(event => {
    const normalized = normalizeCalendarEvent(event);
    const days = daysUntil(normalized.date);
    const timing = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
    notifications.push({ id: `${days === 0 ? "event-today" : "event-upcoming"}-${normalized.id || normalized.title}`, category:"calendar", priority:days===0?80:50, kind: "calendar", tone: "info", title: normalized.title || "Calendar event", detail: `${formatCalendarEventTime(normalized)} ${timing}`, nav: { tab: "calendar", eventId: normalized.id }, timestamp:normalized.start||normalized.date });
  });
  if (calendar.error) {
    notifications.push({ id: "calendar-error", kind: "calendar", tone: "warning", title: "Calendar needs attention", detail: "Open Calendar to reconnect or check status.", nav: "calendar" });
  } else if (!calendar.connected) {
    notifications.push({ id: "calendar-disconnected", kind: "calendar", tone: "neutral", title: "Calendar is disconnected", detail: "Connect Google Calendar from Calendar.", nav: "calendar" });
  }
  if (household.error) {
    notifications.push({ id: "household-error", kind: "security", tone: "warning", title: "Household needs attention", detail: "Open Settings to choose or refresh your household.", nav: "settings" });
  }
  (poolContext?.attentionItems || []).forEach(item => notifications.push({
    id: item.identifier,
    kind: "pool",
    tone: item.severity === "Critical" || item.severity === "High" ? "urgent" : "warning",
    title: item.title,
    detail: item.message,
    nav: item.navigationDestination || "pool",
    category:"pool", priority:item.severity === "Critical" ? 95 : 75,
  }));
  (extra.habits||[]).filter(h=>h.status==="active"&&!h.archived&&h.reminder_time).forEach(h=>notifications.push({id:`habit-risk-${h.id}`,category:"habits",priority:45,kind:"habit",tone:"warning",title:`${h.name} needs a check-in`,detail:`Scheduled target at ${String(h.reminder_time).slice(0,5)}`,nav:"habits"}));
  (extra.routines||[]).filter(r=>!r.archived&&["daily","weekly"].includes(r.recurrence)).forEach(r=>notifications.push({id:`routine-due-${r.id}`,category:"routines",priority:55,kind:"routine",tone:"warning",title:`${r.name} is due`,detail:`Open the ${r.recurrence} checklist`,nav:"routines"}));
  (extra.dueBriefTypes||[]).forEach(type=>notifications.push({id:`brief-due-${type}`,category:"briefs",priority:type==="weekly"?65:60,kind:"brief",tone:"important",title:`${briefLabel(type)} is ready to prepare`,detail:"Open AI Workspace to review current FamilyOS context. Nothing is changed automatically.",nav:{tab:"ai-workspace",briefType:type}}));
  const deduplicated = dedupeNotifications(notifications.map(item=>({...item,sourceKey:item.sourceKey||item.id,timestamp:item.timestamp||new Date().toISOString()})));
  if (!deduplicated.length) {
    deduplicated.push({ id: "all-clear", kind: "success", tone: "success", title: "All clear", detail: "No urgent household notifications right now.", nav: "home" });
  }
  return deduplicated.slice(0, 20);
}

export function NotificationCenter({ open, onOpenChange, calendarEvents, household, calendar, onNavigate, onUnreadChange }) {
  const taskTable = useTable("tasks", "due_date", true);
  const readings = useTable("pool_readings", "logged_at");
  const treatments = useTable("pool_treatments", "logged_at");
  const profiles = useTable("pool_profiles", "created_at");
  const equipment = useTable("pool_equipment", "updated_at");
  const schedule = useTable("pool_schedule", "last_completed");
  const habits=useTable("habits","created_at",true),routines=useTable("routines","created_at",true);
  const habitCompletions=useTable("habit_completions","completed_at"),homeAssets=useTable("home_assets","next_maintenance",true);
  const briefSchedules=useTable("brief_schedules","created_at",true),briefHistory=useTable("brief_generation_history","generated_at");
  const notificationStates=useTable("notification_states","updated_at"),notificationPreferences=useTable("notification_preferences","updated_at");
  const poolContext = useMemo(() => buildPoolContext({ householdIdentifier: household.householdId, profile: profiles.data[0] || null, readings: readings.data, treatments: treatments.data, equipment: equipment.data, schedule: schedule.data, tasks: taskTable.data }), [equipment.data, household.householdId, profiles.data, readings.data, schedule.data, taskTable.data, treatments.data]);
  const [readIds, setReadIds] = useState(() => readStoredIds());
  const [view, setView] = useState("unread");
  const scheduleMap=useMemo(()=>Object.fromEntries(briefSchedules.data.map(item=>[item.brief_type,{enabled:item.enabled,time:String(item.preferred_time).slice(0,5),days:item.active_days||[]}])) ,[briefSchedules.data]);
  const preferences=useMemo(()=>notificationPreferences.data[0]||{},[notificationPreferences.data]);
  const smartNotifications=useMemo(()=>generateRecommendations({tasks:taskTable.data,events:calendarEvents,habits:habits.data,habitCompletions:habitCompletions.data,poolReadings:readings.data,poolSchedule:schedule.data,maintenance:homeAssets.data,gardenReminders:homeAssets.data.filter(item=>item.category==="garden")}).filter(item=>item.severity!=="info").map(item=>({id:`insight-${item.id}`,sourceKey:`insight-${item.id}`,category:item.category,priority:item.priorityScore,kind:item.category,tone:["critical","high"].includes(item.severity)?"urgent":"warning",title:item.title,detail:`${item.recommendedAction} · ${item.rationale}`,nav:item.nav})),[calendarEvents,habitCompletions.data,habits.data,homeAssets.data,readings.data,schedule.data,taskTable.data]);
  const [preferenceDraft,setPreferenceDraft]=useState({enabled_categories:DEFAULT_NOTIFICATION_CATEGORIES,quiet_hours_start:"21:00",quiet_hours_end:"07:00"});
  useEffect(()=>{if(notificationPreferences.data[0])setPreferenceDraft({...notificationPreferences.data[0],enabled_categories:{...DEFAULT_NOTIFICATION_CATEGORIES,...notificationPreferences.data[0].enabled_categories}});},[notificationPreferences.data]);
  const persistedRead=notificationStates.data.filter(s=>s.read_at).map(s=>s.source_key),dismissed=notificationStates.data.filter(s=>s.dismissed_at).map(s=>s.source_key);
  const notifications = useMemo(() => dedupeNotifications([...buildNotifications(taskTable.data, calendarEvents, household, calendar, poolContext,{habits:habits.data,routines:routines.data,dueBriefTypes:dueBriefs(scheduleMap,briefHistory.data)}),...smartNotifications]).filter(item=>notificationIsEnabled(item,preferences)&&!dismissed.includes(item.id)), [briefHistory.data, calendar, calendarEvents, dismissed, habits.data, household, poolContext, preferences, routines.data, scheduleMap, smartNotifications, taskTable.data]);
  const effectiveRead=[...new Set([...readIds,...persistedRead])];
  const unreadCount = notifications.filter(item => !effectiveRead.includes(item.id) && item.id !== "all-clear").length;
  const visibleNotifications = notifications.filter(item => {
    const read = effectiveRead.includes(item.id) || item.id === "all-clear";
    const isToday = /today/i.test(`${item.title} ${item.detail}`);
    if (view === "archive") return read;
    if (view === "today") return !read && isToday;
    if (view === "week") return !read && !isToday;
    return !read;
  });

  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [onUnreadChange, unreadCount]);

  function store(nextIds) {
    setReadIds(nextIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
  }

  async function persistState(item, change){const current=notificationStates.data.find(s=>s.source_key===item.id);const row={source_key:item.id,source_version:"1",...change,updated_at:new Date().toISOString()};if(current)await notificationStates.update(current.id,row);else await notificationStates.insert(row);}
  async function markAllRead() {
    store(Array.from(new Set([...readIds, ...notifications.map(item => item.id)])));
    await Promise.all(notifications.filter(item=>item.id!=="all-clear").map(item=>persistState(item,{read_at:new Date().toISOString()})));
  }

  async function markRead(event, item) {
    event.stopPropagation();
    store(Array.from(new Set([...readIds, item.id])));
    await persistState(item,{read_at:new Date().toISOString()});
  }

  async function dismiss(event,item){event.stopPropagation();await persistState(item,{dismissed_at:new Date().toISOString()});}
  async function savePreferences(){const existing=notificationPreferences.data[0],row={enabled_categories:preferenceDraft.enabled_categories,quiet_hours_start:preferenceDraft.quiet_hours_start,quiet_hours_end:preferenceDraft.quiet_hours_end,updated_at:new Date().toISOString()};if(existing)await notificationPreferences.update(existing.id,row);else await notificationPreferences.insert(row);}

  async function choose(item) {
    store(Array.from(new Set([...readIds, item.id])));
    await persistState(item,{read_at:new Date().toISOString()});
    onOpenChange(false);
    onNavigate(item.nav);
  }

  return (
    <OriginDrawer open={open} onOpenChange={onOpenChange} title="Notifications" description="Household reminders from tasks, calendar, and account status.">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
            <StatusBadge status={unreadCount ? "warning" : "healthy"}>{unreadCount ? `${unreadCount} unread` : "Caught up"}</StatusBadge>
          </div>
          <Button type="button" variant="secondary" size="xs" onClick={markAllRead}>Clear all</Button>
        </div>
        <ChipGroup value={view} options={NOTIFICATION_VIEWS} ariaLabel="Notification view" onValueChange={setView} />
        <details className="rounded-lg border border-border p-3"><summary className="cursor-pointer text-sm font-bold">Notification preferences</summary><div className="mt-3 space-y-3"><div className="grid grid-cols-2 gap-2"><div><Label htmlFor="quiet-start">Quiet hours start</Label><Input id="quiet-start" type="time" value={String(preferenceDraft.quiet_hours_start).slice(0,5)} onChange={e=>setPreferenceDraft(p=>({...p,quiet_hours_start:e.target.value}))}/></div><div><Label htmlFor="quiet-end">Quiet hours end</Label><Input id="quiet-end" type="time" value={String(preferenceDraft.quiet_hours_end).slice(0,5)} onChange={e=>setPreferenceDraft(p=>({...p,quiet_hours_end:e.target.value}))}/></div></div><div className="grid grid-cols-2 gap-2">{Object.keys(DEFAULT_NOTIFICATION_CATEGORIES).map(category=><div key={category} className="flex min-h-11 items-center justify-between gap-2"><Label htmlFor={`notify-${category}`} className="capitalize">{category}</Label><Switch id={`notify-${category}`} checked={preferenceDraft.enabled_categories[category]!==false} onCheckedChange={enabled=>setPreferenceDraft(p=>({...p,enabled_categories:{...p.enabled_categories,[category]:enabled}}))}/></div>)}</div><Button type="button" size="xs" className="w-full" onClick={savePreferences}>Save notification preferences</Button></div></details>
        {visibleNotifications.length ? (
          <div className="space-y-2">
            {visibleNotifications.map(item => {
              const read = effectiveRead.includes(item.id) || item.id === "all-clear";
              return (
                <div key={item.id} role="button" tabIndex={0} onClick={() => choose(item)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(item); } }} className={`flex min-h-14 w-full cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${read ? "bg-secondary/25" : "bg-secondary/60"}`} aria-label={`Open ${item.title}`}>
                  {iconFor(item.kind)}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-foreground">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">{read ? <Badge variant="slate">Read</Badge> : <Button type="button" variant="ghost" size="xs" onClick={event => markRead(event, item)} aria-label={`Mark ${item.title} read`}>Mark read</Button>}{item.id!=="all-clear"&&<Button type="button" variant="ghost" size="icon-xs" onClick={event=>dismiss(event,item)} aria-label={`Dismiss ${item.title}`}><X className="h-4 w-4"/></Button>}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyStatePanel title="You're all caught up" detail="New household reminders will appear here." className="py-7" />
        )}
        <Button type="button" variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
      </div>
    </OriginDrawer>
  );
}
