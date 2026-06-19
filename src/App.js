import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SUPABASE_URL      = "https://dsowansazqleudupnjug.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3dhbnNhenFsZXVkdXBuanVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTkzMTYsImV4cCI6MjA5NzE5NTMxNn0.lO3QE01JzvPAaGDVVW9bbeKgnJHMdDNT667KZXLwSXk";
const GOOGLE_CLIENT_ID  = "717485548234-693i9fmmijf91t34u3mgc3ml2tksepvq.apps.googleusercontent.com";
const GOOGLE_SCOPES     = "https://www.googleapis.com/auth/calendar.readonly";
const CALENDAR_ID       = "mattglavach@gmail.com";

// ─── MEMBER KEYWORDS ──────────────────────────────────────────────────────────
const MEMBER_KEYWORDS = {
  Aubrey:  ["aubrey","dance","recital","ballet","cheer","sat","psat","college","ap ","audition"],
  Blake:   ["blake","baseball","little league","batting"],
  Brayden: ["brayden","soccer","football","futbol"],
  Kalee:   ["kalee","spa","girls","salon"],
  Matt:    ["matt","hoa","pickleball","dentist","doctor","pediatrician"],
};
function assignMember(title="", description="") {
  const text = (title+" "+description).toLowerCase();
  for (const [member,keywords] of Object.entries(MEMBER_KEYWORDS)) {
    if (keywords.some(k=>text.includes(k))) return member;
  }
  return "Matt";
}

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const sb = {
  from:(table)=>({
    _table:table,_order:null,_eq:null,
    order(col,{ascending=true}={}){this._order=`${col}.${ascending?"asc":"desc"}`;return this;},
    eq(col,val){this._eq=`${col}=eq.${val}`;return this;},
    async select(cols="*"){
      const p=new URLSearchParams({select:cols});
      if(this._order)p.set("order",this._order);
      if(this._eq)p.append(this._eq.split("=")[0],this._eq.split("=")[1]);
      const r=await fetch(`${SUPABASE_URL}/rest/v1/${this._table}?${p}`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});
      const d=await r.json();return{data:d,error:r.ok?null:d};
    },
    async insert(row){
      const r=await fetch(`${SUPABASE_URL}/rest/v1/${this._table}`,{method:"POST",headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(row)});
      const d=await r.json();return{data:Array.isArray(d)?d[0]:d,error:r.ok?null:d};
    },
    async update(row){
      if(!this._eq)throw new Error("eq required");
      const[col,val]=this._eq.split("=eq.");
      const r=await fetch(`${SUPABASE_URL}/rest/v1/${this._table}?${col}=eq.${val}`,{method:"PATCH",headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify(row)});
      const d=await r.json();return{data:Array.isArray(d)?d[0]:d,error:r.ok?null:d};
    },
    async delete(){
      if(!this._eq)throw new Error("eq required");
      const[col,val]=this._eq.split("=eq.");
      const r=await fetch(`${SUPABASE_URL}/rest/v1/${this._table}?${col}=eq.${val}`,{method:"DELETE",headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});
      return{error:r.ok?null:await r.json()};
    },
  }),
};

