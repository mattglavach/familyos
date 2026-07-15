import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, ClipboardList, Settings2, Sparkles, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { SectionHeader } from "../../components/ui/section-header";
import { Skeleton } from "../../components/ui/skeleton";
import { IconAction } from "../../components/ui/icon-action";
import { useHousehold } from "../../context/HouseholdContext";
import { formatCalendarEventTime } from "../../lib/calendarTime";
import { S } from "../../theme";
import { habitPeriodKey } from "../habits/Habits";
import { generateRecommendations } from "../../services/recommendations/engine";
import { resolveRecommendationLink } from "../../services/recommendations/linkResolver";
import { supabase } from "../../lib/supabase";
import { Select } from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { DASHBOARD_SECTIONS,normalizeDashboardPreferences } from "../../services/dashboardPreferences";

const DAY_MS = 86400000;
const dayDiff = (date, today) => date ? Math.round((new Date(`${date}T12:00:00`) - new Date(`${today}T12:00:00`)) / DAY_MS) : null;
const eventDate = event => String(event.start?.dateTime || event.start?.date || event.date || "").slice(0, 10);

export function briefRecommendationAction(item) {
  const action = String(item?.recommendedAction || "").trim();
  return /^Complete, delegate, or reschedule(?: this overdue task| the overdue work)?\.?$/i.test(action) ? "" : action;
}

export function upcomingEventDateLabel(event, today = new Date().toISOString().slice(0,10)) {
  const date=eventDate(event);
  if(!date)return "Date unavailable";
  const value=new Date(`${date}T12:00:00`),tomorrow=new Date(`${today}T12:00:00`);tomorrow.setDate(tomorrow.getDate()+1);
  const weekday=value.toLocaleDateString("en-US",{weekday:"short"}),calendarDate=value.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  return `${date===tomorrow.toISOString().slice(0,10)?"Tomorrow · ":""}${weekday}, ${calendarDate}`;
}

export function upcomingEventGroupLabel(event, today = new Date().toISOString().slice(0,10)) {
  const date=eventDate(event),difference=dayDiff(date,today);
  if(difference===0)return "Today";
  if(difference===1)return "Tomorrow";
  if(difference!=null&&difference<=6)return new Date(`${date}T12:00:00`).toLocaleDateString("en-US",{weekday:"long"});
  return "Later This Week";
}

export function groupUpcomingEvents(events,today){
  return events.slice(0,3).reduce((groups,event)=>{const label=upcomingEventGroupLabel(event,today);const group=groups.find(item=>item.label===label);if(group)group.events.push(event);else groups.push({label,events:[event]});return groups;},[]);
}

function ActionRow({ icon: Icon, title, detail, onClick, tone = "text-primary" }) {
  return <button type="button" onClick={onClick} className="flex min-h-12 w-full items-center gap-3 border-b border-border py-2 text-left last:border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Icon className={`h-4 w-4 shrink-0 ${tone}`} aria-hidden="true"/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{title}</span><span className="block truncate text-xs text-muted-foreground">{detail}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true"/></button>;
}

