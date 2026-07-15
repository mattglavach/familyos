import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, CalendarPlus, Check, ChevronRight, MessageCircle, Plus, Sparkles } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { FormError, FormGroup, FormRow, FormSection } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { SectionHeader } from "../../components/ui/section-header";
import { Select } from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import { Textarea } from "../../components/ui/textarea";
import { OriginDrawer } from "../../components/origin/drawer";
import { useTable } from "../../hooks/useTable";
import { S } from "../../theme";
import {
  calculateRelationshipHealth, contactPatchForActivity, CONVERSATION_DEFAULTS, DEFAULT_ACTIVITY_IDEAS, listFromText,
  nextBirthday, recommendationsForRelationships, RELATIONSHIP_ACTIVITY_TYPES, RELATIONSHIP_CATEGORIES,
  RELATIONSHIP_PRIORITIES, relationshipWeeklySummary,
} from "./relationshipHealth";

const emptyRelationship = { name: "", category: "Friend", birthday: "", favorite_things: "", interests: "", conversation_topics: "", activity_ideas: DEFAULT_ACTIVITY_IDEAS.join("\n"), notes: "", priority: "Medium", status: "Active", age_group: "adult" };
const today = () => new Date().toISOString().slice(0, 10);
const isoLocal = value => value ? new Date(`${value}T12:00:00`).toISOString() : new Date().toISOString();
const healthTone = label => label === "Excellent" ? "green" : label === "Needs Attention" ? "amber" : "blue";
const formatDate = value => value ? new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not logged";

function RelationshipCard({ relationship, health, onOpen, onLog }) {
  return <Card className="overflow-hidden"><CardContent className="p-3"><div className="flex items-start gap-3"><button type="button" className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={onOpen} aria-label={`Open ${relationship.name}`}><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-extrabold">{relationship.name}</h3><Badge variant={healthTone(health.label)}>{health.label}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{relationship.category} · {relationship.priority} priority · {health.daysSinceContact === null ? "No contact logged" : `${health.daysSinceContact} days since contact`} · {health.threshold}-day guide</p></button><Button type="button" size="xs" onClick={onLog} aria-label={`Log time with ${relationship.name}`}><Plus className="h-4 w-4" aria-hidden="true"/>Log</Button></div></CardContent></Card>;
}

