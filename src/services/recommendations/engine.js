const DAY_MS = 86400000;

export const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const dateOnly = value => value ? String(value).slice(0, 10) : null;
const distance = (value, today) => value ? Math.round((new Date(`${dateOnly(value)}T12:00:00`) - new Date(`${today}T12:00:00`)) / DAY_MS) : null;
const eventDate = event => dateOnly(event.start?.dateTime || event.start?.date || event.date);
const active = item => !item.archived && !item.completed && String(item.status || "").toLowerCase() !== "completed";
const scheduledToday = (item, today) => {
  const day = new Date(`${today}T12:00:00`).getDay();
  return item.status === "active" && (!item.start_date || item.start_date <= today) && (!(item.active_days || []).length || item.active_days.includes(day));
};
const habitPeriod = (habit,today) => {
  if(habit.habit_type==="checklist"||Number(habit.target_count)>1)return today;
  if(habit.frequency==="monthly")return today.slice(0,7);
  if(habit.frequency==="weekly"){const date=new Date(`${today}T12:00:00`);date.setDate(date.getDate()-((date.getDay()+6)%7));return date.toISOString().slice(0,10);}
  return today;
};

export function insight(input) {
  const severity=input.severity||"info",urgency=input.urgency||(["critical","high"].includes(severity)?"immediate":severity==="medium"?"soon":"when practical"),confidence=input.confidence||"high";
  return {
    id: input.id,
    severity,
    category: input.category,
    title: input.title,
    recommendedAction: input.recommendedAction,
    supportingData: input.supportingData || [],
    nav: input.nav || input.category,
    target: input.target || null,
    completable: input.completable !== false,
    sourceIds: input.sourceIds || [],
    urgency,
    confidence,
    impact: input.impact||severity,
    estimatedEffort: input.estimatedEffort||"quick",
    estimatedTime: input.estimatedTime||"5 to 15 minutes",
    consequenceIfIgnored: input.consequenceIfIgnored||"The issue may remain unresolved or become harder to address.",
    evidence: input.evidence||input.supportingData||[],
    createdAt: input.createdAt||null,
    expiresAt: input.expiresAt||null,
    deduplicationKey: input.deduplicationKey||input.id,
    rationale: input.rationale||`${severity[0].toUpperCase()+severity.slice(1)} priority based on timing, impact, and available evidence.`,
  };
}

export function priorityScore(item,context={}){const severity={critical:60,high:45,medium:30,low:15,info:5}[item.severity]||0;const urgency={immediate:20,soon:12,"when practical":4}[item.urgency]||0;const confidence={high:10,moderate:5,low:0}[item.confidence]||0;const effort={quick:6,moderate:3,significant:0}[item.estimatedEffort]||0;const load=context.householdLoad==="high"&&item.severity!=="critical"?-4:0;return Math.max(0,severity+urgency+confidence+effort+load);}

export function CalendarProvider(data, context) {
  const events = (data.events || []).filter(event => { const days = distance(eventDate(event), context.today); return days !== null && days >= 0 && days <= 7; });
  const today = events.filter(event => eventDate(event) === context.today);
  const byDay = events.reduce((map, event) => ({ ...map, [eventDate(event)]: [...(map[eventDate(event)] || []), event] }), {});
  const conflicts = Object.values(byDay).reduce((count, day) => count + Math.max(0, day.filter(event => event.start?.dateTime).length - 1), 0);
  const special = events.filter(event => /(birthday|anniversary)/i.test(`${event.summary || event.title || ""}`));
  return [
    today.length && insight({ id: "calendar-today", category: "calendar", severity: "info", title: today.length === 1 ? `${today[0].summary || today[0].title || "An event"} is scheduled today.` : `${today.length} events are scheduled today.`, recommendedAction: "Review today's schedule and preparation needs.", supportingData: today.map(event => event.summary || event.title).slice(0, 4), nav: "calendar" }),
    conflicts > 0 && insight({ id: "calendar-conflicts", category: "calendar", severity: "high", title: `You have ${conflicts} possible calendar conflict${conflicts === 1 ? "" : "s"} this week.`, recommendedAction: "Review overlapping timed events.", supportingData: Object.keys(byDay).filter(day => byDay[day].filter(event => event.start?.dateTime).length > 1), nav: "calendar" }),
    ...special.map(event => insight({ id: `life-event-${event.id || eventDate(event)}`, category: "life", severity: "medium", title: `${event.summary || event.title} is coming up.`, recommendedAction: "Confirm plans, gifts, or other preparation.", supportingData: [eventDate(event)], target:{type:"calendar-event",id:event.id}, nav: { tab: "calendar", eventId: event.id } })),
  ].filter(Boolean);
}

