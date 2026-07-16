import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarPlus, Check, ChevronDown, ChevronRight, Clock3, Eye, ListPlus, Moon, Sparkles, Sun, Wrench, X } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { SectionHeader } from "../../components/ui/section-header";
import { buildFamilyBrief, snoozeUntil } from "../../services/recommendations/brief";
import { resolveRecommendationLink } from "../../services/recommendations/linkResolver";

const priorityVariant = { critical: "destructive", high: "amber", medium: "blue", low: "secondary", info: "secondary" };
const sourceLabel = item => (item.sourceModules || [item.category]).map(value => String(value).replace(/-/g, " ")).join(" + ");

function RecommendationCard({ item, onRequest }) {
  const [expanded, setExpanded] = useState(false);
  return <Card className="overflow-hidden border-l-4 border-l-primary/70">
    <CardContent className="p-3">
      <div className="flex items-start gap-2">
        <button type="button" className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>
          <span className="flex flex-wrap items-center gap-2"><Badge variant={priorityVariant[item.severity]}>{item.severity}</Badge><span className="text-xs capitalize text-muted-foreground">{sourceLabel(item)}</span></span>
          <h3 className="mt-2 text-sm font-extrabold leading-5">{item.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground"><b className="text-foreground">Next:</b> {item.recommendedAction}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.estimatedTime || "5 to 15 minutes"} · {item.dueTiming || "This week"}</p>
        </button>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true"/>
      </div>
      {expanded && <div className="mt-3 space-y-2 border-t border-border pt-3 text-xs leading-5" aria-label="Why am I seeing this?">
        <p><b>Why it matters:</b> {item.rationale}</p>
        <p><b>Priority reason:</b> {item.priorityReason || item.rationale}</p>
        <p><b>Trigger:</b> {(item.triggerConditions || item.supportingData || []).join(" · ") || "Current household timing and status"}</p>
        <p><b>Last evaluated:</b> {new Date(item.lastEvaluation || Date.now()).toLocaleString()}</p>
        <p><b>Related records:</b> {(item.relatedRecords || item.sourceIds || []).filter(Boolean).join(", ") || "No direct record identifier"}</p>
      </div>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="xs" onClick={() => onRequest(item, item.actionType === "complete" ? "complete" : "view")}>{item.actionType === "complete" ? <Check className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}{item.actionType === "complete" ? "Complete" : "View"}</Button>
        <Button type="button" size="xs" variant="secondary" onClick={() => onRequest(item, "snooze")}><Clock3 className="h-3.5 w-3.5"/>Snooze</Button>
        <Button type="button" size="xs" variant="ghost" onClick={() => onRequest(item, "dismissed")}><X className="h-3.5 w-3.5"/>Dismiss</Button>
        <Button type="button" size="xs" variant="ghost" onClick={() => onRequest(item, "create_task")}><ListPlus className="h-3.5 w-3.5"/>Create Task</Button>
        <Button type="button" size="xs" variant="ghost" onClick={() => onRequest(item, "create_calendar_event")}><CalendarPlus className="h-3.5 w-3.5"/>Calendar</Button>
        <Button type="button" size="xs" variant="ghost" onClick={() => onRequest(item, "convert_maintenance")}><Wrench className="h-3.5 w-3.5"/>Maintenance</Button>
        <Button type="button" size="xs" variant="ghost" onClick={() => onRequest(item, "reviewed")}><Eye className="h-3.5 w-3.5"/>Reviewed</Button>
      </div>
    </CardContent>
  </Card>;
}

export function ActionableBrief({ recommendations, data, historyTable, taskTable, today, onNavigate, onQuickAdd, aiBrief, aiEnabled }) {
  const [mode, setMode] = useState(() => new Date().getHours() >= 17 ? "evening" : "morning");
  const [pending, setPending] = useState(null);
  const recordedGenerated = useRef(new Set());
  const brief = useMemo(() => buildFamilyBrief({ recommendations, data, history: historyTable.data, today }), [data, historyTable.data, recommendations, today]);
  useEffect(() => {
    recommendations.forEach(item => {
      const signature = `${item.deduplicationKey || item.id}:${item.triggerSignature}`;
      const exists = historyTable.data.some(entry => entry.action === "generated" && entry.recommendation_key === (item.deduplicationKey || item.id) && entry.trigger_signature === item.triggerSignature);
      if (exists || recordedGenerated.current.has(signature)) return;
      recordedGenerated.current.add(signature);
      historyTable.insert({ recommendation_key: item.deduplicationKey || item.id, action: "generated", trigger_signature: item.triggerSignature, source_modules: item.sourceModules || [item.category], related_record_ids: (item.sourceIds || []).map(String) }).catch(() => {});
    });
  }, [historyTable, recommendations]);
  const record = async (item, action, extra = {}) => historyTable.insert({ recommendation_key: item.deduplicationKey || item.id, action, trigger_signature: item.triggerSignature, source_modules: item.sourceModules || [item.category], related_record_ids: (item.sourceIds || []).map(String), ...extra });
  async function confirmAction() {
    const { item, action, preset } = pending;
    if (action === "complete" && item.target?.type === "task") await taskTable.update(item.target.id, { completed: true, status: "completed", completed_at: new Date().toISOString() });
    await record(item, action === "snooze" ? "snoozed" : action, action === "snooze" ? { remind_after: snoozeUntil(preset || "tomorrow") } : {});
    setPending(null);
    if (["view", "create_task", "create_calendar_event", "convert_maintenance"].includes(action)) {
      if (action === "view") onNavigate(resolveRecommendationLink(item, data));
      if (action === "create_task") onQuickAdd?.("task");
      if (action === "create_calendar_event") onNavigate({ tab: "calendar", create: true, title: item.title });
      if (action === "convert_maintenance") onNavigate({ tab: "home-assets", createMaintenance: true, title: item.title });
    }
  }
  function request(item, action) { setPending({ item, action, preset: action === "snooze" ? "tomorrow" : null }); }
  const primary = mode === "morning" ? brief.today.slice(0, 3) : brief.remaining;
  return <section aria-labelledby="family-brief-title" className="space-y-4">
    <div className="flex items-center justify-between gap-2"><SectionHeader title="Family Brief" count={brief.today.length + brief.nextActions.length} tone="amber"/><div className="flex rounded-lg border border-border p-1" aria-label="Brief period"><Button type="button" size="xs" variant={mode === "morning" ? "secondary" : "ghost"} aria-pressed={mode === "morning"} onClick={() => setMode("morning")}><Sun className="h-3.5 w-3.5"/>Morning</Button><Button type="button" size="xs" variant={mode === "evening" ? "secondary" : "ghost"} aria-pressed={mode === "evening"} onClick={() => setMode("evening")}><Moon className="h-3.5 w-3.5"/>Evening</Button></div></div>
    <h2 id="family-brief-title" className="sr-only">Actionable Family Brief</h2>
    <Card className="border-primary/40 bg-primary/5"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">{mode === "morning" ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}{mode === "morning" ? "30-second Morning Brief" : "Evening Review"}</div><p className="mt-2 text-sm leading-6">{aiEnabled ? aiBrief?.summary || "Deterministic brief is ready. AI summary is loading separately." : "AI summary is off. This brief uses current deterministic FamilyOS facts."}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3"><span>{data.events?.filter(event => String(event.start?.dateTime || event.start?.date || event.date || "").startsWith(today)).length || 0} events today</span><span>{primary.length} priorities</span><span>{brief.wins.length} wins</span></div></CardContent></Card>
    <div><SectionHeader title={mode === "morning" ? "Today" : "Remaining Today"} count={primary.length} tone="red"/><div className="space-y-2">{primary.length ? primary.map(item => <RecommendationCard key={item.id} item={item} onRequest={request}/>) : <Card><CardContent className="p-4 text-sm text-muted-foreground">No immediate action is required.</CardContent></Card>}</div></div>
    {mode === "morning" ? <>
      <div><SectionHeader title="Next Actions" count={brief.nextActions.length} tone="blue"/><div className="space-y-2">{brief.nextActions.slice(0, 5).map(item => <RecommendationCard key={item.id} item={item} onRequest={request}/>)}</div></div>
      {brief.thisWeek.length > 0 && <div><SectionHeader title="This Week" count={brief.thisWeek.length} tone="purple"/><Card><CardContent className="divide-y divide-border p-2">{brief.thisWeek.map(item => <button key={item.id} type="button" className="flex min-h-12 w-full items-center justify-between gap-2 p-2 text-left" onClick={() => request(item, "view")}><span><b className="block text-sm">{item.title}</b><span className="text-xs text-muted-foreground">{item.recommendedAction}</span></span><ChevronRight className="h-4 w-4"/></button>)}</CardContent></Card></div>}
      <div className="grid gap-4 md:grid-cols-2"><div><SectionHeader title="Household Wins" count={brief.wins.length} tone="green"/><Card><CardContent className="p-4 text-sm">{brief.wins.length ? brief.wins.map(win => <p key={win} className="py-1">✓ {win}</p>) : <p className="text-muted-foreground">Wins will appear as work is completed.</p>}</CardContent></Card></div><div><SectionHeader title="Since Yesterday" count={brief.changes.length} tone="blue"/><Card><CardContent className="p-4 text-sm">{brief.changes.length ? brief.changes.map(change => <p key={change} className="py-1">{change}</p>) : <p className="text-muted-foreground">No meaningful change needs review.</p>}</CardContent></Card></div></div>
      <div className="grid gap-4 md:grid-cols-2"><div><SectionHeader title="Weekly Focus" count={brief.outcomes.length} tone="purple"/><Card><CardContent className="p-4">{brief.outcomes.map((outcome, index) => <p key={outcome} className="py-1 text-sm"><b>{index + 1}.</b> {outcome}</p>)}</CardContent></Card></div><div><SectionHeader title="What Can Wait" count={brief.canWait.length} tone="green"/><Card><CardContent className="p-4">{brief.canWait.length ? brief.canWait.map(item => <div key={item.id} className="py-1 text-sm"><b>{item.title}</b><p className="text-xs text-muted-foreground">{item.waitReason}</p></div>) : <p className="text-sm text-muted-foreground">Nothing has been explicitly deferred.</p>}</CardContent></Card></div></div>
    </> : <><div><SectionHeader title="Completed Today" count={brief.wins.length} tone="green"/><Card><CardContent className="p-4 text-sm">{brief.wins.length ? brief.wins.map(win => <p key={win}>✓ {win}</p>) : "No completions logged today."}</CardContent></Card></div><div><SectionHeader title="Tomorrow's Priorities" count={brief.tomorrow.length} tone="blue"/><Card><CardContent className="p-4 text-sm">{brief.tomorrow.length ? brief.tomorrow.map(item => <p key={item.id}>{item.title}</p>) : "No tomorrow-specific priority is currently detected."}</CardContent></Card></div></>}
    <Dialog open={Boolean(pending)} onOpenChange={open => !open && setPending(null)}><DialogContent titleId="recommendation-confirm-title" onClose={() => setPending(null)}><DialogHeader><DialogTitle id="recommendation-confirm-title">Confirm recommendation action</DialogTitle><DialogDescription>{pending ? `${pending.action.replace(/_/g, " ")}: ${pending.item.title}` : ""}. FamilyOS will record this decision before changing or routing data.</DialogDescription></DialogHeader>{pending?.action === "snooze" && <div className="grid grid-cols-2 gap-2"><Button type="button" variant={pending.preset === "tomorrow" ? "secondary" : "ghost"} onClick={() => setPending(value => ({ ...value, preset: "tomorrow" }))}>Tomorrow</Button><Button type="button" variant={pending.preset === "weekend" ? "secondary" : "ghost"} onClick={() => setPending(value => ({ ...value, preset: "weekend" }))}>This weekend</Button><Button type="button" variant={pending.preset === "nextWeek" ? "secondary" : "ghost"} onClick={() => setPending(value => ({ ...value, preset: "nextWeek" }))}>Next week</Button><Button type="button" variant={pending.preset === "never" ? "secondary" : "ghost"} onClick={() => setPending(value => ({ ...value, action: "never_remind", preset: "never" }))}>Never remind again</Button></div>}<DialogFooter><Button type="button" variant="secondary" onClick={() => setPending(null)}>Cancel</Button><Button type="button" onClick={confirmAction}><Sparkles className="h-4 w-4"/>Confirm</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
