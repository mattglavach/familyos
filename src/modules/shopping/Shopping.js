import { useEffect, useMemo, useState } from "react";
import { Archive, Check, ChevronLeft, ChevronRight, Heart, Package, Plus, Search, ShoppingCart, Star, Trash2 } from "lucide-react";
import { Badge, StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { FormGroup, FormHelp, FormRow, FormSection, NotesField, NumberField, SaveCancelFooter, ToggleField, ValidationSummary } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { ChipGroup, SegmentedControl } from "../../components/ui/segmented-control";
import { SectionHeader } from "../../components/ui/section-header";
import { OriginDrawer } from "../../components/origin/drawer";
import { useHousehold } from "../../context/HouseholdContext";
import { roleCanManage, roleLabel } from "../../hooks/useHouseholdCollaboration";
import { useTable } from "../../hooks/useTable";
import { formatUserFacingError } from "../../lib/userFacingErrors";
import { COLORS, S } from "../../theme";

const LIST_VISIBILITY = [
  { value: "household", label: "Household" },
  { value: "personal", label: "Personal" },
  { value: "shared", label: "Shared" },
];
const CATEGORIES = ["Grocery", "Household", "Costco", "Pharmacy", "Pet", "School", "Other"];
const PRIORITIES = ["low", "med", "high"];
const ITEM_FILTERS = [
  { value: "needed", label: "Needed" },
  { value: "favorites", label: "Favorites" },
  { value: "purchased", label: "Purchased" },
  { value: "archived", label: "Archived" },
];
const PANTRY_FILTERS = [
  { value: "active", label: "Active" },
  { value: "low", label: "Low" },
  { value: "favorites", label: "Favorites" },
  { value: "archived", label: "Archived" },
];
const SORTS = [
  { value: "manual", label: "Manual" },
  { value: "alpha", label: "A-Z" },
  { value: "priority", label: "Priority" },
  { value: "category", label: "Category" },
  { value: "recent", label: "Updated" },
];

function labelize(value) {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

function quantityLabel(quantity, unit) {
  const amount = Number(quantity || 0);
  const cleanAmount = Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace(/\.0$/, "");
  return `${cleanAmount}${unit ? ` ${unit}` : ""}`;
}

function dateLabel(value) {
  if (!value) return "Not updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not updated";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function memberName(personId, people) {
  if (!personId) return "";
  return people.find(person => person.id === personId)?.display_name || "Assigned";
}

function isLowPantry(item) {
  return Boolean(item.reorder_flag) || Number(item.current_quantity || 0) <= Number(item.minimum_quantity || 0);
}

function canEditList(list, household) {
  if (!list) return false;
  const visibility = list.visibility || "household";
  if (visibility === "personal") return list.owner_user_id === household.user?.id;
  return roleCanManage(household.membership?.role) && ["household", "shared"].includes(visibility);
}

function canViewList(list, household) {
  if (!list) return false;
  if (list.visibility === "personal") return list.owner_user_id === household.user?.id;
  return Boolean(household.householdId);
}

function sortShoppingItems(items, sort) {
  const priorityRank = { high: 0, med: 1, low: 2 };
  return [...items].sort((a, b) => {
    if (sort === "alpha") return String(a.name || "").localeCompare(String(b.name || ""));
    if (sort === "priority") return (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3);
    if (sort === "category") return String(a.category || "").localeCompare(String(b.category || ""));
    if (sort === "recent") return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

function ListCard({ list, itemCount, neededCount, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="block w-full text-left">
      <Card className="transition-colors hover:bg-accent" style={{ borderLeft: `3px solid ${list.color || COLORS.green}` }}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-lg" aria-hidden="true">
            {list.icon || "S"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-extrabold text-foreground">{list.name || "Shopping list"}</div>
              {list.favorite && <Badge variant="purple">Favorite</Badge>}
              {list.archived && <Badge variant="slate">Archived</Badge>}
            </div>
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{list.description || `${neededCount} needed, ${itemCount} total`}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{labelize(list.visibility || "household")}</span>
              {list.category && <span>{list.category}</span>}
              <span>Updated {dateLabel(list.updated_at || list.created_at)}</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </CardContent>
      </Card>
    </button>
  );
}

function ShoppingItemRow({ item, canEdit, assigneeName, onEdit, onTogglePurchased, onToggleFavorite }) {
  const purchased = Boolean(item.purchased);
  return (
    <Card className={purchased ? "opacity-75" : ""} style={{ borderLeft: `3px solid ${purchased ? COLORS.green : item.priority === "high" ? COLORS.red : item.favorite ? COLORS.purple : COLORS.blue}` }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {canEdit && (
            <Button type="button" variant={purchased ? "secondary" : "outline"} size="icon-sm" aria-label={purchased ? "Mark item needed" : "Mark item purchased"} onClick={() => onTogglePurchased(item)}>
              <Check className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
            <div className={`text-sm font-extrabold leading-5 text-foreground ${purchased ? "line-through decoration-muted-foreground" : ""}`}>{item.name || "Shopping item"}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{quantityLabel(item.quantity, item.unit)}</span>
              {item.category && <span>{item.category}</span>}
            </div>
            {item.notes && <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.notes}</div>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={purchased ? "complete" : "info"}>{purchased ? "Purchased" : "Needed"}</StatusBadge>
              <Badge variant={item.priority === "high" ? "red" : item.priority === "low" ? "slate" : "amber"}>{labelize(item.priority || "med")}</Badge>
              {assigneeName && <Badge variant="blue">{assigneeName}</Badge>}
              {item.pantry_item_id && <Badge variant="green">Pantry</Badge>}
            </div>
          </button>
          {canEdit && (
            <Button type="button" variant="ghost" size="icon-sm" aria-label={item.favorite ? "Remove item favorite" : "Favorite item"} onClick={() => onToggleFavorite(item)}>
              <Heart className={`h-4 w-4 ${item.favorite ? "fill-violet-300 text-violet-300" : ""}`} aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PantryRow({ item, canManage, onEdit, onToggleFavorite }) {
  const low = isLowPantry(item);
  return (
    <Card style={{ borderLeft: `3px solid ${low ? COLORS.amber : item.favorite ? COLORS.purple : COLORS.green}` }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Package className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
            <div className="text-sm font-extrabold text-foreground">{item.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {quantityLabel(item.current_quantity, item.unit)} on hand - minimum {quantityLabel(item.minimum_quantity, item.unit)}
            </div>
            {item.notes && <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.notes}</div>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={low ? "warning" : "healthy"}>{low ? "Reorder" : "Stocked"}</StatusBadge>
              {item.category && <Badge variant="blue">{item.category}</Badge>}
              {item.favorite && <Badge variant="purple">Favorite</Badge>}
            </div>
          </button>
          {canManage && (
            <Button type="button" variant="ghost" size="icon-sm" aria-label={item.favorite ? "Remove pantry favorite" : "Favorite pantry item"} onClick={() => onToggleFavorite(item)}>
              <Heart className={`h-4 w-4 ${item.favorite ? "fill-violet-300 text-violet-300" : ""}`} aria-hidden="true" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function Shopping({ initialView }) {
  const household = useHousehold();
  const lists = useTable("shopping_lists", "sort_order", true);
  const items = useTable("shopping_items", "sort_order", true);
  const pantry = useTable("pantry_items", "updated_at");
  const [view, setView] = useState("lists");
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [listFilter, setListFilter] = useState("active");
  const [itemFilter, setItemFilter] = useState("needed");
  const [itemSort, setItemSort] = useState("manual");
  const [pantryFilter, setPantryFilter] = useState("active");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [listDrawer, setListDrawer] = useState(false);
  const [itemDrawer, setItemDrawer] = useState(false);
  const [pantryDrawer, setPantryDrawer] = useState(false);
  const [listForm, setListForm] = useState({});
  const [itemForm, setItemForm] = useState({});
  const [pantryForm, setPantryForm] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const canManageSharedLists = roleCanManage(household.membership?.role);
  const canCreate = Boolean(household.user?.id);
  const canManagePantry = canManageSharedLists;
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (!initialView?.ts) return;
    if (initialView.view) setView(initialView.view);
    if (initialView.listId) setSelectedId(initialView.listId);
    if (initialView.search) setQuery(initialView.search);
  }, [initialView]);

  const visibleLists = useMemo(() => lists.data.filter(list => canViewList(list, household)), [household, lists.data]);
  const selectedList = visibleLists.find(list => list.id === selectedId) || null;
  const editable = canEditList(selectedList, household);
  const listItems = items.data.filter(item => item.list_id === selectedList?.id);
  const activeLists = visibleLists.filter(list => !list.archived);
  const itemCounts = useMemo(() => items.data.reduce((acc, item) => ({ ...acc, [item.list_id]: (acc[item.list_id] || 0) + 1 }), {}), [items.data]);
  const neededCounts = useMemo(() => items.data.reduce((acc, item) => {
    if (!item.purchased && !item.archived) acc[item.list_id] = (acc[item.list_id] || 0) + 1;
    return acc;
  }, {}), [items.data]);

  const categories = useMemo(() => Array.from(new Set([
    ...CATEGORIES,
    ...items.data.map(item => item.category).filter(Boolean),
    ...pantry.data.map(item => item.category).filter(Boolean),
    ...lists.data.map(list => list.category).filter(Boolean),
  ])).sort(), [items.data, lists.data, pantry.data]);

  const filteredItems = sortShoppingItems(listItems.filter(item => {
    if (itemFilter === "needed" && (item.purchased || item.archived)) return false;
    if (itemFilter === "purchased" && !item.purchased) return false;
    if (itemFilter === "favorites" && !item.favorite) return false;
    if (itemFilter === "archived" && !item.archived) return false;
    if (itemFilter !== "archived" && item.archived) return false;
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (!normalizedQuery) return true;
    return `${item.name} ${item.notes} ${item.category} ${item.unit}`.toLowerCase().includes(normalizedQuery);
  }), itemSort);

  const filteredPantry = pantry.data.filter(item => {
    if (pantryFilter === "active" && item.archived) return false;
    if (pantryFilter === "low" && !isLowPantry(item)) return false;
    if (pantryFilter === "favorites" && !item.favorite) return false;
    if (pantryFilter === "archived" && !item.archived) return false;
    if (pantryFilter !== "archived" && item.archived) return false;
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (!normalizedQuery) return true;
    return `${item.name} ${item.notes} ${item.category} ${item.unit}`.toLowerCase().includes(normalizedQuery);
  });

  function openListForm(list = null) {
    setError("");
    setListForm(list ? { ...list } : {
      name: "",
      description: "",
      category: "Grocery",
      visibility: canManageSharedLists ? "household" : "personal",
      favorite: false,
      archived: false,
      color: COLORS.green,
      icon: "S",
    });
    setListDrawer(true);
  }

  function openItemForm(item = null) {
    setError("");
    setItemForm(item ? { ...item } : {
      name: "",
      quantity: 1,
      unit: "",
      category: selectedList?.category || "Grocery",
      priority: "med",
      purchased: false,
      notes: "",
      favorite: false,
      assigned_to_person_id: "",
      pantry_item_id: "",
      recurring: false,
      recurrence_days: "",
      store_group: selectedList?.category || "",
      meal_group: "",
      inventory_flag: false,
      archived: false,
    });
    setItemDrawer(true);
  }

  function openPantryForm(item = null) {
    setError("");
    setPantryForm(item ? { ...item } : {
      name: "",
      current_quantity: 1,
      minimum_quantity: 1,
      unit: "",
      category: "Grocery",
      reorder_flag: false,
      favorite: false,
      notes: "",
      archived: false,
    });
    setPantryDrawer(true);
  }

  async function saveList() {
    if (submitting) return;
    setError("");
    if (!listForm.name?.trim()) {
      setError("List name is required.");
      return;
    }
    if (!canManageSharedLists && listForm.visibility !== "personal") {
      setError("Your role can create personal lists only.");
      return;
    }
    const row = {
      name: listForm.name.trim(),
      description: listForm.description || "",
      category: listForm.category || "",
      visibility: listForm.visibility || "household",
      favorite: Boolean(listForm.favorite),
      archived: Boolean(listForm.archived),
      color: listForm.color || COLORS.green,
      icon: listForm.icon || "S",
      sort_order: Number(listForm.sort_order ?? visibleLists.length + 1),
      owner_user_id: listForm.owner_user_id || household.user?.id,
      recipe_ref: listForm.recipe_ref || null,
      meal_plan_ref: listForm.meal_plan_ref || null,
      updated_at: new Date().toISOString(),
    };
    try {
      setSubmitting(true);
      if (listForm.id) await lists.update(listForm.id, row);
      else {
        const created = await lists.insert(row);
        if (created?.id) setSelectedId(created.id);
      }
      setListDrawer(false);
    } catch (error) {
      setError(formatUserFacingError(error, "Shopping list could not be saved right now."));
    } finally {
      setSubmitting(false);
    }
  }

  async function saveItem() {
    if (submitting) return;
    setError("");
    if (!selectedList?.id) {
      setError("Choose a shopping list first.");
      return;
    }
    if (!itemForm.name?.trim()) {
      setError("Item name is required.");
      return;
    }
    const purchased = Boolean(itemForm.purchased);
    const row = {
      list_id: selectedList.id,
      pantry_item_id: itemForm.pantry_item_id || null,
      name: itemForm.name.trim(),
      quantity: Number(itemForm.quantity || 0),
      unit: itemForm.unit || "",
      category: itemForm.category || "",
      priority: itemForm.priority || "med",
      purchased,
      notes: itemForm.notes || "",
      favorite: Boolean(itemForm.favorite),
      assigned_to_person_id: itemForm.assigned_to_person_id || null,
      sort_order: Number(itemForm.sort_order ?? listItems.length + 1),
      archived: Boolean(itemForm.archived),
      purchased_at: purchased ? (itemForm.purchased_at || new Date().toISOString()) : null,
      recipe_ref: itemForm.recipe_ref || null,
      meal_plan_ref: itemForm.meal_plan_ref || null,
      recurring: Boolean(itemForm.recurring),
      recurrence_days: itemForm.recurring && itemForm.recurrence_days ? Number(itemForm.recurrence_days) : null,
      store_group: itemForm.store_group || "",
      meal_group: itemForm.meal_group || "",
      inventory_flag: Boolean(itemForm.inventory_flag),
      purchase_count: Number(itemForm.purchase_count || 0),
      updated_at: new Date().toISOString(),
    };
    try {
      setSubmitting(true);
      if (itemForm.id) await items.update(itemForm.id, row);
      else await items.insert(row);
      await lists.update(selectedList.id, { updated_at: new Date().toISOString() });
      setItemDrawer(false);
    } catch (error) {
      setError(formatUserFacingError(error, "Shopping item could not be saved right now."));
    } finally {
      setSubmitting(false);
    }
  }

  async function savePantryItem() {
    if (submitting) return;
    setError("");
    if (!canManagePantry) {
      setError("Your role can view pantry, but not update it.");
      return;
    }
    if (!pantryForm.name?.trim()) {
      setError("Pantry item name is required.");
      return;
    }
    const row = {
      name: pantryForm.name.trim(),
      current_quantity: Number(pantryForm.current_quantity || 0),
      minimum_quantity: Number(pantryForm.minimum_quantity || 0),
      unit: pantryForm.unit || "",
      category: pantryForm.category || "",
      reorder_flag: Boolean(pantryForm.reorder_flag),
      favorite: Boolean(pantryForm.favorite),
      notes: pantryForm.notes || "",
      archived: Boolean(pantryForm.archived),
      sort_order: Number(pantryForm.sort_order ?? pantry.data.length + 1),
      recipe_ref: pantryForm.recipe_ref || null,
      meal_plan_ref: pantryForm.meal_plan_ref || null,
      updated_at: new Date().toISOString(),
    };
    try {
      setSubmitting(true);
      if (pantryForm.id) await pantry.update(pantryForm.id, row);
      else await pantry.insert(row);
      setPantryDrawer(false);
    } catch (error) {
      setError(formatUserFacingError(error, "Pantry item could not be saved right now."));
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePurchased(item) {
    const purchased = !item.purchased;
    try {
      await items.update(item.id, {
        purchased,
        purchased_at: purchased ? new Date().toISOString() : null,
        archived: false,
        updated_at: new Date().toISOString(),
      });
      await lists.update(item.list_id, { updated_at: new Date().toISOString() });
    } catch (error) {
      setError(formatUserFacingError(error, "Shopping item could not be updated right now."));
    }
  }

  async function toggleItemFavorite(item) {
    try {
      await items.update(item.id, { favorite: !item.favorite, updated_at: new Date().toISOString() });
    } catch (error) {
      setError(formatUserFacingError(error, "Shopping item could not be updated right now."));
    }
  }

  async function togglePantryFavorite(item) {
    try {
      await pantry.update(item.id, { favorite: !item.favorite, updated_at: new Date().toISOString() });
    } catch (error) {
      setError(formatUserFacingError(error, "Pantry item could not be updated right now."));
    }
  }

  async function archiveList() {
    if (!selectedList) return;
    try {
      await lists.update(selectedList.id, { archived: !selectedList.archived, updated_at: new Date().toISOString() });
    } catch (error) {
      setError(formatUserFacingError(error, "Shopping list could not be updated right now."));
    }
  }

  async function deleteSelectedList() {
    if (!selectedList) return;
    try {
      await Promise.all(listItems.map(item => items.remove(item.id)));
      await lists.remove(selectedList.id);
      setSelectedId(null);
      setConfirm(null);
    } catch (error) {
      setError(formatUserFacingError(error, "Shopping list could not be deleted right now."));
    }
  }

  if (selectedList) {
    return (
      <div style={S.screen} className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Button type="button" variant="ghost" size="xs" className="mb-2 px-0" onClick={() => setSelectedId(null)}><ChevronLeft className="h-4 w-4" aria-hidden="true" />Shopping</Button>
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-2xl font-extrabold text-foreground">{selectedList.icon || "S"} {selectedList.name}</div>
              {selectedList.favorite && <Badge variant="purple">Favorite</Badge>}
              <Badge variant="blue">{labelize(selectedList.visibility)}</Badge>
            </div>
            {selectedList.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedList.description}</p>}
            <div className="mt-2 text-xs text-muted-foreground">{roleLabel(household.membership?.role)} access - Updated {dateLabel(selectedList.updated_at || selectedList.created_at)}</div>
          </div>
          {editable && <Button type="button" size="icon-sm" aria-label="Add shopping item" onClick={() => openItemForm()}><Plus className="h-4 w-4" aria-hidden="true" /></Button>}
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" placeholder="Search shopping items" value={query} onChange={event => setQuery(event.target.value)} />
          </div>
          <FormRow>
            <FormGroup><Label>Status</Label><ChipGroup value={itemFilter} options={ITEM_FILTERS} ariaLabel="Shopping item filters" onValueChange={setItemFilter} /></FormGroup>
            <FormGroup><Label>Sort</Label><Select value={itemSort} onChange={event => setItemSort(event.target.value)}>{SORTS.map(sort => <option key={sort.value} value={sort.value}>{sort.label}</option>)}</Select></FormGroup>
          </FormRow>
          <Select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
            <option value="">All categories</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </Select>
        </div>

        <section>
          <SectionHeader title="Items" count={filteredItems.length} tone="green" action={editable ? <Button type="button" variant="ghost" size="xs" onClick={() => openItemForm()}>Quick add</Button> : null} />
          {filteredItems.length ? (
            <div className="space-y-2">
              {filteredItems.map(item => <ShoppingItemRow key={item.id} item={item} canEdit={editable} assigneeName={memberName(item.assigned_to_person_id, household.people)} onEdit={() => openItemForm(item)} onTogglePurchased={togglePurchased} onToggleFavorite={toggleItemFavorite} />)}
            </div>
          ) : (
            <Card><EmptyStatePanel title="No matching items" detail="Add an item or adjust search, category, status, and sort." action={editable ? "Add item" : undefined} onAction={editable ? () => openItemForm() : undefined} /></Card>
          )}
        </section>

        {editable && (
          <Card>
            <CardHeader className="p-4 pb-2"><CardTitle className="text-base">List Actions</CardTitle><CardDescription>Manage this shopping list without changing pantry.</CardDescription></CardHeader>
            <CardContent className="flex flex-wrap gap-2 p-4 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => openListForm(selectedList)}><Star className="h-4 w-4" aria-hidden="true" />Edit list</Button>
              <Button type="button" variant="secondary" size="sm" onClick={archiveList}><Archive className="h-4 w-4" aria-hidden="true" />{selectedList.archived ? "Restore" : "Archive"}</Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => setConfirm("delete-list")}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete</Button>
            </CardContent>
          </Card>
        )}
        <ListDrawer open={listDrawer} onOpenChange={setListDrawer} form={listForm} setForm={setListForm} onSave={saveList} error={error} submitting={submitting} canManageSharedLists={canManageSharedLists} />
        <ItemDrawer open={itemDrawer} onOpenChange={setItemDrawer} form={itemForm} setForm={setItemForm} people={household.people} pantryItems={pantry.data} categories={categories} onSave={saveItem} error={error} submitting={submitting} />
        <Dialog open={confirm === "delete-list"} onOpenChange={() => setConfirm(null)}>
          <DialogContent onClose={() => setConfirm(null)}>
            <DialogHeader><DialogTitle>Delete shopping list?</DialogTitle><DialogDescription>This removes the list and its shopping items. Pantry stays unchanged.</DialogDescription></DialogHeader>
            <DialogFooter><Button type="button" variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button type="button" variant="destructive" onClick={deleteSelectedList}>Delete list</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const filteredLists = activeLists.filter(list => {
    if (listFilter === "favorites" && !list.favorite) return false;
    if (listFilter === "mine" && list.owner_user_id !== household.user?.id && list.visibility !== "personal") return false;
    if (listFilter === "household" && !["household", "shared"].includes(list.visibility || "household")) return false;
    if (!normalizedQuery) return true;
    return `${list.name} ${list.description} ${list.category}`.toLowerCase().includes(normalizedQuery);
  });
  const favoriteLists = filteredLists.filter(list => list.favorite).slice(0, 4);
  const recentLists = [...filteredLists].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)).slice(0, 6);
  const householdLists = filteredLists.filter(list => ["household", "shared"].includes(list.visibility || "household"));
  const lowPantryCount = pantry.data.filter(item => !item.archived && isLowPantry(item)).length;
  const neededItemCount = items.data.filter(item => !item.purchased && !item.archived).length;

  return (
    <div style={S.screen} className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"><ShoppingCart className="h-4 w-4" aria-hidden="true" /> Planning</div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">Shopping</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Shared household shopping lists and pantry inventory.</p>
        </div>
        {canCreate && view === "lists" && <Button type="button" size="icon-sm" aria-label="Create shopping list" onClick={() => openListForm()}><Plus className="h-4 w-4" aria-hidden="true" /></Button>}
        {canManagePantry && view === "pantry" && <Button type="button" size="icon-sm" aria-label="Add pantry item" onClick={() => openPantryForm()}><Plus className="h-4 w-4" aria-hidden="true" /></Button>}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Card><CardContent className="p-4"><div className="text-2xl font-extrabold text-foreground">{neededItemCount}</div><div className="text-xs text-muted-foreground">Items needed</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-extrabold text-foreground">{lowPantryCount}</div><div className="text-xs text-muted-foreground">Pantry low</div></CardContent></Card>
      </div>

      <SegmentedControl value={view} options={[{ value: "lists", label: "Lists" }, { value: "pantry", label: "Pantry" }]} ariaLabel="Shopping view" onValueChange={nextView => { setView(nextView); setSelectedId(null); setQuery(""); setCategoryFilter(""); }} />

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input className="pl-9" placeholder={view === "lists" ? "Search shopping lists" : "Search pantry"} value={query} onChange={event => setQuery(event.target.value)} />
        </div>
        {view === "lists" ? (
          <ChipGroup value={listFilter} ariaLabel="Shopping list filters" options={[{ value: "active", label: "Active" }, { value: "favorites", label: "Favorites" }, { value: "mine", label: "Mine" }, { value: "household", label: "Household" }]} onValueChange={setListFilter} />
        ) : (
          <>
            <ChipGroup value={pantryFilter} ariaLabel="Pantry filters" options={PANTRY_FILTERS} onValueChange={setPantryFilter} />
            <Select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}>
              <option value="">All categories</option>
              {categories.map(category => <option key={category} value={category}>{category}</option>)}
            </Select>
          </>
        )}
      </div>

      {view === "lists" ? (
        lists.loading || items.loading ? (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">Loading shopping lists...</CardContent></Card>
        ) : filteredLists.length ? (
          <>
            {favoriteLists.length > 0 && <section><SectionHeader title="Favorites" count={favoriteLists.length} tone="purple" /><div className="space-y-2">{favoriteLists.map(list => <ListCard key={list.id} list={list} itemCount={itemCounts[list.id] || 0} neededCount={neededCounts[list.id] || 0} onOpen={() => setSelectedId(list.id)} />)}</div></section>}
            <section><SectionHeader title="Recently Updated" count={recentLists.length} tone="green" /><div className="space-y-2">{recentLists.map(list => <ListCard key={list.id} list={list} itemCount={itemCounts[list.id] || 0} neededCount={neededCounts[list.id] || 0} onOpen={() => setSelectedId(list.id)} />)}</div></section>
            <section><SectionHeader title="Household Lists" count={householdLists.length} tone="blue" /><div className="space-y-2">{householdLists.slice(0, 8).map(list => <ListCard key={list.id} list={list} itemCount={itemCounts[list.id] || 0} neededCount={neededCounts[list.id] || 0} onOpen={() => setSelectedId(list.id)} />)}</div></section>
          </>
        ) : (
          <Card><EmptyStatePanel title="No shopping lists yet" detail="Create a grocery, Costco, household, or personal shopping list." action={canCreate ? "Create list" : undefined} onAction={canCreate ? () => openListForm() : undefined} /></Card>
        )
      ) : (
        pantry.loading ? (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">Loading pantry...</CardContent></Card>
        ) : filteredPantry.length ? (
          <section><SectionHeader title="Pantry" count={filteredPantry.length} tone="green" /><div className="space-y-2">{filteredPantry.map(item => <PantryRow key={item.id} item={item} canManage={canManagePantry} onEdit={() => openPantryForm(item)} onToggleFavorite={togglePantryFavorite} />)}</div></section>
        ) : (
          <Card><EmptyStatePanel title="No pantry items yet" detail="Track staple inventory and reorder thresholds without meal planning." action={canManagePantry ? "Add pantry item" : undefined} onAction={canManagePantry ? () => openPantryForm() : undefined} /></Card>
        )
      )}

      <ListDrawer open={listDrawer} onOpenChange={setListDrawer} form={listForm} setForm={setListForm} onSave={saveList} error={error} submitting={submitting} canManageSharedLists={canManageSharedLists} />
      <PantryDrawer open={pantryDrawer} onOpenChange={setPantryDrawer} form={pantryForm} setForm={setPantryForm} categories={categories} onSave={savePantryItem} error={error} submitting={submitting} canManage={canManagePantry} />
    </div>
  );
}

function ListDrawer({ open, onOpenChange, form, setForm, onSave, error, submitting, canManageSharedLists }) {
  return (
    <OriginDrawer open={open} onOpenChange={onOpenChange} title={form.id ? "Edit Shopping List" : "Create Shopping List"} description="Keep shopping lists simple and shared where appropriate.">
      <FormSection>
        <FormGroup><Label>Name</Label><Input value={form.name || ""} onChange={event => setForm(previous => ({ ...previous, name: event.target.value }))} placeholder="Grocery list" /></FormGroup>
        <NotesField label="Description" value={form.description || ""} onChange={description => setForm(previous => ({ ...previous, description }))} placeholder="Optional notes" />
        <FormGroup><Label>Category</Label><Input value={form.category || ""} onChange={event => setForm(previous => ({ ...previous, category: event.target.value }))} placeholder="Grocery, Costco, Household..." /></FormGroup>
        <FormGroup><Label>Visibility</Label><SegmentedControl value={form.visibility || (canManageSharedLists ? "household" : "personal")} options={canManageSharedLists ? LIST_VISIBILITY : [{ value: "personal", label: "Personal" }]} ariaLabel="Shopping list visibility" onValueChange={visibility => setForm(previous => ({ ...previous, visibility }))} /></FormGroup>
        <FormRow><FormGroup><Label>Icon</Label><Input value={form.icon || ""} onChange={event => setForm(previous => ({ ...previous, icon: event.target.value }))} maxLength={2} /></FormGroup><FormGroup><Label>Color</Label><Input type="color" value={form.color || COLORS.green} onChange={event => setForm(previous => ({ ...previous, color: event.target.value }))} /></FormGroup></FormRow>
        <ToggleField checked={Boolean(form.favorite)} label="Favorite list" onChange={favorite => setForm(previous => ({ ...previous, favorite }))} />
        {form.id && <ToggleField checked={Boolean(form.archived)} label="Archived" onChange={archived => setForm(previous => ({ ...previous, archived }))} />}
        <ValidationSummary error={error} />
        <SaveCancelFooter saveLabel={form.id ? "Save List" : "Create List"} onSave={onSave} onCancel={() => onOpenChange(false)} submitting={submitting} />
      </FormSection>
    </OriginDrawer>
  );
}

function ItemDrawer({ open, onOpenChange, form, setForm, people, pantryItems, categories, onSave, error, submitting }) {
  return (
    <OriginDrawer open={open} onOpenChange={onOpenChange} title={form.id ? "Edit Item" : "Add Shopping Item"} description="Capture what is needed now; details can stay light.">
      <FormSection>
        <FormGroup><Label>Name</Label><Input value={form.name || ""} onChange={event => setForm(previous => ({ ...previous, name: event.target.value }))} placeholder="Milk" /></FormGroup>
        <FormRow>
          <NumberField label="Quantity" min="0" step="0.5" value={form.quantity ?? ""} onChange={quantity => setForm(previous => ({ ...previous, quantity }))} />
          <FormGroup><Label>Unit</Label><Input value={form.unit || ""} onChange={event => setForm(previous => ({ ...previous, unit: event.target.value }))} placeholder="ct, lb, oz" /></FormGroup>
        </FormRow>
        <FormGroup><Label>Category</Label><Select value={form.category || ""} onChange={event => setForm(previous => ({ ...previous, category: event.target.value }))}><option value="">Choose category</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</Select></FormGroup>
        <FormGroup><Label>Priority</Label><SegmentedControl value={form.priority || "med"} options={PRIORITIES.map(priority => ({ value: priority, label: labelize(priority) }))} ariaLabel="Shopping item priority" onValueChange={priority => setForm(previous => ({ ...previous, priority }))} /></FormGroup>
        <FormGroup><Label>Assigned To</Label><Select value={form.assigned_to_person_id || ""} onChange={event => setForm(previous => ({ ...previous, assigned_to_person_id: event.target.value }))}><option value="">Unassigned</option>{people.map(person => <option key={person.id} value={person.id}>{person.display_name}</option>)}</Select></FormGroup>
        <FormGroup><Label>Pantry Link</Label><Select value={form.pantry_item_id || ""} onChange={event => setForm(previous => ({ ...previous, pantry_item_id: event.target.value }))}><option value="">No pantry link</option>{pantryItems.filter(item => !item.archived).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><FormHelp>Optional link for future pantry and meal planning workflows.</FormHelp></FormGroup>
        <FormRow><FormGroup><Label>Store group</Label><Input value={form.store_group||""} onChange={event=>setForm(previous=>({...previous,store_group:event.target.value}))} placeholder="Costco, Sam's, Grocery"/></FormGroup><FormGroup><Label>Meal group</Label><Input value={form.meal_group||""} onChange={event=>setForm(previous=>({...previous,meal_group:event.target.value}))} placeholder="Taco night"/></FormGroup></FormRow>
        <ToggleField checked={Boolean(form.recurring)} label="Recurring grocery item" onChange={recurring=>setForm(previous=>({...previous,recurring}))}/>
        {form.recurring&&<NumberField label="Repeat every (days)" min="1" value={form.recurrence_days||""} onChange={recurrence_days=>setForm(previous=>({...previous,recurrence_days}))}/>}
        <ToggleField checked={Boolean(form.inventory_flag)} label="Inventory item needs restock" onChange={inventory_flag=>setForm(previous=>({...previous,inventory_flag}))}/>
        <NotesField value={form.notes || ""} onChange={notes => setForm(previous => ({ ...previous, notes }))} placeholder="Brand, size, store note..." />
        <ToggleField checked={Boolean(form.purchased)} label="Purchased" onChange={purchased => setForm(previous => ({ ...previous, purchased }))} />
        <ToggleField checked={Boolean(form.favorite)} label="Favorite" onChange={favorite => setForm(previous => ({ ...previous, favorite }))} />
        {form.id && <ToggleField checked={Boolean(form.archived)} label="Archived" onChange={archived => setForm(previous => ({ ...previous, archived }))} />}
        <ValidationSummary error={error} />
        <SaveCancelFooter saveLabel={form.id ? "Save Item" : "Add Item"} onSave={onSave} onCancel={() => onOpenChange(false)} submitting={submitting} />
      </FormSection>
    </OriginDrawer>
  );
}

function PantryDrawer({ open, onOpenChange, form, setForm, categories, onSave, error, submitting, canManage }) {
  return (
    <OriginDrawer open={open} onOpenChange={onOpenChange} title={form.id ? "Edit Pantry Item" : "Add Pantry Item"} description="Simple inventory for household staples.">
      <FormSection>
        <FormGroup><Label>Name</Label><Input value={form.name || ""} disabled={!canManage} onChange={event => setForm(previous => ({ ...previous, name: event.target.value }))} placeholder="Rice" /></FormGroup>
        <FormRow>
          <NumberField label="Current" min="0" step="0.5" disabled={!canManage} value={form.current_quantity ?? ""} onChange={current_quantity => setForm(previous => ({ ...previous, current_quantity }))} />
          <NumberField label="Minimum" min="0" step="0.5" disabled={!canManage} value={form.minimum_quantity ?? ""} onChange={minimum_quantity => setForm(previous => ({ ...previous, minimum_quantity }))} />
        </FormRow>
        <FormGroup><Label>Unit</Label><Input value={form.unit || ""} disabled={!canManage} onChange={event => setForm(previous => ({ ...previous, unit: event.target.value }))} placeholder="ct, lb, oz" /></FormGroup>
        <FormGroup><Label>Category</Label><Select disabled={!canManage} value={form.category || ""} onChange={event => setForm(previous => ({ ...previous, category: event.target.value }))}><option value="">Choose category</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</Select></FormGroup>
        <NotesField value={form.notes || ""} disabled={!canManage} onChange={notes => setForm(previous => ({ ...previous, notes }))} />
        <ToggleField disabled={!canManage} checked={Boolean(form.reorder_flag)} label="Needs reorder" onChange={reorder_flag => setForm(previous => ({ ...previous, reorder_flag }))} />
        <ToggleField disabled={!canManage} checked={Boolean(form.favorite)} label="Favorite" onChange={favorite => setForm(previous => ({ ...previous, favorite }))} />
        {form.id && <ToggleField disabled={!canManage} checked={Boolean(form.archived)} label="Archived" onChange={archived => setForm(previous => ({ ...previous, archived }))} />}
        {canManage ? <SaveCancelFooter saveLabel={form.id ? "Save Pantry Item" : "Add Pantry Item"} onSave={onSave} onCancel={() => onOpenChange(false)} submitting={submitting} /> : <FormHelp>Pantry is read-only for your role.</FormHelp>}
        <ValidationSummary error={error} />
      </FormSection>
    </OriginDrawer>
  );
}
