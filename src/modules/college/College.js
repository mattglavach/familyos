import { useState } from "react";
import { EmptyState, Loading, Modal, SwipeCard, SwipeHint } from "../../components/common";
import { COLORS, MEMBER_COLORS, S } from "../../theme";
import { TODAY_DATE, daysBetween, formatDate } from "../../lib/dates";
import { useTable } from "../../hooks/useTable";
import { formatMoneyShort } from "../finance/Finance";
function calcAubreyTimeline(deadlines=[], scores=[], schools=[], essays=[]) {
  const milestones = [];
  deadlines.forEach(d=>milestones.push({id:`deadline-${d.id}`,label:d.title,date:d.due_date,detail:d.school||"Deadline",category:d.category||"deadline",completed:!!d.completed}));
  essays.forEach(e=>{if(e.due_date)milestones.push({id:`essay-${e.id}`,label:e.title,date:e.due_date,detail:e.school||e.word_count||"Essay",category:"essay",completed:e.status==="submitted"});});
  schools.forEach(s=>{if(s.app_deadline)milestones.push({id:`school-${s.id}`,label:`${s.name} application`,date:s.app_deadline,detail:s.app_type||s.match_level||"Application",category:"application",completed:s.status==="applied"||s.status==="accepted"});});
  scores.forEach(s=>milestones.push({id:`score-${s.id}`,label:`SAT ${s.total}`,date:s.date,detail:`${s.math}M / ${s.verbal}V`,category:"test",completed:true}));
  return milestones
    .filter(m=>m.date)
    .map(m=>({...m,daysAway:daysBetween(m.date),isPast:daysBetween(m.date)<0}))
    .sort((a,b)=>new Date(a.date)-new Date(b.date));
}

