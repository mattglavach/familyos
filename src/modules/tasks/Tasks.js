import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Edit3,
  ListFilter,
  Plus,
  RotateCcw,
  Trash2,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { Badge, StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { FormError, FormGroup, FormHelp, FormRow, FormSection } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { SectionHeader } from "../../components/ui/section-header";
import { SegmentedControl } from "../../components/ui/segmented-control";
import { Select } from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import { Textarea } from "../../components/ui/textarea";
import { OriginDrawer } from "../../components/origin/drawer";
import { COLORS, MEMBER_COLORS, S } from "../../theme";
import { useHousehold } from "../../context/HouseholdContext";
import { useFamilyMembers } from "../dashboard/useFamilyMembers";

const TASK_METADATA_KEY = "familyos_task_metadata_v1";

const CATEGORY_OPTIONS = ["Home", "Pool", "Yard", "College", "Finance", "Personal", "Work"];
const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "med", label: "Medium" },
  { value: "high", label: "High" },
];
const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed"];
const DUE_FILTERS = [
  { value: "all", label: "All Due" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
];

const CATEGORY_TONES = {
  Pool: "blue",
  Yard: "green",
  Home: "amber",
  College: "red",
  Finance: "green",
  Personal: "purple",
  Work: "blue",
};
const PRIORITY_TONES = { high: "red", med: "amber", low: "slate" };
const STATUS_TONES = { "Not Started": "neutral", "In Progress": "info", Completed: "complete" };
const PRIORITY_WEIGHT = { high: 3, med: 2, low: 1 };
const DB_STATUS_TO_UI = { not_started: "Not Started", in_progress: "In Progress", completed: "Completed" };
const UI_STATUS_TO_DB = { "Not Started": "not_started", "In Progress": "in_progress", Completed: "completed" };

function readTaskMetadata() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return {};
    const raw = localStorage.getItem(TASK_METADATA_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => value && typeof value === "object" && !Array.isArray(value))
        .map(([key, value]) => [key, {
          assignee: typeof value.assignee === "string" ? value.assignee : "Family",
          status: STATUS_OPTIONS.includes(value.status) ? value.status : "Not Started",
          description: typeof value.description === "string" ? value.description : "",
          created_at: typeof value.created_at === "string" ? value.created_at : null,
          completed_at: typeof value.completed_at === "string" ? value.completed_at : null,
        }])
    );
  } catch {
    return {};
  }
}

function priorityLabel(priority) {
  return PRIORITY_OPTIONS.find(option => option.value === priority)?.label || "Medium";
}

function memberColor(name, members) {
  const member = members.find(item => item.name === name);
  return member?.color || MEMBER_COLORS[name] || COLORS.slate;
}

function memberNameById(id, members) {
  if (!id) return "Family";
  return members.find(member => member.id === id)?.name || "Family";
}

function memberIdByName(name, members) {
  if (!name || name === "Family") return null;
  return members.find(member => member.name === name)?.id || null;
}

function effectiveDueDate(task, nextDueDate) {
  if (task.due_date) return task.due_date;
  if (task.recurring_interval_days && task.last_completed) {
    try {
      return nextDueDate(task.last_completed, Number(task.recurring_interval_days));
    } catch {
      return null;
    }
  }
  return null;
}

function dueBucket(task, daysBetween, nextDueDate) {
  if (task.completed) return "completed";
  const dueDate = effectiveDueDate(task, nextDueDate);
  if (!dueDate) return "upcoming";
  const days = daysBetween(dueDate);
  if (Number.isNaN(days)) return "upcoming";
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  return "upcoming";
}

function normalizeTask(row, metadata, members, nextDueDate, index = 0) {
  const source = row && typeof row === "object" ? row : {};
  const id = source.id || `task-row-${index}`;
  const extra = metadata[id] || {};
  const completed = !!source.completed;
  const dbStatus = DB_STATUS_TO_UI[source.status] || null;
  const legacyAssignee = extra.assignee || "Family";
  return {
    ...source,
    id,
    title: source.title || "Untitled task",
    category: source.category || "Home",
    priority: source.priority || "med",
    description: source.notes || extra.description || "",
    assignee: source.assigned_person_id ? memberNameById(source.assigned_person_id, members) : legacyAssignee,
    status: completed ? "Completed" : dbStatus || extra.status || "Not Started",
    created_at: extra.created_at || source.created_at || source.created_date || null,
    completed_at: source.completed_at || extra.completed_at || (completed && !source.recurring_interval_days ? source.last_completed : null),
    effective_due_date: effectiveDueDate(source, nextDueDate),
  };
}

