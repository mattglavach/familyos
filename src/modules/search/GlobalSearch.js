import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Heart, Settings, UserRound, ListTodo, ListChecks, Utensils, Waves } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../components/ui/command";
import { OriginDrawer } from "../../components/origin/drawer";
import { useTable } from "../../hooks/useTable";
import { useFamilyMembers } from "../dashboard/useFamilyMembers";
import { formatCalendarEventTime, normalizeCalendarEvent } from "../../lib/calendarTime";

const navigationTargets = [
  { label: "Home dashboard", detail: "Morning briefing and household priorities", nav: "home", type: "Navigation" },
  { label: "Tasks", detail: "Create, filter, assign, and complete household tasks", nav: "tasks", type: "Navigation" },
  { label: "Calendar", detail: "Today and upcoming household schedule", nav: "calendar", type: "Navigation" },
  { label: "Meal Planning", detail: "Recipes, meal plans, assignments, and pantry checks", nav: "meal-planning", type: "Navigation" },
  { label: "Life Lists", detail: "Lists for ideas, media, places, gifts, and future plans", nav: "life-lists", type: "Navigation" },
  { label: "Pool", detail: "Pool tests, recommendations, equipment, and maintenance", nav: "pool", type: "Navigation" },
  { label: "Relationships", detail: "People, interests, conversation topics, activities, and goals", nav: "relationships", type: "Navigation" },
  { label: "Household settings", detail: "Members, invites, roles, and defaults", nav: "settings", type: "Navigation" },
  { label: "More modules", detail: "Finance, Pool, College, and future modules", nav: "more", type: "Navigation" },
];

function includesQuery(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

function resultIcon(type) {
  if (type === "Tasks") return <ListTodo className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Meal Planning") return <Utensils className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Life Lists") return <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Pool") return <Waves className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Calendar") return <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Household") return <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Relationships") return <Heart className="h-4 w-4 text-primary" aria-hidden="true" />;
  return <Settings className="h-4 w-4 text-primary" aria-hidden="true" />;
}

export function buildCalendarSearchResult(event) {
  const normalized = normalizeCalendarEvent(event);
  return { type: "Calendar", label: normalized.title || "Untitled event", detail: `${normalized.date || "No date"} ${formatCalendarEventTime(normalized)}`.trim(), nav: { tab: "calendar", eventId: normalized.id } };
}

export function buildRelationshipSearchResults(items, query) {
  return (items || []).filter(item => item.status !== "Archived" && includesQuery(`${item.name} ${item.category} ${item.priority} ${item.favorite_things} ${(item.interests || []).join?.(" ") || item.interests} ${(item.conversation_topics || []).join?.(" ") || item.conversation_topics} ${(item.activity_ideas || []).join?.(" ") || item.activity_ideas} ${item.notes}`, query)).slice(0, 8).map(item => ({ type: "Relationships", label: item.name, detail: `${item.category} · ${item.priority} priority`, nav: { tab: "relationships", relationshipId: item.id } }));
}

