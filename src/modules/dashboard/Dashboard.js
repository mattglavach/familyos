import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, ClipboardList, Settings2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton } from "../../components/ui/skeleton";
import { useHousehold } from "../../context/HouseholdContext";
import { formatCalendarEventTime } from "../../lib/calendarTime";
import { S } from "../../theme";
import { habitDateKey, habitSummary, readHabitState } from "../habits/habitStore";

const DAY_MS = 86400000;
const dayDiff = (date, today) => date ? Math.round((new Date(`${date}T12:00:00`) - new Date(`${today}T12:00:00`)) / DAY_MS) : null;
const eventDate = event => String(event.start?.dateTime || event.start?.date || event.date || "").slice(0, 10);

function ActionRow({ icon: Icon, title, detail, onClick, tone = "text-primary" }) {
  return <button type="button" onClick={onClick} className="flex min-h-12 w-full items-center gap-3 border-b border-border py-2 text-left last:border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Icon className={`h-4 w-4 shrink-0 ${tone}`} aria-hidden="true"/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{title}</span><span className="block truncate text-xs text-muted-foreground">{detail}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true"/></button>;
}

export function Dashboard({ onNavigate, gc, secureCalendar, deps }) {
  const { TODAY_STR, useTable } = deps;
  const household = useHousehold();
  const tasks = useTable("tasks", "due_date", true);
  const readings = useTable("pool_readings", "logged_at");
  const maintenance = useTable("home_maintenance", "last_completed");
  const poolSchedule = useTable("pool_schedule", "last_completed");
  const calendar = secureCalendar.connection ? secureCalendar : gc;
  const events = useMemo(() => calendar.events || [], [calendar.events]);
  const userId = household.user?.id;
  const [habits, setHabits] = useState(() => habitSummary(readHabitState(userId), habitDateKey()));
  useEffect(() => { const refresh = () => setHabits(habitSummary(readHabitState(userId), habitDateKey())); refresh(); window.addEventListener("familyos:habits-changed", refresh); return () => window.removeEventListener("familyos:habits-changed", refresh); }, [userId]);
  const data = useMemo(() => {
    const open = tasks.data.filter(task => !task.completed && String(task.status || "").toLowerCase() !== "completed");
    const ranked = [...open].sort((a,b) => Number(Boolean(b.is_important)) - Number(Boolean(a.is_important)) || String(a.due_date || "9999").localeCompare(String(b.due_date || "9999")));
    const overdue = ranked.filter(task => dayDiff(task.due_date, TODAY_STR) < 0);
    const dueToday = ranked.filter(task => dayDiff(task.due_date, TODAY_STR) === 0);
    const todayEvents = events.filter(event => eventDate(event) === TODAY_STR);
    const upcoming = events.filter(event => eventDate(event) >= TODAY_STR).sort((a,b) => eventDate(a).localeCompare(eventDate(b))).slice(0,3);
    const maintenanceItems = [...maintenance.data, ...poolSchedule.data].map(item => ({...item, due: item.due_date || (item.last_completed && item.interval_days ? new Date(new Date(`${item.last_completed}T12:00:00`).getTime() + Number(item.interval_days) * DAY_MS).toISOString().slice(0,10) : null)}));
    const maintenanceDue = maintenanceItems.filter(item => item.due && item.due <= TODAY_STR);
    const focus = [...overdue, ...dueToday].slice(0,3);
    const focusIds = new Set(focus.map(item => item.id));
    const needsAttention = [...overdue.filter(task => !focusIds.has(task.id)).map(task => ({id:`t-${task.id}`,title:task.title,detail:`Overdue by ${Math.abs(dayDiff(task.due_date,TODAY_STR))} day(s)`,nav:{tab:"tasks",search:task.title},icon:ClipboardList})), ...maintenanceDue.map(item => ({id:`m-${item.id}`,title:item.title,detail:"Maintenance due",nav:"tasks",icon:Settings2}))].slice(0,5);
    return { open, overdue, dueToday, todayEvents, upcoming, maintenanceItems, focus, needsAttention };
  }, [TODAY_STR, events, maintenance.data, poolSchedule.data, tasks.data]);
  if ([tasks, readings, maintenance, poolSchedule].some(table => table.loading) || calendar.loading) return <div style={S.screen} className="space-y-3"><Skeleton className="h-32"/><Skeleton className="h-28"/><Skeleton className="h-28"/></div>;
  const lastReading = readings.data[0];
  const nextMaintenance = data.maintenanceItems.filter(item => item.due && item.due >= TODAY_STR).sort((a,b) => a.due.localeCompare(b.due))[0];
  const firstName = household.userProfile?.display_name?.split(" ")[0] || household.user?.email?.split("@")[0] || "Family";
  return <main style={S.screen} className="space-y-4 overflow-x-hidden" aria-label="Today dashboard">
    <section aria-labelledby="morning-brief"><Card><CardContent className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 id="morning-brief" className="text-xl font-extrabold">Good {new Date().getHours()<12?"morning":new Date().getHours()<18?"afternoon":"evening"}, {firstName}</h1><p className="text-sm font-semibold text-muted-foreground">{new Date(`${TODAY_STR}T12:00:00`).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p></div><Button type="button" size="xs" variant="secondary" onClick={()=>onNavigate("ai-workspace")}>AI Brief</Button></div><div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><div><b>{data.todayEvents.length}</b><span className="block text-xs text-muted-foreground">Events today</span></div><div><b>{data.dueToday.length}</b><span className="block text-xs text-muted-foreground">Tasks due</span></div><div><b>{lastReading ? `FC ${lastReading.free_chlorine ?? "--"} · pH ${lastReading.ph ?? "--"}` : "No test"}</b><span className="block text-xs text-muted-foreground">Pool status</span></div><button type="button" onClick={()=>onNavigate("habits")} className="text-left"><b>{habits.completed} of {habits.total}</b><span className="block text-xs text-muted-foreground">Habits today</span></button></div></CardContent></Card></section>
    <section><SectionHeader title="Today's Focus" count={data.focus.length} tone="amber"/><Card><CardContent className="px-4 py-0">{data.focus.length ? data.focus.map(task=><ActionRow key={task.id} icon={ClipboardList} title={task.title} detail={dayDiff(task.due_date,TODAY_STR)<0?"Overdue":"Due today"} tone="text-amber-300" onClick={()=>onNavigate({tab:"tasks",search:task.title})}/>) : <p className="py-5 text-sm text-muted-foreground">You are clear for today.</p>}</CardContent></Card></section>
    {data.needsAttention.length>0&&<section><SectionHeader title="Needs Attention" count={data.needsAttention.length} tone="red"/><Card><CardContent className="px-4 py-0">{data.needsAttention.map(item=><ActionRow key={item.id} icon={item.icon} title={item.title} detail={item.detail} tone="text-destructive" onClick={()=>onNavigate(item.nav)}/>)}</CardContent></Card></section>}
    <section><SectionHeader title="Status" tone="blue"/><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{[{label:"Calendar",value:`Today: ${data.todayEvents.length} events`,nav:"calendar"},{label:"Tasks",value:`${data.dueToday.length} due today`,nav:{tab:"tasks",filter:"today"}},{label:"Pool",value:lastReading?`FC ${lastReading.free_chlorine??"--"} · pH ${lastReading.ph??"--"}`:"No recent test",nav:"pool"},{label:"Habits",value:`${habits.completed}/${habits.total} complete`,nav:"habits"},{label:"Maintenance",value:nextMaintenance?`Next due in ${dayDiff(nextMaintenance.due,TODAY_STR)} days`:"No due items",nav:"tasks"}].map(card=><button type="button" key={card.label} onClick={()=>onNavigate(card.nav)} className="rounded-lg border border-border bg-card p-3 text-left hover:border-primary/60"><span className="text-xs font-bold uppercase text-muted-foreground">{card.label}</span><span className="mt-1 block text-sm font-semibold">{card.value}</span></button>)}</div></section>
    <section><SectionHeader title="Upcoming" count={data.upcoming.length} tone="blue"/><Card><CardContent className="px-4 py-0">{data.upcoming.length?data.upcoming.map(event=><ActionRow key={event.id||`${eventDate(event)}-${event.summary}`} icon={CalendarDays} title={event.summary||event.title||"Calendar event"} detail={formatCalendarEventTime(event)} onClick={()=>onNavigate({tab:"calendar",eventId:event.id})}/>):<p className="py-5 text-sm text-muted-foreground">No upcoming events.</p>}</CardContent></Card></section>
  </main>;
}
