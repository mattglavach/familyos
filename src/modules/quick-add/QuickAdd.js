import { useEffect, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ClipboardList, Droplets, ListChecks, ShoppingCart, Utensils } from "lucide-react";
import { TODAY_STR } from "../../lib/dates";
import { formatUserFacingError } from "../../lib/userFacingErrors";
import { useHousehold } from "../../context/HouseholdContext";
import { roleCanManage } from "../../hooks/useHouseholdCollaboration";
import { useTable } from "../../hooks/useTable";
import { buildPoolReadingRow, hasRainContext, POOL_TEST_ADVANCED_FIELDS, POOL_TEST_FIELD_LABELS, POOL_TEST_PRIMARY_FIELDS, poolTestFieldError, setRainContext, validatePoolTestForm } from "../pool/poolTestForm";
import { OriginDrawer } from "../../components/origin/drawer";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { DateTimeField, FormError, FormGroup, FormHelp, FormRow, FormSection, NotesField, NumberField, SaveCancelFooter, ToggleField, ValidationSummary } from "../../components/ui/form";
import { ChipGroup, SegmentedControl } from "../../components/ui/segmented-control";
import { SectionHeader } from "../../components/ui/section-header";
// - QUICK ADD -
export function QuickAdd({onNavigate, openSignal = 0, initialMode = null}){
  const [open,setOpen] = useState(false);
  const tasks = useTable("tasks", "due_date", true);
  const lifeLists = useTable("life_lists", "updated_at");
  const lifeItems = useTable("life_list_items", "updated_at");
  const shoppingLists = useTable("shopping_lists", "updated_at");
  const shoppingItems = useTable("shopping_items", "updated_at");
  const mealPlans = useTable("meal_plans", "updated_at");
  const recipes = useTable("recipes", "updated_at");
  const mealAssignments = useTable("meal_assignments", "meal_date", true);
  const poolReadings = useTable("pool_readings", "logged_at");
  const poolTreatments = useTable("pool_treatments", "logged_at");
  const poolMaintenance = useTable("pool_maintenance", "date");
  const household = useHousehold();
  const [form,setForm] = useState({});
  const [mode,setMode] = useState(null);
  const [saveError,setSaveError] = useState(null);
  const [submitting,setSubmitting] = useState(false);
  const [toast,setToast] = useState(null);

  function close(){setOpen(false);setMode(null);setForm({});setSaveError(null);setSubmitting(false);}
  function setField(key,value){setSaveError(null);setForm(p=>({...p,[key]:value}));}
  function renderPoolNumberField(field){
    return (
      <NumberField
        key={field.key}
        label={POOL_TEST_FIELD_LABELS[field.key]}
        aria-label={POOL_TEST_FIELD_LABELS[field.key]}
        value={form[field.key]}
        min={field.min}
        max={field.max}
        step={field.step}
        inputMode={field.inputMode}
        placeholder={field.key==="free_chlorine"&&form._drops?"e.g. 11 drops":field.placeholder}
        help={field.key==="free_chlorine"&&form._drops&&form.free_chlorine?`= ${(+form.free_chlorine*0.5).toFixed(1)} ppm FC`:undefined}
        error={poolTestFieldError(field.key, form)}
        onChange={value=>setField(field.key,value)}
      />
    );
  }

  const options=[
    {id:"task", icon:ClipboardList, label:"Add Task", status:"Ready", featured:true, enabled:true, accentClass:"border-l-violet-400", iconClass:"text-violet-300"},
    {id:"calendar-event", icon:CalendarDays, label:"Add Calendar Event", status:"Google", featured:true, enabled:true, accentClass:"border-l-sky-400", iconClass:"text-sky-300"},
    {id:"shopping-item", icon:ShoppingCart, label:"Shopping Item", status:"Ready", enabled:true, accentClass:"border-l-emerald-400", iconClass:"text-emerald-300"},
    {id:"shopping-list", icon:ShoppingCart, label:"Shopping List", status:"Ready", enabled:true, accentClass:"border-l-emerald-400", iconClass:"text-emerald-300"},
    {id:"recipe", icon:Utensils, label:"Recipe", status:"Ready", enabled:true, accentClass:"border-l-sky-400", iconClass:"text-sky-300"},
    {id:"meal-plan", icon:Utensils, label:"Meal Plan", status:"Ready", enabled:true, accentClass:"border-l-sky-400", iconClass:"text-sky-300"},
    {id:"meal-assignment", icon:Utensils, label:"Meal Assignment", status:"Ready", enabled:true, accentClass:"border-l-sky-400", iconClass:"text-sky-300"},
    {id:"life-item", icon:ListChecks, label:"List Item", status:"Ready", enabled:true, accentClass:"border-l-emerald-400", iconClass:"text-emerald-300"},
    {id:"life-list", icon:ListChecks, label:"Life List", status:"Ready", enabled:true, accentClass:"border-l-emerald-400", iconClass:"text-emerald-300"},
    {id:"pool-treatment", icon:Droplets, label:"Add Pool Activity", status:"Ready", featured:true, enabled:true, accentClass:"border-l-primary", iconClass:"text-primary"},
    {id:"pool", icon:Droplets, label:"Add Pool Test Result", status:"Ready", featured:true, enabled:true, accentClass:"border-l-primary", iconClass:"text-primary"},
    {id:"pool-maintenance", icon:Droplets, label:"Maintenance Completed", status:"Ready", enabled:true, accentClass:"border-l-primary", iconClass:"text-primary"},
    {id:"pool-note", icon:Droplets, label:"Pool Note", status:"Ready", enabled:true, accentClass:"border-l-primary", iconClass:"text-primary"},
  ];

  const CATS = ["Pool","Yard","Home","College","Finance","Personal","Work"];
  const RECURRING_OPTIONS = [
    {value:"",label:"None",days:null,supported:true},
    {value:"daily",label:"Daily",days:1,supported:true},
    {value:"weekdays",label:"Weekdays - later",days:null,supported:false},
    {value:"weekly",label:"Weekly",days:7,supported:true},
    {value:"monthly",label:"Monthly",days:30,supported:true},
    {value:"yearly",label:"Yearly",days:365,supported:true},
  ];
  const modeTitle = options.find(o=>o.id===mode)?.label || "Quick Add";
  const canManageSharedLists = roleCanManage(household.membership?.role);
  const writableLifeLists = lifeLists.data.filter(list => {
    if (list.archived) return false;
    const visibility = list.visibility || "household";
    if (visibility === "personal") return list.owner_user_id === household.user?.id;
    return canManageSharedLists && ["household", "shared"].includes(visibility);
  });
  const writableShoppingLists = shoppingLists.data.filter(list => {
    if (list.archived) return false;
    const visibility = list.visibility || "household";
    if (visibility === "personal") return list.owner_user_id === household.user?.id;
    return canManageSharedLists && ["household", "shared"].includes(visibility);
  });
  const writableMealPlans = mealPlans.data.filter(plan => {
    if (plan.archived) return false;
    const visibility = plan.visibility || "household";
    if (visibility === "personal") return plan.owner_user_id === household.user?.id;
    return canManageSharedLists && ["household", "shared"].includes(visibility);
  });

  useEffect(() => {
    if (openSignal) { setMode(initialMode); setOpen(true); }
  }, [initialMode, openSignal]);

  function chooseMode(id) {
    if (id === "calendar-event") {
      window.open("https://calendar.google.com/calendar/u/0/r/eventedit", "_blank", "noopener,noreferrer");
      close();
      return;
    }
    setMode(id);
  }

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  async function saveTask(){
    setSaveError(null);
    if(!form.title){setSaveError("Title is required");return;}
    const recurrence = RECURRING_OPTIONS.find(option => option.value === (form.recurrence || ""));
    const row={title:form.title,category:form.category||"Home",priority:form.priority||"med",due_date:form.due_date||null,recurring_interval_days:recurrence?.supported ? recurrence.days : null,last_completed:null,is_important:form.is_important||false,notes:form.notes||"",completed:false};
    try{
      await tasks.insert(row);
      close();setToast({message:"Task created. Opening Tasks."});onNavigate("tasks");
    }catch(e){setSaveError(formatUserFacingError(e, "Task could not be saved right now."));}
  }
  async function savePool(){
    if(submitting)return;
    setSaveError(null);
    const validation = validatePoolTestForm(form);
    if(!validation.valid){setSaveError(validation.message);return;}
    const row = buildPoolReadingRow(form);
    try{
      setSubmitting(true);
      await poolReadings.insert(row);
      close();setToast({message:"Pool reading saved."});onNavigate("pool");
    }catch(e){setSaveError(formatUserFacingError(e, "Pool reading could not be saved right now."));}
    finally{setSubmitting(false);}
  }
  async function savePoolTreatment(){
    setSaveError(null);
    function num(v){return(v===undefined||v===null||v==='') ? null : +v;}
    const d = form.date||TODAY_STR;
    const row={date:d,logged_at:new Date(`${d}T${form.time||new Date().toTimeString().slice(0,5)}:00`).toISOString(),muriatic_acid_oz:num(form.muriatic_acid_oz),salt_lbs:num(form.salt_lbs),cya_oz:num(form.cya_oz),liquid_chlorine_oz:num(form.liquid_chlorine_oz),swg_pct_before:num(form.swg_pct_before),swg_pct_after:num(form.swg_pct_after),water_clarity:form.water_clarity||"",notes:form.notes||""};
    try{
      await poolTreatments.insert(row);
      close();setToast({message:"Pool chemical entry saved."});onNavigate("pool");
    }catch(e){setSaveError(formatUserFacingError(e, "Pool chemical entry could not be saved right now."));}
  }
  async function savePoolMaintenance(kind="Maintenance Completed"){
    setSaveError(null);
    const row={date:form.date||TODAY_STR,type:form.type||kind,water_clarity:form.water_clarity||"",notes:form.notes||""};
    try{
      await poolMaintenance.insert(row);
      close();setToast({message:"Pool entry saved."});onNavigate("pool");
    }catch(e){setSaveError(formatUserFacingError(e, "Pool entry could not be saved right now."));}
  }
  async function saveLifeList(){
    setSaveError(null);
    if(!form.title){setSaveError("List name is required");return;}
    if(!canManageSharedLists && (form.visibility||"personal") !== "personal"){setSaveError("Your role can create personal lists only.");return;}
    const row={name:form.title,description:form.notes||"",category:form.category||"",visibility:form.visibility||(canManageSharedLists?"household":"personal"),favorite:form.favorite||false,archived:false,color:"#4A90D9",icon:"✓",sort_order:lifeLists.data.length+1,updated_at:new Date().toISOString()};
    try{
      await lifeLists.insert(row);
      close();setToast({message:"Life List created."});onNavigate("life-lists");
    }catch(e){setSaveError(formatUserFacingError(e, "Life List could not be saved right now."));}
  }
  async function saveLifeItem(){
    setSaveError(null);
    if(!form.title){setSaveError("Item title is required");return;}
    if(!form.list_id){setSaveError("Choose a Life List first.");return;}
    if(!writableLifeLists.some(list=>list.id===form.list_id)){setSaveError("Choose a list you can update.");return;}
    const row={list_id:form.list_id,title:form.title,description:form.notes||"",priority:form.priority||"med",status:"planned",favorite:form.favorite||false,archived:false,tags:(form.tags||"").split(",").map(tag=>tag.trim()).filter(Boolean),link_url:form.link_url||"",image_url:"",sort_order:lifeItems.data.filter(item=>item.list_id===form.list_id).length+1,updated_at:new Date().toISOString()};
    try{
      await lifeItems.insert(row);
      await lifeLists.update(form.list_id,{updated_at:new Date().toISOString()});
      close();setToast({message:"Life List item added."});onNavigate("life-lists");
    }catch(e){setSaveError(formatUserFacingError(e, "Life List item could not be saved right now."));}
  }
  async function saveShoppingList(){
    setSaveError(null);
    if(!form.title){setSaveError("List name is required");return;}
    if(!canManageSharedLists && (form.visibility||"personal") !== "personal"){setSaveError("Your role can create personal lists only.");return;}
    const row={name:form.title,description:form.notes||"",category:form.category||"Grocery",visibility:form.visibility||(canManageSharedLists?"household":"personal"),favorite:form.favorite||false,archived:false,color:"#3DB87A",icon:"S",sort_order:shoppingLists.data.length+1,updated_at:new Date().toISOString()};
    try{
      await shoppingLists.insert(row);
      close();setToast({message:"Shopping list created."});onNavigate("shopping");
    }catch(e){setSaveError(formatUserFacingError(e, "Shopping list could not be saved right now."));}
  }
  async function saveShoppingItem(){
    setSaveError(null);
    if(!form.title){setSaveError("Item name is required");return;}
    if(!form.list_id){setSaveError("Choose a shopping list first.");return;}
    if(!writableShoppingLists.some(list=>list.id===form.list_id)){setSaveError("Choose a list you can update.");return;}
    const row={list_id:form.list_id,name:form.title,quantity:form.quantity||1,unit:form.unit||"",category:form.category||"Grocery",priority:form.priority||"med",purchased:false,notes:form.notes||"",favorite:form.favorite||false,archived:false,sort_order:shoppingItems.data.filter(item=>item.list_id===form.list_id).length+1,updated_at:new Date().toISOString()};
    try{
      await shoppingItems.insert(row);
      await shoppingLists.update(form.list_id,{updated_at:new Date().toISOString()});
      close();setToast({message:"Shopping item added."});onNavigate("shopping");
    }catch(e){setSaveError(formatUserFacingError(e, "Shopping item could not be saved right now."));}
  }
  async function saveRecipe(){
    setSaveError(null);
    if(!form.title){setSaveError("Recipe title is required");return;}
    if(!canManageSharedLists && (form.visibility||"personal") !== "personal"){setSaveError("Your role can create personal recipes only.");return;}
    const row={title:form.title,description:form.notes||"",category:form.category||"",meal_type:form.meal_type||"dinner",prep_time_minutes:0,cook_time_minutes:0,servings:0,difficulty:"easy",instructions:"",notes:form.notes||"",favorite:form.favorite||false,tags:(form.tags||"").split(",").map(tag=>tag.trim()).filter(Boolean),visibility:form.visibility||(canManageSharedLists?"household":"personal"),archived:false,sort_order:recipes.data.length+1,updated_at:new Date().toISOString()};
    try{
      await recipes.insert(row);
      close();setToast({message:"Recipe created."});onNavigate("meal-planning");
    }catch(e){setSaveError(formatUserFacingError(e, "Recipe could not be saved right now."));}
  }
  async function saveMealPlan(){
    setSaveError(null);
    if(!form.title){setSaveError("Meal plan name is required");return;}
    if(!canManageSharedLists && (form.visibility||"personal") !== "personal"){setSaveError("Your role can create personal plans only.");return;}
    const row={name:form.title,description:form.notes||"",plan_type:form.plan_type||"weekly",start_date:form.start_date||TODAY_STR,end_date:form.end_date||null,visibility:form.visibility||(canManageSharedLists?"household":"personal"),favorite:form.favorite||false,archived:false,notes:form.notes||"",sort_order:mealPlans.data.length+1,updated_at:new Date().toISOString()};
    try{
      await mealPlans.insert(row);
      close();setToast({message:"Meal plan created."});onNavigate("meal-planning");
    }catch(e){setSaveError(formatUserFacingError(e, "Meal plan could not be saved right now."));}
  }
  async function saveMealAssignment(){
    setSaveError(null);
    if(!form.plan_id){setSaveError("Choose a meal plan first.");return;}
    if(!writableMealPlans.some(plan=>plan.id===form.plan_id)){setSaveError("Choose a meal plan you can update.");return;}
    if(!form.recipe_id&&!form.title){setSaveError("Choose a recipe or add a meal title.");return;}
    const recipe=recipes.data.find(item=>item.id===form.recipe_id);
    const row={meal_plan_id:form.plan_id,recipe_id:form.recipe_id||null,title:form.title||recipe?.title||"",meal_date:form.meal_date||TODAY_STR,meal_type:form.meal_type||"dinner",notes:form.notes||"",favorite:form.favorite||false,archived:false,updated_at:new Date().toISOString()};
    try{
      await mealAssignments.insert(row);
      await mealPlans.update(form.plan_id,{updated_at:new Date().toISOString()});
      close();setToast({message:"Meal assigned."});onNavigate("meal-planning");
    }catch(e){setSaveError(formatUserFacingError(e, "Meal assignment could not be saved right now."));}
  }

  return(<>
    {toast&&(
      <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-card-foreground shadow-soft" role="status" aria-live="polite">
        <div className="flex items-center justify-between gap-3">
          <span>{toast.message}</span>
          <Button type="button" variant="ghost" size="xs" onClick={()=>setToast(null)}>Dismiss</Button>
        </div>
      </div>
    )}
    <OriginDrawer open={open} onOpenChange={(nextOpen)=>{ if(!nextOpen) close(); }} title={modeTitle}>
        {!mode&&<>
          <SectionHeader title="Capture" className="mt-0"/>
          <div className="space-y-2">
          {options.filter(option => option.featured).map(o=>{
            const Icon = o.icon;
            return (
              <button key={o.id} disabled={!o.enabled} onClick={()=>o.enabled&&chooseMode(o.id)} className={`flex min-h-12 w-full items-center gap-3 rounded-lg border border-l-[3px] border-border bg-secondary px-4 py-3 text-left text-foreground transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60 ${o.accentClass}`}>
                <Icon size={20} aria-hidden="true" className={o.iconClass}/>
                <span className="min-w-0 flex-1 text-sm font-semibold">{o.label}</span>
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{o.status}</span>
              </button>
            );
          })}
          </div>
          <Button type="button" variant="secondary" className="mt-4 w-full" onClick={close}>Cancel</Button>
        </>}

        {mode==="task"&&<>
          <FormSection>
            <FormGroup>
              <Label>Title</Label>
              <Input placeholder="e.g. Mow front yard" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Category</Label>
              <ChipGroup value={form.category} options={CATS} ariaLabel="Task category" onValueChange={category=>setForm(p=>({...p,category}))}/>
            </FormGroup>
            <button type="button" className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-3 text-left text-sm font-semibold text-secondary-foreground" onClick={()=>setForm(p=>({...p,is_important:!p.is_important}))}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${form.is_important?"border-violet-400 bg-violet-500 text-white":"border-muted-foreground"}`}>
                {form.is_important&&<Check size={14} aria-hidden="true"/>}
              </span>
              Mark as important
            </button>
            <FormGroup>
              <Label>Due Date (optional)</Label>
              <Input type="date" value={form.due_date||""} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Repeat</Label>
              <ChipGroup value={form.recurrence||""} options={RECURRING_OPTIONS.map(option=>({...option,label:option.supported?option.label:`${option.label}`,disabled:!option.supported}))} ariaLabel="Task recurrence" onValueChange={recurrence=>setForm(p=>({...p,recurrence}))}/>
              <FormHelp>Weekday-only recurrence needs a future recurrence model.</FormHelp>
            </FormGroup>
            <FormGroup>
              <Label>Notes (optional)</Label>
              <Input placeholder="Details" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
            </FormGroup>
              <Button type="button" className="w-full" onClick={saveTask}>Add Task</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

        {mode==="life-list"&&<>
          <FormSection>
            <FormGroup>
              <Label>Name</Label>
              <Input placeholder="e.g. Vacation ideas" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Category</Label>
              <Input placeholder="Movies, Books, Travel, Gifts..." value={form.category||""} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Visibility</Label>
              <SegmentedControl value={form.visibility||(canManageSharedLists?"household":"personal")} options={(canManageSharedLists?[{value:"household",label:"Household"},{value:"personal",label:"Personal"},{value:"shared",label:"Shared"}]:[{value:"personal",label:"Personal"}])} ariaLabel="Life List visibility" onValueChange={visibility=>setForm(p=>({...p,visibility}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Description</Label>
              <Input placeholder="Optional notes" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
            </FormGroup>
            <button type="button" className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-3 text-left text-sm font-semibold text-secondary-foreground" onClick={()=>setForm(p=>({...p,favorite:!p.favorite}))}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${form.favorite?"border-violet-400 bg-violet-500 text-white":"border-muted-foreground"}`}>
                {form.favorite&&<Check size={14} aria-hidden="true"/>}
              </span>
              Favorite list
            </button>
            <Button type="button" className="w-full" onClick={saveLifeList}>Create Life List</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

        {mode==="shopping-list"&&<>
          <FormSection>
            <FormGroup>
              <Label>Name</Label>
              <Input placeholder="e.g. Grocery list" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Category</Label>
              <Input placeholder="Grocery, Costco, Household..." value={form.category||""} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Visibility</Label>
              <SegmentedControl value={form.visibility||(canManageSharedLists?"household":"personal")} options={(canManageSharedLists?[{value:"household",label:"Household"},{value:"personal",label:"Personal"},{value:"shared",label:"Shared"}]:[{value:"personal",label:"Personal"}])} ariaLabel="Shopping list visibility" onValueChange={visibility=>setForm(p=>({...p,visibility}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Description</Label>
              <Input placeholder="Optional notes" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
            </FormGroup>
            <button type="button" className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary px-3 py-3 text-left text-sm font-semibold text-secondary-foreground" onClick={()=>setForm(p=>({...p,favorite:!p.favorite}))}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${form.favorite?"border-violet-400 bg-violet-500 text-white":"border-muted-foreground"}`}>
                {form.favorite&&<Check size={14} aria-hidden="true"/>}
              </span>
              Favorite list
            </button>
            <Button type="button" className="w-full" onClick={saveShoppingList}>Create Shopping List</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

        {mode==="shopping-item"&&<>
          <FormSection>
            <FormGroup>
              <Label>List</Label>
              <select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.list_id||""} onChange={e=>setForm(p=>({...p,list_id:e.target.value}))}>
                <option value="">Choose a list</option>
                {writableShoppingLists.map(list=><option key={list.id} value={list.id}>{list.name}</option>)}
              </select>
              {!writableShoppingLists.length&&<FormHelp>Create a personal shopping list before adding an item.</FormHelp>}
            </FormGroup>
            <FormGroup>
              <Label>Name</Label>
              <Input placeholder="e.g. Milk" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
            </FormGroup>
            <FormRow>
              <FormGroup>
                <Label>Quantity</Label>
                <Input type="number" min="0" step="0.5" value={form.quantity||""} onChange={e=>setForm(p=>({...p,quantity:e.target.value}))}/>
              </FormGroup>
              <FormGroup>
                <Label>Unit</Label>
                <Input placeholder="ct, lb, oz" value={form.unit||""} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}/>
              </FormGroup>
            </FormRow>
            <FormGroup>
              <Label>Category</Label>
              <Input placeholder="Grocery" value={form.category||""} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Priority</Label>
              <SegmentedControl value={form.priority||"med"} options={[{value:"low",label:"Low"},{value:"med",label:"Med"},{value:"high",label:"High"}]} ariaLabel="Shopping item priority" onValueChange={priority=>setForm(p=>({...p,priority}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Notes</Label>
              <Input placeholder="Brand, size, store note..." value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
            </FormGroup>
            <Button type="button" className="w-full" onClick={saveShoppingItem}>Add Shopping Item</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

        {mode==="recipe"&&<>
          <FormSection>
            <FormGroup>
              <Label>Recipe Name</Label>
              <Input placeholder="e.g. Chicken tacos" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Meal</Label>
              <SegmentedControl value={form.meal_type||"dinner"} options={[{value:"breakfast",label:"Breakfast"},{value:"lunch",label:"Lunch"},{value:"dinner",label:"Dinner"},{value:"snack",label:"Snack"},{value:"other",label:"Other"}]} ariaLabel="Recipe meal type" onValueChange={meal_type=>setForm(p=>({...p,meal_type}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Category</Label>
              <Input placeholder="Family, pasta, grill..." value={form.category||""} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Visibility</Label>
              <SegmentedControl value={form.visibility||(canManageSharedLists?"household":"personal")} options={(canManageSharedLists?[{value:"household",label:"Household"},{value:"personal",label:"Personal"},{value:"shared",label:"Shared"}]:[{value:"personal",label:"Personal"}])} ariaLabel="Recipe visibility" onValueChange={visibility=>setForm(p=>({...p,visibility}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Tags</Label>
              <Input placeholder="weeknight, family" value={form.tags||""} onChange={e=>setForm(p=>({...p,tags:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Notes</Label>
              <Input placeholder="Optional details" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
            </FormGroup>
            <Button type="button" className="w-full" onClick={saveRecipe}>Create Recipe</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

        {mode==="meal-plan"&&<>
          <FormSection>
            <FormGroup>
              <Label>Name</Label>
              <Input placeholder="e.g. This Week" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Type</Label>
              <SegmentedControl value={form.plan_type||"weekly"} options={[{value:"weekly",label:"Weekly"},{value:"monthly",label:"Monthly"},{value:"custom",label:"Custom"}]} ariaLabel="Meal plan type" onValueChange={plan_type=>setForm(p=>({...p,plan_type}))}/>
            </FormGroup>
            <FormRow>
              <FormGroup><Label>Start</Label><Input type="date" value={form.start_date||TODAY_STR} onChange={e=>setForm(p=>({...p,start_date:e.target.value}))}/></FormGroup>
              <FormGroup><Label>End</Label><Input type="date" value={form.end_date||""} onChange={e=>setForm(p=>({...p,end_date:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormGroup>
              <Label>Visibility</Label>
              <SegmentedControl value={form.visibility||(canManageSharedLists?"household":"personal")} options={(canManageSharedLists?[{value:"household",label:"Household"},{value:"personal",label:"Personal"},{value:"shared",label:"Shared"}]:[{value:"personal",label:"Personal"}])} ariaLabel="Meal plan visibility" onValueChange={visibility=>setForm(p=>({...p,visibility}))}/>
            </FormGroup>
            <FormGroup><Label>Notes</Label><Input value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormGroup>
            <Button type="button" className="w-full" onClick={saveMealPlan}>Create Meal Plan</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

        {mode==="meal-assignment"&&<>
          <FormSection>
            <FormGroup>
              <Label>Meal Plan</Label>
              <select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.plan_id||""} onChange={e=>setForm(p=>({...p,plan_id:e.target.value}))}>
                <option value="">Choose a plan</option>
                {writableMealPlans.map(plan=><option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
              {!writableMealPlans.length&&<FormHelp>Create a personal meal plan before assigning a meal.</FormHelp>}
            </FormGroup>
            <FormRow>
              <FormGroup><Label>Date</Label><Input type="date" value={form.meal_date||TODAY_STR} onChange={e=>setForm(p=>({...p,meal_date:e.target.value}))}/></FormGroup>
              <FormGroup><Label>Meal</Label><SegmentedControl value={form.meal_type||"dinner"} options={[{value:"breakfast",label:"Breakfast"},{value:"lunch",label:"Lunch"},{value:"dinner",label:"Dinner"},{value:"snack",label:"Snack"}]} ariaLabel="Meal type" onValueChange={meal_type=>setForm(p=>({...p,meal_type}))}/></FormGroup>
            </FormRow>
            <FormGroup>
              <Label>Recipe</Label>
              <select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.recipe_id||""} onChange={e=>setForm(p=>({...p,recipe_id:e.target.value}))}>
                <option value="">No recipe</option>
                {recipes.data.filter(recipe=>!recipe.archived).map(recipe=><option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}
              </select>
            </FormGroup>
            <FormGroup><Label>Meal Title</Label><Input placeholder="Optional if recipe is selected" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></FormGroup>
            <FormGroup><Label>Notes</Label><Input value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormGroup>
            <Button type="button" className="w-full" onClick={saveMealAssignment}>Assign Meal</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

        {mode==="life-item"&&<>
          <FormSection>
            <FormGroup>
              <Label>List</Label>
              <select className="flex h-11 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground" value={form.list_id||""} onChange={e=>setForm(p=>({...p,list_id:e.target.value}))}>
                <option value="">Choose a list</option>
                {writableLifeLists.map(list=><option key={list.id} value={list.id}>{list.name}</option>)}
              </select>
              {!writableLifeLists.length&&<FormHelp>Create a personal list before adding an item.</FormHelp>}
            </FormGroup>
            <FormGroup>
              <Label>Title</Label>
              <Input placeholder="e.g. Watch The Princess Bride" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Priority</Label>
              <SegmentedControl value={form.priority||"med"} options={[{value:"low",label:"Low"},{value:"med",label:"Med"},{value:"high",label:"High"}]} ariaLabel="Life List item priority" onValueChange={priority=>setForm(p=>({...p,priority}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Tags</Label>
              <Input placeholder="movie, family night" value={form.tags||""} onChange={e=>setForm(p=>({...p,tags:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Link</Label>
              <Input placeholder="https://..." value={form.link_url||""} onChange={e=>setForm(p=>({...p,link_url:e.target.value}))}/>
            </FormGroup>
            <FormGroup>
              <Label>Notes</Label>
              <Input placeholder="Optional details" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
            </FormGroup>
            <Button type="button" className="w-full" onClick={saveLifeItem}>Add Item</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

        {mode==="pool"&&<>
          <FormSection>
            <DateTimeField date={form.date||TODAY_STR} time={form.time||new Date().toTimeString().slice(0,5)} onDateChange={date=>setField("date",date)} onTimeChange={time=>setField("time",time)} />
            <FormGroup>
              <Label>Test Source</Label>
              <SegmentedControl value={form.test_source||"Manual"} options={[{value:"Taylor Kit",label:"Taylor Kit"},{value:"Pool Store",label:"Pool Store"},{value:"Manual",label:"Manual"}]} ariaLabel="Pool test source" onValueChange={test_source=>setField("test_source",test_source)}/>
            </FormGroup>
            <div className="flex items-center justify-between gap-3">
              <Label className="mb-0">FC entry</Label>
              <SegmentedControl value={form._drops?"drops":"ppm"} options={[{value:"ppm",label:"ppm"},{value:"drops",label:"K-2006"}]} ariaLabel="Free chlorine entry mode" onValueChange={v=>setField("_drops",v==="drops")}/>
            </div>
            <FormSection title="Chemistry" description="Add any tested values or context from the pool check.">
              <FormRow>{POOL_TEST_PRIMARY_FIELDS.slice(0,2).map(renderPoolNumberField)}</FormRow>
              <FormRow>{POOL_TEST_PRIMARY_FIELDS.slice(2,4).map(renderPoolNumberField)}</FormRow>
              <FormRow>{POOL_TEST_PRIMARY_FIELDS.slice(4,6).map(renderPoolNumberField)}</FormRow>
              {renderPoolNumberField(POOL_TEST_PRIMARY_FIELDS[6])}
            </FormSection>
            <NotesField value={form.notes||""} onChange={value=>setField("notes",value)} />
            <div className="grid grid-cols-2 gap-2">
              <ToggleField checked={Boolean(form.recent_heavy_usage)} label="Party" onChange={checked=>setField("recent_heavy_usage",checked)} />
              <ToggleField checked={hasRainContext(form)} label="Rain" onChange={checked=>setField("recent_weather_notes",setRainContext(form,checked))} />
            </div>
            <FormRow>
              {POOL_TEST_ADVANCED_FIELDS.slice(0,2).map(renderPoolNumberField)}
            </FormRow>
            <ValidationSummary error={saveError} />
            <SaveCancelFooter saveLabel="Save Reading" cancelLabel="Back" onSave={savePool} onCancel={()=>setMode(null)} submitting={submitting} />
          </FormSection>
        </>}

        {mode==="pool-treatment"&&<>
          <FormSection>
            <FormRow>
              <FormGroup><Label>Date</Label><Input type="date" value={form.date||TODAY_STR} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></FormGroup>
              <FormGroup><Label>Time</Label><Input type="time" value={form.time||new Date().toTimeString().slice(0,5)} onChange={e=>setForm(p=>({...p,time:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup><Label>Muriatic Acid (oz)</Label><Input type="number" value={form.muriatic_acid_oz||""} onChange={e=>setForm(p=>({...p,muriatic_acid_oz:e.target.value}))}/></FormGroup>
              <FormGroup><Label>Salt (lb)</Label><Input type="number" value={form.salt_lbs||""} onChange={e=>setForm(p=>({...p,salt_lbs:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup><Label>CYA (oz)</Label><Input type="number" value={form.cya_oz||""} onChange={e=>setForm(p=>({...p,cya_oz:e.target.value}))}/></FormGroup>
              <FormGroup><Label>Chlorine (oz)</Label><Input type="number" value={form.liquid_chlorine_oz||""} onChange={e=>setForm(p=>({...p,liquid_chlorine_oz:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup><Label>SWG Before</Label><Input type="number" value={form.swg_pct_before||""} onChange={e=>setForm(p=>({...p,swg_pct_before:e.target.value}))}/></FormGroup>
              <FormGroup><Label>SWG After</Label><Input type="number" value={form.swg_pct_after||""} onChange={e=>setForm(p=>({...p,swg_pct_after:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormGroup><Label>Water Clarity</Label><Input value={form.water_clarity||""} onChange={e=>setForm(p=>({...p,water_clarity:e.target.value}))}/></FormGroup>
            <FormGroup><Label>Notes</Label><Input value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormGroup>
            <Button type="button" className="w-full" onClick={savePoolTreatment}>Save Chemical Entry</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

        {(mode==="pool-maintenance"||mode==="pool-note")&&<>
          <FormSection>
            <FormGroup><Label>Date</Label><Input type="date" value={form.date||TODAY_STR} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></FormGroup>
            <FormGroup><Label>Type</Label><Input value={form.type||""} placeholder={mode==="pool-note"?"Pool note, weather note, pool party":"Filter cleaning, SWG cleaning, robot maintenance"} onChange={e=>setForm(p=>({...p,type:e.target.value}))}/></FormGroup>
            <FormGroup><Label>Water Clarity</Label><Input value={form.water_clarity||""} onChange={e=>setForm(p=>({...p,water_clarity:e.target.value}))}/></FormGroup>
            <FormGroup><Label>Notes</Label><Input value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormGroup>
            <Button type="button" className="w-full" onClick={()=>savePoolMaintenance(mode==="pool-note"?"Pool Note":"Maintenance Completed")}>Save Pool Entry</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

    </OriginDrawer>
  </>);
}
