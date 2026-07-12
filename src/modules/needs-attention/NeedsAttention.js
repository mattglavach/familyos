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

export function NeedsAttention({ onNavigate }) {
  const household = useHousehold();
  const tasks = useTable("tasks", "due_date", true);
  const schedule = useTable("pool_schedule", "last_completed");
  const today = new Date().toISOString().slice(0, 10);
  const items = useMemo(() => normalizeAttentionItems([
    ...tasks.data.filter(task => !task.completed && task.due_date && task.due_date <= today).map(task => createAttentionItem({ householdIdentifier: household.householdId, sourceModule: "tasks", sourceRecordId: task.id, type: "due", severity: task.due_date < today ? "Critical" : "High", title: task.title, message: task.due_date < today ? "Overdue task" : "Due today", navigationDestination: { tab: "tasks", search: task.title } })),
    ...schedule.data.filter(item => { const due = new Date(`${item.last_completed}T12:00:00`); due.setDate(due.getDate() + Number(item.interval_days)); return due.toISOString().slice(0, 10) <= today; }).map(item => createAttentionItem({ householdIdentifier: household.householdId, sourceModule: "pool", sourceRecordId: item.id, type: "maintenance", severity: "High", title: item.title, message: "Pool maintenance is due", navigationDestination: "pool" })),
  ], { householdIdentifier: household.householdId }), [household.householdId, schedule.data, tasks.data, today]);
  return <main style={S.screen} className="space-y-4">
    <div className="flex items-start justify-between gap-3"><div><h1 className="text-xl font-extrabold">Needs Attention</h1><p className="text-sm text-muted-foreground">One prioritized list of unresolved household work.</p></div><Button type="button" size="xs" variant="secondary" onClick={() => onNavigate("more")}>Modules</Button></div>
    <SectionHeader title="Actionable now" count={items.length} tone="red" />
    {!items.length ? <Card><EmptyStatePanel title="Nothing needs attention" detail="FamilyOS will surface overdue, due-today, missed, and maintenance items here." /></Card> : <div className="space-y-2">{items.map(item => <button key={item.identifier} type="button" onClick={() => onNavigate(item.navigationDestination)} className="block w-full text-left"><Card><CardContent className="flex min-h-16 items-center gap-3 p-3"><AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" /><span className="min-w-0 flex-1"><span className="block text-xs font-bold uppercase text-muted-foreground">{item.sourceModule}</span><span className="block font-bold">{item.title}</span><span className="block text-xs text-muted-foreground">{item.message}</span></span><ChevronRight className="h-4 w-4" /></CardContent></Card></button>)}</div>}
  </main>;
}
