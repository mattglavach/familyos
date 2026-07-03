import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Settings, UserRound, ListTodo, ListChecks, ShoppingCart, Utensils } from "lucide-react";
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
  { label: "Shopping", detail: "Shared lists, shopping items, and pantry inventory", nav: "shopping", type: "Navigation" },
  { label: "Meal Planning", detail: "Recipes, meal plans, assignments, and shopping prep", nav: "meal-planning", type: "Navigation" },
  { label: "Life Lists", detail: "Lists for ideas, media, places, gifts, and future plans", nav: "life-lists", type: "Navigation" },
  { label: "Household settings", detail: "Members, invites, roles, and defaults", nav: "settings", type: "Navigation" },
  { label: "More modules", detail: "Finance, Pool, College, and future modules", nav: "more", type: "Navigation" },
];

function includesQuery(value, query) {
  return String(value || "").toLowerCase().includes(query);
}

function resultIcon(type) {
  if (type === "Tasks") return <ListTodo className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Shopping") return <ShoppingCart className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Meal Planning") return <Utensils className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Life Lists") return <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Calendar") return <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />;
  if (type === "Household") return <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />;
  return <Settings className="h-4 w-4 text-primary" aria-hidden="true" />;
}

export function GlobalSearch({ open, onOpenChange, calendarEvents, onNavigate }) {
  const [query, setQuery] = useState("");
  const taskTable = useTable("tasks", "due_date", true);
  const listTable = useTable("life_lists", "updated_at");
  const itemTable = useTable("life_list_items", "updated_at");
  const shoppingListTable = useTable("shopping_lists", "updated_at");
  const shoppingItemTable = useTable("shopping_items", "updated_at");
  const pantryTable = useTable("pantry_items", "updated_at");
  const mealPlanTable = useTable("meal_plans", "updated_at");
  const recipeTable = useTable("recipes", "updated_at");
  const mealAssignmentTable = useTable("meal_assignments", "meal_date", true);
  const family = useFamilyMembers();
  const reloadTasks = taskTable.reload;
  const reloadLists = listTable.reload;
  const reloadItems = itemTable.reload;
  const reloadShoppingLists = shoppingListTable.reload;
  const reloadShoppingItems = shoppingItemTable.reload;
  const reloadPantry = pantryTable.reload;
  const reloadMealPlans = mealPlanTable.reload;
  const reloadRecipes = recipeTable.reload;
  const reloadMealAssignments = mealAssignmentTable.reload;
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (!open) return;
    reloadTasks();
    reloadLists();
    reloadItems();
    reloadShoppingLists();
    reloadShoppingItems();
    reloadPantry();
    reloadMealPlans();
    reloadRecipes();
    reloadMealAssignments();
  }, [open, reloadItems, reloadLists, reloadMealAssignments, reloadMealPlans, reloadPantry, reloadRecipes, reloadShoppingItems, reloadShoppingLists, reloadTasks]);

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
    const listResults = listTable.data
      .filter(list => !list.archived && includesQuery(`${list.name} ${list.description} ${list.category} ${list.visibility}`, normalizedQuery))
      .slice(0, 6)
      .map(list => ({ type: "Life Lists", label: list.name || "Untitled list", detail: `${list.category || "List"} - ${list.visibility || "household"}`, nav: "life-lists" }));
    const itemResults = itemTable.data
      .filter(item => !item.archived && item.status !== "archived" && includesQuery(`${item.title} ${item.description} ${(item.tags || []).join?.(" ") || item.tags} ${item.link_url}`, normalizedQuery))
      .slice(0, 6)
      .map(item => ({ type: "Life Lists", label: item.title || "Untitled item", detail: `${item.status || "planned"} item`, nav: "life-lists" }));
    const shoppingListResults = shoppingListTable.data
      .filter(list => !list.archived && includesQuery(`${list.name} ${list.description} ${list.category} ${list.visibility}`, normalizedQuery))
      .slice(0, 6)
      .map(list => ({ type: "Shopping", label: list.name || "Shopping list", detail: `${list.category || "List"} - ${list.visibility || "household"}`, nav: "shopping" }));
    const shoppingItemResults = shoppingItemTable.data
      .filter(item => !item.archived && includesQuery(`${item.name} ${item.notes} ${item.category} ${item.unit}`, normalizedQuery))
      .slice(0, 6)
      .map(item => ({ type: "Shopping", label: item.name || "Shopping item", detail: item.purchased ? "Purchased item" : "Needed item", nav: "shopping" }));
    const pantryResults = pantryTable.data
      .filter(item => !item.archived && includesQuery(`${item.name} ${item.notes} ${item.category} ${item.unit}`, normalizedQuery))
      .slice(0, 6)
      .map(item => ({ type: "Shopping", label: item.name || "Pantry item", detail: item.reorder_flag ? "Pantry reorder" : "Pantry item", nav: "shopping" }));
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
    const navResults = navigationTargets
      .filter(item => includesQuery(`${item.label} ${item.detail}`, normalizedQuery));
    return [...taskResults, ...eventResults, ...memberResults, ...listResults, ...itemResults, ...shoppingListResults, ...shoppingItemResults, ...pantryResults, ...mealPlanResults, ...recipeResults, ...mealAssignmentResults, ...navResults].slice(0, 18);
  }, [calendarEvents, family.members, itemTable.data, listTable.data, mealAssignmentTable.data, mealPlanTable.data, normalizedQuery, pantryTable.data, recipeTable.data, shoppingItemTable.data, shoppingListTable.data, taskTable.data]);

  function choose(nav) {
    onOpenChange(false);
    setQuery("");
    onNavigate(nav);
  }

  return (
    <OriginDrawer open={open} onOpenChange={onOpenChange} title="Search Family OS" description="Find tasks, events, household members, shopping, meals, Life Lists, and places in the app.">
      <div className="space-y-4">
        <Command>
          <CommandInput autoFocus value={query} placeholder="Search tasks, events, shopping, meals..." onChange={event => setQuery(event.target.value)} />
          <CommandList>
            {!normalizedQuery && <CommandEmpty>Start typing to find a task, event, list, person, or app area.</CommandEmpty>}
            {normalizedQuery && !results.length && <CommandEmpty>No matching results. Try a task title, list item, family member, event name, or Settings.</CommandEmpty>}
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
