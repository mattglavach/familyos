import { useMemo, useState } from "react";
import { Archive, CalendarDays, Check, ChevronRight, Copy, Heart, Plus, Search, ShoppingCart, Star, Utensils } from "lucide-react";
import { useHousehold } from "../../context/HouseholdContext";
import { roleCanManage } from "../../hooks/useHouseholdCollaboration";
import { useTable } from "../../hooks/useTable";
import { formatUserFacingError } from "../../lib/userFacingErrors";
import { OriginDrawer } from "../../components/origin/drawer";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { FormError, FormGroup, FormHelp, FormRow, FormSection } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { ChipGroup, SegmentedControl } from "../../components/ui/segmented-control";
import { SectionHeader } from "../../components/ui/section-header";
import { COLORS, S } from "../../theme";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];
const RECIPE_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "other"];
const DIFFICULTY = ["easy", "medium", "hard"];
const VISIBILITY = [{ value: "household", label: "Household" }, { value: "personal", label: "Personal" }, { value: "shared", label: "Shared" }];

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function weekStart(dateString = todayIso()) {
  const date = new Date(`${dateString}T00:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return date.toISOString().split("T")[0];
}

function label(value) {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function splitTags(value) {
  return String(value || "").split(",").map(tag => tag.trim()).filter(Boolean);
}

function canEditRecord(record, userId, canManageShared) {
  const visibility = record?.visibility || "household";
  if (visibility === "personal") return record?.owner_user_id === userId || !record?.owner_user_id;
  return canManageShared && ["household", "shared"].includes(visibility);
}

function isPantryAvailable(ingredient, pantryItems) {
  const linked = ingredient.pantry_item_id ? pantryItems.find(item => item.id === ingredient.pantry_item_id) : null;
  const byName = pantryItems.find(item => normalize(item.name) === normalize(ingredient.ingredient));
  const pantry = linked || byName;
  if (!pantry || pantry.archived) return false;
  return Number(pantry.current_quantity || 0) > 0 && !pantry.reorder_flag;
}

function StatCard({ label: statLabel, value, color }) {
  return (
    <Card style={{ borderTop: `3px solid ${color}` }}>
      <CardContent className="p-3 text-center">
        <div className="text-xl font-extrabold" style={{ color }}>{value}</div>
        <div className="mt-1 text-xs font-semibold text-muted-foreground">{statLabel}</div>
      </CardContent>
    </Card>
  );
}

function ToggleRow({ checked, label: rowLabel, onClick }) {
  return (
    <button type="button" className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-3 text-left text-sm font-semibold text-secondary-foreground" onClick={onClick}>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? "border-violet-400 bg-violet-500 text-white" : "border-muted-foreground"}`}>
        {checked && <Check size={14} aria-hidden="true" />}
      </span>
      {rowLabel}
    </button>
  );
}