// ─── GOOGLE CALENDAR ──────────────────────────────────────────────────────────
function useGoogleCalendar() {
  const [token,setToken]     = useState(()=>localStorage.getItem("gc_token")||null);
  const [events,setEvents]   = useState([]);
  const [loading,setLoading] = useState(false);
  const [error,setError]     = useState(null);

  useEffect(()=>{
    if(document.getElementById("gsi-script"))return;
    const s=document.createElement("script");
    s.id="gsi-script";s.src="https://accounts.google.com/gsi/client";s.async=true;
    document.head.appendChild(s);
  },[]);

  function signIn(){
    if(!window.google){setError("Google script not loaded yet — try again.");return;}
    const client=window.google.accounts.oauth2.initTokenClient({
      client_id:GOOGLE_CLIENT_ID,scope:GOOGLE_SCOPES,
      callback:(resp)=>{
        if(resp.error){setError(resp.error);return;}
        localStorage.setItem("gc_token",resp.access_token);
        setToken(resp.access_token);
      },
    });
    client.requestAccessToken();
  }
  function signOut(){
    if(token&&window.google)window.google.accounts.oauth2.revoke(token);
    localStorage.removeItem("gc_token");
    setToken(null);setEvents([]);
  }

  const fetchEvents=useCallback(async(accessToken)=>{
    if(!accessToken)return;
    setLoading(true);setError(null);
    try{
      const now=new Date(),future=new Date();future.setDate(future.getDate()+30);
      const p=new URLSearchParams({calendarId:CALENDAR_ID,timeMin:now.toISOString(),timeMax:future.toISOString(),singleEvents:"true",orderBy:"startTime",maxResults:"50"});
      const res=await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${p}`,{headers:{Authorization:`Bearer ${accessToken}`}});
      if(res.status===401){signOut();return;}
      const data=await res.json();
      if(data.error){setError(data.error.message);setLoading(false);return;}
      const mapped=(data.items||[]).map((e,i)=>{
        const start=e.start?.dateTime||e.start?.date||"";
        const allDay=!e.start?.dateTime;
        const dateStr=start.split("T")[0];
        const timeStr=allDay?"":new Date(start).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
        return{id:e.id||i,title:e.summary||"(No title)",date:dateStr,time:timeStr,allDay,member:assignMember(e.summary,e.description),location:e.location||""};
      });
      setEvents(mapped);
    }catch{setError("Could not load calendar.");}
    setLoading(false);
  },[]);

  useEffect(()=>{if(token)fetchEvents(token);},[token,fetchEvents]);
  return{token,events,loading,error,signIn,signOut,refresh:()=>fetchEvents(token)};
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const COLORS={
  navy:"#0F1729",navyMid:"#1A2540",navyLight:"#243352",
  slate:"#8892A4",slateLight:"#B8C0CC",white:"#F7F8FA",
  red:"#E05252",amber:"#F0A030",green:"#3DB87A",blue:"#4A90D9",purple:"#8B6FD4",
};
const MEMBER_COLORS={
  Matt:"#4A90D9",Kalee:"#8B6FD4",Aubrey:"#E05252",Blake:"#3DB87A",Brayden:"#F0A030",
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED={
  pool_readings:[
    {id:"7",date:"2026-06-17",ph:8.0,free_chlorine:5.5,cc:0,salt:3350,cya:60,alkalinity:90,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:"K-2006: 11 drops FC. Acid added 2 days prior. TA 90 ppm (9 drops)."},
    {id:"6",date:"2026-06-15",ph:7.8,free_chlorine:3.0,cc:0,salt:3450,cya:60,alkalinity:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:""},
    {id:"5",date:"2026-06-12",ph:8.0,free_chlorine:4.0,cc:0,salt:3450,cya:60,alkalinity:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:"CYA increased"},
    {id:"4",date:"2026-06-10",ph:7.8,free_chlorine:2.0,cc:0,salt:3300,cya:60,alkalinity:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:"Hot weather"},
    {id:"3",date:"2026-06-04",ph:7.8,free_chlorine:5.0,cc:0,salt:3450,cya:43,alkalinity:null,water_temp:null,swg_setting:54,filter_pressure:null,pump_hours:null,notes:"SWG 54%"},
    {id:"2",date:"2026-05-31",ph:8.0,free_chlorine:5.5,cc:0,salt:3300,cya:null,alkalinity:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:"K-2006: 11 drops FC. After party."},
  ],
  pool_maintenance:[
    {id:"1",date:"2026-06-13",type:"Brushed walls & floor",notes:""},
    {id:"2",date:"2026-06-10",type:"Cleaned skimmer basket",notes:""},
  ],
  pool_schedule:[
    {id:"1",title:"Check water level",last_completed:"2026-06-10",interval_days:7,notes:"SC evaporation heavy May–Sept"},
    {id:"2",title:"Clean skimmer basket",last_completed:"2026-06-10",interval_days:7,notes:"Check same day after storms"},
    {id:"3",title:"Brush walls & floor",last_completed:"2026-06-13",interval_days:7,notes:"Vinyl — prevents algae buildup"},
    {id:"4",title:"Check cell flow switch",last_completed:"2026-05-15",interval_days:30,notes:"Pentair flow switch fails silently"},
    {id:"5",title:"Inspect O-rings & lid",last_completed:"2026-05-15",interval_days:30,notes:"Salt accelerates O-ring wear"},
    {id:"6",title:"Clean cartridge filter",last_completed:"2026-04-15",interval_days:60,notes:"Remove, hose off, reinstall"},
    {id:"7",title:"Clean salt cell (IntelliChlor)",last_completed:"2026-03-01",interval_days:90,notes:"Inspect plates, soak in acid if scale"},
    {id:"8",title:"Test calcium hardness",last_completed:"2026-01-01",interval_days:90,notes:"Vinyl target 150–250 ppm"},
  ],
  home_maintenance:[
    {id:"1",title:"HVAC Filter",last_completed:"2026-03-01",interval_days:90,notes:"16x25x1 filter"},
    {id:"2",title:"Pool Filter Backwash",last_completed:"2026-06-06",interval_days:14,notes:""},
    {id:"3",title:"Gutter Cleaning",last_completed:"2026-04-15",interval_days:90,notes:""},
    {id:"4",title:"Smoke Detector Test",last_completed:"2026-01-01",interval_days:180,notes:""},
    {id:"5",title:"Water Heater Flush",last_completed:"2025-12-01",interval_days:365,notes:""},
    {id:"6",title:"Dryer Vent Clean",last_completed:"2026-01-15",interval_days:180,notes:""},
  ],
  college_schools:[
    {id:"1",name:"University of Virginia",status:"researching",match_level:"Reach",app_type:"ED",app_deadline:"2026-11-01",visit_notes:""},
    {id:"2",name:"Wake Forest University",status:"researching",match_level:"Reach",app_type:"EA",app_deadline:"2026-11-15",visit_notes:""},
    {id:"3",name:"University of Richmond",status:"target",match_level:"Target",app_type:"EA",app_deadline:"2026-11-15",visit_notes:""},
    {id:"4",name:"James Madison University",status:"target",match_level:"Safety",app_type:"Regular",app_deadline:"2027-01-15",visit_notes:""},
  ],
  college_test_plan:[
    {id:"1",test_type:"SAT",target_date:"2026-08-23",target_score:"1400",attempt_number:1,registered:false,notes:"First official SAT attempt junior year"},
  ],
  college_deadlines:[
    {id:"1",title:"SAT Registration — August Test",due_date:"2026-06-20",school:"",category:"test",completed:false},
    {id:"2",title:"Common App Account Setup",due_date:"2026-07-01",school:"Common App",category:"application",completed:false},
    {id:"3",title:"UVA Campus Visit",due_date:"2026-07-15",school:"University of Virginia",category:"visit",completed:false},
    {id:"4",title:"Junior Year Transcript Request",due_date:"2026-08-01",school:"",category:"application",completed:false},
    {id:"5",title:"SAT Exam Date",due_date:"2026-08-23",school:"",category:"test",completed:false},
  ],
  sat_scores:[
    {id:"1",date:"2026-03-08",total:1280,math:640,verbal:640,notes:"PSAT — strong baseline"},
  ],
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────
const todayReal=new Date();todayReal.setHours(0,0,0,0);
const TODAY_STR=todayReal.toISOString().split("T")[0];
function daysBetween(s){return Math.round((new Date(s+"T00:00:00")-todayReal)/(1000*60*60*24));}
function daysAgo(s){return -daysBetween(s);}
function nextDueDate(last,interval){const d=new Date(last+"T00:00:00");d.setDate(d.getDate()+interval);return d.toISOString().split("T")[0];}
function formatDate(s){return new Date(s+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});}
function formatDateFull(s){return new Date(s+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});}
function formatToday(){return new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});}
function poolStatus(param,value){
  if(value===null||value===undefined||isNaN(value))return"grey";
  const ranges={ph:{low:7.2,goodHigh:7.6,high:7.8},free_chlorine:{low:1.5,goodHigh:4.0,high:5.0},salt:{low:3200,goodHigh:3600,high:3800},cya:{low:50,goodHigh:80,high:90},alkalinity:{low:80,goodHigh:120,high:140}};
  const r=ranges[param];if(!r)return"green";
  if(value<r.low||value>r.high)return"red";
  if(value<=r.goodHigh)return"green";return"amber";
}
function statusColor(s){return s==="red"?COLORS.red:s==="amber"?COLORS.amber:s==="grey"?COLORS.slate:COLORS.green;}
function maintStatus(item){const days=daysBetween(nextDueDate(item.last_completed,item.interval_days));if(days<0)return"overdue";if(days<=7)return"due-soon";return"ok";}
function maintColor(s){return s==="overdue"?COLORS.red:s==="due-soon"?COLORS.amber:COLORS.green;}

// Find the most recent reading date where a given param was actually tested (not null)
function lastTestedDate(readings, paramKey) {
  for (const r of readings) {
    if (r[paramKey] !== null && r[paramKey] !== undefined) return r.date;
  }
  return null;
}
function nextTestDue(readings, paramKey, intervalDays) {
  const lastDate = lastTestedDate(readings, paramKey);
  if (!lastDate) return null;
  const due = nextDueDate(lastDate, intervalDays);
  return { lastDate, due, days: daysBetween(due) };
}

// Compare current value to the previous reading where this param was tested
function trendDirection(readings, paramKey, currentValue) {
  if (currentValue === null || currentValue === undefined) return null;
  // skip the first (current) reading, find next one with a value
  for (let i = 1; i < readings.length; i++) {
    const v = readings[i][paramKey];
    if (v !== null && v !== undefined) {
      if (currentValue > v) return "up";
      if (currentValue < v) return "down";
      return "flat";
    }
  }
  return null;
}
function trendArrow(dir) {
  if (dir === "up") return "↑";
  if (dir === "down") return "↓";
  if (dir === "flat") return "→";
  return "";
}

// ─── POOL CHEMISTRY ENGINE ────────────────────────────────────────────────────
const POOL_GALLONS = 17000;
const CALCIUM_HARDNESS = 200; // placeholder — vinyl pool, test and update

function calcAcidDose(currentPH, targetPH=7.4, alkalinity=90, gallons=POOL_GALLONS) {
  // Muriatic acid (31.45%) dose in oz for 17,000 gal vinyl pool
  // Each oz of 31.45% muriatic acid lowers pH by ~0.1 in 10,000 gal at alk 100
  if(!currentPH || currentPH <= targetPH) return null;
  const phDrop = currentPH - targetPH;
  const alkFactor = (alkalinity || 90) / 100; // higher alk = more acid needed
  const baseOzPer10k = phDrop * 12 * alkFactor;
  const oz = Math.round(baseOzPer10k * (gallons / 10000));
  return oz;
}

function calcSWGRecommendation(fc, cya, waterTemp) {
  // Target FC for SWG = 7.5% of CYA (TFPC method)
  const effectiveCYA = cya || 60;
  const targetFC = Math.max(2, effectiveCYA * 0.075);
  if(fc === null || fc === undefined) return null;
  // Adjust for temp: above 85°F increase by 10-20%
  const tempMultiplier = (waterTemp && waterTemp > 85) ? 1.15 : 1.0;
  if(fc > targetFC * 1.5) return { action:"lower", pct: null, msg:`FC is high (${fc} ppm). Lower SWG output or let it come down naturally. Target: ${targetFC.toFixed(1)} ppm` };
  if(fc < targetFC * 0.5) return { action:"raise", pct: null, msg:`FC critically low (${fc} ppm). Raise SWG to 100% temporarily. Minimum safe FC: ${targetFC.toFixed(1)} ppm` };
  return { action:"ok", pct: null, msg:`FC is in range. Maintain current SWG setting.` };
}

function calcShockThreshold(cya) {
  // TFPC: minimum FC = CYA / 10 to maintain effectiveness
  const effectiveCYA = cya || 60;
  return Math.round(effectiveCYA / 10);
}

function calcFCBurnRate(readings) {
  // FC drop per day between last two readings
  if(!readings || readings.length < 2) return null;
  const r1 = readings[0], r2 = readings[1];
  if(r1.free_chlorine === null || r2.free_chlorine === null) return null;
  const days = Math.abs(daysBetween(r2.date) - daysBetween(r1.date));
  if(days === 0) return null;
  const drop = r2.free_chlorine - r1.free_chlorine;
  return { perDay: (drop / days).toFixed(1), days, from: r2.free_chlorine, to: r1.free_chlorine };
}

function calcLangelier(ph, alkalinity, calcium=CALCIUM_HARDNESS, waterTemp=82) {
  // Langelier Saturation Index = pH - pHs
  // pHs = pK2 - pKs + p[Ca] + p[Alk]
  if(!ph || !alkalinity) return null;
  const tempF = waterTemp || 82;
  const tempC = (tempF - 32) * 5/9;
  // Temperature factor
  const tf = Math.log10(tempC + 273) * 2.5 - 0.655;
  const pCa = -Math.log10(calcium / 100000);
  const pAlk = -Math.log10(alkalinity / 1000000 / (6.17e-11 / 6.17e-8));
  const pHs = tf + pCa + (-Math.log10(alkalinity * 1e-6));
  // Simplified LSI
  const lsi = ph - (12.1 - Math.log10(calcium) - Math.log10(alkalinity) + (0.009 * tempF));
  return Math.round(lsi * 100) / 100;
}

// FC effective at pH — chlorine effectiveness % by pH
function fcEffectiveAtPH(ph) {
  const effectiveness = {7.0:73, 7.2:63, 7.4:50, 7.6:37, 7.8:24, 8.0:14, 8.2:9};
  const keys = Object.keys(effectiveness).map(Number).sort((a,b)=>a-b);
  const nearest = keys.reduce((prev,curr) => Math.abs(curr-ph) < Math.abs(prev-ph) ? curr : prev);
  return effectiveness[nearest] || 14;
}

// Recommended SWG % based on FC, CYA, temp, pump hours
function calcTargetSWG(fc, cya, waterTemp, pumpHours) {
  const targetFC = Math.max(3, (cya||60) * 0.075);
  const hours = pumpHours || 8;
  const tempBoost = (waterTemp && waterTemp > 85) ? 1.2 : 1.0;
  // Base: 60% in SC summer, adjusted for pump hours
  const base = Math.round(60 * tempBoost * (8 / hours));
  if (fc > targetFC * 1.5) return Math.max(20, base - 20);
  if (fc < targetFC * 0.5) return Math.min(100, base + 25);
  return Math.min(100, base);
}

function getChemRecommendations(last, readings) {
  if(!last) return [];
  const recs = [];
  const shockMin = calcShockThreshold(last.cya);
  const burnRate = calcFCBurnRate(readings);
  const acidOz = calcAcidDose(last.ph, 7.4, last.alkalinity);
  const lsi = calcLangelier(last.ph, last.alkalinity, CALCIUM_HARDNESS, last.water_temp);
  const targetSWG = calcTargetSWG(last.free_chlorine, last.cya, last.water_temp, last.pump_hours);
  const phEffective = last.ph ? fcEffectiveAtPH(last.ph) : null;

  // pH — always first for SWG pools
  if(last.ph && last.ph > 7.6) {
    const oz = acidOz || "?";
    const effNote = phEffective ? ` At pH ${last.ph} only ${phEffective}% of your chlorine is active.` : "";
    recs.push({ priority:"high", param:"pH", icon:"🧪",
      action:`Add ~${oz} oz muriatic acid`,
      detail:`pH ${last.ph} → target 7.4. Pour slowly in front of return jets with pump running.${effNote} This is your #1 priority — fix pH before adjusting anything else.`,
      color:COLORS.red });
  } else if(last.ph && last.ph < 7.2) {
    recs.push({ priority:"high", param:"pH", icon:"🧪",
      action:"Add soda ash to raise pH",
      detail:`pH ${last.ph} is too low. Add ~12 oz soda ash per 0.2 pH rise per 10,000 gal. Unusual for SWG pools — check for CO2 or acid overdose.`,
      color:COLORS.red });
  }

  // CC — combined chlorine alert
  if(last.cc !== null && last.cc !== undefined && last.cc > 0.5) {
    recs.push({ priority:"high", param:"CC", icon:"⚠️",
      action:`CC elevated at ${last.cc} ppm — raise FC to break point`,
      detail:`Combined chlorine above 0.5 ppm means chloramines present. Raise SWG to 100% until FC reaches ${Math.round((last.cya||60)*0.4)} ppm (breakpoint). This is rare with SWG — check for algae or heavy bather load.`,
      color:COLORS.red });
  }

  // FC shock threshold
  if(last.free_chlorine !== null && last.free_chlorine < shockMin) {
    recs.push({ priority:"high", param:"FC", icon:"⚡",
      action:`FC ${last.free_chlorine} ppm — below minimum. Raise SWG to 90%`,
      detail:`Minimum effective FC with CYA ${last.cya||60} ppm is ${shockMin} ppm (CYA÷10). Chlorine is not protecting your pool. Raise SWG to 90% immediately. If needed in <4 hours, add 1 gallon liquid chlorine as backup.`,
      color:COLORS.red });
  } else if(last.free_chlorine > 8) {
    recs.push({ priority:"med", param:"FC", icon:"🏊",
      action:`FC high at ${last.free_chlorine} ppm — lower SWG to ${Math.max(20,targetSWG-20)}%`,
      detail:`Target FC is 4–5 ppm. Lower SWG output and retest in 48 hours. Safe to swim — FC above 4 ppm is fine.`,
      color:COLORS.amber });
  }

  // SWG % recommendation
  if(last.swg_setting) {
    if(Math.abs(last.swg_setting - targetSWG) > 10) {
      const dir = last.swg_setting > targetSWG ? "lower" : "raise";
      recs.push({ priority:"med", param:"SWG", icon:"⚙️",
        action:`${dir === "lower" ? "Lower" : "Raise"} SWG from ${last.swg_setting}% to ${targetSWG}%`,
        detail:`Based on FC ${last.free_chlorine} ppm, CYA ${last.cya||60} ppm, and ${last.pump_hours||8} pump hours. ${last.pump_hours && last.pump_hours < 10 ? "Running pump overnight (8pm–8am) would improve FC production significantly." : ""}`,
        color:COLORS.amber });
    }
  } else {
    recs.push({ priority:"med", param:"SWG", icon:"⚙️",
      action:`Set SWG to ~${targetSWG}% for current conditions`,
      detail:`Recommended for FC ${last.free_chlorine} ppm, CYA ${last.cya||60} ppm in SC summer. Log your SWG setting each reading to improve this recommendation.`,
      color:COLORS.blue });
  }

  // Pump schedule
  if(!last.pump_hours || last.pump_hours < 8) {
    recs.push({ priority:"med", param:"Pump", icon:"🕐",
      action:"Increase pump run time to 8-10 hrs/day",
      detail:`Less than 8 hrs/day limits SWG chlorine production and circulation. Consider a split schedule — some daytime hours for circulation during swim use, plus 3-4 overnight hours to rebuild FC without UV loss. There's no single correct schedule; match it to when the pool is used and how fast FC drops.`,
      color:COLORS.blue });
  }

  // CYA
  if(last.cya && last.cya < 60) {
    const ozNeeded = Math.round((70-last.cya)*POOL_GALLONS/1000000*10*134);
    recs.push({ priority:"med", param:"CYA", icon:"☀️",
      action:`Add stabilizer — CYA ${last.cya} ppm, target 70–75`,
      detail:`Low CYA means UV burns your chlorine fast. Add ~${ozNeeded} oz (${Math.round(ozNeeded/16)} lbs) cyanuric acid. Dissolve in bucket of warm water first, pour in front of return jet. Retest in 48 hrs.`,
      color:COLORS.amber });
  } else if(last.cya && last.cya > 80) {
    recs.push({ priority:"med", param:"CYA", icon:"☀️",
      action:`CYA ${last.cya} ppm — dilute by draining 15-20%`,
      detail:`Above 80 ppm CYA locks up chlorine. Drain ~2,500 gallons and refill. Do not add more stabilizer.`,
      color:COLORS.amber });
  }

  // Salt
  if(last.salt && last.salt < 3200) {
    const lbsNeeded = Math.round((3400 - last.salt) * POOL_GALLONS / 1000000 * 8.34);
    const bags = Math.ceil(lbsNeeded / 40);
    recs.push({ priority:"med", param:"Salt", icon:"🧂",
      action:`Add ${bags} x 40lb bag${bags!==1?"s":""} of salt`,
      detail:`Salt ${last.salt} ppm is below Pentair IntelliChlor minimum 3200 ppm. Cell efficiency drops and may shut down. Use pool-grade NaCl only.`,
      color:COLORS.amber });
  } else if(last.salt && last.salt > 3800) {
    recs.push({ priority:"med", param:"Salt", icon:"🧂",
      action:`Salt high at ${last.salt} ppm — dilute by draining`,
      detail:`Above 3800 ppm can damage Pentair cell. Drain 10% and refill with fresh water.`,
      color:COLORS.amber });
  }

  // Alkalinity
  if(last.alkalinity && last.alkalinity < 80) {
    const ozNeeded = Math.round((100-last.alkalinity)*POOL_GALLONS/1000000*1.5*128);
    recs.push({ priority:"med", param:"TA", icon:"⚗️",
      action:`Add ~${ozNeeded} oz baking soda to raise TA`,
      detail:`TA ${last.alkalinity} ppm is low — pH will be unstable. Add sodium bicarbonate in front of return jets. Low TA is unusual for SWG pools; check for acid overdose.`,
      color:COLORS.amber });
  } else if(last.alkalinity && last.alkalinity > 120) {
    recs.push({ priority:"low", param:"TA", icon:"⚗️",
      action:"TA slightly high — add acid in small doses",
      detail:`TA ${last.alkalinity} ppm. Your pH corrections will naturally lower TA over time. Don't chase TA independently.`,
      color:COLORS.blue });
  }

  // Filter pressure
  if(last.filter_pressure && last.filter_pressure > 20) {
    recs.push({ priority:"med", param:"Filter", icon:"🔧",
      action:`Filter pressure ${last.filter_pressure} psi — clean cartridge`,
      detail:`Pressure above 20 psi indicates dirty filter. Remove cartridge, hose off thoroughly, reinstall. Clean filter improves SWG flow switch reliability.`,
      color:COLORS.amber });
  }

  // Calcium — flag for testing
  recs.push({ priority:"low", param:"Ca", icon:"🔬",
    action:"Test calcium hardness",
    detail:`Using estimated 200 ppm. Vinyl pools target 150-250 ppm. Low calcium is corrosive to your Pentair cell over time.`,
    color:COLORS.slate });

  // LSI
  if(lsi !== null) {
    const lsiStatus = lsi < -0.3 ? "corrosive" : lsi > 0.3 ? "scaling" : "balanced";
    if(lsiStatus !== "balanced") {
      recs.push({ priority:"low", param:"LSI", icon:"📊",
        action:`LSI ${lsi} — water is ${lsiStatus}`,
        detail:`${lsiStatus==="corrosive"?"Slightly corrosive water — monitor vinyl and equipment.":"Scaling tendency — watch for cloudiness or equipment deposits."} Adjust pH to 7.4 first.`,
        color:COLORS.amber });
    }
  }

  // Burn rate
  if(burnRate) {
    const dailyDrop = parseFloat(burnRate.perDay);
    if(dailyDrop < -0.8) {
      recs.push({ priority:"low", param:"FC", icon:"📉",
        action:`FC dropping ${Math.abs(dailyDrop)} ppm/day — high demand`,
        detail:`Lost ${Math.abs(burnRate.from-burnRate.to).toFixed(1)} ppm over ${burnRate.days} days. SC summer heat and UV are likely cause. Consider overnight pump schedule and CYA at 70-75 ppm.`,
        color:COLORS.slate });
    }
  }

  return recs;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S={
  app:{background:COLORS.navy,minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"'Inter',system-ui,sans-serif",color:COLORS.white,position:"relative",paddingBottom:84},
  header:{background:COLORS.navyMid,padding:"16px 20px 12px",borderBottom:`1px solid ${COLORS.navyLight}`,position:"sticky",top:0,zIndex:10},
  headerRow:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  logo:{fontSize:18,fontWeight:700,letterSpacing:"-0.5px"},
  logoAccent:{color:COLORS.blue},
  dateLabel:{fontSize:12,color:COLORS.slate,marginTop:2},
  screen:{padding:"20px 16px"},
  sectionLabel:{fontSize:10,fontWeight:700,letterSpacing:"1.2px",color:COLORS.slate,textTransform:"uppercase",marginBottom:10,marginTop:24},
  card:{background:COLORS.navyMid,borderRadius:12,padding:"14px 16px",marginBottom:10,border:`1px solid ${COLORS.navyLight}`},
  statusCard:(c)=>({background:COLORS.navyMid,borderRadius:12,padding:"14px 16px",marginBottom:10,border:`1px solid ${COLORS.navyLight}`,borderLeft:`3px solid ${c}`}),
  badge:(c)=>({display:"inline-block",background:c+"22",color:c,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600}),
  memberDot:(m)=>({display:"inline-block",width:8,height:8,borderRadius:"50%",background:MEMBER_COLORS[m]||COLORS.slate,marginRight:6}),
  btn:{background:COLORS.blue,color:"#fff",border:"none",borderRadius:8,padding:"11px 18px",fontSize:14,fontWeight:600,cursor:"pointer",width:"100%",marginTop:12},
  btnSm:{background:COLORS.navyLight,color:COLORS.slateLight,border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0},
  btnGreen:{background:COLORS.green+"22",color:COLORS.green,border:`1px solid ${COLORS.green}44`,borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0},
  btnRed:{background:COLORS.red+"22",color:COLORS.red,border:`1px solid ${COLORS.red}44`,borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0},
  btnAmber:{background:COLORS.amber+"22",color:COLORS.amber,border:`1px solid ${COLORS.amber}44`,borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0},
  input:{background:COLORS.navyLight,border:`1px solid ${COLORS.navyLight}`,borderRadius:8,padding:"10px 12px",fontSize:14,color:COLORS.white,width:"100%",boxSizing:"border-box",outline:"none",marginBottom:10},
  label:{fontSize:11,color:COLORS.slate,marginBottom:4,display:"block",fontWeight:600},
  row:{display:"flex",gap:10},col:{flex:1},
  statGrid:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8},
  statCell:(c)=>({background:COLORS.navyMid,border:`1px solid ${COLORS.navyLight}`,borderTop:`3px solid ${c}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}),
  statVal:{fontSize:17,fontWeight:700},statLbl:{fontSize:10,color:COLORS.slate,marginTop:2},statTarget:{fontSize:9,color:COLORS.slate,marginTop:1},
  nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:COLORS.navyMid,borderTop:`1px solid ${COLORS.navyLight}`,display:"flex",zIndex:20,paddingBottom:"env(safe-area-inset-bottom)"},
  navItem:(a)=>({flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 0 8px",cursor:"pointer",background:"transparent",border:"none",color:a?COLORS.blue:COLORS.slate,fontSize:10,fontWeight:a?700:500,gap:4}),
  modal:{position:"fixed",inset:0,background:"#000b",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"},
  sheet:{background:COLORS.navyMid,borderRadius:"16px 16px 0 0",padding:"20px 20px 48px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto"},
  sheetTitle:{fontSize:17,fontWeight:700,marginBottom:18},
  chip:(a,c)=>({display:"inline-block",padding:"4px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${a?c:COLORS.navyLight}`,background:a?c+"22":"transparent",color:a?c:COLORS.slate,marginRight:6,marginBottom:6}),
  tabs:{display:"flex",background:COLORS.navyMid,borderRadius:10,padding:3,marginBottom:16,border:`1px solid ${COLORS.navyLight}`},
  tabBtn:(a)=>({flex:1,border:"none",borderRadius:8,padding:"8px 0",cursor:"pointer",background:a?COLORS.blue:"transparent",color:a?"#fff":COLORS.slate,fontSize:12,fontWeight:700,textTransform:"capitalize",transition:"all 0.15s"}),
  empty:{textAlign:"center",padding:"40px 20px",color:COLORS.slate,fontSize:14},
  progress:{height:3,background:COLORS.navyLight,borderRadius:2,marginTop:8,overflow:"hidden"},
  progressFill:(pct,c)=>({height:"100%",width:`${Math.min(100,Math.max(0,pct))}%`,background:c,borderRadius:2}),
  gcBanner:{background:COLORS.blue+"18",border:`1px solid ${COLORS.blue}44`,borderRadius:12,padding:"14px 16px",marginBottom:16},
  swipeHint:{fontSize:10,color:COLORS.slate,textAlign:"center",marginBottom:8,letterSpacing:"0.5px"},
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const I={
  home:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  cal:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  college:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  house:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  pool:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="10"/></svg>,
  close:()=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  refresh:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 11-2.8-6.4L23 10"/></svg>,
  google:()=><svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>,
};

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({data,color}){
  if(!data||data.length<2)return null;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1,W=64,H=24;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*W},${H-((v-min)/range)*H}`).join(" ");
  return <svg width={W} height={H}><polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

// ─── SWIPE CARD ───────────────────────────────────────────────────────────────
// Swipe left to reveal Edit + Delete actions. Tap anywhere else to close.
function SwipeCard({children, onEdit, onDelete, style={}, activeId, setActiveId, id}){
  const ref      = useRef(null);
  const startX   = useRef(null);
  const isOpen   = activeId === id;
  const THRESHOLD = 60;
  const REVEAL    = 130;

  function onTouchStart(e){ startX.current = e.touches[0].clientX; }
  function onTouchEnd(e){
    if(startX.current===null)return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if(dx < -THRESHOLD) setActiveId(id);
    else if(dx > THRESHOLD) setActiveId(null);
    startX.current=null;
  }

  return (
    <div style={{position:"relative",marginBottom:10,borderRadius:12,overflow:"hidden"}}>
      {/* Action buttons behind the card */}
      <div style={{position:"absolute",right:0,top:0,bottom:0,display:"flex",alignItems:"stretch",borderRadius:"0 12px 12px 0"}}>
        <button onClick={onEdit} style={{width:65,background:COLORS.amber,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3}}>
          <span style={{fontSize:16}}>✏️</span>Edit
        </button>
        <button onClick={onDelete} style={{width:65,background:COLORS.red,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,borderRadius:"0 12px 12px 0"}}>
          <span style={{fontSize:16}}>🗑️</span>Delete
        </button>
      </div>
      {/* Card face — slides left */}
      <div
        ref={ref}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          ...style,
          transform:`translateX(${isOpen?-REVEAL:0}px)`,
          transition:"transform 0.25s ease",
          position:"relative",
          zIndex:1,
          touchAction:"pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({title,onClose,children}){
  return(
    <div style={S.modal} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={S.sheet}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={S.sheetTitle}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:COLORS.slate,cursor:"pointer",padding:4}}>{I.close()}</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Loading(){return <div style={S.empty}>Loading…</div>;}

// ─── DATA HOOK ────────────────────────────────────────────────────────────────
function useTable(table,orderCol,orderAsc=false){
  const [data,setData]       = useState(null);
  const [loading,setLoading] = useState(true);
  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const{data:rows,error}=await sb.from(table).order(orderCol,{ascending:orderAsc}).select();
      if(!error)setData(rows);else setData(SEED[table]||[]);
    }catch{setData(SEED[table]||[]);}
    setLoading(false);
  },[table,orderCol,orderAsc]);
  useEffect(()=>{load();},[load]);

  async function insert(row){
    try{const{data:r,error}=await sb.from(table).insert(row);if(!error)await load();else setData(p=>[{...row,id:String(Date.now())},...(p||[])]);return r;}
    catch{setData(p=>[{...row,id:String(Date.now())},...(p||[])]);}
  }
  async function update(id,row){
    try{await sb.from(table).eq("id",id).update(row);await load();}
    catch{setData(p=>p.map(r=>r.id===id?{...r,...row}:r));}
  }
  async function remove(id){
    try{await sb.from(table).eq("id",id).delete();await load();}
    catch{setData(p=>p.filter(r=>r.id!==id));}
  }
  return{data:data||[],loading,reload:load,insert,update,remove};
}

// ─── CALENDAR BANNER ─────────────────────────────────────────────────────────
function CalendarBanner({gc}){
  if(gc.token)return(
    <div style={S.gcBanner}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:COLORS.blue,marginBottom:2}}>✓ Google Calendar connected</div>
          <div style={{fontSize:11,color:COLORS.slate}}>{gc.events.length} events loaded · {gc.loading?"Refreshing…":"Up to date"}</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button style={S.btnSm} onClick={gc.refresh}>{I.refresh()} Sync</button>
          <button style={S.btnRed} onClick={gc.signOut}>Disconnect</button>
        </div>
      </div>
    </div>
  );
  return(
    <div style={S.gcBanner}>
      <div style={{fontSize:13,fontWeight:700,color:COLORS.blue,marginBottom:4}}>Connect Google Calendar</div>
      <div style={{fontSize:12,color:COLORS.slateLight,marginBottom:12,lineHeight:1.5}}>Sign in with Google to load your real family events automatically.</div>
      {gc.error&&<div style={{fontSize:11,color:COLORS.red,marginBottom:8}}>{gc.error}</div>}
      <button onClick={gc.signIn} style={{...S.btn,marginTop:0,display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:COLORS.white,color:COLORS.navy}}>
        {I.google()} Sign in with Google
      </button>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({onNavigate,gc}){
  const{data:poolReadings}=useTable("pool_readings","date");
  const{data:homeMaint}   =useTable("home_maintenance","title",true);
  const{data:deadlines}   =useTable("college_deadlines","due_date",true);

  const lastReading     =poolReadings[0];
  const daysSincePool   =lastReading?daysAgo(lastReading.date):999;
  const overdueItems    =homeMaint.filter(m=>maintStatus(m)==="overdue");
  const urgentDeadlines =deadlines.filter(d=>!d.completed&&daysBetween(d.due_date)<=14);
  const calEvents       =gc.token?gc.events:[];
  const thisWeek        =calEvents.filter(e=>{const d=daysBetween(e.date);return d>=0&&d<=6;});
  const todayEvts       =thisWeek.filter(e=>e.date===TODAY_STR);
  const upcoming        =thisWeek.filter(e=>e.date!==TODAY_STR);

  const attention=[];
  if(!gc.token)attention.push({color:COLORS.blue,icon:"📅",text:"Google Calendar not connected",action:"Connect",tab:"schedule"});
  if(daysSincePool>=4)attention.push({color:COLORS.amber,icon:"🏊",text:`Pool not logged in ${daysSincePool} days`,action:"Log Now",tab:"pool"});
  overdueItems.forEach(m=>{
    const days=-daysBetween(nextDueDate(m.last_completed,m.interval_days));
    attention.push({color:COLORS.red,icon:"🏡",text:`${m.title} overdue by ${days} days`,action:"View",tab:"home-mgmt"});
  });
  urgentDeadlines.forEach(d=>{
    const days=daysBetween(d.due_date);
    attention.push({color:days<=4?COLORS.red:COLORS.amber,icon:"🎓",text:`${d.title} — ${days===0?"Today":days<0?`${-days}d overdue`:`${days}d`}`,action:"View",tab:"college"});
  });

  return(
    <div style={S.screen}>
      <div style={{...S.card,background:COLORS.navyLight,borderColor:COLORS.blue+"44"}}>
        <div style={{fontSize:11,color:COLORS.blue,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:6}}>{formatToday()}</div>
        <div style={{fontSize:20,fontWeight:700,lineHeight:1.2}}>{attention.length} item{attention.length!==1?"s":""} need your attention</div>
        <div style={{fontSize:13,color:COLORS.slate,marginTop:4}}>{thisWeek.length} events this week · {urgentDeadlines.length} deadline{urgentDeadlines.length!==1?"s":""} approaching</div>
      </div>

      {attention.length>0&&<>
        <div style={S.sectionLabel}>Needs Attention</div>
        {attention.map((a,i)=>(
          <div key={i} style={S.statusCard(a.color)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,fontWeight:600,flex:1,paddingRight:10}}>{a.icon} {a.text}</div>
              <button style={S.btnSm} onClick={()=>onNavigate(a.tab)}>{a.action} →</button>
            </div>
          </div>
        ))}
      </>}

      {todayEvts.length>0&&<>
        <div style={S.sectionLabel}>Today</div>
        {todayEvts.map(e=>(
          <div key={e.id} style={{...S.card,borderLeft:`3px solid ${MEMBER_COLORS[e.member]||COLORS.slate}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><span style={S.memberDot(e.member)}/><span style={{fontSize:14,fontWeight:600}}>{e.title}</span>
                <div style={{fontSize:12,color:COLORS.slate,marginTop:2}}>{e.time||"All day"}{e.location?` · ${e.location}`:""}</div>
              </div>
              <span style={S.badge(MEMBER_COLORS[e.member]||COLORS.slate)}>{e.member}</span>
            </div>
          </div>
        ))}
      </>}

      {upcoming.length>0&&<>
        <div style={S.sectionLabel}>This Week</div>
        {upcoming.map(e=>(
          <div key={e.id} style={{...S.card,borderLeft:`3px solid ${MEMBER_COLORS[e.member]||COLORS.slate}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><span style={S.memberDot(e.member)}/><span style={{fontSize:14,fontWeight:600}}>{e.title}</span>
                <div style={{fontSize:12,color:COLORS.slate,marginTop:2}}>{formatDateFull(e.date)}{e.time?` · ${e.time}`:""}</div>
              </div>
              <span style={S.badge(MEMBER_COLORS[e.member]||COLORS.slate)}>{e.member}</span>
            </div>
          </div>
        ))}
      </>}

      {lastReading&&<>
        <div style={S.sectionLabel}>Pool — Last Reading {formatDate(lastReading.date)}</div>
        <div style={S.statGrid}>
          {[{k:"ph",l:"pH"},{k:"free_chlorine",l:"Cl"},{k:"salt",l:"Salt"}].map(({k,l})=>{
            const s=poolStatus(k,lastReading[k]);
            return(<div key={k} style={S.statCell(statusColor(s))}><div style={S.statVal}>{lastReading[k]}</div><div style={S.statLbl}>{l}</div></div>);
          })}
        </div>
      </>}
    </div>
  );
}

// ─── SCHEDULE ─────────────────────────────────────────────────────────────────
function Schedule({gc}){
  const [filter,setFilter]   = useState("All");
  const [overrides,setOverrides] = useState({});
  const [reassigning,setReassigning] = useState(null);
  const members=["All","Aubrey","Blake","Brayden","Matt","Kalee"];
  const days=Array.from({length:30},(_,i)=>{const d=new Date(todayReal);d.setDate(d.getDate()+i);return d.toISOString().split("T")[0];});
  const allEvents=(gc.token?gc.events:[]).map(e=>({...e,member:overrides[e.id]||e.member}));
  const filtered=allEvents.filter(e=>filter==="All"||e.member===filter);

  return(
    <div style={S.screen}>
      <CalendarBanner gc={gc}/>
      {gc.token&&<>
        <div style={{marginBottom:16}}>
          {members.map(m=><span key={m} style={S.chip(filter===m,MEMBER_COLORS[m]||COLORS.blue)} onClick={()=>setFilter(m)}>{m}</span>)}
        </div>
        {gc.loading&&<Loading/>}
        {!gc.loading&&days.map(day=>{
          const evs=filtered.filter(e=>e.date===day);
          if(!evs.length)return null;
          const isToday=day===TODAY_STR;
          return(
            <div key={day}>
              <div style={{...S.sectionLabel,color:isToday?COLORS.blue:COLORS.slate}}>{isToday?"Today":formatDateFull(day)}</div>
              {evs.map(e=>(
                <div key={e.id} style={{...S.card,borderLeft:`3px solid ${MEMBER_COLORS[e.member]||COLORS.slate}`,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:600}}>{e.title}</div>
                      <div style={{fontSize:12,color:COLORS.slate,marginTop:3}}>{e.time||"All day"}{e.location?` · ${e.location}`:""}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                      <span style={S.badge(MEMBER_COLORS[e.member]||COLORS.slate)}>{e.member}</span>
                      <button style={{...S.btnSm,fontSize:10,padding:"3px 8px"}} onClick={()=>setReassigning(reassigning===e.id?null:e.id)}>reassign</button>
                    </div>
                  </div>
                  {reassigning===e.id&&(
                    <div style={{marginTop:10,display:"flex",flexWrap:"wrap",gap:6}}>
                      {["Aubrey","Blake","Brayden","Matt","Kalee"].map(m=>(
                        <span key={m} style={S.chip(e.member===m,MEMBER_COLORS[m])} onClick={()=>{setOverrides(p=>({...p,[e.id]:m}));setReassigning(null);}}>{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
        {!gc.loading&&filtered.length===0&&<div style={S.empty}>No events found for the next 30 days.</div>}
      </>}
    </div>
  );
}

// ─── COLLEGE ──────────────────────────────────────────────────────────────────
function College(){
  const [tab,setTab]             = useState("deadlines");
  const deadlines                = useTable("college_deadlines","due_date",true);
  const schools                  = useTable("college_schools","name",true);
  const scores                   = useTable("sat_scores","date");
  const testPlan                 = useTable("college_test_plan","target_date",true);
  const [showModal,setShowModal] = useState(null);
  const [editItem,setEditItem]   = useState(null);
  const [form,setForm]           = useState({});
  const [activeSwipe,setActiveSwipe] = useState(null);

  const catColor={test:COLORS.purple,application:COLORS.blue,visit:COLORS.green,other:COLORS.slate};
  const statusColors={researching:COLORS.slate,target:COLORS.blue,applying:COLORS.amber,applied:COLORS.purple,accepted:COLORS.green,rejected:COLORS.red};
  const appTypeColors={ED:COLORS.red,EA:COLORS.amber,Regular:COLORS.blue,Rolling:COLORS.slate};
  const matchColors={Reach:COLORS.red,Target:COLORS.blue,Safety:COLORS.green};
  const pending=deadlines.data.filter(d=>!d.completed).sort((a,b)=>new Date(a.due_date)-new Date(b.due_date));
  const done=deadlines.data.filter(d=>d.completed);

  function openEdit(modal,item){
    setEditItem(item);
    setForm(item);
    setShowModal(modal);
    setActiveSwipe(null);
  }
  function closeModal(){setShowModal(null);setEditItem(null);setForm({});}

  async function saveDeadline(){
    if(!form.title||!form.due_date)return;
    if(editItem) await deadlines.update(editItem.id,{title:form.title,due_date:form.due_date,school:form.school||"",category:form.category||"other"});
    else await deadlines.insert({title:form.title,due_date:form.due_date,school:form.school||"",category:form.category||"other",completed:false});
    closeModal();
  }
  async function saveSchool(){
    if(!form.name)return;
    const row={
      name:form.name, status:form.status||"researching",
      app_deadline:form.app_deadline||null, app_type:form.app_type||"Regular",
      match_level:form.match_level||"Target", visit_notes:form.visit_notes||""
    };
    if(editItem) await schools.update(editItem.id,row);
    else await schools.insert(row);
    closeModal();
  }
  async function saveScore(){
    if(!form.date||!form.total)return;
    if(editItem) await scores.update(editItem.id,{date:form.date,total:+form.total,math:+form.math||0,verbal:+form.verbal||0,notes:form.notes||""});
    else await scores.insert({date:form.date,total:+form.total,math:+form.math||0,verbal:+form.verbal||0,notes:form.notes||""});
    closeModal();
  }
  async function saveTestPlan(){
    if(!form.test_type||!form.target_date)return;
    const row={test_type:form.test_type,target_date:form.target_date,target_score:form.target_score||"",attempt_number:form.attempt_number||1,registered:form.registered||false,notes:form.notes||""};
    if(editItem) await testPlan.update(editItem.id,row);
    else await testPlan.insert(row);
    closeModal();
  }

  return(
    <div style={S.screen}>
      <div style={{...S.card,background:COLORS.navyLight,borderLeft:`3px solid ${MEMBER_COLORS.Aubrey}`,marginBottom:16}}>
        <div style={{fontSize:11,color:COLORS.red,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase"}}>Aubrey · Class of 2028</div>
        <div style={{fontSize:16,fontWeight:700,marginTop:2}}>Junior Year — College Planning</div>
        <div style={{fontSize:12,color:COLORS.slate,marginTop:4}}>{schools.data.filter(s=>s.status==="target"||s.status==="applying").length} target schools · {pending.length} open deadlines</div>
      </div>

      <div style={S.tabs}>
        {["deadlines","schools","tests","scores"].map(t=><button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {tab==="deadlines"&&<>
        {deadlines.loading?<Loading/>:<>
          <div style={S.swipeHint}>← swipe left to edit or delete</div>
          {pending.map(d=>{
            const days=daysBetween(d.due_date);
            return(
              <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                onEdit={()=>openEdit("deadline",d)}
                onDelete={()=>{if(window.confirm("Delete this deadline?"))deadlines.remove(d.id);setActiveSwipe(null);}}
                style={S.statusCard(days<=7?COLORS.red:days<=14?COLORS.amber:COLORS.blue)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,paddingRight:10}}>
                    <div style={{fontSize:13,fontWeight:600}}>{d.title}</div>
                    {d.school&&<div style={{fontSize:11,color:COLORS.slate,marginTop:2}}>{d.school}</div>}
                    <div style={{display:"flex",gap:6,marginTop:6,alignItems:"center"}}>
                      <span style={S.badge(catColor[d.category]||COLORS.slate)}>{d.category}</span>
                      <span style={{fontSize:11,color:days<=7?COLORS.red:COLORS.slate,fontWeight:600}}>{days===0?"Today":days<0?`${-days}d overdue`:`${days}d`}</span>
                    </div>
                  </div>
                  <button style={S.btnGreen} onClick={()=>deadlines.update(d.id,{completed:true})}>Done ✓</button>
                </div>
              </SwipeCard>
            );
          })}
          {done.length>0&&<>
            <div style={{...S.sectionLabel,marginTop:20}}>Completed</div>
            {done.map(d=>(
              <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                onEdit={()=>openEdit("deadline",d)}
                onDelete={()=>{if(window.confirm("Delete?"))deadlines.remove(d.id);setActiveSwipe(null);}}
                style={{...S.card,opacity:0.5}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:13,textDecoration:"line-through",color:COLORS.slate}}>{d.title}</div>
                  <button style={S.btnSm} onClick={()=>deadlines.update(d.id,{completed:false})}>Undo</button>
                </div>
              </SwipeCard>
            ))}
          </>}
          <button style={S.btn} onClick={()=>{setForm({category:"test"});setShowModal("deadline");}}>+ Add Deadline</button>
        </>}
      </>}

      {tab==="schools"&&<>
        {schools.loading?<Loading/>:<>
          <div style={S.swipeHint}>← swipe left to edit or delete</div>
          {["target","researching","applying","applied","accepted","rejected"].map(status=>{
            const group=schools.data.filter(s=>s.status===status);
            if(!group.length)return null;
            return(
              <div key={status}>
                <div style={S.sectionLabel}>{status.charAt(0).toUpperCase()+status.slice(1)}</div>
                {group.map(s=>(
                  <SwipeCard key={s.id} id={s.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                    onEdit={()=>openEdit("school",s)}
                    onDelete={()=>{if(window.confirm("Remove this school?"))schools.remove(s.id);setActiveSwipe(null);}}
                    style={S.statusCard(statusColors[s.status])}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:14,fontWeight:600}}>{s.name}</div>
                      <select value={s.status} onChange={e=>schools.update(s.id,{status:e.target.value})}
                        style={{background:COLORS.navyLight,color:COLORS.slateLight,border:"none",borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer"}}>
                        {["researching","target","applying","applied","accepted","rejected"].map(st=><option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                    <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
                      {s.match_level&&<span style={S.badge(matchColors[s.match_level]||COLORS.slate)}>{s.match_level}</span>}
                      {s.app_type&&<span style={S.badge(appTypeColors[s.app_type]||COLORS.slate)}>{s.app_type}</span>}
                      {s.app_deadline&&<span style={{fontSize:11,color:COLORS.slate}}>Due {formatDate(s.app_deadline)}</span>}
                    </div>
                    {s.visit_notes&&<div style={{fontSize:11,color:COLORS.slateLight,marginTop:6,fontStyle:"italic",lineHeight:1.4}}>📝 {s.visit_notes}</div>}
                  </SwipeCard>
                ))}
              </div>
            );
          })}
          <button style={S.btn} onClick={()=>{setForm({status:"researching",app_type:"Regular",match_level:"Target"});setShowModal("school");}}>+ Add School</button>
        </>}
      </>}

      {tab==="tests"&&<>
        {testPlan.loading?<Loading/>:<>
          <div style={{fontSize:12,color:COLORS.slate,marginBottom:12,lineHeight:1.5}}>Plan upcoming SAT/ACT attempts — registration deadlines and target scores.</div>
          <div style={S.swipeHint}>← swipe left to edit or delete</div>
          {testPlan.data.map(t=>{
            const days=daysBetween(t.target_date);
            return(
              <SwipeCard key={t.id} id={t.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                onEdit={()=>openEdit("test",t)}
                onDelete={()=>{if(window.confirm("Delete this test plan?"))testPlan.remove(t.id);setActiveSwipe(null);}}
                style={S.statusCard(days<=14?COLORS.amber:COLORS.blue)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600}}>{t.test_type} — Attempt {t.attempt_number}</div>
                    <div style={{fontSize:12,color:COLORS.slate,marginTop:2}}>{formatDate(t.target_date)} · {days<0?"Past":`${days}d away`}{t.target_score?` · Target: ${t.target_score}`:""}</div>
                    {t.notes&&<div style={{fontSize:11,color:COLORS.slate,marginTop:4,fontStyle:"italic"}}>{t.notes}</div>}
                  </div>
                  <span style={S.badge(t.registered?COLORS.green:COLORS.amber)}>{t.registered?"Registered":"Not registered"}</span>
                </div>
              </SwipeCard>
            );
          })}
          <button style={S.btn} onClick={()=>{setForm({test_type:"SAT",attempt_number:1,registered:false});setShowModal("test");}}>+ Add Test Plan</button>
        </>}
      </>}

      {tab==="scores"&&<>
        {scores.loading?<Loading/>:<>
          {scores.data.length>0&&(
            <div style={{...S.card,background:COLORS.navyLight,textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:36,fontWeight:800}}>{scores.data[0].total}</div>
              <div style={{fontSize:12,color:COLORS.slate}}>Most Recent · {formatDate(scores.data[0].date)}</div>
              <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:12}}>
                <div><div style={{fontSize:20,fontWeight:700}}>{scores.data[0].math}</div><div style={{fontSize:11,color:COLORS.slate}}>Math</div></div>
                <div style={{width:1,background:COLORS.navyLight}}/>
                <div><div style={{fontSize:20,fontWeight:700}}>{scores.data[0].verbal}</div><div style={{fontSize:11,color:COLORS.slate}}>Verbal</div></div>
              </div>
            </div>
          )}
          <div style={S.swipeHint}>← swipe left to edit or delete</div>
          {scores.data.map(s=>(
            <SwipeCard key={s.id} id={s.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
              onEdit={()=>openEdit("score",s)}
              onDelete={()=>{if(window.confirm("Delete this score?"))scores.remove(s.id);setActiveSwipe(null);}}
              style={S.card}>
              <div style={{fontSize:15,fontWeight:700}}>{s.total} <span style={{fontSize:11,color:COLORS.slate}}>({s.math}M / {s.verbal}V)</span></div>
              <div style={{fontSize:12,color:COLORS.slate,marginTop:2}}>{formatDate(s.date)}{s.notes?` · ${s.notes}`:""}</div>
            </SwipeCard>
          ))}
          <button style={S.btn} onClick={()=>{setForm({});setShowModal("score");}}>+ Log Score</button>
        </>}
      </>}

      {showModal==="deadline"&&<Modal title={editItem?"Edit Deadline":"Add Deadline"} onClose={closeModal}>
        <label style={S.label}>Title</label>
        <input style={S.input} placeholder="e.g. Common App Essay Draft" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
        <label style={S.label}>Due Date</label>
        <input type="date" style={S.input} value={form.due_date||""} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>
        <label style={S.label}>School (optional)</label>
        <input style={S.input} placeholder="e.g. University of Virginia" value={form.school||""} onChange={e=>setForm(p=>({...p,school:e.target.value}))}/>
        <label style={S.label}>Category</label>
        <div>{["test","application","visit","other"].map(c=><span key={c} style={S.chip(form.category===c,catColor[c])} onClick={()=>setForm(p=>({...p,category:c}))}>{c}</span>)}</div>
        <button style={{...S.btn,marginTop:16}} onClick={saveDeadline}>{editItem?"Save Changes":"Add Deadline"}</button>
      </Modal>}

      {showModal==="school"&&<Modal title={editItem?"Edit School":"Add School"} onClose={closeModal}>
        <label style={S.label}>School Name</label>
        <input style={S.input} placeholder="e.g. University of Virginia" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
        <label style={S.label}>Status</label>
        <div>{["researching","target","applying","applied","accepted","rejected"].map(s=><span key={s} style={S.chip(form.status===s,statusColors[s])} onClick={()=>setForm(p=>({...p,status:s}))}>{s}</span>)}</div>
        <label style={{...S.label,marginTop:10}}>Match Level</label>
        <div>{["Reach","Target","Safety"].map(m=><span key={m} style={S.chip(form.match_level===m,matchColors[m])} onClick={()=>setForm(p=>({...p,match_level:m}))}>{m}</span>)}</div>
        <label style={{...S.label,marginTop:10}}>Application Type</label>
        <div>{["ED","EA","Regular","Rolling"].map(t=><span key={t} style={S.chip(form.app_type===t,appTypeColors[t])} onClick={()=>setForm(p=>({...p,app_type:t}))}>{t}</span>)}</div>
        <label style={S.label}>Application Deadline</label>
        <input type="date" style={S.input} value={form.app_deadline||""} onChange={e=>setForm(p=>({...p,app_deadline:e.target.value}))}/>
        <label style={S.label}>Visit Notes (optional)</label>
        <input style={S.input} placeholder="e.g. Loved the campus, felt right size" value={form.visit_notes||""} onChange={e=>setForm(p=>({...p,visit_notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveSchool}>{editItem?"Save Changes":"Add School"}</button>
      </Modal>}

      {showModal==="test"&&<Modal title={editItem?"Edit Test Plan":"Add Test Plan"} onClose={closeModal}>
        <label style={S.label}>Test Type</label>
        <div>{["SAT","ACT","PSAT"].map(t=><span key={t} style={S.chip(form.test_type===t,COLORS.purple)} onClick={()=>setForm(p=>({...p,test_type:t}))}>{t}</span>)}</div>
        <label style={S.label}>Target Test Date</label>
        <input type="date" style={S.input} value={form.target_date||""} onChange={e=>setForm(p=>({...p,target_date:e.target.value}))}/>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Attempt #</label><input type="number" style={S.input} placeholder="1" value={form.attempt_number||""} onChange={e=>setForm(p=>({...p,attempt_number:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Target Score</label><input style={S.input} placeholder="e.g. 1400" value={form.target_score||""} onChange={e=>setForm(p=>({...p,target_score:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Registration Status</label>
        <div>
          <span style={S.chip(form.registered===true,COLORS.green)} onClick={()=>setForm(p=>({...p,registered:true}))}>Registered</span>
          <span style={S.chip(form.registered===false,COLORS.amber)} onClick={()=>setForm(p=>({...p,registered:false}))}>Not yet</span>
        </div>
        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="Optional" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveTestPlan}>{editItem?"Save Changes":"Add Test Plan"}</button>
      </Modal>}

      {showModal==="score"&&<Modal title={editItem?"Edit Score":"Log SAT Score"} onClose={closeModal}>
        <label style={S.label}>Date</label>
        <input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Math</label><input type="number" style={S.input} placeholder="200–800" value={form.math||""} onChange={e=>setForm(p=>({...p,math:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Verbal</label><input type="number" style={S.input} placeholder="200–800" value={form.verbal||""} onChange={e=>setForm(p=>({...p,verbal:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Total</label>
        <input type="number" style={S.input} placeholder="400–1600" value={form.total||""} onChange={e=>setForm(p=>({...p,total:e.target.value}))}/>
        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="e.g. Official test" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveScore}>{editItem?"Save Changes":"Log Score"}</button>
      </Modal>}
    </div>
  );
}

// ─── HOME MAINTENANCE ─────────────────────────────────────────────────────────
function HomeMgmt(){
  const maint                    = useTable("home_maintenance","title",true);
  const [showModal,setShowModal] = useState(false);
  const [editItem,setEditItem]   = useState(null);
  const [form,setForm]           = useState({});
  const [activeSwipe,setActiveSwipe] = useState(null);

  function openEdit(item){setEditItem(item);setForm(item);setShowModal(true);setActiveSwipe(null);}
  function closeModal(){setShowModal(false);setEditItem(null);setForm({});}

  async function markDone(item){await maint.update(item.id,{last_completed:TODAY_STR});}
  async function save(){
    if(!form.title||!form.interval_days)return;
    const row={title:form.title,last_completed:form.last_completed||TODAY_STR,interval_days:+form.interval_days,notes:form.notes||""};
    if(editItem) await maint.update(editItem.id,row);
    else await maint.insert(row);
    closeModal();
  }

  const sorted=[...maint.data].sort((a,b)=>{
    const o={overdue:0,"due-soon":1,ok:2};
    return o[maintStatus(a)]-o[maintStatus(b)];
  });

  return(
    <div style={S.screen}>
      {maint.loading?<Loading/>:<>
        <div style={S.sectionLabel}>Maintenance Schedule</div>
        <div style={S.swipeHint}>← swipe left to edit or delete</div>
        {sorted.map(item=>{
          const st=maintStatus(item);
          const color=maintColor(st);
          const nd=nextDueDate(item.last_completed,item.interval_days);
          const days=daysBetween(nd);
          const pct=Math.max(0,100-(days/item.interval_days)*100);
          return(
            <SwipeCard key={item.id} id={item.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
              onEdit={()=>openEdit(item)}
              onDelete={()=>{if(window.confirm("Delete this item?"))maint.remove(item.id);setActiveSwipe(null);}}
              style={S.statusCard(color)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600}}>{item.title}</div>
                  <div style={{fontSize:12,color:COLORS.slate,marginTop:2}}>
                    {st==="overdue"?`Overdue by ${-days}d`:st==="due-soon"?`Due in ${days}d`:`Due ${formatDate(nd)}`}
                    {item.notes?` · ${item.notes}`:""}
                  </div>
                  <div style={S.progress}><div style={S.progressFill(pct,color)}/></div>
                </div>
                <button style={{...S.btnGreen,marginLeft:12}} onClick={()=>markDone(item)}>Done ✓</button>
              </div>
            </SwipeCard>
          );
        })}
        {sorted.length===0&&<div style={S.empty}>No maintenance items yet.</div>}
        <button style={S.btn} onClick={()=>{setForm({});setShowModal(true);}}>+ Add Item</button>
      </>}

      {showModal&&<Modal title={editItem?"Edit Item":"Add Maintenance Item"} onClose={closeModal}>
        <label style={S.label}>Item Name</label>
        <input style={S.input} placeholder="e.g. HVAC Filter" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
        <label style={S.label}>Interval</label>
        <div style={{marginBottom:8}}>
          {[14,30,60,90,180,365].map(d=><span key={d} style={S.chip(+form.interval_days===d,COLORS.blue)} onClick={()=>setForm(p=>({...p,interval_days:d}))}>{d}d</span>)}
        </div>
        <input type="number" style={S.input} placeholder="Or enter custom days" value={form.interval_days||""} onChange={e=>setForm(p=>({...p,interval_days:e.target.value}))}/>
        <label style={S.label}>Last Completed</label>
        <input type="date" style={S.input} value={form.last_completed||""} onChange={e=>setForm(p=>({...p,last_completed:e.target.value}))}/>
        <label style={S.label}>Notes (optional)</label>
        <input style={S.input} placeholder="e.g. 16x25x1, check Grainger" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:8}} onClick={save}>{editItem?"Save Changes":"Add Item"}</button>
      </Modal>}
    </div>
  );
}

// ─── AI POOL BRIEF ───────────────────────────────────────────────────────────
function PoolBrief({readings, maintLog, onClose}) {
  const [brief, setBrief]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [history, setHistory] = useState([]);
  const [viewingHistory, setViewingHistory] = useState(null);

  useEffect(() => {
    // Load saved brief history from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem("poolBriefHistory") || "[]");
      setHistory(saved);
    } catch {}
    generateBrief();
  }, []);

  function saveBriefToHistory(briefText) {
    try {
      const saved = JSON.parse(localStorage.getItem("poolBriefHistory") || "[]");
      const updated = [{ date: new Date().toISOString(), text: briefText }, ...saved].slice(0, 3);
      localStorage.setItem("poolBriefHistory", JSON.stringify(updated));
      setHistory(updated);
    } catch {}
  }

  async function generateBrief() {
    setLoading(true);
    setViewingHistory(null);
    try {
      const recentReadings = readings.slice(0, 8);
      const recentTreatments = (maintLog || []).filter(m => m.type === "Treatment applied").slice(0, 5);

      // Flag stale CYA/TA data
      const cyaDue = nextTestDue(readings, "cya", 30);
      const taDue = nextTestDue(readings, "alkalinity", 14);
      const cyaStale = cyaDue && cyaDue.days < 0;
      const taStale = taDue && taDue.days < 0;

      // Confidence flags for missing data
      const last = readings[0];
      const missingFields = [];
      if (!last?.water_temp) missingFields.push("water temp");
      if (!last?.pump_hours) missingFields.push("pump hours");
      if (!last?.filter_pressure) missingFields.push("filter pressure");

      const readingsSummary = recentReadings.map(r =>
        `${r.date}: FC=${r.free_chlorine} ppm, CC=${r.cc??0}, pH=${r.ph}, Salt=${r.salt} ppm, CYA=${r.cya??'not tested'} ppm, TA=${r.alkalinity??'not tested'} ppm, Temp=${r.water_temp??'not logged'}°F, SWG=${r.swg_setting??'not logged'}%, Pump=${r.pump_hours??'not logged'} hrs, Filter=${r.filter_pressure??'not logged'} psi. Notes: ${r.notes||'none'}`
      ).join(String.fromCharCode(10));

      const treatmentSummary = recentTreatments.length > 0
        ? recentTreatments.map(t => `${t.date}: ${t.notes}`).join(String.fromCharCode(10))
        : "No treatments logged yet.";

      const acidOz = calcAcidDose(last?.ph, 7.4, last?.alkalinity);
      const targetSWG = calcTargetSWG(last?.free_chlorine, last?.cya, last?.water_temp, last?.pump_hours);
      const shockMin = calcShockThreshold(last?.cya);
      const phEff = last?.ph ? fcEffectiveAtPH(last.ph) : null;
      const today = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});

      const dataWindowNote = `Analyzing ${recentReadings.length} reading${recentReadings.length!==1?'s':''} (${recentReadings[recentReadings.length-1]?.date} to ${recentReadings[0]?.date}) and ${recentTreatments.length} logged treatment${recentTreatments.length!==1?'s':''}.`;

      const staleDataNote = [
        cyaStale ? `CYA was last tested ${cyaDue.lastDate} (${-cyaDue.days} days overdue) — treat current CYA value as approximate, not current.` : null,
        taStale ? `TA was last tested ${taDue.lastDate} (${-taDue.days} days overdue) — treat current TA value as approximate, not current.` : null,
      ].filter(Boolean).join(' ');

      const missingDataNote = missingFields.length > 0
        ? `Missing data this reading: ${missingFields.join(', ')}. Note this affects confidence of related recommendations (e.g. no temp logged means weather-based estimate used instead).`
        : "";

      const prompt = `You are a knowledgeable pool advisor texting a homeowner in Summerville, South Carolina about their 17,000 gallon vinyl inground salt water pool with a Pentair IntelliChlor SWG and cartridge filter. They test with a Taylor K-2006 FAS-DPD kit (FC readings in drops × 0.5 = ppm).

Today is ${today}. ${dataWindowNote}

Recent readings (most recent first):
${readingsSummary}

Recent treatments logged:
${treatmentSummary}

Chemistry context:
- Current pH effectiveness: at pH ${last?.ph}, only ${phEff}% of chlorine is active
- Shock threshold (CYA÷10): ${shockMin} ppm minimum FC
- Acid needed to reach pH 7.4: ~${acidOz||'unknown'} oz muriatic acid
- Recommended SWG %: ~${targetSWG}%
${staleDataNote ? `- DATA QUALITY FLAG: ${staleDataNote}` : ''}
${missingDataNote ? `- DATA QUALITY FLAG: ${missingDataNote}` : ''}

Please search for current weather in Summerville SC and factor it into your advice.

On pump scheduling: there is no universal rule that overnight is always correct. Daytime running maximizes circulation and chlorine production during peak bather load and algae risk. Overnight running avoids UV chlorine loss but produces chlorine when no one is swimming. Give balanced, situational advice based on this specific pool's data — do not default to recommending overnight running unless the data specifically supports it.

If treatments were logged, compare readings before and after each treatment to assess whether it worked — call out specifically what changed (e.g. "pH dropped from 8.0 to 7.6 after the Jun 17 acid treatment, right on target").

If a reading looks like a likely data entry error (wildly out of normal range), flag it briefly rather than treating it as fact.

Write a pool brief in this EXACT format. Every section must be 1-3 short bullet points, never paragraphs. Be specific with numbers. No fluff, no filler sentences. If data is flagged as stale or missing, mention it briefly where relevant rather than ignoring it.

Format:
**DATA WINDOW**
• [one bullet stating what readings/treatments this brief is based on, and any stale/missing data flags]

**WHAT'S BEEN HAPPENING**
• [trend across the readings]
• [likely cause]

**TREATMENT RESULTS** (only include this section if treatments were logged)
• [did the last treatment work — before/after comparison]

**WEATHER**
• [current Summerville conditions + impact]

**WATER RIGHT NOW**
• [what's good]
• [what needs attention]

**TODAY'S TREATMENT PLAN**
• [specific action with exact dose if chemical]
• [next action, only if needed]

**SWG & PUMP**
• [SWG % recommendation]
• [pump schedule recommendation, balanced]

**WATCH FOR**
• [what to check next reading and when]

Keep the ENTIRE brief under 150 words total. Bullets only, no exceptions.`;

      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1200,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await res.json();

      if(!res.ok || data.error) {
        const msg = data.error?.message || data.error || `HTTP ${res.status}`;
        setError(`API error: ${msg}`);
        setLoading(false);
        return;
      }

      const textBlocks = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join(String.fromCharCode(10));
      const finalBrief = textBlocks || "Unable to generate brief. Check your connection.";
      setBrief(finalBrief);
      saveBriefToHistory(finalBrief);
    } catch(e) {
      setError("Could not generate pool brief: " + e.message);
    }
    setLoading(false);
  }

  // Parse bold headers and bullets for display
  function renderBrief(text) {
    if(!text) return null;
    return text.split(String.fromCharCode(10)).map((line, i) => {
      if(line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} style={{fontSize:11,fontWeight:700,color:COLORS.blue,letterSpacing:"0.8px",textTransform:"uppercase",marginTop:16,marginBottom:6}}>{line.replace(/\*\*/g,'')}</div>;
      }
      if(line.startsWith('•') || line.startsWith('-')) {
        return <div key={i} style={{fontSize:13,color:COLORS.white,lineHeight:1.6,marginBottom:4,paddingLeft:8}}>• {line.replace(/^[•-]\s*/,'')}</div>;
      }
      if(line.trim()==='') return <div key={i} style={{height:4}}/>;
      return <div key={i} style={{fontSize:13,color:COLORS.slateLight,lineHeight:1.6,marginBottom:4}}>{line}</div>;
    });
  }

  const displayedBrief = viewingHistory !== null ? history[viewingHistory]?.text : brief;
  const displayedIsHistory = viewingHistory !== null;

  return (
    <Modal title="🤖 Pool Brief" onClose={onClose}>
      {history.length > 0 && (
        <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
          <span style={S.chip(viewingHistory===null,COLORS.purple)} onClick={()=>setViewingHistory(null)}>Latest</span>
          {history.map((h,i)=>(
            <span key={i} style={S.chip(viewingHistory===i,COLORS.slate)} onClick={()=>setViewingHistory(i)}>
              {new Date(h.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
            </span>
          ))}
        </div>
      )}

      {loading && viewingHistory===null && (
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:14,color:COLORS.slate,marginBottom:8}}>Analyzing your pool history + Summerville weather…</div>
          <div style={{fontSize:12,color:COLORS.slate}}>This takes about 10 seconds</div>
        </div>
      )}
      {error && viewingHistory===null && <div style={{fontSize:13,color:COLORS.red,padding:"20px 0"}}>{error}</div>}
      {displayedBrief && (!loading || displayedIsHistory) && (
        <>
          <div style={{background:COLORS.navyLight,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
            {renderBrief(displayedBrief)}
          </div>
          {!displayedIsHistory && <button style={S.btn} onClick={generateBrief}>🔄 Regenerate</button>}
        </>
      )}
    </Modal>
);
}

// ─── TREATMENT LOG MODAL ──────────────────────────────────────────────────────
function TreatmentLogModal({last, recs, onSave, onClose}) {
  const [checked, setChecked] = useState({});
  const [notes, setNotes]     = useState("");
  const [saving, setSaving]   = useState(false);

  const actionItems = recs.filter(r=>r.priority==="high"||r.priority==="med");

  function toggle(i) { setChecked(p=>({...p,[i]:!p[i]})); }

  async function save() {
    setSaving(true);
    const completedItems = actionItems.filter((_,i)=>checked[i]).map(r=>`${r.param}: ${r.action}`);
    if(completedItems.length===0){setSaving(false);return;}
    const treatmentNote = [
      `Treatment applied — ${new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}`,
      `Starting chemistry: FC=${last?.free_chlorine} ppm, pH=${last?.ph}, Salt=${last?.salt} ppm, CYA=${last?.cya??'unknown'} ppm`,
      ...completedItems,
      notes ? `Notes: ${notes}` : null
    ].filter(Boolean).join(' | ');
    await onSave(treatmentNote);
    setSaving(false);
    onClose();
  }

  return (
    <Modal title="Log Treatment" onClose={onClose}>
      <div style={{fontSize:12,color:COLORS.slate,marginBottom:16,lineHeight:1.5}}>
        Check off what you're doing today. This logs your treatment with starting chemistry values.
      </div>
      {actionItems.map((r,i)=>(
        <div key={i} onClick={()=>toggle(i)} style={{...S.card,cursor:"pointer",borderLeft:`3px solid ${checked[i]?COLORS.green:r.color}`,marginBottom:8}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${checked[i]?COLORS.green:COLORS.slate}`,background:checked[i]?COLORS.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
              {checked[i]&&<span style={{color:"#fff",fontSize:12}}>✓</span>}
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:600}}>{r.icon} {r.action}</div>
              <div style={{fontSize:11,color:COLORS.slate,marginTop:3,lineHeight:1.5}}>{r.detail}</div>
            </div>
          </div>
        </div>
      ))}
      <label style={{...S.label,marginTop:12}}>Additional notes</label>
      <input style={S.input} placeholder="e.g. Added 1 quart muriatic acid, lowered SWG to 45%" value={notes} onChange={e=>setNotes(e.target.value)}/>
      <button style={{...S.btn,marginTop:8,background:Object.values(checked).some(Boolean)?COLORS.green:COLORS.slate}} onClick={save} disabled={saving||!Object.values(checked).some(Boolean)}>
        {saving?"Saving…":"Log Completed Treatment"}
      </button>
      {!Object.values(checked).some(Boolean) && <div style={{fontSize:11,color:COLORS.slate,textAlign:"center",marginTop:8}}>Check at least one item to log</div>}
    </Modal>
  );
}

