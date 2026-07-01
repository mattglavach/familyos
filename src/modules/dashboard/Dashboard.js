import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Edit3,
  GraduationCap,
  ListTodo,
  NotebookText,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  Waves,
} from "lucide-react";
import { Badge, StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { FormError, FormGroup, FormHelp, FormRow, FormSection } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { SectionHeader } from "../../components/ui/section-header";
import { Select } from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import { Textarea } from "../../components/ui/textarea";
import { OriginDrawer } from "../../components/origin/drawer";
import { COLORS, MEMBER_COLORS, S } from "../../theme";
import { useFamilyMembers } from "./useFamilyMembers";

const toneByColor = {
  [COLORS.red]: "red",
  [COLORS.amber]: "amber",
  [COLORS.green]: "green",
  [COLORS.blue]: "blue",
  [COLORS.purple]: "purple",
  [COLORS.slate]: "slate",
};

const memberRoles = ["Parent", "Child", "Family", "Caregiver"];
const memberColors = [COLORS.blue, COLORS.purple, COLORS.red, COLORS.green, COLORS.amber, COLORS.slate];

function toneForColor(color) {
  return toneByColor[color] || "slate";
}

function formatSyncTime(value) {
  if (!value) return "Not synced yet";
  const syncedAt = new Date(value);
  if (Number.isNaN(syncedAt.getTime())) return "Sync time unavailable";
  return `Synced ${syncedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function calendarStatus(gc) {
  if (gc.loading || gc.status === "syncing") return { label: "Syncing", status: "warning", detail: "Refreshing Google Calendar events." };
  if (gc.status === "permission-error") return { label: "Permission needed", status: "warning", detail: gc.error };
  if (gc.status === "expired") return { label: "Reconnect", status: "warning", detail: gc.error };
  if (gc.error) return { label: "Sync failed", status: "failed", detail: gc.error };
  if (!gc.token) return { label: "Disconnected", status: "neutral", detail: "Connect Google Calendar to show your family schedule." };
  if (gc.status === "empty") return { label: "No events", status: "info", detail: `${formatSyncTime(gc.lastSyncedAt)} from ${gc.sourceLabel}.` };
  if (gc.status === "synced") return { label: "Synced", status: "connected", detail: `${formatSyncTime(gc.lastSyncedAt)} from ${gc.sourceLabel}.` };
  if (gc.status === "connecting" || gc.status === "script-loading") return { label: "Connecting", status: "warning", detail: "Opening Google Calendar sign-in." };
  return { label: "Connected", status: "connected", detail: `${formatSyncTime(gc.lastSyncedAt)} from ${gc.sourceLabel}.` };
}

function initialsFor(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "?";
}

function getMemberColor(member, fallbackName) {
  return member?.color || MEMBER_COLORS[fallbackName] || COLORS.slate;
}

function memberStatusTone(status) {
  return status === "inactive" ? "neutral" : "healthy";
}

function MemberAvatar({ member, name, size = "md" }) {
  const color = getMemberColor(member, name);
  const label = member?.name || name || "Unknown";
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-11 w-11 text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white ${sizeClass}`}
      style={{ background: color }}
      aria-label={label}
    >
      {initialsFor(label)}
    </span>
  );
}

function memberReferences(member, events, tasks, collegeGoals) {
  const name = String(member?.name || "").toLowerCase();
  if (!name) return { eventCount: 0, taskCount: 0, collegeCount: 0, total: 0 };
  const eventCount = (events || []).filter(event => String(event?.member || "").toLowerCase() === name).length;
  const taskCount = (tasks || []).filter(task => {
    const haystack = `${task.title || ""} ${task.category || ""} ${task.notes || ""}`.toLowerCase();
    return haystack.includes(name);
  }).length;
  const collegeCount = (collegeGoals || []).filter(goal => String(goal?.child_name || "").toLowerCase() === name).length;
  return { eventCount, taskCount, collegeCount, total: eventCount + taskCount + collegeCount };
}

function emptyMemberForm() {
  return { name: "", role: "Family", status: "active", color: COLORS.blue, notes: "" };
}