export function TaskProvider(data, context) {
  const tasks = (data.tasks || []).filter(active);
  const overdue = tasks.filter(task => distance(task.due_date, context.today) < 0);
  const dueToday = tasks.filter(task => distance(task.due_date, context.today) === 0);
  const important = tasks.filter(task => task.is_important || ["high", "urgent"].includes(String(task.priority).toLowerCase()));
  return [
    overdue.length && insight({ id: "tasks-overdue", category: "tasks", severity: overdue.some(task => task.is_important) ? "critical" : "high", title: overdue.length===1?overdue[0].title:`${overdue.length} tasks are overdue.`, recommendedAction: overdue.length===1?"Complete, delegate, or reschedule this overdue task.":"Complete, delegate, or reschedule the overdue work.", supportingData: overdue.length===1?[`Overdue · ${dateOnly(overdue[0].due_date)}`]:overdue.map(task => task.title).slice(0, 5), target:overdue.length===1?{type:"task",id:overdue[0].id,label:overdue[0].title}:null, nav: { tab: "tasks", filter: "overdue" }, sourceIds: overdue.map(task => task.id) }),
    dueToday.length && insight({ id: "tasks-today", category: "tasks", severity: "medium", title: dueToday.length===1?dueToday[0].title:`${dueToday.length} tasks are due today.`, recommendedAction: dueToday.length===1?"Complete this task today.":"Confirm today's owners and sequence.", supportingData: dueToday.length===1?["Due today"]:dueToday.map(task => task.title).slice(0, 5), target:dueToday.length===1?{type:"task",id:dueToday[0].id,label:dueToday[0].title}:null, nav: { tab: "tasks", filter: "today" }, sourceIds: dueToday.map(task => task.id) }),
    important.length && insight({ id: "tasks-important", category: "tasks", severity: "medium", title: `${important.length} important task${important.length === 1 ? " needs" : "s need"} attention.`, recommendedAction: "Protect time for the highest-priority item.", supportingData: important.map(task => task.title).slice(0, 5), nav: { tab: "tasks", filter: "important" } }),
  ].filter(Boolean);
}

export function HabitProvider(data, context) {
  const habits = (data.habits || []).filter(item => !item.archived && scheduledToday(item,context.today));
  const completions = data.habitCompletions || [];
  return habits.flatMap(habit => {
    const completion=completions.find(item=>item.habit_id===habit.id&&item.period_key===habitPeriod(habit,context.today));
    if (completion && ["completed","skipped","not_applicable"].includes(completion.status)) return [];
    const actions=(data.habitActions||[]).filter(item=>item.habit_id===habit.id&&item.active!==false);
    const history=(data.habitActionHistory||[]).find(item=>item.habit_id===habit.id&&dateOnly(item.habit_date)===context.today);
    const completed=(history?.completed_action_ids||[]).filter(id=>actions.some(action=>action.id===id)).length;
    const partial=actions.length>0&&completed>0;
    return [insight({id:`habit-${habit.id}`,category:"habits",severity:partial?"medium":habit.important?"medium":"low",title:habit.name,recommendedAction:partial?`${completed} of ${actions.length} complete. Finish today's routine.`:"Due today.",supportingData:[habit.category,habit.assigned_person_id?"Assigned":"Household"].filter(Boolean),target:{type:"habit",id:habit.id},sourceIds:[habit.id],urgency:partial?"soon":"when practical",deduplicationKey:`habit:${habit.id}`})];
  });
}

export function PoolProvider(data, context) {
  const latest = [...(data.poolReadings || [])].sort((a, b) => String(b.logged_at).localeCompare(String(a.logged_at)))[0];
  const lowChlorine = latest && Number(latest.free_chlorine) < Number(data.poolProfile?.target_fc_min || 2);
  const due = (data.poolSchedule || []).filter(item => { const next = item.due_date || (item.last_completed && item.interval_days ? new Date(new Date(`${item.last_completed}T12:00:00`).getTime() + Number(item.interval_days) * DAY_MS).toISOString().slice(0, 10) : null); return next && next <= context.today; });
  return [
    lowChlorine && insight({ id: "pool-chlorine-low", category: "pool", severity: "high", title: "Pool chlorine is below its target range.", recommendedAction: "Open Pool, review the measured recommendation, and confirm any treatment manually.", supportingData: [`Free chlorine ${latest.free_chlorine}`], nav: "pool" }),
    due.length && insight({ id: "pool-maintenance", category: "pool", severity: "medium", title: due.length===1?(due[0].title||"Pool maintenance is due."):`${due.length} pool maintenance items are due.`, recommendedAction: "Complete the maintenance checklist and log the result.", supportingData: due.map(item => item.title).slice(0, 5), target:due.length===1?{type:"pool-maintenance",id:due[0].id}:null, nav: { tab: "pool", section: "maintenance" } }),
  ].filter(Boolean);
}