export function College(){
  const [tab,setTab]=useState("deadlines");
  const deadlines=useTable("college_deadlines","due_date",true),schools=useTable("college_schools","name",true);
  const scores=useTable("sat_scores","date"),testPlan=useTable("college_test_plan","target_date",true);
  const essays=useTable("college_essays","due_date",true),collegeGoals=useTable("college_goal","id",true),collegeSav=useTable("college_savings","id",true);
  const [showModal,setShowModal]=useState(null),[editItem,setEditItem]=useState(null),[form,setForm]=useState({});
  const [activeSwipe,setActiveSwipe]=useState(null),[showTimeline,setShowTimeline]=useState(false),[showCompleted,setShowCompleted]=useState(false);

  const catColor={test:COLORS.purple,application:COLORS.blue,visit:COLORS.green,essay:COLORS.amber,planning:COLORS.slate,other:COLORS.slate};
  const statusColors={researching:COLORS.slate,target:COLORS.blue,applying:COLORS.amber,applied:COLORS.purple,accepted:COLORS.green,rejected:COLORS.red};
  const appTypeColors={ED:COLORS.red,EA:COLORS.amber,Regular:COLORS.blue,Rolling:COLORS.slate};
  const matchColors={Reach:COLORS.red,Target:COLORS.blue,Safety:COLORS.green};
  const essayStatusColors={"not started":COLORS.slate,drafting:COLORS.amber,review:COLORS.blue,submitted:COLORS.green};
  const pending=deadlines.data.filter(d=>!d.completed).sort((a,b)=>new Date(a.due_date)-new Date(b.due_date)),done=deadlines.data.filter(d=>d.completed);
  const timeline=calcAubreyTimeline(deadlines.data,scores.data,schools.data,essays.data);
  const completedMilestones=timeline.filter(m=>m.completed).length,nextMilestone=timeline.find(m=>!m.completed);
  const overdueDeadlines=pending.filter(d=>daysBetween(d.due_date)<0),thisWeekDeadlines=pending.filter(d=>daysBetween(d.due_date)>=0&&daysBetween(d.due_date)<=7);
  const soonDeadlines=pending.filter(d=>daysBetween(d.due_date)>7&&daysBetween(d.due_date)<=30),upcomingDeadlines=pending.filter(d=>daysBetween(d.due_date)>30);

  function openEdit(modal,item){setEditItem(item);setForm(item);setShowModal(modal);setActiveSwipe(null);}
  function closeModal(){setShowModal(null);setEditItem(null);setForm({});}

  async function saveDeadline(){if(!form.title||!form.due_date)return;if(editItem)await deadlines.update(editItem.id,{title:form.title,due_date:form.due_date,school:form.school||"",category:form.category||"other"});else await deadlines.insert({title:form.title,due_date:form.due_date,school:form.school||"",category:form.category||"other",completed:false});closeModal();}
  async function saveSchool(){if(!form.name)return;const row={name:form.name,status:form.status||"researching",app_deadline:form.app_deadline||null,app_type:form.app_type||"Regular",match_level:form.match_level||"Target",visit_notes:form.visit_notes||""};if(editItem)await schools.update(editItem.id,row);else await schools.insert(row);closeModal();}
  async function saveScore(){if(!form.date||!form.total)return;if(editItem)await scores.update(editItem.id,{date:form.date,total:+form.total,math:+form.math||0,verbal:+form.verbal||0,notes:form.notes||""});else await scores.insert({date:form.date,total:+form.total,math:+form.math||0,verbal:+form.verbal||0,notes:form.notes||""});closeModal();}
  async function saveTestPlan(){if(!form.test_type||!form.target_date)return;const row={test_type:form.test_type,target_date:form.target_date,target_score:form.target_score||"",attempt_number:form.attempt_number||1,registered:form.registered||false,notes:form.notes||""};if(editItem)await testPlan.update(editItem.id,row);else await testPlan.insert(row);closeModal();}
  async function saveEssay(){if(!form.title)return;const row={title:form.title,school:form.school||"",due_date:form.due_date||null,status:form.status||"not started",word_count:form.word_count||"",notes:form.notes||""};if(editItem)await essays.update(editItem.id,row);else await essays.insert(row);closeModal();}

  return(
    <div style={S.screen}>
      <div style={{...S.card,background:COLORS.navyLight,borderLeft:`3px solid ${MEMBER_COLORS.Aubrey}`,marginBottom:16}}>
        <div style={{fontSize:15,color:COLORS.red,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase"}}>Aubrey   Class of 2028</div>
        <div style={{fontSize:19,fontWeight:700,marginTop:2}}>Junior Year   College Planning</div>
        <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>{schools.data.filter(s=>s.status==="target"||s.status==="applying").length} target schools   {pending.length} open deadline{pending.length!==1?"s":""}</div>
        <div style={{marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:15,color:COLORS.slate,fontWeight:600}}>{completedMilestones} of {timeline.length} milestones complete</div>
            <div style={{fontSize:15,color:COLORS.blue}}>{Math.round(completedMilestones/timeline.length*100)}%</div>
          </div>
          <div style={S.progress}><div style={S.progressFill(completedMilestones/timeline.length*100,COLORS.blue)}/></div>
          {nextMilestone&&<div style={{fontSize:15,color:COLORS.slateLight,marginTop:10}}>Next: <span style={{color:COLORS.white,fontWeight:600}}>{nextMilestone.label}</span>{nextMilestone.daysAway>0?`   in ${nextMilestone.daysAway}d`:nextMilestone.daysAway===0?"   Today":"   Overdue"}</div>}
        </div>
        <button onClick={()=>setShowTimeline(p=>!p)} style={{fontSize:15,color:COLORS.blue,background:"none",border:"none",cursor:"pointer",padding:0,marginTop:10,textDecoration:"underline"}}>{showTimeline?"Hide timeline":"View full timeline  "}</button>
        {showTimeline&&(
          <div style={{marginTop:12}}>
            {timeline.map((m,i)=>(
              <div key={m.id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 0",borderBottom:i<timeline.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:m.completed?COLORS.green:m.isPast&&!m.completed?COLORS.red:COLORS.navyLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,marginTop:1}}>{m.completed?" ":m.isPast?"!":""}</div>
                <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:m.completed?COLORS.slate:m.isPast?COLORS.red:COLORS.white}}>{m.label}</div><div style={{fontSize:15,color:COLORS.slate,marginTop:1}}>{formatDate(m.date)}   {m.detail}</div></div>
                <span style={S.badge(catColor[m.category]||COLORS.slate)}>{m.category}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={S.tabs}>
        {["deadlines","schools","essays","sat/act","planning"].map(t=><button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {tab==="deadlines"&&<>
        {deadlines.loading?<Loading/>:<>
          <SwipeHint/>
          {overdueDeadlines.length>0&&<>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.red,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:10}}>   Overdue   {overdueDeadlines.length}</div>
            {overdueDeadlines.map(d=>(
              <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe} onEdit={()=>openEdit("deadline",d)} onDelete={()=>{deadlines.remove(d.id);setActiveSwipe(null);}} style={S.statusCard(COLORS.red)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,paddingRight:10}}><div style={{fontSize:15,fontWeight:600}}>{d.title}</div>{d.school&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{d.school}</div>}<div style={{display:"flex",gap:6,marginTop:10,alignItems:"center"}}><span style={S.badge(catColor[d.category]||COLORS.slate)}>{d.category}</span><span style={{fontSize:15,color:COLORS.red,fontWeight:700}}>{Math.abs(daysBetween(d.due_date))}d overdue</span></div></div>
                  <button style={S.btnCheck} onClick={()=>deadlines.update(d.id,{completed:true})}> </button>
                </div>
              </SwipeCard>
            ))}
          </>}
          {thisWeekDeadlines.length>0&&<>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.amber,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:overdueDeadlines.length>0?16:4}}>  Due This Week   {thisWeekDeadlines.length}</div>
            {thisWeekDeadlines.map(d=>{const days=daysBetween(d.due_date);return(
              <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe} onEdit={()=>openEdit("deadline",d)} onDelete={()=>{deadlines.remove(d.id);setActiveSwipe(null);}} style={S.statusCard(COLORS.amber)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,paddingRight:10}}><div style={{fontSize:15,fontWeight:600}}>{d.title}</div>{d.school&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{d.school}</div>}<div style={{display:"flex",gap:6,marginTop:10,alignItems:"center"}}><span style={S.badge(catColor[d.category]||COLORS.slate)}>{d.category}</span><span style={{fontSize:15,color:COLORS.amber,fontWeight:700}}>{days===0?"Today":`in ${days}d`}</span></div></div>
                  <button style={S.btnCheck} onClick={()=>deadlines.update(d.id,{completed:true})}> </button>
                </div>
              </SwipeCard>
            );})}
          </>}
          {soonDeadlines.length>0&&<>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.blue,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:16}}>  This Month   {soonDeadlines.length}</div>
            {soonDeadlines.map(d=>{const days=daysBetween(d.due_date);return(
              <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe} onEdit={()=>openEdit("deadline",d)} onDelete={()=>{deadlines.remove(d.id);setActiveSwipe(null);}} style={S.statusCard(COLORS.blue)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,paddingRight:10}}><div style={{fontSize:15,fontWeight:600}}>{d.title}</div>{d.school&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{d.school}</div>}<div style={{display:"flex",gap:6,marginTop:10,alignItems:"center"}}><span style={S.badge(catColor[d.category]||COLORS.slate)}>{d.category}</span><span style={{fontSize:15,color:COLORS.slate}}>{formatDate(d.due_date)}   in {days}d</span></div></div>
                  <button style={S.btnCheck} onClick={()=>deadlines.update(d.id,{completed:true})}> </button>
                </div>
              </SwipeCard>
            );})}
          </>}
          {upcomingDeadlines.length>0&&<>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:16}}>  Upcoming   {upcomingDeadlines.length}</div>
            {upcomingDeadlines.map(d=>{const days=daysBetween(d.due_date);return(
              <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe} onEdit={()=>openEdit("deadline",d)} onDelete={()=>{deadlines.remove(d.id);setActiveSwipe(null);}} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,paddingRight:10}}><div style={{fontSize:15,fontWeight:600}}>{d.title}</div>{d.school&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{d.school}</div>}<div style={{display:"flex",gap:6,marginTop:10,alignItems:"center"}}><span style={S.badge(catColor[d.category]||COLORS.slate)}>{d.category}</span><span style={{fontSize:15,color:COLORS.slate}}>{formatDate(d.due_date)}   in {days}d</span></div></div>
                  <button style={S.btnCheck} onClick={()=>deadlines.update(d.id,{completed:true})}> </button>
                </div>
              </SwipeCard>
            );})}
          </>}
          {pending.length===0&&<EmptyState icon=" " title="No open deadlines" detail="All caught up. Add SAT dates, application deadlines, and campus visits to track them here."/>}
          {done.length>0&&<>
            <button onClick={()=>setShowCompleted(p=>!p)} style={{...S.btnSm,width:"100%",textAlign:"center",marginTop:12,marginBottom:10}}>{showCompleted?"Hide":"Show"} {done.length} completed</button>
            {showCompleted&&done.map(d=>(
              <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe} onEdit={()=>openEdit("deadline",d)} onDelete={()=>{deadlines.remove(d.id);setActiveSwipe(null);}} style={{...S.card,opacity:0.5}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:15,textDecoration:"line-through",color:COLORS.slate}}>{d.title}</div><button style={S.btnSm} onClick={()=>deadlines.update(d.id,{completed:false})}>Undo</button></div>
              </SwipeCard>
            ))}
          </>}
          <button style={S.btn} onClick={()=>{setForm({category:"test"});setShowModal("deadline");}}>+ Add Deadline</button>
        </>}
      </>}

      {tab==="schools"&&<>
        {schools.loading?<Loading/>:<>
          <SwipeHint/>
          {["target","researching","applying","applied","accepted","rejected"].map(status=>{
            const group=schools.data.filter(s=>s.status===status);
            if(!group.length)return null;
            const nextAction={researching:"Next: Schedule a campus visit or virtual info session",target:"Next: Start Common App school list   add supplement requirements",applying:"Next: Draft supplemental essays and request recommendations",applied:"Next: Monitor portal for interview invites or additional materials",accepted:"Next: Compare financial aid packages and visit day",rejected:null};
            return(
              <div key={status}>
                <div style={S.sectionLabel}>{status.charAt(0).toUpperCase()+status.slice(1)}</div>
                {group.map(s=>(
                  <SwipeCard key={s.id} id={s.id} activeId={activeSwipe} setActiveId={setActiveSwipe} onEdit={()=>openEdit("school",s)} onDelete={()=>{schools.remove(s.id);setActiveSwipe(null);}} style={S.statusCard(statusColors[s.status])}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:15,fontWeight:600}}>{s.name}</div>
                      <select value={s.status} onChange={e=>schools.update(s.id,{status:e.target.value})} style={{background:COLORS.navyLight,color:COLORS.slateLight,border:"none",borderRadius:6,padding:"4px 8px",fontSize:13,cursor:"pointer"}}>
                        {["researching","target","applying","applied","accepted","rejected"].map(st=><option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                    <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap",alignItems:"center"}}>
                      {s.match_level&&<span style={S.badge(matchColors[s.match_level]||COLORS.slate)}>{s.match_level}</span>}
                      {s.app_type&&<span style={S.badge(appTypeColors[s.app_type]||COLORS.slate)}>{s.app_type}</span>}
                      {s.app_deadline&&<span style={{fontSize:13,color:COLORS.slate}}>Due {formatDate(s.app_deadline)}</span>}
                    </div>
                    {s.visit_notes&&<div style={{fontSize:13,color:COLORS.slateLight,marginTop:10,fontStyle:"italic",lineHeight:1.4}}>  {s.visit_notes}</div>}
                    {nextAction[s.status]&&<div style={{fontSize:12,color:statusColors[s.status]||COLORS.slate,marginTop:8,fontWeight:600}}>  {nextAction[s.status]}</div>}
                  </SwipeCard>
                ))}
              </div>
            );
          })}
          {schools.data.length===0&&<EmptyState icon=" " title="No schools added yet" detail="Add schools to your list   reach, target, and safety."/>}
          <button style={S.btn} onClick={()=>{setForm({status:"researching",app_type:"Regular",match_level:"Target"});setShowModal("school");}}>+ Add School</button>
        </>}
      </>}

      {tab==="essays"&&<>
        {essays.loading?<Loading/>:<>
          <SwipeHint/>
          {["not started","drafting","review","submitted"].map(status=>{
            const group=essays.data.filter(e=>(e.status||"not started")===status);
            if(!group.length)return null;
            return(
              <div key={status}>
                <div style={S.sectionLabel}>{status.charAt(0).toUpperCase()+status.slice(1)}</div>
                {group.map(e=>{const days=e.due_date?daysBetween(e.due_date):null;return(
                  <SwipeCard key={e.id} id={e.id} activeId={activeSwipe} setActiveId={setActiveSwipe} onEdit={()=>openEdit("essay",e)} onDelete={()=>{essays.remove(e.id);setActiveSwipe(null);}} style={S.statusCard(essayStatusColors[e.status]||COLORS.slate)}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600}}>{e.title}</div>{e.school&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{e.school}</div>}<div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>{e.due_date&&<span style={{fontSize:15,color:days<0?COLORS.red:days<=7?COLORS.amber:COLORS.slate}}>Due {formatDate(e.due_date)}{days!==null?` (${days<0?`${-days}d overdue`:`${days}d`})`:""}</span>}{e.word_count&&<span style={{fontSize:15,color:COLORS.slate}}>{e.word_count} words</span>}</div>{e.notes&&<div style={{fontSize:15,color:COLORS.slateLight,marginTop:10,fontStyle:"italic"}}>{e.notes}</div>}</div>
                      <select value={e.status||"not started"} onChange={ev=>essays.update(e.id,{status:ev.target.value})} style={{background:COLORS.navyLight,color:COLORS.slateLight,border:"none",borderRadius:6,padding:"4px 8px",fontSize:15,cursor:"pointer",flexShrink:0}}>
                        {["not started","drafting","review","submitted"].map(st=><option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  </SwipeCard>
                );})}
              </div>
            );
          })}
          <button style={S.btn} onClick={()=>{setForm({status:"not started"});setShowModal("essay");}}>+ Add Essay</button>
        </>}
      </>}

      {tab==="sat/act"&&<>
        {scores.data.length>0&&(()=>{const best=scores.data.reduce((a,b)=>(b.total||0)>(a.total||0)?b:a,scores.data[0]);return(
          <div style={{...S.card,background:COLORS.navyLight,textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:6}}>Best Score</div>
            <div style={{fontSize:40,fontWeight:800,letterSpacing:"-1px"}}>{best.total}</div>
            <div style={{display:"flex",justifyContent:"center",gap:32,marginTop:12}}>
              <div><div style={{fontSize:22,fontWeight:700}}>{best.math}</div><div style={{fontSize:13,color:COLORS.slate}}>Math</div></div>
              <div style={{width:1,background:COLORS.navyLight}}/>
              <div><div style={{fontSize:22,fontWeight:700}}>{best.verbal}</div><div style={{fontSize:13,color:COLORS.slate}}>Verbal</div></div>
            </div>
            <div style={{fontSize:13,color:COLORS.slate,marginTop:10}}>{scores.data.length} attempt{scores.data.length!==1?"s":""} logged</div>
          </div>
        );})()}
        <div style={S.sectionLabel}>Test Plan</div>
        {testPlan.loading?<Loading/>:<>
          <SwipeHint/>
          {testPlan.data.length===0&&<EmptyState icon=" " title="No tests planned" detail="Add SAT/ACT dates to track registration deadlines and target scores."/>}
          {testPlan.data.map(t=>{const days=daysBetween(t.target_date);return(
            <SwipeCard key={t.id} id={t.id} activeId={activeSwipe} setActiveId={setActiveSwipe} onEdit={()=>openEdit("test",t)} onDelete={()=>{testPlan.remove(t.id);setActiveSwipe(null);}} style={S.statusCard(days<=14?COLORS.amber:COLORS.blue)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600}}>{t.test_type}   Attempt {t.attempt_number}</div><div style={{fontSize:13,color:COLORS.slate,marginTop:2}}>{formatDate(t.target_date)}   {days<0?"Past":`${days}d away`}{t.target_score?`   Target: ${t.target_score}`:""}</div>{t.notes&&<div style={{fontSize:13,color:COLORS.slate,marginTop:8,fontStyle:"italic"}}>{t.notes}</div>}</div>
                <span style={S.badge(t.registered?COLORS.green:COLORS.amber)}>{t.registered?"Registered":"Not yet"}</span>
              </div>
            </SwipeCard>
          );})}
          <button style={S.btn} onClick={()=>{setForm({test_type:"SAT",attempt_number:1,registered:false});setShowModal("test");}}>+ Add Test Date</button>
        </>}
        <div style={S.sectionLabel}>Score History</div>
        {scores.loading?<Loading/>:<>
          {scores.data.length===0&&<EmptyState icon=" " title="No scores yet" detail="Log official and practice SAT/ACT scores to track progress."/>}
          {scores.data.map(s=>(
            <SwipeCard key={s.id} id={s.id} activeId={activeSwipe} setActiveId={setActiveSwipe} onEdit={()=>openEdit("score",s)} onDelete={()=>{scores.remove(s.id);setActiveSwipe(null);}} style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:17,fontWeight:700}}>{s.total} <span style={{fontSize:13,color:COLORS.slate,fontWeight:400}}>({s.math}M / {s.verbal}V)</span></div><div style={{fontSize:13,color:COLORS.slate,marginTop:2}}>{formatDate(s.date)}{s.notes?`   ${s.notes}`:""}</div></div>
                {scores.data.length>0&&s.total===Math.max(...scores.data.map(x=>x.total||0))&&<span style={S.badge(COLORS.green)}>Best</span>}
              </div>
            </SwipeCard>
          ))}
          <button style={S.btn} onClick={()=>{setForm({});setShowModal("score");}}>+ Log Score</button>
        </>}
      </>}

      {tab==="planning"&&<>
        <div style={{...S.card,background:COLORS.navyLight,marginBottom:16}}>
          <div style={{fontSize:15,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Future Planning</div>
          <div style={{fontSize:15,fontWeight:700}}>Blake & Brayden</div>
          <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>Years until college start   529 funding status</div>
        </div>
        {(()=>{
          const savingsBalance=collegeSav.data[0]?.balance||0;
          const children=[{name:"Blake",color:COLORS.green,startYear:2032,age:12,milestones:[{year:2027,label:"PSAT / start tracking"},{year:2028,label:"Build college list"},{year:2029,label:"Campus visits"},{year:2030,label:"SAT / ACT prep"},{year:2031,label:"Applications"},{year:2032,label:"College starts  "}]},{name:"Brayden",color:COLORS.amber,startYear:2035,age:9,milestones:[{year:2030,label:"PSAT / start tracking"},{year:2031,label:"Build college list"},{year:2032,label:"Campus visits"},{year:2033,label:"SAT / ACT prep"},{year:2034,label:"Applications"},{year:2035,label:"College starts  "}]}];
          const currentYear=new Date(TODAY_DATE).getFullYear();
          return children.map(child=>{
            const goal=collegeGoals.data.find(g=>g.child_name===child.name),yearsAway=child.startYear-currentYear,targetAmount=goal?.target_amount||160000,monthsToStart=yearsAway*12,growthRate=0.07/12,futurePoolEstimate=savingsBalance*Math.pow(1+growthRate,monthsToStart),pct=Math.min(100,Math.round(futurePoolEstimate/targetAmount*100));
            return(
              <div key={child.name} style={{...S.card,borderTop:`3px solid ${child.color}`,marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div><div style={{fontSize:19,fontWeight:800,color:child.color}}>{child.name}</div><div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>Age {child.age}   {yearsAway} year{yearsAway!==1?"s":""} until college   Class of {child.startYear}</div></div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}><div style={{fontSize:20,fontWeight:800,color:pct>=80?COLORS.green:pct>=50?COLORS.amber:COLORS.red}}>{pct}%</div><div style={{fontSize:15,color:COLORS.slate}}>funded est.</div></div>
                </div>
                <div style={{fontSize:15,color:COLORS.slate,marginBottom:10}}>Target: {formatMoneyShort(targetAmount)}   Pool grows to ~{formatMoneyShort(futurePoolEstimate)} by {child.startYear}</div>
                <div style={S.progress}><div style={S.progressFill(pct,pct>=80?COLORS.green:pct>=50?COLORS.amber:COLORS.red)}/></div>
                <div style={{marginTop:14}}>
                  <div style={{fontSize:15,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Planning Timeline</div>
                  {child.milestones.map((m,i)=>{const isPast=m.year<currentYear,isCurrent=m.year===currentYear;return(<div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:i<child.milestones.length-1?`1px solid ${COLORS.navyLight}`:"none"}}><div style={{width:8,height:8,borderRadius:"50%",background:isPast?child.color:isCurrent?child.color:COLORS.navyLight,flexShrink:0}}/><div style={{flex:1,fontSize:15,color:isPast?COLORS.slate:isCurrent?COLORS.white:COLORS.slate,fontWeight:isCurrent?700:400}}>{m.label}</div><div style={{fontSize:15,color:COLORS.slate,flexShrink:0}}>{m.year}</div></div>);})}</div>
              </div>
            );
          });
        })()}
        <div style={{...S.card,background:COLORS.navyLight,marginTop:10}}><div style={{fontSize:15,color:COLORS.slate,lineHeight:1.6}}>  529 estimates assume the shared pool grows at 7%/yr sequentially   Aubrey first (2027), then Blake (2032), then Brayden (2035).</div></div>
      </>}

      {showModal==="deadline"&&<Modal title={editItem?"Edit Deadline":"Add Deadline"} onClose={closeModal}>
        <label style={S.label}>Title</label><input style={S.input} placeholder="e.g. Common App Essay Draft" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
        <label style={S.label}>Due Date</label><input type="date" style={S.input} value={form.due_date||""} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>
        <label style={S.label}>School (optional)</label><input style={S.input} placeholder="e.g. University of Virginia" value={form.school||""} onChange={e=>setForm(p=>({...p,school:e.target.value}))}/>
        <label style={S.label}>Category</label><div>{["test","application","visit","other"].map(c=><span key={c} style={S.chip(form.category===c,catColor[c])} onClick={()=>setForm(p=>({...p,category:c}))}>{c}</span>)}</div>
        <button style={{...S.btn,marginTop:16}} onClick={saveDeadline}>{editItem?"Save Changes":"Add Deadline"}</button>
      </Modal>}
      {showModal==="school"&&<Modal title={editItem?"Edit School":"Add School"} onClose={closeModal}>
        <label style={S.label}>School Name</label><input style={S.input} value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
        <label style={S.label}>Status</label><div>{["researching","target","applying","applied","accepted","rejected"].map(s=><span key={s} style={S.chip(form.status===s,statusColors[s])} onClick={()=>setForm(p=>({...p,status:s}))}>{s}</span>)}</div>
        <label style={{...S.label,marginTop:10}}>Match Level</label><div>{["Reach","Target","Safety"].map(m=><span key={m} style={S.chip(form.match_level===m,matchColors[m])} onClick={()=>setForm(p=>({...p,match_level:m}))}>{m}</span>)}</div>
        <label style={{...S.label,marginTop:10}}>Application Type</label><div>{["ED","EA","Regular","Rolling"].map(t=><span key={t} style={S.chip(form.app_type===t,appTypeColors[t])} onClick={()=>setForm(p=>({...p,app_type:t}))}>{t}</span>)}</div>
        <label style={S.label}>Application Deadline</label><input type="date" style={S.input} value={form.app_deadline||""} onChange={e=>setForm(p=>({...p,app_deadline:e.target.value}))}/>
        <label style={S.label}>Visit Notes (optional)</label><input style={S.input} value={form.visit_notes||""} onChange={e=>setForm(p=>({...p,visit_notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveSchool}>{editItem?"Save Changes":"Add School"}</button>
      </Modal>}
      {showModal==="essay"&&<Modal title={editItem?"Edit Essay":"Add Essay"} onClose={closeModal}>
        <label style={S.label}>Title</label><input style={S.input} value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
        <label style={S.label}>School</label><input style={S.input} value={form.school||""} onChange={e=>setForm(p=>({...p,school:e.target.value}))}/>
        <label style={S.label}>Due Date</label><input type="date" style={S.input} value={form.due_date||""} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>
        <label style={S.label}>Status</label><div>{["not started","drafting","review","submitted"].map(s=><span key={s} style={S.chip(form.status===s,essayStatusColors[s])} onClick={()=>setForm(p=>({...p,status:s}))}>{s}</span>)}</div>
        <label style={S.label}>Word Count</label><input style={S.input} placeholder="e.g. 650 max" value={form.word_count||""} onChange={e=>setForm(p=>({...p,word_count:e.target.value}))}/>
        <label style={S.label}>Notes</label><input style={S.input} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveEssay}>{editItem?"Save Changes":"Add Essay"}</button>
      </Modal>}
      {showModal==="test"&&<Modal title={editItem?"Edit Test Plan":"Add Test Plan"} onClose={closeModal}>
        <label style={S.label}>Test Type</label><div>{["SAT","ACT","PSAT"].map(t=><span key={t} style={S.chip(form.test_type===t,COLORS.purple)} onClick={()=>setForm(p=>({...p,test_type:t}))}>{t}</span>)}</div>
        <label style={S.label}>Target Test Date</label><input type="date" style={S.input} value={form.target_date||""} onChange={e=>setForm(p=>({...p,target_date:e.target.value}))}/>
        <div style={S.row}><div style={S.col}><label style={S.label}>Attempt #</label><input type="number" style={S.input} value={form.attempt_number||""} onChange={e=>setForm(p=>({...p,attempt_number:e.target.value}))}/></div><div style={S.col}><label style={S.label}>Target Score</label><input style={S.input} value={form.target_score||""} onChange={e=>setForm(p=>({...p,target_score:e.target.value}))}/></div></div>
        <label style={S.label}>Registration</label><div><span style={S.chip(form.registered===true,COLORS.green)} onClick={()=>setForm(p=>({...p,registered:true}))}>Registered</span><span style={S.chip(form.registered===false,COLORS.amber)} onClick={()=>setForm(p=>({...p,registered:false}))}>Not yet</span></div>
        <label style={S.label}>Notes</label><input style={S.input} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveTestPlan}>{editItem?"Save Changes":"Add Test Plan"}</button>
      </Modal>}
      {showModal==="score"&&<Modal title={editItem?"Edit Score":"Log SAT Score"} onClose={closeModal}>
        <label style={S.label}>Date</label><input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
        <div style={S.row}><div style={S.col}><label style={S.label}>Math</label><input type="number" style={S.input} placeholder="200 800" value={form.math||""} onChange={e=>setForm(p=>({...p,math:e.target.value}))}/></div><div style={S.col}><label style={S.label}>Verbal</label><input type="number" style={S.input} placeholder="200 800" value={form.verbal||""} onChange={e=>setForm(p=>({...p,verbal:e.target.value}))}/></div></div>
        <label style={S.label}>Total</label><input type="number" style={S.input} placeholder="400 1600" value={form.total||""} onChange={e=>setForm(p=>({...p,total:e.target.value}))}/>
        <label style={S.label}>Notes</label><input style={S.input} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveScore}>{editItem?"Save Changes":"Log Score"}</button>
      </Modal>}
    </div>
  );
}


