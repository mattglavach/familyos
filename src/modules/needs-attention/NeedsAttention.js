import { useMemo } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { SectionHeader } from "../../components/ui/section-header";
import { useHousehold } from "../../context/HouseholdContext";
import { useTable } from "../../hooks/useTable";
import { createAttentionItem, normalizeAttentionItems } from "../../services/attentionItems";
import { S } from "../../theme";

const DAY=86400000;
const daysFrom=(date,today)=>Math.round((new Date(`${String(date).slice(0,10)}T12:00:00`)-new Date(`${today}T12:00:00`))/DAY);
export function NeedsAttention({ onNavigate, calendarEvents=[] }) {
  const household = useHousehold();
  const tasks = useTable("tasks", "due_date", true);
  const schedule = useTable("pool_schedule", "last_completed");
  const habits = useTable("habits", "created_at", true), completions=useTable("habit_completions","completed_at");
  const today = new Date().toISOString().slice(0, 10);
  const items = useMemo(() => normalizeAttentionItems([
    ...tasks.data.filter(task => !task.completed && task.due_date && task.due_date <= today).map(task => createAttentionItem({ householdIdentifier: household.householdId, sourceModule: "tasks", sourceRecordId: task.id, type: "due", severity: task.due_date < today ? "Critical" : "High", title: task.title, message: task.due_date < today ? "Overdue task" : "Due today", navigationDestination: { tab: "tasks", search: task.title } })),
    ...schedule.data.filter(item => { const due = new Date(`${item.last_completed}T12:00:00`); due.setDate(due.getDate() + Number(item.interval_days)); return due.toISOString().slice(0, 10) <= today; }).map(item => createAttentionItem({ householdIdentifier: household.householdId, sourceModule: "pool", sourceRecordId: item.id, type: "maintenance", severity: "High", title: item.title, message: "Pool maintenance is due", navigationDestination: "pool" })),
    ...habits.data.filter(h=>!h.archived&&h.frequency==="daily"&&!completions.data.some(c=>c.habit_id===h.id&&c.period_key===today&&c.status==="completed")).map(h=>createAttentionItem({householdIdentifier:household.householdId,sourceModule:"habits",sourceRecordId:h.id,type:"missed",severity:h.important?"High":"Medium",title:h.name,message:"Daily habit is still open",relevantDate:today,navigationDestination:"habits"})),
    ...calendarEvents.filter(event=>{const date=event.start?.dateTime||event.start?.date||event.date;const text=`${event.summary||event.title||""} ${event.description||""}`.toLowerCase();return daysFrom(date,today)>=1&&daysFrom(date,today)<=7&&/(birthday|trip|vacation|practice|school|game|flight|camp)/.test(text);}).map(event=>createAttentionItem({householdIdentifier:household.householdId,sourceModule:"calendar",sourceRecordId:event.id,type:"preparation",severity:"Medium",title:`Prepare for ${event.summary||event.title||"event"}`,message:`Starts in ${daysFrom(event.start?.dateTime||event.start?.date||event.date,today)} day(s)`,relevantDate:event.start?.dateTime||event.start?.date||event.date,navigationDestination:{tab:"calendar",eventId:event.id}})),
  ], { householdIdentifier: household.householdId }), [calendarEvents,completions.data,habits.data,household.householdId, schedule.data, tasks.data, today]);
  const groups=useMemo(()=>[{name:"Overdue",items:items.filter(i=>i.type==="due"&&i.relevantDate<today)},{name:"Today",items:items.filter(i=>i.type==="due"&&i.relevantDate===today)},{name:"This Week",items:items.filter(i=>i.sourceModule==="calendar")},{name:"Maintenance",items:items.filter(i=>i.type==="maintenance")},{name:"Habits",items:items.filter(i=>i.sourceModule==="habits")}].filter(g=>g.items.length),[items,today]);
  async function completeTask(item){const task=tasks.data.find(t=>t.id===item.sourceRecordIdentifier);if(task)await tasks.update(task.id,{...task,completed:true,status:"completed",completed_at:new Date().toISOString()});}
  return <main style={S.screen} className="space-y-4">
    <div className="flex items-start justify-between gap-3"><div><h1 className="text-xl font-extrabold">Needs Attention</h1><p className="text-sm text-muted-foreground">One prioritized list of unresolved household work.</p></div><Button type="button" size="xs" variant="secondary" onClick={() => onNavigate("more")}>Modules</Button></div>
    <SectionHeader title="Actionable now" count={items.length} tone="red" />
    {!items.length ? <Card><EmptyStatePanel title="Nothing needs attention" detail="FamilyOS will surface overdue, due-today, missed, and maintenance items here." /></Card> : <div className="space-y-4">{groups.map(group=><section key={group.name}><SectionHeader title={group.name} count={group.items.length}/><div className="space-y-2">{group.items.map(item => <Card key={item.identifier}><CardContent className="flex min-h-16 items-center gap-3 p-3"><AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" /><button type="button" onClick={() => onNavigate(item.navigationDestination)} className="min-w-0 flex-1 text-left"><span className="block text-xs font-bold uppercase text-muted-foreground">{item.sourceModule}</span><span className="block font-bold">{item.title}</span><span className="block text-xs text-muted-foreground">{item.message}</span></button>{item.sourceModule==="tasks"&&<Button size="xs" variant="secondary" onClick={()=>completeTask(item)}>Done</Button>}<ChevronRight className="h-4 w-4" /></CardContent></Card>)}</div></section>)}</div>}
  </main>;
}