export function Dashboard({ onNavigate, gc, secureCalendar, deps }) {
  const { TODAY_STR, useTable } = deps;
  const household = useHousehold();
  const [focusExpanded,setFocusExpanded]=useState(false);
  const defaultLayout=DASHBOARD_SECTIONS;
  const [customizing,setCustomizing]=useState(false);
  const [dashboardPrefs,setDashboardPrefs]=useState(()=>normalizeDashboardPreferences({layout:household.userPreferences?.dashboard_layout,hidden:household.userPreferences?.hidden_sections,pinned:household.userPreferences?.pinned_sections,density:household.userPreferences?.dashboard_density}));
  const [dismissedInsights,setDismissedInsights]=useState(()=>{try{return JSON.parse(localStorage.getItem("familyos_brief_dismissed_v1")||"[]");}catch{return[];}});
  const tasks = useTable("tasks", "due_date", true);
  const readings = useTable("pool_readings", "logged_at");
  const maintenance = useTable("home_maintenance", "last_completed");
  const poolSchedule = useTable("pool_schedule", "last_completed");
  const homeAssets = useTable("home_assets", "next_maintenance", true);
  const financeActions = useTable("finance_action_items", "created_date", false);
  const collegeDeadlines = useTable("college_deadlines", "due_date", true);
  const calendar = secureCalendar.connection ? secureCalendar : gc;
  const events = useMemo(() => calendar.events || [], [calendar.events]);
  const habitTable=useTable("habits","created_at",true),habitCompletions=useTable("habit_completions","completed_at"),habitActions=useTable("habit_actions","display_order",true,{userId:null}),habitActionHistory=useTable("habit_action_history","habit_date",true,{userId:null}),routines=useTable("routines","created_at",true),routineCompletions=useTable("routine_completions","created_at");
  const habits=useMemo(()=>{const active=habitTable.data.filter(h=>!h.archived&&!['paused','archived'].includes(h.status));const completed=active.filter(h=>habitCompletions.data.some(c=>c.habit_id===h.id&&c.period_key===habitPeriodKey(h)&&c.status==="completed")).length;return{completed,total:active.length};},[habitCompletions.data,habitTable.data]);
  const recommendationData=useMemo(()=>({tasks:tasks.data,events,habits:habitTable.data,habitCompletions:habitCompletions.data,habitActions:habitActions.data,habitActionHistory:habitActionHistory.data,poolReadings:readings.data,poolSchedule:poolSchedule.data,maintenance:homeAssets.data,homeAssets:homeAssets.data,gardenReminders:homeAssets.data.filter(item=>item.category==="garden"),routines:routines.data}),[events,habitActionHistory.data,habitActions.data,habitCompletions.data,habitTable.data,homeAssets.data,poolSchedule.data,readings.data,routines.data,tasks.data]);
  const recommendations=useMemo(()=>generateRecommendations(recommendationData,{today:TODAY_STR,dismissedIds:dismissedInsights}),[TODAY_STR,dismissedInsights,recommendationData]);
  function dismissInsight(id){const next=[...new Set([...dismissedInsights,id])];setDismissedInsights(next);localStorage.setItem("familyos_brief_dismissed_v1",JSON.stringify(next));}
  async function saveDashboardPrefs(){await supabase.from("user_preferences").upsert({user_id:household.user.id,default_household_id:household.householdId,dashboard_layout:dashboardPrefs.layout,hidden_sections:dashboardPrefs.hidden,pinned_sections:dashboardPrefs.pinned,dashboard_density:dashboardPrefs.density,updated_at:new Date().toISOString()});await household.refresh();setCustomizing(false);}
  function sectionStyle(id){const order=dashboardPrefs.layout.indexOf(id);return {order:order<0?defaultLayout.indexOf(id):order};}
  function toggleHidden(id){setDashboardPrefs(previous=>({...previous,hidden:previous.hidden.includes(id)?previous.hidden.filter(value=>value!==id):[...previous.hidden,id]}));}
  function togglePinned(id){setDashboardPrefs(previous=>({...previous,pinned:previous.pinned.includes(id)?previous.pinned.filter(value=>value!==id):[...previous.pinned,id],layout:previous.pinned.includes(id)?previous.layout:[id,...previous.layout.filter(value=>value!==id)]}));}
  const data = useMemo(() => {
    const open = tasks.data.filter(task => !task.completed && String(task.status || "").toLowerCase() !== "completed");
    const ranked = [...open].sort((a,b) => Number(Boolean(b.is_important)) - Number(Boolean(a.is_important)) || String(a.due_date || "9999").localeCompare(String(b.due_date || "9999")));
    const overdue = ranked.filter(task => dayDiff(task.due_date, TODAY_STR) < 0);
    const dueToday = ranked.filter(task => dayDiff(task.due_date, TODAY_STR) === 0);
    const todayEvents = events.filter(event => eventDate(event) === TODAY_STR);
    const upcoming = events.filter(event => eventDate(event) >= TODAY_STR).sort((a,b) => eventDate(a).localeCompare(eventDate(b))).slice(0,3);
    const preparation = upcoming.filter(event=>{const days=dayDiff(eventDate(event),TODAY_STR),text=`${event.summary||event.title||""} ${event.description||""}`.toLowerCase();return days>=1&&days<=7&&/(birthday|trip|vacation|travel|practice|school|game|tournament|flight|camp)/.test(text);}).map(event=>({id:`prep-${event.id||eventDate(event)}`,title:`Prepare for ${event.summary||event.title||"event"}`,detail:`In ${dayDiff(eventDate(event),TODAY_STR)} day(s)`,nav:{tab:"calendar",eventId:event.id},icon:CalendarDays}));
    const maintenanceItems = [...maintenance.data.map(item=>({...item,maintenanceArea:"more"})), ...poolSchedule.data.map(item=>({...item,maintenanceArea:"pool"}))].map(item => ({...item, due: item.due_date || (item.last_completed && item.interval_days ? new Date(new Date(`${item.last_completed}T12:00:00`).getTime() + Number(item.interval_days) * DAY_MS).toISOString().slice(0,10) : null)}));
    const maintenanceDue = maintenanceItems.filter(item => item.due && item.due <= TODAY_STR);
    const taskFocus=[...overdue,...dueToday].map(task=>({id:`t-${task.id}`,title:task.title,detail:`${dayDiff(task.due_date,TODAY_STR)<0?"Overdue":"Due"} · ${task.due_date}`,nav:{tab:"tasks",search:task.title},icon:ClipboardList}));
    const attention=[...maintenanceDue.map(item=>({id:`m-${item.id}`,title:item.title||item.maintenance_type,detail:`Maintenance due · ${item.due}`,nav:item.maintenanceArea==="pool"?{tab:"pool",section:"maintenance",maintenanceId:item.id}:{tab:"more",module:"maintenance",maintenanceId:item.id},icon:Settings2})),...preparation];
    const focus=[...taskFocus,...attention].filter((item,index,list)=>list.findIndex(other=>other.id===item.id)===index).slice(0,6);
    return { open, overdue, dueToday, todayEvents, upcoming, maintenanceItems, focus };
  }, [TODAY_STR, events, maintenance.data, poolSchedule.data, tasks.data]);
  if ([tasks, readings, maintenance, poolSchedule,homeAssets,habitTable,habitCompletions,habitActions,habitActionHistory,routines,routineCompletions,financeActions,collegeDeadlines].some(table => table.loading) || calendar.loading) return <div style={S.screen} className="space-y-3"><Skeleton className="h-32"/><Skeleton className="h-28"/><Skeleton className="h-28"/></div>;
  const lastReading = readings.data[0];
  const firstName = String(household.profile?.display_name || "").trim().split(/\s+/)[0];
  const greeting = `Good ${new Date().getHours()<12?"morning":new Date().getHours()<18?"afternoon":"evening"}${firstName?`, ${firstName}`:""}`;
  const completedTasks=tasks.data.filter(task=>task.completed&&String(task.completed_at||task.updated_at||"").slice(0,10)===TODAY_STR).length;
  const upcomingGroups=groupUpcomingEvents(data.upcoming,TODAY_STR);
  const activeRoutines=routines.data.filter(r=>!r.archived&&!['paused','archived'].includes(r.status)),completedRoutines=activeRoutines.filter(r=>routineCompletions.data.some(c=>c.routine_id===r.id&&String(c.completed_at||"").slice(0,10)===TODAY_STR)).length;
  return <main style={S.screen} className={`flex flex-col overflow-x-hidden ${dashboardPrefs.density==="compact"?"gap-2":"gap-4"}`} aria-label="Today dashboard">
    <section style={{order:-2}} aria-labelledby="morning-brief"><Card><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><h1 id="morning-brief" className="text-xl font-extrabold">{greeting}</h1><div className="flex shrink-0 items-center gap-1"><IconAction label="Personalize Home" icon={Settings2} variant={customizing?"secondary":"ghost"} aria-pressed={customizing} onClick={()=>setCustomizing(value=>!value)}/><IconAction label="Open AI Brief" icon={Sparkles} variant="secondary" onClick={()=>onNavigate("ai-workspace")}/>{[["calendar","Open Calendar",CalendarDays],["tasks","Open Tasks",ClipboardList]].map(([tab,label,Icon])=><IconAction key={tab} label={label} icon={Icon} onClick={()=>onNavigate(tab)}/>)}</div></div><div className="mt-4 grid grid-cols-3 gap-2 text-sm"><div><b>{data.todayEvents.length}</b><span className="block text-xs text-muted-foreground">Events today</span></div><div><b>{data.dueToday.length}</b><span className="block text-xs text-muted-foreground">Tasks due</span></div><button type="button" onClick={()=>onNavigate("habits")} className="text-left"><b>{habits.completed} of {habits.total}</b><span className="block text-xs text-muted-foreground">Habits today</span></button></div></CardContent></Card></section>
    {customizing&&<section style={{order:-1}}><Card><CardContent className="space-y-3 p-4"><h2 className="font-extrabold">Dashboard preview and preferences</h2><Label htmlFor="dashboard-order">Section order</Label><Select id="dashboard-order" value={dashboardPrefs.layout.join(",")} onChange={event=>setDashboardPrefs(previous=>({...previous,layout:event.target.value.split(",")}))}><option value="brief,upcoming,status,progress">Brief, Upcoming, Status, Progress</option><option value="upcoming,brief,progress,status">Upcoming, Brief, Progress, Status</option><option value="progress,brief,upcoming,status">Progress, Brief, Upcoming, Status</option></Select><div className="grid grid-cols-2 gap-2">{defaultLayout.map(id=><div key={id} className="rounded border border-border p-2 text-sm capitalize"><label className="flex items-center justify-between gap-2">Show {id}<Switch checked={!dashboardPrefs.hidden.includes(id)} onCheckedChange={()=>toggleHidden(id)}/></label><Button type="button" size="xs" variant={dashboardPrefs.pinned.includes(id)?"default":"ghost"} className="mt-2 w-full" onClick={()=>togglePinned(id)}>{dashboardPrefs.pinned.includes(id)?"Pinned":"Pin first"}</Button></div>)}</div><Select aria-label="Dashboard density" value={dashboardPrefs.density} onChange={event=>setDashboardPrefs(previous=>({...previous,density:event.target.value}))}><option value="comfortable">Comfortable density</option><option value="compact">Compact density</option></Select><div className="flex gap-2"><Button type="button" size="xs" onClick={saveDashboardPrefs}>Save</Button><Button type="button" size="xs" variant="secondary" onClick={()=>setDashboardPrefs({layout:defaultLayout,hidden:[],pinned:[],density:"comfortable"})}>Reset to default</Button></div></CardContent></Card></section>}
    {!dashboardPrefs.hidden.includes("brief")&&<section style={sectionStyle("brief")} aria-labelledby="family-brief"><SectionHeader title="Family Brief" count={recommendations.length} tone="amber"/><div id="family-brief" className="space-y-2">{recommendations.length?recommendations.slice(0,focusExpanded?12:5).map(item=>{const action=briefRecommendationAction(item);return <Card key={item.id} className="border-l-4 border-l-amber-400"><CardContent className="flex items-start gap-1 p-2"><button type="button" className="min-w-0 flex-1 rounded-md px-2 py-2 text-left transition-colors hover:bg-secondary/50 active:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={()=>onNavigate(resolveRecommendationLink(item,recommendationData))} aria-label={`${item.title}${action?`. ${action}`:""}`}><h2 className="text-base font-extrabold leading-tight">{item.title}</h2>{action&&<p className="mt-1.5 text-sm text-muted-foreground">{action}</p>}{item.supportingData.length>0&&<p className="mt-1 text-xs text-muted-foreground">{item.supportingData.join(" · ")}</p>}</button><Button type="button" variant="ghost" size="icon-xs" aria-label={`Dismiss ${item.title}`} onClick={()=>dismissInsight(item.id)}><X className="h-4 w-4"/></Button></CardContent></Card>}):<Card><CardContent className="p-4 text-sm text-muted-foreground">Nothing needs attention right now.</CardContent></Card>}{recommendations.length>5&&<Button type="button" size="xs" variant="ghost" aria-expanded={focusExpanded} onClick={()=>setFocusExpanded(value=>!value)}>{focusExpanded?"Show fewer recommendations":"Show all recommendations"}</Button>}</div></section>}
    {!dashboardPrefs.hidden.includes("upcoming")&&<section style={sectionStyle("upcoming")} aria-label="Upcoming Calendar"><SectionHeader title="Upcoming Calendar" count={data.upcoming.length} tone="blue"/><Card><CardContent className="px-4 py-2">{upcomingGroups.length?upcomingGroups.map(group=><div key={group.label}><h3 className="pt-2 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{group.label}</h3>{group.events.map(event=><ActionRow key={event.id||`${eventDate(event)}-${event.summary}`} icon={CalendarDays} title={event.summary||event.title||"Calendar event"} detail={formatCalendarEventTime(event)} onClick={()=>onNavigate(event.id?{tab:"calendar",eventId:event.id}:{tab:"calendar"})}/>)}</div>):<p className="py-5 text-sm text-muted-foreground">No upcoming calendar events.</p>}<Button type="button" size="xs" variant="link" className="mt-1 px-0" onClick={()=>onNavigate("calendar")}>View Calendar</Button></CardContent></Card></section>}
    {!dashboardPrefs.hidden.includes("status")&&<section style={sectionStyle("status")}><SectionHeader title="Status" tone="blue"/><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{[{label:"Pool",value:lastReading?`FC ${lastReading.free_chlorine??"--"} · pH ${lastReading.ph??"--"}`:"No recent test",nav:"pool"},{label:"Finance",value:financeActions.data.filter(item=>!item.completed).length?`${financeActions.data.filter(item=>!item.completed).length} open action(s)`:"No open actions",nav:"finance"},{label:"College",value:collegeDeadlines.data.filter(item=>!item.completed&&item.due_date>=TODAY_STR).sort((a,b)=>a.due_date.localeCompare(b.due_date))[0]?.due_date?`Next deadline ${collegeDeadlines.data.filter(item=>!item.completed&&item.due_date>=TODAY_STR).sort((a,b)=>a.due_date.localeCompare(b.due_date))[0].due_date}`:"No upcoming deadline",nav:"college"}].map(card=><button type="button" key={card.label} onClick={()=>onNavigate(card.nav)} className="rounded-lg border border-border bg-card p-3 text-left hover:border-primary/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><span className="text-xs font-bold uppercase text-muted-foreground">{card.label}</span><span className="mt-1 block text-sm font-semibold">{card.value}</span></button>)}</div></section>}
    {!dashboardPrefs.hidden.includes("progress")&&<section style={sectionStyle("progress")}><SectionHeader title="Daily Progress" tone="green"/><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Tasks",completedTasks],["Habits",`${habits.completed}/${habits.total}`],["Routines",`${completedRoutines}/${activeRoutines.length}`],["Upcoming Calendar",data.upcoming.length]].map(([label,value])=><div key={label} className="rounded-lg border border-border bg-card p-3"><b>{value}</b><span className="block text-xs text-muted-foreground">{label}</span></div>)}</div></section>}
  </main>;
}