export function MealPlanning() {
  const household = useHousehold();
  const userId = household.user?.id;
  const canManageShared = roleCanManage(household.membership?.role);
  const plans = useTable("meal_plans", "updated_at");
  const recipes = useTable("recipes", "updated_at");
  const ingredients = useTable("recipe_ingredients", "sort_order", true);
  const assignments = useTable("meal_assignments", "meal_date", true);
  const pantry = useTable("pantry_items", "updated_at");
  const shoppingLists = useTable("shopping_lists", "updated_at");
  const shoppingItems = useTable("shopping_items", "updated_at");
  const [view, setView] = useState("week");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("active");
  const [week, setWeek] = useState(weekStart());
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [recipeForm, setRecipeForm] = useState(null);
  const [planForm, setPlanForm] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState(null);
  const [ingredientForm, setIngredientForm] = useState(null);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [shoppingChoice, setShoppingChoice] = useState({});
  const [error, setError] = useState("");

  const visiblePlans = plans.data.filter(plan => filter === "archived" ? plan.archived : !plan.archived);
  const activePlan = visiblePlans.find(plan => plan.id === selectedPlanId) || visiblePlans[0] || null;
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(week, index));
  const planAssignments = assignments.data.filter(item => item.meal_plan_id === activePlan?.id && !item.archived);
  const weekAssignments = planAssignments.filter(item => weekDays.includes(item.meal_date));
  const recipeById = Object.fromEntries(recipes.data.map(recipe => [recipe.id, recipe]));
  const ingredientsByRecipe = ingredients.data.reduce((map, item) => {
    map[item.recipe_id] = [...(map[item.recipe_id] || []), item];
    return map;
  }, {});

  const filteredRecipes = recipes.data
    .filter(recipe => filter === "archived" ? recipe.archived : !recipe.archived)
    .filter(recipe => filter !== "favorites" || recipe.favorite)
    .filter(recipe => !query.trim() || normalize(`${recipe.title} ${recipe.description} ${recipe.category} ${(recipe.tags || []).join?.(" ") || recipe.tags}`).includes(normalize(query)));

  const filteredPlans = visiblePlans.filter(plan => !query.trim() || normalize(`${plan.name} ${plan.description} ${plan.notes} ${plan.visibility}`).includes(normalize(query)));
  const writablePlans = plans.data.filter(plan => !plan.archived && canEditRecord(plan, userId, canManageShared));
  const writableShoppingLists = shoppingLists.data.filter(list => {
    if (list.archived) return false;
    const visibility = list.visibility || "household";
    if (visibility === "personal") return list.owner_user_id === userId || !list.owner_user_id;
    return canManageShared;
  });
  const missingIngredients = useMemo(() => {
    return weekAssignments.flatMap(assignment => {
      const recipe = recipeById[assignment.recipe_id];
      if (!recipe) return [];
      return (ingredientsByRecipe[recipe.id] || [])
        .filter(item => !item.optional && !isPantryAvailable(item, pantry.data))
        .map(item => ({ ...item, recipe, assignment }));
    });
  }, [ingredientsByRecipe, pantry.data, recipeById, weekAssignments]);
  const shoppingPreview = missingIngredients.map(item => {
    const duplicate = shoppingItems.data.find(existing =>
      !existing.archived &&
      !existing.purchased &&
      (!shoppingChoice.list_id || existing.list_id === shoppingChoice.list_id) &&
      normalize(existing.name) === normalize(item.ingredient)
    );
    return { ...item, duplicate };
  });
  const selectedPreview = shoppingPreview.filter(item => shoppingChoice[item.id] !== false && !item.duplicate);
  const canCreate = canManageShared || true;
  const canEditPlan = activePlan && canEditRecord(activePlan, userId, canManageShared);
  const tonight = weekAssignments.find(item => item.meal_date === todayIso() && item.meal_type === "dinner");

  function openRecipe(recipe = null) {
    setError("");
    setRecipeForm(recipe ? { ...recipe, tagsText: (recipe.tags || []).join?.(", ") || "" } : {
      title: "", description: "", category: "", meal_type: "dinner", prep_time_minutes: "", cook_time_minutes: "", servings: "", difficulty: "easy",
      instructions: "", notes: "", source_url: "", tagsText: "", visibility: canManageShared ? "household" : "personal", favorite: false, archived: false,
    });
  }

  function openPlan(plan = null) {
    setError("");
    setPlanForm(plan ? { ...plan } : {
      name: "", description: "", plan_type: "weekly", start_date: week, end_date: addDays(week, 6),
      visibility: canManageShared ? "household" : "personal", favorite: false, archived: false, notes: "",
    });
  }

  function openAssignment(day = todayIso(), mealType = "dinner", assignment = null) {
    setError("");
    setAssignmentForm(assignment ? { ...assignment } : { meal_plan_id: activePlan?.id || writablePlans[0]?.id || "", recipe_id: "", title: "", meal_date: day, meal_type: mealType, notes: "", favorite: false, archived: false });
  }

  function openIngredient(recipe, ingredient = null) {
    setError("");
    setIngredientForm(ingredient ? { ...ingredient } : { recipe_id: recipe.id, ingredient: "", quantity: 1, unit: "", optional: false, pantry_item_id: "", notes: "" });
  }

  async function saveRecipe() {
    setError("");
    if (!recipeForm.title?.trim()) { setError("Recipe title is required."); return; }
    if (!canManageShared && (recipeForm.visibility || "personal") !== "personal") { setError("Your role can create personal recipes only."); return; }
    const row = {
      title: recipeForm.title.trim(),
      description: recipeForm.description || "",
      category: recipeForm.category || "",
      meal_type: recipeForm.meal_type || "dinner",
      prep_time_minutes: Number(recipeForm.prep_time_minutes || 0),
      cook_time_minutes: Number(recipeForm.cook_time_minutes || 0),
      servings: Number(recipeForm.servings || 0),
      difficulty: recipeForm.difficulty || "easy",
      instructions: recipeForm.instructions || "",
      notes: recipeForm.notes || "",
      source_url: recipeForm.source_url || "",
      tags: splitTags(recipeForm.tagsText),
      visibility: recipeForm.visibility || (canManageShared ? "household" : "personal"),
      favorite: Boolean(recipeForm.favorite),
      archived: Boolean(recipeForm.archived),
      sort_order: recipes.data.length + 1,
      updated_at: new Date().toISOString(),
    };
    try {
      if (recipeForm.id) await recipes.update(recipeForm.id, row);
      else await recipes.insert(row);
      setRecipeForm(null);
    } catch (err) {
      setError(formatUserFacingError(err, "Recipe could not be saved right now."));
    }
  }

  async function savePlan() {
    setError("");
    if (!planForm.name?.trim()) { setError("Meal plan name is required."); return; }
    if (!canManageShared && (planForm.visibility || "personal") !== "personal") { setError("Your role can create personal plans only."); return; }
    const row = {
      name: planForm.name.trim(),
      description: planForm.description || "",
      plan_type: planForm.plan_type || "weekly",
      start_date: planForm.start_date || null,
      end_date: planForm.end_date || null,
      visibility: planForm.visibility || (canManageShared ? "household" : "personal"),
      favorite: Boolean(planForm.favorite),
      archived: Boolean(planForm.archived),
      notes: planForm.notes || "",
      sort_order: plans.data.length + 1,
      updated_at: new Date().toISOString(),
    };
    try {
      const saved = planForm.id ? await plans.update(planForm.id, row) : await plans.insert(row);
      if (!planForm.id && saved?.id) setSelectedPlanId(saved.id);
      setPlanForm(null);
    } catch (err) {
      setError(formatUserFacingError(err, "Meal plan could not be saved right now."));
    }
  }

  async function saveAssignment() {
    setError("");
    if (!assignmentForm.meal_plan_id) { setError("Choose a meal plan first."); return; }
    if (!assignmentForm.recipe_id && !assignmentForm.title?.trim()) { setError("Choose a recipe or add a meal title."); return; }
    const plan = plans.data.find(item => item.id === assignmentForm.meal_plan_id);
    if (!canEditRecord(plan, userId, canManageShared)) { setError("Choose a meal plan you can update."); return; }
    const recipe = recipes.data.find(item => item.id === assignmentForm.recipe_id);
    const row = {
      meal_plan_id: assignmentForm.meal_plan_id,
      recipe_id: assignmentForm.recipe_id || null,
      title: assignmentForm.title || recipe?.title || "",
      meal_date: assignmentForm.meal_date,
      meal_type: assignmentForm.meal_type || "dinner",
      notes: assignmentForm.notes || "",
      favorite: Boolean(assignmentForm.favorite),
      archived: Boolean(assignmentForm.archived),
      updated_at: new Date().toISOString(),
    };
    try {
      if (assignmentForm.id) await assignments.update(assignmentForm.id, row);
      else await assignments.insert(row);
      await plans.update(assignmentForm.meal_plan_id, { updated_at: new Date().toISOString() });
      setAssignmentForm(null);
    } catch (err) {
      setError(formatUserFacingError(err, "Meal assignment could not be saved right now."));
    }
  }

  async function saveIngredient() {
    setError("");
    if (!ingredientForm.ingredient?.trim()) { setError("Ingredient name is required."); return; }
    const recipe = recipes.data.find(item => item.id === ingredientForm.recipe_id);
    if (!canEditRecord(recipe, userId, canManageShared)) { setError("Choose a recipe you can update."); return; }
    const row = {
      recipe_id: ingredientForm.recipe_id,
      ingredient: ingredientForm.ingredient.trim(),
      quantity: Number(ingredientForm.quantity || 0),
      unit: ingredientForm.unit || "",
      optional: Boolean(ingredientForm.optional),
      pantry_item_id: ingredientForm.pantry_item_id || null,
      notes: ingredientForm.notes || "",
      sort_order: ingredients.data.filter(item => item.recipe_id === ingredientForm.recipe_id).length + 1,
      updated_at: new Date().toISOString(),
    };
    try {
      if (ingredientForm.id) await ingredients.update(ingredientForm.id, row);
      else await ingredients.insert(row);
      await recipes.update(ingredientForm.recipe_id, { updated_at: new Date().toISOString() });
      setIngredientForm(null);
    } catch (err) {
      setError(formatUserFacingError(err, "Ingredient could not be saved right now."));
    }
  }

  async function copyAssignments(offset) {
    if (!activePlan || !canEditPlan) return;
    const sourceDates = weekDays.map(day => addDays(day, offset));
    const source = planAssignments.filter(item => sourceDates.includes(item.meal_date));
    const existingKeys = new Set(planAssignments.map(item => `${item.meal_date}-${item.meal_type}`));
    for (const item of source) {
      const targetDate = addDays(item.meal_date, -offset);
      if (existingKeys.has(`${targetDate}-${item.meal_type}`)) continue;
      await assignments.insert({ meal_plan_id: activePlan.id, recipe_id: item.recipe_id, title: item.title, meal_date: targetDate, meal_type: item.meal_type, notes: item.notes || "", favorite: false, archived: false });
    }
    await plans.update(activePlan.id, { updated_at: new Date().toISOString() });
  }

  async function generateShoppingItems() {
    setError("");
    if (!selectedPreview.length) { setError("No missing ingredients are selected."); return; }
    try {
      let targetListId = shoppingChoice.list_id;
      if (!targetListId) {
        const created = await shoppingLists.insert({
          name: shoppingChoice.new_name || `Meal Plan Shopping ${week}`,
          description: "Reviewed from Meal Planning.",
          category: "Grocery",
          visibility: canManageShared ? "household" : "personal",
          favorite: false,
          archived: false,
          color: "#3DB87A",
          icon: "S",
          meal_plan_ref: activePlan?.id || null,
          sort_order: shoppingLists.data.length + 1,
          updated_at: new Date().toISOString(),
        });
        targetListId = created?.id;
      }
      if (!targetListId) { setError("Choose a shopping list or create a new one."); return; }
      for (const item of selectedPreview) {
        await shoppingItems.insert({
          list_id: targetListId,
          name: item.ingredient,
          quantity: item.quantity || 1,
          unit: item.unit || "",
          category: item.recipe.category || "Grocery",
          priority: "med",
          purchased: false,
          notes: `For ${item.recipe.title}`,
          favorite: false,
          archived: false,
          recipe_ref: item.recipe.id,
          meal_plan_ref: activePlan?.id || null,
          sort_order: shoppingItems.data.filter(existing => existing.list_id === targetListId).length + 1,
          updated_at: new Date().toISOString(),
        });
      }
      setShoppingOpen(false);
      setShoppingChoice({});
    } catch (err) {
      setError(formatUserFacingError(err, "Shopping items could not be added right now."));
    }
  }

  const loading = [plans, recipes, ingredients, assignments, pantry, shoppingLists, shoppingItems].some(table => table.loading);

  return (
    <div style={S.screen} className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
            <Utensils className="h-4 w-4" aria-hidden="true" />
            Meal Planning
          </div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">Meals, recipes, and shopping prep</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Plan the week, track recipe ingredients, and review missing groceries before adding them to Shopping.</p>
        </div>
        {canCreate && <Button type="button" size="icon-sm" aria-label="Add meal planning item" onClick={() => view === "recipes" ? openRecipe() : view === "plans" ? openPlan() : openAssignment()}><Plus className="h-4 w-4" aria-hidden="true" /></Button>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Tonight" value={tonight ? "Planned" : "Open"} color={tonight ? COLORS.green : COLORS.amber} />
        <StatCard label="Missing" value={missingIngredients.length} color={missingIngredients.length ? COLORS.amber : COLORS.green} />
        <StatCard label="Recipes" value={recipes.data.filter(item => !item.archived).length} color={COLORS.blue} />
      </div>

      <SegmentedControl value={view} options={[{ value: "week", label: "Week" }, { value: "recipes", label: "Recipes" }, { value: "plans", label: "Plans" }]} ariaLabel="Meal planning view" onValueChange={setView} />

      {view === "week" && (
        <section className="space-y-3">
          <Card>
            <CardContent className="space-y-3 p-4">
              <FormGroup>
                <Label>Meal Plan</Label>
                <select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={activePlan?.id || ""} onChange={event => setSelectedPlanId(event.target.value)}>
                  {visiblePlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                </select>
              </FormGroup>
              <FormRow>
                <FormGroup>
                  <Label>Week</Label>
                  <Input type="date" value={week} onChange={event => setWeek(weekStart(event.target.value))} />
                </FormGroup>
                <FormGroup>
                  <Label>Actions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="secondary" size="sm" disabled={!canEditPlan} onClick={() => copyAssignments(1)}><Copy className="h-4 w-4" aria-hidden="true" />Day</Button>
                    <Button type="button" variant="secondary" size="sm" disabled={!canEditPlan} onClick={() => copyAssignments(7)}><Copy className="h-4 w-4" aria-hidden="true" />Week</Button>
                  </div>
                </FormGroup>
              </FormRow>
              <Button type="button" className="w-full" disabled={!canEditPlan || missingIngredients.length === 0} onClick={() => setShoppingOpen(true)}>
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />Review Shopping Items
              </Button>
            </CardContent>
          </Card>
          {!activePlan && !loading ? (
            <Card><EmptyStatePanel title="No meal plans yet" detail="Create a weekly plan before assigning meals." action="Create plan" onAction={() => openPlan()} className="py-8" /></Card>
          ) : weekDays.map(day => (
            <Card key={day}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />{new Date(`${day}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0">
                {MEAL_TYPES.map((mealType, index) => {
                  const item = weekAssignments.find(row => row.meal_date === day && row.meal_type === mealType);
                  const recipe = recipeById[item?.recipe_id];
                  const recipeIngredients = recipe ? ingredientsByRecipe[recipe.id] || [] : [];
                  const missing = recipeIngredients.filter(ingredient => !ingredient.optional && !isPantryAvailable(ingredient, pantry.data)).length;
                  return (
                    <button key={`${day}-${mealType}`} type="button" className={`flex min-h-14 w-full items-center gap-3 py-2 text-left ${index < MEAL_TYPES.length - 1 ? "border-b border-border" : ""}`} onClick={() => canEditPlan && openAssignment(day, mealType, item)}>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item ? COLORS.green : COLORS.slate }} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label(mealType)}</span>
                        <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">{recipe?.title || item?.title || "Assign meal"}</span>
                        {recipe && <span className="mt-0.5 block text-xs text-muted-foreground">{missing ? `${missing} missing ingredient${missing > 1 ? "s" : ""}` : "Pantry looks covered"}</span>}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {view !== "week" && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" placeholder={view === "recipes" ? "Search recipes" : "Search meal plans"} value={query} onChange={event => setQuery(event.target.value)} />
          </div>
          <ChipGroup value={filter} options={[{ value: "active", label: "Active" }, { value: "favorites", label: "Favorites" }, { value: "archived", label: "Archived" }]} ariaLabel="Meal planning filter" onValueChange={setFilter} />
        </div>
      )}

      {view === "recipes" && (
        <section className="space-y-3">
          <SectionHeader title="Recipes" count={filteredRecipes.length} action={<Button type="button" size="xs" onClick={() => openRecipe()}>Add</Button>} />
          {filteredRecipes.length ? filteredRecipes.map(recipe => {
            const recipeIngredients = ingredientsByRecipe[recipe.id] || [];
            const editable = canEditRecord(recipe, userId, canManageShared);
            return (
              <Card key={recipe.id}>
                <CardContent className="space-y-3 p-4">
                  <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => openRecipe(recipe)}>
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: recipe.favorite ? COLORS.amber : COLORS.blue }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-extrabold text-foreground">{recipe.title}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{label(recipe.meal_type)} · {recipe.category || "Recipe"} · {label(recipe.difficulty)}</span>
                    </span>
                    {recipe.favorite && <Star className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />}
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {(recipe.tags || []).slice(0, 4).map(tag => <Badge key={tag} variant="blue">{tag}</Badge>)}
                    <Badge variant="slate">{recipeIngredients.length} ingredients</Badge>
                  </div>
                  <div className="space-y-2">
                    {recipeIngredients.slice(0, 5).map(item => (
                      <button key={item.id} type="button" className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-secondary px-3 py-2 text-left text-sm" onClick={() => editable && openIngredient(recipe, item)}>
                        <span className="truncate text-foreground">{item.quantity || ""} {item.unit || ""} {item.ingredient}</span>
                        <Badge variant={isPantryAvailable(item, pantry.data) ? "green" : "amber"}>{isPantryAvailable(item, pantry.data) ? "Pantry" : "Missing"}</Badge>
                      </button>
                    ))}
                    {editable && <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => openIngredient(recipe)}>Add Ingredient</Button>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button type="button" variant="secondary" size="sm" disabled={!editable} onClick={() => recipes.update(recipe.id, { favorite: !recipe.favorite })}><Heart className="h-4 w-4" aria-hidden="true" />Fav</Button>
                    <Button type="button" variant="secondary" size="sm" disabled={!editable} onClick={() => recipes.update(recipe.id, { archived: !recipe.archived })}><Archive className="h-4 w-4" aria-hidden="true" />{recipe.archived ? "Restore" : "Archive"}</Button>
                    <Button type="button" size="sm" disabled={!writablePlans.length} onClick={() => openAssignment(todayIso(), recipe.meal_type === "other" ? "dinner" : recipe.meal_type, { recipe_id: recipe.id, title: recipe.title, meal_plan_id: activePlan?.id || writablePlans[0]?.id || "", meal_date: todayIso(), meal_type: recipe.meal_type === "other" ? "dinner" : recipe.meal_type })}>Plan</Button>
                  </div>
                </CardContent>
              </Card>
            );
          }) : <Card><EmptyStatePanel title="No recipes found" detail="Create a recipe with ingredients, notes, and pantry awareness." action="Add recipe" onAction={() => openRecipe()} className="py-8" /></Card>}
        </section>
      )}

      {view === "plans" && (
        <section className="space-y-3">
          <SectionHeader title="Meal Plans" count={filteredPlans.length} action={<Button type="button" size="xs" onClick={() => openPlan()}>Add</Button>} />
          {filteredPlans.length ? filteredPlans.map(plan => (
            <Card key={plan.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { setSelectedPlanId(plan.id); setView("week"); }}>
                  <div className="truncate text-base font-extrabold text-foreground">{plan.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{label(plan.plan_type)} · {label(plan.visibility)}{plan.start_date ? ` · ${plan.start_date}` : ""}</div>
                </button>
                <Button type="button" variant="secondary" size="icon-xs" aria-label="Edit meal plan" onClick={() => openPlan(plan)}><ChevronRight className="h-4 w-4" aria-hidden="true" /></Button>
              </CardContent>
            </Card>
          )) : <Card><EmptyStatePanel title="No meal plans found" detail="Create a weekly or custom plan for the household." action="Create plan" onAction={() => openPlan()} className="py-8" /></Card>}
        </section>
      )}

      <RecipeDrawer form={recipeForm} setForm={setRecipeForm} error={error} canManageShared={canManageShared} onSave={saveRecipe} />
      <PlanDrawer form={planForm} setForm={setPlanForm} error={error} canManageShared={canManageShared} onSave={savePlan} />
      <AssignmentDrawer form={assignmentForm} setForm={setAssignmentForm} error={error} plans={writablePlans} recipes={recipes.data.filter(recipe => !recipe.archived)} onSave={saveAssignment} />
      <IngredientDrawer form={ingredientForm} setForm={setIngredientForm} error={error} pantry={pantry.data.filter(item => !item.archived)} onSave={saveIngredient} />
      <ShoppingReviewDrawer open={shoppingOpen} setOpen={setShoppingOpen} error={error} choice={shoppingChoice} setChoice={setShoppingChoice} lists={writableShoppingLists} preview={shoppingPreview} selectedCount={selectedPreview.length} onSave={generateShoppingItems} />
    </div>
  );
}

function RecipeDrawer({ form, setForm, error, canManageShared, onSave }) {
  return (
    <OriginDrawer open={Boolean(form)} onOpenChange={open => !open && setForm(null)} title={form?.id ? "Edit Recipe" : "Create Recipe"} description="Recipes stay simple and can feed shopping review later.">
      {form && <FormSection>
        <FormGroup><Label>Title</Label><Input value={form.title || ""} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))} /></FormGroup>
        <FormGroup><Label>Description</Label><Input value={form.description || ""} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} /></FormGroup>
        <FormRow><FormGroup><Label>Category</Label><Input placeholder="Pasta, Grill, Family" value={form.category || ""} onChange={event => setForm(prev => ({ ...prev, category: event.target.value }))} /></FormGroup><FormGroup><Label>Meal</Label><ChipGroup value={form.meal_type || "dinner"} options={RECIPE_MEAL_TYPES} ariaLabel="Recipe meal type" onValueChange={meal_type => setForm(prev => ({ ...prev, meal_type }))} /></FormGroup></FormRow>
        <FormRow><FormGroup><Label>Prep</Label><Input type="number" min="0" value={form.prep_time_minutes || ""} onChange={event => setForm(prev => ({ ...prev, prep_time_minutes: event.target.value }))} /></FormGroup><FormGroup><Label>Cook</Label><Input type="number" min="0" value={form.cook_time_minutes || ""} onChange={event => setForm(prev => ({ ...prev, cook_time_minutes: event.target.value }))} /></FormGroup></FormRow>
        <FormRow><FormGroup><Label>Servings</Label><Input type="number" min="0" step="0.5" value={form.servings || ""} onChange={event => setForm(prev => ({ ...prev, servings: event.target.value }))} /></FormGroup><FormGroup><Label>Difficulty</Label><ChipGroup value={form.difficulty || "easy"} options={DIFFICULTY} ariaLabel="Recipe difficulty" onValueChange={difficulty => setForm(prev => ({ ...prev, difficulty }))} /></FormGroup></FormRow>
        <FormGroup><Label>Visibility</Label><SegmentedControl value={form.visibility || (canManageShared ? "household" : "personal")} options={canManageShared ? VISIBILITY : [{ value: "personal", label: "Personal" }]} ariaLabel="Recipe visibility" onValueChange={visibility => setForm(prev => ({ ...prev, visibility }))} /></FormGroup>
        <FormGroup><Label>Tags</Label><Input placeholder="weeknight, family" value={form.tagsText || ""} onChange={event => setForm(prev => ({ ...prev, tagsText: event.target.value }))} /></FormGroup>
        <FormGroup><Label>Instructions</Label><textarea className="min-h-28 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.instructions || ""} onChange={event => setForm(prev => ({ ...prev, instructions: event.target.value }))} /></FormGroup>
        <FormGroup><Label>Notes</Label><Input value={form.notes || ""} onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))} /></FormGroup>
        <ToggleRow checked={form.favorite} label="Favorite recipe" onClick={() => setForm(prev => ({ ...prev, favorite: !prev.favorite }))} />
        {form.id && <ToggleRow checked={form.archived} label={form.archived ? "Archived" : "Archive recipe"} onClick={() => setForm(prev => ({ ...prev, archived: !prev.archived }))} />}
        <Button type="button" className="w-full" onClick={onSave}>Save Recipe</Button>
        {error && <FormError>{error}</FormError>}
      </FormSection>}
    </OriginDrawer>
  );
}

function PlanDrawer({ form, setForm, error, canManageShared, onSave }) {
  return (
    <OriginDrawer open={Boolean(form)} onOpenChange={open => !open && setForm(null)} title={form?.id ? "Edit Meal Plan" : "Create Meal Plan"} description="Plans organize the week and control assignment permissions.">
      {form && <FormSection>
        <FormGroup><Label>Name</Label><Input value={form.name || ""} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} /></FormGroup>
        <FormGroup><Label>Description</Label><Input value={form.description || ""} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} /></FormGroup>
        <FormGroup><Label>Type</Label><SegmentedControl value={form.plan_type || "weekly"} options={[{ value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }, { value: "custom", label: "Custom" }]} ariaLabel="Meal plan type" onValueChange={plan_type => setForm(prev => ({ ...prev, plan_type }))} /></FormGroup>
        <FormRow><FormGroup><Label>Start</Label><Input type="date" value={form.start_date || ""} onChange={event => setForm(prev => ({ ...prev, start_date: event.target.value }))} /></FormGroup><FormGroup><Label>End</Label><Input type="date" value={form.end_date || ""} onChange={event => setForm(prev => ({ ...prev, end_date: event.target.value }))} /></FormGroup></FormRow>
        <FormGroup><Label>Visibility</Label><SegmentedControl value={form.visibility || (canManageShared ? "household" : "personal")} options={canManageShared ? VISIBILITY : [{ value: "personal", label: "Personal" }]} ariaLabel="Meal plan visibility" onValueChange={visibility => setForm(prev => ({ ...prev, visibility }))} /></FormGroup>
        <FormGroup><Label>Notes</Label><Input value={form.notes || ""} onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))} /></FormGroup>
        <ToggleRow checked={form.favorite} label="Favorite plan" onClick={() => setForm(prev => ({ ...prev, favorite: !prev.favorite }))} />
        {form.id && <ToggleRow checked={form.archived} label={form.archived ? "Archived" : "Archive plan"} onClick={() => setForm(prev => ({ ...prev, archived: !prev.archived }))} />}
        <Button type="button" className="w-full" onClick={onSave}>Save Meal Plan</Button>
        {error && <FormError>{error}</FormError>}
      </FormSection>}
    </OriginDrawer>
  );
}

function AssignmentDrawer({ form, setForm, error, plans, recipes, onSave }) {
  return (
    <OriginDrawer open={Boolean(form)} onOpenChange={open => !open && setForm(null)} title={form?.id ? "Edit Meal" : "Assign Meal"} description="Choose a recipe or add a simple meal title.">
      {form && <FormSection>
        <FormGroup><Label>Meal Plan</Label><select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.meal_plan_id || ""} onChange={event => setForm(prev => ({ ...prev, meal_plan_id: event.target.value }))}><option value="">Choose a plan</option>{plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></FormGroup>
        <FormRow><FormGroup><Label>Date</Label><Input type="date" value={form.meal_date || todayIso()} onChange={event => setForm(prev => ({ ...prev, meal_date: event.target.value }))} /></FormGroup><FormGroup><Label>Meal</Label><ChipGroup value={form.meal_type || "dinner"} options={MEAL_TYPES} ariaLabel="Meal type" onValueChange={meal_type => setForm(prev => ({ ...prev, meal_type }))} /></FormGroup></FormRow>
        <FormGroup><Label>Recipe</Label><select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.recipe_id || ""} onChange={event => { const recipe = recipes.find(item => item.id === event.target.value); setForm(prev => ({ ...prev, recipe_id: event.target.value, title: recipe?.title || prev.title })); }}><option value="">No recipe</option>{recipes.map(recipe => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}</select></FormGroup>
        <FormGroup><Label>Title</Label><Input value={form.title || ""} onChange={event => setForm(prev => ({ ...prev, title: event.target.value }))} /></FormGroup>
        <FormGroup><Label>Notes</Label><Input value={form.notes || ""} onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))} /></FormGroup>
        <Button type="button" className="w-full" onClick={onSave}>Save Meal</Button>
        {error && <FormError>{error}</FormError>}
      </FormSection>}
    </OriginDrawer>
  );
}

function IngredientDrawer({ form, setForm, error, pantry, onSave }) {
  return (
    <OriginDrawer open={Boolean(form)} onOpenChange={open => !open && setForm(null)} title={form?.id ? "Edit Ingredient" : "Add Ingredient"} description="Link pantry items when the household already keeps this on hand.">
      {form && <FormSection>
        <FormGroup><Label>Name</Label><Input value={form.ingredient || ""} onChange={event => setForm(prev => ({ ...prev, ingredient: event.target.value }))} /></FormGroup>
        <FormRow><FormGroup><Label>Quantity</Label><Input type="number" min="0" step="0.25" value={form.quantity || ""} onChange={event => setForm(prev => ({ ...prev, quantity: event.target.value }))} /></FormGroup><FormGroup><Label>Unit</Label><Input value={form.unit || ""} onChange={event => setForm(prev => ({ ...prev, unit: event.target.value }))} /></FormGroup></FormRow>
        <FormGroup><Label>Pantry Link</Label><select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.pantry_item_id || ""} onChange={event => setForm(prev => ({ ...prev, pantry_item_id: event.target.value }))}><option value="">No pantry link</option>{pantry.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormGroup>
        <ToggleRow checked={form.optional} label="Optional ingredient" onClick={() => setForm(prev => ({ ...prev, optional: !prev.optional }))} />
        <FormGroup><Label>Notes</Label><Input value={form.notes || ""} onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))} /></FormGroup>
        <Button type="button" className="w-full" onClick={onSave}>Save Ingredient</Button>
        {error && <FormError>{error}</FormError>}
      </FormSection>}
    </OriginDrawer>
  );
}

function ShoppingReviewDrawer({ open, setOpen, error, choice, setChoice, lists, preview, selectedCount, onSave }) {
  return (
    <OriginDrawer open={open} onOpenChange={setOpen} title="Review Shopping Items" description="Confirm missing ingredients before anything is added to Shopping.">
      <FormSection>
        <FormGroup><Label>Shopping List</Label><select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={choice.list_id || ""} onChange={event => setChoice(prev => ({ ...prev, list_id: event.target.value }))}><option value="">Create new list</option>{lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}</select></FormGroup>
        {!choice.list_id && <FormGroup><Label>New List Name</Label><Input value={choice.new_name || ""} placeholder="Meal Plan Shopping" onChange={event => setChoice(prev => ({ ...prev, new_name: event.target.value }))} /></FormGroup>}
        <div className="space-y-2">
          {preview.length ? preview.map(item => (
            <button key={item.id} type="button" disabled={Boolean(item.duplicate)} className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-3 text-left disabled:opacity-70" onClick={() => setChoice(prev => ({ ...prev, [item.id]: prev[item.id] === false ? true : false }))}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${choice[item.id] !== false && !item.duplicate ? "border-emerald-400 bg-emerald-500 text-white" : "border-muted-foreground"}`}>{choice[item.id] !== false && !item.duplicate && <Check size={14} aria-hidden="true" />}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-foreground">{item.quantity || ""} {item.unit || ""} {item.ingredient}</span><span className="mt-1 block text-xs text-muted-foreground">{item.duplicate ? "Already on an active shopping list" : `For ${item.recipe.title}`}</span></span>
            </button>
          )) : <FormHelp>No missing ingredients for this week.</FormHelp>}
        </div>
        <Button type="button" className="w-full" disabled={!selectedCount} onClick={onSave}>Add {selectedCount} Item{selectedCount === 1 ? "" : "s"}</Button>
        {error && <FormError>{error}</FormError>}
      </FormSection>
    </OriginDrawer>
  );
}