function ProfileForm({ form, setForm, error, submitting, onSave }) {
  const set = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  function applyDefaults(group) { setForm(previous => ({ ...previous, age_group: group, conversation_topics: CONVERSATION_DEFAULTS[group].join("\n") })); }
  return <FormSection>
    {form.id && <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-secondary/30 p-3 text-xs"><div><b className="block">Last Contact</b><span className="text-muted-foreground">{formatDate(form.last_contact_date)}</span></div><div><b className="block">Conversation</b><span className="text-muted-foreground">{formatDate(form.last_conversation)}</span></div><div><b className="block">One-on-One</b><span className="text-muted-foreground">{formatDate(form.last_one_on_one_activity)}</span></div></div>}
    <FormGroup><Label htmlFor="relationship-name">Name</Label><Input id="relationship-name" autoFocus value={form.name || ""} onChange={event => set("name", event.target.value)} required/></FormGroup>
    <FormRow><FormGroup><Label htmlFor="relationship-category">Category</Label><Select id="relationship-category" value={form.category || "Friend"} onChange={event => set("category", event.target.value)}>{RELATIONSHIP_CATEGORIES.map(value => <option key={value}>{value}</option>)}</Select></FormGroup><FormGroup><Label htmlFor="relationship-priority">Priority</Label><Select id="relationship-priority" value={form.priority || "Medium"} onChange={event => set("priority", event.target.value)}>{RELATIONSHIP_PRIORITIES.map(value => <option key={value}>{value}</option>)}</Select></FormGroup></FormRow>
    <FormRow><FormGroup><Label htmlFor="relationship-birthday">Birthday (optional)</Label><Input id="relationship-birthday" type="date" value={form.birthday || ""} onChange={event => set("birthday", event.target.value)}/></FormGroup><FormGroup><Label htmlFor="relationship-status">Status</Label><Select id="relationship-status" value={form.status || "Active"} onChange={event => set("status", event.target.value)}><option>Active</option><option>Archived</option></Select></FormGroup></FormRow>
    <FormGroup><Label htmlFor="relationship-favorites">Favorite Things</Label><Textarea id="relationship-favorites" value={form.favorite_things || ""} onChange={event => set("favorite_things", event.target.value)} placeholder="Foods, gifts, places..."/></FormGroup>
    <FormGroup><Label htmlFor="relationship-interests">Interests</Label><Textarea id="relationship-interests" value={form.interests || ""} onChange={event => set("interests", event.target.value)} placeholder="One per line or comma separated"/></FormGroup>
    <FormGroup><div className="flex items-center justify-between gap-2"><Label htmlFor="relationship-topics">Conversation Topics</Label><Select aria-label="Apply age-based conversation defaults" value={form.age_group || "adult"} onChange={event => applyDefaults(event.target.value)} className="h-9 w-32"><option value="teen">Teen defaults</option><option value="pre-teen">Pre-Teen defaults</option><option value="adult">Adult defaults</option></Select></div><Textarea id="relationship-topics" value={form.conversation_topics || ""} onChange={event => set("conversation_topics", event.target.value)} placeholder="One topic per line"/></FormGroup>
    <FormGroup><Label htmlFor="relationship-ideas">Activity Ideas</Label><Textarea id="relationship-ideas" value={form.activity_ideas || ""} onChange={event => set("activity_ideas", event.target.value)} placeholder="One idea per line"/></FormGroup>
    <FormGroup><Label htmlFor="relationship-notes">Notes</Label><Textarea id="relationship-notes" value={form.notes || ""} onChange={event => set("notes", event.target.value)}/></FormGroup>
    {error && <FormError>{error}</FormError>}
    <Button type="button" className="w-full" loading={submitting} onClick={onSave}>Save Relationship</Button>
  </FormSection>;
}

export function Relationships({ initialView }) {
  const relationships = useTable("relationships", "name", true);
  const activities = useTable("relationship_activities", "occurred_at");
  const goals = useTable("relationship_goals", "created_at");
  const householdActivity = useTable("household_activity", "occurred_at");
  const [profileOpen, setProfileOpen] = useState(false), [logOpen, setLogOpen] = useState(false), [goalOpen, setGoalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null), [form, setForm] = useState(emptyRelationship), [error, setError] = useState(""), [submitting, setSubmitting] = useState(false);
  const [logForm, setLogForm] = useState({ activity_type: "Conversation", date: today(), title: "", notes: "", status: "completed" });
  const [goalForm, setGoalForm] = useState({ title: "", target_date: "" });
  const handledInitialView = useRef(null);
  const active = relationships.data.filter(item => item.status === "Active");
  const selected = relationships.data.find(item => item.id === selectedId) || null;

  useEffect(() => {
    const viewKey = initialView?.ts || `${initialView?.relationshipId || ""}-${initialView?.action || "open"}`;
    if (!initialView?.relationshipId || !relationships.data.length || handledInitialView.current === viewKey) return;
    const relationship = relationships.data.find(item => item.id === initialView.relationshipId);
    if (!relationship) return;
    handledInitialView.current = viewKey;
    setSelectedId(relationship.id);
    if (initialView.action === "log" || initialView.action === "plan") {
      setLogForm(previous => ({ ...previous, status: initialView.action === "plan" ? "planned" : "completed" }));
      setLogOpen(true);
    } else setProfileOpen(true);
  }, [initialView, relationships.data]);

  const healthById = useMemo(() => Object.fromEntries(active.map(item => [item.id, calculateRelationshipHealth(item, activities.data, goals.data, today())])), [active, activities.data, goals.data]);
  const recommendations = useMemo(() => recommendationsForRelationships(active, activities.data, goals.data, { today: today() }), [active, activities.data, goals.data]);
  const summary = useMemo(() => relationshipWeeklySummary(active, activities.data, { today: today(), goals: goals.data }), [active, activities.data, goals.data]);
  const birthdays = useMemo(() => active.map(item => ({ ...item, next: nextBirthday(item.birthday, today()) })).filter(item => item.next?.days <= 60).sort((a, b) => a.next.days - b.next.days), [active]);
  const recent = activities.data.filter(item => item.status === "completed").slice(0, 5);
  const planned = activities.data.filter(item => item.status === "planned" && String(item.planned_for || item.occurred_at).slice(0, 10) >= today()).sort((a, b) => String(a.planned_for).localeCompare(String(b.planned_for))).slice(0, 5);
  const activeGoals = goals.data.filter(item => item.status !== "archived");
  const completeGoals = activeGoals.filter(item => item.status === "completed").length;
  const names = Object.fromEntries(relationships.data.map(item => [item.id, item.name]));

  function openProfile(relationship = null) {
    setSelectedId(relationship?.id || null); setError("");
    setForm(relationship ? { ...relationship, interests: listFromText(relationship.interests).join("\n"), conversation_topics: listFromText(relationship.conversation_topics).join("\n"), activity_ideas: listFromText(relationship.activity_ideas).join("\n") } : { ...emptyRelationship });
    setProfileOpen(true);
  }
  function openLog(relationship, status = "completed") { setSelectedId(relationship.id); setError(""); setLogForm({ activity_type: "Conversation", date: today(), title: "", notes: "", status }); setLogOpen(true); }
  async function saveProfile() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSubmitting(true); setError("");
    try {
      const row = { name: form.name.trim(), category: form.category, birthday: form.birthday || null, favorite_things: form.favorite_things || "", interests: listFromText(form.interests), conversation_topics: listFromText(form.conversation_topics), activity_ideas: listFromText(form.activity_ideas), notes: form.notes || "", priority: form.priority, status: form.status };
      if (selectedId) await relationships.update(selectedId, row); else await relationships.insert(row);
      setProfileOpen(false);
    } catch { setError("Relationship could not be saved. Try again."); } finally { setSubmitting(false); }
  }
  async function saveLog() {
    if (!selected) return;
    setSubmitting(true); setError("");
    try {
      const completed = logForm.status === "completed";
      const timestamp = isoLocal(logForm.date);
      const title = logForm.title.trim() || `${logForm.activity_type} with ${selected.name}`;
      const activity = await activities.insert({ relationship_id: selected.id, activity_type: logForm.activity_type, title, notes: logForm.notes || "", status: logForm.status, occurred_at: completed ? timestamp : null, planned_for: completed ? null : timestamp });
      if (completed) {
        await relationships.update(selected.id, contactPatchForActivity(logForm.activity_type, logForm.date));
        await householdActivity.insert({ entity_type: "relationship", entity_id: activity.id, action: "completed", title, summary: `${logForm.activity_type} · ${selected.name}`, occurred_at: timestamp, deep_link: { tab: "relationships", relationshipId: selected.id }, metadata: { relationship_id: selected.id, activity_type: logForm.activity_type } });
      }
      setLogOpen(false);
    } catch { setError("Activity could not be saved. Try again."); } finally { setSubmitting(false); }
  }
  async function saveGoal() {
    if (!selected || !goalForm.title.trim()) { setError("Goal title is required."); return; }
    setSubmitting(true); setError("");
    try { await goals.insert({ relationship_id: selected.id, title: goalForm.title.trim(), target_date: goalForm.target_date || null, status: "active" }); setGoalOpen(false); setGoalForm({ title: "", target_date: "" }); } catch { setError("Goal could not be saved."); } finally { setSubmitting(false); }
  }
  async function toggleGoal(goal) { await goals.update(goal.id, { status: goal.status === "completed" ? "active" : "completed", completed_at: goal.status === "completed" ? null : new Date().toISOString() }); }

  if ([relationships, activities, goals, householdActivity].some(table => table.loading)) return <main style={S.screen} className="space-y-3"><Skeleton className="h-28"/><Skeleton className="h-36"/><Skeleton className="h-36"/></main>;
  return <main style={S.screen} className="space-y-5 overflow-x-hidden" aria-label="Relationships dashboard">
    <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Relationship OS</div><h1 className="mt-1 text-2xl font-extrabold">Relationships</h1><p className="mt-2 text-sm text-muted-foreground">Notice meaningful opportunities to connect, without turning people into tasks.</p></div><Button type="button" size="sm" onClick={() => openProfile()}><Plus className="h-4 w-4"/>Add Person</Button></div>
    {!active.length ? <Card><EmptyStatePanel title="Add someone important" detail="Create a relationship profile to begin noticing birthdays, conversation ideas, and time together." action={<Button type="button" onClick={() => openProfile()}>Add Relationship</Button>}/></Card> : <>
      <section aria-label="Relationship Health Summary"><SectionHeader title="Relationship Health Summary" count={active.length} tone="green"/><div className="grid gap-2 sm:grid-cols-2">{active.map(item => <RelationshipCard key={item.id} relationship={item} health={healthById[item.id]} onOpen={() => openProfile(item)} onLog={() => openLog(item)}/>)}</div></section>
      <section className="grid gap-4 sm:grid-cols-2"><div><SectionHeader title="Needs Attention" count={recommendations.length} tone="amber"/><Card><CardContent className="divide-y divide-border p-2">{recommendations.slice(0, 4).map(item => <button key={item.id} type="button" onClick={() => openLog(relationships.data.find(person => person.id === item.entity_id), item.id.includes("one-on-one") ? "planned" : "completed")} className="flex min-h-12 w-full items-center gap-3 p-2 text-left"><Sparkles className="h-4 w-4 shrink-0 text-amber-300"/><span className="min-w-0 flex-1"><b className="block text-sm">{item.title}</b><span className="block text-xs text-muted-foreground">{item.detail}</span></span><ChevronRight className="h-4 w-4"/></button>)}{!recommendations.length && <p className="p-3 text-sm text-muted-foreground">Everyone is within their transparent contact guide.</p>}</CardContent></Card></div><div><SectionHeader title="Upcoming Birthdays" count={birthdays.length} tone="purple"/><Card><CardContent className="divide-y divide-border p-2">{birthdays.slice(0, 4).map(item => <button key={item.id} type="button" className="flex min-h-12 w-full items-center justify-between p-2 text-left" onClick={() => openProfile(item)}><span><b className="block text-sm">{item.name}</b><span className="text-xs text-muted-foreground">{formatDate(item.next.date)}</span></span><Badge variant="purple">{item.next.days === 0 ? "Today" : `${item.next.days} days`}</Badge></button>)}{!birthdays.length && <p className="p-3 text-sm text-muted-foreground">No birthdays in the next 60 days.</p>}</CardContent></Card></div></section>
      <section className="grid gap-4 sm:grid-cols-2"><div><SectionHeader title="Suggested Conversations" tone="blue"/><Card><CardContent className="p-4">{active.slice(0, 2).map(item => <div key={item.id} className="mb-3 last:mb-0"><b className="text-sm">{item.name}</b><div className="mt-2 flex flex-wrap gap-2">{listFromText(item.conversation_topics).slice(0, 4).map(topic => <Badge key={topic} variant="blue">{topic}</Badge>)}</div></div>)}</CardContent></Card></div><div><SectionHeader title="Suggested Activities" tone="blue"/><Card><CardContent className="p-4">{active.slice(0, 2).map(item => <div key={item.id} className="mb-3 last:mb-0"><b className="text-sm">{item.name}</b><div className="mt-2 flex flex-wrap gap-2">{listFromText(item.activity_ideas).slice(0, 4).map(idea => <button key={idea} type="button" className="min-h-11 rounded-full border border-border px-3 text-xs font-bold" onClick={() => { openLog(item, "planned"); setLogForm(previous => ({ ...previous, title: `${idea} with ${item.name}` })); }}>{idea}</button>)}</div></div>)}</CardContent></Card></div></section>
      <section className="grid gap-4 sm:grid-cols-2"><div><SectionHeader title="Recent Activities" count={recent.length} tone="green"/><Card><CardContent className="divide-y divide-border p-2">{recent.map(item => <div key={item.id} className="p-2"><b className="block text-sm">{item.title}</b><span className="text-xs text-muted-foreground">{names[item.relationship_id]} · {formatDate(item.occurred_at)}</span></div>)}{!recent.length && <p className="p-3 text-sm text-muted-foreground">No relationship activities logged yet.</p>}</CardContent></Card></div><div><SectionHeader title="Upcoming Planned Time Together" count={planned.length} tone="purple"/><Card><CardContent className="divide-y divide-border p-2">{planned.map(item => <div key={item.id} className="flex items-center gap-2 p-2"><CalendarPlus className="h-4 w-4 text-primary"/><span className="min-w-0"><b className="block truncate text-sm">{item.title}</b><span className="text-xs text-muted-foreground">{formatDate(item.planned_for)}</span></span></div>)}{!planned.length && <p className="p-3 text-sm text-muted-foreground">No planned time together yet.</p>}</CardContent></Card></div></section>
      <section><SectionHeader title="Relationship Goals Progress" count={activeGoals.length} tone="green"/><Card><CardContent className="p-4"><div className="mb-3 flex items-center justify-between"><span className="text-sm font-bold">{completeGoals} of {activeGoals.length} complete</span><Button type="button" size="xs" variant="secondary" disabled={!selected && !active[0]} onClick={() => { setSelectedId(selected?.id || active[0]?.id); setGoalOpen(true); }}><Plus className="h-4 w-4"/>Add Goal</Button></div><div className="space-y-2">{activeGoals.slice(0, 6).map(goal => <button key={goal.id} type="button" onClick={() => toggleGoal(goal)} className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-border p-2 text-left" aria-label={`${goal.status === "completed" ? "Reopen" : "Complete"} ${goal.title}`}><span className={`flex h-6 w-6 items-center justify-center rounded-full border ${goal.status === "completed" ? "border-emerald-400 bg-emerald-500 text-white" : "border-muted-foreground"}`}>{goal.status === "completed" && <Check className="h-4 w-4"/>}</span><span className="flex-1 text-sm font-semibold">{goal.title} <span className="block text-xs font-normal text-muted-foreground">{names[goal.relationship_id]}{goal.target_date ? ` · target ${formatDate(goal.target_date)}` : ""}</span></span></button>)}</div></CardContent></Card></section>
      <section><SectionHeader title="Weekly Summary" tone="blue"/><Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2"><div><b className="text-sm">Relationship Wins</b><p className="mt-1 text-xs text-muted-foreground">{summary.wins.join(" · ") || "Log a meaningful moment to start this week's wins."}</p></div><div><b className="text-sm">People to Reach Out To</b><p className="mt-1 text-xs text-muted-foreground">{summary.reachOut.map(item => item.title).join(" · ") || "No one is outside their contact guide."}</p></div><div><b className="text-sm">Upcoming Birthdays</b><p className="mt-1 text-xs text-muted-foreground">{summary.birthdays.slice(0, 3).map(item => `${item.relationship.name} (${item.birthday.days}d)`).join(" · ") || "None in the next 30 days."}</p></div><div><b className="text-sm">Suggested One-on-One Time</b><p className="mt-1 text-xs text-muted-foreground">{summary.oneOnOne?.title || "No one-on-one suggestion right now."}</p></div></CardContent></Card></section>
    </>}

    <OriginDrawer open={profileOpen} onOpenChange={setProfileOpen} title={selectedId ? `Edit ${selected?.name || "Relationship"}` : "Add Relationship"} description="Keep only the details that help you connect more intentionally."><ProfileForm form={form} setForm={setForm} error={error} submitting={submitting} onSave={saveProfile}/>{selectedId && <Button type="button" variant="ghost" className="mt-3 w-full" onClick={() => setForm(previous => ({ ...previous, status: previous.status === "Archived" ? "Active" : "Archived" }))}><Archive className="h-4 w-4"/>{form.status === "Archived" ? "Restore relationship" : "Archive relationship"}</Button>}</OriginDrawer>
    <OriginDrawer open={logOpen} onOpenChange={setLogOpen} title={`${logForm.status === "planned" ? "Plan time" : "Quick log"}${selected ? ` with ${selected.name}` : ""}`} description="One quick entry updates contact history and relationship health."><FormSection><FormGroup><Label htmlFor="relationship-log-type">Type</Label><Select id="relationship-log-type" value={logForm.activity_type} onChange={event => setLogForm(previous => ({ ...previous, activity_type: event.target.value }))}>{RELATIONSHIP_ACTIVITY_TYPES.map(value => <option key={value}>{value}</option>)}</Select></FormGroup><FormGroup><Label htmlFor="relationship-log-date">{logForm.status === "planned" ? "Planned date" : "Date"}</Label><Input id="relationship-log-date" type="date" value={logForm.date} onChange={event => setLogForm(previous => ({ ...previous, date: event.target.value }))}/></FormGroup><FormGroup><Label htmlFor="relationship-log-title">Title (optional)</Label><Input id="relationship-log-title" value={logForm.title} placeholder={`${logForm.activity_type} with ${selected?.name || "someone"}`} onChange={event => setLogForm(previous => ({ ...previous, title: event.target.value }))}/></FormGroup><FormGroup><Label htmlFor="relationship-log-notes">Notes</Label><Textarea id="relationship-log-notes" value={logForm.notes} onChange={event => setLogForm(previous => ({ ...previous, notes: event.target.value }))}/></FormGroup>{error && <FormError>{error}</FormError>}<Button type="button" className="w-full min-h-11" loading={submitting} onClick={saveLog}>{logForm.status === "planned" ? <CalendarPlus className="h-4 w-4"/> : <MessageCircle className="h-4 w-4"/>}{logForm.status === "planned" ? "Plan Time Together" : "Save Activity"}</Button></FormSection></OriginDrawer>
    <OriginDrawer open={goalOpen} onOpenChange={setGoalOpen} title={`Add goal${selected ? ` for ${selected.name}` : ""}`} description="Use a simple, meaningful outcome, not a recurring task."><FormSection><FormGroup><Label htmlFor="relationship-goal">Goal</Label><Input id="relationship-goal" autoFocus value={goalForm.title} onChange={event => setGoalForm(previous => ({ ...previous, title: event.target.value }))} placeholder="Have a monthly breakfast together"/></FormGroup><FormGroup><Label htmlFor="relationship-goal-date">Target date (optional)</Label><Input id="relationship-goal-date" type="date" value={goalForm.target_date} onChange={event => setGoalForm(previous => ({ ...previous, target_date: event.target.value }))}/></FormGroup>{error && <FormError>{error}</FormError>}<Button type="button" className="w-full" loading={submitting} onClick={saveGoal}>Save Goal</Button></FormSection></OriginDrawer>
  </main>;
}