function emptyTaskForm(defaultAssignee = "Family", defaults = {}) {
  return {
    title: "",
    description: "",
    assignee: defaultAssignee,
    due_date: "",
    priority: defaults.taskDefaultPriority || "med",
    status: "Not Started",
    category: defaults.taskDefaultCategory || "Home",
    recurring_interval_days: "",
  };
}

function taskToForm(task) {
  return {
    title: task.title || "",
    description: task.description || task.notes || "",
    assignee: task.assignee || "Family",
    due_date: task.due_date || "",
    priority: task.priority || "med",
    status: task.status || (task.completed ? "Completed" : "Not Started"),
    category: task.category || "Home",
    recurring_interval_days: task.recurring_interval_days || "",
  };
}

function taskRowFromForm(form, id, currentTask, todayString) {
  const completed = form.status === "Completed";
  return {
    ...(id ? { id } : {}),
    title: form.title.trim(),
    category: form.category || "Home",
    priority: form.priority || "med",
    due_date: form.due_date || null,
    recurring_interval_days: form.recurring_interval_days ? Number(form.recurring_interval_days) : null,
    last_completed: completed ? todayString : currentTask?.last_completed || null,
    is_important: form.priority === "high",
    notes: form.description || "",
    completed,
  };
}

function taskMetadataFromForm(form, members, currentTask, todayString) {
  const completed = form.status === "Completed";
  return {
    assigned_person_id: memberIdByName(form.assignee, members),
    status: UI_STATUS_TO_DB[form.status] || "not_started",
    completed_at: completed ? currentTask?.completed_at || todayString : null,
    module_key: currentTask?.module_key || "tasks",
  };
}

function validateTask(form) {
  if (!form.title.trim()) return "Task title is required.";
  if (form.recurring_interval_days && Number(form.recurring_interval_days) < 1) return "Recurring interval must be at least 1 day.";
  return "";
}

function sortTasks(items, sortBy) {
  const copy = [...items];
  return copy.sort((a, b) => {
    if (sortBy === "priority") return (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
    if (sortBy === "created") return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    if (sortBy === "assignee") return String(a.assignee || "").localeCompare(String(b.assignee || ""));
    return String(a.effective_due_date || "9999-12-31").localeCompare(String(b.effective_due_date || "9999-12-31"));
  });
}

function safeMaintenanceDueDate(item, nextDueDate) {
  try {
    if (!item?.last_completed || !item?.interval_days) return null;
    return nextDueDate(item.last_completed, Number(item.interval_days));
  } catch {
    return null;
  }
}

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-card-foreground shadow-soft" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <span>{toast.message}</span>
        <Button type="button" variant="ghost" size="xs" onClick={onDismiss}>Dismiss</Button>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone = "blue" }) {
  const valueColor = tone === "red" ? COLORS.red : COLORS.white;
  return (
    <Card className="min-h-[92px]">
      <CardContent className="p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="text-2xl font-extrabold" style={{ color: valueColor }}>{value}</div>
      </CardContent>
    </Card>
  );
}

