import { useEffect, useState } from "react";
import { Check, ChevronLeft, ClipboardList, Droplets, ListChecks, ShoppingCart } from "lucide-react";
import { TODAY_STR } from "../../lib/dates";
import { sb } from "../../lib/supabase";
import { formatUserFacingError } from "../../lib/userFacingErrors";
import { useHousehold } from "../../context/HouseholdContext";
import { roleCanManage } from "../../hooks/useHouseholdCollaboration";
import { useTable } from "../../hooks/useTable";
import { OriginDrawer } from "../../components/origin/drawer";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { FormError, FormGroup, FormHelp, FormRow, FormSection } from "../../components/ui/form";
import { ChipGroup, SegmentedControl } from "../../components/ui/segmented-control";
import { SectionHeader } from "../../components/ui/section-header";
// - QUICK ADD -
export function QuickAdd({onNavigate, openSignal = 0}){
  const [open,setOpen] = useState(false);
  const tasks = useTable("tasks", "due_date", true);
  const lifeLists = useTable("life_lists", "updated_at");
  const lifeItems = useTable("life_list_items", "updated_at");
  const shoppingLists = useTable("shopping_lists", "updated_at");
  const shoppingItems = useTable("shopping_items", "updated_at");
  const household = useHousehold();
  const [form,setForm] = useState({});
  const [mode,setMode] = useState(null);
  const [saveError,setSaveError] = useState(null);
  const [toast,setToast] = useState(null);

  function close(){setOpen(false);setMode(null);setForm({});setSaveError(null);}

  const options=[
    {id:"task", icon:ClipboardList, label:"Task", status:"Ready", enabled:true, accentClass:"border-l-violet-400", iconClass:"text-violet-300"},
    {id:"shopping-item", icon:ShoppingCart, label:"Shopping Item", status:"Ready", enabled:true, accentClass:"border-l-emerald-400", iconClass:"text-emerald-300"},
    {id:"shopping-list", icon:ShoppingCart, label:"Shopping List", status:"Ready", enabled:true, accentClass:"border-l-emerald-400", iconClass:"text-emerald-300"},
    {id:"life-item", icon:ListChecks, label:"List Item", status:"Ready", enabled:true, accentClass:"border-l-emerald-400", iconClass:"text-emerald-300"},
    {id:"life-list", icon:ListChecks, label:"Life List", status:"Ready", enabled:true, accentClass:"border-l-emerald-400", iconClass:"text-emerald-300"},
    {id:"pool", icon:Droplets, label:"Pool Reading", status:"Ready", enabled:true, accentClass:"border-l-primary", iconClass:"text-primary"},
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

  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);

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
    setSaveError(null);
    function num(v){return(v===undefined||v===null||v==='') ? null : +v;}
    let fc = num(form.free_chlorine);
    if(form._drops && fc!==null) fc = Math.round(fc * 0.5 * 10) / 10;
    const d = form.date||TODAY_STR;
    const timeStr = form.time || new Date().toTimeString().slice(0,5);
    const loggedAt = new Date(`${d}T${timeStr}:00`).toISOString();
    const row={date:d,logged_at:loggedAt,ph:num(form.ph),free_chlorine:fc,cc:num(form.cc),salt:num(form.salt),cya:num(form.cya),alkalinity:num(form.alkalinity),calcium_hardness:num(form.calcium_hardness),water_temp:num(form.water_temp),filter_pressure:num(form.filter_pressure),swg_setting:num(form.swg_setting),pump_hours:num(form.pump_hours),notes:form.notes||""};
    try{
      const{error}=await sb.from("pool_readings").insert(row);
      if(error){setSaveError(formatUserFacingError(error, "Pool reading could not be saved right now."));return;}
      close();setToast({message:"Pool reading saved."});onNavigate("pool");
    }catch(e){setSaveError(formatUserFacingError(e, "Pool reading could not be saved right now."));}
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
          {options.map(o=>{
            const Icon = o.icon;
            return (
              <button key={o.id} disabled={!o.enabled} onClick={()=>o.enabled&&setMode(o.id)} className={`flex min-h-12 w-full items-center gap-3 rounded-lg border border-l-[3px] border-border bg-secondary px-4 py-3 text-left text-foreground transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60 ${o.accentClass}`}>
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
            <FormRow>
              <FormGroup><Label>Date</Label><Input type="date" value={form.date||TODAY_STR} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></FormGroup>
              <FormGroup><Label>Time</Label><Input type="time" value={form.time||new Date().toTimeString().slice(0,5)} onChange={e=>setForm(p=>({...p,time:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormGroup>
              <div className="flex items-center justify-between gap-3">
                <Label className="mb-0">Free Chlorine</Label>
                <SegmentedControl value={form._drops?"drops":"ppm"} options={[{value:"ppm",label:"ppm"},{value:"drops",label:"K-2006"}]} ariaLabel="Free chlorine entry mode" onValueChange={v=>setForm(p=>({...p,_drops:v==="drops"}))}/>
              </div>
              <Input type="number" step="0.5" placeholder={form._drops?"e.g. 11 drops":"e.g. 5.5"} value={form.free_chlorine||""} onChange={e=>setForm(p=>({...p,free_chlorine:e.target.value}))}/>
              {form._drops&&form.free_chlorine&&<FormHelp>= {(+form.free_chlorine*0.5).toFixed(1)} ppm FC</FormHelp>}
            </FormGroup>
            <FormGroup><Label>CC</Label><Input type="number" step="0.5" placeholder="0" value={form.cc!==undefined?form.cc:""} onChange={e=>setForm(p=>({...p,cc:e.target.value}))}/></FormGroup>
            <FormRow>
              <FormGroup><Label>pH</Label><Input type="number" step="0.1" value={form.ph||""} onChange={e=>setForm(p=>({...p,ph:e.target.value}))}/></FormGroup>
              <FormGroup><Label>Salt (ppm)</Label><Input type="number" value={form.salt||""} onChange={e=>setForm(p=>({...p,salt:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup><Label>CYA (ppm)</Label><Input type="number" value={form.cya||""} onChange={e=>setForm(p=>({...p,cya:e.target.value}))}/></FormGroup>
              <FormGroup><Label>TA (ppm)</Label><Input type="number" value={form.alkalinity||""} onChange={e=>setForm(p=>({...p,alkalinity:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup><Label>Filter PSI</Label><Input type="number" value={form.filter_pressure||""} onChange={e=>setForm(p=>({...p,filter_pressure:e.target.value}))}/></FormGroup>
              <FormGroup><Label>SWG (%)</Label><Input type="number" value={form.swg_setting||""} onChange={e=>setForm(p=>({...p,swg_setting:e.target.value}))}/></FormGroup>
            </FormRow>
            <FormGroup><Label>Notes</Label><Input value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormGroup>
            <Button type="button" className="w-full" onClick={savePool}>Save Reading</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

    </OriginDrawer>
  </>);
}
