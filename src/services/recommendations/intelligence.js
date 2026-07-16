const DAY=86400000;
const clamp=value=>Math.max(0,Math.min(100,Math.round(value)));
const keyOf=item=>item.deduplicationKey||item.id;
const date=value=>new Date(value||0).getTime();

export function estimateWorkload(data={},today=new Date().toISOString().slice(0,10)){
  const open=(data.tasks||[]).filter(x=>!x.completed&&x.status!=="completed"),overdue=open.filter(x=>x.due_date&&x.due_date<today).length;
  const events=(data.events||[]).filter(x=>String(x.start?.dateTime||x.start?.date||x.date||"").slice(0,10)===today).length;
  const maintenance=(data.maintenance||[]).filter(x=>x.next_maintenance&&x.next_maintenance<=today).length;
  const dueHabits=(data.habits||[]).filter(x=>!x.archived&&x.status!=="paused").length;
  const interruptions=Number(data.weather?.precipitationProbability)>=70?2:0;
  const score=open.length+overdue*2+events*2+maintenance*2+Math.min(dueHabits,4)+interruptions;
  const level=score>=18?"overloaded":score>=12?"heavy":score>=6?"moderate":"light";
  return{level,score,explanation:`${open.length} open tasks, ${overdue} overdue, ${events} events today, and ${maintenance} maintenance items due.`};
}

export function effectivenessMetrics(history=[]){
  const shown=history.filter(x=>x.action==="generated"),completed=history.filter(x=>x.action==="completed"),dismissed=history.filter(x=>["dismissed","never_remind"].includes(x.action)),snoozed=history.filter(x=>x.action==="snoozed");
  const elapsed=completed.map(done=>{const start=shown.find(x=>x.recommendation_key===done.recommendation_key);return start?date(done.created_at)-date(start.created_at):0;}).filter(x=>x>=0);
  return{shown:shown.length,completed:completed.length,dismissed:dismissed.length,snoozed:snoozed.length,completionRate:shown.length?Math.round(completed.length/shown.length*100):0,dismissRate:shown.length?Math.round(dismissed.length/shown.length*100):0,averageTimeToCompletionHours:elapsed.length?Math.round(elapsed.reduce((a,b)=>a+b,0)/elapsed.length/3600000):null};
}

export function confidenceFor(item,history=[],now=new Date()){
  const rows=history.filter(x=>x.recommendation_key===keyOf(item));
  const completed=rows.filter(x=>x.action==="completed").length,dismissed=rows.filter(x=>["dismissed","never_remind"].includes(x.action)).length,ignored=Math.max(0,rows.filter(x=>x.action==="generated").length-completed-dismissed);
  const factors=[{name:"deterministic evidence",value:(item.supportingData||[]).length?18:6},{name:"urgency",value:item.urgency==="immediate"?18:item.urgency==="soon"?10:4},{name:"household impact",value:["critical","high"].includes(item.severity)?16:8},{name:"cross-module corroboration",value:(item.sourceModules||[]).length>1?14:4},{name:"freshness",value:date(item.lastEvaluation)>now.getTime()-DAY?12:5},{name:"completion history",value:Math.min(12,completed*4)},{name:"dismissal history",value:-Math.min(24,dismissed*8+ignored*3)}];
  const score=clamp(30+factors.reduce((sum,x)=>sum+x.value,0));
  return{score,factors,reason:factors.filter(x=>x.value>=10).slice(0,3).map(x=>x.name).join(", ")||"current deterministic evidence"};
}

export function adaptiveCooldownDays(item,history=[]){const rows=history.filter(x=>x.recommendation_key===keyOf(item)),dismissals=rows.filter(x=>["dismissed","snoozed"].includes(x.action)).length,ignored=Math.max(0,rows.filter(x=>x.action==="generated").length-rows.filter(x=>x.action!=="generated").length);return Math.min(30,2+dismissals*3+ignored*2);}

export function resolveDependencies(items=[]){const keys=new Set(items.map(keyOf));return items.map(item=>{const dependencies=(item.dependencies||[]).filter(key=>keys.has(key));return{...item,dependencies,blocked:dependencies.length>0,dependencyReason:dependencies.length?`Complete ${dependencies.length} prerequisite${dependencies.length===1?"":"s"} first.`:null};});}

export function groupRecommendations(items=[]){
  const groups=new Map();items.forEach(item=>{const module=(item.sourceModules||[item.category])[0]||"household",key=item.groupKey||(`${module}:${item.category}`);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);});
  return[...groups.values()].map(group=>group.length<2?group[0]:{...group[0],id:`group-${keyOf(group[0])}`,deduplicationKey:`group:${group.map(keyOf).sort().join("|")}`,title:`Complete ${String(group[0].category||"household").replace(/-/g," ")} priorities`,recommendedAction:`Review and complete ${group.length} related items.`,subtasks:group,sourceIds:group.flatMap(x=>x.sourceIds||[]),supportingData:group.map(x=>x.title),rationale:`${group.length} related recommendations were combined to reduce noise.`});
}

export function enhanceRecommendations(items=[],{data={},history=[],today,settings={}}={}){
  const workload=estimateWorkload(data,today),now=new Date();let enhanced=resolveDependencies(items).map(item=>{const confidence=confidenceFor(item,history,now),rows=history.filter(x=>x.recommendation_key===keyOf(item)),lastGenerated=[...rows].filter(x=>x.action==="generated").sort((a,b)=>date(b.created_at)-date(a.created_at))[0],materialChange=lastGenerated&&lastGenerated.trigger_signature!==item.triggerSignature,cooldownDays=adaptiveCooldownDays(item,history),cooling=lastGenerated&&!materialChange&&date(lastGenerated.created_at)+cooldownDays*DAY>now.getTime();return{...item,confidenceScore:confidence.score,confidenceReason:confidence.reason,confidenceFactors:confidence.factors,cooldownDays,materialChange:Boolean(materialChange),suppressedByFatigue:Boolean(cooling),priorityScore:(item.priorityScore||0)+confidence.score/10-(item.blocked?20:0)};}).filter(x=>!x.suppressedByFatigue||x.materialChange);
  enhanced=groupRecommendations(enhanced).sort((a,b)=>b.priorityScore-a.priorityScore||b.confidenceScore-a.confidenceScore);
  const limit=workload.level==="overloaded"?3:workload.level==="heavy"?5:settings.sensitivity==="minimal"?5:12;
  return{recommendations:enhanced.slice(0,limit),workload,metrics:effectivenessMetrics(history),trend:effectivenessMetrics(history).shown?`You completed ${effectivenessMetrics(history).completionRate}% of surfaced recommendations.`:"Recommendation trends will appear after household activity is recorded."};
}
