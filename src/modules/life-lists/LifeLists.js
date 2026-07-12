import { useEffect, useMemo, useState } from "react";
import { Archive, Check, ChevronLeft, ChevronRight, Heart, Link as LinkIcon, ListChecks, Plus, Search, Star, Trash2 } from "lucide-react";
import { Badge, StatusBadge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { FormGroup, FormHelp, FormRow, FormSection, NotesField, SaveCancelFooter, ToggleField, ValidationSummary } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { ChipGroup, SegmentedControl } from "../../components/ui/segmented-control";
import { SectionHeader } from "../../components/ui/section-header";
import { OriginDrawer } from "../../components/origin/drawer";
import { useHousehold } from "../../context/HouseholdContext";
import { useTable } from "../../hooks/useTable";
import { roleCanManage, roleLabel } from "../../hooks/useHouseholdCollaboration";
import { formatUserFacingError } from "../../lib/userFacingErrors";
import { COLORS, S } from "../../theme";

const LIST_VISIBILITY = [
  { value: "household", label: "Household" },
  { value: "personal", label: "Personal" },
  { value: "shared", label: "Shared" },
];
const ITEM_STATUSES = ["planned", "in_progress", "completed", "someday", "deferred", "archived"];
const PRIORITIES = ["low", "med", "high"];
const SORTS = [
  { value: "manual", label: "Manual" },
  { value: "alpha", label: "A-Z" },
  { value: "priority", label: "Priority" },
  { value: "recent_added", label: "Added" },
  { value: "recent_updated", label: "Updated" },
  { value: "completed", label: "Completed" },
];

function labelize(value) {
  return String(value || "").replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}

function tagsToArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "").split(",").map(tag => tag.trim()).filter(Boolean);
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

function canEditList(list, household) {
  if (!list) return false;
  const visibility = list.visibility || "household";
  if (visibility === "personal") return list.owner_user_id === household.user?.id;
  return roleCanManage(household.membership?.role) && ["household", "shared"].includes(visibility);
}

function canViewList(list, household) {
  if (!list) return false;
  if (list.archived) return true;
  if (list.visibility === "personal") return list.owner_user_id === household.user?.id;
  return Boolean(household.householdId);
}

