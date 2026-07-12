import { useMemo } from "react";
import { Archive, Check, Flame, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { SectionHeader } from "../../components/ui/section-header";
import { useTable } from "../../hooks/useTable";
import { S } from "../../theme";
import { habitDateKey } from "./habitStore";
import { completionRate, habitGoalLabel, longestHabitStreak, recentHabitDays } from "./habitAnalytics";

export function habitPeriodKey(habit, date = new Date()) {
  if (Number(habit.target_count) > 1) return habitDateKey(date);
  if (habit.frequency === "monthly") return habitDateKey(date).slice(0, 7);
  if (habit.frequency === "weekly") {
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return habitDateKey(monday);
  }
  return habitDateKey(date);
}

export function habitStreak(habit, completions, now = new Date()) {
  let streak = 0;
  const cursor = new Date(now);
  for (let index = 0; index < 366; index += 1) {
    const key = habitPeriodKey(habit, cursor);
    if (completions.some(item => item.habit_id === habit.id && item.period_key === key && item.status === "completed")) streak += 1;
    else break;
    if (habit.frequency === "monthly") cursor.setMonth(cursor.getMonth() - 1);
    else cursor.setDate(cursor.getDate() - (habit.frequency === "weekly" ? 7 : 1));
  }
  return streak;
}

export function Habits() {
  const habits = useTable("habits", "created_at", true);
  const completions = useTable("habit_completions", "completed_at");
  const active = useMemo(() => habits.data.filter(habit => !habit.archived && habit.status !== "archived"), [habits.data]);
  const period = habit => habitPeriodKey(habit);
  const completed = active.filter(habit => completions.data.some(item => item.habit_id === habit.id && item.period_key === period(habit) && item.status === "completed")).length;

  async function toggle(habit) {
    const current = completions.data.find(item => item.habit_id === habit.id && item.period_key === period(habit));
    if (current) await completions.remove(current.id);
    else await completions.insert({ habit_id: habit.id, period_key: period(habit), status: "completed" });
    window.dispatchEvent(new CustomEvent("familyos:habits-changed"));
  }

  async function archive(habit) {
    await habits.update(habit.id, { ...habit, archived: true, status: "archived" });
  }

  return <main style={S.screen} className="space-y-4">
    <div><h1 className="text-xl font-extrabold">Habits</h1><p className="text-sm text-muted-foreground">Daily, weekly, and monthly consistency with durable history.</p></div>
    <Card><CardContent className="grid grid-cols-2 gap-3 p-4">
      <div><div className="text-2xl font-extrabold">{completed}/{active.length}</div><div className="text-xs text-muted-foreground">Current periods complete</div></div>
      <div><div className="text-2xl font-extrabold">{active.length ? Math.round(completed / active.length * 100) : 0}%</div><div className="text-xs text-muted-foreground">Completion</div></div>
    </CardContent></Card>
    <SectionHeader title="Current habits" count={active.length} tone="green" />
    {!active.length ? <Card><EmptyStatePanel title="No habits yet" detail="Use the global Add button to create a personal or household habit." /></Card> : <div className="grid gap-2 sm:grid-cols-2">
      {active.map(habit => {
        const done = completions.data.some(item => item.habit_id === habit.id && item.period_key === period(habit) && item.status === "completed");
        const streak = habitStreak(habit, completions.data), longest=longestHabitStreak(habit,completions.data), weekly=completionRate(habit,completions.data,7), monthly=completionRate(habit,completions.data,30), days=recentHabitDays(habit,completions.data);
        return <Card key={habit.id}><CardContent className="space-y-3 p-3"><div className="flex min-h-14 items-center gap-3">
          <button type="button" aria-label={`${done ? "Undo" : "Complete"} ${habit.name}`} aria-pressed={done} onClick={() => toggle(habit)} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${done ? "border-emerald-400 bg-emerald-500" : "border-muted-foreground"}`}>{done ? <Check className="h-5 w-5 text-white" /> : <RotateCcw className="h-4 w-4 text-muted-foreground" />}</button>
          <div className="min-w-0 flex-1"><div className="font-bold">{habit.name}</div><div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{habitGoalLabel(habit)}</span><span className="flex items-center gap-1"><Flame className="h-3 w-3 text-amber-300" />{streak} current · {longest} longest</span></div></div>
          <Button variant="ghost" size="icon-xs" aria-label={`Archive ${habit.name}`} onClick={() => archive(habit)}><Archive className="h-4 w-4" /></Button>
        </div><div className="grid grid-cols-2 gap-2 text-xs"><div><b>{weekly.percent}%</b> weekly completion</div><div><b>{monthly.percent}%</b> monthly completion</div></div><div className="grid gap-1" style={{gridTemplateColumns:"repeat(14,minmax(0,1fr))"}} aria-label={`${habit.name} 28-day completion calendar`}>{days.map(day=><span key={day.key} title={`${day.key}: ${day.completed?"completed":"missed"}`} className={`h-3 rounded-sm ${day.completed?"bg-emerald-500":"bg-muted"}`}/>)}</div>{!done&&streak===0&&<p className="text-xs text-amber-200">Recovery: complete the next scheduled check-in to restart momentum. One miss does not erase prior progress.</p>}</CardContent></Card>;
      })}
    </div>}
  </main>;
}
