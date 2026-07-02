import { useEffect, useState } from "react";
import { Check, ChevronLeft, ClipboardList, Droplets, FileText, GraduationCap, Plus, Wrench } from "lucide-react";
import { TODAY_STR } from "../../lib/dates";
import { sb } from "../../lib/supabase";
import { useTable } from "../../hooks/useTable";
import { OriginDrawer } from "../../components/origin/drawer";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { FormError, FormGroup, FormHelp, FormRow, FormSection } from "../../components/ui/form";
import { ChipGroup, SegmentedControl } from "../../components/ui/segmented-control";
import { SectionHeader } from "../../components/ui/section-header";
// - QUICK ADD -
export function QuickAdd({onNavigate, openSignal = 0}){
  const [open,setOpen] = useState(false);
  const tasks = useTable("tasks", "due_date", true);
  const maintLog = useTable("pool_maintenance","date");
  const deadlines = useTable("college_deadlines","due_date",true);
  const [form,setForm] = useState({});
  const [mode,setMode] = useState(null);
  const [saveError,setSaveError] = useState(null);

  function close(){setOpen(false);setMode(null);setForm({});setSaveError(null);}

  const options=[
    {id:"task",    icon:ClipboardList, label:"Quick Task",      accentClass:"border-l-violet-400", iconClass:"text-violet-300"},
    {id:"pool",    icon:Droplets,      label:"Pool Reading",    accentClass:"border-l-primary", iconClass:"text-primary"},
    {id:"maint",   icon:Wrench,        label:"Maintenance",     accentClass:"border-l-amber-400", iconClass:"text-amber-300"},
    {id:"college", icon:GraduationCap, label:"College Deadline",accentClass:"border-l-destructive", iconClass:"text-destructive"},
    {id:"note",    icon:FileText,      label:"Quick Note",      accentClass:"border-l-muted-foreground", iconClass:"text-muted-foreground"},
  ];

  const CATS = ["Pool","Yard","Home","College","Finance","Personal","Work"];
  const NOTE_TAGS = ["Pool","Home","College","Finance","General"];
  const RECURRING_OPTIONS = [
    {value:null,label:"One-time"},
    {value:3,label:"Every 3d"},
    {value:7,label:"Every 7d"},
    {value:14,label:"Every 14d"},
    {value:30,label:"Every 30d"},
    {value:60,label:"Every 60d"},
    {value:90,label:"Every 90d"},
  ];
  const MAINT_TYPES = ["Check water level","Clean skimmer basket","Brushed walls & floor","Added salt","Cleaned cartridge filter","Cleaned salt cell","Checked flow switch","Other"];
  const modeTitle = options.find(o=>o.id===mode)?.label || "Quick Add";

  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);

  async function saveTask(){
    setSaveError(null);
    if(!form.title){setSaveError("Title is required");return;}
    const row={title:form.title,category:form.category||"Home",priority:form.priority||"med",due_date:form.due_date||null,recurring_interval_days:form.recurring_interval_days?+form.recurring_interval_days:null,last_completed:null,is_important:form.is_important||false,notes:form.notes||"",completed:false};
    try{
      await tasks.insert(row);
      close();onNavigate("tasks");
    }catch(e){setSaveError(`Error: ${e.message}`);}
  }
  async function saveNote(){
    setSaveError(null);
    if(!form.body?.trim()){setSaveError("Note body is required");return;}
    const row={title:form.title||"",body:form.body.trim(),tag:form.tag||"General",created_at:new Date().toISOString()};
    try{
      const{error}=await sb.from("notes").insert(row);
      if(error){setSaveError(`Save failed   ${error.message||JSON.stringify(error)}`);return;}
      close();
    }catch(e){setSaveError(`Error: ${e.message}`);}
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
      if(error){setSaveError(`Save failed   ${error.message||JSON.stringify(error)}`);return;}
      close();onNavigate("pool");
    }catch(e){setSaveError(`Error: ${e.message}`);}
  }
  async function saveMaint(){
    if(!form.type)return;
    await maintLog.insert({date:form.date||TODAY_STR,type:form.type,notes:form.notes||""});
    close();onNavigate("pool");
  }
  async function saveCollege(){
    if(!form.title||!form.due_date)return;
    await deadlines.insert({title:form.title,due_date:form.due_date,school:form.school||"",category:form.category||"other",completed:false});
    close();onNavigate("college");
  }

  return(<>
    <Button
      type="button"
      size="icon-xl"
      aria-label="Open quick add"
      className="fixed bottom-20 right-5 z-30 h-[52px] w-[52px] rounded-full shadow-[0_4px_20px_rgba(74,144,217,0.4)]"
      onClick={()=>setOpen(true)}
    >
      <Plus aria-hidden="true"/>
    </Button>

    <OriginDrawer open={open} onOpenChange={(nextOpen)=>{ if(!nextOpen) close(); }} title={modeTitle}>
        {!mode&&<>
          <SectionHeader title="Choose Type" className="mt-0"/>
          <div className="space-y-2">
          {options.map(o=>{
            const Icon = o.icon;
            return (
              <button key={o.id} onClick={()=>setMode(o.id)} className={`flex min-h-12 w-full items-center gap-3 rounded-lg border border-l-[3px] border-border bg-secondary px-4 py-3 text-left text-foreground transition-colors hover:border-primary/50 ${o.accentClass}`}>
                <Icon size={20} aria-hidden="true" className={o.iconClass}/>
                <span className="text-sm font-semibold">{o.label}</span>
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
              <Label>Recurring (optional)</Label>
              <ChipGroup value={form.recurring_interval_days??null} options={RECURRING_OPTIONS} ariaLabel="Recurring interval" onValueChange={recurring_interval_days=>setForm(p=>({...p,recurring_interval_days}))}/>
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

        {mode==="maint"&&<>
          <FormSection>
            <FormGroup>
              <Label>Task</Label>
              <ChipGroup value={form.type} options={MAINT_TYPES} ariaLabel="Maintenance task type" onValueChange={type=>setForm(p=>({...p,type}))}/>
            </FormGroup>
            <FormGroup><Label>Date</Label><Input type="date" value={form.date||TODAY_STR} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></FormGroup>
            <FormGroup><Label>Notes</Label><Input value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/></FormGroup>
            <Button type="button" className="w-full" onClick={saveMaint}>Log Task</Button>
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

        {mode==="college"&&<>
          <FormSection>
            <FormGroup><Label>Title</Label><Input placeholder="e.g. Submit Common App" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></FormGroup>
            <FormGroup><Label>Due Date</Label><Input type="date" value={form.due_date||""} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/></FormGroup>
            <FormGroup><Label>School (optional)</Label><Input value={form.school||""} onChange={e=>setForm(p=>({...p,school:e.target.value}))}/></FormGroup>
            <Button type="button" className="w-full" onClick={saveCollege}>Add Deadline</Button>
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}

        {mode==="note"&&<>
          <FormSection>
            <FormGroup>
              <Label>Tag</Label>
              <ChipGroup value={form.tag} options={NOTE_TAGS} ariaLabel="Note tag" onValueChange={tag=>setForm(p=>({...p,tag}))}/>
            </FormGroup>
            <FormGroup><Label>Title (optional)</Label><Input placeholder="e.g. Contractor quote, reminder, idea" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></FormGroup>
            <FormGroup><Label>Note</Label><Textarea placeholder="What do you want to remember?" value={form.body||""} onChange={e=>setForm(p=>({...p,body:e.target.value}))}/></FormGroup>
            <Button type="button" className="w-full" onClick={saveNote}>Save Note</Button>
            {saveError&&<FormError>{saveError}</FormError>}
            <Button type="button" variant="secondary" className="w-full" onClick={()=>setMode(null)}><ChevronLeft aria-hidden="true"/>Back</Button>
          </FormSection>
        </>}
    </OriginDrawer>
  </>);
}
