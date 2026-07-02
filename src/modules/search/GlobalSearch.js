import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, Settings, UserRound, ListTodo } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { OriginDrawer } from "../../components/origin/drawer";
import { useTable } from "../../hooks/useTable";
import { useFamilyMembers } from "../dashboard/useFamilyMembers";

const navigationTargets = [
  { label: "Home dashboard", detail: "Morning briefing and household priorities", nav: "home", type: "Navigation" },
  { label: "Tasks", detail: "Create, filter, assign, and complete household tasks", nav: "tasks", type: "Navigation" },
  { label: "Calendar", detail: "Today and upcoming household schedule", nav: "calendar", type: "Navigation" },
  { label: "Household settings", detail: "Members, invites, roles, and defaults", nav: "settings", type: "Navigation" },
  { label: "More modules", detail: "Finance, Pool, College, and future modules", nav: "more", type: "Navigation" },
];

function includesQuery(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

function resultIcon(type) {
  if (type === "Tasks") return <ListTodo className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Calendar") return <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Household") return <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />;
  return <Settings className="h-4 w-4 text-primary" aria-hidden="true" />;
}

export function GlobalSearch({ open, onOpenChange, calendarEvents, onNavigate }) {
  const [query, setQuery] = useState("");
  const taskTable = useTable("tasks", "due_date", true);
  const family = useFamilyMembers();
  const reloadTasks = taskTable.reload;
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (!open) return;
    reloadTasks();
  }, [open, reloadTasks]);

  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    const taskResults = taskTable.data
      .filter(task => includesQuery(`${task.title} ${task.category} ${task.notes} ${task.priority}`, normalizedQuery))
      .slice(0, 6)
      .map(task => ({ type: "Tasks", label: task.title || "Untitled task", detail: `${task.category || "Task"}${task.due_date ? ` - due ${task.due_date}` : ""}`, nav: "tasks" }));
    const eventResults = (calendarEvents || [])
      .filter(event => includesQuery(`${event.title} ${event.location} ${event.member} ${event.source}`, normalizedQuery))
      .slice(0, 6)
      .map(event => ({ type: "Calendar", label: event.title || "Untitled event", detail: `${event.date || "No date"} ${event.time || ""}`.trim(), nav: "calendar" }));
    const memberResults = family.members
      .filter(member => includesQuery(`${member.name} ${member.role} ${member.status}`, normalizedQuery))
      .slice(0, 6)
      .map(member => ({ type: "Household", label: member.name || "Household member", detail: `${member.role || "Family"} - ${member.status || "active"}`, nav: "settings" }));
    const navResults = navigationTargets
      .filter(item => includesQuery(`${item.label} ${item.detail}`, normalizedQuery));
    return [...taskResults, ...eventResults, ...memberResults, ...navResults].slice(0, 18);
  }, [calendarEvents, family.members, normalizedQuery, taskTable.data]);

  function choose(nav) {
    onOpenChange(false);
    setQuery("");
    onNavigate(nav);
  }

  return (
    <OriginDrawer open={open} onOpenChange={onOpenChange} title="Search Family OS" description="Search tasks, calendar events, household members, and main destinations.">
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input autoFocus className="pl-9" value={query} placeholder="Search tasks, events, members..." onChange={event => setQuery(event.target.value)} />
        </div>
        {!normalizedQuery ? (
          <EmptyStatePanel title="Type to search" detail="Results are grouped by the current implemented surfaces." className="py-7" />
        ) : results.length ? (
          <div className="space-y-2">
            {results.map((result, index) => (
              <button key={`${result.type}-${result.label}-${index}`} type="button" onClick={() => choose(result.nav)} className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3 text-left">
                {resultIcon(result.type)}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">{result.label}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{result.detail}</span>
                </span>
                <Badge variant="blue">{result.type}</Badge>
              </button>
            ))}
          </div>
        ) : (
          <EmptyStatePanel title="No results" detail="Try a task title, family member, event name, or destination like Settings." className="py-7" />
        )}
        <Button type="button" variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
      </div>
    </OriginDrawer>
  );
}
