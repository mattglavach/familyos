import { useMemo, useState } from "react";
import { Loading } from "../../components/common";
import { EmptyStatePanel } from "../../components/ui/empty-state";
import { ActionRow, DashboardSection, SectionAction, WidgetContainer } from "../../components/ui/layout";
import { MetricCard, SummaryCard } from "../../components/ui/cards";
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
  const householdTableOptions = useMemo(()=>(
    householdId
      ? {
        filters:{household_id:householdId},
        insertDefaults:{household_id:householdId},
      }
      : undefined
  ),[householdId]);
  const{data:homeMaint}   =useTable("home_maintenance","title",true,householdTableOptions);
  const{data:deadlines}   =useTable("college_deadlines","due_date",true);
  const readings          =useTable("pool_readings","logged_at");
  const assumptions       =useTable("retirement_assumptions","id",true);
  const accounts          =useTable("retirement_accounts","name",true);
  const notes             =useTable("notes","created_at");
  const taskData          =useTable("tasks","due_date",true,householdTableOptions);
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

  function toneFromColor(color) {
    if(color===COLORS.red) return "red";
    if(color===COLORS.amber) return "amber";
    if(color===COLORS.green) return "green";
    if(color===COLORS.blue) return "blue";
    if(color===COLORS.purple) return "purple";
    return "slate";
  }

  function ActionItem({item,i,total}){
    return(
      <ActionRow key={i} title={item.text} detail={item.detail} indicator={item.color} onClick={()=>onNavigate(item.nav)} />
    );
  }

  return(
    <div style={S.screen}>
      <SummaryCard
        eyebrow="This Week"
        title={totalIssues===0?"All clear":`${overdue.length>0?overdue.length+" urgent":thisWeek.length+" this week"}`}
        detail={headline}
        tone={totalIssues===0?"green":overdue.length>0?"red":"amber"}
      >
        {focusItems.length>0&&focusItems.map((item,i)=><ActionItem key={i} item={item} i={i} total={focusItems.length}/>)}
      </SummaryCard>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {[
          {module:"Pool",color:poolColor,label:poolLabel,detail:poolDetail,nav:"pool"},
          {module:"Tasks",color:tasksColor,label:tasksLabel,detail:tasksDetail,nav:"tasks"},
          {module:"Finance",color:finColor,label:finLabel,detail:finDetail,nav:"finance"},
          {module:"College",color:collegeColor,label:collegeLabel,detail:collegeDetail,nav:"college"},
        ].map((s,i)=>(
          <MetricCard key={i} as="button" onClick={()=>onNavigate(s.nav)} label={s.module} value={s.label} detail={s.detail} tone={toneFromColor(s.color)} />
        ))}
      </div>

      {totalActions>0&&<DashboardSection
        title="Action Center"
        action={totalActions>5&&<SectionAction onClick={()=>setShowAllActions(p=>!p)}>{showAllActions?"Less":"All "+totalActions}</SectionAction>}
      >
        {overdue.length>0&&(
          <WidgetContainer title={`Act Now - ${overdue.length}`} className="mb-2 border-l-4 border-l-destructive">
            {overdue.slice(0,showAllActions?99:3).map((item,i)=><ActionItem key={i} item={item} i={i} total={Math.min(overdue.length,showAllActions?99:3)}/>)}
            {!showAllActions&&overdue.length>3&&<div className="pt-1 text-xs text-muted-foreground">+{overdue.length-3} more</div>}
          </WidgetContainer>
        )}
        {thisWeek.length>0&&(
          <WidgetContainer title={`This Week - ${thisWeek.length}`} className="mb-2 border-l-4 border-l-amber-400">
            {thisWeek.slice(0,showAllActions?99:3).map((item,i)=><ActionItem key={i} item={item} i={i} total={Math.min(thisWeek.length,showAllActions?99:3)}/>)}
          </WidgetContainer>
        )}
        {upcoming.length>0&&showAllActions&&(
          <WidgetContainer title={`Coming Up - ${upcoming.length}`} className="mb-2 border-l-4 border-l-muted-foreground">
            {upcoming.slice(0,3).map((item,i)=><ActionItem key={i} item={item} i={i} total={Math.min(upcoming.length,3)}/>)}
          </WidgetContainer>
        )}
      </DashboardSection>}
      {totalActions===0&&(
        <EmptyStatePanel title="All clear" detail="Nothing needs attention right now." className="mb-3 rounded-lg border border-emerald-400/25 bg-emerald-400/5 py-5" />
      )}

      {gc.token&&<DashboardSection
        title="Schedule"
        action={<SectionAction onClick={()=>setShowFullSchedule(p=>!p)}>{showFullSchedule?"7 days":"30 days"}</SectionAction>}
      >
        <div style={{marginBottom:10,display:"flex",flexWrap:"wrap",gap:4}}>
          {members.map(m=><span key={m} style={S.chip(filter===m,MEMBER_COLORS[m]||COLORS.blue)} onClick={()=>setFilter(m)}>{m}</span>)}
        </div>
        {gc.loading?<Loading/>:(
          filtered.filter(e=>visibleDays.includes(e.date)).length===0
            ?<EmptyStatePanel title="No events" detail={showFullSchedule?"No events in the next 30 days.":"No events this week."} className="py-6" />
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
      </DashboardSection>}
      {!gc.token&&(
        <WidgetContainer className="mt-4" title="Schedule" subtitle="Connect Google Calendar to see your schedule here." actions={
          <button style={{...S.btnSm,fontSize:12}} onClick={gc.signIn}>Connect</button>
        } />
      )}

      {recentActivity.length>0&&<DashboardSection title="Recent Activity">
        {recentActivity.map((a,i)=>(
          <ActionRow key={i} title={a.text} detail={formatDate(a.date)} indicator={a.color} />
        ))}
      </DashboardSection>}

      {notes.data.length>0&&<DashboardSection
        title="Notes"
        action={<SectionAction onClick={()=>setShowNotes(p=>!p)}>{showNotes?"Hide":"Show "+notes.data.length}</SectionAction>}
      >
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
      </DashboardSection>}
    </div>
  );
}