// ─── POOL ─────────────────────────────────────────────────────────────────────
function Pool(){
  const readings   = useTable("pool_readings","date");
  const maintLog   = useTable("pool_maintenance","date");
  const schedule   = useTable("pool_schedule","title",true);
  const [tab,setTab]             = useState("dashboard");
  const [showLog,setShowLog]     = useState(false);
  const [showMaint,setShowMaint] = useState(false);
  const [showBrief,setShowBrief] = useState(false);
  const [showTreatment,setShowTreatment] = useState(false);
  const [editItem,setEditItem]   = useState(null);
  const [form,setForm]           = useState({});
  const [useDrops,setUseDrops]   = useState(false);
  const [activeSwipe,setActiveSwipe] = useState(null);

  const PARAMS=[
    {k:"ph",           l:"pH",         unit:"",    target:"7.2–7.6"},
    {k:"free_chlorine",l:"FC",         unit:"ppm", target:"4–6"},
    {k:"cc",           l:"CC",         unit:"ppm", target:"0"},
    {k:"salt",         l:"Salt",       unit:"ppm", target:"3200–3600"},
    {k:"cya",          l:"CYA",        unit:"ppm", target:"70–75"},
    {k:"alkalinity",   l:"TA",         unit:"ppm", target:"80–120"},
    {k:"water_temp",   l:"Temp",       unit:"°F",  target:"—"},
    {k:"filter_pressure",l:"PSI",      unit:"psi", target:"<20"},
  ];

  const last     = readings.data[0];
  const chemRecs = getChemRecommendations(last, readings.data);
  const highRecs = chemRecs.filter(r=>r.priority==="high");
  const medRecs  = chemRecs.filter(r=>r.priority==="med");
  const lowRecs  = chemRecs.filter(r=>r.priority==="low");
  const [showLow,setShowLow] = useState(false);

  function openEditReading(r){setEditItem(r);setForm({...r});setShowLog(true);setActiveSwipe(null);}
  function openEditMaint(m){setEditItem(m);setForm({...m});setShowMaint(true);setActiveSwipe(null);}
  function closeLog(){setShowLog(false);setEditItem(null);setForm({});setUseDrops(false);}
  function closeMaint(){setShowMaint(false);setEditItem(null);setForm({});}

  async function markScheduleDone(item){ await schedule.update(item.id,{last_completed:TODAY_STR}); }

  async function saveReading(){
    let fc = form.free_chlorine ? +form.free_chlorine : null;
    if(useDrops && fc) fc = Math.round(fc * 0.5 * 10) / 10;
    const row={
      date:form.date||TODAY_STR,
      ph:+form.ph||null, free_chlorine:fc, cc:form.cc!==undefined&&form.cc!==''?+form.cc:null,
      salt:+form.salt||null, cya:+form.cya||null, alkalinity:+form.alkalinity||null,
      water_temp:+form.water_temp||null, swg_setting:+form.swg_setting||null,
      filter_pressure:+form.filter_pressure||null, pump_hours:+form.pump_hours||null,
      notes:form.notes||""
    };
    if(editItem) await readings.update(editItem.id,row);
    else await readings.insert(row);
    closeLog();
  }

  async function saveMaint(){
    if(!form.type)return;
    const row={date:form.date||TODAY_STR,type:form.type,notes:form.notes||""};
    if(editItem) await maintLog.update(editItem.id,row);
    else await maintLog.insert(row);
    closeMaint();
  }

  async function logTreatment(note){
    await maintLog.insert({date:TODAY_STR,type:"Treatment applied",notes:note});
  }

  const schedSorted=[...schedule.data].sort((a,b)=>{
    const o={overdue:0,"due-soon":1,ok:2};
    return o[maintStatus(a)]-o[maintStatus(b)];
  });

  return(
    <div style={S.screen}>
      {/* Quick action buttons */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={()=>{setForm({date:TODAY_STR});setShowLog(true);}} style={{flex:1,background:COLORS.blue,color:"#fff",border:"none",borderRadius:10,padding:"12px 6px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
          + Log Reading
        </button>
        <button onClick={()=>setShowBrief(true)} style={{flex:1,background:COLORS.purple,color:"#fff",border:"none",borderRadius:10,padding:"12px 6px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
          🤖 Pool Brief
        </button>
        <button onClick={()=>setShowTreatment(true)} style={{flex:1,background:COLORS.green,color:"#fff",border:"none",borderRadius:10,padding:"12px 6px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
          ✓ Log Treatment
        </button>
      </div>

      {/* Current status */}
      {last&&(
        <div style={{...S.card,background:COLORS.navyLight,marginBottom:12}}>
          <div style={{fontSize:11,color:COLORS.blue,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}}>
            Last Reading — {formatDate(last.date)}{last.water_temp?` · ${last.water_temp}°F`:""}
            {last.pump_hours?` · Pump ${last.pump_hours}h`:""}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {PARAMS.filter(p=>!["water_temp","filter_pressure","cc"].includes(p.k)).map(p=>{
              const v=last[p.k];
              const s=poolStatus(p.k,v);const col=statusColor(s);
              const dir=trendDirection(readings.data,p.k,v);
              const trendColor=dir==="up"?COLORS.amber:dir==="down"?COLORS.blue:COLORS.slate;
              return(
                <div key={p.k} style={S.statCell(col)}>
                  <div style={{...S.statVal,fontSize:15,color:s==="grey"?COLORS.slate:COLORS.white}}>
                    {v!==null&&v!==undefined?v:"—"}
                    {dir&&<span style={{fontSize:11,color:trendColor,marginLeft:3}}>{trendArrow(dir)}</span>}
                  </div>
                  <div style={S.statLbl}>{p.l}</div>
                  <div style={S.statTarget}>{p.target}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap"}}>
            {last.cc!==null&&last.cc!==undefined&&<div style={{fontSize:12,color:last.cc>0.5?COLORS.red:COLORS.green}}>CC: {last.cc} ppm {last.cc===0?"✓":""}</div>}
            {last.filter_pressure&&<div style={{fontSize:12,color:last.filter_pressure>20?COLORS.amber:COLORS.slate}}>Filter: {last.filter_pressure} psi</div>}
            {last.swg_setting&&<div style={{fontSize:12,color:COLORS.slate}}>SWG: {last.swg_setting}%</div>}
          </div>
          <div style={{display:"flex",gap:14,marginTop:8,paddingTop:8,borderTop:`1px solid ${COLORS.navyLight}`,flexWrap:"wrap"}}>
            {(()=>{
              const cyaDue=nextTestDue(readings.data,"cya",30);
              if(!cyaDue) return <div style={{fontSize:11,color:COLORS.slate}}>CYA never tested</div>;
              const overdue=cyaDue.days<0;
              return <div style={{fontSize:11,color:overdue?COLORS.red:cyaDue.days<=3?COLORS.amber:COLORS.slate}}>
                CYA {overdue?`overdue — test now`:`not due until ${formatDate(cyaDue.due)}`}
              </div>;
            })()}
            {(()=>{
              const taDue=nextTestDue(readings.data,"alkalinity",14);
              if(!taDue) return <div style={{fontSize:11,color:COLORS.slate}}>TA never tested</div>;
              const overdue=taDue.days<0;
              return <div style={{fontSize:11,color:overdue?COLORS.red:taDue.days<=3?COLORS.amber:COLORS.slate}}>
                TA {overdue?`overdue — test now`:`not due until ${formatDate(taDue.due)}`}
              </div>;
            })()}
          </div>
        </div>
      )}

      {/* High priority recommendations */}
      {highRecs.map((r,i)=>(
        <div key={i} style={{...S.statusCard(r.color),marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{r.icon} {r.action}</div>
          <div style={{fontSize:12,color:COLORS.slateLight,lineHeight:1.5}}>{r.detail}</div>
        </div>
      ))}

      {/* Medium recommendations */}
      {medRecs.map((r,i)=>(
        <div key={i} style={{...S.statusCard(r.color),marginBottom:8}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:3}}>{r.icon} {r.action}</div>
          <div style={{fontSize:11,color:COLORS.slateLight,lineHeight:1.5}}>{r.detail}</div>
        </div>
      ))}

      {/* Low priority — expandable */}
      {lowRecs.length>0&&(
        <button onClick={()=>setShowLow(p=>!p)} style={{...S.btnSm,width:"100%",textAlign:"center",marginBottom:8}}>
          {showLow?"Hide":"Show"} {lowRecs.length} additional note{lowRecs.length!==1?"s":""}
        </button>
      )}
      {showLow&&lowRecs.map((r,i)=>(
        <div key={i} style={{...S.statusCard(r.color),marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,marginBottom:3}}>{r.icon} {r.action}</div>
          <div style={{fontSize:11,color:COLORS.slateLight,lineHeight:1.5}}>{r.detail}</div>
        </div>
      ))}

      {/* Tabs */}
      <div style={{...S.tabs,marginTop:16}}>
        {["log","trends","schedule","history"].map(t=><button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {/* Log tab */}
      {tab==="log"&&<>
        {readings.loading?<Loading/>:<>
          <div style={S.swipeHint}>← swipe left to edit or delete</div>
          {readings.data.map(r=>(
            <SwipeCard key={r.id} id={r.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
              onEdit={()=>openEditReading(r)}
              onDelete={()=>{if(window.confirm("Delete this reading?"))readings.remove(r.id);setActiveSwipe(null);}}
              style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{fontSize:13,fontWeight:700}}>{formatDate(r.date)}</div>
                <div style={{fontSize:11,color:COLORS.slate,textAlign:"right"}}>
                  {r.water_temp?`${r.water_temp}°F`:""}
                  {r.swg_setting?` · SWG ${r.swg_setting}%`:""}
                  {r.pump_hours?` · ${r.pump_hours}h`:""}
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap"}}>
                {PARAMS.filter(p=>!["water_temp","filter_pressure"].includes(p.k)).map(p=>{
                  const v=r[p.k];
                  const s=poolStatus(p.k,v);
                  return <div key={p.k}><div style={{fontSize:13,fontWeight:600,color:v!==null&&v!==undefined?statusColor(s):COLORS.slate}}>{v!==null&&v!==undefined?v:"—"}</div><div style={{fontSize:10,color:COLORS.slate}}>{p.l}</div></div>;
                })}
              </div>
              {r.notes&&<div style={{fontSize:11,color:COLORS.slate,marginTop:6,fontStyle:"italic"}}>{r.notes}</div>}
            </SwipeCard>
          ))}
          <button style={S.btn} onClick={()=>{setForm({date:TODAY_STR});setShowLog(true);}}>+ Log Reading</button>
        </>}
      </>}

      {/* Trends tab */}
      {tab==="trends"&&<>
        {PARAMS.filter(p=>!["water_temp","filter_pressure","cc"].includes(p.k)).map(p=>{
          const vals=[...readings.data].reverse().map(r=>r[p.k]).filter(v=>v!==null&&v!==undefined);
          if(vals.length<2)return null;
          const latest=vals[vals.length-1];
          const s=poolStatus(p.k,latest);const col=statusColor(s);
          return(
            <div key={p.k} style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:14,fontWeight:600}}>{p.l}</div>
                <div style={{fontSize:11,color:COLORS.slate}}>Target: {p.target}{p.unit?" "+p.unit:""}</div>
                <div style={{fontSize:20,fontWeight:700,color:col,marginTop:4}}>{latest}{p.unit&&p.unit!=="ppm"?p.unit:p.unit?" ppm":""}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                <Sparkline data={vals} color={col}/>
                <span style={{...S.badge(col),fontSize:10}}>{s==="green"?"OK":s==="amber"?"Watch":"Adjust"}</span>
              </div>
            </div>
          );
        })}
      </>}

      {/* Schedule tab */}
      {tab==="schedule"&&<>
        {schedule.loading?<Loading/>:<>
          <div style={S.swipeHint}>← swipe left to edit or delete</div>
          {schedSorted.map(item=>{
            const st=maintStatus(item);const color=maintColor(st);
            const nd=nextDueDate(item.last_completed,item.interval_days);
            const days=daysBetween(nd);
            const pct=Math.max(0,100-(days/item.interval_days)*100);
            return(
              <SwipeCard key={item.id} id={item.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                onEdit={()=>{setEditItem(item);setForm(item);setShowMaint(true);}}
                onDelete={()=>{if(window.confirm("Remove this item?"))schedule.remove(item.id);setActiveSwipe(null);}}
                style={S.statusCard(color)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600}}>{item.title}</div>
                    <div style={{fontSize:12,color:COLORS.slate,marginTop:2}}>
                      {st==="overdue"?`Overdue by ${-days}d`:st==="due-soon"?`Due in ${days}d`:`Due ${formatDate(nd)}`}
                      {item.notes?` · ${item.notes}`:""}
                    </div>
                    <div style={S.progress}><div style={S.progressFill(pct,color)}/></div>
                  </div>
                  <button style={{...S.btnGreen,marginLeft:12}} onClick={()=>markScheduleDone(item)}>Done ✓</button>
                </div>
              </SwipeCard>
            );
          })}
          <button style={S.btn} onClick={()=>{setForm({});setShowMaint(true);}}>+ Add Item</button>
        </>}
      </>}

      {/* History tab — maintenance log */}
      {tab==="history"&&<>
        {maintLog.loading?<Loading/>:<>
          <div style={S.swipeHint}>← swipe left to edit or delete</div>
          {maintLog.data.map(m=>(
            <SwipeCard key={m.id} id={m.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
              onEdit={()=>openEditMaint(m)}
              onDelete={()=>{if(window.confirm("Delete entry?"))maintLog.remove(m.id);setActiveSwipe(null);}}
              style={S.card}>
              <div style={{fontSize:12,fontWeight:700,color:m.type==="Treatment applied"?COLORS.green:COLORS.white}}>{m.type}</div>
              <div style={{fontSize:11,color:COLORS.slate,marginTop:3}}>{formatDate(m.date)}</div>
              {m.notes&&<div style={{fontSize:11,color:COLORS.slate,marginTop:4,lineHeight:1.5,fontStyle:"italic"}}>{m.notes}</div>}
            </SwipeCard>
          ))}
          <button style={S.btn} onClick={()=>{setForm({date:TODAY_STR});setShowMaint(true);}}>+ Log Entry</button>
        </>}
      </>}

      {/* Log Reading Modal */}
      {showLog&&<Modal title={editItem?"Edit Reading":"Log Pool Reading"} onClose={closeLog}>
        <label style={S.label}>Date</label>
        <input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <label style={{...S.label,marginBottom:0}}>Free Chlorine</label>
          <div style={{display:"flex",gap:6}}>
            <span style={S.chip(!useDrops,COLORS.blue)} onClick={()=>setUseDrops(false)}>ppm</span>
            <span style={S.chip(useDrops,COLORS.purple)} onClick={()=>setUseDrops(true)}>K-2006 drops</span>
          </div>
        </div>
        <input type="number" step="0.5" style={S.input} placeholder={useDrops?"e.g. 11 drops (= 5.5 ppm)":"e.g. 5.5"} value={form.free_chlorine||""} onChange={e=>setForm(p=>({...p,free_chlorine:e.target.value}))}/>
        {useDrops&&form.free_chlorine&&<div style={{fontSize:11,color:COLORS.purple,marginTop:-6,marginBottom:8}}>= {(+form.free_chlorine*0.5).toFixed(1)} ppm FC</div>}

        <label style={S.label}>CC (Combined Chlorine)</label>
        <input type="number" step="0.5" style={S.input} placeholder="" value={form.cc!==undefined?form.cc:""} onChange={e=>setForm(p=>({...p,cc:e.target.value}))}/>

        <div style={S.row}>
          <div style={S.col}><label style={S.label}>pH</label><input type="number" step="0.1" style={S.input} placeholder="" value={form.ph||""} onChange={e=>setForm(p=>({...p,ph:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Salt (ppm)</label><input type="number" style={S.input} placeholder="" value={form.salt||""} onChange={e=>setForm(p=>({...p,salt:e.target.value}))}/></div>
        </div>
        <div style={S.row}>
          <div style={S.col}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <label style={{...S.label,marginBottom:0}}>CYA (ppm)</label>
              {(()=>{
                const d=nextTestDue(readings.data,"cya",30);
                if(!d) return <span style={{fontSize:9,color:COLORS.slate}}>never tested</span>;
                const overdue=d.days<0;
                return <span style={{fontSize:9,color:overdue?COLORS.red:d.days<=3?COLORS.amber:COLORS.slate}}>{overdue?"overdue":`due ${formatDate(d.due)}`}</span>;
              })()}
            </div>
            <input type="number" style={S.input} placeholder="" value={form.cya||""} onChange={e=>setForm(p=>({...p,cya:e.target.value}))}/>
          </div>
          <div style={S.col}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <label style={{...S.label,marginBottom:0}}>TA (ppm)</label>
              {(()=>{
                const d=nextTestDue(readings.data,"alkalinity",14);
                if(!d) return <span style={{fontSize:9,color:COLORS.slate}}>never tested</span>;
                const overdue=d.days<0;
                return <span style={{fontSize:9,color:overdue?COLORS.red:d.days<=3?COLORS.amber:COLORS.slate}}>{overdue?"overdue":`due ${formatDate(d.due)}`}</span>;
              })()}
            </div>
            <input type="number" style={S.input} placeholder="" value={form.alkalinity||""} onChange={e=>setForm(p=>({...p,alkalinity:e.target.value}))}/>
          </div>
        </div>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Water Temp (°F)</label><input type="number" style={S.input} placeholder="" value={form.water_temp||""} onChange={e=>setForm(p=>({...p,water_temp:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Filter Pressure (psi)</label><input type="number" style={S.input} placeholder="" value={form.filter_pressure||""} onChange={e=>setForm(p=>({...p,filter_pressure:e.target.value}))}/></div>
        </div>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>SWG Setting (%)</label><input type="number" style={S.input} placeholder="" value={form.swg_setting||""} onChange={e=>setForm(p=>({...p,swg_setting:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Pump Hours/Day</label><input type="number" style={S.input} placeholder="" value={form.pump_hours||""} onChange={e=>setForm(p=>({...p,pump_hours:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="Optional" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:8}} onClick={saveReading}>{editItem?"Save Changes":"Save Reading"}</button>
      </Modal>}

      {/* Maintenance log / schedule modal */}
      {showMaint&&<Modal title={editItem?"Edit Entry":"Log Pool Entry"} onClose={closeMaint}>
        <label style={S.label}>Date</label>
        <input type="date" style={S.input} value={form.date||form.last_completed||""} onChange={e=>setForm(p=>({...p,date:e.target.value,last_completed:e.target.value}))}/>
        <label style={S.label}>Type</label>
        {["Check water level","Clean skimmer basket","Brushed walls & floor","Added salt","Cleaned cartridge filter","Cleaned salt cell","Checked flow switch","Inspected O-rings","Rain event","Other"].map(t=>(
          <span key={t} style={S.chip(form.type===t,COLORS.blue)} onClick={()=>setForm(p=>({...p,type:t}))}>{t}</span>
        ))}
        <label style={{...S.label,marginTop:8}}>Notes (optional)</label>
        <input style={S.input} placeholder="Any details" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:8}} onClick={saveMaint}>{editItem?"Save Changes":"Save"}</button>
      </Modal>}

      {/* AI Brief Modal */}
      {showBrief&&<PoolBrief readings={readings.data} maintLog={maintLog.data} onClose={()=>setShowBrief(false)}/>}

      {/* Treatment Log Modal */}
      {showTreatment&&<TreatmentLogModal last={last} recs={chemRecs} onSave={logTreatment} onClose={()=>setShowTreatment(false)}/>}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab] = useState("home");
  const gc           = useGoogleCalendar();

  const TABS=[
    {id:"home",     label:"Home",     icon:I.home},
    {id:"schedule", label:"Schedule", icon:I.cal},
    {id:"college",  label:"College",  icon:I.college},
    {id:"home-mgmt",label:"House",    icon:I.house},
    {id:"pool",     label:"Pool",     icon:I.pool},
  ];
  const TITLES={home:"FamilyOS",schedule:"Schedule",college:"College Planning","home-mgmt":"Home",pool:"Pool"};

  return(
    <div style={S.app}>
      <style>{`
        *{box-sizing:border-box;}
        input[type=number]::-webkit-inner-spin-button{opacity:0.5;}
        select option{background:#1A2540;}
        ::-webkit-scrollbar{width:0;}
      `}</style>

      <div style={S.header}>
        <div style={S.headerRow}>
          <div>
            <div style={S.logo}>{tab==="home"?<><span style={S.logoAccent}>Family</span>OS</>:TITLES[tab]}</div>
            {tab==="home"&&<div style={S.dateLabel}>{formatToday()}</div>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {gc.token
              ?<div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:8,height:8,borderRadius:"50%",background:COLORS.green}}/><span style={{fontSize:11,color:COLORS.slate}}>Synced</span></div>
              :<button onClick={()=>setTab("schedule")} style={{background:COLORS.blue+"22",color:COLORS.blue,border:`1px solid ${COLORS.blue}44`,borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Connect Calendar</button>
            }
          </div>
        </div>
      </div>

      {tab==="home"     &&<Dashboard onNavigate={setTab} gc={gc}/>}
      {tab==="schedule" &&<Schedule gc={gc}/>}
      {tab==="college"  &&<College/>}
      {tab==="home-mgmt"&&<HomeMgmt/>}
      {tab==="pool"     &&<Pool/>}

      <nav style={S.nav}>
        {TABS.map(t=>(
          <button key={t.id} style={S.navItem(tab===t.id)} onClick={()=>setTab(t.id)}>
            {t.icon(tab===t.id)}<span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
