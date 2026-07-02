import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, ShieldAlert, TriangleAlert } from "lucide-react";
import { Badge, StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { OriginDrawer } from "../../components/origin/drawer";
import { ChipGroup } from "../../components/ui/segmented-control";
import { useTable } from "../../hooks/useTable";

const STORAGE_KEY = "familyos_notification_read_ids_v1";
const NOTIFICATION_VIEWS = [
  { value: "unread", label: "Unread" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "archive", label: "Archive" },
];

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

function buildNotifications(tasks, calendarEvents, household, calendar) {
  const notifications = [];
  tasks.forEach(task => {
    if (task.completed) return;
    const days = daysUntil(task.due_date);
    if (days !== null && days < 0) {
      notifications.push({ id: `task-overdue-${task.id}`, kind: "task", tone: "urgent", title: task.title || "Task overdue", detail: `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`, nav: "tasks" });
    } else if (days === 0 || task.is_important) {
      notifications.push({ id: `task-due-${task.id}`, kind: "task", tone: task.is_important ? "important" : "warning", title: task.title || "Task due", detail: days === 0 ? "Due today" : "Marked important", nav: "tasks" });
    }
  });
  (calendarEvents || []).filter(event => daysUntil(event.date) === 0).slice(0, 5).forEach(event => {
    notifications.push({ id: `event-today-${event.id || event.title}`, kind: "calendar", tone: "info", title: event.title || "Calendar event", detail: `${event.time || "All day"} today`, nav: "calendar" });
  });
  if (calendar.error) {
    notifications.push({ id: "calendar-error", kind: "calendar", tone: "warning", title: "Calendar needs attention", detail: calendar.error, nav: "calendar" });
  } else if (!calendar.connected) {
    notifications.push({ id: "calendar-disconnected", kind: "calendar", tone: "neutral", title: "Calendar is disconnected", detail: "Connect Google Calendar in Settings.", nav: "settings" });
  }
  if (household.error) {
    notifications.push({ id: "household-error", kind: "security", tone: "warning", title: "Household context issue", detail: household.error, nav: "settings" });
  }
  if (!notifications.length) {
    notifications.push({ id: "all-clear", kind: "success", tone: "success", title: "All clear", detail: "No urgent household notifications right now.", nav: "home" });
  }
  return notifications.slice(0, 20);
}

export function NotificationCenter({ open, onOpenChange, calendarEvents, household, calendar, onNavigate, onUnreadChange }) {
  const taskTable = useTable("tasks", "due_date", true);
  const [readIds, setReadIds] = useState(() => readStoredIds());
  const [view, setView] = useState("unread");
  const notifications = useMemo(
    () => buildNotifications(taskTable.data, calendarEvents, household, calendar),
    [calendar, calendarEvents, household, taskTable.data]
  );
  const unreadCount = notifications.filter(item => !readIds.includes(item.id) && item.id !== "all-clear").length;
  const visibleNotifications = notifications.filter(item => {
    const read = readIds.includes(item.id) || item.id === "all-clear";
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

  function markAllRead() {
    store(Array.from(new Set([...readIds, ...notifications.map(item => item.id)])));
  }

  function choose(item) {
    store(Array.from(new Set([...readIds, item.id])));
    onOpenChange(false);
    onNavigate(item.nav);
  }

  return (
    <OriginDrawer open={open} onOpenChange={onOpenChange} title="Notifications" description="In-app household alerts from tasks, calendar, and account state. Push notifications are deferred.">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
            <StatusBadge status={unreadCount ? "warning" : "healthy"}>{unreadCount ? `${unreadCount} unread` : "Caught up"}</StatusBadge>
          </div>
          <Button type="button" variant="secondary" size="xs" onClick={markAllRead}>Mark read</Button>
        </div>
        <ChipGroup value={view} options={NOTIFICATION_VIEWS} ariaLabel="Notification view" onValueChange={setView} />
        {visibleNotifications.length ? (
          <div className="space-y-2">
            {visibleNotifications.map(item => {
              const read = readIds.includes(item.id) || item.id === "all-clear";
              return (
                <button key={item.id} type="button" onClick={() => choose(item)} className={`flex min-h-14 w-full items-start gap-3 rounded-lg border border-border p-3 text-left ${read ? "bg-secondary/25" : "bg-secondary/60"}`}>
                  {iconFor(item.kind)}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-foreground">{item.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
                  </span>
                  <Badge variant={read ? "slate" : "blue"}>{read ? "Read" : "New"}</Badge>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyStatePanel title="No notifications" detail="Task, calendar, and household alerts will appear here." className="py-7" />
        )}
        <Button type="button" variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
      </div>
    </OriginDrawer>
  );
}