function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map(index => (
        <Card key={index}>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TaskCard({ task, members, daysBetween, formatDate, onEdit, onComplete, onReopen, onDelete, onReassign }) {
  const dueDate = task.effective_due_date;
  const days = dueDate ? daysBetween(dueDate) : null;
  const overdue = days !== null && !Number.isNaN(days) && days < 0 && task.status !== "Completed";
  const accent = task.status === "Completed" ? COLORS.green : overdue ? COLORS.red : task.priority === "high" ? COLORS.purple : memberColor(task.assignee, members);

  return (
    <Card style={{ borderLeft: `3px solid ${accent}` }}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={STATUS_TONES[task.status]}>{task.status}</StatusBadge>
              <Badge variant={PRIORITY_TONES[task.priority]}>{priorityLabel(task.priority)}</Badge>
              <Badge variant={CATEGORY_TONES[task.category] || "slate"}>{task.category || "Home"}</Badge>
            </div>
            <div className={`text-base font-bold leading-tight text-foreground ${task.status === "Completed" ? "line-through opacity-70" : ""}`}>{task.title}</div>
            {task.description && <div className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</div>}
          </div>
          <Button type="button" variant="secondary" size="icon-xs" aria-label={`Edit ${task.title}`} onClick={() => onEdit(task)}>
            <Edit3 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold" style={{ color: memberColor(task.assignee, members) }}>
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            {task.assignee || "Family"}
          </span>
          {dueDate && (
            <span className={overdue ? "font-semibold text-destructive" : days === 0 ? "font-semibold text-amber-300" : ""}>
              {overdue ? `${-days}d overdue` : days === 0 ? "Due today" : `Due ${formatDate(dueDate)}`}
            </span>
          )}
          {task.created_at && <span>Created {formatDate(task.created_at)}</span>}
          {task.completed_at && <span>Completed {formatDate(task.completed_at)}</span>}
          {task.recurring_interval_days && <span>Every {task.recurring_interval_days}d</span>}
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <Select value={task.assignee || "Family"} onChange={event => onReassign(task, event.target.value)} aria-label={`Reassign ${task.title}`}>
            <option value="Family">Family</option>
            {members.filter(member => member.status !== "inactive").map(member => (
              <option key={member.id} value={member.name}>{member.name}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {task.status === "Completed" ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => onReopen(task)}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reopen
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={() => onComplete(task)}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Complete
              </Button>
            )}
            <Button type="button" variant="destructive-outline" size="sm" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskList({ title, count, tone, tasks, emptyTitle, emptyDetail, renderTask }) {
  return (
    <section>
      <SectionHeader title={title} count={count} tone={tone} />
      {tasks.length ? (
        <div className="space-y-3">{tasks.map(renderTask)}</div>
      ) : (
        <Card>
          <EmptyStatePanel title={emptyTitle} detail={emptyDetail} className="py-7" />
        </Card>
      )}
    </section>
  );
}

function TaskDrawer({ open, mode, form, setForm, members, error, onClose, onSave }) {
  return (
    <OriginDrawer
      open={open}
      onOpenChange={nextOpen => !nextOpen && onClose()}
      title={mode === "edit" ? "Edit Task" : "Create Task"}
      description="Tasks support shared household work, module categories, assignment, priority, status, and due dates."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={onSave}>{mode === "edit" ? "Save" : "Create"}</Button>
        </>
      }
    >
      <FormSection>
        <FormGroup>
          <Label htmlFor="task-title">Title</Label>
          <Input id="task-title" value={form.title} placeholder="What needs to happen?" onChange={event => setForm(previous => ({ ...previous, title: event.target.value }))} />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="task-description">Description / Notes</Label>
          <Textarea id="task-description" value={form.description} placeholder="Add context, steps, or reminders." onChange={event => setForm(previous => ({ ...previous, description: event.target.value }))} />
        </FormGroup>
        <FormRow>
          <FormGroup>
            <Label htmlFor="task-assignee">Assignee</Label>
            <Select id="task-assignee" value={form.assignee} onChange={event => setForm(previous => ({ ...previous, assignee: event.target.value }))}>
              <option value="Family">Family</option>
              {members.filter(member => member.status !== "inactive").map(member => (
                <option key={member.id} value={member.name}>{member.name}</option>
              ))}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="task-due-date">Due Date</Label>
            <Input id="task-due-date" type="date" value={form.due_date} onChange={event => setForm(previous => ({ ...previous, due_date: event.target.value }))} />
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup>
            <Label htmlFor="task-priority">Priority</Label>
            <Select id="task-priority" value={form.priority} onChange={event => setForm(previous => ({ ...previous, priority: event.target.value }))}>
              {PRIORITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="task-status">Status</Label>
            <Select id="task-status" value={form.status} onChange={event => setForm(previous => ({ ...previous, status: event.target.value }))}>
              {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
            </Select>
          </FormGroup>
        </FormRow>
        <FormRow>
          <FormGroup>
            <Label htmlFor="task-category">Category</Label>
            <Select id="task-category" value={form.category} onChange={event => setForm(previous => ({ ...previous, category: event.target.value }))}>
              {CATEGORY_OPTIONS.map(category => <option key={category} value={category}>{category}</option>)}
            </Select>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="task-repeat-days">Repeat Every Days</Label>
            <Input id="task-repeat-days" type="number" min="1" placeholder="Optional" value={form.recurring_interval_days} onChange={event => setForm(previous => ({ ...previous, recurring_interval_days: event.target.value }))} />
          </FormGroup>
        </FormRow>
        <FormHelp>Assignee, status, created date, and completed date are stored with the household task record.</FormHelp>
        {error && <FormError>{error}</FormError>}
      </FormSection>
    </OriginDrawer>
  );
}

function MaintenanceCard({ item, maintStatus, maintColor, nextDueDate, daysBetween, formatDate, onComplete }) {
  const status = maintStatus(item);
  const color = maintColor(status);
  const dueDate = safeMaintenanceDueDate(item, nextDueDate);
  const days = dueDate ? daysBetween(dueDate) : null;
  return (
    <Card style={{ borderLeft: `3px solid ${color}` }}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={status === "overdue" ? "red" : status === "due-soon" ? "amber" : "green"}>{status.replace("-", " ")}</Badge>
            <Badge variant="slate">Every {item.interval_days}d</Badge>
          </div>
          <div className="text-sm font-bold text-foreground">{item.title}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {days === null || Number.isNaN(days) ? "Due date unavailable" : days < 0 ? `Overdue by ${-days}d` : days === 0 ? "Due today" : `Due ${formatDate(dueDate)}`}
            {item.notes ? ` - ${item.notes}` : ""}
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" className="w-full sm:w-auto" onClick={() => onComplete(item)}>
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Done
        </Button>
      </CardContent>
    </Card>
  );
}

export function Tasks({ deps }) {
  const {
    TODAY_DATE, TODAY_STR, daysBetween, nextDueDate, formatDate,
    maintStatus, maintColor, useTable,
  } = deps;

  const taskTable = useTable("tasks", "due_date", true);
  const homeMaint = useTable("home_maintenance", "title", true);
  const family = useFamilyMembers();
  const household = useHousehold();

  const [metadata, setMetadata] = useState({});
  const [metadataError] = useState("");
  const [view, setView] = useState("dashboard");
  const [memberFilter, setMemberFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dueFilter, setDueFilter] = useState("all");
  const [sortBy, setSortBy] = useState("due");
  const [drawer, setDrawer] = useState({ open: false, mode: "create", task: null });
  const [form, setForm] = useState(emptyTaskForm());
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const nextMetadata = readTaskMetadata();
    setMetadata(nextMetadata);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const members = family.members;
  const activeMembers = family.activeMembers;
  const tasks = useMemo(
    () => taskTable.data.map((task, index) => normalizeTask(task, metadata, members, nextDueDate, index)),
    [members, taskTable.data, metadata, nextDueDate]
  );

  const taskStats = useMemo(() => {
    const open = tasks.filter(task => task.status !== "Completed");
    const overdue = open.filter(task => dueBucket(task, daysBetween, nextDueDate) === "overdue");
    const today = open.filter(task => dueBucket(task, daysBetween, nextDueDate) === "today");
    const upcoming = open.filter(task => dueBucket(task, daysBetween, nextDueDate) === "upcoming");
    const recentlyCompleted = tasks
      .filter(task => task.status === "Completed")
      .sort((a, b) => String(b.completed_at || "").localeCompare(String(a.completed_at || "")))
      .slice(0, 5);
    const defaultMember = activeMembers.find(member => member.name === "Matt")?.name || activeMembers[0]?.name || "Family";
    return {
      open,
      overdue,
      today,
      upcoming,
      recentlyCompleted,
      myTasks: open.filter(task => task.assignee === defaultMember),
      familyTasks: open.filter(task => !task.assignee || task.assignee === "Family"),
    };
  }, [activeMembers, daysBetween, nextDueDate, tasks]);

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      if (view === "completed" && task.status !== "Completed") return false;
      if (view !== "completed" && task.status === "Completed") return false;
      if (memberFilter !== "All" && task.assignee !== memberFilter) return false;
      if (statusFilter !== "All" && task.status !== statusFilter) return false;
      if (priorityFilter !== "All" && task.priority !== priorityFilter) return false;
      if (categoryFilter !== "All" && task.category !== categoryFilter) return false;
      if (dueFilter !== "all" && dueBucket(task, daysBetween, nextDueDate) !== dueFilter) return false;
      return true;
    });
    return sortTasks(filtered, sortBy);
  }, [categoryFilter, daysBetween, dueFilter, memberFilter, nextDueDate, priorityFilter, sortBy, statusFilter, tasks, view]);

  const urgentMaint = homeMaint.data
    .filter(item => item?.title && ["overdue", "due-soon"].includes(maintStatus(item)))
    .sort((a, b) => {
      const aDue = safeMaintenanceDueDate(a, nextDueDate);
      const bDue = safeMaintenanceDueDate(b, nextDueDate);
      return (aDue ? daysBetween(aDue) : 9999) - (bDue ? daysBetween(bDue) : 9999);
    });

  function notify(message) {
    setToast({ message });
  }

  function openCreateTask() {
    const defaultMember = family.members.find(member => member.id === household.userPreferences?.default_person_id);
    const defaultAssignee = defaultMember?.name || activeMembers[0]?.name || "Family";
    const defaultPriority = household.userPreferences?.default_task_priority || household.householdSettings?.default_task_priority;
    setForm(emptyTaskForm(defaultAssignee, {
      taskDefaultCategory: household.userPreferences?.default_task_category || household.householdSettings?.default_task_category || "Home",
      taskDefaultPriority: defaultPriority === "medium" ? "med" : defaultPriority || "med",
    }));
    setDrawer({ open: true, mode: "create", task: null });
    setFormError("");
  }

  function openEditTask(task) {
    setForm(taskToForm(task));
    setDrawer({ open: true, mode: "edit", task });
    setFormError("");
  }

  function closeDrawer() {
    setDrawer({ open: false, mode: "create", task: null });
    setForm(emptyTaskForm());
    setFormError("");
  }

  async function saveTask() {
    const validationError = validateTask(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const id = drawer.task?.id || `task-${Date.now()}`;
    const row = {
      ...taskRowFromForm(form, id, drawer.task, TODAY_STR),
      ...taskMetadataFromForm(form, members, drawer.task, TODAY_STR),
      created_by_user_id: drawer.task?.created_by_user_id || household.user?.id || null,
      updated_by_user_id: household.user?.id || null,
    };

    if (drawer.mode === "edit" && drawer.task) await taskTable.update(drawer.task.id, row);
    else await taskTable.insert(row);

    closeDrawer();
    notify(drawer.mode === "edit" ? "Task updated." : "Task created.");
  }

  async function completeTask(task) {
    if (task.recurring_interval_days) {
      const nextDue = new Date(TODAY_DATE);
      nextDue.setDate(nextDue.getDate() + Number(task.recurring_interval_days));
      await taskTable.update(task.id, {
        title: task.title,
        category: task.category || "Home",
        priority: task.priority || "med",
        due_date: nextDue.toISOString().split("T")[0],
        recurring_interval_days: Number(task.recurring_interval_days),
        last_completed: TODAY_STR,
        is_important: task.priority === "high" || !!task.is_important,
        notes: task.description || "",
        completed: false,
        assigned_person_id: task.assigned_person_id || memberIdByName(task.assignee, members),
        status: "not_started",
        completed_at: TODAY_STR,
        module_key: task.module_key || "tasks",
        updated_by_user_id: household.user?.id || null,
      });
      notify("Recurring task completed and rescheduled.");
      return;
    }

    await taskTable.update(task.id, {
      title: task.title,
      category: task.category || "Home",
      priority: task.priority || "med",
      due_date: task.due_date || null,
      recurring_interval_days: task.recurring_interval_days || null,
      last_completed: TODAY_STR,
      is_important: task.priority === "high" || !!task.is_important,
      notes: task.description || "",
      completed: true,
      assigned_person_id: task.assigned_person_id || memberIdByName(task.assignee, members),
      status: "completed",
      completed_at: TODAY_STR,
      module_key: task.module_key || "tasks",
      updated_by_user_id: household.user?.id || null,
    });
    notify("Task completed.");
  }

  async function reopenTask(task) {
    await taskTable.update(task.id, {
      title: task.title,
      category: task.category || "Home",
      priority: task.priority || "med",
      due_date: task.due_date || null,
      recurring_interval_days: task.recurring_interval_days || null,
      last_completed: task.last_completed || null,
      is_important: task.priority === "high" || !!task.is_important,
      notes: task.description || "",
      completed: false,
      assigned_person_id: task.assigned_person_id || memberIdByName(task.assignee, members),
      status: "in_progress",
      completed_at: null,
      module_key: task.module_key || "tasks",
      updated_by_user_id: household.user?.id || null,
    });
    notify("Task reopened.");
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    await taskTable.remove(task.id);
    notify("Task deleted.");
  }

  async function reassignTask(task, assignee) {
    await taskTable.update(task.id, {
      title: task.title,
      category: task.category || "Home",
      priority: task.priority || "med",
      due_date: task.due_date || null,
      recurring_interval_days: task.recurring_interval_days || null,
      last_completed: task.last_completed || null,
      is_important: task.priority === "high" || !!task.is_important,
      notes: task.description || "",
      completed: task.status === "Completed",
      assigned_person_id: memberIdByName(assignee, members),
      status: UI_STATUS_TO_DB[task.status] || "not_started",
      completed_at: task.completed_at || null,
      module_key: task.module_key || "tasks",
      updated_by_user_id: household.user?.id || null,
    });
    notify(`Task assigned to ${assignee}.`);
  }

  async function completeMaintenance(item) {
    await homeMaint.update(item.id, {
      title: item.title,
      last_completed: TODAY_STR,
      interval_days: item.interval_days,
      notes: item.notes || "",
    });
    notify("Maintenance item completed.");
  }

  const renderTask = task => (
    <TaskCard
      key={task.id}
      task={task}
      members={members}
      daysBetween={daysBetween}
      formatDate={formatDate}
      onEdit={openEditTask}
      onComplete={completeTask}
      onReopen={reopenTask}
      onDelete={deleteTask}
      onReassign={reassignTask}
    />
  );

  const loading = taskTable.loading || homeMaint.loading || family.loading;
  const readWarning = "Task assignment, status, created date, and completed date now use Supabase task columns. Older browser metadata is read only as a legacy fallback when a row has not been updated yet.";

  return (
    <div style={S.screen} className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Tasks</div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{taskStats.open.length} open</div>
        </div>
        <Button type="button" onClick={openCreateTask}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Task
        </Button>
      </div>

      {(metadataError || family.error) && (
        <div className="rounded-lg border border-amber-400/35 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">
          {metadataError || family.error}
        </div>
      )}

      <SegmentedControl
        value={view}
        onValueChange={setView}
        options={[
          { value: "dashboard", label: "Dashboard" },
          { value: "all", label: "All Tasks" },
          { value: "completed", label: "Completed" },
        ]}
        className="w-full"
        itemClassName="flex-1"
        ariaLabel="Task views"
      />

      {loading ? (
        <TaskSkeleton />
      ) : view === "dashboard" ? (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <MetricCard icon={UserRound} label="My Tasks" value={taskStats.myTasks.length} />
            <MetricCard icon={Users} label="Family Tasks" value={taskStats.familyTasks.length} />
            <MetricCard icon={AlertTriangle} label="Overdue" value={taskStats.overdue.length} tone="red" />
            <MetricCard icon={Clock} label="Due Today" value={taskStats.today.length} />
            <MetricCard icon={CalendarClock} label="Upcoming" value={taskStats.upcoming.length} />
            <MetricCard icon={CheckCircle2} label="Completed" value={taskStats.recentlyCompleted.length} />
          </div>

          <TaskList
            title="Overdue Tasks"
            count={taskStats.overdue.length}
            tone="red"
            tasks={sortTasks(taskStats.overdue, "due").slice(0, 4)}
            emptyTitle="No overdue tasks"
            emptyDetail="Anything late will be promoted here."
            renderTask={renderTask}
          />
          <TaskList
            title="Due Today"
            count={taskStats.today.length}
            tone="amber"
            tasks={sortTasks(taskStats.today, "priority").slice(0, 4)}
            emptyTitle="Nothing due today"
            emptyDetail="Today is clear for the current filters."
            renderTask={renderTask}
          />
          <TaskList
            title="Upcoming"
            count={taskStats.upcoming.length}
            tone="blue"
            tasks={sortTasks(taskStats.upcoming, "due").slice(0, 5)}
            emptyTitle="No upcoming tasks"
            emptyDetail="Create a task with a future due date to plan ahead."
            renderTask={renderTask}
          />
          <TaskList
            title="Recently Completed"
            count={taskStats.recentlyCompleted.length}
            tone="green"
            tasks={taskStats.recentlyCompleted}
            emptyTitle="No completed tasks yet"
            emptyDetail="Completed work will appear here."
            renderTask={renderTask}
          />

          <section>
            <SectionHeader title="Home Maintenance" count={urgentMaint.length} tone="amber" />
            {urgentMaint.length ? (
              <div className="space-y-3">
                {urgentMaint.map(item => (
                  <MaintenanceCard
                    key={item.id}
                    item={item}
                    maintStatus={maintStatus}
                    maintColor={maintColor}
                    nextDueDate={nextDueDate}
                    daysBetween={daysBetween}
                    formatDate={formatDate}
                    onComplete={completeMaintenance}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyStatePanel
                  icon={<Wrench className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />}
                  title="Maintenance is current"
                  detail="Due and overdue home maintenance will show here."
                  className="py-7"
                />
              </Card>
            )}
          </section>
        </>
      ) : (
        <>
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListFilter className="h-4 w-4 text-primary" aria-hidden="true" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4 pt-0">
              <FormRow>
                <FormGroup>
                  <Label>Family Member</Label>
                  <Select value={memberFilter} onChange={event => setMemberFilter(event.target.value)}>
                    <option value="All">All</option>
                    <option value="Family">Family</option>
                    {activeMembers.map(member => <option key={member.id} value={member.name}>{member.name}</option>)}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Status</Label>
                  <Select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
                    <option value="All">All</option>
                    {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                  </Select>
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <Label>Priority</Label>
                  <Select value={priorityFilter} onChange={event => setPriorityFilter(event.target.value)}>
                    <option value="All">All</option>
                    {PRIORITY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Category</Label>
                  <Select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
                    <option value="All">All</option>
                    {CATEGORY_OPTIONS.map(category => <option key={category} value={category}>{category}</option>)}
                  </Select>
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup>
                  <Label>Due</Label>
                  <Select value={dueFilter} onChange={event => setDueFilter(event.target.value)}>
                    {DUE_FILTERS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Sort</Label>
                  <Select value={sortBy} onChange={event => setSortBy(event.target.value)}>
                    <option value="due">Due date</option>
                    <option value="priority">Priority</option>
                    <option value="created">Created date</option>
                    <option value="assignee">Assignee</option>
                  </Select>
                </FormGroup>
              </FormRow>
              <FormHelp>{readWarning}</FormHelp>
            </CardContent>
          </Card>

          <TaskList
            title={view === "completed" ? "Completed Tasks" : "Family Tasks"}
            count={filteredTasks.length}
            tone={view === "completed" ? "green" : "blue"}
            tasks={filteredTasks}
            emptyTitle="No matching tasks"
            emptyDetail="Adjust filters or create a new task."
            renderTask={renderTask}
          />
        </>
      )}

      <TaskDrawer
        open={drawer.open}
        mode={drawer.mode}
        form={form}
        setForm={setForm}
        members={members}
        error={formError}
        onClose={closeDrawer}
        onSave={saveTask}
      />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
