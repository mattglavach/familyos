export const CONTEXT_ENGINE_CONTRACT="familyos.context-engine";
export const CONTEXT_ENGINE_VERSION="2.9";
export const MODULE_CONTEXT_VERSION="1.0";
const SECTIONS=["summary","importantItems","upcomingItems","recommendations","metrics","recentActivity"];

function populated(value){return Array.isArray(value)?value.length>0:value&&typeof value==="object"?Object.keys(value).length>0:Boolean(value);}
function clean(value){if(Array.isArray(value))return value.map(clean).filter(populated);if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).filter(([key])=>!/[Ii]d$|household|user|token|secret|auth/.test(key)).map(([key,item])=>[key,clean(item)]).filter(([,item])=>populated(item)));return value;}
function itemKey(value){if(typeof value==="string")return value.trim().toLowerCase();return [value?.title,value?.action,value?.date,value?.dueDate,value?.status].filter(Boolean).join("|").trim().toLowerCase()||JSON.stringify(value);}
function priority(value){const label=String(value?.priority||value?.severity||"").toLowerCase();return label==="critical"?0:label==="high"?1:label==="medium"||label==="med"?2:3;}
function prioritizedUnique(value){if(!Array.isArray(value))return value;const seen=new Set();return [...value].sort((a,b)=>priority(a)-priority(b)).filter(item=>{const key=itemKey(item);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,12);}
export function createModuleContext(module,input={},options={}){
  if(options.allowed===false)return null;
  const body=Object.fromEntries(SECTIONS.map(section=>[section,prioritizedUnique(clean(input[section]))]).filter(([,value])=>populated(value)));
  if(!Object.keys(body).length)return null;
  return {module,version:MODULE_CONTEXT_VERSION,...body};
}
export function buildContextEngine(moduleContexts=[],metadata={}){
  const modules=(moduleContexts||[]).filter(Boolean).sort((a,b)=>a.module.localeCompare(b.module));
  return {contract:CONTEXT_ENGINE_CONTRACT,version:CONTEXT_ENGINE_VERSION,generatedAt:metadata.generatedAt||new Date().toISOString(),timezone:metadata.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone,permissions:{role:metadata.role||"viewer",financialContextAllowed:metadata.financialContextAllowed!==false,childContextAllowed:metadata.childContextAllowed!==false},modules:Object.fromEntries(modules.map(item=>[item.module,item]))};
}

/**
 * @typedef {Object} UnifiedHouseholdContext
 * @property {string} generatedAt
 * @property {string} timezone
 * @property {Object|null} householdLocation
 * @property {string} summary
 * @property {'low'|'normal'|'high'|'critical'} householdLoad
 * @property {Array<Object>} importantNow
 * @property {Object} today
 * @property {Array<Object>} upcoming
 * @property {Array<Object>} recentActivity
 * @property {Object} moduleSummaries
 * @property {Object|null} weather
 * @property {Array<Object>} recommendations
 * @property {Object} dataFreshness
 * @property {Array<Object>} evidence
 */
export function buildUnifiedHouseholdContext(input={},options={}){
  const householdId=options.householdId||null,timezone=options.timezone||"America/New_York",now=options.now?new Date(options.now):new Date();
  const scoped=rows=>(rows||[]).filter(row=>!row.household_id||row.household_id===householdId);
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  const tasks=scoped(input.tasks),events=scoped(input.calendar),open=tasks.filter(row=>!row.completed&&row.status!=="completed"),overdue=open.filter(row=>row.due_date&&row.due_date<today),dueToday=open.filter(row=>String(row.due_date||"").slice(0,10)===today),todayEvents=events.filter(row=>String(row.start?.dateTime||row.start?.date||row.date||"").slice(0,10)===today);
  const recommendations=scoped(input.recommendations),importantNow=[...overdue.map(row=>({source:"tasks",id:row.id,title:row.title,reason:"Overdue",date:row.due_date})),...recommendations.filter(row=>["critical","high"].includes(row.severity))];
  const loadScore=overdue.length*3+dueToday.length+todayEvents.length+recommendations.filter(row=>["critical","high"].includes(row.severity)).length*2;
  const householdLoad=loadScore>=12?"critical":loadScore>=8?"high":loadScore>=3?"normal":"low";
  const latest=(rows,key)=>scoped(rows).map(row=>row[key]).filter(Boolean).sort().at(-1)||null;
  const dataFreshness={tasks:latest(tasks,"updated_at"),calendar:options.calendarUpdatedAt||null,habits:latest(input.habitCompletions,"completed_at"),pool:latest(input.poolReadings,"logged_at"),home:latest(input.homeAssets,"updated_at"),weather:input.weather?.generatedAt||null};
  return {contract:CONTEXT_ENGINE_CONTRACT,version:CONTEXT_ENGINE_VERSION,generatedAt:now.toISOString(),timezone,householdLocation:options.householdLocation||null,summary:`${importantNow.length} important item${importantNow.length===1?"":"s"}; household load is ${householdLoad}.`,householdLoad,importantNow,today:{date:today,events:todayEvents,tasksDue:dueToday,overdueTasks:overdue},upcoming:[...open.filter(row=>row.due_date&&row.due_date>today),...events.filter(row=>String(row.start?.dateTime||row.start?.date||row.date||"").slice(0,10)>today)].slice(0,30),recentActivity:scoped(input.recentActivity).slice(0,30),moduleSummaries:{tasks:{open:open.length,overdue:overdue.length,dueToday:dueToday.length},calendar:{today:todayEvents.length},habits:{active:scoped(input.habits).filter(row=>!row.archived).length},pool:{latestReadingAt:dataFreshness.pool},home:{tracked:scoped(input.homeAssets).length}},weather:input.weather||null,recommendations,dataFreshness,missingCriticalData:Object.entries(dataFreshness).filter(([,value])=>!value).map(([source])=>source),evidence:importantNow.map(item=>({source:item.source||item.category,sourceId:item.id||null,reason:item.reason||item.rationale||"Prioritized household signal"}))};
}

export function taskContext(tasks=[],today=new Date().toISOString().slice(0,10)){const open=tasks.filter(x=>!x.completed&&x.status!=="completed");return createModuleContext("tasks",{summary:`${open.length} open tasks`,importantItems:open.filter(x=>x.due_date&&x.due_date<=today).map(x=>({title:x.title,dueDate:x.due_date,priority:x.priority})),upcomingItems:open.filter(x=>x.due_date&&x.due_date>today).slice(0,10).map(x=>({title:x.title,dueDate:x.due_date})),metrics:{open:open.length,completed:tasks.length-open.length},recentActivity:tasks.filter(x=>x.completed).slice(0,5).map(x=>({title:x.title,status:"completed"}))});}
export function calendarContext(events=[],today=new Date().toISOString().slice(0,10)){const normalized=events.map(x=>({title:x.title||x.summary||"Event",date:x.date||x.start?.date||String(x.start?.dateTime||x.start||"").slice(0,10),time:x.time||""})).filter(x=>x.date);return createModuleContext("calendar",{summary:`${normalized.filter(x=>x.date===today).length} events today`,importantItems:normalized.filter(x=>x.date===today),upcomingItems:normalized.filter(x=>x.date>today).slice(0,14),metrics:{visibleEvents:normalized.length}});}
export function lifeContext(lists=[],items=[]){const activeLists=lists.filter(x=>!x.archived),activeItems=items.filter(x=>!x.archived&&!x.completed_at&&!['completed','archived'].includes(String(x.status).toLowerCase()));return createModuleContext("life",{summary:`${activeLists.length} active lists and ${activeItems.length} active items`,importantItems:activeItems.filter(x=>x.priority==="high").slice(0,8).map(x=>({title:x.title,status:x.status})),metrics:{activeLists:activeLists.length,activeItems:activeItems.length},recentActivity:activeItems.slice(0,5).map(x=>({title:x.title,status:x.status}))});}
export function poolContext(context){if(!context)return null;return createModuleContext("pool",{summary:context.testFreshness?.state?`Pool test is ${context.testFreshness.state}`:"Pool context available",importantItems:context.activeWarnings,recommendations:(context.recommendations||[]).map(x=>({action:x.action,priority:x.priority,amount:x.amount,safetyNote:x.safetyNote})),metrics:context.latestReading?{ph:context.latestReading.ph,freeChlorine:context.latestReading.free_chlorine,cya:context.latestReading.cya,salt:context.latestReading.salt,waterTemperature:context.latestReading.water_temp}:null,recentActivity:(context.recentTreatments||[]).slice(0,5).map(x=>({date:x.date,treatment:x.treatment||x.notes||"Treatment logged"}))});}
export function financialContext(accounts=[],assumptions=[]){const total=accounts.reduce((sum,x)=>sum+Number(x.balance||0),0);return createModuleContext("financialPlanning",{summary:accounts.length?`${accounts.length} retirement accounts tracked`:"Financial planning is not configured",importantItems:assumptions[0]?{retirementAge:assumptions[0].retirement_age}:null,metrics:accounts.length?{accountCount:accounts.length,totalBalance:total}:null});}
export function homeContext(maintenance=[]){const due=maintenance.filter(x=>x.due_date&&x.due_date<=new Date().toISOString().slice(0,10));return createModuleContext("home",{summary:maintenance.length?`${maintenance.length} home maintenance records`:"Home maintenance is not configured",importantItems:due.map(x=>({title:x.title||x.type,dueDate:x.due_date})),metrics:maintenance.length?{tracked:maintenance.length,due:due.length}:null});}
export function habitContext(habits=[],completions=[]){const active=habits.filter(x=>!x.archived&&x.status!=="archived"),today=new Date().toISOString().slice(0,10),done=active.filter(h=>completions.some(c=>c.habit_id===h.id&&c.period_key===today&&c.status==="completed"));return createModuleContext("habits",{summary:`${done.length} of ${active.length} habits completed today`,importantItems:active.filter(h=>!done.includes(h)).map(h=>({title:h.name,status:"open",priority:h.important?"high":"normal"})),metrics:{active:active.length,completedToday:done.length}});}
export function routineContext(routines=[],completions=[]){const active=routines.filter(x=>!x.archived),recent=completions.filter(c=>c.completed_at).slice(0,10);return createModuleContext("routines",{summary:`${active.length} active routines`,metrics:{active:active.length,completedRuns:recent.length},recentActivity:recent.map(c=>({date:String(c.completed_at).slice(0,10),status:"completed"}))});}
