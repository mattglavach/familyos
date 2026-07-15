const dateOnly=value=>value?String(value).slice(0,10):"";
const timestamp=(value,fallback)=>value||fallback||new Date(0).toISOString();

/** @typedef {{id:string,sourceType:string,sourceId:string,title:string,summary:string,timestamp:string,effectiveDate:string,status:string,actor?:string,deepLink:string|object,metadata:object,evidence:object[],isUpcoming:boolean,isCompleted:boolean}} TimelineItem */

export function normalizeTimeline(input={},options={}){
  const now=options.now?new Date(options.now):new Date();
  const today=dateOnly(now.toISOString());
  const householdId=options.householdId||null;
  const scoped=rows=>(rows||[]).filter(row=>!row.household_id||row.household_id===householdId);
  const relationshipActivityIds=new Set(scoped(input.relationshipActivities).map(row=>row.id));
  const item=(sourceType,row,values)=>({id:`${sourceType}:${row.id}`,sourceType,sourceId:row.id,title:values.title,summary:values.summary||"",timestamp:timestamp(values.timestamp,values.effectiveDate),effectiveDate:dateOnly(values.effectiveDate||values.timestamp),status:values.status||"recorded",actor:values.actor||"",deepLink:values.deepLink,metadata:values.metadata||{},evidence:[{sourceType,sourceId:row.id}],isUpcoming:dateOnly(values.effectiveDate||values.timestamp)>today,isCompleted:Boolean(values.isCompleted)});
  const rows=[
    ...scoped(input.tasks).flatMap(row=>[item("task",row,{title:row.title||"Task",summary:row.completed?"Task completed":row.due_date?`Due ${row.due_date}`:"Task created",timestamp:row.completed_at||row.created_at,effectiveDate:row.completed_at||row.due_date||row.created_at,status:row.completed?"completed":"open",deepLink:{tab:"tasks",search:row.title||""},isCompleted:row.completed})]),
    ...scoped(input.calendar).map(row=>item("calendar",row,{title:row.title||row.summary||"Calendar event",summary:row.location||"Scheduled event",timestamp:row.start?.dateTime||row.start?.date||row.date,effectiveDate:row.start?.dateTime||row.start?.date||row.date,status:"scheduled",deepLink:{tab:"calendar",eventId:row.id}})),
    ...scoped(input.habitCompletions).map(row=>item("habit",row,{title:row.habit_name||"Habit completed",summary:"Habit completion",timestamp:row.completed_at||row.created_at,effectiveDate:row.habit_date||row.period_key||row.completed_at,status:"completed",deepLink:"habits",isCompleted:true})),
    ...scoped(input.poolReadings).map(row=>item("pool",row,{title:"Pool test recorded",summary:[row.ph&&`pH ${row.ph}`,row.free_chlorine&&`FC ${row.free_chlorine}`].filter(Boolean).join(" · "),timestamp:row.logged_at||row.date,effectiveDate:row.logged_at||row.date,status:"recorded",deepLink:{tab:"pool",view:"history",recordId:row.id}})),
    ...scoped(input.poolTreatments).map(row=>item("pool",row,{title:"Pool treatment recorded",summary:row.notes||"Chemical treatment",timestamp:row.logged_at||row.date,effectiveDate:row.logged_at||row.date,status:"completed",deepLink:{tab:"pool",view:"history",recordId:row.id},isCompleted:true})),
    ...scoped(input.poolMaintenance).map(row=>item("pool",row,{title:row.type||"Pool maintenance",summary:row.notes||"Maintenance recorded",timestamp:row.date,effectiveDate:row.date,status:"completed",deepLink:{tab:"pool",view:"history",recordId:row.id},isCompleted:true})),
    ...scoped(input.homeHistory).map(row=>item("home",row,{title:String(row.event_type||"Home activity").replace(/_/g," "),summary:row.notes||"Home operation recorded",timestamp:row.completed_at||row.created_at,effectiveDate:row.completed_at||row.created_at,status:"completed",deepLink:"home-assets",isCompleted:true})),
    ...scoped(input.homeAssets).filter(row=>row.next_maintenance).map(row=>item("maintenance",row,{title:row.name||"Home maintenance",summary:`${row.category||"Home"} maintenance`,timestamp:row.updated_at,effectiveDate:row.next_maintenance,status:row.status||"active",deepLink:"home-assets"})),
    ...scoped(input.notes).map(row=>item("note",row,{title:row.title||"Household note",summary:row.content||row.notes||"",timestamp:row.created_at,effectiveDate:row.created_at,status:"recorded",deepLink:{tab:"search",query:row.title||""}})),
    ...scoped(input.activity).filter(row=>row.entity_type!=="relationship"||!relationshipActivityIds.has(row.entity_id)).map(row=>item(row.entity_type||"activity",row,{title:row.title||"Household activity",summary:row.summary||"",timestamp:row.occurred_at,effectiveDate:row.occurred_at,status:row.action||"recorded",deepLink:row.deep_link||"timeline",isCompleted:row.action==="completed"})),
    ...scoped(input.relationshipActivities).map(row=>item("relationship",row,{title:row.title||"Relationship activity",summary:[row.activity_type,options.relationshipNames?.[row.relationship_id]].filter(Boolean).join(" · "),timestamp:row.occurred_at||row.planned_for||row.created_at,effectiveDate:row.occurred_at||row.planned_for||row.created_at,status:row.status||"recorded",deepLink:{tab:"relationships",relationshipId:row.relationship_id},isCompleted:row.status==="completed"})),
  ];
  const seen=new Set();
  return rows.filter(row=>{const key=`${row.sourceType}:${row.sourceId}:${row.status}:${row.effectiveDate}`;if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>a.isUpcoming!==b.isUpcoming?Number(a.isUpcoming)-Number(b.isUpcoming):a.isUpcoming?a.timestamp.localeCompare(b.timestamp):b.timestamp.localeCompare(a.timestamp)).slice(0,Number(options.limit)||200);
}

export function timelineGroup(item,today=new Date().toISOString().slice(0,10)){
  if(item.effectiveDate>today)return "Upcoming";
  if(item.effectiveDate===today)return "Today";
  const yesterday=new Date(`${today}T12:00:00`);yesterday.setDate(yesterday.getDate()-1);
  return item.effectiveDate===yesterday.toISOString().slice(0,10)?"Yesterday":"Earlier";
}
