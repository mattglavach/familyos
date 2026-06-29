import { useMemo, useState } from "react";
import { Loading } from "../../components/common";
import { useHousehold } from "../../hooks/useHousehold";
import { COLORS, MEMBER_COLORS, S } from "../../theme";

// - DASHBOARD -
export function Dashboard({onNavigate,gc,deps}){
  const {
    TODAY_DATE,TODAY_STR,daysAgo,daysBetween,nextDueDate,formatDate,formatDateFull,
    formatMoneyShort,maintStatus,useTable,calcRetirementProjection,getChemRecommendations,
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
  const{data:homeMaint}   =useTable("home_maintenance","title",true);
  const{data:deadlines}   =useTable("college_deadlines","due_date",true);
  const readings          =useTable("pool_readings","logged_at");
  const assumptions       =useTable("retirement_assumptions","id",true);
  const accounts          =useTable("retirement_accounts","name",true);
  const notes             =useTable("notes","created_at");
  const taskData          =useTable("tasks","due_date",true,taskTableOptions);
  const treatments        =useTable("pool_treatments","logged_at");

  const [showFullSchedule,setShowFullSchedule]=useState(false);
  const [showAllActions,setShowAllActions]=useState(false);
  const [showNotes,setShowNotes]=useState(true);
  const [filter,setFilter]=useState("All");
  const [overrides,setOverrides]=useState({});
  const [reassigning,setReassigning]=useState(null);
  const members=["All","Aubrey","Blake","Brayden","Matt","Kalee"];

  const assump=assumptions.data[0];
  const retProj=assump?calcRetirementProjection(accounts.data,assump):null;
  const lastReading=readings.data[0];
  const chemRecs=lastReading?getChemRecommendations(lastReading,readings.data,null):[];
  const highChemRecs=chemRecs.filter(r=>r.priority==="high");
  const medChemRecs=chemRecs.filter(r=>r.priority==="med");
  const poolDaysAgo=lastReading?daysAgo(lastReading.date):null;
  const poolStale=poolDaysAgo!==null&&poolDaysAgo>=3;

  const overdueHomeMaint=homeMaint.filter(m=>maintStatus(m)==="overdue");
  const dueSoonHomeMaint=homeMaint.filter(m=>maintStatus(m)==="due-soon");
  const urgentDeadlines=deadlines.filter(d=>!d.completed&&daysBetween(d.due_date)<=14);
  const upcomingDeadlines=deadlines.filter(d=>!d.completed&&daysBetween(d.due_date)>14&&daysBetween(d.due_date)<=60);
  const urgentTasks=taskData.data.filter(t=>{
    if(t.completed&&!t.recurring_interval_days)return false;
    if(t.is_important)return true;
    if(t.due_date&&daysBetween(t.due_date)<=0)return true;
    return false;
  });

  const allEvents=(gc.token?gc.events:[]).map(e=>({...e,member:overrides[e.id]||e.member}));
  const filtered=allEvents.filter(e=>filter==="All"||e.member===filter);
  const next7Days=Array.from({length:7},(_,i)=>{const d=new Date(TODAY_DATE);d.setDate(d.getDate()+i);return d.toISOString().split("T")[0];});
  const next30Days=Array.from({length:30},(_,i)=>{const d=new Date(TODAY_DATE);d.setDate(d.getDate()+i);return d.toISOString().split("T")[0];});
  const visibleDays=showFullSchedule?next30Days:next7Days;

  // Build action lists
  const overdue=[],thisWeek=[],upcoming=[];
  if(poolStale) overdue.push({text:`Pool not tested in ${poolDaysAgo} days`,color:COLORS.amber,nav:"pool",detail:"Log a reading"});
  highChemRecs.forEach(r=>{overdue.push({text:r.action,color:COLORS.red,nav:"pool",detail:null});});
  medChemRecs.slice(0,2).forEach(r=>{thisWeek.push({text:r.action,color:COLORS.amber,nav:"pool",detail:null});});
  overdueHomeMaint.forEach(m=>{const days=-daysBetween(nextDueDate(m.last_completed,m.interval_days));overdue.push({text:m.title,color:COLORS.red,nav:"tasks",detail:`${days}d overdue`});});
  dueSoonHomeMaint.forEach(m=>{const days=daysBetween(nextDueDate(m.last_completed,m.interval_days));thisWeek.push({text:m.title,color:COLORS.amber,nav:"tasks",detail:`due in ${days}d`});});
  urgentTasks.slice(0,4).forEach(t=>{const days=t.due_date?daysBetween(t.due_date):null,isOverdue=days!==null&&days<0,item={text:t.title,color:isOverdue?COLORS.red:t.is_important?COLORS.purple:COLORS.amber,nav:"tasks",detail:isOverdue?`${-days}d overdue`:days===0?"Today":t.is_important?"Important":days!==null?`in ${days}d`:null};isOverdue?overdue.push(item):thisWeek.push(item);});
  urgentDeadlines.forEach(d=>{const days=daysBetween(d.due_date),item={text:d.title,color:days<=4?COLORS.red:COLORS.amber,nav:"college",detail:days===0?"Today":days<0?`${-days}d overdue`:`in ${days}d`};days<=4?overdue.push(item):thisWeek.push(item);});
  upcomingDeadlines.forEach(d=>{upcoming.push({text:d.title,color:COLORS.slate,nav:"college",detail:`in ${daysBetween(d.due_date)}d`});});
  filtered.filter(e=>e.date===TODAY_STR).forEach(e=>{overdue.push({text:e.title,color:COLORS.blue,nav:"home",detail:e.time||"Today"});});
  filtered.filter(e=>next7Days.includes(e.date)&&e.date!==TODAY_STR).slice(0,3).forEach(e=>{thisWeek.push({text:e.title,color:MEMBER_COLORS[e.member]||COLORS.slate,nav:"home",detail:`${e.time||""} ${formatDate(e.date)}`.trim()});});

  const totalActions=overdue.length+thisWeek.length+upcoming.length;
  const focusItems=[...overdue,...thisWeek].slice(0,5);

  // Family Health statuses
  const poolColor=highChemRecs.length>0?COLORS.red:medChemRecs.length>0?COLORS.amber:poolStale?COLORS.amber:COLORS.green;
  const poolLabel=highChemRecs.length>0?"Action needed":medChemRecs.length>0?"Monitor":poolStale?`${poolDaysAgo}d since test`:"Good";
  const poolDetail=highChemRecs.length>0?highChemRecs[0].action.slice(0,35)+"...":lastReading?`pH ${lastReading.ph||"--"} FC ${lastReading.free_chlorine||"--"} Salt ${lastReading.salt||"--"}`:"No readings";

  const tasksOverdue=overdueHomeMaint.length+urgentTasks.filter(t=>t.due_date&&daysBetween(t.due_date)<0).length;
  const tasksDueSoon=dueSoonHomeMaint.length+urgentTasks.filter(t=>t.is_important&&(!t.due_date||daysBetween(t.due_date)>=0)).length;
  const tasksColor=tasksOverdue>0?COLORS.red:tasksDueSoon>0?COLORS.amber:COLORS.green;
  const tasksLabel=tasksOverdue>0?`${tasksOverdue} overdue`:tasksDueSoon>0?`${tasksDueSoon} this week`:"All clear";
  const tasksDetail=tasksOverdue>0?`${overdueHomeMaint[0]?.title||urgentTasks[0]?.title||""}`.slice(0,35):tasksDueSoon>0?"Maintenance due":"Nothing overdue";

  const finColor=retProj?retProj.statusColor:COLORS.slate;
  const finLabel=retProj?retProj.statusLabel.split(" - ")[0].split("--")[0].trim().slice(0,16):"No data";
  const finDetail=retProj?`Age ${assump.retirement_age} - ${retProj.gap>0?"-"+formatMoneyShort(retProj.gap)+" gap":"surplus "+formatMoneyShort(-retProj.gap)}`:"Add accounts";

  const collegeColor=urgentDeadlines.length>0?COLORS.amber:COLORS.green;
  const collegeLabel=urgentDeadlines.length>0?`${urgentDeadlines.length} deadline${urgentDeadlines.length>1?"s":""}`:upcomingDeadlines.length>0?"Coming up":"On track";
  const collegeDetail=urgentDeadlines.length>0?urgentDeadlines[0].title.slice(0,35):upcomingDeadlines.length>0?`Next: ${upcomingDeadlines[0].title.slice(0,28)}`:"No urgent deadlines";

  // Weekly headline sentence
  const totalIssues=overdue.length+thisWeek.length;
  let headline="";
  if(totalIssues===0) headline="All clear - nothing needs attention.";
  else {
    const parts=[];
    if(overdue.length>0) parts.push(`${overdue.length} item${overdue.length>1?"s":""} need action now`);
    if(thisWeek.length>0) parts.push(`${thisWeek.length} due this week`);
    headline=parts.join(", ")+".";
  }

  const recentActivity=[
    ...readings.data.slice(0,2).map(r=>({date:r.date,text:`Pool reading - pH ${r.ph||"--"} FC ${r.free_chlorine||"--"}`,color:COLORS.blue})),
    ...treatments.data.slice(0,2).map(t=>{
      const chems=[t.muriatic_acid_oz&&`${t.muriatic_acid_oz}oz acid`,t.salt_lbs&&`${t.salt_lbs}lb salt`,t.cya_oz&&`${t.cya_oz}oz CYA`].filter(Boolean);
      return{date:t.date,text:`Treatment - ${chems.length>0?chems.join(", "):"maintenance"}`,color:COLORS.green};
    }),
    ...deadlines.filter(d=>d.completed).slice(0,1).map(d=>({date:d.due_date,text:`College: ${d.title}`,color:COLORS.green})),
    ...homeMaint.filter(m=>m.last_completed&&daysAgo(m.last_completed)<=7).slice(0,1).map(m=>({date:m.last_completed,text:m.title,color:COLORS.slate})),
  ].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4);

  function ActionItem({item,i,total}){
    return(
      <button onClick={()=>onNavigate(item.nav)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:"none",border:"none",padding:"9px 0",borderBottom:i<total-1?`1px solid ${COLORS.navyLight}`:"none",cursor:"pointer",textAlign:"left"}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:item.color,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:600,color:COLORS.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.text}</div>
          {item.detail&&<div style={{fontSize:12,color:item.color,marginTop:1}}>{item.detail}</div>}
        </div>
        <div style={{fontSize:12,color:COLORS.slate,flexShrink:0}}>></div>
      </button>
    );
  }

  return(
    <div style={S.screen}> <div style={{background:COLORS.navyMid,borderRadius:16,padding:"18px 18px 14px",marginBottom:12,border:`1px solid ${COLORS.navyLight}`,borderTop:`3px solid ${totalIssues===0?COLORS.green:overdue.length>0?COLORS.red:COLORS.amber}`}}>
        <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>This Week</div>
        <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.5px",lineHeight:1.15,color:totalIssues===0?COLORS.green:overdue.length>0?COLORS.red:COLORS.amber,marginBottom:4}}>
          {totalIssues===0?"All clear":`${overdue.length>0?overdue.length+" urgent":thisWeek.length+" this week"}`}
        </div>
        <div style={{fontSize:13,color:COLORS.slate,marginBottom:focusItems.length>0?14:0}}>{headline}</div>
        {focusItems.length>0&&focusItems.map((item,i)=><ActionItem key={i} item={item} i={i} total={focusItems.length}/>)}
      </div> <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {module:"Pool",color:poolColor,label:poolLabel,detail:poolDetail,nav:"pool"},
          {module:"Tasks",color:tasksColor,label:tasksLabel,detail:tasksDetail,nav:"tasks"},
          {module:"Finance",color:finColor,label:finLabel,detail:finDetail,nav:"finance"},
          {module:"College",color:collegeColor,label:collegeLabel,detail:collegeDetail,nav:"college"},
        ].map((s,i)=>(
          <button key={i} onClick={()=>onNavigate(s.nav)} style={{background:COLORS.navyMid,border:`1px solid ${COLORS.navyLight}`,borderLeft:`3px solid ${s.color}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",textAlign:"left",WebkitTapHighlightColor:"transparent"}}>
            <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:4}}>{s.module}</div>
            <div style={{fontSize:14,fontWeight:800,color:s.color,marginBottom:3,letterSpacing:"-0.2px"}}>{s.label}</div>
            <div style={{fontSize:11,color:COLORS.slate,lineHeight:1.35,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{s.detail}</div>
          </button>
        ))}
      </div> {totalActions>0&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"1px"}}>Action Center</div>
          {totalActions>5&&<button onClick={()=>setShowAllActions(p=>!p)} style={{fontSize:12,color:COLORS.blue,background:"none",border:"none",cursor:"pointer",padding:0}}>{showAllActions?"Less":"All "+totalActions}</button>}
        </div>
        {overdue.length>0&&(
          <div style={{background:COLORS.navyMid,borderRadius:12,borderLeft:`3px solid ${COLORS.red}`,marginBottom:8,padding:"12px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:COLORS.red,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>Act Now - {overdue.length}</div>
            {overdue.slice(0,showAllActions?99:3).map((item,i)=><ActionItem key={i} item={item} i={i} total={Math.min(overdue.length,showAllActions?99:3)}/>)}
            {!showAllActions&&overdue.length>3&&<div style={{fontSize:12,color:COLORS.slate,paddingTop:6}}>+{overdue.length-3} more</div>}
          </div>
        )}
        {thisWeek.length>0&&(
          <div style={{background:COLORS.navyMid,borderRadius:12,borderLeft:`3px solid ${COLORS.amber}`,marginBottom:8,padding:"12px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:COLORS.amber,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>This Week - {thisWeek.length}</div>
            {thisWeek.slice(0,showAllActions?99:3).map((item,i)=><ActionItem key={i} item={item} i={i} total={Math.min(thisWeek.length,showAllActions?99:3)}/>)}
          </div>
        )}
        {upcoming.length>0&&showAllActions&&(
          <div style={{background:COLORS.navyMid,borderRadius:12,borderLeft:`3px solid ${COLORS.slate}`,marginBottom:8,padding:"12px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>Coming Up - {upcoming.length}</div>
            {upcoming.slice(0,3).map((item,i)=><ActionItem key={i} item={item} i={i} total={Math.min(upcoming.length,3)}/>)}
          </div>
        )}
      </>}
      {totalActions===0&&(
        <div style={{background:COLORS.green+"0d",border:`1px solid ${COLORS.green}33`,borderRadius:12,textAlign:"center",padding:"14px",marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700,color:COLORS.green}}>All clear</div>
          <div style={{fontSize:12,color:COLORS.slate,marginTop:3}}>Nothing needs attention right now.</div>
        </div>
      )} {gc.token&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,marginTop:16}}>
          <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"1px"}}>Schedule</div>
          <button onClick={()=>setShowFullSchedule(p=>!p)} style={{fontSize:12,color:COLORS.blue,background:"none",border:"none",cursor:"pointer",padding:0}}>{showFullSchedule?"7 days":"30 days"}</button>
        </div>
        <div style={{marginBottom:10,display:"flex",flexWrap:"wrap",gap:4}}>
          {members.map(m=><span key={m} style={S.chip(filter===m,MEMBER_COLORS[m]||COLORS.blue)} onClick={()=>setFilter(m)}>{m}</span>)}
        </div>
        {gc.loading?<Loading/>:(
          filtered.filter(e=>visibleDays.includes(e.date)).length===0
            ?<div style={{fontSize:13,color:COLORS.slate,textAlign:"center",padding:"20px 0"}}>No events {showFullSchedule?"in the next 30 days":"this week"}</div>
            :visibleDays.map(day=>{
              const evs=filtered.filter(e=>e.date===day);
              if(!evs.length)return null;
              const isToday=day===TODAY_STR;
              return(
                <div key={day}>
                  <div style={{fontSize:11,fontWeight:700,color:isToday?COLORS.blue:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6,marginTop:12}}>{isToday?"Today":formatDateFull(day)}</div>
                  {evs.map(e=>(
                    <div key={e.id} style={{background:COLORS.navyMid,borderRadius:10,borderLeft:`3px solid ${MEMBER_COLORS[e.member]||COLORS.slate}`,marginBottom:6,padding:"10px 12px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:600}}>{e.title}</div>
                          <div style={{fontSize:12,color:COLORS.slate,marginTop:2}}>{e.time||"All day"}{e.location?` - ${e.location}`:""}</div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                          <span style={{...S.badge(MEMBER_COLORS[e.member]||COLORS.slate),fontSize:11}}>{e.member}</span>
                          <button style={{...S.btnSm,fontSize:11,padding:"2px 6px"}} onClick={()=>setReassigning(reassigning===e.id?null:e.id)}>reassign</button>
                        </div>
                      </div>
                      {reassigning===e.id&&(
                        <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:4}}>
                          {["Aubrey","Blake","Brayden","Matt","Kalee"].map(m=>(
                            <span key={m} style={S.chip(e.member===m,MEMBER_COLORS[m])} onClick={()=>{setOverrides(p=>({...p,[e.id]:m}));setReassigning(null);}}>{m}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })
        )}
      </>}
      {!gc.token&&(
        <div style={{background:COLORS.navyMid,borderRadius:12,border:`1px solid ${COLORS.navyLight}`,padding:"14px 16px",marginTop:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:13,color:COLORS.slateLight}}>Connect Google Calendar to see your schedule here.</div>
          <button style={{...S.btnSm,fontSize:12}} onClick={gc.signIn}>Connect</button>
        </div>
      )} {recentActivity.length>0&&<>
        <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8,marginTop:16}}>Recent Activity</div>
        {recentActivity.map((a,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:i<recentActivity.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:a.color,flexShrink:0}}/>
            <div style={{flex:1}}><div style={{fontSize:13,color:COLORS.slateLight}}>{a.text}</div></div>
            <div style={{fontSize:11,color:COLORS.slate}}>{formatDate(a.date)}</div>
          </div>
        ))}
      </>} {notes.data.length>0&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16,marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"1px"}}>Notes</div>
          <button onClick={()=>setShowNotes(p=>!p)} style={{fontSize:12,color:COLORS.blue,background:"none",border:"none",cursor:"pointer",padding:0}}>{showNotes?"Hide":"Show "+notes.data.length}</button>
        </div>
        {showNotes&&notes.data.map((n,i)=>(
          <div key={n.id} style={{background:COLORS.navyMid,borderRadius:10,padding:"12px 14px",marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                {n.title&&<div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{n.title}</div>}
                <div style={{fontSize:13,color:COLORS.slateLight,lineHeight:1.5}}>{n.body}</div>
                <div style={{fontSize:11,color:COLORS.slate,marginTop:6}}>{new Date(n.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
              </div>
              <span style={{...S.badge(COLORS.slate),fontSize:11,flexShrink:0,marginLeft:10}}>{n.tag||"General"}</span>
            </div>
          </div>
        ))}
      </>}
    </div>
  );
}