export function MaintenanceProvider(data, context) {
  const due = (data.maintenance || []).filter(item => active(item) && item.next_maintenance && dateOnly(item.next_maintenance) <= context.today);
  return due.length ? [insight({ id: "home-maintenance-due", category: "maintenance", severity: "high", title: due.length===1?(due[0].name||due[0].title):`${due.length} home maintenance items are due.`, recommendedAction: "Schedule or complete the most urgent maintenance.", supportingData: due.map(item => item.name || item.title).slice(0, 5), target:due.length===1?{type:"home-asset",id:due[0].id}:null, nav: "home-assets", sourceIds: due.map(item => item.id) })] : [];
}

export function ShoppingProvider(data) {
  const needed = (data.shoppingItems || []).filter(item => !item.purchased && !item.archived);
  const inventory = needed.filter(item => item.inventory_flag || item.pantry_item_id);
  return needed.length ? [insight({ id: "shopping-needed", category: "shopping", severity: inventory.length ? "medium" : "low", title: `${needed.length} shopping item${needed.length === 1 ? " is" : "s are"} waiting.`, recommendedAction: inventory.length ? "Restock flagged inventory and group items by store." : "Review the list before the next store trip.", supportingData: needed.map(item => item.name).slice(0, 5), nav: "shopping" })] : [];
}

export function GardenProvider(data, context) {
  const due = (data.gardenReminders || []).filter(item => active(item) && dateOnly(item.due_date || item.next_maintenance) <= context.today);
  return due.map(item => insight({ id: `garden-${item.id}`, category: "garden", severity: "medium", title: `${item.name || item.title || "Garden care"} is due.`, recommendedAction: item.recommended_action || "Complete and log the garden task.", supportingData: [item.notes].filter(Boolean), nav: "home-assets", sourceIds: [item.id] }));
}

export function WeatherProvider(data){const weather=data.weather;if(!weather||weather.stale)return[];const results=[];const evidence=[`${weather.location||"Household location"} · ${weather.generatedAt||"freshness unavailable"}`];if(Number(weather.precipitationProbability)>=70)results.push(insight({id:"weather-heavy-rain",category:"weather",severity:"medium",title:"Heavy rain may affect outdoor household plans.",recommendedAction:"Review outdoor events, garden watering, pool level, and weather-sensitive maintenance.",supportingData:[...evidence,`${weather.precipitationProbability}% precipitation`],consequenceIfIgnored:"Outdoor work may be disrupted and watering or pool plans may be unnecessary.",nav:"calendar"}));if(Number(weather.low)<=32)results.push(insight({id:"weather-freeze",category:"weather",severity:"high",title:"Freezing conditions are forecast.",recommendedAction:"Protect exposed plumbing and sensitive plants, and review outdoor plans.",supportingData:[...evidence,`Forecast low ${weather.low}°F`],consequenceIfIgnored:"Freeze exposure may damage plumbing, plants, or outdoor equipment.",nav:"home-assets"}));if(Number(weather.high)>=95)results.push(insight({id:"weather-heat",category:"weather",severity:"high",title:"Extreme heat may increase household and outdoor-system stress.",recommendedAction:"Review hydration, outdoor timing, HVAC, pool, and garden needs.",supportingData:[...evidence,`Forecast high ${weather.high}°F`],consequenceIfIgnored:"Heat exposure may affect people, plants, and equipment.",nav:"home-assets"}));return results;}

export function ActivityProvider(data, context) {
  const completed = (data.tasks || []).filter(item => item.completed && distance(item.completed_at || item.updated_at, context.today) >= -7);
  return completed.length ? [insight({ id: "recent-accomplishments", category: "activity", severity: "info", title: `${completed.length} task${completed.length === 1 ? " was" : "s were"} completed recently.`, recommendedAction: "Acknowledge progress and carry forward only what still matters.", supportingData: completed.map(item => item.title).slice(0, 5), nav: { tab: "tasks", filter: "completed" }, completable: false })] : [];
}

export const DEFAULT_PROVIDERS = [CalendarProvider, TaskProvider, HabitProvider, PoolProvider, MaintenanceProvider, GardenProvider, WeatherProvider, ActivityProvider];

export function generateRecommendations(data = {}, options = {}) {
  const context = { today: options.today || new Date().toISOString().slice(0, 10) };
  const dismissed = new Set(options.dismissedIds || []);
  return (options.providers || DEFAULT_PROVIDERS)
    .flatMap(provider => provider(data, context) || [])
    .filter(item => item && !dismissed.has(item.id) && (!item.expiresAt||item.expiresAt>=context.today))
    .map(item=>({...item,priorityScore:priorityScore(item,options)}))
    .filter((item,index,list)=>list.findIndex(other=>other.deduplicationKey===item.deduplicationKey)===index)
    .sort((a, b) => b.priorityScore-a.priorityScore || a.id.localeCompare(b.id));
}
