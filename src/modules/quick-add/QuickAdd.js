import { useState } from "react";
import { COLORS, S } from "../../theme";
import { TODAY_STR } from "../../lib/dates";
import { sb } from "../../lib/supabase";
import { useTable } from "../../hooks/useTable";
// - QUICK ADD -
export function QuickAdd({onNavigate}){
  const [open,setOpen] = useState(false);
  const maintLog = useTable("pool_maintenance","date");
  const deadlines = useTable("college_deadlines","due_date",true);
  const [form,setForm] = useState({});
  const [mode,setMode] = useState(null);
  const [saveError,setSaveError] = useState(null);

  function close(){setOpen(false);setMode(null);setForm({});setSaveError(null);}

  const options=[
    {id:"task",    icon:" ", label:"Quick Task",      color:COLORS.purple},
    {id:"pool",    icon:" ", label:"Pool Reading",    color:COLORS.blue},
    {id:"maint",   icon:" ", label:"Maintenance",     color:COLORS.amber},
    {id:"college", icon:" ", label:"College Deadline",color:COLORS.red},
    {id:"note",    icon:" ", label:"Quick Note",      color:COLORS.slate},
  ];

  const CATS = ["Pool","Yard","Home","College","Finance","Personal","Work"];
  const NOTE_TAGS = ["Pool","Home","College","Finance","General"];

  async function saveTask(){
    setSaveError(null);
    if(!form.title){setSaveError("Title is required");return;}
    const row={title:form.title,category:form.category||"Home",priority:form.priority||"med",due_date:form.due_date||null,recurring_interval_days:form.recurring_interval_days?+form.recurring_interval_days:null,last_completed:null,is_important:form.is_important||false,notes:form.notes||"",completed:false};
    try{
      const{error}=await sb.from("tasks").insert(row);
      if(error){setSaveError(`Save failed   ${error.message||JSON.stringify(error)}`);return;}
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
    <button onClick={()=>setOpen(true)}
      style={{position:"fixed",bottom:80,right:20,width:52,height:52,borderRadius:"50%",background:COLORS.blue,color:"#fff",border:"none",fontSize:26,fontWeight:300,cursor:"pointer",zIndex:30,boxShadow:"0 4px 20px rgba(74,144,217,0.4)",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,WebkitTapHighlightColor:"transparent"}}>+</button>

    {open&&<div style={S.modal} onClick={e=>e.target===e.currentTarget&&close()}>
      <div style={S.sheet}>
        <div style={S.sheetHandle}/>
        {!mode&&<>
          <div style={{...S.sheetTitle,marginBottom:20}}>Quick Add</div>
          {options.map(o=>(
            <button key={o.id} onClick={()=>setMode(o.id)} style={{display:"flex",alignItems:"center",gap:14,width:"100%",background:COLORS.navyLight,border:`1px solid ${COLORS.navyLight}`,borderLeft:`3px solid ${o.color}`,borderRadius:12,padding:"14px 16px",marginBottom:10,cursor:"pointer",color:COLORS.white,textAlign:"left"}}>
              <span style={{fontSize:22}}>{o.icon}</span>
              <span style={{fontSize:15,fontWeight:600}}>{o.label}</span>
            </button>
          ))}
          <button onClick={close} style={{...S.btnSm,width:"100%",marginTop:10}}>Cancel</button>
        </>}

        {mode==="task"&&<>
          <div style={S.sheetTitle}>  Quick Task</div>
          <label style={S.label}>Title</label>
          <input style={S.input} placeholder="e.g. Mow front yard" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
          <label style={S.label}>Category</label>
          <div>{CATS.map(c=><span key={c} style={S.chip(form.category===c,COLORS.purple)} onClick={()=>setForm(p=>({...p,category:c}))}>{c}</span>)}</div>
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"12px 0 8px"}}>
            <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${form.is_important?COLORS.purple:COLORS.slate}`,background:form.is_important?COLORS.purple:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}} onClick={()=>setForm(p=>({...p,is_important:!p.is_important}))}>
              {form.is_important&&<span style={{color:"#fff",fontSize:12,lineHeight:1}}> </span>}
            </div>
            <label style={{...S.label,marginBottom:0,cursor:"pointer"}} onClick={()=>setForm(p=>({...p,is_important:!p.is_important}))}>  Mark as important</label>
          </div>
          <label style={S.label}>Due Date (optional)</label>
          <input type="date" style={S.input} value={form.due_date||""} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>
          <label style={S.label}>Recurring (optional)</label>
          <div style={{marginBottom:12}}>
            {[null,3,7,14,30,60,90].map(d=>(
              <span key={d||"none"} style={S.chip(form.recurring_interval_days===(d?String(d):null)||form.recurring_interval_days===d, COLORS.blue)}
                onClick={()=>setForm(p=>({...p,recurring_interval_days:d||null}))}>
                {d?`Every ${d}d`:"One-time"}
              </span>
            ))}
          </div>
          <label style={S.label}>Notes (optional)</label>
          <input style={S.input} placeholder="Details" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
          <button style={S.btn} onClick={saveTask}>Add Task</button>
          {saveError&&<div style={{fontSize:15,color:COLORS.red,marginTop:10}}>{saveError}</div>}
          <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>setMode(null)}>  Back</button>
        </>}

        {mode==="pool"&&<>
          <div style={S.sheetTitle}>  Pool Reading</div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Date</label><input type="date" style={S.input} value={form.date||TODAY_STR} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
            <div style={{flex:"0 0 100px"}}><label style={S.label}>Time</label><input type="time" style={S.input} value={form.time||new Date().toTimeString().slice(0,5)} onChange={e=>setForm(p=>({...p,time:e.target.value}))}/></div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <label style={{...S.label,marginBottom:0}}>Free Chlorine</label>
            <div style={{display:"flex",gap:6}}>
              <span style={S.chip(!form._drops,COLORS.blue)} onClick={()=>setForm(p=>({...p,_drops:false}))}>ppm</span>
              <span style={S.chip(!!form._drops,COLORS.purple)} onClick={()=>setForm(p=>({...p,_drops:true}))}>K-2006</span>
            </div>
          </div>
          <input type="number" step="0.5" style={S.input} placeholder={form._drops?"e.g. 11 drops":"e.g. 5.5"} value={form.free_chlorine||""} onChange={e=>setForm(p=>({...p,free_chlorine:e.target.value}))}/>
          {form._drops&&form.free_chlorine&&<div style={{fontSize:15,color:COLORS.purple,marginTop:-6,marginBottom:10}}>= {(+form.free_chlorine*0.5).toFixed(1)} ppm FC</div>}
          <label style={S.label}>CC</label>
          <input type="number" step="0.5" style={S.input} placeholder="0" value={form.cc!==undefined?form.cc:""} onChange={e=>setForm(p=>({...p,cc:e.target.value}))}/>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>pH</label><input type="number" step="0.1" style={S.input} value={form.ph||""} onChange={e=>setForm(p=>({...p,ph:e.target.value}))}/></div>
            <div style={S.col}><label style={S.label}>Salt (ppm)</label><input type="number" style={S.input} value={form.salt||""} onChange={e=>setForm(p=>({...p,salt:e.target.value}))}/></div>
          </div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>CYA (ppm)</label><input type="number" style={S.input} value={form.cya||""} onChange={e=>setForm(p=>({...p,cya:e.target.value}))}/></div>
            <div style={S.col}><label style={S.label}>TA (ppm)</label><input type="number" style={S.input} value={form.alkalinity||""} onChange={e=>setForm(p=>({...p,alkalinity:e.target.value}))}/></div>
          </div>
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Filter PSI</label><input type="number" style={S.input} value={form.filter_pressure||""} onChange={e=>setForm(p=>({...p,filter_pressure:e.target.value}))}/></div>
            <div style={S.col}><label style={S.label}>SWG (%)</label><input type="number" style={S.input} value={form.swg_setting||""} onChange={e=>setForm(p=>({...p,swg_setting:e.target.value}))}/></div>
          </div>
          <label style={S.label}>Notes</label>
          <input style={S.input} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
          <button style={S.btn} onClick={savePool}>Save Reading</button>
          {saveError&&<div style={{fontSize:15,color:COLORS.red,marginTop:10}}>{saveError}</div>}
          <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>setMode(null)}>  Back</button>
        </>}

        {mode==="maint"&&<>
          <div style={S.sheetTitle}>  Maintenance Task</div>
          <label style={S.label}>Task</label>
          <div>{["Check water level","Clean skimmer basket","Brushed walls & floor","Added salt","Cleaned cartridge filter","Cleaned salt cell","Checked flow switch","Other"].map(t=>(
            <span key={t} style={S.chip(form.type===t,COLORS.amber)} onClick={()=>setForm(p=>({...p,type:t}))}>{t}</span>
          ))}</div>
          <label style={S.label}>Date</label>
          <input type="date" style={S.input} value={form.date||TODAY_STR} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
          <label style={S.label}>Notes</label>
          <input style={S.input} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
          <button style={S.btn} onClick={saveMaint}>Log Task</button>
          <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>setMode(null)}>  Back</button>
        </>}

        {mode==="college"&&<>
          <div style={S.sheetTitle}>  College Deadline</div>
          <label style={S.label}>Title</label>
          <input style={S.input} placeholder="e.g. Submit Common App" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
          <label style={S.label}>Due Date</label>
          <input type="date" style={S.input} value={form.due_date||""} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>
          <label style={S.label}>School (optional)</label>
          <input style={S.input} value={form.school||""} onChange={e=>setForm(p=>({...p,school:e.target.value}))}/>
          <button style={S.btn} onClick={saveCollege}>Add Deadline</button>
          <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>setMode(null)}>  Back</button>
        </>}

        {mode==="note"&&<>
          <div style={S.sheetTitle}>  Quick Note</div>
          <label style={S.label}>Tag</label>
          <div style={{marginBottom:14}}>{NOTE_TAGS.map(t=><span key={t} style={S.chip(form.tag===t,COLORS.slate)} onClick={()=>setForm(p=>({...p,tag:t}))}>{t}</span>)}</div>
          <label style={S.label}>Title (optional)</label>
          <input style={S.input} placeholder="e.g. Contractor quote, reminder, idea " value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
          <label style={S.label}>Note</label>
          <textarea style={{...S.input,minHeight:120,resize:"none",lineHeight:1.5}} placeholder="What do you want to remember?" value={form.body||""} onChange={e=>setForm(p=>({...p,body:e.target.value}))}/>
          <button style={S.btn} onClick={saveNote}>Save Note</button>
          {saveError&&<div style={{fontSize:14,color:COLORS.red,marginTop:10,lineHeight:1.4}}>{saveError}</div>}
          <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>setMode(null)}>  Back</button>
        </>}
      </div>
    </div>}
  </>);
}