function MemberFormDrawer({ open, mode, member, onClose, onSave, onDeactivate, onRemove, references }) {
  const [form, setForm] = useState(() => member ? { ...member } : emptyMemberForm());
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(member ? { ...member } : emptyMemberForm());
      setFormError("");
    }
  }, [open, member]);

  if (!open) return null;

  async function save() {
    const result = await onSave(form);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    onClose();
  }

  async function deactivate() {
    const result = await onDeactivate?.();
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    onClose();
  }

  async function remove() {
    const result = await onRemove?.();
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    onClose();
  }

  return (
    <OriginDrawer
      open={open}
      onOpenChange={nextOpen => !nextOpen && onClose()}
      title={mode === "edit" ? "Edit Family Member" : "Add Family Member"}
      description="Member details personalize dashboard assignment and schedule views on this device."
      footer={
        <>
          {mode === "edit" && form.status !== "inactive" && (
            <Button type="button" variant="secondary" onClick={deactivate}>Deactivate</Button>
          )}
          {mode === "edit" && references?.total === 0 && (
            <Button type="button" variant="destructive-outline" onClick={remove}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </Button>
          )}
          <Button type="button" onClick={save}>{mode === "edit" ? "Save" : "Add"}</Button>
        </>
      }
    >
      <FormSection>
        <FormGroup>
          <Label>Name</Label>
          <Input value={form.name || ""} placeholder="Family member name" onChange={event => setForm(previous => ({ ...previous, name: event.target.value }))} />
        </FormGroup>
        <FormRow>
          <FormGroup>
            <Label>Role</Label>
            <Select value={form.role || "Family"} onChange={event => setForm(previous => ({ ...previous, role: event.target.value }))}>
              {memberRoles.map(role => <option key={role} value={role}>{role}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Status</Label>
            <Select value={form.status || "active"} onChange={event => setForm(previous => ({ ...previous, status: event.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormGroup>
        </FormRow>
        <FormGroup>
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {memberColors.map(color => (
              <button
                key={color}
                type="button"
                aria-label={`Use ${color}`}
                className={`h-9 w-9 rounded-full border ${form.color === color ? "border-white" : "border-border"}`}
                style={{ background: color }}
                onClick={() => setForm(previous => ({ ...previous, color }))}
              />
            ))}
          </div>
        </FormGroup>
        <FormGroup>
          <Label>Notes</Label>
          <Textarea value={form.notes || ""} placeholder="Optional context" onChange={event => setForm(previous => ({ ...previous, notes: event.target.value }))} />
        </FormGroup>
        {mode === "edit" && references?.total > 0 && (
          <FormHelp>
            This member has {references.total} current dashboard reference{references.total === 1 ? "" : "s"}. Deactivate keeps historical schedule and planning context intact.
          </FormHelp>
        )}
        {formError && <FormError>{formError}</FormError>}
      </FormSection>
    </OriginDrawer>
  );
}

function FamilyOverview({
  members,
  loading,
  error,
  events,
  tasks,
  collegeGoals,
  onAdd,
  onEdit,
}) {
  if (loading) return <SectionSkeleton rows={2} />;

  const activeCount = members.filter(member => member.status !== "inactive").length;
  const inactiveCount = members.length - activeCount;

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              Family
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status="healthy">{activeCount} active</StatusBadge>
              {inactiveCount > 0 && <StatusBadge status="neutral">{inactiveCount} inactive</StatusBadge>}
            </div>
          </div>
          <Button type="button" variant="secondary" size="xs" onClick={onAdd}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        {error && (
          <div className="rounded-lg border border-amber-400/35 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">
            {error}
          </div>
        )}
        {members.length === 0 ? (
          <EmptyStatePanel
            icon={<UserRound className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
            title="No family members yet"
            detail="Add household members to personalize schedule filters and dashboard references."
            action="Add member"
            onAction={onAdd}
            className="py-8"
          />
        ) : (
          <div className="space-y-2">
            {members.map(member => {
              const references = memberReferences(member, events, tasks, collegeGoals);
              return (
                <div key={member.id} className="rounded-lg border border-border bg-secondary/35 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <MemberAvatar member={member} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="truncate text-sm font-bold text-foreground">{member.name || "Unnamed"}</div>
                          <StatusBadge status={memberStatusTone(member.status)}>{member.status || "active"}</StatusBadge>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">{member.role || "Family"}</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant="blue">{references.eventCount} events</Badge>
                          <Badge variant="purple">{references.taskCount} task refs</Badge>
                          <Badge variant="green">{references.collegeCount} college</Badge>
                        </div>
                      </div>
                    </div>
                    <Button type="button" variant="secondary" size="icon-xs" aria-label={`Edit ${member.name}`} onClick={() => onEdit(member)}>
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  {member.notes && <div className="mt-3 text-xs leading-5 text-muted-foreground">{member.notes}</div>}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionSkeleton({ rows = 3 }) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActionRow({ item, showDivider, onNavigate }) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.nav)}
      className={`flex min-h-12 w-full items-center gap-3 py-2.5 text-left ${showDivider ? "border-b border-border" : ""}`}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{item.text}</span>
        {item.detail && <span className="mt-0.5 block text-xs font-medium" style={{ color: item.color }}>{item.detail}</span>}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}

function ModuleCard({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.nav)}
      className="min-h-[132px] rounded-lg border border-border bg-card p-3.5 text-left shadow-soft transition-colors hover:bg-accent"
      style={{ borderLeft: `3px solid ${item.color}` }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {item.module}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="mb-1 text-sm font-extrabold leading-tight" style={{ color: item.color }}>{item.label}</div>
      <div className="line-clamp-2 text-xs leading-5 text-muted-foreground">{item.detail}</div>
    </button>
  );
}

function ActionGroup({ title, count, color, items, showAll, defaultLimit, onNavigate }) {
  const visibleItems = items.slice(0, showAll ? 99 : defaultLimit);
  if (!items.length) return null;
  return (
    <Card className="overflow-hidden" style={{ borderLeft: `3px solid ${color}` }}>
      <CardHeader className="p-4 pb-1">
        <div className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color }}>
          {title} <span className="text-muted-foreground">{count}</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        {visibleItems.map((item, index) => (
          <ActionRow
            key={`${title}-${item.text}-${index}`}
            item={item}
            showDivider={index < visibleItems.length - 1}
            onNavigate={onNavigate}
          />
        ))}
        {!showAll && items.length > defaultLimit && (
          <div className="pt-2 text-xs font-medium text-muted-foreground">+{items.length - defaultLimit} more</div>
        )}
      </CardContent>
    </Card>
  );
}

function MemberFilter({ value, active, onSelect, color }) {
  const chipColor = color || MEMBER_COLORS[value] || COLORS.blue;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className="min-h-8 rounded-full border px-3 text-xs font-semibold"
      style={{
        borderColor: active ? chipColor : COLORS.navyLight,
        background: active ? `${chipColor}26` : "transparent",
        color: active ? chipColor : COLORS.slateLight,
      }}
    >
      {value}
    </button>
  );
}

function ScheduleEvent({ event, reassigning, setReassigning, setOverrides, dateLabel, memberByName, assignableMembers }) {
  const assignedMember = memberByName[String(event?.member || "").toLowerCase()];
  const eventMemberColor = getMemberColor(assignedMember, event?.member);
  const title = event?.title || "Untitled event";
  const eventId = event?.id || `${event?.date || "event"}-${title}`;
  return (
    <div className="rounded-lg border border-border bg-card p-3" style={{ borderLeft: `3px solid ${eventMemberColor}` }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{title}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {dateLabel ? `${dateLabel} - ` : ""}{event?.time || "All day"}{event?.location ? ` - ${event.location}` : ""}
          </div>
          <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {event?.source || "Google Calendar"}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <Badge variant={toneForColor(eventMemberColor)} className="max-w-32 truncate">{event?.member || "Unassigned"}</Badge>
          <Button type="button" variant="secondary" size="xs" disabled={!assignableMembers.length} onClick={() => setReassigning(reassigning === eventId ? null : eventId)}>
            Reassign
          </Button>
        </div>
      </div>
      {reassigning === eventId && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {assignableMembers.map(member => (
            <MemberFilter
              key={member.id}
              value={member.name}
              color={member.color}
              active={event?.member === member.name}
              onSelect={() => {
                setOverrides(previous => ({ ...previous, [eventId]: member.name }));
                setReassigning(null);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SchedulePanel({
  gc,
  filteredEvents,
  visibleDays,
  memberFilters,
  assignableMembers,
  memberByName,
  showFullSchedule,
  setShowFullSchedule,
  filter,
  setFilter,
  reassigning,
  setReassigning,
  setOverrides,
  formatDateFull,
  todayString,
}) {
  const status = calendarStatus(gc);

  if (!gc.token) {
    return (
      <Card style={{ borderLeft: `3px solid ${gc.status === "expired" || gc.error ? COLORS.amber : COLORS.slate}` }}>
        <CardContent className="space-y-3 pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <CalendarX className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm font-semibold text-foreground">Calendar disconnected</div>
                  <StatusBadge status={status.status}>{status.label}</StatusBadge>
                </div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">{status.detail}</div>
              </div>
            </div>
            <Button type="button" size="sm" onClick={gc.signIn} loading={gc.status === "connecting" || gc.status === "script-loading"}>Connect</Button>
          </div>
          {gc.error && (
            <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-xs leading-5 text-destructive">
              {gc.error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const visibleEvents = filteredEvents.filter(event => event?.date && visibleDays.includes(event.date));
  const todayEvents = visibleEvents.filter(event => event.date === todayString);
  const upcomingEvents = visibleEvents.filter(event => event.date !== todayString);

  return (
    <Card style={{ borderLeft: `3px solid ${status.status === "failed" || status.status === "warning" ? COLORS.amber : COLORS.blue}` }}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              Schedule
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={status.status}>{status.label}</StatusBadge>
              <span className="text-xs text-muted-foreground">{status.detail}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" variant="secondary" size="icon-xs" aria-label="Refresh calendar" onClick={gc.refresh} loading={gc.loading}>
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button type="button" variant="secondary" size="xs" onClick={() => setShowFullSchedule(value => !value)}>
              {showFullSchedule ? "7 days" : "30 days"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {memberFilters.map(member => (
            <MemberFilter key={member.id || member.name} value={member.name} color={member.color} active={filter === member.name} onSelect={setFilter} />
          ))}
        </div>
        {gc.error && (
          <div className="rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-xs leading-5 text-destructive">
            {gc.error}
          </div>
        )}
        {gc.loading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3.5 w-3/5" />
          </div>
        ) : visibleEvents.length === 0 ? (
          <EmptyStatePanel
            title={showFullSchedule ? "No events in the next 30 days" : "No events this week"}
            detail="Calendar events will appear here after the next sync."
            className="py-8"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border bg-secondary/45 p-3">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-primary">Today</div>
                <div className="mt-1 text-lg font-extrabold text-foreground">{todayEvents.length}</div>
              </div>
              <div className="rounded-lg border border-border bg-secondary/45 p-3">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Upcoming</div>
                <div className="mt-1 text-lg font-extrabold text-foreground">{upcomingEvents.length}</div>
              </div>
            </div>
            {todayEvents.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-primary">Today's Events</div>
                {todayEvents.map(event => (
                  <ScheduleEvent
                    key={event.id}
                    event={event}
                    reassigning={reassigning}
                    setReassigning={setReassigning}
                    setOverrides={setOverrides}
                    memberByName={memberByName}
                    assignableMembers={assignableMembers}
                  />
                ))}
              </div>
            )}
            {upcomingEvents.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Upcoming Events</div>
                {visibleDays.map(day => {
                  if (day === todayString) return null;
                  const eventsForDay = filteredEvents.filter(event => event.date === day);
                  if (!eventsForDay.length) return null;
                  return (
                    <div key={day} className="space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground">{formatDateFull(day)}</div>
                      {eventsForDay.map(event => (
                        <ScheduleEvent
                          key={event.id}
                          event={event}
                          reassigning={reassigning}
                          setReassigning={setReassigning}
                          setOverrides={setOverrides}
                          memberByName={memberByName}
                          assignableMembers={assignableMembers}
                          dateLabel={formatDateFull(day)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// - DASHBOARD -
export function Dashboard({ onNavigate, gc, deps }) {
  const {
    TODAY_DATE, TODAY_STR, daysAgo, daysBetween, nextDueDate, formatDate, formatDateFull,
    formatMoneyShort, maintStatus, useTable, calcRetirementProjection, getChemRecommendations,
  } = deps;

  const homeMaint = useTable("home_maintenance", "title", true);
  const deadlines = useTable("college_deadlines", "due_date", true);
  const readings = useTable("pool_readings", "logged_at");
  const assumptions = useTable("retirement_assumptions", "id", true);
  const accounts = useTable("retirement_accounts", "name", true);
  const notes = useTable("notes", "created_at");
  const taskData = useTable("tasks", "due_date", true);
  const treatments = useTable("pool_treatments", "logged_at");
  const collegeGoals = useTable("college_goal", "target_year", true);
  const family = useFamilyMembers();

  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [filter, setFilter] = useState("All");
  const [overrides, setOverrides] = useState({});
  const [reassigning, setReassigning] = useState(null);
  const [memberDrawer, setMemberDrawer] = useState({ open: false, mode: "add", member: null });

  const isLoading = [
    homeMaint,
    deadlines,
    readings,
    assumptions,
    accounts,
    notes,
    taskData,
    treatments,
    collegeGoals,
  ].some(table => table.loading);

  const assump = assumptions.data[0];
  const retProj = assump ? calcRetirementProjection(accounts.data, assump) : null;
  const lastReading = readings.data[0];
  const chemRecs = lastReading ? getChemRecommendations(lastReading, readings.data, null) : [];
  const highChemRecs = chemRecs.filter(rec => rec.priority === "high");
  const medChemRecs = chemRecs.filter(rec => rec.priority === "med");
  const poolDaysAgo = lastReading ? daysAgo(lastReading.date) : null;
  const poolStale = poolDaysAgo !== null && poolDaysAgo >= 3;

  const overdueHomeMaint = homeMaint.data.filter(item => maintStatus(item) === "overdue");
  const dueSoonHomeMaint = homeMaint.data.filter(item => maintStatus(item) === "due-soon");
  const urgentDeadlines = deadlines.data.filter(deadline => !deadline.completed && daysBetween(deadline.due_date) <= 14);
  const upcomingDeadlines = deadlines.data.filter(deadline => !deadline.completed && daysBetween(deadline.due_date) > 14 && daysBetween(deadline.due_date) <= 60);
  const urgentTasks = taskData.data.filter(task => {
    if (task.completed && !task.recurring_interval_days) return false;
    if (task.is_important) return true;
    if (task.due_date && daysBetween(task.due_date) <= 0) return true;
    return false;
  });

  const allEvents = useMemo(
    () => (gc.token ? gc.events : [])
      .filter(event => event && typeof event === "object")
      .map((event, index) => {
        const eventId = event.id || `${event.date || "event"}-${index}`;
        return {
          ...event,
          id: eventId,
          title: event.title || "Untitled event",
          member: overrides[eventId] || event.member || "Family",
          source: event.source || "Google Calendar",
        };
      }),
    [gc.events, gc.token, overrides]
  );
  const activeMembers = family.activeMembers;
  const memberFilters = useMemo(() => [{ id: "all", name: "All", color: COLORS.blue }, ...activeMembers], [activeMembers]);
  const assignableMembers = activeMembers;
  const memberByName = family.memberByName;

  useEffect(() => {
    if (filter === "All") return;
    if (!activeMembers.some(member => member.name === filter)) setFilter("All");
  }, [activeMembers, filter]);

  const filteredEvents = allEvents.filter(event => filter === "All" || event.member === filter);
  const next7Days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(TODAY_DATE);
    date.setDate(date.getDate() + index);
    return date.toISOString().split("T")[0];
  });
  const next30Days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(TODAY_DATE);
    date.setDate(date.getDate() + index);
    return date.toISOString().split("T")[0];
  });
  const visibleDays = showFullSchedule ? next30Days : next7Days;

  const overdue = [];
  const thisWeek = [];
  const upcoming = [];

  if (poolStale) overdue.push({ text: `Pool not tested in ${poolDaysAgo} days`, color: COLORS.amber, nav: "pool", detail: "Log a reading" });
  highChemRecs.forEach(rec => overdue.push({ text: rec.action, color: COLORS.red, nav: "pool", detail: null }));
  medChemRecs.slice(0, 2).forEach(rec => thisWeek.push({ text: rec.action, color: COLORS.amber, nav: "pool", detail: null }));
  overdueHomeMaint.forEach(item => {
    const days = -daysBetween(nextDueDate(item.last_completed, item.interval_days));
    overdue.push({ text: item.title, color: COLORS.red, nav: "tasks", detail: `${days}d overdue` });
  });
  dueSoonHomeMaint.forEach(item => {
    const days = daysBetween(nextDueDate(item.last_completed, item.interval_days));
    thisWeek.push({ text: item.title, color: COLORS.amber, nav: "tasks", detail: `due in ${days}d` });
  });
  urgentTasks.slice(0, 4).forEach(task => {
    const days = task.due_date ? daysBetween(task.due_date) : null;
    const isOverdue = days !== null && days < 0;
    const item = {
      text: task.title,
      color: isOverdue ? COLORS.red : task.is_important ? COLORS.purple : COLORS.amber,
      nav: "tasks",
      detail: isOverdue ? `${-days}d overdue` : days === 0 ? "Today" : task.is_important ? "Important" : days !== null ? `in ${days}d` : null,
    };
    if (isOverdue) overdue.push(item);
    else thisWeek.push(item);
  });
  urgentDeadlines.forEach(deadline => {
    const days = daysBetween(deadline.due_date);
    const item = {
      text: deadline.title,
      color: days <= 4 ? COLORS.red : COLORS.amber,
      nav: "college",
      detail: days === 0 ? "Today" : days < 0 ? `${-days}d overdue` : `in ${days}d`,
    };
    if (days <= 4) overdue.push(item);
    else thisWeek.push(item);
  });
  upcomingDeadlines.forEach(deadline => {
    upcoming.push({ text: deadline.title, color: COLORS.slate, nav: "college", detail: `in ${daysBetween(deadline.due_date)}d` });
  });
  filteredEvents.filter(event => event.date === TODAY_STR).forEach(event => {
    overdue.push({ text: event.title, color: COLORS.blue, nav: "home", detail: event.time || "Today" });
  });
  filteredEvents.filter(event => next7Days.includes(event.date) && event.date !== TODAY_STR).slice(0, 3).forEach(event => {
    const assignedMember = memberByName[String(event.member || "").toLowerCase()];
    thisWeek.push({
      text: event.title,
      color: getMemberColor(assignedMember, event.member),
      nav: "home",
      detail: `${event.time || ""} ${formatDate(event.date)}`.trim(),
    });
  });

  const totalActions = overdue.length + thisWeek.length + upcoming.length;
  const focusItems = [...overdue, ...thisWeek].slice(0, 5);
  const totalIssues = overdue.length + thisWeek.length;
  const headline = totalIssues === 0
    ? "Nothing needs attention right now."
    : [
      overdue.length > 0 ? `${overdue.length} item${overdue.length > 1 ? "s" : ""} need action now` : null,
      thisWeek.length > 0 ? `${thisWeek.length} due this week` : null,
    ].filter(Boolean).join(", ") + ".";

  const poolColor = highChemRecs.length > 0 ? COLORS.red : medChemRecs.length > 0 ? COLORS.amber : poolStale ? COLORS.amber : COLORS.green;
  const poolLabel = highChemRecs.length > 0 ? "Action needed" : medChemRecs.length > 0 ? "Monitor" : poolStale ? `${poolDaysAgo}d since test` : "Good";
  const poolDetail = highChemRecs.length > 0 ? `${highChemRecs[0].action.slice(0, 38)}...` : lastReading ? `pH ${lastReading.ph || "--"} FC ${lastReading.free_chlorine || "--"} Salt ${lastReading.salt || "--"}` : "No readings yet";

  const tasksOverdue = overdueHomeMaint.length + urgentTasks.filter(task => task.due_date && daysBetween(task.due_date) < 0).length;
  const tasksDueSoon = dueSoonHomeMaint.length + urgentTasks.filter(task => task.is_important && (!task.due_date || daysBetween(task.due_date) >= 0)).length;
  const tasksColor = tasksOverdue > 0 ? COLORS.red : tasksDueSoon > 0 ? COLORS.amber : COLORS.green;
  const tasksLabel = tasksOverdue > 0 ? `${tasksOverdue} overdue` : tasksDueSoon > 0 ? `${tasksDueSoon} this week` : "All clear";
  const tasksDetail = tasksOverdue > 0 ? `${overdueHomeMaint[0]?.title || urgentTasks[0]?.title || ""}`.slice(0, 38) : tasksDueSoon > 0 ? "Maintenance due" : "Nothing overdue";

  const finColor = retProj ? retProj.statusColor : COLORS.slate;
  const finLabel = retProj ? retProj.statusLabel.split(" - ")[0].split("--")[0].trim().slice(0, 18) : "No data";
  const finDetail = retProj ? `Age ${assump.retirement_age} - ${retProj.gap > 0 ? `-${formatMoneyShort(retProj.gap)} gap` : `surplus ${formatMoneyShort(-retProj.gap)}`}` : "Add accounts";

  const collegeColor = urgentDeadlines.length > 0 ? COLORS.amber : COLORS.green;
  const collegeLabel = urgentDeadlines.length > 0 ? `${urgentDeadlines.length} deadline${urgentDeadlines.length > 1 ? "s" : ""}` : upcomingDeadlines.length > 0 ? "Coming up" : "On track";
  const collegeDetail = urgentDeadlines.length > 0 ? urgentDeadlines[0].title.slice(0, 38) : upcomingDeadlines.length > 0 ? `Next: ${upcomingDeadlines[0].title.slice(0, 32)}` : "No urgent deadlines";

  const modules = [
    { module: "Pool", color: poolColor, label: poolLabel, detail: poolDetail, nav: "pool", icon: Waves },
    { module: "Tasks", color: tasksColor, label: tasksLabel, detail: tasksDetail, nav: "tasks", icon: ListTodo },
    { module: "Finance", color: finColor, label: finLabel, detail: finDetail, nav: "finance", icon: DollarSign },
    { module: "College", color: collegeColor, label: collegeLabel, detail: collegeDetail, nav: "college", icon: GraduationCap },
  ];

  const editingReferences = memberDrawer.member
    ? memberReferences(memberDrawer.member, allEvents, taskData.data, collegeGoals.data)
    : { eventCount: 0, taskCount: 0, collegeCount: 0, total: 0 };

  function openAddMember() {
    setMemberDrawer({ open: true, mode: "add", member: null });
  }

  function openEditMember(member) {
    setMemberDrawer({ open: true, mode: "edit", member });
  }

  function closeMemberDrawer() {
    setMemberDrawer({ open: false, mode: "add", member: null });
  }

  function saveMember(form) {
    if (memberDrawer.mode === "edit" && memberDrawer.member) {
      return family.updateMember(memberDrawer.member.id, form);
    }
    return family.addMember(form);
  }

  function deactivateEditingMember() {
    if (!memberDrawer.member) return { ok: false, error: "No family member selected." };
    return family.deactivateMember(memberDrawer.member.id);
  }

  function removeEditingMember() {
    if (!memberDrawer.member) return { ok: false, error: "No family member selected." };
    if (editingReferences.total > 0) return family.deactivateMember(memberDrawer.member.id);
    return family.removeMember(memberDrawer.member.id);
  }

  const recentActivity = [
    ...readings.data.slice(0, 2).map(reading => ({ date: reading.date, text: `Pool reading - pH ${reading.ph || "--"} FC ${reading.free_chlorine || "--"}`, color: COLORS.blue })),
    ...treatments.data.slice(0, 2).map(treatment => {
      const chemicals = [
        treatment.muriatic_acid_oz && `${treatment.muriatic_acid_oz}oz acid`,
        treatment.salt_lbs && `${treatment.salt_lbs}lb salt`,
        treatment.cya_oz && `${treatment.cya_oz}oz CYA`,
      ].filter(Boolean);
      return { date: treatment.date, text: `Treatment - ${chemicals.length > 0 ? chemicals.join(", ") : "maintenance"}`, color: COLORS.green };
    }),
    ...deadlines.data.filter(deadline => deadline.completed).slice(0, 1).map(deadline => ({ date: deadline.due_date, text: `College: ${deadline.title}`, color: COLORS.green })),
    ...homeMaint.data.filter(item => item.last_completed && daysAgo(item.last_completed) <= 7).slice(0, 1).map(item => ({ date: item.last_completed, text: item.title, color: COLORS.slate })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  return (
    <div style={S.screen} className="space-y-5">
      <Card className="overflow-hidden" style={{ borderTop: `3px solid ${totalIssues === 0 ? COLORS.green : overdue.length > 0 ? COLORS.red : COLORS.amber}` }}>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">This Week</div>
            <StatusBadge status={totalIssues === 0 ? "healthy" : overdue.length > 0 ? "urgent" : "warning"}>
              {totalIssues === 0 ? "All clear" : overdue.length > 0 ? `${overdue.length} urgent` : `${thisWeek.length} due`}
            </StatusBadge>
          </div>
          <div className="mb-1 text-2xl font-extrabold leading-tight tracking-normal" style={{ color: totalIssues === 0 ? COLORS.green : overdue.length > 0 ? COLORS.red : COLORS.amber }}>
            {totalIssues === 0 ? "All clear" : overdue.length > 0 ? `${overdue.length} urgent` : `${thisWeek.length} this week`}
          </div>
          <p className="mb-2 text-sm leading-6 text-muted-foreground">{headline}</p>
          {isLoading ? (
            <div className="space-y-3 pt-2">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3.5 w-3/5" />
            </div>
          ) : focusItems.length > 0 ? (
            <div className="mt-3 border-t border-border">
              {focusItems.map((item, index) => (
                <ActionRow
                  key={`${item.text}-${index}`}
                  item={item}
                  showDivider={index < focusItems.length - 1}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        {modules.map(item => <ModuleCard key={item.module} item={item} onNavigate={onNavigate} />)}
      </div>

      <FamilyOverview
        members={family.members}
        loading={family.loading}
        error={family.error}
        events={allEvents}
        tasks={taskData.data}
        collegeGoals={collegeGoals.data}
        onAdd={openAddMember}
        onEdit={openEditMember}
      />

      <section>
        <SectionHeader
          title="Action Center"
          count={totalActions}
          tone={overdue.length > 0 ? "red" : thisWeek.length > 0 ? "amber" : "green"}
          action={totalActions > 5 ? (
            <Button type="button" variant="ghost" size="xs" onClick={() => setShowAllActions(value => !value)}>
              {showAllActions ? "Less" : `All ${totalActions}`}
            </Button>
          ) : null}
        />
        {isLoading ? (
          <SectionSkeleton />
        ) : totalActions === 0 ? (
          <Card>
            <EmptyStatePanel
              icon={<CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" aria-hidden="true" />}
              title="Nothing needs attention"
              detail="The dashboard will surface urgent tasks, deadlines, calendar events, and module alerts here."
              className="py-8"
            />
          </Card>
        ) : (
          <div className="space-y-2.5">
            <ActionGroup title="Act Now" count={overdue.length} color={COLORS.red} items={overdue} showAll={showAllActions} defaultLimit={3} onNavigate={onNavigate} />
            <ActionGroup title="This Week" count={thisWeek.length} color={COLORS.amber} items={thisWeek} showAll={showAllActions} defaultLimit={3} onNavigate={onNavigate} />
            {showAllActions && <ActionGroup title="Coming Up" count={upcoming.length} color={COLORS.slate} items={upcoming} showAll defaultLimit={3} onNavigate={onNavigate} />}
          </div>
        )}
      </section>

      <SchedulePanel
        gc={gc}
        filteredEvents={filteredEvents}
        visibleDays={visibleDays}
        showFullSchedule={showFullSchedule}
        setShowFullSchedule={setShowFullSchedule}
        filter={filter}
        setFilter={setFilter}
        reassigning={reassigning}
        setReassigning={setReassigning}
        setOverrides={setOverrides}
        memberFilters={memberFilters}
        assignableMembers={assignableMembers}
        memberByName={memberByName}
        formatDateFull={formatDateFull}
        todayString={TODAY_STR}
      />

      <section>
        <SectionHeader title="Recent Activity" tone="blue" />
        {isLoading ? (
          <SectionSkeleton rows={2} />
        ) : recentActivity.length > 0 ? (
          <Card>
            <CardContent className="px-4 py-2">
              {recentActivity.map((activity, index) => (
                <div key={`${activity.text}-${index}`} className={`flex min-h-11 items-center gap-3 py-2 ${index < recentActivity.length - 1 ? "border-b border-border" : ""}`}>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: activity.color }} />
                  <div className="min-w-0 flex-1 truncate text-sm text-secondary-foreground">{activity.text}</div>
                  <div className="shrink-0 text-xs text-muted-foreground">{formatDate(activity.date)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <EmptyStatePanel
              icon={<Clock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
              title="No recent activity"
              detail="Completed work and new readings will appear here."
              className="py-8"
            />
          </Card>
        )}
      </section>

      <section>
        <SectionHeader
          title="Notes"
          count={notes.data.length}
          tone="neutral"
          action={notes.data.length > 0 ? (
            <Button type="button" variant="ghost" size="xs" onClick={() => setShowNotes(value => !value)}>
              {showNotes ? "Hide" : "Show"}
            </Button>
          ) : null}
        />
        {notes.loading ? (
          <SectionSkeleton rows={2} />
        ) : notes.data.length === 0 ? (
          <Card>
            <EmptyStatePanel
              icon={<NotebookText className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
              title="No notes yet"
              detail="Household notes added from Quick Add will show on the dashboard."
              className="py-8"
            />
          </Card>
        ) : showNotes ? (
          <div className="space-y-2.5">
            {notes.data.map(note => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {note.title && <div className="mb-1 truncate text-sm font-bold text-foreground">{note.title}</div>}
                      <div className="text-sm leading-6 text-secondary-foreground">{note.body}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <Badge variant="slate" className="shrink-0">{note.tag || "General"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>

      <MemberFormDrawer
        open={memberDrawer.open}
        mode={memberDrawer.mode}
        member={memberDrawer.member}
        references={editingReferences}
        onClose={closeMemberDrawer}
        onSave={saveMember}
        onDeactivate={deactivateEditingMember}
        onRemove={removeEditingMember}
      />
    </div>
  );
}
