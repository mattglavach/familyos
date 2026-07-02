import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Settings, UserRound, ListTodo } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../components/ui/command";
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
    <OriginDrawer open={open} onOpenChange={onOpenChange} title="Search Family OS" description="Find tasks, events, household members, and places in the app.">
      <div className="space-y-4">
        <Command>
          <CommandInput autoFocus value={query} placeholder="Search tasks, events, members..." onChange={event => setQuery(event.target.value)} />
          <CommandList>
            {!normalizedQuery && <CommandEmpty>Start typing to find a task, event, person, or app area.</CommandEmpty>}
            {normalizedQuery && !results.length && <CommandEmpty>No matching results. Try a task title, family member, event name, or Settings.</CommandEmpty>}
            {results.length > 0 && <CommandGroup heading="Results">
            {results.map((result, index) => (
              <CommandItem key={`${result.type}-${result.label}-${index}`} onClick={() => choose(result.nav)}>
                {resultIcon(result.type)}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">{result.label}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{result.detail}</span>
                </span>
                <Badge variant="blue">{result.type}</Badge>
              </CommandItem>
            ))}
            </CommandGroup>}
          </CommandList>
        </Command>
        <Button type="button" variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
      </div>
    </OriginDrawer>
  );
}
