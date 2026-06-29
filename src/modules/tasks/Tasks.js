import { useMemo, useState } from "react";
import { EmptyState, Loading, Modal, SwipeCard, SwipeHint } from "../../components/common";
import { useHousehold } from "../../hooks/useHousehold";
import { COLORS, S } from "../../theme";

// - TASKS (merged home maintenance + task tracker) -
export function Tasks({deps}){
  const {
    TODAY_DATE,TODAY_STR,daysBetween,nextDueDate,formatDate,
    maintStatus,maintColor,useTable,
  } = deps;
  const household = useHousehold();
  const householdId = household.currentHousehold?.id || null;
  const taskTableOptions = useMemo(()=>(
    householdId
      ? {
        filters:{household_id:householdId},
        insertDefaults:{household_id:householdId},
      }
      : undefined
  ),[householdId]);
  const tasks      = useTable("tasks","due_date",true,taskTableOptions);
  const homeMaint  = useTable("home_maintenance","title",true);

  const [tab,setTab]             = useState("today");
  const [catFilter,setCatFilter] = useState("All");
  const [showModal,setShowModal] = useState(false);
  const [editItem,setEditItem]   = useState(null);
  const [form,setForm]           = useState({});
  const [activeSwipe,setActiveSwipe] = useState(null);
  const [showMsDo,setShowMsDo]   = useState(false);
  const [showCompleted,setShowCompleted] = useState(false);
  const [showOkMaint,setShowOkMaint] = useState(false);

  const CATS = ["All","Pool","Yard","Home","College","Finance","Personal","Work"];
  const CAT_COLORS = {
    Pool:COLORS.blue, Yard:COLORS.green, Home:COLORS.amber,
    College:COLORS.red, Finance:COLORS.green, Personal:COLORS.purple,
    Work:COLORS.blue, All:COLORS.slate,
  };
  const PRIORITY_COLORS = {high:COLORS.red, med:COLORS.amber, low:COLORS.slate};

  // - Derive task states -
  // Compute effective due date for recurring tasks without a fixed due_date
  function effectiveDueDate(t) {
    if(t.due_date) return t.due_date;
    if(t.recurring_interval_days && t.last_completed) {
      return nextDueDate(t.last_completed, t.recurring_interval_days);
    }
    return null;
  }

  function taskStatus(t) {
    if(t.completed && !t.recurring_interval_days) return "done";
    const eff = effectiveDueDate(t);
    if(!eff && !t.is_important) return "backlog";
    if(!eff && t.is_important) return "important";
    const days = daysBetween(eff);
    if(days < 0) return "overdue";
    if(days === 0) return "today";
    if(days <= 2) return "today";
    if(days <= 7) return "this-week";
    return "upcoming";
  }

  function taskColor(status) {
    return status==="overdue"?COLORS.red:status==="today"?COLORS.amber:status==="important"?COLORS.purple:status==="this-week"?COLORS.blue:COLORS.slate;
  }

  // Mark a task done   if recurring, reset due_date and clear completed
  async function markDone(item) {
    if(item.recurring_interval_days) {
      const nextDue = new Date(TODAY_DATE);
      nextDue.setDate(nextDue.getDate() + item.recurring_interval_days);
      const nextDueStr = nextDue.toISOString().split("T")[0];
      await tasks.update(item.id, {
        title:item.title, category:item.category||"Home", priority:item.priority||"med",
        due_date:nextDueStr, recurring_interval_days:item.recurring_interval_days,
        last_completed:TODAY_STR, is_important:item.is_important||false,
        notes:item.notes||"", completed:false,
      });
    } else {
      await tasks.update(item.id, {
        title:item.title, category:item.category||"Home", priority:item.priority||"med",
        due_date:item.due_date||null, recurring_interval_days:item.recurring_interval_days||null,
        last_completed:TODAY_STR, is_important:item.is_important||false,
        notes:item.notes||"", completed:true,
      });
    }
  }

  // Also mark home_maintenance done
  async function markMaintDone(item) {
    await homeMaint.update(item.id, {title:item.title, last_completed:TODAY_STR, interval_days:item.interval_days, notes:item.notes||""});
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({...item});
    setShowModal(true);
    setActiveSwipe(null);
  }
  function closeModal() { setShowModal(false); setEditItem(null); setForm({}); }

  async function saveTask() {
    if(!form.title) return;
    const row = {
      title:form.title,
      category:form.category||"Home",
      priority:form.priority||"med",
      due_date:form.due_date||null,
      recurring_interval_days:form.recurring_interval_days ? +form.recurring_interval_days : null,
      last_completed:form.last_completed||null,
      is_important:form.is_important||false,
      notes:form.notes||"",
      completed:false,
    };
    if(editItem) await tasks.update(editItem.id, row);
    else await tasks.insert(row);
    closeModal();
  }

  async function deleteTask(id) { await tasks.remove(id); setActiveSwipe(null); }

  // - Filtered task lists -
  const allActive = tasks.data.filter(t => !t.completed || t.recurring_interval_days);
  const filtered  = catFilter==="All" ? allActive : allActive.filter(t=>t.category===catFilter);

  const todayItems    = filtered.filter(t => taskStatus(t)==="overdue" || taskStatus(t)==="today" || (t.is_important && taskStatus(t)!=="done"));
  const thisWeekItems = filtered.filter(t => taskStatus(t)==="this-week" && !t.is_important);
  const upcomingItems = filtered.filter(t => taskStatus(t)==="upcoming");
  const backlogItems  = filtered.filter(t => taskStatus(t)==="backlog" && !t.is_important);
  const completedItems = tasks.data.filter(t => t.completed && !t.recurring_interval_days);

  // Home maintenance urgency groups
  const maintOverdue  = homeMaint.data.filter(m=>maintStatus(m)==="overdue").sort((a,b)=>daysBetween(nextDueDate(a.last_completed,a.interval_days))-daysBetween(nextDueDate(b.last_completed,b.interval_days)));
  const maintDueSoon  = homeMaint.data.filter(m=>maintStatus(m)==="due-soon").sort((a,b)=>daysBetween(nextDueDate(a.last_completed,a.interval_days))-daysBetween(nextDueDate(b.last_completed,b.interval_days)));
  const maintOk       = homeMaint.data.filter(m=>maintStatus(m)==="ok").sort((a,b)=>daysBetween(nextDueDate(a.last_completed,a.interval_days))-daysBetween(nextDueDate(b.last_completed,b.interval_days)));

  // - Subcomponents -
  function TaskCard({item}) {
    const status = taskStatus(item);
    const color  = taskColor(status);
    const eff    = effectiveDueDate(item);
    const days   = eff ? daysBetween(eff) : null;
    const isRecurring = !!item.recurring_interval_days;

    return(
      <SwipeCard id={item.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
        onEdit={()=>openEdit(item)}
        onDelete={()=>deleteTask(item.id)}
        style={S.statusCard(color)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,paddingRight:8}}>
            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
              {item.is_important&&<span style={{fontSize:11,color:COLORS.purple,fontWeight:700}}>  IMPORTANT</span>}
              {isRecurring&&<span style={{fontSize:11,color:COLORS.slate,fontWeight:600}}>  every {item.recurring_interval_days}d</span>}
            </div>
            <div style={{fontSize:15,fontWeight:600,color:COLORS.white}}>{item.title}</div>
            <div style={{display:"flex",gap:8,marginTop:6,alignItems:"center",flexWrap:"wrap"}}>
              <span style={S.badge(CAT_COLORS[item.category]||COLORS.slate)}>{item.category||"Home"}</span>
              <span style={S.badge(PRIORITY_COLORS[item.priority]||COLORS.slate)}>{item.priority||"med"}</span>
              {days!==null&&<span style={{fontSize:13,color:days<0?COLORS.red:days===0?COLORS.amber:COLORS.slate,fontWeight:600}}>
                {days<0?`${-days}d overdue`:days===0?"Today":`in ${days}d`}
              </span>}
              {item.last_completed&&<span style={{fontSize:11,color:COLORS.slate}}>done {formatDate(item.last_completed)}</span>}
            </div>
            {item.notes&&<div style={{fontSize:13,color:COLORS.slate,marginTop:6,fontStyle:"italic",lineHeight:1.4}}>{item.notes}</div>}
          </div>
          <button style={{...S.btnCheck,marginLeft:8,flexShrink:0}} onClick={()=>markDone(item)}> </button>
        </div>
      </SwipeCard>
    );
  }

  function MaintCard({item}) {
    const st    = maintStatus(item);
    const color = maintColor(st);
    const nd    = nextDueDate(item.last_completed,item.interval_days);
    const days  = daysBetween(nd);
    const pct   = Math.max(0,Math.min(100,100-(days/item.interval_days)*100));
    return(
      <SwipeCard id={`m-${item.id}`} activeId={activeSwipe} setActiveId={setActiveSwipe}
        onEdit={()=>{setEditItem({...item,_isMaint:true});setForm({...item});setShowModal("maint");setActiveSwipe(null);}}
        onDelete={()=>{homeMaint.remove(item.id);setActiveSwipe(null);}}
        style={S.statusCard(color)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:600}}>{item.title}</div>
            <div style={{fontSize:13,color:COLORS.slate,marginTop:2}}>
              {st==="overdue"?`Overdue by ${-days}d`:st==="due-soon"?`Due in ${days}d`:`Due ${formatDate(nd)}`}
              {item.notes?`   ${item.notes}`:""}
            </div>
            <div style={S.progress}><div style={S.progressFill(pct,color)}/></div>
          </div>
          <button style={{...S.btnCheck,marginLeft:12}} onClick={()=>markMaintDone(item)}> </button>
        </div>
      </SwipeCard>
    );
  }

  function SectionHeader({label,count,color}) {
    return <div style={{fontSize:12,fontWeight:700,color:color||COLORS.slate,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:20}}>{label}   {count}</div>;
  }

  // - Today tab -
  function TodayView() {
    const urgentMaint = [...maintOverdue, ...maintDueSoon];
    const total = todayItems.length + urgentMaint.length;

    const overdueCount = todayItems.filter(t=>taskStatus(t)==="overdue").length + maintOverdue.length;
    const todayCount   = todayItems.filter(t=>taskStatus(t)==="today").length;
    const importantCount = todayItems.filter(t=>taskStatus(t)==="important").length;
    return(<>
      <div style={{background:COLORS.navyMid,borderRadius:16,borderLeft:`4px solid ${total===0?COLORS.green:overdueCount>0?COLORS.red:COLORS.amber}`,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"1px",marginBottom:4}}>Today</div>
        <div style={{fontSize:20,fontWeight:800,color:total===0?COLORS.green:overdueCount>0?COLORS.red:COLORS.amber,letterSpacing:"-0.3px"}}>
          {total===0?"All clear"
            :overdueCount>0?`${overdueCount} overdue`
            :`${total} item${total!==1?"s":""} need attention`}
        </div>
        <div style={{fontSize:12,color:COLORS.slate,marginTop:4}}>
          {[
            overdueCount>0&&`${overdueCount} overdue`,
            todayCount>0&&`${todayCount} due today`,
            importantCount>0&&`${importantCount} important`,
            urgentMaint.length>0&&`${urgentMaint.length} maintenance`,
          ].filter(Boolean).join("  -  ")||formatDate(TODAY_STR)}
        </div>
      </div>
{showMsDo&&(
        <div style={{...S.gcBanner,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:COLORS.blue,marginBottom:4}}>  Microsoft To Do</div>
              <div style={{fontSize:13,color:COLORS.slateLight,lineHeight:1.5}}>To sync with Microsoft To Do, go to <strong>Settings   Connected Apps</strong> in Claude and connect Microsoft To Do. Once connected, tasks can flow both ways.</div>
            </div>
            <button onClick={()=>setShowMsDo(false)} style={{background:"none",border:"none",color:COLORS.slate,cursor:"pointer",fontSize:16,padding:2,flexShrink:0}}> </button>
          </div>
        </div>
      )}
{todayItems.filter(t=>taskStatus(t)==="overdue").length>0&&<>
        <SectionHeader label="   Overdue" count={todayItems.filter(t=>taskStatus(t)==="overdue").length} color={COLORS.red}/>
        {todayItems.filter(t=>taskStatus(t)==="overdue").map(t=><TaskCard key={t.id} item={t}/>)}
      </>}
{maintOverdue.length>0&&<>
        <SectionHeader label="  Maintenance Overdue" count={maintOverdue.length} color={COLORS.red}/>
        {maintOverdue.map(m=><MaintCard key={m.id} item={m}/>)}
      </>}
{todayItems.filter(t=>taskStatus(t)==="today"&&!t.is_important).length>0&&<>
        <SectionHeader label="  Due Today" count={todayItems.filter(t=>taskStatus(t)==="today"&&!t.is_important).length} color={COLORS.amber}/>
        {todayItems.filter(t=>taskStatus(t)==="today"&&!t.is_important).map(t=><TaskCard key={t.id} item={t}/>)}
      </>}
{todayItems.filter(t=>t.is_important&&taskStatus(t)!=="overdue"&&taskStatus(t)!=="today").length>0&&<>
        <SectionHeader label="  Important" count={todayItems.filter(t=>t.is_important&&taskStatus(t)!=="overdue"&&taskStatus(t)!=="today").length} color={COLORS.purple}/>
        {todayItems.filter(t=>t.is_important&&taskStatus(t)!=="overdue"&&taskStatus(t)!=="today").map(t=><TaskCard key={t.id} item={t}/>)}
      </>}
{maintDueSoon.length>0&&<>
        <SectionHeader label="  Maintenance Due This Week" count={maintDueSoon.length} color={COLORS.amber}/>
        {maintDueSoon.map(m=><MaintCard key={m.id} item={m}/>)}
      </>}

      {total===0&&<div style={{...S.card,background:COLORS.green+"11",borderColor:COLORS.green+"33",textAlign:"center",padding:"20px 16px",marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700,color:COLORS.green}}>  Nothing needs attention today</div>
        <div style={{fontSize:13,color:COLORS.slate,marginTop:8}}>Check the List tab to see everything.</div>
      </div>}
    </>);
  }

  // - List tab -
  function ListView() {
    return(<>
<div style={{marginBottom:12}}>
        {CATS.map(c=><span key={c} style={S.chip(catFilter===c, CAT_COLORS[c]||COLORS.slate)} onClick={()=>setCatFilter(c)}>{c}</span>)}
      </div>
{thisWeekItems.length>0&&<>
        <SectionHeader label="  This Week" count={thisWeekItems.length} color={COLORS.blue}/>
        {thisWeekItems.map(t=><TaskCard key={t.id} item={t}/>)}
      </>}
{upcomingItems.length>0&&<>
        <SectionHeader label="  Upcoming" count={upcomingItems.length} color={COLORS.slate}/>
        {upcomingItems.map(t=><TaskCard key={t.id} item={t}/>)}
      </>}
{backlogItems.length>0&&<>
        <SectionHeader label="  Backlog" count={backlogItems.length} color={COLORS.slate}/>
        {backlogItems.map(t=><TaskCard key={t.id} item={t}/>)}
      </>}
{(catFilter==="All"||catFilter==="Home")&&<>
        {(maintOverdue.length>0||maintDueSoon.length>0)&&<>
          <SectionHeader label="  Maintenance" count={homeMaint.data.length} color={COLORS.amber}/>
          {[...maintOverdue,...maintDueSoon].map(m=><MaintCard key={m.id} item={m}/>)}
        </>}
        {maintOk.length>0&&<>
          <button onClick={()=>setShowOkMaint(p=>!p)} style={{...S.btnSm,width:"100%",textAlign:"center",marginBottom:showOkMaint?8:0,marginTop:8}}>
            {showOkMaint?`Hide ${maintOk.length} current maintenance items`:`Show ${maintOk.length} current maintenance items  `}
          </button>
          {showOkMaint&&<>
            <SectionHeader label="  Maintenance Current" count={maintOk.length} color={COLORS.green}/>
            {maintOk.map(m=><MaintCard key={m.id} item={m}/>)}
          </>}
        </>}
      </>}

      {filteredIsEmpty()&&<EmptyState icon=" " title="No tasks here" detail={catFilter==="All"?"Add a task to get started.":`No ${catFilter} tasks yet.`}/>}
{completedItems.length>0&&<>
        <button onClick={()=>setShowCompleted(p=>!p)} style={{...S.btnSm,width:"100%",textAlign:"center",marginTop:12,marginBottom:showCompleted?8:0}}>
          {showCompleted?`Hide ${completedItems.length} completed`:`Show ${completedItems.length} completed`}
        </button>
        {showCompleted&&completedItems.map(t=>(
          <div key={t.id} style={{...S.card,opacity:0.5,marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:14,textDecoration:"line-through",color:COLORS.slate}}>{t.title}</div>
              <button style={S.btnSm} onClick={()=>tasks.update(t.id,{title:t.title,category:t.category||"Home",priority:t.priority||"med",due_date:t.due_date||null,recurring_interval_days:t.recurring_interval_days||null,last_completed:t.last_completed||null,is_important:t.is_important||false,notes:t.notes||"",completed:false})}>Undo</button>
            </div>
          </div>
        ))}
      </>}
    </>);
  }

  function filteredIsEmpty() {
    const hasMaint = (catFilter==="All"||catFilter==="Home") && homeMaint.data.length>0;
    return thisWeekItems.length===0 && upcomingItems.length===0 && backlogItems.length===0 && !hasMaint;
  }

  // - Maintenance edit modal -
  async function saveMaint() {
    if(!form.title||!form.interval_days)return;
    const row={title:form.title,last_completed:form.last_completed||TODAY_STR,interval_days:+form.interval_days,notes:form.notes||""};
    if(editItem&&editItem.id) await homeMaint.update(editItem.id,row);
    else await homeMaint.insert(row);
    setShowModal(false);setEditItem(null);setForm({});
  }

  return(
    <div style={S.screen}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:13,color:COLORS.slate}}>{tasks.data.length} tasks   {homeMaint.data.length} maintenance</div>
        <button onClick={()=>setShowMsDo(p=>!p)} style={{...S.btnSm,fontSize:12,padding:"5px 10px"}}>  MS To Do</button>
      </div>

      <div style={S.tabs}>
        {["today","list"].map(t=><button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t==="today"?"Today":"List"}</button>)}
      </div>

      {(tasks.loading||homeMaint.loading)?<Loading/>:<>
        <SwipeHint/>
        {tab==="today"&&<TodayView/>}
        {tab==="list"&&<ListView/>}
      </>}