export function GlobalSearch({ open, onOpenChange, calendarEvents, onNavigate }) {
  const [query, setQuery] = useState("");
  const taskTable = useTable("tasks", "due_date", true);
  const listTable = useTable("life_lists", "updated_at");
  const itemTable = useTable("life_list_items", "updated_at");
  const mealPlanTable = useTable("meal_plans", "updated_at");
  const recipeTable = useTable("recipes", "updated_at");
  const mealAssignmentTable = useTable("meal_assignments", "meal_date", true);
  const poolTests = useTable("pool_readings", "logged_at");
  const poolTreatments = useTable("pool_treatments", "logged_at");
  const poolMaintenance = useTable("pool_maintenance", "date");
  const poolEquipment = useTable("pool_equipment", "type", true);
  const habits = useTable("habits", "created_at", true);
  const routines = useTable("routines", "created_at", true);
  const homeMaintenance = useTable("home_maintenance", "last_completed");
  const homeAssets = useTable("home_assets", "updated_at");
  const notes = useTable("notes", "created_at");
  const relationships = useTable("relationships", "name", true);
  const family = useFamilyMembers();
  const reloadTasks = taskTable.reload;
  const reloadLists = listTable.reload;
  const reloadItems = itemTable.reload;
  const reloadMealPlans = mealPlanTable.reload;
  const reloadRecipes = recipeTable.reload;
  const reloadMealAssignments = mealAssignmentTable.reload;
  const reloadPoolTests = poolTests.reload;
  const reloadPoolTreatments = poolTreatments.reload;
  const reloadPoolMaintenance = poolMaintenance.reload;
  const reloadPoolEquipment = poolEquipment.reload;
  const reloadHabits=habits.reload,reloadRoutines=routines.reload,reloadHomeMaintenance=homeMaintenance.reload,reloadHomeAssets=homeAssets.reload,reloadNotes=notes.reload,reloadRelationships=relationships.reload;
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (!open) return;
    reloadTasks();
    reloadLists();
    reloadItems();
    reloadMealPlans();
    reloadRecipes();
    reloadMealAssignments();
    reloadPoolTests();
    reloadPoolTreatments();
    reloadPoolMaintenance();
    reloadPoolEquipment();
    reloadHabits();reloadRoutines();reloadHomeMaintenance();reloadHomeAssets();reloadNotes();reloadRelationships();
  }, [open, reloadHabits,reloadHomeAssets,reloadHomeMaintenance,reloadNotes,reloadRelationships,reloadRoutines,reloadItems, reloadLists, reloadMealAssignments, reloadMealPlans, reloadPoolEquipment, reloadPoolMaintenance, reloadPoolTests, reloadPoolTreatments, reloadRecipes, reloadTasks]);

  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    const taskResults = taskTable.data
      .filter(task => includesQuery(`${task.title} ${task.category} ${task.notes} ${task.priority}`, normalizedQuery))
      .slice(0, 6)
      .map(task => ({ type: "Tasks", label: task.title || "Untitled task", detail: `${task.category || "Task"}${task.due_date ? ` - due ${task.due_date}` : ""}`, nav: { tab: "tasks", search: task.title || "" } }));
    const eventResults = (calendarEvents || [])
      .filter(event => includesQuery(`${event.title} ${event.location} ${event.member} ${event.source}`, normalizedQuery))
      .slice(0, 6)
      .map(buildCalendarSearchResult);
    const memberResults = family.members
      .filter(member => includesQuery(`${member.name} ${member.role} ${member.status}`, normalizedQuery))
      .slice(0, 6)
      .map(member => ({ type: "Household", label: member.name || "Household member", detail: `${member.role || "Family"} - ${member.status || "active"}`, nav: "settings" }));
    const listResults = listTable.data
      .filter(list => !list.archived && includesQuery(`${list.name} ${list.description} ${list.category} ${list.visibility}`, normalizedQuery))
      .slice(0, 6)
      .map(list => ({ type: "Life Lists", label: list.name || "Untitled list", detail: `${list.category || "List"} - ${list.visibility || "household"}`, nav: { tab: "life-lists", listId: list.id } }));
    const itemResults = itemTable.data
      .filter(item => !item.archived && item.status !== "archived" && includesQuery(`${item.title} ${item.description} ${(item.tags || []).join?.(" ") || item.tags} ${item.link_url}`, normalizedQuery))
      .slice(0, 6)
      .map(item => ({ type: "Life Lists", label: item.title || "Untitled item", detail: `${item.status || "planned"} item`, nav: { tab: "life-lists", listId: item.list_id, search: item.title || "" } }));
    const mealPlanResults = mealPlanTable.data
      .filter(plan => !plan.archived && includesQuery(`${plan.name} ${plan.description} ${plan.notes} ${plan.visibility}`, normalizedQuery))
      .slice(0, 6)
      .map(plan => ({ type: "Meal Planning", label: plan.name || "Meal plan", detail: `${plan.plan_type || "weekly"} plan`, nav: "meal-planning" }));
    const recipeResults = recipeTable.data
      .filter(recipe => !recipe.archived && includesQuery(`${recipe.title} ${recipe.description} ${recipe.category} ${(recipe.tags || []).join?.(" ") || recipe.tags}`, normalizedQuery))
      .slice(0, 6)
      .map(recipe => ({ type: "Meal Planning", label: recipe.title || "Recipe", detail: `${recipe.meal_type || "Recipe"} - ${recipe.category || "Meal"}`, nav: "meal-planning" }));
    const mealAssignmentResults = mealAssignmentTable.data
      .filter(item => !item.archived && includesQuery(`${item.title} ${item.meal_type} ${item.notes} ${item.meal_date}`, normalizedQuery))
      .slice(0, 6)
      .map(item => ({ type: "Meal Planning", label: item.title || "Meal", detail: `${item.meal_type || "Meal"} on ${item.meal_date}`, nav: "meal-planning" }));
    const poolTestResults = poolTests.data
      .filter(item => includesQuery(`${item.test_source} ${item.notes} ${item.recent_weather_notes} ${item.date} pH ${item.ph} FC ${item.free_chlorine} salt ${item.salt}`, normalizedQuery))
      .slice(0, 6)
      .map(item => ({ type: "Pool", label: `Pool test - ${item.date}`, detail: `pH ${item.ph || "--"} FC ${item.free_chlorine || "--"} Salt ${item.salt || "--"}`, nav: { tab: "pool", view: "history", recordId: item.id } }));
    const poolTreatmentResults = poolTreatments.data
      .filter(item => includesQuery(`${item.notes} ${item.water_clarity} acid salt cya chlorine swg ${item.date}`, normalizedQuery))
      .slice(0, 6)
      .map(item => ({ type: "Pool", label: `Pool treatment - ${item.date}`, detail: item.notes || "Chemical or equipment change", nav: { tab: "pool", view: "history", recordId: item.id } }));
    const poolMaintenanceResults = poolMaintenance.data
      .filter(item => includesQuery(`${item.type} ${item.notes} ${item.water_clarity} ${item.date}`, normalizedQuery))
      .slice(0, 6)
      .map(item => ({ type: "Pool", label: item.type || "Pool maintenance", detail: item.date || "Maintenance", nav: { tab: "pool", view: "history", recordId: item.id } }));
    const poolEquipmentResults = poolEquipment.data
      .filter(item => includesQuery(`${item.type} ${item.name} ${item.brand} ${item.model} ${item.notes} ${item.warranty_notes}`, normalizedQuery))
      .slice(0, 6)
      .map(item => ({ type: "Pool", label: item.name || item.type || "Pool equipment", detail: `${item.type || "Equipment"} ${item.next_maintenance ? `- next ${item.next_maintenance}` : ""}`, nav: "pool" }));
    const habitResults=habits.data.filter(item=>!item.archived&&includesQuery(`${item.name} ${item.description} ${item.frequency}`,normalizedQuery)).slice(0,6).map(item=>({type:"Habits",label:item.name,detail:`${item.frequency} habit`,nav:"habits"}));
    const routineResults=routines.data.filter(item=>!item.archived&&includesQuery(`${item.name} ${item.description} ${item.recurrence}`,normalizedQuery)).slice(0,6).map(item=>({type:"Routines",label:item.name,detail:`${item.recurrence} routine`,nav:"routines"}));
    const maintenanceResults=homeMaintenance.data.filter(item=>includesQuery(`${item.title} ${item.category} ${item.notes}`,normalizedQuery)).slice(0,6).map(item=>({type:"Maintenance",label:item.title||"Maintenance",detail:item.category||"Home maintenance",nav:{tab:"tasks",search:item.title||""}}));
    const homeResults=homeAssets.data.filter(item=>item.status!=="completed"&&includesQuery(`${item.name} ${item.category} ${item.status} ${item.notes}`,normalizedQuery)).slice(0,6).map(item=>({type:"Home Operations",label:item.name,detail:`${item.category} · ${item.status}`,nav:"home-assets"}));
    const noteResults=notes.data.filter(item=>includesQuery(`${item.title} ${item.content} ${item.notes}`,normalizedQuery)).slice(0,6).map(item=>({type:"Notes",label:item.title||"Household note",detail:String(item.content||item.notes||"").slice(0,80),nav:"timeline"}));
    const relationshipResults=buildRelationshipSearchResults(relationships.data,normalizedQuery);
    const navResults = navigationTargets
      .filter(item => includesQuery(`${item.label} ${item.detail}`, normalizedQuery));
    return [...taskResults, ...eventResults,...relationshipResults,...habitResults,...routineResults,...maintenanceResults,...homeResults,...noteResults, ...memberResults, ...listResults, ...itemResults, ...mealPlanResults, ...recipeResults, ...mealAssignmentResults, ...poolTestResults, ...poolTreatmentResults, ...poolMaintenanceResults, ...poolEquipmentResults, ...navResults].slice(0, 40);
  }, [calendarEvents, family.members,habits.data,homeAssets.data,homeMaintenance.data,notes.data,relationships.data,routines.data, itemTable.data, listTable.data, mealAssignmentTable.data, mealPlanTable.data, normalizedQuery, poolEquipment.data, poolMaintenance.data, poolTests.data, poolTreatments.data, recipeTable.data, taskTable.data]);
  const groupedResults = useMemo(() => {
    const order = ["Relationships", "Tasks", "Calendar", "Habits", "Routines", "Maintenance", "Home Operations", "Pool", "Notes", "Life Lists", "Meal Planning", "Household", "Navigation"];
    return order
      .map(type => ({ type, items: results.filter(result => result.type === type) }))
      .filter(group => group.items.length);
  }, [results]);

  function choose(nav) {
    onOpenChange(false);
    setQuery("");
    onNavigate(nav);
  }

  return (
    <OriginDrawer open={open} onOpenChange={onOpenChange} title="Search Family OS" description="Find relationships, tasks, events, household members, pool records, meals, Life Lists, and places in the app.">
      <div className="space-y-4">
        <Command>
          <CommandInput autoFocus value={query} placeholder="Search people, interests, tasks, lists..." onChange={event => setQuery(event.target.value)} />
          <CommandList>
            {!normalizedQuery && <CommandEmpty>Start typing to find a task, event, list, person, or app area.</CommandEmpty>}
            {normalizedQuery && !results.length && <CommandEmpty>No matching results. Try a task title, list item, family member, event name, or Settings.</CommandEmpty>}
            {groupedResults.map(group => (
              <CommandGroup key={group.type} heading={group.type}>
                {group.items.map((result, index) => (
                  <CommandItem key={`${result.type}-${result.label}-${index}`} onClick={() => choose(result.nav)}>
                    {resultIcon(result.type)}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-foreground">{result.label}</span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">{result.detail}</span>
                    </span>
                    <Badge variant="blue">{result.type}</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
        <Button type="button" variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
      </div>
    </OriginDrawer>
  );
}
