const MODULE_PATTERNS=[
  ["pool",/\b(pool|chlorine|ph\b|salt|cya)\b/i],["habit",/\b(habit|workout|meditat|exercise|treadmill)\b/i],["garden",/\b(garden|tomato|plant|water|lawn)\b/i],["maintenance",/\b(replace|filter|maintenance|repair|service|oil change)\b/i],["note",/\b(add a note|note that|remember that)\b/i],["calendar-event",/\b(schedule|appointment|dentist|lesson|meeting|at \d{1,2}(:\d{2})?\s*(am|pm))\b/i],
];
const iso=d=>d.toISOString().slice(0,10);
export function resolveNaturalDate(text,now=new Date()){
  const value=new Date(now);value.setHours(12,0,0,0);const lower=String(text).toLowerCase();
  if(/\btoday\b/.test(lower))return iso(value);if(/\btomorrow\b/.test(lower)){value.setDate(value.getDate()+1);return iso(value);}
  const weeks=lower.match(/\bin\s+(\d+)\s+weeks?\b/);if(weeks){value.setDate(value.getDate()+Number(weeks[1])*7);return iso(value);}
  if(/\bin two weeks\b/.test(lower)){value.setDate(value.getDate()+14);return iso(value);}
  if(/\bnext month\b/.test(lower)){value.setMonth(value.getMonth()+1,1);return iso(value);}
  const days=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];const found=days.findIndex(day=>lower.includes(day));if(found>=0){let diff=(found-value.getDay()+7)%7;if(diff===0||lower.includes(`next ${days[found]}`))diff+=7;value.setDate(value.getDate()+diff);return iso(value);}
  if(/\bthis weekend\b/.test(lower)){let diff=(6-value.getDay()+7)%7;value.setDate(value.getDate()+diff);return iso(value);}
  return null;
}
export function parseQuickAdd(text,options={}){
  const raw=String(text||"").trim(),now=options.now?new Date(options.now):new Date();
  if(!raw)return {valid:false,confidence:"low",ambiguities:["Enter one household item."]};
  if(/\b(buy|shopping|grocery|groceries)\b/i.test(raw))return {valid:false,excluded:true,confidence:"high",ambiguities:["Shopping commands are not supported in FamilyOS."]};
  const detected=MODULE_PATTERNS.find(([,pattern])=>pattern.test(raw));const module=detected?.[0]||"task";
  const date=resolveNaturalDate(raw,now);const timeMatch=raw.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);let time=null;
  if(timeMatch){let hour=Number(timeMatch[1])%12;if(timeMatch[3].toLowerCase()==="pm")hour+=12;time=`${String(hour).padStart(2,"0")}:${timeMatch[2]||"00"}`;}
  const measurements={};for(const [key,pattern] of [["free_chlorine",/chlorine\s*(\d+(?:\.\d+)?)/i],["ph",/ph\s*(\d+(?:\.\d+)?)/i]]){const match=raw.match(pattern);if(match)measurements[key]=Number(match[1]);}
  const member=(options.members||[]).find(person=>new RegExp(`\\b${String(person.name||person.display_name||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,"i").test(raw));
  const title=raw.replace(/\b(today|tomorrow|next month|this weekend|in (?:two|\d+) weeks?|next (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/ig,"").replace(/\b(at\s+)?\d{1,2}(?::\d{2})?\s*(am|pm)\b/ig,"").replace(/^add a note (that )?/i,"").trim();
  const ambiguities=[];if(module==="calendar-event"&&!date)ambiguities.push("Date is required for a calendar event.");if(module==="pool"&&!Object.keys(measurements).length)ambiguities.push("Add at least one pool measurement.");
  return {valid:true,module,title,date,time,memberId:member?.id||null,measurements,notes:module==="note"?title:"",confidence:detected?"high":"moderate",ambiguities,requiresConfirmation:true,timezone:options.timezone||"America/New_York"};
}
