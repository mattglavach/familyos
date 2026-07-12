import { useMemo, useState } from "react";
import { Check, Flame } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { SectionHeader } from "../../components/ui/section-header";
import { S } from "../../theme";
import { DEFAULT_HABITS, habitDateKey, habitSummary, readHabitState, writeHabitState } from "./habitStore";
import { useHousehold } from "../../context/HouseholdContext";

export function Habits() {
  const today = habitDateKey();
  const household = useHousehold();
  const userId = household.user?.id;
  const [state, setState] = useState(() => readHabitState(userId));
  const summary = useMemo(() => habitSummary(state, today), [state, today]);
  function toggle(name) {
    setState(previous => {
      const next = { ...previous, [name]: { ...(previous[name] || {}), [today]: !previous[name]?.[today] } };
      writeHabitState(userId, next);
      window.dispatchEvent(new CustomEvent("familyos:habits-changed"));
      return next;
    });
  }
  return <main style={S.screen} className="space-y-4" aria-labelledby="habits-title">
    <div><h1 id="habits-title" className="text-xl font-extrabold">Habits</h1><p className="text-sm text-muted-foreground">Build consistency one day at a time.</p></div>
    <Card><CardContent className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
      <div><div className="text-2xl font-extrabold">{summary.completed}/{summary.total}</div><div className="text-xs text-muted-foreground">Completed today</div></div>
      <div><div className="text-2xl font-extrabold">{summary.percent}%</div><div className="text-xs text-muted-foreground">Last 7 days</div></div>
      <div className="col-span-2 sm:col-span-1"><div className="flex items-center gap-1 text-2xl font-extrabold"><Flame className="h-5 w-5 text-amber-300"/>7 day view</div><div className="text-xs text-muted-foreground">Weekly consistency</div></div>
    </CardContent></Card>
    <section><SectionHeader title="Today's habits" count={summary.completed} tone="green"/><div className="grid gap-2 sm:grid-cols-2">
      {DEFAULT_HABITS.map(name => { const done = Boolean(state[name]?.[today]); return <button key={name} type="button" aria-pressed={done} onClick={() => toggle(name)} className={`flex min-h-14 items-center gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${done ? "border-emerald-400/60 bg-emerald-500/10" : "border-border bg-card hover:border-primary/60"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-full border ${done ? "border-emerald-400 bg-emerald-500 text-white" : "border-muted-foreground"}`}>{done && <Check className="h-4 w-4"/>}</span><span className="font-semibold">{name}</span></button>; })}
    </div></section>
  </main>;
}