<button style={{...S.btn,marginTop:16}} onClick={()=>{setForm({category:"Home",priority:"med",is_important:false});setShowModal("task");}}>+ Add Task</button>
{showModal==="task"&&<Modal title={editItem?"Edit Task":"Add Task"} onClose={closeModal}>
        <label style={S.label}>Title</label>
        <input style={S.input} placeholder="e.g. Mow front yard" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>

        <label style={S.label}>Category</label>
        <div>{CATS.filter(c=>c!=="All").map(c=><span key={c} style={S.chip(form.category===c,CAT_COLORS[c])} onClick={()=>setForm(p=>({...p,category:c}))}>{c}</span>)}</div>

        <label style={{...S.label,marginTop:12}}>Priority</label>
        <div>{["high","med","low"].map(p=><span key={p} style={S.chip(form.priority===p,PRIORITY_COLORS[p])} onClick={()=>setForm(prev=>({...prev,priority:p}))}>{p}</span>)}</div>

        <div style={{display:"flex",alignItems:"center",gap:10,margin:"14px 0 6px"}}>
          <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${form.is_important?COLORS.purple:COLORS.slate}`,background:form.is_important?COLORS.purple:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}} onClick={()=>setForm(p=>({...p,is_important:!p.is_important}))}>
            {form.is_important&&<span style={{color:"#fff",fontSize:12,lineHeight:1}}> </span>}
          </div>
          <label style={{...S.label,marginBottom:0,cursor:"pointer"}} onClick={()=>setForm(p=>({...p,is_important:!p.is_important}))}>  Mark as important (shows in Today even without a due date)</label>
        </div>

        <label style={{...S.label,marginTop:10}}>Due Date (optional)</label>
        <input type="date" style={S.input} value={form.due_date||""} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>

        <label style={S.label}>Recurring interval (optional)</label>
        <div style={{marginBottom:10}}>
          {[null,7,14,30,60,90,180,365].map(d=><span key={d||"none"} style={S.chip(form.recurring_interval_days===(d?String(d):null)||form.recurring_interval_days===d,COLORS.blue)} onClick={()=>setForm(p=>({...p,recurring_interval_days:d}))}>
            {d===null?"None":d===7?"Weekly":d===14?"Biweekly":d===30?"Monthly":d===60?"2 Mo":d===90?"Quarterly":d===180?"6 Mo":"Annual"}
          </span>)}
        </div>
        {form.recurring_interval_days&&<input type="number" style={S.input} placeholder="Or custom days" value={form.recurring_interval_days||""} onChange={e=>setForm(p=>({...p,recurring_interval_days:e.target.value}))}/>}

        <label style={S.label}>Notes (optional)</label>
        <input style={S.input} placeholder="Any details" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>

        <button style={{...S.btn,marginTop:16}} onClick={saveTask}>{editItem?"Save Changes":"Add Task"}</button>
      </Modal>}
{showModal==="maint"&&<Modal title={editItem?.id?"Edit Maintenance Item":"Add Maintenance Item"} onClose={()=>{setShowModal(false);setEditItem(null);setForm({});}}>
        <label style={S.label}>Item Name</label>
        <input style={S.input} placeholder="e.g. HVAC Filter" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
        <label style={S.label}>Interval</label>
        <div style={{marginBottom:10}}>
          {[14,30,60,90,180,365].map(d=><span key={d} style={S.chip(+form.interval_days===d,COLORS.blue)} onClick={()=>setForm(p=>({...p,interval_days:d}))}>{d}d</span>)}
        </div>
        <input type="number" style={S.input} placeholder="Or enter custom days" value={form.interval_days||""} onChange={e=>setForm(p=>({...p,interval_days:e.target.value}))}/>
        <label style={S.label}>Last Completed</label>
        <input type="date" style={S.input} value={form.last_completed||""} onChange={e=>setForm(p=>({...p,last_completed:e.target.value}))}/>
        <label style={S.label}>Notes (optional)</label>
        <input style={S.input} placeholder="e.g. 16x25x1, check Grainger" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:10}} onClick={saveMaint}>{editItem?.id?"Save Changes":"Add Item"}</button>
      </Modal>}
    </div>
  );
}

// - AI POOL BRIEF -