function sortItems(items, sort) {
  const priorityRank = { high: 0, med: 1, low: 2 };
  return [...items].sort((a, b) => {
    if (sort === "alpha") return String(a.title || "").localeCompare(String(b.title || ""));
    if (sort === "priority") return (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3);
    if (sort === "recent_added") return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (sort === "recent_updated") return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    if (sort === "completed") return new Date(b.completed_at || 0) - new Date(a.completed_at || 0);
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

function ListCard({ list, itemCount, onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="block w-full text-left">
      <Card className="transition-colors hover:bg-accent" style={{ borderLeft: `3px solid ${list.color || COLORS.blue}` }}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-lg" aria-hidden="true">
            {list.icon || "✓"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-sm font-extrabold text-foreground">{list.name || "Untitled list"}</div>
              {list.favorite && <Badge variant="purple">Favorite</Badge>}
              {list.archived && <Badge variant="slate">Archived</Badge>}
            </div>
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{list.description || `${itemCount} item${itemCount === 1 ? "" : "s"}`}</div>
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

function ItemRow({ item, canEdit, assigneeName, onEdit, onToggleComplete, onToggleFavorite }) {
  const complete = item.status === "completed" || Boolean(item.completed_at);
  const tags = tagsToArray(item.tags).slice(0, 3);
  return (
    <Card className={complete ? "opacity-80" : ""} style={{ borderLeft: `3px solid ${complete ? COLORS.green : item.priority === "high" ? COLORS.red : item.favorite ? COLORS.purple : COLORS.blue}` }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {canEdit && (
            <Button type="button" variant={complete ? "secondary" : "outline"} size="icon-sm" aria-label={complete ? "Mark item planned" : "Mark item complete"} onClick={() => onToggleComplete(item)}>
              <Check className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
            <div className={`text-sm font-extrabold leading-5 text-foreground ${complete ? "line-through decoration-muted-foreground" : ""}`}>{item.title || "Untitled item"}</div>
            {item.description && <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</div>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={complete ? "healthy" : item.status === "in_progress" ? "info" : item.status === "deferred" ? "warning" : item.status === "archived" ? "neutral" : "connected"}>{labelize(item.status || "planned")}</StatusBadge>
              <Badge variant={item.priority === "high" ? "red" : item.priority === "low" ? "slate" : "amber"}>{labelize(item.priority || "med")}</Badge>
              {assigneeName && <Badge variant="blue">{assigneeName}</Badge>}
              {item.link_url && <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />}
            </div>
            {tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{tags.map(tag => <Badge key={tag} variant="slate">#{tag}</Badge>)}</div>}
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

export function LifeLists({ initialView }) {
  const household = useHousehold();
  const lists = useTable("life_lists", "sort_order", true);
  const items = useTable("life_list_items", "sort_order", true);
  const [selectedId, setSelectedId] = useState(null);
  const [listDrawer, setListDrawer] = useState(false);
  const [itemDrawer, setItemDrawer] = useState(false);
  const [listForm, setListForm] = useState({});
  const [itemForm, setItemForm] = useState({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("active");
  const [itemStatus, setItemStatus] = useState("all");
  const [itemSort, setItemSort] = useState("manual");
  const [tagFilter, setTagFilter] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const visibleLists = useMemo(() => lists.data.filter(list => canViewList(list, household)), [household, lists.data]);
  const selectedList = visibleLists.find(list => list.id === selectedId) || null;
  const editable = canEditList(selectedList, household);
  const canManageSharedLists = roleCanManage(household.membership?.role);
  const activeLists = visibleLists.filter(list => !list.archived);

  useEffect(() => {
    if (!initialView?.ts) return;
    if (initialView.listId) setSelectedId(initialView.listId);
    if (initialView.search) setQuery(initialView.search);
    if (initialView.workflow === "item") {
      if (!selectedId && activeLists[0]) setSelectedId(activeLists[0].id);
      setError("");
      setItemForm({ title: initialView.prefill?.title || "", description: initialView.prefill?.description || "", priority: "med", status: "planned", favorite: false, archived: false, assigned_to_person_id: "", tags: "", link_url: "", image_url: "" });
      setItemDrawer(true);
    }
  }, [activeLists, initialView, selectedId]);
  const canCreate = Boolean(household.user?.id);
  const normalizedQuery = query.trim().toLowerCase();
  const allItems = items.data.filter(item => item.list_id === selectedList?.id);
  const visibleItems = sortItems(
    allItems.filter(item => {
      if (itemStatus !== "all" && (item.status || "planned") !== itemStatus) return false;
      if (filter === "favorites" && !item.favorite) return false;
      if (filter === "archived" && !item.archived && item.status !== "archived") return false;
      if (filter !== "archived" && (item.archived || item.status === "archived")) return false;
      if (tagFilter.trim() && !tagsToArray(item.tags).some(tag => tag.toLowerCase().includes(tagFilter.trim().toLowerCase()))) return false;
      if (!normalizedQuery) return true;
      return `${item.title} ${item.description} ${tagsToArray(item.tags).join(" ")} ${item.link_url}`.toLowerCase().includes(normalizedQuery);
    }),
    itemSort
  );
  const listCounts = useMemo(() => items.data.reduce((acc, item) => ({ ...acc, [item.list_id]: (acc[item.list_id] || 0) + 1 }), {}), [items.data]);

  function openListForm(list = null) {
    setError("");
    setListForm(list ? { ...list } : {
      name: "",
      description: "",
      category: "",
      visibility: canManageSharedLists ? "household" : "personal",
      favorite: false,
      archived: false,
      color: COLORS.blue,
      icon: "✓",
    });
    setListDrawer(true);
  }

  function openItemForm(item = null) {
    setError("");
    setItemForm(item ? { ...item, tags: tagsToArray(item.tags).join(", ") } : {
      title: "",
      description: "",
      priority: "med",
      status: "planned",
      favorite: false,
      archived: false,
      assigned_to_person_id: "",
      tags: "",
      link_url: "",
      image_url: "",
    });
    setItemDrawer(true);
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
      color: listForm.color || COLORS.blue,
      icon: listForm.icon || "✓",
      sort_order: Number(listForm.sort_order ?? visibleLists.length + 1),
      owner_user_id: listForm.owner_user_id || household.user?.id,
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
      setError(formatUserFacingError(error, "List could not be saved right now."));
    } finally {
      setSubmitting(false);
    }
  }

  async function saveItem() {
    if (submitting) return;
    setError("");
    if (!selectedList?.id) {
      setError("Choose a list first.");
      return;
    }
    if (!itemForm.title?.trim()) {
      setError("Item title is required.");
      return;
    }
    const status = itemForm.archived ? "archived" : itemForm.status || "planned";
    const row = {
      list_id: selectedList.id,
      title: itemForm.title.trim(),
      description: itemForm.description || "",
      priority: itemForm.priority || "med",
      status,
      favorite: Boolean(itemForm.favorite),
      archived: Boolean(itemForm.archived || status === "archived"),
      assigned_to_person_id: itemForm.assigned_to_person_id || null,
      tags: tagsToArray(itemForm.tags),
      link_url: itemForm.link_url || "",
      image_url: itemForm.image_url || "",
      sort_order: Number(itemForm.sort_order ?? allItems.length + 1),
      completed_at: status === "completed" ? (itemForm.completed_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    };
    try {
      setSubmitting(true);
      if (itemForm.id) await items.update(itemForm.id, row);
      else await items.insert(row);
      await lists.update(selectedList.id, { updated_at: new Date().toISOString() });
      setItemDrawer(false);
    } catch (error) {
      setError(formatUserFacingError(error, "List item could not be saved right now."));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleItemComplete(item) {
    const completed = item.status === "completed" || item.completed_at;
    try {
      await items.update(item.id, {
        status: completed ? "planned" : "completed",
        completed_at: completed ? null : new Date().toISOString(),
        archived: false,
        updated_at: new Date().toISOString(),
      });
      await lists.update(item.list_id, { updated_at: new Date().toISOString() });
    } catch (error) {
      setError(formatUserFacingError(error, "List item could not be updated right now."));
    }
  }

  async function toggleItemFavorite(item) {
    try {
      await items.update(item.id, { favorite: !item.favorite, updated_at: new Date().toISOString() });
    } catch (error) {
      setError(formatUserFacingError(error, "List item could not be updated right now."));
    }
  }

  async function archiveList() {
    if (!selectedList) return;
    try {
      await lists.update(selectedList.id, { archived: !selectedList.archived, updated_at: new Date().toISOString() });
    } catch (error) {
      setError(formatUserFacingError(error, "List could not be updated right now."));
    }
  }

  async function deleteSelectedList() {
    if (!selectedList) return;
    try {
      await Promise.all(allItems.map(item => items.remove(item.id)));
      await lists.remove(selectedList.id);
      setSelectedId(null);
      setConfirm(null);
    } catch (error) {
      setError(formatUserFacingError(error, "List could not be deleted right now."));
    }
  }

  if (!selectedList) {
    const filteredLists = activeLists.filter(list => {
      if (filter === "favorites" && !list.favorite) return false;
      if (filter === "mine" && list.owner_user_id !== household.user?.id && list.visibility !== "personal") return false;
      if (filter === "household" && !["household", "shared"].includes(list.visibility || "household")) return false;
      if (!normalizedQuery) return true;
      return `${list.name} ${list.description} ${list.category}`.toLowerCase().includes(normalizedQuery);
    });
    const filteredFavoriteLists = filteredLists.filter(list => list.favorite).slice(0, 5);
    const filteredRecentLists = [...filteredLists].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)).slice(0, 5);
    const filteredMyLists = filteredLists.filter(list => list.owner_user_id === household.user?.id || list.visibility === "personal");
    const filteredHouseholdLists = filteredLists.filter(list => ["household", "shared"].includes(list.visibility || "household"));
    return (
      <div style={S.screen} className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground"><ListChecks className="h-4 w-4" aria-hidden="true" /> Planning</div>
            <div className="mt-1 text-2xl font-extrabold text-foreground">Life Lists</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Capture things your family wants to do, watch, read, visit, buy, remember, or plan.</p>
          </div>
          {canCreate && <Button type="button" size="icon-sm" aria-label="Create list" onClick={() => openListForm()}><Plus className="h-4 w-4" aria-hidden="true" /></Button>}
        </div>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" placeholder="Search lists" value={query} onChange={event => setQuery(event.target.value)} />
          </div>
          <ChipGroup value={filter} ariaLabel="List filters" options={[{ value: "active", label: "Active" }, { value: "favorites", label: "Favorites" }, { value: "mine", label: "Mine" }, { value: "household", label: "Household" }]} onValueChange={setFilter} />
        </div>
        {lists.loading || items.loading ? (
          <Card><CardContent className="p-4 text-sm text-muted-foreground">Loading Life Lists...</CardContent></Card>
        ) : filteredLists.length ? (
          <>
            {filteredFavoriteLists.length > 0 && <section><SectionHeader title="Pinned" count={filteredFavoriteLists.length} tone="purple" /><div className="space-y-2">{filteredFavoriteLists.map(list => <ListCard key={list.id} list={list} itemCount={listCounts[list.id] || 0} onOpen={() => setSelectedId(list.id)} />)}</div></section>}
            <section><SectionHeader title="Recently Updated" count={filteredRecentLists.length} tone="blue" /><div className="space-y-2">{filteredRecentLists.map(list => <ListCard key={list.id} list={list} itemCount={listCounts[list.id] || 0} onOpen={() => setSelectedId(list.id)} />)}</div></section>
            <section><SectionHeader title="My Lists" count={filteredMyLists.length} tone="neutral" /><div className="space-y-2">{filteredMyLists.slice(0, 6).map(list => <ListCard key={list.id} list={list} itemCount={listCounts[list.id] || 0} onOpen={() => setSelectedId(list.id)} />)}</div></section>
            <section><SectionHeader title="Household Lists" count={filteredHouseholdLists.length} tone="blue" /><div className="space-y-2">{filteredHouseholdLists.slice(0, 8).map(list => <ListCard key={list.id} list={list} itemCount={listCounts[list.id] || 0} onOpen={() => setSelectedId(list.id)} />)}</div></section>
          </>
        ) : (
          <Card>
            <EmptyStatePanel title="No Life Lists yet" detail="Create a flexible list for movies, books, trip ideas, gifts, memories, or any future category." action={canCreate ? "Create list" : undefined} onAction={canCreate ? () => openListForm() : undefined} />
          </Card>
        )}
        <ListDrawer open={listDrawer} onOpenChange={setListDrawer} form={listForm} setForm={setListForm} onSave={saveList} error={error} submitting={submitting} canManageSharedLists={canManageSharedLists} />
      </div>
    );
  }

  return (
    <div style={S.screen} className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Button type="button" variant="ghost" size="xs" className="mb-2 px-0" onClick={() => setSelectedId(null)}><ChevronLeft className="h-4 w-4" aria-hidden="true" />Life Lists</Button>
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-2xl font-extrabold text-foreground">{selectedList.icon || "✓"} {selectedList.name}</div>
            {selectedList.favorite && <Badge variant="purple">Favorite</Badge>}
            <Badge variant="blue">{labelize(selectedList.visibility)}</Badge>
          </div>
          {selectedList.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{selectedList.description}</p>}
          <div className="mt-2 text-xs text-muted-foreground">{roleLabel(household.membership?.role)} access · Updated {dateLabel(selectedList.updated_at || selectedList.created_at)}</div>
        </div>
        {editable && <Button type="button" size="icon-sm" aria-label="Add item" onClick={() => openItemForm()}><Plus className="h-4 w-4" aria-hidden="true" /></Button>}
      </div>
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input className="pl-9" placeholder="Search items" value={query} onChange={event => setQuery(event.target.value)} />
        </div>
        <FormRow>
          <FormGroup><Label>Status</Label><Select value={itemStatus} onChange={event => setItemStatus(event.target.value)}><option value="all">All statuses</option>{ITEM_STATUSES.map(status => <option key={status} value={status}>{labelize(status)}</option>)}</Select></FormGroup>
          <FormGroup><Label>Sort</Label><Select value={itemSort} onChange={event => setItemSort(event.target.value)}>{SORTS.map(sort => <option key={sort.value} value={sort.value}>{sort.label}</option>)}</Select></FormGroup>
        </FormRow>
        <Input placeholder="Filter by tag" value={tagFilter} onChange={event => setTagFilter(event.target.value)} />
        <ChipGroup value={filter} ariaLabel="Item filters" options={[{ value: "active", label: "Active" }, { value: "favorites", label: "Favorites" }, { value: "archived", label: "Archived" }]} onValueChange={setFilter} />
      </div>
      <section>
        <SectionHeader title="Items" count={visibleItems.length} tone="blue" action={editable ? <Button type="button" variant="ghost" size="xs" onClick={() => openItemForm()}>Quick add</Button> : null} />
        {visibleItems.length ? (
          <div className="space-y-2">
            {visibleItems.map(item => <ItemRow key={item.id} item={item} canEdit={editable} assigneeName={memberName(item.assigned_to_person_id, household.people)} onEdit={() => openItemForm(item)} onToggleComplete={toggleItemComplete} onToggleFavorite={toggleItemFavorite} />)}
          </div>
        ) : (
          <Card><EmptyStatePanel title="No matching items" detail="Add an item or adjust search, status, sort, and tag filters." action={editable ? "Add item" : undefined} onAction={editable ? () => openItemForm() : undefined} /></Card>
        )}
      </section>
      {editable && (
        <Card>
          <CardHeader className="p-4 pb-2"><CardTitle className="text-base">List Actions</CardTitle><CardDescription>Manage the collection without changing other modules.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2 p-4 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => openListForm(selectedList)}><Star className="h-4 w-4" aria-hidden="true" />Edit list</Button>
            <Button type="button" variant="secondary" size="sm" onClick={archiveList}><Archive className="h-4 w-4" aria-hidden="true" />{selectedList.archived ? "Restore" : "Archive"}</Button>
            <Button type="button" variant="destructive" size="sm" onClick={() => setConfirm("delete-list")}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete</Button>
          </CardContent>
        </Card>
      )}
      <ListDrawer open={listDrawer} onOpenChange={setListDrawer} form={listForm} setForm={setListForm} onSave={saveList} error={error} submitting={submitting} canManageSharedLists={canManageSharedLists} />
      <ItemDrawer open={itemDrawer} onOpenChange={setItemDrawer} form={itemForm} setForm={setItemForm} people={household.people} onSave={saveItem} error={error} submitting={submitting} />
      <Dialog open={confirm === "delete-list"} onOpenChange={() => setConfirm(null)}>
        <DialogContent onClose={() => setConfirm(null)}>
          <DialogHeader><DialogTitle>Delete list?</DialogTitle><DialogDescription>This removes the list and its items from Life Lists.</DialogDescription></DialogHeader>
          <DialogFooter><Button type="button" variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button type="button" variant="destructive" onClick={deleteSelectedList}>Delete list</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListDrawer({ open, onOpenChange, form, setForm, onSave, error, submitting, canManageSharedLists }) {
  return (
    <OriginDrawer open={open} onOpenChange={onOpenChange} title={form.id ? "Edit List" : "Create List"} description="Keep lists generic so future categories can fit without new code.">
      <FormSection>
        <FormGroup><Label>Name</Label><Input value={form.name || ""} onChange={event => setForm(previous => ({ ...previous, name: event.target.value }))} placeholder="Movies to watch" /></FormGroup>
        <NotesField label="Description" value={form.description || ""} onChange={description => setForm(previous => ({ ...previous, description }))} placeholder="Optional notes about this collection" />
        <FormGroup><Label>Category</Label><Input value={form.category || ""} onChange={event => setForm(previous => ({ ...previous, category: event.target.value }))} placeholder="Movies, Books, Travel, Gifts..." /></FormGroup>
        <FormGroup><Label>Visibility</Label><SegmentedControl value={form.visibility || (canManageSharedLists ? "household" : "personal")} options={canManageSharedLists ? LIST_VISIBILITY : [{ value: "personal", label: "Personal" }]} ariaLabel="List visibility" onValueChange={visibility => setForm(previous => ({ ...previous, visibility }))} /></FormGroup>
        <FormRow><FormGroup><Label>Icon</Label><Input value={form.icon || ""} onChange={event => setForm(previous => ({ ...previous, icon: event.target.value }))} maxLength={2} /></FormGroup><FormGroup><Label>Color</Label><Input type="color" value={form.color || COLORS.blue} onChange={event => setForm(previous => ({ ...previous, color: event.target.value }))} /></FormGroup></FormRow>
        <ToggleField checked={Boolean(form.favorite)} label="Favorite" onChange={favorite => setForm(previous => ({ ...previous, favorite }))} />
        <ValidationSummary error={error} />
        <SaveCancelFooter saveLabel={form.id ? "Save List" : "Create List"} onSave={onSave} onCancel={() => onOpenChange(false)} submitting={submitting} />
      </FormSection>
    </OriginDrawer>
  );
}

function ItemDrawer({ open, onOpenChange, form, setForm, people, onSave, error, submitting }) {
  return (
    <OriginDrawer open={open} onOpenChange={onOpenChange} title={form.id ? "Edit Item" : "Quick Add Item"} description="Capture the item now; detail can be refined later.">
      <FormSection>
        <FormGroup><Label>Title</Label><Input value={form.title || ""} onChange={event => setForm(previous => ({ ...previous, title: event.target.value }))} placeholder="Add a movie, book, place, idea..." /></FormGroup>
        <NotesField value={form.description || ""} onChange={description => setForm(previous => ({ ...previous, description }))} />
        <FormGroup><Label>Status</Label><ChipGroup value={form.status || "planned"} ariaLabel="Item status" options={ITEM_STATUSES.map(status => ({ value: status, label: labelize(status) }))} onValueChange={status => setForm(previous => ({ ...previous, status, archived: status === "archived" }))} /></FormGroup>
        <FormGroup><Label>Priority</Label><SegmentedControl value={form.priority || "med"} options={PRIORITIES.map(priority => ({ value: priority, label: labelize(priority) }))} ariaLabel="Item priority" onValueChange={priority => setForm(previous => ({ ...previous, priority }))} /></FormGroup>
        <FormGroup><Label>Assigned To</Label><Select value={form.assigned_to_person_id || ""} onChange={event => setForm(previous => ({ ...previous, assigned_to_person_id: event.target.value }))}><option value="">Unassigned</option>{people.map(person => <option key={person.id} value={person.id}>{person.display_name}</option>)}</Select></FormGroup>
        <FormGroup><Label>Tags</Label><Input value={form.tags || ""} onChange={event => setForm(previous => ({ ...previous, tags: event.target.value }))} placeholder="travel, rainy day, gifts" /><FormHelp>Separate tags with commas.</FormHelp></FormGroup>
        <FormGroup><Label>Link</Label><Input type="url" value={form.link_url || ""} onChange={event => setForm(previous => ({ ...previous, link_url: event.target.value }))} placeholder="https://..." /></FormGroup>
        <FormGroup><Label>Image URL</Label><Input value={form.image_url || ""} onChange={event => setForm(previous => ({ ...previous, image_url: event.target.value }))} placeholder="Future-ready image reference" /></FormGroup>
        <ToggleField checked={Boolean(form.favorite)} label="Favorite" onChange={favorite => setForm(previous => ({ ...previous, favorite }))} />
        <ValidationSummary error={error} />
        <SaveCancelFooter saveLabel={form.id ? "Save Item" : "Add Item"} onSave={onSave} onCancel={() => onOpenChange(false)} submitting={submitting} />
      </FormSection>
    </OriginDrawer>
  );
}
