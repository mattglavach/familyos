import { useMemo, useState } from "react";
import { Archive, Check, ChevronDown, ChevronUp, Flame, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { SectionHeader } from "../../components/ui/section-header";
import { useTable } from "../../hooks/useTable";
import { S } from "../../theme";
import { habitDateKey } from "./habitStore";
import { completionRate, habitGoalLabel, longestHabitStreak, recentHabitDays } from "./habitAnalytics";

export function habitPeriodKey(habit, date = new Date()) {
  if (habit.habit_type === "checklist" || Number(habit.target_count) > 1) return habitDateKey(date);
  if (habit.frequency === "monthly") return habitDateKey(date).slice(0, 7);
  if (habit.frequency === "weekly") { const monday=new Date(date);monday.setDate(date.getDate()-((date.getDay()+6)%7));return habitDateKey(monday); }
  return habitDateKey(date);
}

export function checklistProgress(habit, actions, history) {
  const active=actions.filter(action=>action.active!==false).sort((a,b)=>a.display_order-b.display_order);
  const completedIds=new Set(history?.completed_action_ids||[]), completed=active.filter(action=>completedIds.has(action.id)).length;
  const target=habit.completion_threshold_mode==="any"?1:habit.completion_threshold_mode==="count"?Math.min(active.length,Math.max(1,Number(habit.completion_threshold_count)||1)):active.length;
  return {active,completed,total:active.length,target,met:active.length>0&&completed>=target,state:completed===0?"Not started":completed>=target?"Completed for today":"In progress"};
}

export function habitStreak(habit, completions, now = new Date()) { let streak=0,cursor=new Date(now);for(let i=0;i<366;i+=1){const key=habitPeriodKey(habit,cursor);if(completions.some(item=>item.habit_id===habit.id&&item.period_key===key&&item.status==="completed"))streak+=1;else break;if(habit.frequency==="monthly")cursor.setMonth(cursor.getMonth()-1);else cursor.setDate(cursor.getDate()-(habit.frequency==="weekly"?7:1));}return streak; }

const FILTERS=["Today","Active","Routines","Needs Completion"];
const MORE_FILTERS=["All Habits","Completed Today","Missed","Paused","Daily","Weekly","Simple Habits","Checklist Habits"];

export function Habits() {
  const habits=useTable("habits","created_at",true),completions=useTable("habit_completions","completed_at"),actions=useTable("habit_actions","display_order",true,{userId:null}),history=useTable("habit_action_history","habit_date",true,{userId:null});
  const [filter,setFilter]=useState("Today"),[expanded,setExpanded]=useState(false);
  const today=habitDateKey();
  const active=useMemo(()=>habits.data.filter(h=>!h.archived&&h.status!=="archived"),[habits.data]);
  const isDone=habit=>habit.habit_type==="checklist"?checklistProgress(habit,actions.data.filter(a=>a.habit_id===habit.id),history.data.find(row=>row.habit_id===habit.id&&row.habit_date===today)).met:completions.data.some(item=>item.habit_id===habit.id&&item.period_key===habitPeriodKey(habit)&&item.status==="completed");
  const visible=active.filter(h=>{switch(filter){case "Routines":case "Checklist Habits":return h.habit_type==="checklist";case "Needs Completion":case "Missed":return !isDone(h);case "Completed Today":return isDone(h);case "Paused":return h.status==="paused";case "Daily":return h.frequency==="daily";case "Weekly":return h.frequency==="weekly";case "Simple Habits":return h.habit_type!=="checklist";default:return true;}});
  const completed=active.filter(isDone).length;

  async function toggleSimple(habit){const current=completions.data.find(item=>item.habit_id===habit.id&&item.period_key===habitPeriodKey(habit));if(current)await completions.remove(current.id);else await completions.insert({habit_id:habit.id,period_key:habitPeriodKey(habit),status:"completed"});window.dispatchEvent(new CustomEvent("familyos:habits-changed"));}
  async function toggleAction(habit,action){const row=history.data.find(item=>item.habit_id===habit.id&&item.habit_date===today),ids=new Set(row?.completed_action_ids||[]);ids.has(action.id)?ids.delete(action.id):ids.add(action.id);const progress=checklistProgress(habit,actions.data.filter(item=>item.habit_id===habit.id),{completed_action_ids:[...ids]});const payload={habit_id:habit.id,habit_date:today,total_active_actions:progress.total,completed_count:progress.completed,threshold_met:progress.met,completed_action_ids:[...ids]};if(row)await history.update(row.id,payload);else await history.insert(payload);const completion=completions.data.find(item=>item.habit_id===habit.id&&item.period_key===today);if(progress.met&&!completion)await completions.insert({habit_id:habit.id,period_key:today,status:"completed"});if(!progress.met&&completion)await completions.remove(completion.id);window.dispatchEvent(new CustomEvent("familyos:habits-changed"));}
  async function archive(habit){await habits.update(habit.id,{...habit,archived:true,status:"archived"});}

  return <main style={S.screen} className="space-y-4 overflow-x-hidden"><div><h1 className="text-xl font-extrabold">Habits</h1><p className="text-sm text-muted-foreground">Simple habits and one-level action checklists with durable daily history.</p></div><Card><CardContent className="grid grid-cols-2 gap-3 p-4"><div><div className="text-2xl font-extrabold">{completed}/{active.length}</div><div className="text-xs text-muted-foreground">Complete today</div></div><div><div className="text-2xl font-extrabold">{active.length?Math.round(completed/active.length*100):0}%</div><div className="text-xs text-muted-foreground">Daily progress</div></div></CardContent></Card>
  <Card><CardContent className="p-2.5"><div className="flex flex-wrap gap-2">{FILTERS.map(label=><Button key={label} type="button" size="xs" variant={filter===label?"default":"secondary"} onClick={()=>setFilter(label)}>{label}</Button>)}<Button type="button" size="xs" variant="ghost" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?<ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>} More Filters</Button></div>{expanded&&<div className="mt-2 flex flex-wrap gap-2 border-t border-border pt-2">{MORE_FILTERS.map(label=><Button key={label} type="button" size="xs" variant={filter===label?"default":"secondary"} onClick={()=>setFilter(label)}>{label}</Button>)}</div>}</CardContent></Card>
  <SectionHeader title="Current habits" count={visible.length} tone="green" />{!visible.length?<Card><EmptyStatePanel title="No matching habits" detail="Create a habit from Quick Add or choose another filter."/></Card>:<div className="grid gap-2 sm:grid-cols-2">{visible.map(habit=>{const checklist=habit.habit_type==="checklist",progress=checklistProgress(habit,actions.data.filter(a=>a.habit_id===habit.id),history.data.find(row=>row.habit_id===habit.id&&row.habit_date===today)),done=isDone(habit),streak=habitStreak(habit,completions.data),longest=longestHabitStreak(habit,completions.data),weekly=completionRate(habit,completions.data,7),monthly=completionRate(habit,completions.data,30),days=recentHabitDays(habit,completions.data);return <Card key={habit.id}><CardContent className="space-y-3 p-3"><div className="flex min-h-14 items-center gap-3">{!checklist&&<button type="button" aria-label={`${done?"Undo":"Complete"} ${habit.name}`} aria-pressed={done} onClick={()=>toggleSimple(habit)} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${done?"border-emerald-400 bg-emerald-500":"border-muted-foreground"}`}>{done?<Check className="h-5 w-5 text-white"/>:<RotateCcw className="h-4 w-4 text-muted-foreground"/>}</button>}<div className="min-w-0 flex-1"><div className="font-bold">{habit.name}</div><div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{checklist?`${progress.state} · ${progress.completed} of ${progress.total}`:habitGoalLabel(habit)}</span><span className="flex items-center gap-1"><Flame className="h-3 w-3 text-amber-300"/>{streak} current · {longest} longest</span></div></div><Button variant="ghost" size="icon-xs" aria-label={`Archive ${habit.name}`} onClick={()=>archive(habit)}><Archive className="h-4 w-4"/></Button></div>{checklist&&<div className="space-y-1">{progress.active.map(action=><label key={action.id} className="flex min-h-10 items-center gap-2 rounded-md border border-border px-3"><Checkbox checked={(history.data.find(row=>row.habit_id===habit.id&&row.habit_date===today)?.completed_action_ids||[]).includes(action.id)} onCheckedChange={()=>toggleAction(habit,action)}/><span className="text-sm">{action.name}</span>{!action.required&&<span className="ml-auto text-xs text-muted-foreground">Optional</span>}</label>)}<div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-emerald-500" style={{width:`${progress.total?progress.completed/progress.total*100:0}%`}}/></div></div>}<div className="grid grid-cols-2 gap-2 text-xs"><div><b>{weekly.percent}%</b> weekly completion</div><div><b>{monthly.percent}%</b> monthly completion</div></div><div className="grid gap-1" style={{gridTemplateColumns:"repeat(14,minmax(0,1fr))"}} aria-label={`${habit.name} 28-day completion calendar`}>{days.map(day=><span key={day.key} title={`${day.key}: ${day.completed?"completed":"missed"}`} className={`h-3 rounded-sm ${day.completed?"bg-emerald-500":"bg-muted"}`}/>)}</div></CardContent></Card>;})}</div>}</main>;
}
