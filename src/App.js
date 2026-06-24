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
    {id:"7",date:"2026-06-17",logged_at:"2026-06-17T18:30:00Z",ph:8.0,free_chlorine:5.5,cc:0,salt:3350,cya:60,alkalinity:90,calcium_hardness:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:"K-2006: 11 drops FC. Acid added 2 days prior. TA 90 ppm (9 drops)."},
    {id:"6",date:"2026-06-15",logged_at:"2026-06-15T17:00:00Z",ph:7.8,free_chlorine:3.0,cc:0,salt:3450,cya:60,alkalinity:null,calcium_hardness:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:""},
    {id:"5",date:"2026-06-12",logged_at:"2026-06-12T16:00:00Z",ph:8.0,free_chlorine:4.0,cc:0,salt:3450,cya:60,alkalinity:null,calcium_hardness:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:"CYA increased"},
    {id:"4",date:"2026-06-10",logged_at:"2026-06-10T15:00:00Z",ph:7.8,free_chlorine:2.0,cc:0,salt:3300,cya:60,alkalinity:null,calcium_hardness:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:"Hot weather"},
    {id:"3",date:"2026-06-04",logged_at:"2026-06-04T17:30:00Z",ph:7.8,free_chlorine:5.0,cc:0,salt:3450,cya:43,alkalinity:null,calcium_hardness:null,water_temp:null,swg_setting:54,filter_pressure:null,pump_hours:null,notes:"SWG 54%"},
    {id:"2",date:"2026-05-31",logged_at:"2026-05-31T16:00:00Z",ph:8.0,free_chlorine:5.5,cc:0,salt:3300,cya:null,alkalinity:null,calcium_hardness:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:"K-2006: 11 drops FC. After party."},
  ],
  pool_maintenance:[
    {id:"1",date:"2026-06-13",type:"Brushed walls & floor",notes:""},
    {id:"2",date:"2026-06-10",type:"Cleaned skimmer basket",notes:""},
  ],
  pool_settings:[
    {id:"1",filter_clean_baseline_psi:null},
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
  college_essays:[
    {id:"1",title:"Common App Personal Statement",school:"",due_date:"2026-09-15",status:"not started",word_count:"650 max",notes:""},
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
  retirement_accounts:[
    {id:"1",name:"Matt 403(b)",account_type:"403b",balance:520000,monthly_contribution:1200,employer_match:400,contribution_frequency:"monthly",tax_treatment:"pre-tax",last_updated:"2026-06-01",notes:""},
    {id:"2",name:"Kalee 401(k)",account_type:"401k",balance:180000,monthly_contribution:500,employer_match:250,contribution_frequency:"monthly",tax_treatment:"pre-tax",last_updated:"2026-06-01",notes:"~$6k/yr contribution"},
    {id:"3",name:"Traditional IRA",account_type:"IRA",balance:65000,monthly_contribution:0,employer_match:0,contribution_frequency:"monthly",tax_treatment:"pre-tax",last_updated:"2026-06-01",notes:""},
    {id:"4",name:"HSA",account_type:"HSA",balance:28000,monthly_contribution:300,employer_match:0,contribution_frequency:"monthly",tax_treatment:"HSA",last_updated:"2026-06-01",notes:"Maxed, ~70% invested"},
    {id:"5",name:"Brokerage",account_type:"brokerage",balance:85000,monthly_contribution:400,employer_match:0,contribution_frequency:"monthly",tax_treatment:"taxable",last_updated:"2026-06-01",notes:""},
  ],
  retirement_assumptions:[
    {id:"1",current_age:44,retirement_age:59,annual_return_pct:7,withdrawal_rate_pct:4,annual_retirement_spending:110000,social_security_estimate:18000,social_security_estimate_spouse:12000,ss_claim_age:67,ss_claim_age_spouse:67,healthcare_estimate:18000,contribution_increase_pct:3,bridge_end_age:65,medicare_age:65,plan_end_age:90,inflation_pct:3,conservative_rate_pct:5,moderate_rate_pct:7,aggressive_rate_pct:9,drawdown_rate_pct:5,return_volatility_pct:15},
  ],
  college_savings:[
    {id:"1",balance:50000,monthly_contribution:200,last_updated:"2026-06-01",notes:"529 plan"},
  ],
  college_goal:[
    {id:"1",child_name:"Aubrey",target_amount:160000,target_year:2027,notes:"Blended estimate — Aubrey targeting USC Honors, Clemson, College of Charleston. In-state preferred."},
    {id:"2",child_name:"Blake",target_amount:160000,target_year:2032,notes:"Entering 7th grade (2026)."},
    {id:"3",child_name:"Brayden",target_amount:160000,target_year:2035,notes:"Entering 4th grade (2026)."},
  ],
  mortgage:[
    {id:"1",current_balance:310000,interest_rate:6.25,monthly_payment:2400,term_years:30,start_date:"2021-08-01",extra_payment_monthly:0,last_updated:"2026-06-01"},
  ],
  other_debt:[
    {id:"1",name:"Personal Loan",balance:21000,interest_rate:8.5,payment_amount:480,payment_frequency:"biweekly",last_updated:"2026-06-01",notes:"Goal: payoff in ~7 months with extra payments"},
  ],
  net_worth_snapshots:[
    {id:"1",date:"2026-06-01",total_assets:928000,total_liabilities:331000,net_worth:597000,notes:"Initial snapshot"},
  ],
  finance_action_items:[
    {id:"1",title:"Review retirement contribution — currently below 15% target",category:"retirement",priority:"med",completed:false,created_date:"2026-06-01"},
    {id:"2",title:"Evaluate extra payments toward 8.5% personal loan",category:"debt",priority:"high",completed:false,created_date:"2026-06-01"},
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
function formatTodayShort(){return new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});}
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

// ─── POOL HEALTH ASSESSMENT ───────────────────────────────────────────────────
// Derives a safe-to-swim status and plain-language per-parameter labels from
// the most recent reading. No composite score — each parameter assessed independently.
function calcPoolHealth(last, shockMin, readings) {
  if (!last) return null;

  // Safe to swim is based on TRUE safety thresholds, not ideal target ranges.
  // pH 8.0 is outside ideal but NOT unsafe — truly unsafe pH is below 6.8 or above 8.5.
  // Separate "safe to swim" from "maintenance recommended" to avoid false red alerts.
  const fcSafe = last.free_chlorine !== null && last.free_chlorine >= 1.0;
  const phSafe = last.ph === null || (last.ph >= 6.8 && last.ph <= 8.5);
  const ccSafe = last.cc === null || last.cc === undefined || last.cc <= 1.0; // >1 ppm = real chloramine concern
  const safeToSwim = fcSafe && phSafe && ccSafe;

  // Maintenance recommended even though swimming is safe
  const phIdeal = last.ph === null || (last.ph >= 7.2 && last.ph <= 7.8);
  const maintenanceNeeded = !phIdeal ||
    (last.cya !== null && last.cya < 50) ||
    (last.salt !== null && (last.salt < 3200 || last.salt > 3800)) ||
    (last.alkalinity !== null && (last.alkalinity < 80 || last.alkalinity > 140));

  const notSafeReasons = [];
  if (!fcSafe) notSafeReasons.push(last.free_chlorine === null ? "FC not tested" : `FC too low (${last.free_chlorine} ppm — need ≥1 ppm)`);
  if (!phSafe) notSafeReasons.push(`pH ${last.ph} is extreme — outside 6.8–8.5`);
  if (!ccSafe) notSafeReasons.push(`CC elevated at ${last.cc} ppm — chloramines present`);

  const maintenanceReasons = [];
  if (last.ph && last.ph > 7.8) maintenanceReasons.push(`pH ${last.ph} elevated — add acid`);
  else if (last.ph && last.ph < 7.2) maintenanceReasons.push(`pH ${last.ph} low — add sodium bicarb`);
  if (last.cya !== null && last.cya < 50) maintenanceReasons.push(`CYA ${last.cya} ppm — add stabilizer`);
  if (last.salt !== null && last.salt < 3200) maintenanceReasons.push(`Salt ${last.salt} ppm — add salt`);

  // Per-parameter status labels — reflect actual risk level, not just in-range vs. out-of-range.
  // CYA 30-50 for SWG is a monitor situation, not a red alert. pH 7.9-8.1 is minor.
  // CYA thresholds tuned for SWG pools: ideal 60-80, acceptable 40-60, low <40, dangerously low <30
  function paramLabel(param, value) {
    const s = poolStatus(param, value);
    if (value === null || value === undefined) return { statusLabel: "Not tested", color: COLORS.slate, icon: "⚪", scoreDeduct: 3 };
    if (param === "cya") {
      if (value >= 60) return { statusLabel: "Good", color: COLORS.green, icon: "🟢", scoreDeduct: 0 };
      if (value >= 40) return { statusLabel: "Acceptable", color: COLORS.green, icon: "🟢", scoreDeduct: 5 }; // 40-60 is fine for SWG, just not ideal
      if (value >= 30) return { statusLabel: "Slightly Low", color: COLORS.amber, icon: "🟡", scoreDeduct: 10 }; // monitor, not urgent
      return { statusLabel: "Low — add stabilizer", color: COLORS.red, icon: "🔴", scoreDeduct: 30 };
    }
    if (param === "ph") {
      if (value >= 7.2 && value <= 7.8) return { statusLabel: "Good", color: COLORS.green, icon: "🟢", scoreDeduct: 0 };
      if ((value > 7.8 && value <= 8.1) || (value >= 6.8 && value < 7.2)) return { statusLabel: value>7.8?"Elevated":"Low", color: COLORS.amber, icon: "🟡", scoreDeduct: 15 };
      return { statusLabel: value>8.1?"High":"Low", color: COLORS.red, icon: "🔴", scoreDeduct: 35 };
    }
    const labels = {
      green: { statusLabel: "Good",    color: COLORS.green, icon: "🟢", scoreDeduct: 0 },
      amber: { statusLabel: param==="free_chlorine"&&value>4.0?"High":param==="salt"&&value<3200?"Low":"Off",
               color: COLORS.amber, icon: "🟡", scoreDeduct: 15 },
      red:   { statusLabel: param==="free_chlorine"&&value<1?"Unsafe":"Action needed",
               color: COLORS.red,   icon: "🔴", scoreDeduct: 40 },
    };
    return labels[s] || { statusLabel: "Check", color: COLORS.slate, icon: "⚪", scoreDeduct: 5 };
  }

  // Helper: find most recent non-null value for a param across all readings
  function mostRecentValue(key) {
    for (const r of readings) {
      if (r[key] !== null && r[key] !== undefined) return { value: r[key], date: r.date };
    }
    return { value: null, date: null };
  }

  const cyaRecent     = mostRecentValue("cya");
  const taRecent      = mostRecentValue("alkalinity");
  const calciumRecent = mostRecentValue("calcium_hardness");

  function nextTestInfo(lastDate, intervalDays) {
    if (!lastDate) return { dueLabel: "Never tested", overdue: true, urgency: "red" };
    const due = nextDueDate(lastDate, intervalDays);
    const days = daysBetween(due);
    if (days < 0) return { dueLabel: `Overdue by ${-days}d`, overdue: true, urgency: "red" };
    if (days <= 5) return { dueLabel: `Due in ${days}d`, overdue: false, urgency: "amber" };
    return { dueLabel: `Due ${formatDate(due)}`, overdue: false, urgency: "green" };
  }

  const cyaTestInfo     = nextTestInfo(cyaRecent.date, 14);
  const taTestInfo      = nextTestInfo(taRecent.date, 14);
  const calciumTestInfo = nextTestInfo(calciumRecent.date, 90);

  const params = [
    { key: "free_chlorine", label: "Free Chlorine", shortLabel:"FC",   value: last.free_chlorine,   unit: "ppm",  target:"4–6 ppm",    testInterval: null },
    { key: "ph",            label: "pH",             shortLabel:"pH",   value: last.ph,               unit: "",     target:"7.2–7.8",    testInterval: null },
    { key: "cya",           label: "Stabilizer",     shortLabel:"CYA",  value: cyaRecent.value,        unit: "ppm",  target:"60–80 ppm",  testInterval: 14, testedDate: cyaRecent.date, testInfo: cyaTestInfo },
    { key: "salt",          label: "Salt",            shortLabel:"Salt", value: last.salt,              unit: "ppm",  target:"3200–3600",  testInterval: null },
    { key: "alkalinity",    label: "Total Alkalinity",shortLabel:"TA",   value: taRecent.value,         unit: "ppm",  target:"80–120 ppm", testInterval: 14, testedDate: taRecent.date, testInfo: taTestInfo },
    { key: "calcium_hardness", label: "Calcium Hardness", shortLabel:"Ca", value: calciumRecent.value, unit: "ppm",  target:"150–250 ppm",testInterval: 90, testedDate: calciumRecent.date, testInfo: calciumTestInfo },
  ].map(p => {
    const trend = trendDirection(readings, p.key, p.value);
    const trendArrowChar = trend==="up" ? "⬆️" : trend==="down" ? "⬇️" : trend==="flat" ? "➡️" : null;
    const lastTested = p.testedDate || lastTestedDate(readings, p.key);
    const lastTestedLabel = p.value!==null&&p.value!==undefined
      ? (p.testInterval ? `Tested ${formatDate(lastTested)}` : null)
      : (lastTested ? `Last: ${formatDate(lastTested)}` : "Never tested");
    return { ...p, ...paramLabel(p.key, p.value), trend, trendArrow: trendArrowChar, lastTestedLabel };
  });

  // Health score — per-parameter deductions based on actual risk, not just in/out of range
  let score = 100;
  params.forEach(p => { score -= (p.scoreDeduct||0); });
  score = Math.max(0, Math.min(100, score));

  // Overall condition
  const anyRed = params.some(p => p.icon==="🔴");
  const anyAmber = params.some(p => p.icon==="🟡");
  const overallColor = anyRed ? COLORS.red : anyAmber ? COLORS.amber : COLORS.green;
  const overallLabel = anyRed ? "Needs Attention" : anyAmber ? "Good" : "Healthy";
  const overallEmoji = anyRed ? "🔴" : anyAmber ? "🟡" : "🟢";

  // Static executive summary — direct, specific, action-oriented
  const summaryParts = [];

  if (safeToSwim) summaryParts.push("Pool is safe to swim.");
  else summaryParts.push(notSafeReasons[0] || "Check chemistry before swimming.");

  // Top action — specific with dose where possible
  if (last.ph && last.ph > 7.8) {
    const acidOzCalc = calcAcidDose(last.ph, 7.4, last.alkalinity || (taRecent.value));
    const trend = trendDirection(readings, "ph", last.ph);
    const doseStr = acidOzCalc ? ` with approximately ${acidOzCalc} oz muriatic acid` : "";
    summaryParts.push(`pH is${trend==="up"?" trending up and":""} elevated at ${last.ph} and should be lowered${doseStr}.`);
  } else if (last.ph && last.ph < 7.2) {
    summaryParts.push(`pH is low at ${last.ph} — add sodium bicarbonate to raise it.`);
  } else if (last.free_chlorine !== null && last.free_chlorine < 1.0) {
    summaryParts.push(`FC is critically low at ${last.free_chlorine} ppm — add chlorine before swimming.`);
  } else if (cyaRecent.value !== null && cyaRecent.value < 30) {
    summaryParts.push(`CYA is low at ${cyaRecent.value} ppm — add stabilizer this week.`);
  }

  // Reassurance line
  const otherParamsOk = params.filter(p=>p.key!=="ph"&&p.key!=="free_chlorine").every(p=>p.icon==="🟢");
  if (summaryParts.length >= 2 && otherParamsOk) {
    summaryParts.push("All other tested parameters are within acceptable ranges.");
  } else if (summaryParts.length === 1 && safeToSwim) {
    summaryParts.push("Chemistry looks balanced — no action needed.");
  }

  const summary = summaryParts.slice(0, 3).join(" ");

  return { safeToSwim, notSafeReasons, maintenanceNeeded, maintenanceReasons, params, overallColor, overallLabel, overallEmoji, score, summary };
}

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

// ─── FINANCE ENGINE ───────────────────────────────────────────────────────────

function formatMoney(n, decimals=0) {
  if (n===null||n===undefined||isNaN(n)) return "—";
  return "$" + Math.round(n).toLocaleString("en-US", {minimumFractionDigits:0, maximumFractionDigits:decimals});
}
function formatMoneyShort(n) {
  if (n===null||n===undefined||isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1000000) return (n<0?"-":"") + "$" + (abs/1000000).toFixed(2) + "M";
  if (abs >= 1000) return (n<0?"-":"") + "$" + Math.round(abs/1000) + "k";
  return formatMoney(n);
}

function futureValue(presentValue, monthlyContribution, annualRatePct, years) {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return presentValue + monthlyContribution * n;
  const fvPV = presentValue * Math.pow(1+r, n);
  const fvContrib = monthlyContribution * ((Math.pow(1+r, n) - 1) / r);
  return fvPV + fvContrib;
}

// Effective monthly contribution from an account, converting biweekly to monthly equivalent
function effectiveMonthlyContribution(account) {
  const amount = account.monthly_contribution || 0;
  const match = account.employer_match || 0;
  if (account.contribution_frequency === "biweekly") {
    return (amount * 26 / 12) + (match * 26 / 12);
  }
  return amount + match;
}

// Future value with contributions that grow by a fixed % each year (e.g. raises, auto-escalation)
function futureValueWithGrowth(presentValue, monthlyContribution, annualRatePct, years, annualGrowthPct=0) {
  const r = annualRatePct / 100 / 12;
  let balance = presentValue;
  let contrib = monthlyContribution;
  const trajectory = [{ year: 0, balance: Math.round(balance) }];
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1+r) + contrib;
    }
    trajectory.push({ year: y, balance: Math.round(balance) });
    contrib = contrib * (1 + annualGrowthPct/100);
  }
  return { finalBalance: balance, trajectory };
}

// Healthcare cost compounds faster than general inflation — default 5.5%/year
// Healthcare grows faster than general inflation, but not forever — above-inflation growth
// is capped at ~20 years (the period most actuarial models treat as elevated), then reverts
// to general inflation. Uncapped 5.5% compounding for 40+ years produces an unrealistic result
// (e.g. healthcare alone exceeding total retirement spending by the end of a long plan).
function futureHealthcareCost(annualEstimate, years, growthPct=5.5, accelCapYears=20, normalInflationPct=3) {
  if (years <= accelCapYears) {
    return annualEstimate * Math.pow(1 + growthPct/100, years);
  }
  const atCap = annualEstimate * Math.pow(1 + growthPct/100, accelCapYears);
  return atCap * Math.pow(1 + normalInflationPct/100, years - accelCapYears);
}

// Combined household Social Security at a given age — each spouse's benefit kicks in
// independently at their own claim age, since most couples don't claim simultaneously.
// Falls back to the original single combined estimate if spouse fields aren't set,
// so existing single-input households behave exactly as before.
function householdSocialSecurityAtAge(assumptions, age, inflationPct) {
  const hasSpouseFields = assumptions.social_security_estimate_spouse!==undefined && assumptions.social_security_estimate_spouse!==null;
  if (!hasSpouseFields) {
    const claimAge = +(assumptions.ss_claim_age) || 67;
    if (age < claimAge) return 0;
    return (+(assumptions.social_security_estimate)||0) * Math.pow(1+inflationPct/100, age-claimAge);
  }
  let total = 0;
  const userClaimAge   = +(assumptions.ss_claim_age) || 67;
  const userBenefit    = +(assumptions.social_security_estimate) || 0;
  if (age >= userClaimAge) total += userBenefit * Math.pow(1+inflationPct/100, age-userClaimAge);
  const spouseClaimAge = +(assumptions.ss_claim_age_spouse) || 67;
  const spouseBenefit  = +(assumptions.social_security_estimate_spouse) || 0;
  if (age >= spouseClaimAge) total += spouseBenefit * Math.pow(1+inflationPct/100, age-spouseClaimAge);
  return total;
}

// Rough effective tax treatment by account tax_treatment type
// pre-tax (403b/401k/IRA): taxed as ordinary income on withdrawal — assume ~18% effective rate
// Roth: tax-free
// taxable (brokerage): assume ~15% effective on growth portion only, simplified to flat ~10% blended
// HSA: tax-free for qualified medical expenses
function taxAdjustedValue(balance, taxTreatment, effectiveRate=18) {
  if (taxTreatment === "Roth" || taxTreatment === "HSA") return balance;
  if (taxTreatment === "taxable") return balance * (1 - 0.10);
  return balance * (1 - effectiveRate/100); // pre-tax default
}

// Rule of 55: 403b/401k from current employer accessible penalty-free starting the year you turn 55
// if separating from service. IRAs and prior-employer plans still subject to 59.5 penalty rule.
function ruleOf55Eligible(account) {
  return account.account_type === "403b" || account.account_type === "401k";
}

// ─── MONTE CARLO SIMULATION ───────────────────────────────────────────────────
// Runs many randomized return paths instead of one fixed rate, to estimate a
// success probability (% of paths that never run out of money) rather than a
// single deterministic number. Uses a normal distribution via Box-Muller transform.
function randomNormal(mean, stdDev) {
  let u1 = Math.random(), u2 = Math.random();
  while (u1 === 0) u1 = Math.random(); // avoid log(0)
  const z = Math.sqrt(-2*Math.log(u1)) * Math.cos(2*Math.PI*u2);
  return mean + z*stdDev;
}

// Runs ONE randomized path through accumulation + bridge + drawdown, returns whether it lasted.
function runOneMonteCarloPath(accounts, assumptions, retirementAgeOverride, meanReturn, stdDev) {
  // Coerce all numeric fields — Supabase can return them as strings
  const spending      = +(assumptions.annual_retirement_spending) || 110000;
  const hcEstimate    = +(assumptions.healthcare_estimate) || 0;
  const inflationPct  = +(assumptions.inflation_pct) || 3;
  const contribGrowth = +(assumptions.contribution_increase_pct) || 0;
  const retAge        = +(retirementAgeOverride || assumptions.retirement_age);
  const currentAge    = +(assumptions.current_age) || 44;
  const medicareAge   = +(assumptions.medicare_age || assumptions.bridge_end_age) || 65;
  const planEndAge    = +(assumptions.plan_end_age) || 90;

  const totalBalance = accounts.reduce((s,a)=>s+(+(a.balance)||0),0);
  const totalMonthly = accounts.reduce((s,a)=>s+effectiveMonthlyContribution(a),0);
  const accumYears = Math.max(0, retAge - currentAge);

  const ruleOf55Share = totalBalance>0
    ? accounts.filter(ruleOf55Eligible).reduce((s,a)=>s+(+(a.balance)||0),0) / totalBalance
    : 0;

  // Accumulation — random return each year
  let balance = totalBalance;
  let contrib = totalMonthly;
  for (let y=0; y<accumYears; y++) {
    const yearReturn = randomNormal(meanReturn, stdDev) / 100;
    for (let m=0; m<12; m++) balance = balance*(1+yearReturn/12) + contrib;
    contrib = contrib * (1+contribGrowth/100);
  }

  const taxableMix = accounts.reduce((acc,a)=>{
    const share = totalBalance>0 ? (+(a.balance)||0)/totalBalance : 0;
    return acc + share * (a.tax_treatment==="Roth"||a.tax_treatment==="HSA" ? 0 : a.tax_treatment==="taxable" ? 0.10 : 0.18);
  },0);
  let spendable = balance * (1-taxableMix);
  let ruleOf55Pool = spendable * ruleOf55Share;
  let otherPool = spendable * (1-ruleOf55Share);

  // Bridge years — random return each year, draw from Rule of 55 pool first
  const bridgeYears = Math.max(0, medicareAge - retAge);
  const spendingAtRet = spending * Math.pow(1+inflationPct/100, accumYears);

  for (let y=0; y<bridgeYears; y++) {
    const yearReturn = randomNormal(meanReturn, stdDev) / 100;
    const totalYearsFromNow = accumYears + y;
    const hcYear = futureHealthcareCost(hcEstimate, totalYearsFromNow, 5.5, 20, inflationPct);
    const needYear = hcYear + spendingAtRet*Math.pow(1+inflationPct/100,y);
    ruleOf55Pool *= (1+yearReturn);
    otherPool *= (1+yearReturn);
    if (ruleOf55Pool >= needYear) ruleOf55Pool -= needYear;
    else { const sf = needYear-ruleOf55Pool; ruleOf55Pool=0; otherPool=Math.max(0,otherPool-sf); }
  }

  // Post-bridge drawdown — random return each year
  let runningBalance = ruleOf55Pool + otherPool;
  const postBridgeYears = Math.max(0, planEndAge - medicareAge);
  for (let y=0; y<postBridgeYears; y++) {
    const age = medicareAge + y;
    const yearsFromRet = age - retAge;
    const totalYearsFromNow = accumYears + bridgeYears + y;
    const yearReturn = randomNormal(meanReturn, stdDev) / 100;
    const spendingThisYear = spending * Math.pow(1+inflationPct/100, yearsFromRet);
    const hcYear = futureHealthcareCost(hcEstimate, totalYearsFromNow, 5.5, 20, inflationPct);
    const ssThisYear = householdSocialSecurityAtAge(assumptions, age, inflationPct);
    const spendYear = Math.max(0, spendingThisYear + hcYear - ssThisYear);
    runningBalance = runningBalance*(1+yearReturn) - spendYear;
    if (runningBalance < 0) return { success:false, finalBalance:0 };
  }
  return { success:true, finalBalance: Math.max(0,runningBalance) };
}

// Runs N simulations for a given retirement age, returns success rate %.
function runMonteCarloScenario(accounts, assumptions, retirementAgeOverride, numSimulations=1000) {
  const meanReturn = +(assumptions.moderate_rate_pct) || 7;
  const stdDev     = +(assumptions.return_volatility_pct) || 15;
  let successes = 0;
  const finalBalances = [];
  for (let i=0; i<numSimulations; i++) {
    const result = runOneMonteCarloPath(accounts, assumptions, retirementAgeOverride, meanReturn, stdDev);
    if (result.success) { successes++; finalBalances.push(result.finalBalance); }
  }
  finalBalances.sort((a,b)=>a-b);
  const median = finalBalances.length ? finalBalances[Math.floor(finalBalances.length/2)] : 0;
  return {
    retirementAge: retirementAgeOverride || assumptions.retirement_age,
    successRate: Math.round((successes/numSimulations)*100),
    medianFinalBalance: median,
    numSimulations,
  };
}

// Builds the comparison table: current plan + a few retirement age variants.
function buildMonteCarloComparison(accounts, assumptions, numSimulations=1000) {
  if (!assumptions) return [];
  const baseAge = assumptions.retirement_age;
  const variants = [
    { label: "Current Plan", age: baseAge },
    { label: `Retire at ${baseAge-2}`, age: baseAge-2 },
    { label: `Retire at ${baseAge+1}`, age: baseAge+1 },
    { label: `Retire at ${baseAge+3}`, age: baseAge+3 },
  ].filter(v => v.age > assumptions.current_age && v.age < (assumptions.plan_end_age||90));

  return variants.map(v => {
    const result = runMonteCarloScenario(accounts, assumptions, v.age, numSimulations);
    return { ...result, label: v.label };
  });
}

// Spending sensitivity — run the current plan at different annual spending levels.
// Answers: "what if we spend $10k less or more per year in retirement?"
function buildSpendingSensitivity(accounts, assumptions, numSimulations=500) {
  if (!assumptions) return [];
  // Coerce to number — Supabase returns numeric columns as strings sometimes
  const base = +(assumptions.annual_retirement_spending) || 110000;
  const variants = [
    { label: formatMoneyShort(base - 20000), spending: base - 20000 },
    { label: formatMoneyShort(base - 10000), spending: base - 10000 },
    { label: `${formatMoneyShort(base)} (current)`, spending: base, isCurrent: true },
    { label: formatMoneyShort(base + 10000), spending: base + 10000 },
    { label: formatMoneyShort(base + 20000), spending: base + 20000 },
  ].filter(v => v.spending > 0);

  return variants.map(v => {
    const modifiedAssumptions = { ...assumptions, annual_retirement_spending: v.spending };
    const result = runMonteCarloScenario(accounts, modifiedAssumptions, null, numSimulations);
    return { ...result, label: v.label, isCurrent: v.isCurrent || false };
  });
}

// Contribution impact — run the current plan with different monthly contribution levels.
// Answers: "what does saving $500 more per month actually do?"
function buildContributionImpact(accounts, assumptions, numSimulations=500) {
  if (!assumptions) return [];

  const variants = [
    { label: "Current", delta: 0, isCurrent: true },
    { label: "+$250/mo", delta: 250 },
    { label: "+$500/mo", delta: 500 },
    { label: "+$1,000/mo", delta: 1000 },
  ];

  return variants.map(v => {
    // Add a new Roth contribution stream representing the extra savings
    // Balance starts at 0, contributions start immediately — models new dedicated savings
    const modifiedAccounts = v.delta > 0
      ? [...accounts, {
          id: `extra-${v.delta}`,
          balance: 0,
          monthly_contribution: v.delta,
          employer_match: 0,
          account_type: "IRA",
          tax_treatment: "Roth",
          contribution_frequency: "monthly",
          name: `Extra $${v.delta}/mo`
        }]
      : accounts;
    const result = runMonteCarloScenario(modifiedAccounts, assumptions, null, numSimulations);
    return { ...result, label: v.label, delta: v.delta, isCurrent: v.isCurrent || false };
  });
}

// ─── FULL RETIREMENT DRAWDOWN SIMULATION ───────────────────────────────────────
// Three phases: accumulate to retirement_age, draw down Rule-of-55 funds through
// the bridge (retirement_age → bridge_end_age), then draw down combined balance
// through full retirement (bridge_end_age → planEndAge) to see if money lasts.
function simulateRetirementDrawdown(accounts, assumptions) {
  if (!assumptions) return null;

  const totalBalance   = accounts.reduce((s,a)=>s+(+(a.balance)||0),0);
  const totalMonthly   = accounts.reduce((s,a)=>s+effectiveMonthlyContribution(a),0);
  const retirementAge  = +(assumptions.retirement_age) || 59;
  const currentAge     = +(assumptions.current_age) || 44;
  const accumYears     = Math.max(0, retirementAge - currentAge);
  const contribGrowth  = +(assumptions.contribution_increase_pct) || 0;
  const inflationPct   = +(assumptions.inflation_pct) || 3;
  const accumRate      = +(assumptions.moderate_rate_pct) || 7;
  const drawdownRate   = +(assumptions.drawdown_rate_pct) || 5;
  const r              = drawdownRate/100;
  const planEndAge     = +(assumptions.plan_end_age) || 90;
  const medicareAge    = +(assumptions.medicare_age || assumptions.bridge_end_age) || 65;
  const ssClaimAge     = +(assumptions.ss_claim_age) || 67;
  const annualSpending = +(assumptions.annual_retirement_spending) || 110000;
  const hcEstimate     = +(assumptions.healthcare_estimate) || 0;

  const ruleOf55Share = totalBalance>0
    ? accounts.filter(ruleOf55Eligible).reduce((s,a)=>s+(+(a.balance)||0),0) / totalBalance
    : 0;

  // ── Phase 1: Accumulation (now → retirement_age) — track year by year for the full timeline ──
  const accumSchedule = [];
  {
    let bal = totalBalance;
    let contrib = totalMonthly;
    const rMonthly = accumRate/100/12;
    accumSchedule.push({ age: currentAge, balance: Math.round(bal) });
    for (let y=1; y<=accumYears; y++) {
      for (let m=0; m<12; m++) bal = bal*(1+rMonthly) + contrib;
      accumSchedule.push({ age: currentAge+y, balance: Math.round(bal) });
      contrib = contrib * (1 + contribGrowth/100);
    }
  }
  const balanceAtRetirement = accumSchedule.length ? accumSchedule[accumSchedule.length-1].balance : totalBalance;

  // Tax-adjust the accumulated balance the same way the simple model does
  const taxableMix = accounts.reduce((acc,a)=>{
    const share = totalBalance>0 ? (a.balance||0)/totalBalance : 0;
    return acc + share * (a.tax_treatment==="Roth"||a.tax_treatment==="HSA" ? 0 : a.tax_treatment==="taxable" ? 0.10 : 0.18);
  },0);
  const spendableAtRetirement = balanceAtRetirement * (1 - taxableMix);

  let ruleOf55Pool = spendableAtRetirement * ruleOf55Share;
  let otherPool = spendableAtRetirement * (1 - ruleOf55Share);

  // ── Phase 2: Bridge (retirement_age → medicare_age) — draw from Rule of 55 pool first ──
  const bridgeYears = Math.max(0, medicareAge - retirementAge);
  const spendingAtRetirement = annualSpending * Math.pow(1+inflationPct/100, accumYears);

  const bridgeSchedule = [];
  let bridgeShortfall = 0;
  for (let y=0; y<bridgeYears; y++) {
    const totalYearsFromNow = accumYears + y;
    const hcYear = futureHealthcareCost(hcEstimate, totalYearsFromNow, 5.5, 20, inflationPct);
    const spendYear = spendingAtRetirement * Math.pow(1+inflationPct/100, y);
    const needYear = hcYear + spendYear;

    ruleOf55Pool = ruleOf55Pool * (1+r);
    otherPool = otherPool * (1+r);

    if (ruleOf55Pool >= needYear) {
      ruleOf55Pool -= needYear;
    } else {
      const shortfall = needYear - ruleOf55Pool;
      bridgeShortfall += shortfall;
      ruleOf55Pool = 0;
      otherPool = Math.max(0, otherPool - shortfall);
    }
    bridgeSchedule.push({ age: retirementAge+y, balance: Math.round(ruleOf55Pool+otherPool), ruleOf55Pool: Math.round(ruleOf55Pool), otherPool: Math.round(otherPool), needYear: Math.round(needYear) });
  }

  const balanceAtBridgeEnd = ruleOf55Pool + otherPool;

  // ── Phase 3: Full retirement drawdown (medicare_age → plan_end_age) ──
  // Healthcare grows faster than inflation for an initial accelerated window (capped at ~20yrs
  // total from now), then reverts to general inflation — uncapped compounding for 40+ years
  // would make healthcare alone exceed total spending, which isn't a realistic assumption.
  // Social Security only kicks in once ssClaimAge is reached, and is itself COLA-adjusted.
  const postBridgeYears = Math.max(0, planEndAge - medicareAge);
  let runningBalance = balanceAtBridgeEnd;
  const drawdownSchedule = [];
  let ranOutAtAge = null;

  for (let y=0; y<postBridgeYears; y++) {
    const age = medicareAge + y;
    const yearsFromRetirement = age - retirementAge;
    const totalYearsFromNow = accumYears + bridgeYears + y;

    const spendingThisYear = annualSpending * Math.pow(1+inflationPct/100, yearsFromRetirement);
    const hcYear = futureHealthcareCost(hcEstimate, totalYearsFromNow, 5.5, 20, inflationPct);
    const ssThisYear = householdSocialSecurityAtAge(assumptions, age, inflationPct);

    const spendYear = Math.max(0, spendingThisYear + hcYear - ssThisYear);

    runningBalance = runningBalance * (1+r);
    runningBalance -= spendYear;

    if (runningBalance < 0 && ranOutAtAge===null) {
      ranOutAtAge = age;
    }
    if (runningBalance < 0) runningBalance = 0;
    drawdownSchedule.push({ age, balance: Math.round(runningBalance) });
  }

  const finalBalance = Math.max(0, runningBalance);
  const lastsFullPlan = ranOutAtAge === null;

  // ── Unified full-life timeline: current age → plan end age, combining all three phases ──
  const fullTimeline = [...accumSchedule, ...bridgeSchedule, ...drawdownSchedule];

  return {
    totalBalance, totalMonthly, accumYears,
    balanceAtRetirement, spendableAtRetirement, taxableMix,
    ruleOf55Share, bridgeYears, medicareAge, ssClaimAge, bridgeShortfall, bridgeSchedule,
    balanceAtBridgeEnd, postBridgeYears, planEndAge,
    drawdownSchedule, ranOutAtAge, lastsFullPlan, finalBalance,
    fullTimeline
  };
}

// ─── INCOME SOURCE TIMELINE ──────────────────────────────────────────────────
// Builds the "what pays for retirement, and when" picture — distinct age bands
// with the funding source(s) active in each, for the Income Timeline display.
function buildIncomeTimeline(assumptions, drawdown) {
  if (!assumptions || !drawdown) return [];
  const retAge      = +(assumptions.retirement_age) || 59;
  const annualSpend = +(assumptions.annual_retirement_spending) || 110000;
  const medicareAge = drawdown.medicareAge;
  const ssClaimAge  = drawdown.ssClaimAge;
  const planEnd     = drawdown.planEndAge;

  function avgNeedForRange(startAge, endAge) {
    const bridgeVals = (drawdown.bridgeSchedule||[]).filter(b=>b.age>=startAge && b.age<endAge).map(b=>b.needYear);
    if (bridgeVals.length) return bridgeVals.reduce((a,b)=>a+b,0)/bridgeVals.length;
    return null;
  }

  const bands = [];

  if (medicareAge > retAge) {
    const avgNeed = avgNeedForRange(retAge, medicareAge);
    bands.push({
      ageRange: `${retAge}–${medicareAge}`,
      sources: ["403(b) / 401(k) — Rule of 55"],
      detail: "Penalty-free withdrawals from current-employer plans. Self-funded healthcare (no Medicare yet).",
      avgAnnual: avgNeed,
      color: COLORS.purple,
    });
  }

  if (ssClaimAge > medicareAge) {
    bands.push({
      ageRange: `${medicareAge}–${ssClaimAge}`,
      sources: ["Medicare", "Portfolio withdrawals"],
      detail: "Healthcare costs drop with Medicare coverage. Still drawing from savings for living expenses — no Social Security yet.",
      avgAnnual: annualSpend,
      color: COLORS.blue,
    });
  } else {
    bands.push({
      ageRange: `${medicareAge}+`,
      sources: ["Medicare", "Social Security", "Portfolio"],
      detail: "Medicare and Social Security both active alongside portfolio withdrawals.",
      avgAnnual: Math.max(0, annualSpend - (+(assumptions.social_security_estimate)||0)),
      color: COLORS.blue,
    });
  }

  if (ssClaimAge >= medicareAge && ssClaimAge < planEnd) {
    bands.push({
      ageRange: `${ssClaimAge}–${planEnd}`,
      sources: ["Social Security", "Medicare", "Portfolio withdrawals"],
      detail: "Full income stack — Social Security and Medicare both active, portfolio covers the remaining gap.",
      avgAnnual: Math.max(0, annualSpend - (+(assumptions.social_security_estimate)||0)),
      color: COLORS.green,
    });
  }

  return bands;
}

// ─── FAMILY MILESTONES TIMELINE ──────────────────────────────────────────────
// Pulls together every dated/age-based milestone already tracked across modules
// into one chronological list — college, mortgage, retirement, Medicare, SS.
function buildFamilyMilestones(assump, collegeGoals, mort, mortMonths, retProj) {
  const milestones = [];
  const currentYear = new Date().getFullYear();
  const childColors = { Aubrey: COLORS.red, Blake: COLORS.green, Brayden: COLORS.amber };

  (collegeGoals||[]).forEach(g => {
    if (g?.target_year) {
      milestones.push({
        year: g.target_year,
        label: `${g.child_name||"Child"} starts college`,
        detail: g.notes || "Target start year",
        icon: "🎓",
        color: childColors[g.child_name] || COLORS.slate,
      });
    }
  });

  if (mort && mortMonths) {
    const payoffYear = currentYear + Math.ceil(mortMonths/12);
    milestones.push({
      year: payoffYear,
      label: "Mortgage paid off",
      detail: `${formatMoney(mort.current_balance)} balance, ${mort.interest_rate}% rate`,
      icon: "🏠",
      color: COLORS.blue,
    });
  }

  if (assump) {
    const retYear = currentYear + (assump.retirement_age - assump.current_age);
    milestones.push({
      year: retYear,
      label: `Retirement (age ${assump.retirement_age})`,
      detail: "Rule of 55 bridge years begin",
      icon: "🏖️",
      color: COLORS.purple,
    });

    if (retProj?.drawdown) {
      const medicareYear = currentYear + (retProj.drawdown.medicareAge - assump.current_age);
      milestones.push({
        year: medicareYear,
        label: `Medicare eligible (age ${retProj.drawdown.medicareAge})`,
        detail: "Bridge years end, healthcare costs drop",
        icon: "⚕️",
        color: COLORS.green,
      });

      const ssYear = currentYear + (retProj.drawdown.ssClaimAge - assump.current_age);
      milestones.push({
        year: ssYear,
        label: `Social Security claimed (age ${retProj.drawdown.ssClaimAge})`,
        detail: "Full income stack begins",
        icon: "💵",
        color: COLORS.green,
      });
    }
  }

  return milestones.sort((a,b) => a.year - b.year);
}

function calcRetirementProjection(accounts, assumptions) {
  if (!assumptions || !accounts) return null;
  const retirementAge  = +(assumptions.retirement_age) || 59;
  const currentAge     = +(assumptions.current_age) || 44;
  const contribGrowth  = +(assumptions.contribution_increase_pct) || 0;
  const inflationPct   = +(assumptions.inflation_pct) || 3;
  const annualSpending = +(assumptions.annual_retirement_spending) || 110000;
  const hcEstimate     = +(assumptions.healthcare_estimate) || 0;
  const ssEstimate     = +(assumptions.social_security_estimate) || 0;
  const withdrawalRate = +(assumptions.withdrawal_rate_pct) || 4;
  const medicareAge    = +(assumptions.medicare_age || assumptions.bridge_end_age) || 65;

  const totalBalance = accounts.reduce((s,a)=>s+(+(a.balance)||0),0);
  const totalMonthly = accounts.reduce((s,a)=>s+effectiveMonthlyContribution(a),0);
  const years = Math.max(0, retirementAge - currentAge);
  const growthRate = contribGrowth;
  const deflator = Math.pow(1 + inflationPct/100, years);

  const scenarios = [
    { label:"Conservative", rate:+(assumptions.conservative_rate_pct)||5, color:COLORS.slate },
    { label:"Moderate",     rate:+(assumptions.moderate_rate_pct)||7,     color:COLORS.blue },
    { label:"Aggressive",   rate:+(assumptions.aggressive_rate_pct)||9,   color:COLORS.green },
  ].map(s => {
    const result = futureValueWithGrowth(totalBalance, totalMonthly, s.rate, years, growthRate);
    return { ...s, projected: result.finalBalance, trajectory: result.trajectory, projectedTodaysDollars: result.finalBalance / deflator };
  });

  const moderate = scenarios.find(s=>s.label==="Moderate");
  const moderateProjected = moderate.projected;

  // Tax-adjusted spendable estimate — apply blended rate based on account mix proportions
  const taxableMix = accounts.reduce((acc,a)=>{
    const share = totalBalance>0 ? (a.balance||0)/totalBalance : 0;
    return acc + share * (a.tax_treatment==="Roth"||a.tax_treatment==="HSA" ? 0 : a.tax_treatment==="taxable" ? 0.10 : 0.18);
  },0);
  const spendableProjected = moderateProjected * (1 - taxableMix);
  const spendableTodaysDollars = spendableProjected / deflator;

  // Target number — gross (pre-tax) and inflation-adjusted versions
  const netAnnualNeed = Math.max(0, annualSpending - ssEstimate);
  const targetNumberToday = netAnnualNeed / (withdrawalRate/100);
  const targetNumberInflated = targetNumberToday * deflator;

  // Gap: both sides expressed in nominal dollars at the retirement year — apples to apples
  const gap = targetNumberInflated - spendableProjected;

  const r = (+(assumptions.moderate_rate_pct)||7)/100/12;
  const n = years*12;
  const fvOfCurrent = totalBalance * Math.pow(1+r, n);
  const remaining = targetNumberInflated - fvOfCurrent;
  const monthlyNeeded = remaining > 0 && n > 0
    ? remaining / ((Math.pow(1+r,n)-1)/r)
    : 0;

  // Early retirement bridge — healthcare grows faster than general spending
  const bridgeEndAge = medicareAge; // kept for backward-compat display naming
  const bridgeYears = Math.max(0, medicareAge - retirementAge);
  const spendingAtRetirement = annualSpending * Math.pow(1+inflationPct/100, years);
  let bridgeTotalNeeded = 0;
  for (let y=0; y<bridgeYears; y++) {
    const hcYear = futureHealthcareCost(hcEstimate, years+y, 5.5, 20, inflationPct);
    const spendYear = spendingAtRetirement * Math.pow(1+inflationPct/100, y);
    bridgeTotalNeeded += hcYear + spendYear;
  }

  // Rule of 55 — which balance is accessible penalty-free during bridge years
  const ruleOf55Balance = accounts.filter(ruleOf55Eligible).reduce((s,a)=>s+(a.balance||0),0);
  const ruleOf55Share = totalBalance>0 ? ruleOf55Balance/totalBalance : 0;
  const nonRuleOf55Balance = totalBalance - ruleOf55Balance;

  // ── PRIMARY STATUS: a single overall word (Excellent/On Track/Monitor/Risk), driven by
  // the full drawdown simulation. Avoids alarming language when the underlying picture is
  // actually fine — "Monitor" instead of "Tight," "Risk" instead of "Shortfall," etc.
  const drawdown = simulateRetirementDrawdown(accounts, assumptions);
  const gapPctOfTarget = targetNumberInflated>0 ? (gap/targetNumberInflated)*100 : 0;

  let status, statusLabel, statusColor, statusDetail;
  const bridgeOk = drawdown.bridgeShortfall<=0;
  const finalCushionPct = drawdown.lastsFullPlan && targetNumberInflated>0 ? (drawdown.finalBalance/targetNumberInflated)*100 : 0;

  if (drawdown.lastsFullPlan && bridgeOk && finalCushionPct>=50) {
    status="excellent"; statusLabel="Excellent"; statusColor=COLORS.green;
    statusDetail = `Plan lasts through age ${drawdown.planEndAge||90} with significant cushion.`;
  } else if (drawdown.lastsFullPlan && bridgeOk) {
    status="ontrack"; statusLabel="On Track"; statusColor=COLORS.green;
    statusDetail = `Plan lasts through age ${drawdown.planEndAge||90}.`;
  } else if (drawdown.lastsFullPlan && !bridgeOk) {
    status="monitor"; statusLabel="On Track — Monitor Bridge Years"; statusColor=COLORS.amber;
    statusDetail = `Full plan succeeds, but the ${retirementAge}-${drawdown.medicareAge} bridge needs attention.`;
  } else if (drawdown.ranOutAtAge && drawdown.ranOutAtAge>=80) {
    status="monitor"; statusLabel="Monitor Closely"; statusColor=COLORS.amber;
    statusDetail = `Funds projected to run low around age ${drawdown.ranOutAtAge} — adjustable with modest changes.`;
  } else {
    status="risk"; statusLabel="Retirement Plan Needs Adjustment"; statusColor=COLORS.red;
    statusDetail = `Funds projected to run low around age ${drawdown.ranOutAtAge||"—"} — meaningful changes recommended.`;
  }

  // Contribution increase needed to close the gap, as a % of current monthly contribution
  const contributionIncreasePctNeeded = totalMonthly>0 ? ((monthlyNeeded - totalMonthly)/totalMonthly)*100 : (monthlyNeeded>0?999:0);
  const bridgeCovered = drawdown.bridgeShortfall<=0;

  // Quick, non-AI recommendations based on the full drawdown picture
  const quickRecs = [];
  if (drawdown.bridgeShortfall>0) {
    quickRecs.push(`Bridge years (age ${retirementAge}-${drawdown.medicareAge}) come up ~${formatMoneyShort(drawdown.bridgeShortfall)} short even after using Rule of 55 funds — consider increasing contributions or building extra taxable savings earmarked for this window.`);
  }
  if (!drawdown.lastsFullPlan) {
    quickRecs.push(`At current trajectory, savings are projected to run low around age ${drawdown.ranOutAtAge} — well before ${drawdown.planEndAge}. Consider increasing contributions, reducing planned spending, or delaying retirement age.`);
  } else if (drawdown.finalBalance>0 && status==="green") {
    quickRecs.push(`Projected to last through age ${drawdown.planEndAge} with ${formatMoneyShort(drawdown.finalBalance)} remaining — on track at the moderate return assumption.`);
  }
  if (taxableMix>0.15) {
    quickRecs.push(`Most of your balance is pre-tax — consider Roth contributions or conversions over time to reduce future tax drag.`);
  }
  if (quickRecs.length===0) {
    quickRecs.push(`Current trajectory covers your full retirement plan through age ${drawdown.planEndAge} — maintain contributions and revisit assumptions annually.`);
  }

  return {
    totalBalance, totalMonthly, years, scenarios, growthRate,
    targetNumberToday, targetNumberInflated, inflationPct, deflator,
    spendableProjected, spendableTodaysDollars, taxableMix,
    gap, monthlyNeeded, netAnnualNeed,
    bridgeYears, bridgeTotalNeeded, bridgeEndAge,
    ruleOf55Balance, ruleOf55Share, nonRuleOf55Balance, bridgeCovered,
    status, statusLabel, statusColor, statusDetail, gapPctOfTarget, contributionIncreasePctNeeded, quickRecs,
    drawdown,
    trajectory: moderate.trajectory
  };
}

// ─── RETIREMENT READINESS CHECKLIST ───────────────────────────────────────────
// Surfaces the factors that already exist in retProj/monteCarloResults into one
// clear pass/watch/risk view — no new math, no composite score (deliberately
// avoided — a single number implies false precision a handful of inputs can't earn).
function buildReadinessChecklist(retProj, monteCarloResults, assumptions) {
  if (!retProj) return [];
  const items = [];

  const contributionGapPct = retProj.contributionIncreasePctNeeded;
  if (contributionGapPct <= 0) {
    items.push({ label: "Savings Rate", status: "good", detail: "Current contributions meet or exceed what's needed for the moderate scenario." });
  } else if (contributionGapPct <= 25) {
    items.push({ label: "Savings Rate", status: "watch", detail: `Contributions are close — increasing by ~${Math.round(contributionGapPct)}% would close the gap.` });
  } else {
    items.push({ label: "Savings Rate", status: "risk", detail: `Contributions would need to increase ~${Math.round(contributionGapPct)}% to fully close the gap at a moderate return.` });
  }

  if (retProj.gap <= 0) {
    items.push({ label: "Portfolio Size", status: "good", detail: "Projected balance meets or exceeds the inflation-adjusted target." });
  } else if (retProj.gapPctOfTarget <= 20) {
    items.push({ label: "Portfolio Size", status: "watch", detail: `Within ${Math.round(retProj.gapPctOfTarget)}% of target — a modest gap.` });
  } else {
    items.push({ label: "Portfolio Size", status: "risk", detail: `${Math.round(retProj.gapPctOfTarget)}% below the inflation-adjusted target.` });
  }

  if (retProj.bridgeCovered) {
    items.push({ label: "Rule of 55 Bridge", status: "good", detail: "403(b)/401(k) funds alone cover the bridge years without penalty." });
  } else {
    items.push({ label: "Rule of 55 Bridge", status: "risk", detail: `Bridge years come up ~${formatMoneyShort(retProj.drawdown.bridgeShortfall)} short even using Rule of 55 funds first.` });
  }

  const hcAtEnd = futureHealthcareCost(assumptions.healthcare_estimate||0, (retProj.drawdown.planEndAge-assumptions.current_age), 5.5, 20, retProj.inflationPct);
  const spendAtEnd = assumptions.annual_retirement_spending * Math.pow(1+retProj.inflationPct/100, retProj.drawdown.planEndAge-assumptions.retirement_age);
  const hcShareAtEnd = spendAtEnd>0 ? hcAtEnd/(hcAtEnd+spendAtEnd) : 0;
  if (hcShareAtEnd < 0.25) {
    items.push({ label: "Healthcare Risk", status: "good", detail: `Healthcare projected at ~${Math.round(hcShareAtEnd*100)}% of total spending by age ${retProj.drawdown.planEndAge}.` });
  } else if (hcShareAtEnd < 0.40) {
    items.push({ label: "Healthcare Risk", status: "watch", detail: `Healthcare grows to ~${Math.round(hcShareAtEnd*100)}% of total spending by age ${retProj.drawdown.planEndAge} — worth monitoring.` });
  } else {
    items.push({ label: "Healthcare Risk", status: "risk", detail: `Healthcare projected at ~${Math.round(hcShareAtEnd*100)}% of total spending by age ${retProj.drawdown.planEndAge} — a significant share.` });
  }

  if (retProj.taxableMix <= 0.10) {
    items.push({ label: "Tax Diversification", status: "good", detail: "Well diversified across Roth, taxable, and pre-tax accounts." });
  } else if (retProj.taxableMix <= 0.18) {
    items.push({ label: "Tax Diversification", status: "watch", detail: "Moderately concentrated in pre-tax accounts — Roth contributions would help." });
  } else {
    items.push({ label: "Tax Diversification", status: "risk", detail: "Heavily concentrated in pre-tax accounts — most withdrawals will be fully taxable." });
  }

  if (monteCarloResults) {
    const current = monteCarloResults.find(r=>r.label==="Current Plan");
    if (current) {
      if (current.successRate>=85) {
        items.push({ label: "Market Variation", status: "good", detail: `${current.successRate}% of simulated market paths succeed.` });
      } else if (current.successRate>=70) {
        items.push({ label: "Market Variation", status: "watch", detail: `${current.successRate}% of simulated market paths succeed — meaningful risk from bad market timing.` });
      } else {
        items.push({ label: "Market Variation", status: "risk", detail: `Only ${current.successRate}% of simulated market paths succeed — the steady-return view is optimistic.` });
      }
    }
  } else {
    items.push({ label: "Market Variation", status: "unknown", detail: "Run the Monte Carlo simulation below to see how market variation affects this." });
  }

  return items;
}

function calcCollegeProjection(savings, goal) {
  if (!savings || !goal) return null;
  const currentYear = new Date().getFullYear();
  const years = Math.max(0, goal.target_year - currentYear);
  const projected = futureValue(savings.balance||0, savings.monthly_contribution||0, 6, years);
  const gap = goal.target_amount - projected;
  const monthlyNeeded = years > 0
    ? Math.max(0, (goal.target_amount - (savings.balance||0)*Math.pow(1.06, years)) / (((Math.pow(1.06,years)-1)/(6/100))))
    : 0;
  return { projected, gap, years, monthlyNeeded };
}

// ─── POOLED MULTI-CHILD COLLEGE PROJECTION ────────────────────────────────────
// Since the 529 is one shared fund (not per-child), this sequences withdrawals by
// target year: the pool grows until each kid's start year, that kid's target amount
// is withdrawn (whether or not it's fully there — tracked as a shortfall if not),
// and the remainder keeps growing for the next kid in line.
function calcPooledCollegeProjection(savings, goals) {
  if (!savings || !goals || goals.length===0) return null;
  const currentYear = new Date().getFullYear();
  const sorted = [...goals].filter(g=>g.target_year).sort((a,b)=>a.target_year-b.target_year);
  if (sorted.length===0) return null;

  let balance = savings.balance||0;
  const monthlyContribution = savings.monthly_contribution||0;
  const rate = 6; // matches the existing single-child assumption, blended/today's-dollars
  let lastYear = currentYear;
  const perChild = [];

  sorted.forEach(g => {
    const yearsToThis = Math.max(0, g.target_year - lastYear);
    balance = futureValue(balance, monthlyContribution, rate, yearsToThis);
    const availableAtStart = balance;
    const shortfall = Math.max(0, g.target_amount - availableAtStart);
    const withdrawal = Math.min(g.target_amount, availableAtStart);
    balance = Math.max(0, availableAtStart - g.target_amount); // remainder carries forward, can go to 0 if short
    perChild.push({
      child_name: g.child_name,
      target_year: g.target_year,
      target_amount: g.target_amount,
      poolBalanceAtStart: Math.round(availableAtStart),
      shortfall: Math.round(shortfall),
      fullyFunded: shortfall<=0,
    });
    lastYear = g.target_year;
  });

  const totalTargets = sorted.reduce((s,g)=>s+g.target_amount,0);
  const totalShortfall = perChild.reduce((s,c)=>s+c.shortfall,0);
  const anyShortfall = perChild.some(c=>!c.fullyFunded);

  // Suggested combined monthly contribution to fully fund all three sequentially —
  // solved by working backward from the last kid's target, since the pool is shared.
  // Approximation: treat it as needing enough monthly contribution so the LAST withdrawal
  // (after all prior withdrawals) still clears its target, using the full horizon to the last kid.
  const finalGoal = sorted[sorted.length-1];
  const yearsToLast = Math.max(0, finalGoal.target_year - currentYear);
  let suggestedMonthly = monthlyContribution;
  if (anyShortfall && yearsToLast>0) {
    // Binary search for the monthly contribution that clears every kid's withdrawal in sequence
    let lo=monthlyContribution, hi=monthlyContribution+5000, iterations=0;
    while (hi-lo>1 && iterations<40) {
      const mid = (lo+hi)/2;
      let bal = savings.balance||0, ly=currentYear, ok=true;
      for (const g of sorted) {
        const yrs = Math.max(0, g.target_year-ly);
        bal = futureValue(bal, mid, rate, yrs);
        if (bal < g.target_amount) { ok=false; }
        bal = Math.max(0, bal-g.target_amount);
        ly = g.target_year;
      }
      if (ok) hi=mid; else lo=mid;
      iterations++;
    }
    suggestedMonthly = Math.round(hi);
  }

  return { perChild, totalTargets, totalShortfall, anyShortfall, suggestedMonthly, currentContribution: monthlyContribution };
}

function calcPayoffMonths(balance, annualRatePct, monthlyPayment) {
  const r = annualRatePct/100/12;
  if (monthlyPayment <= balance*r) return null;
  if (r === 0) return Math.ceil(balance/monthlyPayment);
  const months = Math.log(monthlyPayment/(monthlyPayment - balance*r)) / Math.log(1+r);
  return Math.ceil(months);
}
function calcTotalInterest(balance, annualRatePct, monthlyPayment, months) {
  if (!months) return null;
  return Math.round(monthlyPayment*months - balance);
}
function monthsToDate(months) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US",{month:"short",year:"numeric"});
}

function staleness(lastUpdated, thresholdDays=30) {
  if (!lastUpdated) return { stale:true, days:null };
  const days = -daysBetween(lastUpdated);
  return { stale: days > thresholdDays, days };
}

// ─── POOL CHEMISTRY ENGINE ────────────────────────────────────────────────────
const POOL_GALLONS = 17000;
const CALCIUM_HARDNESS = 200;

function calcAcidDose(currentPH, targetPH=7.4, alkalinity=90, gallons=POOL_GALLONS) {
  if(!currentPH || currentPH <= targetPH) return null;
  const phDrop = currentPH - targetPH;
  const alkFactor = (alkalinity || 90) / 100;
  const baseOzPer10k = phDrop * 12 * alkFactor;
  const oz = Math.round(baseOzPer10k * (gallons / 10000));
  return oz;
}

function calcSWGRecommendation(fc, cya, waterTemp) {
  const effectiveCYA = cya || 60;
  const targetFC = Math.max(2, effectiveCYA * 0.075);
  if(fc === null || fc === undefined) return null;
  const tempMultiplier = (waterTemp && waterTemp > 85) ? 1.15 : 1.0;
  if(fc > targetFC * 1.5) return { action:"lower", pct: null, msg:`FC is high (${fc} ppm). Lower SWG output or let it come down naturally. Target: ${targetFC.toFixed(1)} ppm` };
  if(fc < targetFC * 0.5) return { action:"raise", pct: null, msg:`FC critically low (${fc} ppm). Raise SWG to 100% temporarily. Minimum safe FC: ${targetFC.toFixed(1)} ppm` };
  return { action:"ok", pct: null, msg:`FC is in range. Maintain current SWG setting.` };
}

function calcShockThreshold(cya) {
  const effectiveCYA = cya || 60;
  return Math.round(effectiveCYA / 10);
}

function calcFCBurnRate(readings) {
  if(!readings || readings.length < 2) return null;
  const r1 = readings[0], r2 = readings[1];
  if(r1.free_chlorine === null || r2.free_chlorine === null) return null;
  const days = Math.abs(daysBetween(r2.date) - daysBetween(r1.date));
  if(days === 0) return null;
  const drop = r2.free_chlorine - r1.free_chlorine;
  return { perDay: (drop / days).toFixed(1), days, from: r2.free_chlorine, to: r1.free_chlorine };
}

function calcLangelier(ph, alkalinity, calcium=CALCIUM_HARDNESS, waterTemp=82) {
  if(!ph || !alkalinity) return null;
  const tempF = waterTemp || 82;
  const cal = calcium || CALCIUM_HARDNESS;
  const lsi = ph - (12.1 - Math.log10(cal) - Math.log10(alkalinity) + (0.009 * tempF));
  return Math.round(lsi * 100) / 100;
}

function fcEffectiveAtPH(ph) {
  const effectiveness = {7.0:73, 7.2:63, 7.4:50, 7.6:37, 7.8:24, 8.0:14, 8.2:9};
  const keys = Object.keys(effectiveness).map(Number).sort((a,b)=>a-b);
  const nearest = keys.reduce((prev,curr) => Math.abs(curr-ph) < Math.abs(prev-ph) ? curr : prev);
  return effectiveness[nearest] || 14;
}

function calcTargetSWG(fc, cya, waterTemp, pumpHours) {
  const targetFC = Math.max(3, (cya||60) * 0.075);
  const hours = pumpHours || 8;
  const tempBoost = (waterTemp && waterTemp > 85) ? 1.2 : 1.0;
  const base = Math.round(60 * tempBoost * (8 / hours));
  if (fc > targetFC * 1.5) return Math.max(20, base - 20);
  if (fc < targetFC * 0.5) return Math.min(100, base + 25);
  return Math.min(100, base);
}

// Seasonal SWG guidance — month-aware, independent of any single reading
function getSeasonalReminder() {
  const month = new Date().getMonth(); // 0=Jan
  const seasons = {
    0:{label:"January",swg:"20-30%",note:"Cell barely runs below 60°F. Manual chlorine may be needed if temps spike."},
    1:{label:"February",swg:"20-30%",note:"Still winter mode — minimal SWG output needed."},
    2:{label:"March",swg:"30-40%",note:"Start ramping up as water warms. Watch CYA/algae risk as bather load returns."},
    3:{label:"April",swg:"40-50%",note:"Spring ramp-up. Check salt cell after winter dormancy."},
    4:{label:"May",swg:"50-60%",note:"Heading into summer demand. Verify CYA is 70-75 before heavy use season."},
    5:{label:"June",swg:"60-70%",note:"Peak SC summer heat. FC burns fast — monitor closely."},
    6:{label:"July",swg:"60-70%",note:"Hottest stretch. Consider split pump schedule for circulation + overnight FC rebuild."},
    7:{label:"August",swg:"60-70%",note:"Still peak demand. Watch for storm-driven dilution."},
    8:{label:"September",swg:"50-60%",note:"Early fall — demand starts easing as temps drop."},
    9:{label:"October",swg:"40-50%",note:"Drop SWG as pump runs less and bather load fades. Watch for algae as people stop checking as often."},
    10:{label:"November",swg:"30-40%",note:"Cell efficiency drops below 60°F water. Consider reducing pump hours."},
    11:{label:"December",swg:"20-30%",note:"Cell stops producing chlorine below ~60°F. Switch to manual chlorine if pool stays open."},
  };
  return seasons[month];
}

function getChemRecommendations(last, readings, filterBaseline) {
  if(!last) return [];
  const recs = [];
  const shockMin = calcShockThreshold(last.cya);
  const burnRate = calcFCBurnRate(readings);
  const acidOz = calcAcidDose(last.ph, 7.4, last.alkalinity);
  // Use the most recent logged calcium hardness (could be from an earlier reading than `last`
  // if calcium isn't tested every time) — falls back to the placeholder if never logged.
  const calciumReading = readings.find(r=>r.calcium_hardness!==null && r.calcium_hardness!==undefined);
  const calciumValue = calciumReading ? calciumReading.calcium_hardness : null;
  const lsi = calcLangelier(last.ph, last.alkalinity, calciumValue||CALCIUM_HARDNESS, last.water_temp);
  const targetSWG = calcTargetSWG(last.free_chlorine, last.cya, last.water_temp, last.pump_hours);
  const phEffective = last.ph ? fcEffectiveAtPH(last.ph) : null;

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

  if(last.cc !== null && last.cc !== undefined && last.cc > 0.5) {
    recs.push({ priority:"high", param:"CC", icon:"⚠️",
      action:`CC elevated at ${last.cc} ppm — raise FC to break point`,
      detail:`Combined chlorine above 0.5 ppm means chloramines present. Raise SWG to 100% until FC reaches ${Math.round((last.cya||60)*0.4)} ppm (breakpoint). This is rare with SWG — check for algae or heavy bather load.`,
      color:COLORS.red });
  }

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

  if(!last.pump_hours || last.pump_hours < 8) {
    recs.push({ priority:"med", param:"Pump", icon:"🕐",
      action:"Increase pump run time to 8-10 hrs/day",
      detail:`Less than 8 hrs/day limits SWG chlorine production and circulation. Consider a split schedule — some daytime hours for circulation during swim use, plus 3-4 overnight hours to rebuild FC without UV loss. There's no single correct schedule; match it to when the pool is used and how fast FC drops.`,
      color:COLORS.blue });
  }

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

  if(last.filter_pressure && filterBaseline && last.filter_pressure > filterBaseline+10) {
    const delta = last.filter_pressure - filterBaseline;
    recs.push({ priority:"med", param:"Filter", icon:"🔧",
      action:`Filter pressure ${last.filter_pressure} psi (+${delta} above clean baseline) — clean cartridge`,
      detail:`Baseline after last clean was ${filterBaseline} psi. +10 psi or more above that indicates a dirty filter. Remove cartridge, hose off thoroughly, reinstall, then log the new baseline.`,
      color:COLORS.amber });
  } else if(last.filter_pressure && !filterBaseline && last.filter_pressure > 20) {
    recs.push({ priority:"med", param:"Filter", icon:"🔧",
      action:`Filter pressure ${last.filter_pressure} psi — clean cartridge`,
      detail:`No clean baseline set yet — using a general 20 psi threshold. Set a baseline after your next cartridge clean for a more accurate comparison.`,
      color:COLORS.amber });
  }

  if(!calciumValue) {
    recs.push({ priority:"low", param:"Ca", icon:"🔬",
      action:"Test calcium hardness",
      detail:`Using estimated 200 ppm. Vinyl pools target 150-250 ppm. Low calcium is corrosive to your Pentair cell over time. Log a reading to replace this estimate.`,
      color:COLORS.slate });
  } else if(calciumValue < 150) {
    recs.push({ priority:"med", param:"Ca", icon:"🔬",
      action:`Calcium hardness low at ${calciumValue} ppm`,
      detail:`Vinyl pools target 150-250 ppm. Low calcium is corrosive to your Pentair cell and vinyl liner over time. Add calcium chloride to raise it.`,
      color:COLORS.amber });
  } else if(calciumValue > 250) {
    recs.push({ priority:"low", param:"Ca", icon:"🔬",
      action:`Calcium hardness high at ${calciumValue} ppm`,
      detail:`Above 250 ppm risks scaling, especially combined with high pH or TA. Dilute by draining if it keeps climbing.`,
      color:COLORS.amber });
  }

  if(lsi !== null) {
    const lsiStatus = lsi < -0.3 ? "corrosive" : lsi > 0.3 ? "scaling" : "balanced";
    // Corrosive LSI is mathematically inevitable for vinyl/SWG pools at normal calcium levels
    // (150-250 ppm) — you'd need Ca>650 ppm to balance LSI, which would cause scaling on a vinyl
    // pool. LSI is a plaster/gunite metric. Corrosive alerts suppressed entirely.
    // Only alert on scaling (positive LSI) which is genuinely actionable regardless of pool type.
    if(lsiStatus === "scaling") {
      recs.push({ priority:"low", param:"LSI", icon:"📊",
        action:`LSI ${lsi} — scaling tendency`,
        detail:`Water has a slight tendency to deposit scale. First step: adjust pH toward 7.4. Monitor equipment and tile surfaces for deposits.`,
        color:COLORS.amber });
    }
  }

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
  // ── Layout ──────────────────────────────────────────────────────────────────
  app:{background:COLORS.navy,minHeight:"100vh",maxWidth:430,margin:"0 auto",fontFamily:"'Inter',system-ui,-apple-system,sans-serif",color:COLORS.white,position:"relative",paddingBottom:160},
  header:{background:COLORS.navyMid,padding:"16px 20px 14px",paddingTop:"calc(env(safe-area-inset-top) + 16px)",borderBottom:`1px solid ${COLORS.navyLight}`,position:"sticky",top:0,zIndex:10,backdropFilter:"blur(8px)"},
  headerRow:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  logo:{fontSize:20,fontWeight:800,letterSpacing:"-0.6px"},
  logoAccent:{color:COLORS.blue},
  dateLabel:{fontSize:13,color:COLORS.slate,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  screen:{padding:"20px 16px 8px",background:COLORS.navy},

  // ── Section labels ───────────────────────────────────────────────────────────
  sectionLabel:{fontSize:15,fontWeight:700,letterSpacing:"1px",color:COLORS.slate,textTransform:"uppercase",marginBottom:12,marginTop:32},

  // ── Cards ────────────────────────────────────────────────────────────────────
  card:{background:COLORS.navyMid,borderRadius:16,padding:"18px 20px",marginBottom:12,border:`1px solid ${COLORS.navyLight}`},
  statusCard:(c)=>({background:COLORS.navyMid,borderRadius:16,padding:"18px 20px",marginBottom:12,border:`1px solid ${COLORS.navyLight}`,borderLeft:`3px solid ${c}`}),

  // ── Badges ───────────────────────────────────────────────────────────────────
  badge:(c)=>({display:"inline-flex",alignItems:"center",background:c+"1a",color:c,borderRadius:20,padding:"3px 10px",fontSize:15,fontWeight:600,letterSpacing:"0.1px"}),
  memberDot:(m)=>({display:"inline-block",width:8,height:8,borderRadius:"50%",background:MEMBER_COLORS[m]||COLORS.slate,marginRight:6}),

  // ── Buttons ──────────────────────────────────────────────────────────────────
  btn:{background:COLORS.blue,color:"#fff",border:"none",borderRadius:12,padding:"14px 20px",fontSize:15,fontWeight:600,cursor:"pointer",width:"100%",marginTop:12,WebkitTapHighlightColor:"transparent",transition:"opacity 0.1s",letterSpacing:"-0.1px"},
  btnSm:{background:COLORS.navyLight,color:COLORS.slateLight,border:"none",borderRadius:10,padding:"8px 14px",fontSize:15,fontWeight:600,cursor:"pointer",flexShrink:0,WebkitTapHighlightColor:"transparent"},
  btnGreen:{background:COLORS.green+"1a",color:COLORS.green,border:`1px solid ${COLORS.green}33`,borderRadius:10,padding:"8px 14px",fontSize:15,fontWeight:600,cursor:"pointer",flexShrink:0,WebkitTapHighlightColor:"transparent"},
  btnCheck:{background:COLORS.green+"1a",color:COLORS.green,border:`1px solid ${COLORS.green}33`,borderRadius:8,padding:"6px 10px",fontSize:15,fontWeight:700,cursor:"pointer",flexShrink:0,lineHeight:1,minWidth:32,textAlign:"center",WebkitTapHighlightColor:"transparent"},
  btnRed:{background:COLORS.red+"1a",color:COLORS.red,border:`1px solid ${COLORS.red}33`,borderRadius:10,padding:"8px 14px",fontSize:15,fontWeight:600,cursor:"pointer",flexShrink:0,WebkitTapHighlightColor:"transparent"},
  btnAmber:{background:COLORS.amber+"1a",color:COLORS.amber,border:`1px solid ${COLORS.amber}33`,borderRadius:10,padding:"8px 14px",fontSize:15,fontWeight:600,cursor:"pointer",flexShrink:0,WebkitTapHighlightColor:"transparent"},

  // ── Inputs ───────────────────────────────────────────────────────────────────
  input:{background:"#1e2d4a",border:"1px solid #2d3f5c",borderRadius:12,padding:"13px 16px",fontSize:15,color:COLORS.white,width:"100%",boxSizing:"border-box",outline:"none",marginBottom:14,transition:"border-color 0.15s",WebkitAppearance:"none"},
  label:{fontSize:15,color:COLORS.slate,marginBottom:10,display:"block",fontWeight:600,letterSpacing:"0.2px"},
  row:{display:"flex",gap:12},col:{flex:1},

  // ── Stat cells ───────────────────────────────────────────────────────────────
  statGrid:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10},
  statCell:(c)=>({background:COLORS.navyMid,border:`1px solid ${COLORS.navyLight}`,borderTop:`3px solid ${c}`,borderRadius:12,padding:"14px 8px",textAlign:"center"}),
  statVal:{fontSize:22,fontWeight:700,letterSpacing:"-0.3px"},
  statLbl:{fontSize:15,color:COLORS.slate,marginTop:3,fontWeight:500},
  statTarget:{fontSize:15,color:COLORS.slate,marginTop:2},

  // ── Navigation ───────────────────────────────────────────────────────────────
  nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:COLORS.navyMid,borderTop:`1px solid ${COLORS.navyLight}`,display:"flex",zIndex:20,paddingBottom:"env(safe-area-inset-bottom)"},
  navItem:(a)=>({flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"10px 2px 8px",cursor:"pointer",background:"transparent",border:"none",color:a?COLORS.blue:COLORS.slate,fontSize:10,fontWeight:a?700:500,gap:3,borderTop:a?`2px solid ${COLORS.blue}`:"2px solid transparent",WebkitTapHighlightColor:"transparent",transition:"color 0.15s",letterSpacing:"-0.1px"}),

  // ── Modals / sheets ───────────────────────────────────────────────────────────
  modal:{position:"fixed",inset:0,background:"#000d",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"},
  sheet:{background:COLORS.navyMid,borderRadius:"24px 24px 0 0",padding:"12px 20px 52px",width:"100%",maxWidth:430,maxHeight:"93vh",overflowY:"auto",animation:"slideUp 0.28s cubic-bezier(0.34,1.06,0.64,1)"},
  sheetHandle:{width:44,height:4,borderRadius:2,background:COLORS.navyLight,margin:"0 auto 18px"},
  sheetTitle:{fontSize:20,fontWeight:700,marginBottom:20,letterSpacing:"-0.3px"},

  // ── Chips / tabs ─────────────────────────────────────────────────────────────
  chip:(a,c)=>({display:"inline-block",padding:"5px 13px",borderRadius:20,fontSize:15,fontWeight:600,cursor:"pointer",border:`1px solid ${a?c:COLORS.navyLight}`,background:a?c+"1a":"transparent",color:a?c:COLORS.slate,marginRight:6,marginBottom:10,WebkitTapHighlightColor:"transparent",transition:"all 0.12s"}),
  tabs:{display:"flex",background:COLORS.navyMid,borderRadius:12,padding:4,marginBottom:18,border:`1px solid ${COLORS.navyLight}`},
  tabBtn:(a)=>({flex:1,border:"none",borderRadius:9,padding:"9px 0",cursor:"pointer",background:a?COLORS.blue:"transparent",color:a?"#fff":COLORS.slate,fontSize:15,fontWeight:700,textTransform:"capitalize",transition:"all 0.15s",WebkitTapHighlightColor:"transparent",letterSpacing:"0.1px"}),

  // ── Misc ─────────────────────────────────────────────────────────────────────
  empty:{textAlign:"center",padding:"48px 20px",color:COLORS.slate,fontSize:15},
  progress:{height:4,background:COLORS.navyLight,borderRadius:2,marginTop:10,overflow:"hidden"},
  progressFill:(pct,c)=>({height:"100%",width:`${Math.min(100,Math.max(0,pct))}%`,background:c,borderRadius:2,transition:"width 0.4s ease-out"}),
  gcBanner:{background:COLORS.blue+"15",border:`1px solid ${COLORS.blue}33`,borderRadius:16,padding:"16px 20px",marginBottom:16},
  swipeHint:{fontSize:15,color:COLORS.slate,textAlign:"center",marginBottom:10,letterSpacing:"0.3px"},
};
// ─── ICONS ────────────────────────────────────────────────────────────────────
const I={
  home:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  cal:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  college:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  house:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  pool:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="10"/></svg>,
  finance:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.5:2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
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
function SwipeCard({children, onEdit, onDelete, style={}, activeId, setActiveId, id}){
  const ref       = useRef(null);
  const startX    = useRef(null);
  const isOpen    = activeId === id;
  const [confirming, setConfirming] = useState(false);
  const THRESHOLD = 60;
  const REVEAL    = 130;

  function onTouchStart(e){ startX.current = e.touches[0].clientX; }
  function onTouchEnd(e){
    if(startX.current===null)return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if(dx < -THRESHOLD) setActiveId(id);
    else if(dx > THRESHOLD){ setActiveId(null); setConfirming(false); }
    startX.current=null;
  }

  return (
    <div style={{position:"relative",marginBottom:10,borderRadius:12,overflow:"hidden"}}>
      {/* Action buttons revealed on swipe */}
      <div style={{position:"absolute",right:0,top:0,bottom:0,display:"flex",alignItems:"stretch",borderRadius:"0 12px 12px 0"}}>
        {!confirming
          ?<>
            <button onClick={()=>{onEdit();setActiveId(null);}} style={{width:65,background:COLORS.amber,color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,WebkitTapHighlightColor:"transparent"}}>
              <span style={{fontSize:18}}>✏️</span>Edit
            </button>
            <button onClick={()=>setConfirming(true)} style={{width:65,background:COLORS.red,color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,borderRadius:"0 12px 12px 0",WebkitTapHighlightColor:"transparent"}}>
              <span style={{fontSize:18}}>🗑️</span>Delete
            </button>
          </>
          :<div style={{display:"flex",alignItems:"stretch"}}>
            <button onClick={()=>setConfirming(false)} style={{width:65,background:COLORS.slate,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,WebkitTapHighlightColor:"transparent"}}>
              <span style={{fontSize:18}}>✕</span>Cancel
            </button>
            <button onClick={()=>{setConfirming(false);setActiveId(null);onDelete();}} style={{width:80,background:COLORS.red,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,borderRadius:"0 12px 12px 0",WebkitTapHighlightColor:"transparent"}}>
              <span style={{fontSize:18}}>🗑️</span>Confirm
            </button>
          </div>
        }
      </div>
      {/* Card content — slides left on swipe */}
      <div
        ref={ref}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          ...style,
          transform:`translateX(${isOpen?-(confirming?145:REVEAL):0}px)`,
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
        <div style={S.sheetHandle}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={S.sheetTitle}>{title}</div>
          <button onClick={onClose} style={{background:COLORS.navyLight,border:"none",color:COLORS.slate,cursor:"pointer",padding:"6px 8px",borderRadius:8,display:"flex",alignItems:"center"}}>{I.close()}</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Loading(){
  return(
    <div style={{padding:"4px 0"}}>
      {[0.9,0.7,0.85].map((w,i)=>(
        <div key={i} style={{background:COLORS.navyMid,borderRadius:16,padding:"18px 20px",marginBottom:12,border:`1px solid ${COLORS.navyLight}`,overflow:"hidden",position:"relative"}}>
          <div style={{height:14,width:`${w*100}%`,borderRadius:6,background:COLORS.navyLight,marginBottom:10}}/>
          <div style={{height:11,width:"55%",borderRadius:6,background:COLORS.navyLight,marginBottom:6}}/>
          <div style={{height:11,width:"35%",borderRadius:6,background:COLORS.navyLight}}/>
          <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,transparent 0%,${COLORS.navyLight}40 50%,transparent 100%)`,animation:"shimmer 1.5s infinite"}}/>
        </div>
      ))}
    </div>
  );
}

function EmptyState({icon, title, detail, action, onAction}){
  return(
    <div style={{textAlign:"center",padding:"48px 24px 40px"}}>
      <div style={{fontSize:40,marginBottom:14,opacity:0.6}}>{icon||"📋"}</div>
      <div style={{fontSize:16,fontWeight:700,color:COLORS.slateLight,marginBottom:8}}>{title||"Nothing here yet"}</div>
      {detail&&<div style={{fontSize:14,color:COLORS.slate,lineHeight:1.6,marginBottom:20,maxWidth:260,margin:"0 auto 20px"}}>{detail}</div>}
      {action&&onAction&&<button style={{...S.btn,width:"auto",padding:"11px 24px",fontSize:14,marginTop:0}} onClick={onAction}>{action}</button>}
    </div>
  );
}

function SwipeHint(){
  const [seen,setSeen] = useState(()=>{
    try{return sessionStorage.getItem("swipeHintSeen")==="1";}catch{return false;}
  });
  if(seen) return null;
  return(
    <div style={S.swipeHint} onClick={()=>{
      setSeen(true);
      try{sessionStorage.setItem("swipeHintSeen","1");}catch{}
    }}>← swipe left to edit or delete</div>
  );
}

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
    try{const{data:r,error}=await sb.from(table).insert(row);if(!error)await load();else{console.error(`Insert failed on ${table}:`,error);setData(p=>[{...row,id:String(Date.now())},...(p||[])]);}return r;}
    catch(e){console.error(`Insert exception on ${table}:`,e);setData(p=>[{...row,id:String(Date.now())},...(p||[])]);}
  }
  async function update(id,row){
    try{
      const{error}=await sb.from(table).eq("id",id).update(row);
      if(!error)await load();
      else{console.error(`Update failed on ${table}:`,error);setData(p=>p.map(r=>r.id===id?{...r,...row}:r));}
    }
    catch(e){console.error(`Update exception on ${table}:`,e);setData(p=>p.map(r=>r.id===id?{...r,...row}:r));}
  }
  async function remove(id){
    try{
      const{error}=await sb.from(table).eq("id",id).delete();
      if(!error)await load();
      else{console.error(`Delete failed on ${table}:`,error);setData(p=>p.filter(r=>r.id!==id));}
    }
    catch(e){console.error(`Delete exception on ${table}:`,e);setData(p=>p.filter(r=>r.id!==id));}
  }
  return{data:data||[],loading,reload:load,insert,update,remove};
}

// ─── CALENDAR BANNER ─────────────────────────────────────────────────────────
function CalendarBanner({gc}){
  if(gc.token)return(
    <div style={S.gcBanner}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:COLORS.blue,marginBottom:2}}>✓ Google Calendar connected</div>
          <div style={{fontSize:15,color:COLORS.slate}}>{gc.events.length} events loaded · {gc.loading?"Refreshing…":"Up to date"}</div>
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
      <div style={{fontSize:15,fontWeight:700,color:COLORS.blue,marginBottom:10}}>Connect Google Calendar</div>
      <div style={{fontSize:15,color:COLORS.slateLight,marginBottom:12,lineHeight:1.5}}>Sign in with Google to load your real family events automatically.</div>
      {gc.error&&<div style={{fontSize:15,color:COLORS.red,marginBottom:10}}>{gc.error}</div>}
      <button onClick={gc.signIn} style={{...S.btn,marginTop:0,display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:COLORS.white,color:COLORS.navy}}>
        {I.google()} Sign in with Google
      </button>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({onNavigate,gc}){
  const{data:homeMaint}   =useTable("home_maintenance","title",true);
  const{data:deadlines}   =useTable("college_deadlines","due_date",true);
  const readings          =useTable("pool_readings","logged_at");
  const poolMaint         =useTable("pool_maintenance","date");
  const assumptions       =useTable("retirement_assumptions","id",true);
  const accounts          =useTable("retirement_accounts","name",true);
  const notes             =useTable("notes","created_at");

  const [showFullSchedule,setShowFullSchedule] = useState(false);
  const [showAllActions,setShowAllActions]     = useState(false);
  const [showNotes,setShowNotes]               = useState(false);
  const [filter,setFilter]     = useState("All");
  const [overrides,setOverrides] = useState({});
  const [reassigning,setReassigning] = useState(null);
  const members=["All","Aubrey","Blake","Brayden","Matt","Kalee"];

  const assump     = assumptions.data[0];
  const retProj    = assump ? calcRetirementProjection(accounts.data, assump) : null;
  const lastReading = readings.data[0];
  const chemRecs   = lastReading ? getChemRecommendations(lastReading, readings.data, null) : [];
  const highChemRecs = chemRecs.filter(r=>r.priority==="high"||r.priority==="med");
  const overdueHomeMaint  = homeMaint.filter(m=>maintStatus(m)==="overdue");
  const dueSoonHomeMaint  = homeMaint.filter(m=>maintStatus(m)==="due-soon");
  const urgentDeadlines   = deadlines.filter(d=>!d.completed&&daysBetween(d.due_date)<=14);
  const upcomingDeadlines = deadlines.filter(d=>!d.completed&&daysBetween(d.due_date)>14&&daysBetween(d.due_date)<=60);

  const allEvents  = (gc.token?gc.events:[]).map(e=>({...e,member:overrides[e.id]||e.member}));
  const filtered   = allEvents.filter(e=>filter==="All"||e.member===filter);
  const next7Days  = Array.from({length:7},(_,i)=>{const d=new Date(todayReal);d.setDate(d.getDate()+i);return d.toISOString().split("T")[0];});
  const next30Days = Array.from({length:30},(_,i)=>{const d=new Date(todayReal);d.setDate(d.getDate()+i);return d.toISOString().split("T")[0];});
  const visibleDays      = showFullSchedule ? next30Days : next7Days;
  const eventsInWindow   = filtered.filter(e=>visibleDays.includes(e.date));
  const totalEventsNext7 = filtered.filter(e=>next7Days.includes(e.date)).length;

  // ── Action Center: three tiers ─────────────────────────────────────────────
  const overdue=[], thisWeek=[], upcoming=[];

  highChemRecs.forEach(r=>{
    const item={icon:"🏊",text:r.action,color:r.priority==="high"?COLORS.red:COLORS.amber,nav:"pool",detail:null};
    r.priority==="high" ? overdue.push(item) : thisWeek.push(item);
  });
  overdueHomeMaint.forEach(m=>{
    const days=-daysBetween(nextDueDate(m.last_completed,m.interval_days));
    overdue.push({icon:"🏡",text:m.title,color:COLORS.red,nav:"home-mgmt",detail:`${days}d overdue`});
  });
  dueSoonHomeMaint.forEach(m=>{
    const days=daysBetween(nextDueDate(m.last_completed,m.interval_days));
    thisWeek.push({icon:"🏡",text:m.title,color:COLORS.amber,nav:"home-mgmt",detail:`due in ${days}d`});
  });
  urgentDeadlines.forEach(d=>{
    const days=daysBetween(d.due_date);
    const item={icon:"🎓",text:d.title,color:days<=4?COLORS.red:COLORS.amber,nav:"college",detail:days===0?"Today":days<0?`${-days}d overdue`:`in ${days}d`};
    days<=4 ? overdue.push(item) : thisWeek.push(item);
  });
  upcomingDeadlines.forEach(d=>{
    upcoming.push({icon:"🎓",text:d.title,color:COLORS.slate,nav:"college",detail:`in ${daysBetween(d.due_date)}d`});
  });
  filtered.filter(e=>e.date===TODAY_STR).forEach(e=>{
    overdue.push({icon:"📅",text:e.title,color:COLORS.blue,nav:"home",detail:e.time||"Today"});
  });
  filtered.filter(e=>next7Days.includes(e.date)&&e.date!==TODAY_STR).slice(0,3).forEach(e=>{
    thisWeek.push({icon:"📅",text:e.title,color:MEMBER_COLORS[e.member]||COLORS.slate,nav:"home",detail:`${e.time||""} ${formatDate(e.date)}`.trim()});
  });

  const totalActions = overdue.length + thisWeek.length + upcoming.length;
  const focusItems   = [...overdue,...thisWeek].slice(0,5);

  // ── Module status ──────────────────────────────────────────────────────────
  const poolSt    = highChemRecs.length>0 ? {label:"Needs Attention",color:COLORS.amber,detail:highChemRecs[0]?.action?.split(" — ")[0]||""} : lastReading ? {label:"Good",color:COLORS.green,detail:"Chemistry balanced"} : {label:"No data",color:COLORS.slate,detail:"Log first reading"};
  const homeSt    = overdueHomeMaint.length>0 ? {label:"Overdue",color:COLORS.red,detail:`${overdueHomeMaint.length} item${overdueHomeMaint.length!==1?"s":""} overdue`} : dueSoonHomeMaint.length>0 ? {label:"Due Soon",color:COLORS.amber,detail:`${dueSoonHomeMaint.length} due this week`} : {label:"Good",color:COLORS.green,detail:"All tasks current"};
  const financeSt = retProj ? {label:retProj.statusLabel.split("—")[0].trim(),color:retProj.statusColor,detail:`Age ${assump?.retirement_age} plan`} : {label:"—",color:COLORS.slate,detail:""};
  const collegeSt = urgentDeadlines.length>0 ? {label:"Deadlines",color:COLORS.amber,detail:`${urgentDeadlines.length} within 2 weeks`} : {label:"On Track",color:COLORS.green,detail:"No urgent deadlines"};

  const recentActivity=[
    ...readings.data.slice(0,2).map(r=>({date:r.date,icon:"🏊",text:`Pool — pH ${r.ph||"—"}, FC ${r.free_chlorine||"—"}`,color:COLORS.blue})),
    ...poolMaint.data.slice(0,2).map(m=>({date:m.date,icon:"🔧",text:m.type,color:COLORS.slate})),
    ...deadlines.filter(d=>d.completed).slice(0,2).map(d=>({date:d.due_date,icon:"🎓",text:`${d.title} completed`,color:COLORS.green})),
    ...homeMaint.filter(m=>m.last_completed&&m.last_completed>=new Date(Date.now()-7*86400000).toISOString().split("T")[0]).slice(0,2).map(m=>({date:m.last_completed,icon:"🏡",text:`${m.title} — done`,color:COLORS.green})),
  ].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);

  function ActionItem({item,i,total}){
    return(
      <button onClick={()=>onNavigate(item.nav)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:"none",border:"none",padding:"10px 0",borderBottom:i<total-1?`1px solid ${COLORS.navyLight}`:"none",cursor:"pointer",textAlign:"left"}}>
        <div style={{width:32,height:32,borderRadius:8,background:item.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{item.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:600,color:COLORS.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.text}</div>
          {item.detail&&<div style={{fontSize:15,color:item.color,marginTop:1}}>{item.detail}</div>}
        </div>
        <div style={{fontSize:15,color:COLORS.slate,flexShrink:0}}>›</div>
      </button>
    );
  }

  return(
    <div style={S.screen}>

      {/* ── 1. TODAY'S FOCUS ── */}
      <div style={{background:COLORS.navyMid,borderRadius:16,padding:"20px 18px",marginBottom:16,border:`1px solid ${COLORS.navyLight}`,borderTop:`3px solid ${focusItems.length===0?COLORS.green:overdue.length>0?COLORS.red:COLORS.amber}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:focusItems.length>0?14:0}}>
          <div>
            <div style={{fontSize:15,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Today's Focus</div>
            <div style={{fontSize:26,fontWeight:800,letterSpacing:"-0.5px",lineHeight:1.1,color:focusItems.length===0?COLORS.green:overdue.length>0?COLORS.red:COLORS.amber}}>
              {focusItems.length===0?"All clear 👋":overdue.length>0?`${overdue.length} need${overdue.length===1?"s":""} action now`:`${thisWeek.length} due this week`}
            </div>
            <div style={{fontSize:13,color:COLORS.slate,marginTop:8,fontWeight:500,letterSpacing:"0.1px"}}>{formatToday()} · {totalEventsNext7} event{totalEventsNext7!==1?"s":""} this week</div>
          </div>
          {totalActions>0&&<div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
            <div style={{fontSize:24,fontWeight:800,color:overdue.length>0?COLORS.red:COLORS.amber}}>{totalActions}</div>
            <div style={{fontSize:15,color:COLORS.slate}}>actions</div>
          </div>}
        </div>
        {focusItems.length>0&&focusItems.map((item,i)=><ActionItem key={i} item={item} i={i} total={focusItems.length}/>)}
      </div>

      {/* ── 2. FAMILY HEALTH ── */}
      <div style={S.sectionLabel}>Family Health</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
        {[
          {module:"Pool",    ...poolSt,    nav:"pool"},
          {module:"House",   ...homeSt,    nav:"home-mgmt"},
          {module:"Finance", ...financeSt, nav:"finance"},
          {module:"College", ...collegeSt, nav:"college"},
        ].map((s,i)=>(
          <button key={i} onClick={()=>onNavigate(s.nav)} style={{background:COLORS.navyMid,border:`1px solid ${COLORS.navyLight}`,borderTop:`3px solid ${s.color}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",textAlign:"left"}}>
            <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>{s.module}</div>
            <div style={{fontSize:14,fontWeight:700,color:s.color,marginTop:6}}>{s.label}</div>
            <div style={{fontSize:12,color:COLORS.slate,marginTop:3,lineHeight:1.3}}>{s.detail}</div>
          </button>
        ))}
      </div>

      {/* ── 3. ACTION CENTER ── */}
      {totalActions>0&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={S.sectionLabel}>Action Center</div>
          {totalActions>5&&<button onClick={()=>setShowAllActions(p=>!p)} style={{fontSize:15,color:COLORS.blue,background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:12}}>{showAllActions?"Less ↑":`All ${totalActions} →`}</button>}
        </div>

        {overdue.length>0&&(
          <div style={{...S.card,background:COLORS.red+"11",borderColor:COLORS.red+"33",marginBottom:10}}>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.red,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>⚠️ Overdue · {overdue.length}</div>
            {overdue.slice(0,showAllActions?99:3).map((item,i)=><ActionItem key={i} item={item} i={i} total={Math.min(overdue.length,showAllActions?99:3)}/>)}
            {!showAllActions&&overdue.length>3&&<div style={{fontSize:15,color:COLORS.slate,paddingTop:6}}>+{overdue.length-3} more — tap "All" above</div>}
          </div>
        )}

        {thisWeek.length>0&&(
          <div style={{...S.card,background:COLORS.amber+"11",borderColor:COLORS.amber+"33",marginBottom:10}}>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.amber,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>📅 Due This Week · {thisWeek.length}</div>
            {thisWeek.slice(0,showAllActions?99:3).map((item,i)=><ActionItem key={i} item={item} i={i} total={Math.min(thisWeek.length,showAllActions?99:3)}/>)}
            {!showAllActions&&thisWeek.length>3&&<div style={{fontSize:15,color:COLORS.slate,paddingTop:6}}>+{thisWeek.length-3} more</div>}
          </div>
        )}

        {upcoming.length>0&&(showAllActions||overdue.length+thisWeek.length<=3)&&(
          <div style={{...S.card,background:COLORS.navyLight,marginBottom:10}}>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>🔮 Upcoming · {upcoming.length}</div>
            {upcoming.slice(0,3).map((item,i)=><ActionItem key={i} item={item} i={i} total={Math.min(upcoming.length,3)}/>)}
          </div>
        )}
      </>}

      {totalActions===0&&(
        <div style={{...S.card,background:COLORS.green+"11",borderColor:COLORS.green+"33",textAlign:"center",padding:"20px 16px",marginBottom:16}}>
          <div style={{fontSize:20,marginBottom:10}}>✅</div>
          <div style={{fontSize:15,fontWeight:700,color:COLORS.green}}>Nothing needs attention</div>
          <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>All modules are current.</div>
        </div>
      )}

      {/* ── 4. THIS WEEK ── */}
      {gc.token&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={S.sectionLabel}>This Week</div>
          <button onClick={()=>setShowFullSchedule(p=>!p)} style={{fontSize:15,color:COLORS.blue,background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:12}}>{showFullSchedule?"Collapse ↑":"30 days →"}</button>
        </div>
        <div style={{marginBottom:10}}>
          {members.map(m=><span key={m} style={S.chip(filter===m,MEMBER_COLORS[m]||COLORS.blue)} onClick={()=>setFilter(m)}>{m}</span>)}
        </div>
        {gc.loading?<Loading/>:(
          eventsInWindow.length===0
            ?<EmptyState icon="📅" title={showFullSchedule?"No events in the next 30 days":"No events this week"} detail="Connect your Google Calendar or add events to see them here."/>
            :visibleDays.map(day=>{
              const evs=filtered.filter(e=>e.date===day);
              if(!evs.length)return null;
              const isToday=day===TODAY_STR;
              return(
                <div key={day}>
                  <div style={{fontSize:15,fontWeight:700,color:isToday?COLORS.blue:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:10}}>{isToday?"Today":formatDateFull(day)}</div>
                  {evs.map(e=>(
                    <div key={e.id} style={{...S.card,borderLeft:`3px solid ${MEMBER_COLORS[e.member]||COLORS.slate}`,marginBottom:10,padding:"12px 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:600}}>{e.title}</div>
                          <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{e.time||"All day"}{e.location?` · ${e.location}`:""}</div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                          <span style={S.badge(MEMBER_COLORS[e.member]||COLORS.slate)}>{e.member}</span>
                          <button style={{...S.btnSm,fontSize:15,padding:"3px 8px"}} onClick={()=>setReassigning(reassigning===e.id?null:e.id)}>reassign</button>
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
            })
        )}
      </>}

      {!gc.token&&(
        <div style={{...S.statusCard(COLORS.blue),marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:15,color:COLORS.slateLight}}>Connect Calendar to see your week here.</div>
            <button style={S.btnSm} onClick={gc.signIn}>Connect</button>
          </div>
        </div>
      )}

      {/* ── 5. RECENT ACTIVITY ── */}
      {recentActivity.length>0&&<>
        <div style={S.sectionLabel}>Recent Activity</div>
        {recentActivity.map((a,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 0",borderBottom:i<recentActivity.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
            <span style={{fontSize:19,flexShrink:0}}>{a.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:14,color:COLORS.slateLight}}>{a.text}</div>
              <div style={{fontSize:12,color:COLORS.slate,marginTop:2}}>{formatDate(a.date)}</div>
            </div>
          </div>
        ))}
      </>}

      {/* ── NOTES ── */}
      {notes.data.length>0&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={S.sectionLabel}>Notes</div>
          <button onClick={()=>setShowNotes(p=>!p)} style={{fontSize:12,color:COLORS.blue,background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:12}}>
            {showNotes?"Hide ↑":`${notes.data.length} note${notes.data.length!==1?"s":""} →`}
          </button>
        </div>
        {/* Preview of most recent note when collapsed */}
        {!showNotes&&notes.data[0]&&(
          <div style={{...S.card,marginBottom:10,cursor:"pointer"}} onClick={()=>setShowNotes(true)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{flex:1,minWidth:0}}>
                {notes.data[0].title&&<div style={{fontSize:14,fontWeight:700,marginBottom:2}}>{notes.data[0].title}</div>}
                <div style={{fontSize:13,color:COLORS.slate,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{notes.data[0].body}</div>
              </div>
              <span style={{...S.badge(COLORS.slate),flexShrink:0,marginLeft:10}}>{notes.data[0].tag||"General"}</span>
            </div>
          </div>
        )}
        {/* All notes when expanded */}
        {showNotes&&notes.data.map((n,i)=>(
          <div key={n.id} style={{...S.card,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                {n.title&&<div style={{fontSize:14,fontWeight:700,marginBottom:4}}>{n.title}</div>}
                <div style={{fontSize:13,color:COLORS.slateLight,lineHeight:1.5}}>{n.body}</div>
                <div style={{fontSize:11,color:COLORS.slate,marginTop:8}}>{new Date(n.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
              </div>
              <span style={{...S.badge(COLORS.slate),flexShrink:0,marginLeft:10}}>{n.tag||"General"}</span>
            </div>
          </div>
        ))}
      </>}

    </div>
  );
}



// Junior year → application timeline milestones for Aubrey (Class of 2028)
// Each milestone has a target date, category, and completion check based on data
function calcAubreyTimeline(deadlines, scores, schools, essays) {
  const today = new Date(todayReal);
  const milestones = [
    { id:"psat",       label:"PSAT / NMSQT",          date:"2025-10-15", category:"test",        detail:"October junior year" },
    { id:"collegeList",label:"Build college list",     date:"2026-03-01", category:"planning",    detail:"10-15 schools across reach/target/safety" },
    { id:"campusVisit",label:"Spring campus visits",   date:"2026-05-01", category:"visit",       detail:"Visit 3-5 schools before summer" },
    { id:"satPrep",    label:"SAT/ACT prep",           date:"2026-05-15", category:"test",        detail:"Plan test dates and prep strategy" },
    { id:"sat1",       label:"SAT/ACT — first attempt",date:"2026-06-07", category:"test",        detail:"Aim for score above target range" },
    { id:"essayDraft", label:"Common App essay draft", date:"2026-07-15", category:"essay",       detail:"Start main personal statement" },
    { id:"activ",      label:"Activities list draft",  date:"2026-07-31", category:"application", detail:"150-char descriptions for all activities" },
    { id:"sat2",       label:"SAT/ACT — second attempt",date:"2026-08-23",category:"test",        detail:"Retake if score can improve" },
    { id:"earlyApp",   label:"Early apps open",        date:"2026-08-01", category:"application", detail:"Common App opens August 1" },
    { id:"edea",       label:"ED/EA deadlines",        date:"2026-11-01", category:"application", detail:"Most ED/EA due Nov 1 or Nov 15" },
    { id:"regular",    label:"Regular Decision",       date:"2027-01-01", category:"application", detail:"Most RD deadlines Jan 1–15" },
    { id:"finAid",     label:"Financial aid (FAFSA)",  date:"2026-10-01", category:"application", detail:"FAFSA opens Oct 1 — submit early" },
    { id:"decisions",  label:"Decisions & commit",     date:"2027-05-01", category:"planning",    detail:"National Decision Day: May 1" },
  ];

  // Auto-complete logic based on actual data
  const hasScores = scores && scores.length > 0;
  const hasSchools = schools && schools.length >= 5;
  const hasVisit = deadlines && deadlines.some(d=>d.completed&&d.category==="visit");
  const hasEssay = essays && essays.some(e=>e.status==="submitted"||e.status==="review");
  const hasApplied = schools && schools.some(s=>s.status==="applied"||s.status==="accepted");

  return milestones.map(m => {
    const mDate = new Date(m.date);
    const isPast = mDate < today;
    const daysAway = Math.round((mDate - today) / 86400000);

    // Auto-detect completion
    let completed = false;
    if (m.id==="sat1"||m.id==="sat2") completed = hasScores;
    else if (m.id==="collegeList") completed = hasSchools;
    else if (m.id==="campusVisit") completed = hasVisit;
    else if (m.id==="essayDraft") completed = hasEssay;
    else if (m.id==="edea"||m.id==="regular") completed = hasApplied;
    else if (m.id==="psat") completed = isPast; // assume done if date passed

    return { ...m, completed, isPast, daysAway };
  });
}

function College(){
  const [tab,setTab]             = useState("deadlines");
  const deadlines                = useTable("college_deadlines","due_date",true);
  const schools                  = useTable("college_schools","name",true);
  const scores                   = useTable("sat_scores","date");
  const testPlan                 = useTable("college_test_plan","target_date",true);
  const essays                   = useTable("college_essays","due_date",true);
  const collegeGoals             = useTable("college_goal","id",true);
  const collegeSav               = useTable("college_savings","id",true);
  const [showModal,setShowModal] = useState(null);
  const [editItem,setEditItem]   = useState(null);
  const [form,setForm]           = useState({});
  const [activeSwipe,setActiveSwipe] = useState(null);
  const [showTimeline,setShowTimeline] = useState(false);
  const [showCompleted,setShowCompleted] = useState(false);

  const catColor={test:COLORS.purple,application:COLORS.blue,visit:COLORS.green,essay:COLORS.amber,planning:COLORS.slate,other:COLORS.slate};
  const statusColors={researching:COLORS.slate,target:COLORS.blue,applying:COLORS.amber,applied:COLORS.purple,accepted:COLORS.green,rejected:COLORS.red};
  const appTypeColors={ED:COLORS.red,EA:COLORS.amber,Regular:COLORS.blue,Rolling:COLORS.slate};
  const matchColors={Reach:COLORS.red,Target:COLORS.blue,Safety:COLORS.green};
  const essayStatusColors={"not started":COLORS.slate,drafting:COLORS.amber,review:COLORS.blue,submitted:COLORS.green};
  const pending=deadlines.data.filter(d=>!d.completed).sort((a,b)=>new Date(a.due_date)-new Date(b.due_date));
  const done=deadlines.data.filter(d=>d.completed);

  const timeline = calcAubreyTimeline(deadlines.data, scores.data, schools.data, essays.data);
  const completedMilestones = timeline.filter(m=>m.completed).length;
  const nextMilestone = timeline.find(m=>!m.completed);
  const overdueDeadlines = pending.filter(d=>daysBetween(d.due_date)<0);
  const thisWeekDeadlines = pending.filter(d=>daysBetween(d.due_date)>=0&&daysBetween(d.due_date)<=7);
  const soonDeadlines = pending.filter(d=>daysBetween(d.due_date)>7&&daysBetween(d.due_date)<=30);
  const upcomingDeadlines = pending.filter(d=>daysBetween(d.due_date)>30);

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
  async function saveEssay(){
    if(!form.title)return;
    const row={title:form.title,school:form.school||"",due_date:form.due_date||null,status:form.status||"not started",word_count:form.word_count||"",notes:form.notes||""};
    if(editItem) await essays.update(editItem.id,row);
    else await essays.insert(row);
    closeModal();
  }

  return(
    <div style={S.screen}>

      {/* ── Aubrey header card with timeline progress ── */}
      <div style={{...S.card,background:COLORS.navyLight,borderLeft:`3px solid ${MEMBER_COLORS.Aubrey}`,marginBottom:16}}>
        <div style={{fontSize:15,color:COLORS.red,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase"}}>Aubrey · Class of 2028</div>
        <div style={{fontSize:19,fontWeight:700,marginTop:2}}>Junior Year — College Planning</div>
        <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>
          {schools.data.filter(s=>s.status==="target"||s.status==="applying").length} target schools · {pending.length} open deadline{pending.length!==1?"s":""}
        </div>

        {/* Progress bar */}
        <div style={{marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:15,color:COLORS.slate,fontWeight:600}}>{completedMilestones} of {timeline.length} milestones complete</div>
            <div style={{fontSize:15,color:COLORS.blue}}>{Math.round(completedMilestones/timeline.length*100)}%</div>
          </div>
          <div style={S.progress}>
            <div style={S.progressFill(completedMilestones/timeline.length*100, COLORS.blue)}/>
          </div>
          {nextMilestone&&<div style={{fontSize:15,color:COLORS.slateLight,marginTop:10}}>
            Next: <span style={{color:COLORS.white,fontWeight:600}}>{nextMilestone.label}</span>
            {nextMilestone.daysAway>0?` — in ${nextMilestone.daysAway}d`:nextMilestone.daysAway===0?" — Today":" — Overdue"}
          </div>}
        </div>

        <button onClick={()=>setShowTimeline(p=>!p)} style={{fontSize:15,color:COLORS.blue,background:"none",border:"none",cursor:"pointer",padding:0,marginTop:10,textDecoration:"underline"}}>
          {showTimeline?"Hide timeline":"View full timeline →"}
        </button>

        {showTimeline&&(
          <div style={{marginTop:12}}>
            {timeline.map((m,i)=>(
              <div key={m.id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 0",borderBottom:i<timeline.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:m.completed?COLORS.green:m.isPast&&!m.completed?COLORS.red:COLORS.navyLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,marginTop:1}}>
                  {m.completed?"✓":m.isPast?"!":""}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:600,color:m.completed?COLORS.slate:m.isPast?COLORS.red:COLORS.white}}>{m.label}</div>
                  <div style={{fontSize:15,color:COLORS.slate,marginTop:1}}>
                    {formatDate(m.date)} · {m.detail}
                  </div>
                </div>
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

          {/* Overdue */}
          {overdueDeadlines.length>0&&<>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.red,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:10}}>⚠️ Overdue · {overdueDeadlines.length}</div>
            {overdueDeadlines.map(d=>(
              <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                onEdit={()=>openEdit("deadline",d)}
                onDelete={()=>{deadlines.remove(d.id);setActiveSwipe(null);}}
                style={S.statusCard(COLORS.red)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,paddingRight:10}}>
                    <div style={{fontSize:15,fontWeight:600}}>{d.title}</div>
                    {d.school&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{d.school}</div>}
                    <div style={{display:"flex",gap:6,marginTop:10,alignItems:"center"}}>
                      <span style={S.badge(catColor[d.category]||COLORS.slate)}>{d.category}</span>
                      <span style={{fontSize:15,color:COLORS.red,fontWeight:700}}>{Math.abs(daysBetween(d.due_date))}d overdue</span>
                    </div>
                  </div>
                  <button style={S.btnCheck} onClick={()=>deadlines.update(d.id,{completed:true})}>✓</button>
                </div>
              </SwipeCard>
            ))}
          </>}

          {/* Due this week */}
          {thisWeekDeadlines.length>0&&<>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.amber,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:overdueDeadlines.length>0?16:4}}>📅 Due This Week · {thisWeekDeadlines.length}</div>
            {thisWeekDeadlines.map(d=>{
              const days=daysBetween(d.due_date);
              return(
                <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                  onEdit={()=>openEdit("deadline",d)}
                  onDelete={()=>{deadlines.remove(d.id);setActiveSwipe(null);}}
                  style={S.statusCard(COLORS.amber)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1,paddingRight:10}}>
                      <div style={{fontSize:15,fontWeight:600}}>{d.title}</div>
                      {d.school&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{d.school}</div>}
                      <div style={{display:"flex",gap:6,marginTop:10,alignItems:"center"}}>
                        <span style={S.badge(catColor[d.category]||COLORS.slate)}>{d.category}</span>
                        <span style={{fontSize:15,color:COLORS.amber,fontWeight:700}}>{days===0?"Today":`in ${days}d`}</span>
                      </div>
                    </div>
                    <button style={S.btnCheck} onClick={()=>deadlines.update(d.id,{completed:true})}>✓</button>
                  </div>
                </SwipeCard>
              );
            })}
          </>}

          {/* Due this month */}
          {soonDeadlines.length>0&&<>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.blue,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:16}}>📌 This Month · {soonDeadlines.length}</div>
            {soonDeadlines.map(d=>{
              const days=daysBetween(d.due_date);
              return(
                <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                  onEdit={()=>openEdit("deadline",d)}
                  onDelete={()=>{deadlines.remove(d.id);setActiveSwipe(null);}}
                  style={S.statusCard(COLORS.blue)}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1,paddingRight:10}}>
                      <div style={{fontSize:15,fontWeight:600}}>{d.title}</div>
                      {d.school&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{d.school}</div>}
                      <div style={{display:"flex",gap:6,marginTop:10,alignItems:"center"}}>
                        <span style={S.badge(catColor[d.category]||COLORS.slate)}>{d.category}</span>
                        <span style={{fontSize:15,color:COLORS.slate}}>{formatDate(d.due_date)} · in {days}d</span>
                      </div>
                    </div>
                    <button style={S.btnCheck} onClick={()=>deadlines.update(d.id,{completed:true})}>✓</button>
                  </div>
                </SwipeCard>
              );
            })}
          </>}

          {/* Upcoming */}
          {upcomingDeadlines.length>0&&<>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:16}}>🔮 Upcoming · {upcomingDeadlines.length}</div>
            {upcomingDeadlines.map(d=>{
              const days=daysBetween(d.due_date);
              return(
                <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                  onEdit={()=>openEdit("deadline",d)}
                  onDelete={()=>{deadlines.remove(d.id);setActiveSwipe(null);}}
                  style={S.card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1,paddingRight:10}}>
                      <div style={{fontSize:15,fontWeight:600}}>{d.title}</div>
                      {d.school&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{d.school}</div>}
                      <div style={{display:"flex",gap:6,marginTop:10,alignItems:"center"}}>
                        <span style={S.badge(catColor[d.category]||COLORS.slate)}>{d.category}</span>
                        <span style={{fontSize:15,color:COLORS.slate}}>{formatDate(d.due_date)} · in {days}d</span>
                      </div>
                    </div>
                    <button style={S.btnCheck} onClick={()=>deadlines.update(d.id,{completed:true})}>✓</button>
                  </div>
                </SwipeCard>
              );
            })}
          </>}

          {pending.length===0&&<EmptyState icon="✅" title="No open deadlines" detail="All caught up. Add SAT dates, application deadlines, and campus visits to track them here."/>}

          {/* Completed */}
          {done.length>0&&<>
            <button onClick={()=>setShowCompleted(p=>!p)} style={{...S.btnSm,width:"100%",textAlign:"center",marginTop:12,marginBottom:10}}>
              {showCompleted?"Hide":"Show"} {done.length} completed
            </button>
            {showCompleted&&done.map(d=>(
              <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                onEdit={()=>openEdit("deadline",d)}
                onDelete={()=>{deadlines.remove(d.id);setActiveSwipe(null);}}
                style={{...S.card,opacity:0.5}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:15,textDecoration:"line-through",color:COLORS.slate}}>{d.title}</div>
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
          <SwipeHint/>
          {["target","researching","applying","applied","accepted","rejected"].map(status=>{
            const group=schools.data.filter(s=>s.status===status);
            if(!group.length)return null;
            const nextAction={
              researching:"Next: Schedule a campus visit or virtual info session",
              target:"Next: Start Common App school list — add supplement requirements",
              applying:"Next: Draft supplemental essays and request recommendations",
              applied:"Next: Monitor portal for interview invites or additional materials",
              accepted:"Next: Compare financial aid packages and visit day",
              rejected:null,
            };
            return(
              <div key={status}>
                <div style={S.sectionLabel}>{status.charAt(0).toUpperCase()+status.slice(1)}</div>
                {group.map(s=>(
                  <SwipeCard key={s.id} id={s.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                    onEdit={()=>openEdit("school",s)}
                    onDelete={()=>{schools.remove(s.id);setActiveSwipe(null);}}
                    style={S.statusCard(statusColors[s.status])}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:15,fontWeight:600}}>{s.name}</div>
                      <select value={s.status} onChange={e=>schools.update(s.id,{status:e.target.value})}
                        style={{background:COLORS.navyLight,color:COLORS.slateLight,border:"none",borderRadius:6,padding:"4px 8px",fontSize:13,cursor:"pointer"}}>
                        {["researching","target","applying","applied","accepted","rejected"].map(st=><option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                    <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap",alignItems:"center"}}>
                      {s.match_level&&<span style={S.badge(matchColors[s.match_level]||COLORS.slate)}>{s.match_level}</span>}
                      {s.app_type&&<span style={S.badge(appTypeColors[s.app_type]||COLORS.slate)}>{s.app_type}</span>}
                      {s.app_deadline&&<span style={{fontSize:13,color:COLORS.slate}}>Due {formatDate(s.app_deadline)}</span>}
                    </div>
                    {s.visit_notes&&<div style={{fontSize:13,color:COLORS.slateLight,marginTop:10,fontStyle:"italic",lineHeight:1.4}}>📝 {s.visit_notes}</div>}
                    {nextAction[s.status]&&<div style={{fontSize:12,color:statusColors[s.status]||COLORS.slate,marginTop:8,fontWeight:600}}>→ {nextAction[s.status]}</div>}
                  </SwipeCard>
                ))}
              </div>
            );
          })}
          {schools.data.length===0&&<EmptyState icon="🏫" title="No schools added yet" detail="Add schools to your list — reach, target, and safety."/>}
          <button style={S.btn} onClick={()=>{setForm({status:"researching",app_type:"Regular",match_level:"Target"});setShowModal("school");}}>+ Add School</button>
        </>}
      </>}

      {tab==="essays"&&<>
        {essays.loading?<Loading/>:<>
          <div style={{fontSize:15,color:COLORS.slate,marginBottom:12,lineHeight:1.5}}>Track Common App and supplemental essays — status and due dates.</div>
          <SwipeHint/>
          {["not started","drafting","review","submitted"].map(status=>{
            const group=essays.data.filter(e=>(e.status||"not started")===status);
            if(!group.length)return null;
            return(
              <div key={status}>
                <div style={S.sectionLabel}>{status.charAt(0).toUpperCase()+status.slice(1)}</div>
                {group.map(e=>{
                  const days = e.due_date ? daysBetween(e.due_date) : null;
                  return(
                    <SwipeCard key={e.id} id={e.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                      onEdit={()=>openEdit("essay",e)}
                      onDelete={()=>{essays.remove(e.id);setActiveSwipe(null);}}
                      style={S.statusCard(essayStatusColors[e.status]||COLORS.slate)}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:600}}>{e.title}</div>
                          {e.school&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{e.school}</div>}
                          <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
                            {e.due_date&&<span style={{fontSize:15,color:days<0?COLORS.red:days<=7?COLORS.amber:COLORS.slate}}>Due {formatDate(e.due_date)}{days!==null?` (${days<0?`${-days}d overdue`:`${days}d`})`:""}</span>}
                            {e.word_count&&<span style={{fontSize:15,color:COLORS.slate}}>{e.word_count} words</span>}
                          </div>
                          {e.notes&&<div style={{fontSize:15,color:COLORS.slateLight,marginTop:10,fontStyle:"italic"}}>{e.notes}</div>}
                        </div>
                        <select value={e.status||"not started"} onChange={ev=>essays.update(e.id,{status:ev.target.value})}
                          style={{background:COLORS.navyLight,color:COLORS.slateLight,border:"none",borderRadius:6,padding:"4px 8px",fontSize:15,cursor:"pointer",flexShrink:0}}>
                          {["not started","drafting","review","submitted"].map(st=><option key={st} value={st}>{st}</option>)}
                        </select>
                      </div>
                    </SwipeCard>
                  );
                })}
              </div>
            );
          })}
          <button style={S.btn} onClick={()=>{setForm({status:"not started"});setShowModal("essay");}}>+ Add Essay</button>
        </>}
      </>}

      {tab==="sat/act"&&<>
        {/* Best score hero */}
        {scores.data.length>0&&(()=>{
          const best=scores.data.reduce((a,b)=>(b.total||0)>(a.total||0)?b:a,scores.data[0]);
          return(
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
          );
        })()}

        <div style={S.sectionLabel}>Test Plan</div>
        {testPlan.loading?<Loading/>:<>
          <SwipeHint/>
          {testPlan.data.length===0&&<EmptyState icon="📅" title="No tests planned" detail="Add SAT/ACT dates to track registration deadlines and target scores."/>}
          {testPlan.data.map(t=>{
            const days=daysBetween(t.target_date);
            return(
              <SwipeCard key={t.id} id={t.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                onEdit={()=>openEdit("test",t)}
                onDelete={()=>{testPlan.remove(t.id);setActiveSwipe(null);}}
                style={S.statusCard(days<=14?COLORS.amber:COLORS.blue)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:600}}>{t.test_type} — Attempt {t.attempt_number}</div>
                    <div style={{fontSize:13,color:COLORS.slate,marginTop:2}}>{formatDate(t.target_date)} · {days<0?"Past":`${days}d away`}{t.target_score?` · Target: ${t.target_score}`:""}</div>
                    {t.notes&&<div style={{fontSize:13,color:COLORS.slate,marginTop:8,fontStyle:"italic"}}>{t.notes}</div>}
                  </div>
                  <span style={S.badge(t.registered?COLORS.green:COLORS.amber)}>{t.registered?"Registered":"Not yet"}</span>
                </div>
              </SwipeCard>
            );
          })}
          <button style={S.btn} onClick={()=>{setForm({test_type:"SAT",attempt_number:1,registered:false});setShowModal("test");}}>+ Add Test Date</button>
        </>}

        <div style={S.sectionLabel}>Score History</div>
        {scores.loading?<Loading/>:<>
          {scores.data.length===0&&<EmptyState icon="📊" title="No scores yet" detail="Log official and practice SAT/ACT scores to track progress."/>}
          {scores.data.map(s=>(
            <SwipeCard key={s.id} id={s.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
              onEdit={()=>openEdit("score",s)}
              onDelete={()=>{scores.remove(s.id);setActiveSwipe(null);}}
              style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:17,fontWeight:700}}>{s.total} <span style={{fontSize:13,color:COLORS.slate,fontWeight:400}}>({s.math}M / {s.verbal}V)</span></div>
                  <div style={{fontSize:13,color:COLORS.slate,marginTop:2}}>{formatDate(s.date)}{s.notes?` · ${s.notes}`:""}</div>
                </div>
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
          <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>Years until college start · 529 funding status</div>
        </div>

        {(()=>{
          const savingsBalance = collegeSav.data[0]?.balance || 0;
          const children = [
            { name:"Blake",   color:COLORS.green,  startYear:2032, age:12,
              milestones:[
                {year:2027, label:"PSAT / start tracking", done:false},
                {year:2028, label:"Build college list", done:false},
                {year:2029, label:"Campus visits", done:false},
                {year:2030, label:"SAT / ACT prep", done:false},
                {year:2031, label:"Applications", done:false},
                {year:2032, label:"College starts 🎓", done:false},
              ]
            },
            { name:"Brayden", color:COLORS.amber, startYear:2035, age:9,
              milestones:[
                {year:2030, label:"PSAT / start tracking", done:false},
                {year:2031, label:"Build college list", done:false},
                {year:2032, label:"Campus visits", done:false},
                {year:2033, label:"SAT / ACT prep", done:false},
                {year:2034, label:"Applications", done:false},
                {year:2035, label:"College starts 🎓", done:false},
              ]
            },
          ];

          const currentYear = new Date(todayReal).getFullYear();

          return children.map(child=>{
            const goal = collegeGoals.data.find(g=>g.child_name===child.name);
            const yearsAway = child.startYear - currentYear;
            const targetAmount = goal?.target_amount || 160000;
            // Rough per-child share of the pool based on sequential drawdown timing
            const monthsToStart = yearsAway * 12;
            const growthRate = 0.07 / 12;
            const futurePoolEstimate = savingsBalance * Math.pow(1 + growthRate, monthsToStart);
            const pct = Math.min(100, Math.round(futurePoolEstimate / targetAmount * 100));

            return(
              <div key={child.name} style={{...S.card,borderTop:`3px solid ${child.color}`,marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:19,fontWeight:800,color:child.color}}>{child.name}</div>
                    <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>Age {child.age} · {yearsAway} year{yearsAway!==1?"s":""} until college · Class of {child.startYear}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                    <div style={{fontSize:20,fontWeight:800,color:pct>=80?COLORS.green:pct>=50?COLORS.amber:COLORS.red}}>{pct}%</div>
                    <div style={{fontSize:15,color:COLORS.slate}}>funded est.</div>
                  </div>
                </div>

                {/* 529 progress */}
                <div style={{fontSize:15,color:COLORS.slate,marginBottom:10}}>
                  Target: {formatMoneyShort(targetAmount)} · Pool grows to ~{formatMoneyShort(futurePoolEstimate)} by {child.startYear}
                </div>
                <div style={S.progress}><div style={S.progressFill(pct, pct>=80?COLORS.green:pct>=50?COLORS.amber:COLORS.red)}/></div>

                {/* Milestone timeline */}
                <div style={{marginTop:14}}>
                  <div style={{fontSize:15,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Planning Timeline</div>
                  {child.milestones.map((m,i)=>{
                    const isPast = m.year < currentYear;
                    const isCurrent = m.year === currentYear;
                    return(
                      <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 0",borderBottom:i<child.milestones.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:isPast?child.color:isCurrent?child.color:COLORS.navyLight,flexShrink:0}}/>
                        <div style={{flex:1,fontSize:15,color:isPast?COLORS.slate:isCurrent?COLORS.white:COLORS.slate,fontWeight:isCurrent?700:400}}>{m.label}</div>
                        <div style={{fontSize:15,color:COLORS.slate,flexShrink:0}}>{m.year}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}

        <div style={{...S.card,background:COLORS.navyLight,marginTop:10}}>
          <div style={{fontSize:15,color:COLORS.slate,lineHeight:1.6}}>
            📌 529 estimates assume the shared pool grows at 7%/yr and is available sequentially — Aubrey first (2027), then Blake (2032), then Brayden (2035). Update per-child target amounts in Finance → College.
          </div>
        </div>
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

      {showModal==="essay"&&<Modal title={editItem?"Edit Essay":"Add Essay"} onClose={closeModal}>
        <label style={S.label}>Title</label>
        <input style={S.input} placeholder="e.g. Common App Personal Statement" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
        <label style={S.label}>School (leave blank for Common App)</label>
        <input style={S.input} placeholder="e.g. University of Virginia" value={form.school||""} onChange={e=>setForm(p=>({...p,school:e.target.value}))}/>
        <label style={S.label}>Due Date</label>
        <input type="date" style={S.input} value={form.due_date||""} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>
        <label style={S.label}>Status</label>
        <div>{["not started","drafting","review","submitted"].map(s=><span key={s} style={S.chip(form.status===s,essayStatusColors[s])} onClick={()=>setForm(p=>({...p,status:s}))}>{s}</span>)}</div>
        <label style={S.label}>Word Count (optional)</label>
        <input style={S.input} placeholder="e.g. 650 max" value={form.word_count||""} onChange={e=>setForm(p=>({...p,word_count:e.target.value}))}/>
        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="Prompt, ideas, feedback notes" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveEssay}>{editItem?"Save Changes":"Add Essay"}</button>
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
  const [showOk,setShowOk]       = useState(false);

  function openEdit(item){setEditItem(item);setForm({...item});setShowModal(true);setActiveSwipe(null);}
  function closeModal(){setShowModal(false);setEditItem(null);setForm({});}

  // Fix: pass full row so Supabase doesn't reject a partial update
  async function markDone(item){
    await maint.update(item.id,{title:item.title,last_completed:TODAY_STR,interval_days:item.interval_days,notes:item.notes||""});
  }
  async function save(){
    if(!form.title||!form.interval_days)return;
    const row={title:form.title,last_completed:form.last_completed||TODAY_STR,interval_days:+form.interval_days,notes:form.notes||""};
    if(editItem) await maint.update(editItem.id,row);
    else await maint.insert(row);
    closeModal();
  }

  const overdue  = maint.data.filter(m=>maintStatus(m)==="overdue").sort((a,b)=>daysBetween(nextDueDate(a.last_completed,a.interval_days))-daysBetween(nextDueDate(b.last_completed,b.interval_days)));
  const dueSoon  = maint.data.filter(m=>maintStatus(m)==="due-soon").sort((a,b)=>daysBetween(nextDueDate(a.last_completed,a.interval_days))-daysBetween(nextDueDate(b.last_completed,b.interval_days)));
  const ok       = maint.data.filter(m=>maintStatus(m)==="ok").sort((a,b)=>daysBetween(nextDueDate(a.last_completed,a.interval_days))-daysBetween(nextDueDate(b.last_completed,b.interval_days)));

  function MaintCard({item}){
    const st=maintStatus(item);
    const color=maintColor(st);
    const nd=nextDueDate(item.last_completed,item.interval_days);
    const days=daysBetween(nd);
    const pct=Math.max(0,Math.min(100,100-(days/item.interval_days)*100));
    return(
      <SwipeCard key={item.id} id={item.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
        onEdit={()=>openEdit(item)}
        onDelete={()=>{maint.remove(item.id);setActiveSwipe(null);}}
        style={S.statusCard(color)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:600}}>{item.title}</div>
            <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>
              {st==="overdue"?`Overdue by ${-days}d`:st==="due-soon"?`Due in ${days}d`:`Due ${formatDate(nd)}`}
              {item.notes?` · ${item.notes}`:""}
            </div>
            <div style={S.progress}><div style={S.progressFill(pct,color)}/></div>
          </div>
          <button style={{...S.btnCheck,marginLeft:12}} onClick={()=>markDone(item)}>✓</button>
        </div>
      </SwipeCard>
    );
  }

  return(
    <div style={S.screen}>
      {maint.loading?<Loading/>:<>

        {/* Summary strip */}
        {(overdue.length>0||dueSoon.length>0)&&(
          <div style={{...S.card,background:overdue.length>0?COLORS.red+"11":COLORS.amber+"11",borderColor:overdue.length>0?COLORS.red+"33":COLORS.amber+"33",marginBottom:14}}>
            <div style={{fontSize:22,fontWeight:800,color:overdue.length>0?COLORS.red:COLORS.amber,letterSpacing:"-0.3px"}}>
              {overdue.length>0?`${overdue.length} overdue`:`${dueSoon.length} due soon`}
            </div>
            <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>
              {overdue.length>0&&dueSoon.length>0?`+ ${dueSoon.length} due this week`:
               overdue.length>0?"tap ✓ to mark done":"all within the next 7 days"}
            </div>
          </div>
        )}

        {overdue.length===0&&dueSoon.length===0&&maint.data.length>0&&(
          <div style={{...S.card,background:COLORS.green+"11",borderColor:COLORS.green+"33",marginBottom:14,textAlign:"center",padding:"16px"}}>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.green}}>✅ All maintenance current</div>
            <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>Nothing overdue or due this week.</div>
          </div>
        )}

        {/* Overdue */}
        {overdue.length>0&&<>
          <div style={{fontSize:15,fontWeight:700,color:COLORS.red,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>⚠️ Overdue · {overdue.length}</div>
          {overdue.map(item=><MaintCard key={item.id} item={item}/>)}
        </>}

        {/* Due soon */}
        {dueSoon.length>0&&<>
          <div style={{fontSize:15,fontWeight:700,color:COLORS.amber,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:overdue.length>0?16:0}}>📅 Due This Week · {dueSoon.length}</div>
          {dueSoon.map(item=><MaintCard key={item.id} item={item}/>)}
        </>}

        {/* OK items — collapsed by default */}
        {ok.length>0&&<>
          <button onClick={()=>setShowOk(p=>!p)} style={{...S.btnSm,width:"100%",textAlign:"center",marginTop:12,marginBottom:showOk?8:0}}>
            {showOk?`Hide ${ok.length} current items`:`Show ${ok.length} current item${ok.length!==1?"s":""} ↓`}
          </button>
          {showOk&&<>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.green,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,marginTop:10}}>✓ Current · {ok.length}</div>
            {ok.map(item=><MaintCard key={item.id} item={item}/>)}
          </>}
        </>}

        {maint.data.length===0&&<EmptyState icon="🏠" title="No maintenance items" detail="Add your HVAC filters, pest control, and other recurring tasks to track them here."/>}
        <button style={{...S.btn,marginTop:12}} onClick={()=>{setForm({});setShowModal(true);}}>+ Add Item</button>
      </>}

      {showModal&&<Modal title={editItem?"Edit Item":"Add Maintenance Item"} onClose={closeModal}>
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
        <button style={{...S.btn,marginTop:10}} onClick={save}>{editItem?"Save Changes":"Add Item"}</button>
      </Modal>}
    </div>
  );
}

// ─── AI POOL BRIEF ───────────────────────────────────────────────────────────
function PoolBrief({readings, maintLog, onClose}) {
  const [brief, setBrief]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [history, setHistory] = useState([]);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [hasRun, setHasRun]   = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("poolBriefHistory") || "[]");
      setHistory(saved);
    } catch {}
    // No auto-run — wait for the person to tap "Run Analysis"
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
    setHasRun(true);
    setLoading(true);
    setViewingHistory(null);
    try {
      const recentReadings = readings.slice(0, 8);
      const recentTreatments = (maintLog || []).filter(m => m.type === "Treatment applied").slice(0, 5);

      const cyaDue = nextTestDue(readings, "cya", 30);
      const taDue = nextTestDue(readings, "alkalinity", 14);
      const cyaStale = cyaDue && cyaDue.days < 0;
      const taStale = taDue && taDue.days < 0;

      // Pull most recent non-null CYA and TA across all readings — not just the latest entry
      const mostRecentCYA = readings.find(r => r.cya !== null && r.cya !== undefined);
      const mostRecentTA  = readings.find(r => r.alkalinity !== null && r.alkalinity !== undefined);
      const mostRecentCalcium = readings.find(r => r.calcium_hardness !== null && r.calcium_hardness !== undefined);

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
- Most recent CYA reading: ${mostRecentCYA ? `${mostRecentCYA.cya} ppm (tested ${mostRecentCYA.date})` : 'never tested'}
- Most recent TA reading: ${mostRecentTA ? `${mostRecentTA.alkalinity} ppm (tested ${mostRecentTA.date})` : 'never tested'}
- Most recent Calcium Hardness: ${mostRecentCalcium ? `${mostRecentCalcium.calcium_hardness} ppm (tested ${mostRecentCalcium.date})` : 'not tested — using estimated 200 ppm for LSI'}
- LSI note: This is a VINYL liner pool with SWG. Vinyl pools naturally run lower calcium (150-250 ppm target) and will often show a slightly negative LSI — this is expected and NOT a cause for alarm. Do NOT characterize the water as "corrosive" based on LSI alone for this pool type. Only flag LSI if scaling tendency (positive LSI) is detected.
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

  function renderBrief(text) {
    if(!text) return null;
    return text.split(String.fromCharCode(10)).map((line, i) => {
      if(line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} style={{fontSize:15,fontWeight:700,color:COLORS.blue,letterSpacing:"0.8px",textTransform:"uppercase",marginTop:16,marginBottom:10}}>{line.replace(/\*\*/g,'')}</div>;
      }
      if(line.startsWith('•') || line.startsWith('-')) {
        return <div key={i} style={{fontSize:15,color:COLORS.white,lineHeight:1.6,marginBottom:10,paddingLeft:8}}>• {line.replace(/^[•-]\s*/,'')}</div>;
      }
      if(line.trim()==='') return <div key={i} style={{height:4}}/>;
      return <div key={i} style={{fontSize:15,color:COLORS.slateLight,lineHeight:1.6,marginBottom:10}}>{line}</div>;
    });
  }

  const displayedBrief = viewingHistory !== null ? history[viewingHistory]?.text : brief;
  const displayedIsHistory = viewingHistory !== null;

  const [followUp, setFollowUp] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [askingFollowUp, setAskingFollowUp] = useState(false);

  async function askFollowUp() {
    if (!followUp.trim() || !brief) return;
    const question = followUp.trim();
    setChatMessages(prev => [...prev, { role: "user", text: question }]);
    setFollowUp("");
    setAskingFollowUp(true);
    try {
      const last = readings[0];
      const followUpPrompt = `You already gave this pool brief:\n\n${brief}\n\nThe homeowner has a follow-up question. Answer directly and concisely (2-4 sentences, no headers, no bullets unless genuinely needed). Stay grounded in the same pool context: 17,000 gal vinyl SWG pool, Pentair IntelliChlor, Taylor K-2006 kit, Summerville SC. Current reading: FC=${last?.free_chlorine} ppm, pH=${last?.ph}, Salt=${last?.salt} ppm, CYA=${last?.cya} ppm.\n\nFollow-up question: ${question}`;

      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          messages: [{ role: "user", content: followUpPrompt }]
        })
      });
      const data = await res.json();
      const textBlocks = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join(String.fromCharCode(10));
      setChatMessages(prev => [...prev, { role: "assistant", text: textBlocks || "Could not get a response." }]);
    } catch(e) {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Error: " + e.message }]);
    }
    setAskingFollowUp(false);
  }

  async function shareExport() {
    const last = readings[0];
    const recentSummary = readings.slice(0,5).map(r =>
      `${r.date}: FC ${r.free_chlorine??'—'} ppm, pH ${r.ph??'—'}, Salt ${r.salt??'—'} ppm, CYA ${r.cya??'—'} ppm, TA ${r.alkalinity??'—'} ppm${r.notes?` — ${r.notes}`:''}`
    ).join('\n');
    const exportText = `FAMILYOS POOL BRIEF\n${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}\n\n${displayedBrief}\n\n---\nRECENT READINGS\n${recentSummary}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Pool Brief", text: exportText });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(exportText);
        alert("Copied to clipboard");
      } catch {
        alert("Could not share or copy");
      }
    }
  }

  return (
    <Modal title="🤖 Pool Brief" onClose={onClose}>
      {history.length > 0 && (
        <>
          <div style={{fontSize:15,color:COLORS.slate,marginBottom:10,letterSpacing:"0.5px"}}>PAST BRIEFS — tap to view without regenerating</div>
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            <span style={S.chip(viewingHistory===null,COLORS.purple)} onClick={()=>setViewingHistory(null)}>Latest</span>
            {history.map((h,i)=>(
              <span key={i} style={S.chip(viewingHistory===i,COLORS.slate)} onClick={()=>setViewingHistory(i)}>
                {new Date(h.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
              </span>
            ))}
          </div>
        </>
      )}

      {loading && viewingHistory===null && (
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:15,color:COLORS.slate,marginBottom:10}}>Analyzing your pool history + Summerville weather…</div>
          <div style={{fontSize:15,color:COLORS.slate}}>This takes about 10 seconds</div>
        </div>
      )}
      {error && viewingHistory===null && <div style={{fontSize:15,color:COLORS.red,padding:"20px 0"}}>{error}</div>}

      {!hasRun && !loading && viewingHistory===null && (
        <div style={{textAlign:"center",padding:"30px 20px"}}>
          <div style={{fontSize:15,color:COLORS.slate,marginBottom:16,lineHeight:1.5}}>
            Run a fresh analysis of your pool chemistry, recent treatments, and current Summerville weather.
          </div>
          <button style={S.btn} onClick={generateBrief}>▶️ Run Analysis</button>
        </div>
      )}

      {displayedBrief && (!loading || displayedIsHistory) && (
        <>
          <div style={{background:COLORS.navyLight,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
            {renderBrief(displayedBrief)}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {!displayedIsHistory && <button style={{...S.btn,marginTop:0,flex:1}} onClick={generateBrief}>🔄 Regenerate</button>}
            <button style={{...S.btn,marginTop:0,flex:1,background:COLORS.navyLight,border:`1px solid ${COLORS.navyLight}`}} onClick={shareExport}>📤 Share</button>
          </div>

          {!displayedIsHistory && (
            <>
              <div style={S.sectionLabel}>Ask a follow-up</div>
              {chatMessages.map((m,i)=>(
                <div key={i} style={{marginBottom:10,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"85%",background:m.role==="user"?COLORS.blue:COLORS.navyLight,color:m.role==="user"?"#fff":COLORS.white,borderRadius:10,padding:"8px 12px",fontSize:15,lineHeight:1.5}}>
                    {m.text}
                  </div>
                </div>
              ))}
              {askingFollowUp && <div style={{fontSize:15,color:COLORS.slate,marginBottom:10}}>Thinking…</div>}
              <div style={{display:"flex",gap:8}}>
                <input
                  style={{...S.input,marginBottom:0,flex:1}}
                  placeholder="e.g. why is my SWG running high?"
                  value={followUp}
                  onChange={e=>setFollowUp(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")askFollowUp();}}
                />
                <button style={{...S.btnSm,flexShrink:0}} onClick={askFollowUp} disabled={askingFollowUp}>Ask</button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

// ─── TREATMENT LOG MODAL ──────────────────────────────────────────────────────
function TreatmentLogModal({last, recs, onSave, onClose}) {
  const [checked,setChecked]   = useState({});
  const [details,setDetails]   = useState({}); // per-item editable detail override
  const [custom,setCustom]     = useState([]); // [{type, detail}] freeform additions
  const [saving,setSaving]     = useState(false);

  const actionItems = recs.filter(r=>r.priority==="high"||r.priority==="med");

  function toggle(i){
    setChecked(p=>({...p,[i]:!p[i]}));
    // Pre-fill detail with the recommendation's action text when first checked
    if(!checked[i] && !details[i]){
      setDetails(p=>({...p,[i]:actionItems[i].action}));
    }
  }

  function addCustom(){
    setCustom(p=>[...p,{type:"",detail:""}]);
  }
  function updateCustom(i,field,val){
    setCustom(p=>p.map((c,ci)=>ci===i?{...c,[field]:val}:c));
  }
  function removeCustom(i){
    setCustom(p=>p.filter((_,ci)=>ci!==i));
  }

  const COMMON_TREATMENTS = [
    "Added muriatic acid","Added sodium bicarbonate","Added salt","Added CYA stabilizer",
    "Added liquid chlorine","Added shock","Brushed walls & floor","Vacuumed",
    "Cleaned filter cartridge","Cleaned salt cell","Adjusted SWG setting",
    "Backwashed","Checked flow switch","Added algaecide","Other",
  ];

  const checkedItems = actionItems.filter((_,i)=>checked[i]);
  const validCustom  = custom.filter(c=>c.detail.trim().length>0);
  const hasAnything  = checkedItems.length>0 || validCustom.length>0;

  async function save(){
    setSaving(true);
    const lines = [
      `Treatment — ${new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}`,
      `Chemistry: FC=${last?.free_chlorine??'—'}, pH=${last?.ph??'—'}, Salt=${last?.salt??'—'}, CYA=${last?.cya??'—'}`,
      ...checkedItems.map((_,idx)=>{
        const origIdx = actionItems.indexOf(checkedItems[idx]);
        return details[origIdx]||actionItems[origIdx].action;
      }),
      ...validCustom.map(c=>c.type?`${c.type}: ${c.detail}`:c.detail),
    ];
    await onSave(lines.filter(Boolean).join(' | '));
    setSaving(false);
    onClose();
  }

  return(
    <Modal title="Log Treatment" onClose={onClose}>
      <div style={{fontSize:15,color:COLORS.slate,marginBottom:14,lineHeight:1.5}}>
        Check what you did. Edit the description to match exactly what you actually used or adjusted.
      </div>

      {/* Recommendation-based items */}
      {actionItems.length>0&&<>
        <div style={{fontSize:15,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Recommended Actions</div>
        {actionItems.map((r,i)=>(
          <div key={i} style={{...S.card,borderLeft:`3px solid ${checked[i]?COLORS.green:r.color}`,marginBottom:10,padding:"12px 14px"}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}} onClick={()=>toggle(i)}>
              <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${checked[i]?COLORS.green:COLORS.slate}`,background:checked[i]?COLORS.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,cursor:"pointer"}}>
                {checked[i]&&<span style={{color:"#fff",fontSize:15,lineHeight:1}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:600,color:checked[i]?COLORS.white:COLORS.slateLight}}>{r.icon} {r.action}</div>
                {!checked[i]&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2,lineHeight:1.4}}>{r.detail}</div>}
              </div>
            </div>
            {/* Editable detail when checked */}
            {checked[i]&&(
              <div style={{marginTop:10}}>
                <label style={{...S.label,marginBottom:10}}>What you actually did</label>
                <input
                  style={{...S.input,marginBottom:0,fontSize:15}}
                  value={details[i]||""}
                  placeholder="e.g. Added 10 oz muriatic acid (not 11)"
                  onChange={e=>setDetails(p=>({...p,[i]:e.target.value}))}
                />
              </div>
            )}
          </div>
        ))}
      </>}

      {/* Custom / additional treatments */}
      <div style={{fontSize:15,fontWeight:700,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.8px",marginTop:14,marginBottom:10}}>Additional Treatments</div>
      {custom.map((c,i)=>(
        <div key={i} style={{...S.card,marginBottom:10,padding:"12px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <label style={{...S.label,marginBottom:0}}>Treatment type</label>
            <button onClick={()=>removeCustom(i)} style={{background:"none",border:"none",color:COLORS.slate,cursor:"pointer",fontSize:15,padding:0}}>✕</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
            {COMMON_TREATMENTS.map(t=>(
              <span key={t} style={S.chip(c.type===t,COLORS.blue)} onClick={()=>updateCustom(i,"type",c.type===t?"":t)}>{t}</span>
            ))}
          </div>
          <label style={S.label}>Details / amount</label>
          <input
            style={{...S.input,marginBottom:0,fontSize:15}}
            placeholder="e.g. 2 lbs, raised SWG from 40% to 50%, etc."
            value={c.detail}
            onChange={e=>updateCustom(i,"detail",e.target.value)}
          />
        </div>
      ))}
      <button onClick={addCustom} style={{...S.btnSm,width:"100%",marginBottom:12}}>+ Add Treatment</button>

      <button
        style={{...S.btn,background:hasAnything?COLORS.green:COLORS.slate}}
        onClick={save}
        disabled={saving||!hasAnything}
      >
        {saving?"Saving…":"Log Treatment"}
      </button>
      {!hasAnything&&<div style={{fontSize:15,color:COLORS.slate,textAlign:"center",marginTop:10}}>Check an item or add a treatment above</div>}
    </Modal>
  );
}

// ─── POOL ─────────────────────────────────────────────────────────────────────
function Pool(){
  const readings   = useTable("pool_readings","logged_at");
  const maintLog   = useTable("pool_maintenance","date");
  const schedule   = useTable("pool_schedule","title",true);
  const poolSettings = useTable("pool_settings","id",true);
  const [tab,setTab]             = useState("schedule");
  const [showLog,setShowLog]     = useState(false);
  const [showMaint,setShowMaint] = useState(false);
  const [showScheduleEdit,setShowScheduleEdit] = useState(false);
  const [showBrief,setShowBrief] = useState(false);
  const [showTreatment,setShowTreatment] = useState(false);
  const [showFilterBaseline,setShowFilterBaseline] = useState(false);
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

  const poolSettingsRow = poolSettings.data[0];
  const filterBaseline = poolSettingsRow?.filter_clean_baseline_psi || null;

  // Use the most recent reading as the base for date/notes/metadata
  const lastRaw = readings.data[0];
  // But for each chemistry parameter, pull the most recent non-null value across all readings.
  // This handles partial readings (e.g. logging only salt today) correctly — the health banner
  // always reflects the most current known value for each parameter, not just what was in today's log.
  function latestValue(key) {
    for (const r of readings.data) {
      if (r[key] !== null && r[key] !== undefined) return r[key];
    }
    return null;
  }
  const last = lastRaw ? {
    ...lastRaw,
    ph:             latestValue("ph"),
    free_chlorine:  latestValue("free_chlorine"),
    cc:             latestValue("cc"),
    salt:           latestValue("salt"),
    cya:            latestValue("cya"),
    alkalinity:     latestValue("alkalinity"),
    calcium_hardness: latestValue("calcium_hardness"),
    water_temp:     latestValue("water_temp"),
    filter_pressure: latestValue("filter_pressure"),
    swg_setting:    latestValue("swg_setting"),
  } : null;
  const shockMin = last ? calcShockThreshold(last.cya) : null;
  const chemRecs = getChemRecommendations(last, readings.data, filterBaseline);
  const health   = calcPoolHealth(last, shockMin, readings.data);

  // Dismissed recs are keyed by reading id + recommendation param, so a new reading auto-clears them
  const [dismissed,setDismissed] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem("poolDismissedRecs")||"{}"); }catch{ return {}; }
  });
  function dismissRec(param){
    if(!last) return;
    setDismissed(prev=>{
      const updated = {...prev, [last.id]: [...(prev[last.id]||[]), param]};
      try{ localStorage.setItem("poolDismissedRecs", JSON.stringify(updated)); }catch{}
      return updated;
    });
  }
  const dismissedForThisReading = (last && dismissed[last.id]) || [];
  const visibleRecs = chemRecs.filter(r=>!dismissedForThisReading.includes(r.param));

  const highRecs = visibleRecs.filter(r=>r.priority==="high");
  const medRecs  = visibleRecs.filter(r=>r.priority==="med");
  const lowRecs  = visibleRecs.filter(r=>r.priority==="low");
  const [showLow,setShowLow] = useState(false);

  const season = getSeasonalReminder();
  const seasonKey = `pool_season_dismissed_${new Date().getFullYear()}_${new Date().getMonth()}`;
  const [seasonDismissed,setSeasonDismissed] = useState(()=>{
    try{ return localStorage.getItem(seasonKey)==="true"; }catch{ return false; }
  });
  function dismissSeason(){
    setSeasonDismissed(true);
    try{ localStorage.setItem(seasonKey,"true"); }catch{}
  }

  function openEditReading(r){
    // Extract HH:MM from logged_at for the time field
    const timeVal = r.logged_at ? new Date(r.logged_at).toTimeString().slice(0,5) : "";
    setEditItem(r);
    setForm({...r, time:timeVal});
    setShowLog(true);
    setActiveSwipe(null);
  }
  function openEditMaint(m){setEditItem(m);setForm({...m});setShowMaint(true);setActiveSwipe(null);}
  function closeLog(){setShowLog(false);setEditItem(null);setForm({});setUseDrops(false);}
  function closeMaint(){setShowMaint(false);setEditItem(null);setForm({});}

  async function markScheduleDone(item){
    await schedule.update(item.id, {last_completed: TODAY_STR, title: item.title, interval_days: item.interval_days, notes: item.notes||""});
  }

  async function saveScheduleItem(){
    if(!form.title || !form.interval_days) return;
    const row = {title: form.title, last_completed: form.last_completed||TODAY_STR, interval_days: +form.interval_days, notes: form.notes||""};
    if(editItem) await schedule.update(editItem.id, row);
    else await schedule.insert(row);
    setShowScheduleEdit(false); setEditItem(null); setForm({});
  }

  async function saveReading(){
    function num(v){ return (v===undefined||v===null||v==='') ? null : +v; }
    let fc = num(form.free_chlorine);
    if(useDrops && fc!==null) fc = Math.round(fc * 0.5 * 10) / 10;
    const d = form.date||TODAY_STR;
    // Build logged_at: combine date with entered time (or current time for new readings)
    const timeStr = form.time || new Date().toTimeString().slice(0,5); // HH:MM
    const loggedAt = new Date(`${d}T${timeStr}:00`).toISOString();
    const row={
      date:d,
      logged_at:loggedAt,
      ph:num(form.ph), free_chlorine:fc, cc:num(form.cc),
      salt:num(form.salt), cya:num(form.cya), alkalinity:num(form.alkalinity),
      calcium_hardness:num(form.calcium_hardness),
      water_temp:num(form.water_temp), swg_setting:num(form.swg_setting),
      filter_pressure:num(form.filter_pressure), pump_hours:num(form.pump_hours),
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

  const [showChemDetails,setShowChemDetails] = useState(false);

  return(
    <div style={S.screen}>

      {/* Pool Health Banner — simplified, decisive */}
      {health&&(
        <div style={{...S.card,background:health.overallColor+"18",borderColor:health.overallColor+"44",marginBottom:14}}>
          {/* Line 1: Score + label + date */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{fontSize:24,fontWeight:800,color:health.overallColor,letterSpacing:"-0.3px"}}>
                {health.overallEmoji} Pool Health: {health.score}/100
              </div>
              <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>
                {formatDate(last.date)}{last.logged_at?` · ${new Date(last.logged_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`:""}{last.water_temp?` · ${last.water_temp}°F`:""}
              </div>
            </div>
            {/* Safe to swim — three states: safe, safe+maintenance, unsafe */}
            <div style={{
              background:health.safeToSwim?(health.maintenanceNeeded?COLORS.amber+"22":COLORS.green+"22"):COLORS.red+"22",
              border:`1px solid ${health.safeToSwim?(health.maintenanceNeeded?COLORS.amber:COLORS.green):COLORS.red}44`,
              borderRadius:10,padding:"8px 12px",textAlign:"center",flexShrink:0,marginLeft:12
            }}>
              <div style={{fontSize:15,color:COLORS.slate,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px"}}>Safe to Swim</div>
              <div style={{fontSize:15,fontWeight:800,color:health.safeToSwim?(health.maintenanceNeeded?COLORS.amber:COLORS.green):COLORS.red,marginTop:2}}>
                {health.safeToSwim?(health.maintenanceNeeded?"🟡 Yes":"✅ Yes"):"❌ No"}
              </div>
              {health.safeToSwim&&health.maintenanceNeeded&&<div style={{fontSize:15,color:COLORS.amber,marginTop:2,maxWidth:90,lineHeight:1.3}}>maintenance recommended</div>}
              {!health.safeToSwim&&<div style={{fontSize:15,color:COLORS.red,marginTop:2,maxWidth:90,lineHeight:1.3}}>{health.notSafeReasons[0]}</div>}
            </div>
          </div>
          {/* Line 2: Executive summary */}
          <div style={{fontSize:15,color:COLORS.slateLight,lineHeight:1.5,marginBottom:10}}>{health.summary}</div>
          {/* Today's Action — inside banner, above chemistry toggle per #5 */}
          {highRecs.length>0&&(
            <div style={{background:highRecs[0].color+"18",border:`1px solid ${highRecs[0].color}44`,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
              <div style={{fontSize:15,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Today's Action</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{flex:1,paddingRight:6}}>
                  <div style={{fontSize:15,fontWeight:700,color:highRecs[0].color}}>{highRecs[0].icon} {highRecs[0].action}</div>
                  <div style={{fontSize:15,color:COLORS.slateLight,marginTop:3,lineHeight:1.4}}>{highRecs[0].detail}</div>
                </div>
                <button onClick={()=>dismissRec(highRecs[0].param)} style={{background:"none",border:"none",color:COLORS.slate,cursor:"pointer",fontSize:15,padding:2,flexShrink:0}}>✕</button>
              </div>
            </div>
          )}
          {/* Footer row: chemistry toggle + quick actions */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
            <button onClick={()=>setShowChemDetails(p=>!p)} style={{fontSize:15,color:COLORS.blue,background:"none",border:"none",cursor:"pointer",padding:0,textDecoration:"underline"}}>
              {showChemDetails?"Hide details":"View chemistry details"}
            </button>
            <div style={{display:"flex",gap:12}}>
              <button onClick={()=>setShowTreatment(true)} style={{fontSize:15,color:COLORS.green,background:"none",border:"none",cursor:"pointer",padding:0}}>✓ Log Treatment</button>
              <button onClick={()=>setShowBrief(true)} style={{fontSize:15,color:COLORS.purple,background:"none",border:"none",cursor:"pointer",padding:0}}>🤖 Brief</button>
            </div>
          </div>
          {showChemDetails&&(
            <div style={{marginTop:12,borderTop:`1px solid ${COLORS.navyLight}`,paddingTop:12}}>
              {health.params.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<health.params.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                  {/* Status dot */}
                  <div style={{width:8,height:8,borderRadius:"50%",background:p.color,flexShrink:0,marginTop:1}}/>
                  {/* Name + status */}
                  <div style={{flex:"0 0 120px",minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:COLORS.white}}>{p.label}</div>
                    <div style={{fontSize:15,color:p.color,marginTop:1}}>{p.statusLabel}</div>
                  </div>
                  {/* Value + trend + sparkline */}
                  <div style={{flex:"0 0 72px",textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:700,color:p.value!==null&&p.value!==undefined?COLORS.white:COLORS.slate}}>
                      {p.value!==null&&p.value!==undefined?`${p.value}${p.unit}`:"—"}
                      {p.trendArrow&&<span style={{fontSize:15,marginLeft:3}}>{p.trendArrow}</span>}
                    </div>
                    <div style={{fontSize:11,color:COLORS.slate,marginTop:1}}>{p.target}</div>
                    <div style={{marginTop:4,display:"flex",justifyContent:"flex-end"}}>
                      <Sparkline data={[...readings.data].reverse().map(r=>r[p.key]).filter(v=>v!=null)} color={p.color}/>
                    </div>
                  </div>
                  {/* Last tested / due */}
                  <div style={{flex:1,textAlign:"right"}}>
                    {p.lastTestedLabel&&<div style={{fontSize:15,color:COLORS.slate,lineHeight:1.3}}>{p.lastTestedLabel}</div>}
                    {p.testInfo&&<div style={{fontSize:15,color:p.testInfo.urgency==="red"?COLORS.red:p.testInfo.urgency==="amber"?COLORS.amber:COLORS.slate,marginTop:p.lastTestedLabel?2:0,lineHeight:1.3}}>{p.testInfo.dueLabel}</div>}
                    {!p.lastTestedLabel&&!p.testInfo&&<div style={{fontSize:11,color:COLORS.slate,whiteSpace:"nowrap"}}>Every reading</div>}
                  </div>
                </div>
              ))}
              {/* CC row — always from most recent reading */}
              {last.cc!==null&&last.cc!==undefined&&(
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderTop:`1px solid ${COLORS.navyLight}`}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:last.cc>0.5?COLORS.red:last.cc>0?COLORS.amber:COLORS.green,flexShrink:0,marginTop:1}}/>
                  <div style={{flex:"0 0 120px",minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:COLORS.white}}>Combined Chlorine</div>
                    <div style={{fontSize:15,color:last.cc>0.5?COLORS.red:last.cc>0?COLORS.amber:COLORS.green,marginTop:1}}>{last.cc===0?"None detected":last.cc<=0.5?"Acceptable":"Elevated"}</div>
                  </div>
                  <div style={{flex:"0 0 72px",textAlign:"right"}}>
                    <div style={{fontSize:15,fontWeight:700,color:COLORS.white}}>{last.cc} ppm</div>
                    <div style={{fontSize:15,color:COLORS.slate,marginTop:1}}>target: 0</div>
                  </div>
                  <div style={{flex:1,textAlign:"right"}}>
                    <div style={{fontSize:15,color:COLORS.slate}}>Every reading</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No reading yet */}
      {!last&&(
        <div style={{...S.card,textAlign:"center",padding:"32px 20px",marginBottom:14}}>
          <div style={{fontSize:32,marginBottom:10}}>🏊</div>
          <div style={{fontSize:15,fontWeight:700,marginBottom:10}}>No readings yet</div>
          <div style={{fontSize:15,color:COLORS.slate,marginBottom:16}}>Log your first pool reading to see health status and recommendations.</div>
          <button onClick={()=>{setForm({date:TODAY_STR});setShowLog(true);}} style={S.btn}>+ Log First Reading</button>
        </div>
      )}

      {/* Remaining high priority actions (beyond the first, already shown in banner) */}
      {highRecs.slice(1).map((r,i)=>(
        <div key={i} style={{...S.statusCard(r.color),marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,paddingRight:8}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:10}}>{r.icon} {r.action}</div>
              <div style={{fontSize:15,color:COLORS.slateLight,lineHeight:1.5}}>{r.detail}</div>
            </div>
            <button onClick={()=>dismissRec(r.param)} style={{background:"none",border:"none",color:COLORS.slate,cursor:"pointer",fontSize:19,padding:2,flexShrink:0}}>✕</button>
          </div>
        </div>
      ))}

      {/* This Week — medium priority */}
      {medRecs.length>0&&<>
        <div style={S.sectionLabel}>This Week</div>
        {medRecs.map((r,i)=>(
          <div key={i} style={{...S.statusCard(r.color),marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,paddingRight:8}}>
                <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>{r.icon} {r.action}</div>
                <div style={{fontSize:15,color:COLORS.slateLight,lineHeight:1.5}}>{r.detail}</div>
              </div>
              <button onClick={()=>dismissRec(r.param)} style={{background:"none",border:"none",color:COLORS.slate,cursor:"pointer",fontSize:15,padding:2,flexShrink:0}}>✕</button>
            </div>
          </div>
        ))}
      </>}

      {/* All clear */}
      {last&&highRecs.length===0&&medRecs.length===0&&(
        <div style={{...S.card,background:COLORS.green+"11",borderColor:COLORS.green+"33",textAlign:"center",padding:"16px"}}>
          <div style={{fontSize:15,fontWeight:700,color:COLORS.green}}>✅ No actions needed</div>
          <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>Chemistry looks balanced — keep up with regular testing.</div>
        </div>
      )}

      {/* Low priority notes */}
      {lowRecs.length>0&&(
        <button onClick={()=>setShowLow(p=>!p)} style={{...S.btnSm,width:"100%",textAlign:"center",marginBottom:10,marginTop:10}}>
          {showLow?"Hide":"Show"} {lowRecs.length} additional note{lowRecs.length!==1?"s":""}
        </button>
      )}
      {showLow&&lowRecs.map((r,i)=>(
        <div key={i} style={{...S.statusCard(r.color),marginBottom:10}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>{r.icon} {r.action}</div>
          <div style={{fontSize:15,color:COLORS.slateLight,lineHeight:1.5}}>{r.detail}</div>
        </div>
      ))}

      {/* Seasonal tip — moved below actions (#4) */}
      {!seasonDismissed&&season&&(
        <div style={{...S.statusCard(COLORS.blue),marginBottom:14,marginTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1,paddingRight:8}}>
              <div style={{fontSize:15,fontWeight:700,marginBottom:3}}>🗓️ {season.label} — target SWG {season.swg}</div>
              <div style={{fontSize:15,color:COLORS.slateLight,lineHeight:1.5}}>{season.note}</div>
            </div>
            <button onClick={dismissSeason} style={{background:"none",border:"none",color:COLORS.slate,cursor:"pointer",fontSize:15,padding:2,flexShrink:0}}>✕</button>
          </div>
        </div>
      )}

      {/* Chemistry detail card — collapsed by default, now inside the banner toggle */}

      <div style={{...S.tabs,marginTop:16}}>
        {["schedule","history"].map(t=><button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>)}
      </div>


            {tab==="schedule"&&<>
        {schedule.loading?<Loading/>:<>
          <SwipeHint/>
          {schedSorted.map(item=>{
            const st=maintStatus(item);const color=maintColor(st);
            const nd=nextDueDate(item.last_completed,item.interval_days);
            const days=daysBetween(nd);
            const pct=Math.max(0,100-(days/item.interval_days)*100);
            return(
              <SwipeCard key={item.id} id={item.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
                onEdit={()=>{setEditItem(item);setForm({...item});setShowScheduleEdit(true);setActiveSwipe(null);}}
                onDelete={()=>{schedule.remove(item.id);setActiveSwipe(null);}}
                style={S.statusCard(color)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:600}}>{item.title}</div>
                    <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>
                      {st==="overdue"?`Overdue by ${-days}d`:st==="due-soon"?`Due in ${days}d`:`Due ${formatDate(nd)}`}
                      {item.notes?` · ${item.notes}`:""}
                    </div>
                    <div style={S.progress}><div style={S.progressFill(pct,color)}/></div>
                  </div>
                  <button style={{...S.btnCheck,marginLeft:12}} onClick={()=>markScheduleDone(item)}>✓</button>
                </div>
              </SwipeCard>
            );
          })}
          <button style={S.btn} onClick={()=>{setForm({interval_days:7});setShowScheduleEdit(true);}}>+ Add Item</button>
        </>}
      </>}

      {tab==="history"&&<>
        {(readings.loading||maintLog.loading)?<Loading/>:<>
          <SwipeHint/>
          {(()=>{
            // Interleave readings and maintenance entries
            // Use logged_at for readings (precise datetime), date for maintenance (date only)
            const items = [
              ...readings.data.map(r=>({...r, _type:"reading", _sortKey:r.logged_at||r.date})),
              ...maintLog.data.map(m=>({...m, _type:"maint", _sortKey:m.date})),
            ].sort((a,b)=>new Date(b._sortKey)-new Date(a._sortKey));

            // Detect which dates have multiple readings (to decide whether to show time)
            const readingsByDate = {};
            readings.data.forEach(r=>{ readingsByDate[r.date]=(readingsByDate[r.date]||0)+1; });

            if(items.length===0) return <EmptyState icon="📋" title="No history yet" detail="Log your first pool reading to start building a history."/>;

            return items.map(item=>{
              if(item._type==="reading"){
                const hasTime = item.logged_at && readingsByDate[item.date] > 1;
                const timeLabel = hasTime ? new Date(item.logged_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}) : "";
                return(
                  <SwipeCard key={`r-${item.id}`} id={`r-${item.id}`} activeId={activeSwipe} setActiveId={setActiveSwipe}
                    onEdit={()=>openEditReading(item)}
                    onDelete={()=>{readings.remove(item.id);setActiveSwipe(null);}}
                    style={S.card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:15,background:COLORS.blue+"22",color:COLORS.blue,borderRadius:4,padding:"1px 6px",fontWeight:700}}>Reading</span>
                      <div style={{fontSize:15,fontWeight:700}}>{formatDate(item.date)}{timeLabel?` · ${timeLabel}`:""}</div>
                    </div>
                    <div style={{fontSize:15,color:COLORS.slate,textAlign:"right"}}>
                      {item.water_temp?`${item.water_temp}°F`:""}
                      {item.swg_setting?` · SWG ${item.swg_setting}%`:""}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
                    {PARAMS.filter(p=>!["water_temp","filter_pressure"].includes(p.k)).map(p=>{
                      const v=item[p.k];
                      const s=poolStatus(p.k,v);
                      return <div key={p.k}><div style={{fontSize:15,fontWeight:600,color:v!==null&&v!==undefined?statusColor(s):COLORS.slate}}>{v!==null&&v!==undefined?v:"—"}</div><div style={{fontSize:15,color:COLORS.slate}}>{p.l}</div></div>;
                    })}
                  </div>
                  {item.notes&&<div style={{fontSize:15,color:COLORS.slate,marginTop:10,fontStyle:"italic"}}>{item.notes}</div>}
                </SwipeCard>
              );
              }
              return(
                <SwipeCard key={`m-${item.id}`} id={`m-${item.id}`} activeId={activeSwipe} setActiveId={setActiveSwipe}
                  onEdit={()=>openEditMaint(item)}
                  onDelete={()=>{maintLog.remove(item.id);setActiveSwipe(null);}}
                  style={S.card}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:15,background:COLORS.green+"22",color:COLORS.green,borderRadius:4,padding:"1px 6px",fontWeight:700}}>Maintenance</span>
                    <div style={{fontSize:15,fontWeight:700,color:item.type==="Treatment applied"?COLORS.green:COLORS.white}}>{item.type}</div>
                  </div>
                  <div style={{fontSize:15,color:COLORS.slate,marginTop:3}}>{formatDate(item.date)}</div>
                  {item.notes&&<div style={{fontSize:15,color:COLORS.slate,marginTop:10,lineHeight:1.5,fontStyle:"italic"}}>{item.notes}</div>}
                </SwipeCard>
              );
            });
          })()}
          <button style={S.btn} onClick={()=>{setForm({date:TODAY_STR});setShowMaint(true);}}>+ Log Maintenance</button>
        </>}
      </>}
      {showLog&&<Modal title={editItem?"Edit Reading":"Log Pool Reading"} onClose={closeLog}>
        <div style={S.row}>
          <div style={S.col}>
            <label style={S.label}>Date</label>
            <input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
          </div>
          <div style={{flex:"0 0 100px"}}>
            <label style={S.label}>Time</label>
            <input type="time" style={S.input} value={form.time||new Date().toTimeString().slice(0,5)} onChange={e=>setForm(p=>({...p,time:e.target.value}))}/>
          </div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <label style={{...S.label,marginBottom:0}}>Free Chlorine</label>
          <div style={{display:"flex",gap:6}}>
            <span style={S.chip(!useDrops,COLORS.blue)} onClick={()=>setUseDrops(false)}>ppm</span>
            <span style={S.chip(useDrops,COLORS.purple)} onClick={()=>setUseDrops(true)}>K-2006 drops</span>
          </div>
        </div>
        <input type="number" step="0.5" style={S.input} placeholder={useDrops?"e.g. 11 drops (= 5.5 ppm)":"e.g. 5.5"} value={form.free_chlorine||""} onChange={e=>setForm(p=>({...p,free_chlorine:e.target.value}))}/>
        {useDrops&&form.free_chlorine&&<div style={{fontSize:15,color:COLORS.purple,marginTop:-6,marginBottom:10}}>= {(+form.free_chlorine*0.5).toFixed(1)} ppm FC</div>}

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
                if(!d) return <span style={{fontSize:15,color:COLORS.slate}}>never tested</span>;
                const overdue=d.days<0;
                return <span style={{fontSize:15,color:overdue?COLORS.red:d.days<=3?COLORS.amber:COLORS.slate}}>{overdue?"overdue":`due ${formatDate(d.due)}`}</span>;
              })()}
            </div>
            <input type="number" style={S.input} placeholder="" value={form.cya||""} onChange={e=>setForm(p=>({...p,cya:e.target.value}))}/>
          </div>
          <div style={S.col}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <label style={{...S.label,marginBottom:0}}>TA (ppm)</label>
              {(()=>{
                const d=nextTestDue(readings.data,"alkalinity",14);
                if(!d) return <span style={{fontSize:15,color:COLORS.slate}}>never tested</span>;
                const overdue=d.days<0;
                return <span style={{fontSize:15,color:overdue?COLORS.red:d.days<=3?COLORS.amber:COLORS.slate}}>{overdue?"overdue":`due ${formatDate(d.due)}`}</span>;
              })()}
            </div>
            <input type="number" style={S.input} placeholder="" value={form.alkalinity||""} onChange={e=>setForm(p=>({...p,alkalinity:e.target.value}))}/>
          </div>
        </div>
        <div style={S.row}>
          <div style={S.col}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <label style={{...S.label,marginBottom:0}}>Calcium Hardness (ppm)</label>
              {(()=>{
                const d=nextTestDue(readings.data,"calcium_hardness",90);
                if(!d) return <span style={{fontSize:15,color:COLORS.slate}}>never tested</span>;
                const overdue=d.days<0;
                return <span style={{fontSize:15,color:overdue?COLORS.red:d.days<=7?COLORS.amber:COLORS.slate}}>{overdue?"overdue":`due ${formatDate(d.due)}`}</span>;
              })()}
            </div>
            <input type="number" style={S.input} placeholder="target 150-250" value={form.calcium_hardness||""} onChange={e=>setForm(p=>({...p,calcium_hardness:e.target.value}))}/>
          </div>
          <div style={S.col}>
            <label style={S.label}>Water Temp (°F)</label>
            <input type="number" style={S.input} placeholder="" value={form.water_temp||""} onChange={e=>setForm(p=>({...p,water_temp:e.target.value}))}/>
          </div>
        </div>
        <div style={S.row}>
          <div style={S.col}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <label style={{...S.label,marginBottom:0}}>Filter Pressure (psi)</label>
              {filterBaseline&&<span style={{fontSize:15,color:COLORS.slate}}>baseline {filterBaseline}</span>}
            </div>
            <input type="number" style={S.input} placeholder="" value={form.filter_pressure||""} onChange={e=>setForm(p=>({...p,filter_pressure:e.target.value}))}/>
          </div>
          <div style={S.col}><label style={S.label}>SWG Setting (%)</label><input type="number" style={S.input} placeholder="" value={form.swg_setting||""} onChange={e=>setForm(p=>({...p,swg_setting:e.target.value}))}/></div>
        </div>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Pump Hours/Day</label><input type="number" style={S.input} placeholder="" value={form.pump_hours||""} onChange={e=>setForm(p=>({...p,pump_hours:e.target.value}))}/></div>
        </div>

        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="Optional" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:10}} onClick={saveReading}>{editItem?"Save Changes":"Save Reading"}</button>
      </Modal>}

      {showMaint&&<Modal title={editItem?"Edit Entry":"Log Pool Entry"} onClose={closeMaint}>
        <label style={S.label}>Date</label>
        <input type="date" style={S.input} value={form.date||form.last_completed||""} onChange={e=>setForm(p=>({...p,date:e.target.value,last_completed:e.target.value}))}/>
        <label style={S.label}>Type</label>
        {["Check water level","Clean skimmer basket","Brushed walls & floor","Added salt","Cleaned cartridge filter","Cleaned salt cell","Checked flow switch","Inspected O-rings","Rain event","Other"].map(t=>(
          <span key={t} style={S.chip(form.type===t,COLORS.blue)} onClick={()=>setForm(p=>({...p,type:t}))}>{t}</span>
        ))}
        <label style={{...S.label,marginTop:10}}>Notes (optional)</label>
        <input style={S.input} placeholder="Any details" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:10}} onClick={saveMaint}>{editItem?"Save Changes":"Save"}</button>
      </Modal>}

      {showBrief&&<PoolBrief readings={readings.data} maintLog={maintLog.data} onClose={()=>setShowBrief(false)}/>}

      {showTreatment&&<TreatmentLogModal last={last} recs={chemRecs} onSave={logTreatment} onClose={()=>setShowTreatment(false)}/>}

      {showScheduleEdit&&<Modal title={editItem?"Edit Schedule Item":"Add Schedule Item"} onClose={()=>{setShowScheduleEdit(false);setEditItem(null);setForm({});}}>
        <label style={S.label}>Task Name</label>
        <input style={S.input} placeholder="e.g. Check water level" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
        <label style={S.label}>Interval</label>
        <div style={{marginBottom:12}}>
          {[7,14,30,60,90,180,365].map(d=><span key={d} style={S.chip(+form.interval_days===d,COLORS.blue)} onClick={()=>setForm(p=>({...p,interval_days:d}))}>{d}d</span>)}
        </div>
        <label style={S.label}>Last Completed</label>
        <input type="date" style={S.input} value={form.last_completed||""} onChange={e=>setForm(p=>({...p,last_completed:e.target.value}))}/>
        <label style={S.label}>Notes (optional)</label>
        <input style={S.input} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:10}} onClick={saveScheduleItem}>{editItem?"Save Changes":"Add Item"}</button>
      </Modal>}

      {showFilterBaseline&&<Modal title="Set Filter Clean Baseline" onClose={()=>setShowFilterBaseline(false)}>
        <div style={{fontSize:15,color:COLORS.slate,marginBottom:16,lineHeight:1.5}}>
          Log the filter pressure right after cleaning the cartridge. Future readings will be compared as "+X psi above clean" instead of a flat threshold — more accurate since every filter's clean baseline is a little different.
        </div>
        <label style={S.label}>Clean Baseline (psi)</label>
        <input type="number" style={S.input} placeholder="e.g. 12" value={form.filter_clean_baseline_psi||""} onChange={e=>setForm(p=>({...p,filter_clean_baseline_psi:e.target.value}))}/>
        <button style={{...S.btn,marginTop:10}} onClick={async()=>{
          try{
            const val = form.filter_clean_baseline_psi!==undefined&&form.filter_clean_baseline_psi!=='' ? +form.filter_clean_baseline_psi : null;
            const row = {filter_clean_baseline_psi: val};
            if(poolSettingsRow && poolSettingsRow.id) await poolSettings.update(poolSettingsRow.id, row);
            else await poolSettings.insert(row);
          }catch(e){console.error("save filter baseline failed",e);}
          setShowFilterBaseline(false);
        }}>Save Baseline</button>
      </Modal>}
    </div>
  );
}

// ─── FINANCE ──────────────────────────────────────────────────────────────────
// ─── RETIREMENT BRIEF ─────────────────────────────────────────────────────────
function RetirementBrief({accounts, assumptions, retProj, monteCarloResults, onClose}) {
  const [brief, setBrief]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [history, setHistory] = useState([]);
  const [viewingHistory, setViewingHistory] = useState(null);
  const [hasRun, setHasRun]   = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [askingFollowUp, setAskingFollowUp] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("retirementBriefHistory") || "[]");
      setHistory(saved);
    } catch {}
  }, []);

  function saveBriefToHistory(briefText) {
    try {
      const saved = JSON.parse(localStorage.getItem("retirementBriefHistory") || "[]");
      const updated = [{ date: new Date().toISOString(), text: briefText }, ...saved].slice(0, 3);
      localStorage.setItem("retirementBriefHistory", JSON.stringify(updated));
      setHistory(updated);
    } catch {}
  }

  async function generateBrief() {
    setHasRun(true);
    setLoading(true);
    setViewingHistory(null);
    try {
      const accountSummary = accounts.map(a =>
        `${a.name} (${a.account_type}, ${a.tax_treatment}): ${formatMoney(a.balance)}, contributing ${formatMoney(a.monthly_contribution)}${a.contribution_frequency==="biweekly"?"/paycheck":"/mo"}${a.employer_match?` + ${formatMoney(a.employer_match)} match`:""}, last updated ${a.last_updated}`
      ).join(String.fromCharCode(10));

      const today = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});

      const prompt = `You are a knowledgeable, plain-spoken financial planning assistant helping a 44-year-old household in South Carolina targeting retirement at age ${assumptions.retirement_age}. You are not a licensed financial advisor — give analytical, educational perspective, not personalized investment advice or specific fund/allocation recommendations.

Today is ${today}.

Accounts:
${accountSummary}

Current totals:
- Combined balance: ${formatMoney(retProj.totalBalance)}
- Combined monthly contribution (incl. match): ${formatMoney(retProj.totalMonthly)}
- Years to retirement: ${retProj.years}
- Contribution growth assumption: ${assumptions.contribution_increase_pct||0}%/year
- Inflation assumption: ${retProj.inflationPct}%/year

Projections at age ${assumptions.retirement_age} (nominal future dollars):
- Conservative (6%): ${formatMoney(retProj.scenarios[0].projected)} (≈${formatMoney(retProj.scenarios[0].projectedTodaysDollars)} in today's purchasing power)
- Moderate (8%): ${formatMoney(retProj.scenarios[1].projected)} (≈${formatMoney(retProj.scenarios[1].projectedTodaysDollars)} in today's purchasing power)
- Aggressive (10%): ${formatMoney(retProj.scenarios[2].projected)} (≈${formatMoney(retProj.scenarios[2].projectedTodaysDollars)} in today's purchasing power)

Tax and inflation adjusted reality:
- Spendable after tax (moderate scenario, blended ~${Math.round(retProj.taxableMix*100)}% effective rate across pre-tax/Roth/taxable mix): ${formatMoney(retProj.spendableProjected)} (≈${formatMoney(retProj.spendableTodaysDollars)} in today's purchasing power)
- Target in today's dollars: ${formatMoney(retProj.targetNumberToday)}
- Target inflation-adjusted to retirement year: ${formatMoney(retProj.targetNumberInflated)}
- Gap (both figures in nominal dollars at the retirement year — apples to apples): ${formatMoney(retProj.gap)}
- Note: the "today's purchasing power" figures are for intuition only; the Gap above is the real comparison, calculated entirely in future dollars at the retirement year

Full retirement drawdown simulation (this is the PRIMARY analysis — three phases: accumulate to retirement, spend the bridge years from Rule of 55 funds, then spend the combined balance through age ${retProj.drawdown.planEndAge}):

Phase 1 — Accumulation (now to age ${assumptions.retirement_age}, ${retProj.years} years):
- Projected balance at retirement: ${formatMoney(retProj.drawdown.balanceAtRetirement)}
- After blended tax adjustment: ${formatMoney(retProj.drawdown.spendableAtRetirement)}
- Split: ~${Math.round(retProj.drawdown.ruleOf55Share*100)}% in Rule of 55-eligible 403(b)/401(k) accounts, rest in IRA/brokerage/HSA

Phase 2 — Bridge years (age ${assumptions.retirement_age} to ${retProj.drawdown.medicareAge}, ${retProj.bridgeYears} years before Medicare eligibility):
- Healthcare costs grow ~5.5%/year during this window and continue growing at that rate for the rest of the plan (Medicare reduces but doesn't eliminate above-inflation healthcare growth)
- Bridge spending is drawn from the Rule of 55-eligible pool first (penalty-free), letting the rest compound untouched
- Social Security: ${formatMoney(+(assumptions.social_security_estimate)||0)}/yr at age ${+(assumptions.ss_claim_age)||67} (Matt) + ${formatMoney(+(assumptions.social_security_estimate_spouse)||0)}/yr at age ${+(assumptions.ss_claim_age_spouse)||67} (Kalee) = ${formatMoney((+(assumptions.social_security_estimate)||0)+(+(assumptions.social_security_estimate_spouse)||0))}/yr combined household once both are claimed
- Bridge shortfall (amount bridge spending exceeds what Rule of 55 funds can cover): ${retProj.drawdown.bridgeShortfall>0 ? formatMoney(retProj.drawdown.bridgeShortfall) : "none — fully covered"}
- Combined balance remaining at end of bridge (age ${retProj.drawdown.medicareAge}): ${formatMoney(retProj.drawdown.balanceAtBridgeEnd)}
- Social Security claiming age (separate from Medicare): ${retProj.drawdown.ssClaimAge} — no Social Security income assumed before this age

Phase 3 — Full retirement drawdown (age ${retProj.drawdown.medicareAge} to ${retProj.drawdown.planEndAge}, ${retProj.drawdown.postBridgeYears} years):
- Healthcare keeps growing ~5.5%/year the whole way, spending grows with general inflation, Social Security (once claimed at age ${retProj.drawdown.ssClaimAge}) is itself COLA-adjusted
- Result: ${retProj.drawdown.lastsFullPlan ? `money lasts through age ${retProj.drawdown.planEndAge}, with ${formatMoney(retProj.drawdown.finalBalance)} remaining` : `money is projected to run low around age ${retProj.drawdown.ranOutAtAge}, which is ${retProj.drawdown.planEndAge-retProj.drawdown.ranOutAtAge} years short of the age-${retProj.drawdown.planEndAge} planning horizon`}

App-calculated status (already shown to the user as a colored badge before they read this brief — your analysis should be consistent with this, not contradict it):
- Status: ${retProj.statusLabel} (${retProj.status}) — this is the STEADY-RETURN view (flat ${assumptions.drawdown_rate_pct||5}% every year), explicitly labeled to the user as not accounting for market variation

${monteCarloResults ? `Monte Carlo simulation (1,000 randomized-return paths per scenario, already run and shown to the user — this is the MORE REALISTIC view and should be weighted heavily in your analysis):
${monteCarloResults.map(r=>`- ${r.label} (age ${r.retirementAge}): ${r.successRate}% of simulated paths last through age ${assumptions.plan_end_age||90}, median ending balance ${formatMoney(r.medianFinalBalance)}`).join(String.fromCharCode(10))}
- If the steady-return status above says "On Track" but the Current Plan success rate is meaningfully below 85%, say so directly — don't let the optimistic steady-return number stand uncontested. The Monte Carlo result is the more honest answer to "will this actually work."` : `Monte Carlo simulation has not been run yet — mention that running it (button above) would give a more realistic picture than the steady-return number alone, since markets don't actually return the same amount every year.`}

Known model limitation to mention briefly: the steady-return simulation uses a single flat average annual return for accumulation (${assumptions.moderate_rate_pct||7}%) and a separate flat rate for drawdown (${assumptions.drawdown_rate_pct||5}%), with no year-to-year variation. Real markets vary year to year, and a downturn in the first few years of retirement specifically (sequence-of-returns risk) can hurt more than the average return suggests — this is exactly what the Monte Carlo simulation is designed to reveal, if it's been run.

Write a brief in this EXACT format. Every section must be 1-3 short bullet points, never paragraphs. Be specific with numbers. No fluff, no filler. Do not give specific investment, fund, or allocation advice — stick to savings rate, contribution, tax/timing mechanics, and gap analysis.

Format:
**WHERE YOU STAND**
• [current balance, contribution rate, trajectory in plain terms]

**THE REAL NUMBER**
• [tax-adjusted, inflation-adjusted gap — not the gross projection]

**THE BRIDGE YEARS**
• [comment on the age ${assumptions.retirement_age}-${retProj.drawdown.medicareAge} window, healthcare growth, and whether Rule of 55 funds cover it]

**THROUGH AGE ${retProj.drawdown.planEndAge}**
• [does the full retirement drawdown last through age ${retProj.drawdown.planEndAge}, or run low — and roughly when]

**REALISTIC ODDS**
• [Monte Carlo success rate if available, and whether it agrees or disagrees with the steady-return status above — be direct if they diverge]

**WHAT WOULD HELP MOST**
• [1-2 concrete, non-advisory levers]

**KNOWN LIMITATION**
• [brief honest note — if Monte Carlo hasn't been run, mention that; if it has, note what it doesn't capture either, like fees or tax law changes]

Keep the ENTIRE brief under 210 words total. Bullets only, no exceptions.`;

      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
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
      const finalBrief = textBlocks || "Unable to generate brief.";
      setBrief(finalBrief);
      saveBriefToHistory(finalBrief);
    } catch(e) {
      setError("Could not generate brief: " + e.message);
    }
    setLoading(false);
  }

  async function askFollowUp() {
    if (!followUp.trim() || !brief) return;
    const question = followUp.trim();
    setChatMessages(prev => [...prev, { role: "user", text: question }]);
    setFollowUp("");
    setAskingFollowUp(true);
    try {
      const mcContext = monteCarloResults ? ` Monte Carlo current-plan success rate: ${monteCarloResults.find(r=>r.label==="Current Plan")?.successRate}%.` : "";
      const followUpPrompt = `You already gave this retirement brief:\n\n${brief}\n\nAnswer this follow-up directly and concisely (2-4 sentences, no headers/bullets unless needed). You are not a licensed advisor — stay educational, not prescriptive about specific investments. Current balance ${formatMoney(retProj.totalBalance)}, inflation-adjusted target ${formatMoney(retProj.targetNumberInflated)}, retiring at ${assumptions.retirement_age}, Rule of 55 eligible balance ${formatMoney(retProj.ruleOf55Balance)}.${mcContext}\n\nQuestion: ${question}`;
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 500, messages: [{ role: "user", content: followUpPrompt }] })
      });
      const data = await res.json();
      const textBlocks = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join(String.fromCharCode(10));
      setChatMessages(prev => [...prev, { role: "assistant", text: textBlocks || "Could not get a response." }]);
    } catch(e) {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Error: " + e.message }]);
    }
    setAskingFollowUp(false);
  }

  function renderBrief(text) {
    if(!text) return null;
    return text.split(String.fromCharCode(10)).map((line, i) => {
      if(line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} style={{fontSize:15,fontWeight:700,color:COLORS.blue,letterSpacing:"0.8px",textTransform:"uppercase",marginTop:16,marginBottom:10}}>{line.replace(/\*\*/g,'')}</div>;
      }
      if(line.startsWith('•') || line.startsWith('-')) {
        return <div key={i} style={{fontSize:15,color:COLORS.white,lineHeight:1.6,marginBottom:10,paddingLeft:8}}>• {line.replace(/^[•-]\s*/,'')}</div>;
      }
      if(line.trim()==='') return <div key={i} style={{height:4}}/>;
      return <div key={i} style={{fontSize:15,color:COLORS.slateLight,lineHeight:1.6,marginBottom:10}}>{line}</div>;
    });
  }

  const displayedBrief = viewingHistory !== null ? history[viewingHistory]?.text : brief;
  const displayedIsHistory = viewingHistory !== null;

  return (
    <Modal title="🤖 Retirement Brief" onClose={onClose}>
      {history.length > 0 && (
        <>
          <div style={{fontSize:15,color:COLORS.slate,marginBottom:10,letterSpacing:"0.5px"}}>PAST BRIEFS — tap to view without regenerating</div>
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            <span style={S.chip(viewingHistory===null,COLORS.purple)} onClick={()=>setViewingHistory(null)}>Latest</span>
            {history.map((h,i)=>(
              <span key={i} style={S.chip(viewingHistory===i,COLORS.slate)} onClick={()=>setViewingHistory(i)}>
                {new Date(h.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
              </span>
            ))}
          </div>
        </>
      )}

      {loading && viewingHistory===null && (
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:15,color:COLORS.slate}}>Analyzing your retirement trajectory…</div>
        </div>
      )}
      {error && viewingHistory===null && <div style={{fontSize:15,color:COLORS.red,padding:"20px 0"}}>{error}</div>}

      {!hasRun && !loading && viewingHistory===null && (
        <div style={{textAlign:"center",padding:"30px 20px"}}>
          <div style={{fontSize:15,color:COLORS.slate,marginBottom:16,lineHeight:1.5}}>
            Run an analysis of your retirement trajectory, contribution rate, and bridge gap.
          </div>
          <button style={S.btn} onClick={generateBrief}>▶️ Run Analysis</button>
        </div>
      )}

      {displayedBrief && (!loading || displayedIsHistory) && (
        <>
          <div style={{background:COLORS.navyLight,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
            {renderBrief(displayedBrief)}
          </div>
          {!displayedIsHistory && <button style={{...S.btn,marginTop:0,marginBottom:16}} onClick={generateBrief}>🔄 Regenerate</button>}

          {!displayedIsHistory && (
            <>
              <div style={S.sectionLabel}>Ask a follow-up</div>
              {chatMessages.map((m,i)=>(
                <div key={i} style={{marginBottom:10,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                  <div style={{maxWidth:"85%",background:m.role==="user"?COLORS.blue:COLORS.navyLight,color:m.role==="user"?"#fff":COLORS.white,borderRadius:10,padding:"8px 12px",fontSize:15,lineHeight:1.5}}>
                    {m.text}
                  </div>
                </div>
              ))}
              {askingFollowUp && <div style={{fontSize:15,color:COLORS.slate,marginBottom:10}}>Thinking…</div>}
              <div style={{display:"flex",gap:8}}>
                <input
                  style={{...S.input,marginBottom:0,flex:1}}
                  placeholder="e.g. what if I retire at 62 instead?"
                  value={followUp}
                  onChange={e=>setFollowUp(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")askFollowUp();}}
                />
                <button style={{...S.btnSm,flexShrink:0}} onClick={askFollowUp} disabled={askingFollowUp}>Ask</button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

function Finance(){
  const accounts    = useTable("retirement_accounts","name",true);
  const assumptions = useTable("retirement_assumptions","id",true);
  const collegeSav  = useTable("college_savings","id",true);
  const collegeGoal = useTable("college_goal","id",true);
  const mortgage    = useTable("mortgage","id",true);
  const otherDebt   = useTable("other_debt","name",true);
  const snapshots   = useTable("net_worth_snapshots","date",false);
  const actionItems = useTable("finance_action_items","created_date",false);

  const [tab,setTab]             = useState("summary");
  const [showModal,setShowModal] = useState(null);
  const [editItem,setEditItem]   = useState(null);
  const [form,setForm]           = useState({});
  const [activeSwipe,setActiveSwipe] = useState(null);
  const [showRetBrief,setShowRetBrief] = useState(false);
  const [showBridgeMath,setShowBridgeMath] = useState(false);
  const [showBridgeTable,setShowBridgeTable] = useState(false);
  const [showAnalysis,setShowAnalysis] = useState(false);
  const [showTimeline,setShowTimeline] = useState(false);
  const [monteCarloResults,setMonteCarloResults] = useState(null);
  const [monteCarloRunning,setMonteCarloRunning] = useState(false);
  const [spendingResults,setSpendingResults] = useState(null);
  const [spendingRunning,setSpendingRunning] = useState(false);
  const [contribResults,setContribResults] = useState(null);
  const [contribRunning,setContribRunning] = useState(false);

  function openEdit(modal,item){ setEditItem(item); setForm({...item}); setShowModal(modal); setActiveSwipe(null); }
  function closeModal(){ setShowModal(null); setEditItem(null); setForm({}); }

  // Declare assump early so run functions can close over it correctly
  const assump = assumptions.data[0];
  const collegeS = collegeSav.data[0];
  const collegeG = collegeGoal.data.find(g=>g.child_name==="Aubrey") || collegeGoal.data[0];
  const mort = mortgage.data[0];

  function runMonteCarlo() {
    if(!assump) return;
    setMonteCarloRunning(true);
    setMonteCarloResults(null);
    setTimeout(() => {
      const results = buildMonteCarloComparison(accounts.data, assump, 1000);
      setMonteCarloResults(results);
      setMonteCarloRunning(false);
    }, 50);
  }

  function runSpendingSensitivity() {
    if(!assump) return;
    setSpendingRunning(true);
    setSpendingResults(null);
    setTimeout(() => {
      const results = buildSpendingSensitivity(accounts.data, assump, 500);
      setSpendingResults(results);
      setSpendingRunning(false);
    }, 50);
  }

  function runContribImpact() {
    if(!assump) return;
    setContribRunning(true);
    setContribResults(null);
    setTimeout(() => {
      const results = buildContributionImpact(accounts.data, assump, 500);
      setContribResults(results);
      setContribRunning(false);
    }, 50);
  }

  const retProj = assump ? calcRetirementProjection(accounts.data, assump) : null;
  const readinessChecklist = retProj && assump ? buildReadinessChecklist(retProj, monteCarloResults, assump) : [];
  const collegeProj = calcCollegeProjection(collegeS, collegeG);
  const pooledCollegeProj = calcPooledCollegeProjection(collegeS, collegeGoal.data);

  const mortMonths = mort ? calcPayoffMonths(mort.current_balance, mort.interest_rate, mort.monthly_payment + (mort.extra_payment_monthly||0)) : null;
  const mortMonthsNoExtra = mort ? calcPayoffMonths(mort.current_balance, mort.interest_rate, mort.monthly_payment) : null;
  const mortInterest = mort && mortMonths ? calcTotalInterest(mort.current_balance, mort.interest_rate, mort.monthly_payment+(mort.extra_payment_monthly||0), mortMonths) : null;
  const interestSaved = mort && mortMonths && mortMonthsNoExtra && mort.extra_payment_monthly>0
    ? calcTotalInterest(mort.current_balance, mort.interest_rate, mort.monthly_payment, mortMonthsNoExtra) - mortInterest
    : null;

  const incomeTimeline = assump && retProj?.drawdown ? buildIncomeTimeline(assump, retProj.drawdown) : [];
  const familyMilestones = assump ? buildFamilyMilestones(assump, collegeGoal.data, mort, mortMonths, retProj) : [];

  const totalRetirement = accounts.data.reduce((s,a)=>s+(a.balance||0),0);
  const totalCollege = collegeS?.balance || 0;
  const homeValue = mort?.home_value || 0;
  const totalMortgageDebt = mort?.current_balance || 0;
  const homeEquity = homeValue - totalMortgageDebt;
  const totalOtherDebt = otherDebt.data.reduce((s,d)=>s+(d.balance||0),0);
  const netWorth = totalRetirement + totalCollege + homeValue - totalMortgageDebt - totalOtherDebt;
  const totalAssets = totalRetirement + totalCollege + homeValue;
  const totalLiabilities = totalMortgageDebt + totalOtherDebt;

  const retStale = accounts.data.length>0 ? staleness(accounts.data.sort((a,b)=>new Date(a.last_updated)-new Date(b.last_updated))[0]?.last_updated) : {stale:false};
  const collegeStale = collegeS ? staleness(collegeS.last_updated) : {stale:false};
  const mortStale = mort ? staleness(mort.last_updated) : {stale:false};

  async function saveAccount(){
    if(!form.name||!form.balance) return;
    try{
      const row={name:form.name,account_type:form.account_type||"other",balance:+form.balance,monthly_contribution:+form.monthly_contribution||0,employer_match:+form.employer_match||0,contribution_frequency:form.contribution_frequency||"monthly",tax_treatment:form.tax_treatment||"pre-tax",last_updated:form.last_updated||TODAY_STR,notes:form.notes||""};
      if(editItem) await accounts.update(editItem.id,row); else await accounts.insert(row);
    }catch(e){console.error("saveAccount failed",e);}
    closeModal();
  }
  async function saveAssumptions(){
    try{
      const row={current_age:+form.current_age||0,retirement_age:+form.retirement_age||0,annual_return_pct:+form.annual_return_pct||0,withdrawal_rate_pct:+form.withdrawal_rate_pct||0,annual_retirement_spending:+form.annual_retirement_spending||0,social_security_estimate:+form.social_security_estimate||0,social_security_estimate_spouse:+form.social_security_estimate_spouse||0,ss_claim_age_spouse:+form.ss_claim_age_spouse||67,healthcare_estimate:+form.healthcare_estimate||0,contribution_increase_pct:+form.contribution_increase_pct||0,bridge_end_age:+form.medicare_age||65,medicare_age:+form.medicare_age||65,ss_claim_age:+form.ss_claim_age||67,plan_end_age:+form.plan_end_age||90,inflation_pct:+form.inflation_pct||3,conservative_rate_pct:+form.conservative_rate_pct||5,moderate_rate_pct:+form.moderate_rate_pct||7,aggressive_rate_pct:+form.aggressive_rate_pct||9,drawdown_rate_pct:+form.drawdown_rate_pct||5,return_volatility_pct:+form.return_volatility_pct||15};
      if(assump && assump.id) await assumptions.update(assump.id,row); else await assumptions.insert(row);
    }catch(e){console.error("saveAssumptions failed",e);}
    closeModal();
  }
  async function saveCollegeSavings(){
    try{
      const row={balance:+form.balance||0,monthly_contribution:+form.monthly_contribution||0,last_updated:form.last_updated||TODAY_STR,notes:form.notes||""};
      if(collegeS && collegeS.id) await collegeSav.update(collegeS.id,row); else await collegeSav.insert(row);
    }catch(e){console.error("saveCollegeSavings failed",e);}
    closeModal();
  }
  async function saveCollegeGoal(){
    try{
      const row={target_amount:+form.target_amount||0,target_year:+form.target_year||new Date().getFullYear(),notes:form.notes||""};
      if(collegeG && collegeG.id) await collegeGoal.update(collegeG.id,row); else await collegeGoal.insert(row);
    }catch(e){console.error("saveCollegeGoal failed",e);}
    closeModal();
  }
  async function saveMortgage(){
    try{
      const row={current_balance:+form.current_balance||0,interest_rate:+form.interest_rate||0,monthly_payment:+form.monthly_payment||0,term_years:+form.term_years||30,start_date:form.start_date||"",extra_payment_monthly:+form.extra_payment_monthly||0,home_value:+form.home_value||0,last_updated:form.last_updated||TODAY_STR};
      if(mort && mort.id) await mortgage.update(mort.id,row); else await mortgage.insert(row);
    }catch(e){console.error("saveMortgage failed",e);}
    closeModal();
  }
  async function saveDebt(){
    if(!form.name||!form.balance) return;
    try{
      const row={name:form.name,balance:+form.balance,interest_rate:+form.interest_rate||0,payment_amount:+form.payment_amount||0,payment_frequency:form.payment_frequency||"monthly",extra_payment:+form.extra_payment||0,last_updated:form.last_updated||TODAY_STR,notes:form.notes||""};
      if(editItem) await otherDebt.update(editItem.id,row); else await otherDebt.insert(row);
    }catch(e){console.error("saveDebt failed",e);}
    closeModal();
  }
  async function saveSnapshot(){
    try{
      const row={date:form.date||TODAY_STR,total_assets:totalAssets,total_liabilities:totalLiabilities,net_worth:netWorth,notes:form.notes||""};
      await snapshots.insert(row);
    }catch(e){console.error("saveSnapshot failed",e);}
    closeModal();
  }
  async function saveActionItem(){
    if(!form.title) return;
    try{
      const row={title:form.title,category:form.category||"other",priority:form.priority||"med",completed:false,created_date:TODAY_STR};
      await actionItems.insert(row);
    }catch(e){console.error("saveActionItem failed",e);}
    closeModal();
  }

  const accountTypeColors={"403b":COLORS.blue,"401k":COLORS.blue,IRA:COLORS.purple,HSA:COLORS.green,brokerage:COLORS.amber,cash:COLORS.slate,other:COLORS.slate};
  const priorityColors={high:COLORS.red,med:COLORS.amber,low:COLORS.slate};

  return(
    <div style={S.screen}>
      <div style={{...S.card,background:COLORS.navyLight,borderLeft:`3px solid ${COLORS.green}`,marginBottom:16}}>
        <div style={{fontSize:15,color:COLORS.green,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase"}}>Net Worth</div>
        <div style={{fontSize:30,fontWeight:800,marginTop:2}}>{formatMoney(netWorth)}</div>
        <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>{formatMoney(totalAssets)} assets · {formatMoney(totalLiabilities)} liabilities</div>
      </div>

      <div style={S.tabs}>
        {["summary","retire","college","debt","timeline"].map(t=><button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {tab==="summary"&&<>
        {/* Net Worth Hero */}
        {retProj&&(
          <div style={{background:COLORS.navyMid,borderRadius:16,padding:"20px 18px",marginBottom:16,border:`1px solid ${COLORS.navyLight}`,borderTop:`3px solid ${retProj.statusColor}`}}>
            <div style={{fontSize:15,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Financial Snapshot</div>
            <div style={{fontSize:28,fontWeight:800,letterSpacing:"-0.5px"}}>{formatMoneyShort(netWorth)}</div>
            <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>estimated net worth</div>
            <div style={{display:"flex",gap:16,marginTop:14,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:15,color:COLORS.slate}}>Retirement</div>
                <div style={{fontSize:15,fontWeight:700,marginTop:2}}>{formatMoneyShort(retProj.totalBalance)}</div>
              </div>
              {collegeS&&<div>
                <div style={{fontSize:15,color:COLORS.slate}}>College 529</div>
                <div style={{fontSize:15,fontWeight:700,marginTop:2}}>{formatMoneyShort(collegeS.balance)}</div>
              </div>}
              {mort&&<div>
                <div style={{fontSize:15,color:COLORS.slate}}>Mortgage</div>
                <div style={{fontSize:15,fontWeight:700,color:COLORS.red,marginTop:2}}>({formatMoneyShort(mort.current_balance)})</div>
              </div>}
            </div>
          </div>
        )}

        {/* Staleness warnings */}
        {(retStale.stale||collegeStale.stale||mortStale.stale)&&(
          <div style={{...S.card,background:COLORS.amber+"11",borderColor:COLORS.amber+"33",marginBottom:12}}>
            <div style={{fontSize:15,fontWeight:700,color:COLORS.amber,marginBottom:10}}>⚠️ Some balances may be out of date</div>
            {retStale.stale&&<div style={{fontSize:15,color:COLORS.slateLight,marginBottom:2}}>• Retirement: {retStale.days?`${retStale.days}d ago`:"never updated"}</div>}
            {collegeStale.stale&&<div style={{fontSize:15,color:COLORS.slateLight,marginBottom:2}}>• College: {collegeStale.days?`${collegeStale.days}d ago`:"never updated"}</div>}
            {mortStale.stale&&<div style={{fontSize:15,color:COLORS.slateLight}}>• Mortgage: {mortStale.days?`${mortStale.days}d ago`:"never updated"}</div>}
          </div>
        )}

        <div style={{...S.sectionLabel,marginTop:20}}>Goals at a Glance</div>
        <div style={{height:1,background:COLORS.navyLight,marginBottom:16,marginTop:-8}}/>

        {retProj&&(
          <div style={{...S.card,borderLeft:`3px solid ${retProj.statusColor}`,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:15,fontWeight:700}}>🏦 Retirement</div>
              <span style={{fontSize:15,color:retProj.statusColor,fontWeight:700}}>{retProj.statusLabel.split("—")[0].trim()}</span>
            </div>
            <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>Age {assump.retirement_age} · {formatMoneyShort(retProj.spendableTodaysDollars)} projected vs {formatMoneyShort(retProj.targetNumberToday)} needed (today's $)</div>
            {retProj.gap>0
              ?<div style={{fontSize:15,color:COLORS.amber,marginTop:10,fontWeight:600}}>Gap: {formatMoneyShort(retProj.gap)} — ~{formatMoney(retProj.monthlyNeeded)}/mo more</div>
              :<div style={{fontSize:15,color:COLORS.green,marginTop:10,fontWeight:600}}>On track — surplus {formatMoneyShort(-retProj.gap)}</div>
            }
            <div style={S.progress}><div style={S.progressFill(Math.min(100,retProj.totalBalance/retProj.targetNumberInflated*100), retProj.statusColor)}/></div>
          </div>
        )}

        {pooledCollegeProj&&(
          <div style={{...S.card,borderLeft:`3px solid ${pooledCollegeProj.anyShortfall?COLORS.amber:COLORS.green}`,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:15,fontWeight:700}}>🎓 College (3 kids)</div>
              <span style={{fontSize:15,color:pooledCollegeProj.anyShortfall?COLORS.amber:COLORS.green,fontWeight:700}}>{pooledCollegeProj.anyShortfall?`${pooledCollegeProj.perChild.filter(c=>!c.fullyFunded).length} short`:"On track ✓"}</span>
            </div>
            <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>{pooledCollegeProj.perChild.map(c=>`${c.child_name} ${c.target_year}`).join(" → ")} · {formatMoneyShort(pooledCollegeProj.totalTargets)} total</div>
            {pooledCollegeProj.anyShortfall&&<div style={{fontSize:15,color:COLORS.amber,marginTop:10,fontWeight:600}}>Increase to ~{formatMoney(pooledCollegeProj.suggestedMonthly)}/mo to fund all three</div>}
            <div style={S.progress}><div style={S.progressFill(Math.min(100,(collegeS?.balance||0)/pooledCollegeProj.totalTargets*100), pooledCollegeProj.anyShortfall?COLORS.amber:COLORS.green)}/></div>
          </div>
        )}

        {mort&&mortMonths&&(
          <div style={{...S.card,borderLeft:`3px solid ${COLORS.blue}`,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:15,fontWeight:700}}>🏠 Mortgage</div>
              <span style={{fontSize:15,color:COLORS.blue,fontWeight:700}}>{monthsToDate(mortMonths)}</span>
            </div>
            <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>{formatMoney(mort.current_balance)} remaining at {mort.interest_rate}% · {formatMoney(mort.monthly_payment)}/mo</div>
            <div style={S.progress}><div style={S.progressFill(Math.min(100,100-(mort.current_balance/(mort.original_balance||mort.current_balance*1.5))*100), COLORS.blue)}/></div>
          </div>
        )}

        {otherDebt.data.map(d=>{
          const months=calcPayoffMonths(d.balance, d.interest_rate, d.payment_frequency==="biweekly"?d.payment_amount*2.17:d.payment_amount);
          return(
            <div key={d.id} style={{...S.card,borderLeft:`3px solid ${COLORS.red}`,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:15,fontWeight:700}}>💳 {d.name}</div>
                <span style={{fontSize:15,color:COLORS.red,fontWeight:700}}>{months?monthsToDate(months):"—"}</span>
              </div>
              <div style={{fontSize:15,color:COLORS.slate,marginTop:10}}>{formatMoney(d.balance)} at {d.interest_rate}%</div>
            </div>
          );
        })}

        {actionItems.data.filter(a=>!a.completed).length>0&&<>
          <div style={S.sectionLabel}>Action Items</div>
          {actionItems.data.filter(a=>!a.completed).map(a=>(
            <div key={a.id} style={S.statusCard(priorityColors[a.priority])}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:15,fontWeight:600,flex:1,paddingRight:10}}>{a.title}</div>
                <button style={S.btnCheck} onClick={()=>actionItems.update(a.id,{completed:true})}>✓</button>
              </div>
            </div>
          ))}
        </>}
        <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>{setForm({priority:"med",category:"other"});setShowModal("action");}}>+ Add Action Item</button>

        {snapshots.data.length>0&&<>
          <div style={S.sectionLabel}>Net Worth History</div>
          {snapshots.data.slice(0,5).map(s=>(
            <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${COLORS.navyLight}`}}>
              <div style={{fontSize:15,color:COLORS.slate}}>{formatDate(s.date)}</div>
              <div style={{fontSize:15,fontWeight:700}}>{formatMoney(s.net_worth)}</div>
            </div>
          ))}
        </>}
        <button style={{...S.btnSm,width:"100%",marginTop:12}} onClick={()=>{setForm({date:TODAY_STR});setShowModal("snapshot");}}>📸 Save Snapshot</button>
      </>}

            {tab==="retire"&&<>
        {/* ── Settings button ── */}
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          <button onClick={()=>{setForm({...assump});setShowModal("assumptions");}} style={{background:COLORS.navyLight,border:`1px solid ${COLORS.navyLight}`,borderRadius:8,padding:"6px 12px",fontSize:13,fontWeight:700,color:COLORS.slateLight,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            ⚙️ Edit Assumptions
          </button>
        </div>

        {retProj&&<>
        {/* ── 1. STATUS HERO ── */}
        <div style={{...S.card,background:retProj.statusColor+"18",borderColor:retProj.statusColor+"44",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{width:12,height:12,borderRadius:"50%",background:retProj.statusColor,flexShrink:0}}/>
                <div style={{fontSize:20,fontWeight:800,color:retProj.statusColor,letterSpacing:"-0.3px"}}>{retProj.statusLabel}</div>
              </div>
              <div style={{fontSize:13,color:COLORS.slate,lineHeight:1.5}}>{retProj.statusDetail}</div>
              {retProj.drawdown.lastsFullPlan&&<div style={{fontSize:12,color:COLORS.slate,marginTop:4}}>~{formatMoneyShort(retProj.drawdown.finalBalance)} expected at age {retProj.drawdown.planEndAge}</div>}
              <div style={{fontSize:11,color:COLORS.slate,marginTop:6,fontStyle:"italic"}}>Steady {assump.drawdown_rate_pct||5}% return — see Simulations below for realistic range</div>
            </div>
          </div>
          {retProj.quickRecs.length>0&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${retProj.statusColor}33`}}>
            {retProj.quickRecs.map((rec,i)=><div key={i} style={{fontSize:13,color:COLORS.slateLight,lineHeight:1.5,marginBottom:i<retProj.quickRecs.length-1?4:0}}>• {rec}</div>)}
          </div>}
          {/* MC success rate inline when available */}
          {monteCarloResults&&(()=>{
            const cur=monteCarloResults.find(r=>r.label==="Current Plan");
            if(!cur)return null;
            const diverges=(retProj.status==="excellent"||retProj.status==="ontrack")&&cur.successRate<75||!(retProj.status==="excellent"||retProj.status==="ontrack")&&cur.successRate>=85;
            return(<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${retProj.statusColor}33`}}>
              <span style={{fontSize:14,color:COLORS.slateLight}}>🎲 Realistic success rate: </span>
              <strong style={{color:cur.successRate>=85?COLORS.green:cur.successRate>=70?COLORS.amber:COLORS.red,fontSize:15}}>{cur.successRate}%</strong>
              {diverges&&<div style={{fontSize:12,color:COLORS.amber,marginTop:4}}>⚠️ Differs from steady-return badge — see Simulations below</div>}
            </div>);
          })()}
        </div>

        {/* ── 2. KEY NUMBERS ── */}
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <div style={{...S.card,flex:1,marginBottom:0,textAlign:"center",padding:"14px 8px"}}>
            <div style={{fontSize:11,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700}}>Balance</div>
            <div style={{fontSize:20,fontWeight:800,marginTop:6,letterSpacing:"-0.3px"}}>{formatMoneyShort(retProj.totalBalance)}</div>
          </div>
          <div style={{...S.card,flex:1,marginBottom:0,textAlign:"center",padding:"14px 8px"}}>
            <div style={{fontSize:11,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700}}>Monthly</div>
            <div style={{fontSize:20,fontWeight:800,marginTop:6,letterSpacing:"-0.3px"}}>{formatMoney(retProj.totalMonthly)}</div>
          </div>
          <div style={{...S.card,flex:1,marginBottom:0,textAlign:"center",padding:"14px 8px"}}>
            <div style={{fontSize:11,color:COLORS.slate,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:700}}>Gap</div>
            <div style={{fontSize:20,fontWeight:800,marginTop:6,letterSpacing:"-0.3px",color:retProj.gap>0?COLORS.amber:COLORS.green}}>{retProj.gap>0?formatMoneyShort(retProj.gap):"✓"}</div>
          </div>
        </div>

        {/* ── 3. BRIEF BUTTON ── */}
        <button onClick={()=>setShowRetBrief(true)} style={{width:"100%",background:COLORS.purple,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:700,cursor:"pointer",marginBottom:12}}>
          🤖 Retirement Brief
        </button>

        {/* ── 4. PROJECTION + READINESS (collapsible) ── */}
        {(()=>{
          return(<div style={{...S.card,marginBottom:12}}>
            <button onClick={()=>setShowAnalysis(p=>!p)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:COLORS.white}}>📊 Projection Scenarios</div>
              <div style={{fontSize:13,color:COLORS.blue}}>{showAnalysis?"▲ Hide":"▼ Show"}</div>
            </button>
            {showAnalysis&&<>
              <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${COLORS.navyLight}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:13,color:COLORS.slate}}>At age {assump.retirement_age} ({retProj.years}y away)</div>
                  <Sparkline data={retProj.trajectory.map(t=>t.balance)} color={COLORS.blue}/>
                </div>
                {retProj.scenarios.map(s=>(
                  <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${COLORS.navyLight}`}}>
                    <div style={{fontSize:13,color:COLORS.slateLight}}>{s.label} ({s.rate}%)</div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:14,fontWeight:700,color:s.color}}>{formatMoneyShort(s.projectedTodaysDollars)}</div>
                      <div style={{fontSize:11,color:COLORS.slate}}>{formatMoneyShort(s.projected)} future $</div>
                    </div>
                  </div>
                ))}
                <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${COLORS.navyLight}`}}>
                  <div style={{fontSize:13,color:COLORS.slate}}>Target (today's $): <strong style={{color:COLORS.white}}>{formatMoneyShort(retProj.targetNumberToday)}</strong></div>
                  <div style={{fontSize:13,color:COLORS.slate,marginTop:3}}>Spendable after tax: <strong style={{color:COLORS.white}}>{formatMoneyShort(retProj.spendableTodaysDollars)}</strong></div>
                  <div style={{fontSize:13,color:retProj.gap>0?COLORS.amber:COLORS.green,marginTop:8,fontWeight:600}}>
                    {retProj.gap>0?`Gap: ${formatMoneyShort(retProj.gap)} — +${formatMoney(retProj.monthlyNeeded)}/mo needed`:`Surplus: ${formatMoneyShort(-retProj.gap)}`}
                  </div>
                </div>
              </div>
              {readinessChecklist.length>0&&<>
                <div style={{fontSize:13,fontWeight:700,color:COLORS.blue,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:14,marginBottom:8}}>Readiness Checklist</div>
                {readinessChecklist.map((item,i)=>{
                  const icon=item.status==="good"?"✅":item.status==="watch"?"⚠️":item.status==="risk"?"🔴":"❔";
                  const color=item.status==="good"?COLORS.green:item.status==="watch"?COLORS.amber:item.status==="risk"?COLORS.red:COLORS.slate;
                  return(<div key={i} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:i<readinessChecklist.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                    <span style={{fontSize:14,flexShrink:0}}>{icon}</span>
                    <div><div style={{fontSize:13,fontWeight:700,color}}>{item.label}</div><div style={{fontSize:12,color:COLORS.slate,marginTop:1,lineHeight:1.4}}>{item.detail}</div></div>
                  </div>);
                })}
              </>}
            </>}
        </div>

        {/* ── 5. BRIDGE YEARS ── */}
        {retProj.bridgeYears>0&&(()=>{
          const d=retProj.drawdown;
          const bridgeOk=d.bridgeShortfall<=0;
          const r55Pct=Math.round(retProj.ruleOf55Share*100);
          const spouseSSAge=assump.ss_claim_age_spouse||67;
          const userSSAge=assump.ss_claim_age||67;
          return(
            <div style={{...S.card,borderTop:`3px solid ${bridgeOk?COLORS.amber:COLORS.red}`,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:3}}>Early Retirement Bridge</div>
                  <div style={{fontSize:18,fontWeight:800,letterSpacing:"-0.3px"}}>Age {assump.retirement_age} → {d.medicareAge}</div>
                  <div style={{fontSize:12,color:COLORS.slate,marginTop:2}}>{retProj.bridgeYears} year{retProj.bridgeYears!==1?"s":""} before Medicare</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                  <div style={{fontSize:18,fontWeight:800,color:bridgeOk?COLORS.green:COLORS.red}}>{bridgeOk?"✓ Covered":"⚠️ Short"}</div>
                  {!bridgeOk&&<div style={{fontSize:12,color:COLORS.red,marginTop:2}}>~{formatMoneyShort(d.bridgeShortfall)}</div>}
                </div>
              </div>
              <div style={{background:COLORS.navyLight,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                <div style={{fontSize:10,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Phase Timeline</div>
                {[
                  {age:assump.retirement_age,label:"Retire",detail:`Rule of 55 funds (${r55Pct}% of balance)`,color:COLORS.blue,icon:"🏁"},
                  Math.min(userSSAge,spouseSSAge)<d.medicareAge?{age:Math.min(userSSAge,spouseSSAge),label:"First SS",detail:`${userSSAge<=spouseSSAge?"Your":"Kalee's"} SS starts — ${formatMoneyShort(userSSAge<=spouseSSAge?(+(assump.social_security_estimate)||0):(+(assump.social_security_estimate_spouse)||0))}/yr`,color:COLORS.green,icon:"💰"}:null,
                  {age:d.medicareAge,label:"Medicare",detail:"Healthcare coverage begins",color:COLORS.blue,icon:"🏥"},
                  Math.max(userSSAge,spouseSSAge)>=d.medicareAge?{age:Math.max(userSSAge,spouseSSAge),label:`${userSSAge>=spouseSSAge?"Your":"Kalee's"} SS`,detail:`Full household SS: ${formatMoneyShort((+(assump.social_security_estimate)||0)+(+(assump.social_security_estimate_spouse)||0))}/yr`,color:COLORS.green,icon:"💰"}:null,
                ].filter(Boolean).map((phase,i,arr)=>(
                  <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",paddingBottom:i<arr.length-1?8:0,marginBottom:i<arr.length-1?8:0,borderBottom:i<arr.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                    <div style={{width:26,height:26,borderRadius:8,background:phase.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{phase.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:2}}>
                        <span style={{fontSize:12,fontWeight:700,color:phase.color}}>Age {phase.age}</span>
                        <span style={{fontSize:12,fontWeight:600,color:COLORS.white}}>{phase.label}</span>
                      </div>
                      <div style={{fontSize:11,color:COLORS.slate,lineHeight:1.4}}>{phase.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:12,color:COLORS.slateLight,lineHeight:1.6,marginBottom:8}}>
                <strong style={{color:COLORS.white}}>Rule of 55:</strong> Penalty-free withdrawals from current employer's 403(b)/401(k) when leaving at 55+. ~{r55Pct}% of your balance ({formatMoneyShort(retProj.ruleOf55Balance)}) qualifies.
              </div>
              <button onClick={()=>setShowBridgeTable(p=>!p)} style={{fontSize:12,color:COLORS.blue,background:"none",border:"none",cursor:"pointer",padding:0,textDecoration:"underline",marginBottom:showBridgeTable?10:0}}>
                {showBridgeTable?"Hide year-by-year":"Year-by-year breakdown →"}
              </button>
              {showBridgeTable&&d.bridgeSchedule&&d.bridgeSchedule.length>0&&(
                <div style={{marginTop:8}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4,marginBottom:6}}>
                    {["Age","Need","R55","Total"].map(h=><div key={h} style={{fontSize:10,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",textAlign:"right",paddingRight:4}}>{h}</div>)}
                  </div>
                  {d.bridgeSchedule.map((row,i)=>{
                    const low=row.ruleOf55Pool<row.needYear;
                    return(<div key={row.age} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4,padding:"4px 0",borderBottom:i<d.bridgeSchedule.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                      <div style={{fontSize:11,fontWeight:600}}>Age {row.age}</div>
                      <div style={{fontSize:11,color:COLORS.slate,textAlign:"right",paddingRight:4}}>{formatMoneyShort(row.needYear)}</div>
                      <div style={{fontSize:11,color:low?COLORS.red:COLORS.slate,textAlign:"right",paddingRight:4}}>{formatMoneyShort(row.ruleOf55Pool)}</div>
                      <div style={{fontSize:11,fontWeight:600,color:row.balance>0?COLORS.white:COLORS.red,textAlign:"right",paddingRight:4}}>{formatMoneyShort(row.balance)}</div>
                    </div>);
                  })}
                </div>
              )}
              <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${COLORS.navyLight}`}}>
                {bridgeOk
                  ?<div style={{fontSize:12,color:COLORS.green,fontWeight:600}}>✓ Rule of 55 funds fully cover the bridge. No penalty withdrawals needed.</div>
                  :<div style={{fontSize:12,color:COLORS.red,fontWeight:600}}>⚠️ Bridge short by ~{formatMoneyShort(d.bridgeShortfall)} — will need IRA early withdrawal (10% penalty) or taxable savings.</div>
                }
              </div>
            </div>
          );
        })()}

        {/* ── 6. SIMULATIONS (all grouped) ── */}
        <div style={{...S.card,borderTop:`3px solid ${COLORS.purple}`,marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700,color:COLORS.white,marginBottom:4}}>🎲 Simulations</div>
          <div style={{fontSize:12,color:COLORS.slate,marginBottom:14,lineHeight:1.5}}>1,000 randomized-return paths per scenario. More realistic than steady-return projections above.</div>

          {/* Probability of Success */}
          <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Probability of Success (age {assump.retirement_age} scenarios)</div>
          {!monteCarloResults&&!monteCarloRunning&&(
            <button onClick={runMonteCarlo} style={{...S.btn,background:COLORS.purple,marginTop:0,marginBottom:12,fontSize:14}}>Run Monte Carlo</button>
          )}
          {monteCarloRunning&&<div style={{textAlign:"center",padding:"16px 0",color:COLORS.slate,fontSize:13,marginBottom:12}}>Running 4,000 simulations…</div>}
          {monteCarloResults&&!monteCarloRunning&&(()=>{
            const successColor=r=>r>=85?COLORS.green:r>=70?COLORS.amber:COLORS.red;
            return(<>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:12}}>
                {monteCarloResults.map(r=>(
                  <div key={r.label} style={{background:COLORS.navyLight,borderRadius:10,padding:"12px",textAlign:"center"}}>
                    <div style={{fontSize:11,color:COLORS.slate,marginBottom:4,fontWeight:600}}>{r.label}</div>
                    <div style={{fontSize:22,fontWeight:800,color:successColor(r.successRate)}}>{r.successRate}%</div>
                    <div style={{fontSize:10,color:COLORS.slate,marginTop:2}}>Age {r.retirementAge}</div>
                    {r.medianFinalBalance>0&&<div style={{fontSize:11,color:COLORS.slate,marginTop:2}}>{formatMoneyShort(r.medianFinalBalance)} median</div>}
                  </div>
                ))}
              </div>
              <button onClick={runMonteCarlo} style={{...S.btnSm,width:"100%",textAlign:"center",marginBottom:12}}>↺ Re-run</button>
            </>);
          })()}

          {/* What-If retirement age */}
          <div style={{borderTop:`1px solid ${COLORS.navyLight}`,paddingTop:14,marginBottom:14}}>
            <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>What-If Retirement Age</div>
            {[assump.retirement_age-2,assump.retirement_age-1,assump.retirement_age,assump.retirement_age+1,assump.retirement_age+2].map(age=>{
              const proj=calcRetirementProjection(accounts.data,{...assump,retirement_age:age});
              if(!proj)return null;
              const isCurrent=age==assump.retirement_age;
              return(<div key={age} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${COLORS.navyLight}`,background:isCurrent?COLORS.navyLight:"transparent",borderRadius:isCurrent?6:0,paddingLeft:isCurrent?8:0,paddingRight:isCurrent?8:0}}>
                <div style={{fontSize:13,fontWeight:isCurrent?700:400,color:isCurrent?COLORS.white:COLORS.slateLight}}>Age {age}{isCurrent?" ◀ current":""}</div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700,color:proj.statusColor}}>{formatMoneyShort(proj.spendableTodaysDollars)}</div>
                  <div style={{fontSize:11,color:COLORS.slate}}>{proj.statusLabel.split("—")[0].trim()}</div>
                </div>
              </div>);
            })}
          </div>

          {/* Spending sensitivity */}
          <div style={{borderTop:`1px solid ${COLORS.navyLight}`,paddingTop:14,marginBottom:14}}>
            <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Spending Sensitivity</div>
            {!spendingResults&&!spendingRunning&&<button onClick={runSpendingSensitivity} style={{...S.btnSm,width:"100%",textAlign:"center",marginBottom:12}}>Run Spending Analysis</button>}
            {spendingRunning&&<div style={{textAlign:"center",padding:"12px 0",color:COLORS.slate,fontSize:13}}>Running…</div>}
            {spendingResults&&!spendingRunning&&spendingResults.map(r=>(
              <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${COLORS.navyLight}`,background:r.isCurrent?COLORS.navyLight:"transparent",borderRadius:r.isCurrent?6:0,paddingLeft:r.isCurrent?8:0,paddingRight:r.isCurrent?8:0}}>
                <div style={{fontSize:13,fontWeight:r.isCurrent?700:400,color:r.isCurrent?COLORS.white:COLORS.slateLight}}>{r.label}{r.isCurrent?" ◀":""}</div>
                <div style={{fontSize:13,fontWeight:700,color:r.successRate>=85?COLORS.green:r.successRate>=70?COLORS.amber:COLORS.red}}>{r.successRate}%</div>
              </div>
            ))}
          </div>

          {/* Contribution impact */}
          <div style={{borderTop:`1px solid ${COLORS.navyLight}`,paddingTop:14}}>
            <div style={{fontSize:11,color:COLORS.slate,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>Contribution Impact</div>
            {!contribResults&&!contribRunning&&<button onClick={runContribImpact} style={{...S.btnSm,width:"100%",textAlign:"center",marginBottom:12}}>Run Contribution Analysis</button>}
            {contribRunning&&<div style={{textAlign:"center",padding:"12px 0",color:COLORS.slate,fontSize:13}}>Running…</div>}
            {contribResults&&!contribRunning&&contribResults.map(r=>(
              <div key={r.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${COLORS.navyLight}`,background:r.isCurrent?COLORS.navyLight:"transparent",borderRadius:r.isCurrent?6:0,paddingLeft:r.isCurrent?8:0,paddingRight:r.isCurrent?8:0}}>
                <div style={{fontSize:13,fontWeight:r.isCurrent?700:400,color:r.isCurrent?COLORS.white:COLORS.slateLight}}>{r.label}{r.isCurrent?" ◀":""}</div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:13,fontWeight:700,color:r.successRate>=85?COLORS.green:r.successRate>=70?COLORS.amber:COLORS.red}}>{r.successRate}%</div>
                  {r.medianFinalBalance>0&&<div style={{fontSize:11,color:COLORS.slate}}>{formatMoneyShort(r.medianFinalBalance)}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 7. INCOME TIMELINE (collapsible) ── */}
        {incomeTimeline.length>0&&(()=>{
          return(<div style={{...S.card,marginBottom:12}}>
            <button onClick={()=>setShowTimeline(p=>!p)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:COLORS.white}}>📈 Income by Phase</div>
              <div style={{fontSize:13,color:COLORS.blue}}>{showTimeline?"▲ Hide":"▼ Show"}</div>
            </button>
            {showTimeline&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${COLORS.navyLight}`}}>
              {incomeTimeline.map((band,i)=>(
                <div key={i} style={{paddingBottom:i<incomeTimeline.length-1?12:0,marginBottom:i<incomeTimeline.length-1?12:0,borderBottom:i<incomeTimeline.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <div style={{fontSize:14,fontWeight:700,color:band.color}}>Ages {band.ageRange}</div>
                    {band.avgAnnual&&<div style={{fontSize:13,color:COLORS.slateLight}}>{formatMoneyShort(band.avgAnnual)}/yr need</div>}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                    {band.sources.map(src=><span key={src} style={S.badge(band.color)}>{src}</span>)}
                  </div>
                  <div style={{fontSize:12,color:COLORS.slate,lineHeight:1.4}}>{band.detail}</div>
                </div>
              ))}
            </div>}
        </div>}

        {/* ── 8. ACCOUNTS ── */}
        <div style={S.sectionLabel}>Accounts</div>
        {accounts.data.map(a=>(
          <SwipeCard key={a.id} id={a.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
            onEdit={()=>openEdit("account",a)}
            onDelete={()=>{accounts.remove(a.id);setActiveSwipe(null);}}
            style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700}}>{a.name}</div>
                <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                  <span style={S.badge(COLORS.blue)}>{a.account_type}</span>
                  <span style={S.badge(a.tax_treatment==="Roth"?COLORS.green:COLORS.amber)}>{a.tax_treatment}</span>
                  {ruleOf55Eligible(a)&&<span style={S.badge(COLORS.purple)}>Rule of 55</span>}
                </div>
                <div style={{fontSize:12,color:COLORS.slate,marginTop:6}}>{formatMoney(a.monthly_contribution)}/mo{a.employer_match>0?` + ${formatMoney(a.employer_match)} match`:""}</div>
              </div>
              <div style={{fontSize:19,fontWeight:700,textAlign:"right",flexShrink:0,marginLeft:12}}>{formatMoneyShort(a.balance)}</div>
            </div>
          </SwipeCard>
        ))}
        {accounts.data.length===0&&<EmptyState icon="🏦" title="No accounts added" detail="Add your 401(k), IRA, and other retirement accounts to run projections."/>}
        <button style={S.btn} onClick={()=>{setForm({account_type:"401k",tax_treatment:"pre-tax",contribution_frequency:"biweekly"});setShowModal("account");}}>+ Add Account</button>
        </>}

        {showRetBrief&&<RetirementBrief accounts={accounts.data} assumptions={assump} retProj={retProj} monteCarloResults={monteCarloResults} onClose={()=>setShowRetBrief(false)}/>}
      </>}

      {tab==="college"&&<>
        {collegeS&&(
          <div style={{...S.card,background:COLORS.navyLight,marginBottom:12}}>
            <div style={{fontSize:15,color:COLORS.blue,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:10}}>Shared 529 Plan</div>
            <div style={{fontSize:28,fontWeight:800}}>{formatMoneyShort(collegeS.balance)}</div>
            <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{formatMoney(collegeS.monthly_contribution)}/mo combined contribution</div>
          </div>
        )}

        {pooledCollegeProj&&(
          <div style={{...S.card,background:COLORS.navyLight,marginBottom:12}}>
            <div style={{fontSize:15,color:COLORS.blue,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:10}}>Funding Sequence — one pool, three kids</div>
            <div style={{fontSize:15,color:COLORS.slate,marginBottom:12,lineHeight:1.5}}>
              The shared fund grows until each child's start year, their target is withdrawn, and the remainder keeps growing for the next.
            </div>
            {pooledCollegeProj.perChild.map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"9px 0",borderBottom:i<pooledCollegeProj.perChild.length-1?`1px solid ${COLORS.navyLight}`:"none"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:700}}>{c.child_name} — {c.target_year}</div>
                  <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>Pool at start: {formatMoneyShort(c.poolBalanceAtStart)} · Needs {formatMoneyShort(c.target_amount)}</div>
                </div>
                <span style={S.badge(c.fullyFunded?COLORS.green:COLORS.red)}>{c.fullyFunded?"funded":`short ${formatMoneyShort(c.shortfall)}`}</span>
              </div>
            ))}
            <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${COLORS.navyLight}`}}>
              {pooledCollegeProj.anyShortfall ? (
                <div style={{fontSize:15,color:COLORS.amber,fontWeight:600}}>
                  ⚠️ At current contributions ({formatMoney(pooledCollegeProj.currentContribution)}/mo), one or more kids come up short. Increasing to ~{formatMoney(pooledCollegeProj.suggestedMonthly)}/mo would fund all three in sequence.
                </div>
              ) : (
                <div style={{fontSize:15,color:COLORS.green,fontWeight:600}}>✓ Current contribution funds all three kids in sequence.</div>
              )}
            </div>
          </div>
        )}

        <div style={S.sectionLabel}>Per-Child Goals</div>
        <SwipeHint/>
        {collegeGoal.data.map(g=>(
          <SwipeCard key={g.id} id={g.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
            onEdit={()=>{setEditItem(g);setForm({...g});setShowModal("college-goal-child");}}
            onDelete={()=>{collegeGoal.remove(g.id);setActiveSwipe(null);}}
            style={{...S.card,borderLeft:`3px solid ${{Aubrey:COLORS.red,Blake:COLORS.green,Brayden:COLORS.amber}[g.child_name]||COLORS.slate}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:15,fontWeight:600}}>{g.child_name}</div>
                <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{g.target_year} · {formatMoneyShort(g.target_amount)} target</div>
              </div>
            </div>
            {g.notes&&<div style={{fontSize:15,color:COLORS.slateLight,marginTop:10,fontStyle:"italic"}}>{g.notes}</div>}
          </SwipeCard>
        ))}

        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button style={{...S.btnSm,flex:1}} onClick={()=>{setForm({...collegeS,last_updated:TODAY_STR});setShowModal("college-savings");}}>Update Pool Balance</button>
        </div>
      </>}

      {tab==="debt"&&<>
        {mort&&(
          <div style={{...S.card,background:COLORS.navyLight,marginBottom:12}}>
            <div style={{fontSize:15,color:COLORS.blue,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:10}}>Mortgage</div>
            <div style={{fontSize:26,fontWeight:800}}>{formatMoney(mort.current_balance)}</div>
            <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{mort.interest_rate}% · {formatMoney(mort.monthly_payment)}/mo{mort.extra_payment_monthly>0?` + ${formatMoney(mort.extra_payment_monthly)} extra`:""}</div>
            {mortMonths&&<div style={{fontSize:15,color:COLORS.green,marginTop:10,fontWeight:600}}>Payoff: {monthsToDate(mortMonths)} ({mortMonths} months)</div>}
            {interestSaved>0&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>Extra payments save ~{formatMoney(interestSaved)} in interest</div>}
            {homeValue>0&&(
              <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${COLORS.navyLight}`,display:"flex",justifyContent:"space-between"}}>
                <div style={{fontSize:15,color:COLORS.slate}}>Home value {formatMoney(homeValue)}</div>
                <div style={{fontSize:15,fontWeight:700,color:COLORS.green}}>{formatMoney(homeEquity)} equity</div>
              </div>
            )}
            <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>{setForm({...mort,last_updated:TODAY_STR});setShowModal("mortgage");}}>Update Mortgage</button>
          </div>
        )}

        <div style={S.sectionLabel}>Other Debt</div>
        <SwipeHint/>
        {otherDebt.data.map(d=>{
          const months = calcPayoffMonths(d.balance, d.interest_rate, d.payment_frequency==="biweekly"?d.payment_amount*2.17:d.payment_amount);
          return(
            <SwipeCard key={d.id} id={d.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
              onEdit={()=>openEdit("debt",d)}
              onDelete={()=>{otherDebt.remove(d.id);setActiveSwipe(null);}}
              style={S.statusCard(COLORS.red)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:600}}>{d.name}</div>
                  <div style={{fontSize:15,color:COLORS.slate,marginTop:2}}>{d.interest_rate}% · {formatMoney(d.payment_amount)} {d.payment_frequency}</div>
                  {months&&<div style={{fontSize:15,color:COLORS.amber,marginTop:2,fontWeight:600}}>Payoff: {monthsToDate(months)}</div>}
                  {d.notes&&<div style={{fontSize:15,color:COLORS.slate,marginTop:2,fontStyle:"italic"}}>{d.notes}</div>}
                </div>
                <div style={{fontSize:19,fontWeight:700,color:COLORS.red}}>{formatMoney(d.balance)}</div>
              </div>
            </SwipeCard>
          );
        })}
        <button style={S.btn} onClick={()=>{setForm({payment_frequency:"monthly",last_updated:TODAY_STR});setShowModal("debt");}}>+ Add Debt</button>
      </>}

      {tab==="timeline"&&<>
        <div style={{fontSize:15,color:COLORS.slate,marginBottom:16,lineHeight:1.5}}>
          Every dated milestone tracked across Finance and College, in one timeline. Tap a college milestone to edit its target year.
        </div>
        {familyMilestones.length===0&&<EmptyState icon="🗓️" title="No milestones yet" detail="Add college goals, a mortgage, and retirement assumptions to see your family timeline here."/>}
        {familyMilestones.map((m,i)=>{
          const yearsAway = m.year - new Date().getFullYear();
          const isCollege = m.label.includes("starts college");
          const goalRecord = isCollege ? collegeGoal.data.find(g=>m.label.startsWith(g.child_name)) : null;
          return(
            <div key={i} style={{display:"flex",gap:12,marginBottom:i<familyMilestones.length-1?4:0}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:24,flexShrink:0}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:m.color,flexShrink:0,marginTop:10}}/>
                {i<familyMilestones.length-1&&<div style={{width:2,flex:1,background:COLORS.navyLight,marginTop:10}}/>}
              </div>
              <div
                style={{...S.card,flex:1,borderLeft:`3px solid ${m.color}`,cursor:goalRecord?"pointer":"default",opacity:yearsAway<0?0.5:yearsAway>10?0.7:1}}
                onClick={()=>{ if(goalRecord){ setEditItem(goalRecord); setForm({...goalRecord}); setShowModal("college-goal-child"); } }}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,paddingRight:12}}>
                    <div style={{fontSize:15,fontWeight:700,letterSpacing:"-0.2px"}}>{m.icon} {m.label}</div>
                    <div style={{fontSize:13,color:COLORS.slate,marginTop:4,lineHeight:1.4}}>{m.detail}</div>
                    <div style={{fontSize:12,color:m.color,marginTop:6,fontWeight:700,letterSpacing:"0.2px",textTransform:"uppercase"}}>
                      {yearsAway<0?`${-yearsAway}y ago`:yearsAway===0?"this year":`in ${yearsAway}y`}
                    </div>
                  </div>
                  <div style={{fontSize:22,fontWeight:800,color:m.color,flexShrink:0,letterSpacing:"-0.5px"}}>{m.year}</div>
                </div>
              </div>
            </div>
          );
        })}
      </>}

      {showModal==="college-goal-child"&&<Modal title={`Edit ${editItem?.child_name}'s College Goal`} onClose={closeModal}>
        <label style={S.label}>Target Start Year</label>
        <input type="number" style={S.input} value={form.target_year||""} onChange={e=>setForm(p=>({...p,target_year:e.target.value}))}/>
        <label style={S.label}>Target Savings Amount</label>
        <input type="number" style={S.input} value={form.target_amount||""} onChange={e=>setForm(p=>({...p,target_amount:e.target.value}))}/>
        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="Grade, school targets, etc." value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={async()=>{
          try{
            const row={child_name:editItem.child_name,target_amount:+form.target_amount||0,target_year:+form.target_year||new Date().getFullYear(),notes:form.notes||""};
            await collegeGoal.update(editItem.id,row);
          }catch(e){console.error("save child goal failed",e);}
          closeModal();
        }}>Save Changes</button>
      </Modal>}

      {showModal==="account"&&<Modal title={editItem?"Edit Account":"Add Account"} onClose={closeModal}>
        <label style={S.label}>Account Name</label>
        <input style={S.input} placeholder="e.g. Matt 403(b)" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
        <label style={S.label}>Account Type</label>
        <div>{["403b","401k","IRA","HSA","brokerage","cash","other"].map(t=><span key={t} style={S.chip(form.account_type===t,accountTypeColors[t]||COLORS.slate)} onClick={()=>setForm(p=>({...p,account_type:t}))}>{t}</span>)}</div>
        <label style={S.label}>Current Balance</label>
        <input type="number" style={S.input} placeholder="" value={form.balance||""} onChange={e=>setForm(p=>({...p,balance:e.target.value}))}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <label style={{...S.label,marginBottom:0}}>Contribution Frequency</label>
          <div style={{display:"flex",gap:6}}>
            <span style={S.chip((form.contribution_frequency||"monthly")==="monthly",COLORS.blue)} onClick={()=>setForm(p=>({...p,contribution_frequency:"monthly"}))}>monthly</span>
            <span style={S.chip(form.contribution_frequency==="biweekly",COLORS.purple)} onClick={()=>setForm(p=>({...p,contribution_frequency:"biweekly"}))}>biweekly</span>
          </div>
        </div>
        <div style={S.row}>
          <div style={S.col}>
            <label style={S.label}>{form.contribution_frequency==="biweekly"?"Per Paycheck":"Monthly"} Contribution</label>
            <input type="number" style={S.input} placeholder="" value={form.monthly_contribution||""} onChange={e=>setForm(p=>({...p,monthly_contribution:e.target.value}))}/>
          </div>
          <div style={S.col}>
            <label style={S.label}>{form.contribution_frequency==="biweekly"?"Per Paycheck":"Monthly"} Match</label>
            <input type="number" style={S.input} placeholder="" value={form.employer_match||""} onChange={e=>setForm(p=>({...p,employer_match:e.target.value}))}/>
          </div>
        </div>
        {form.contribution_frequency==="biweekly"&&form.monthly_contribution&&(
          <div style={{fontSize:15,color:COLORS.purple,marginTop:-6,marginBottom:10}}>
            ≈ {formatMoney((+form.monthly_contribution+(+form.employer_match||0))*26/12)}/mo equivalent
          </div>
        )}
        <label style={S.label}>Tax Treatment</label>
        <div>{["pre-tax","Roth","taxable","HSA"].map(t=><span key={t} style={S.chip(form.tax_treatment===t,COLORS.purple)} onClick={()=>setForm(p=>({...p,tax_treatment:t}))}>{t}</span>)}</div>
        <label style={S.label}>Last Updated</label>
        <input type="date" style={S.input} value={form.last_updated||""} onChange={e=>setForm(p=>({...p,last_updated:e.target.value}))}/>
        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="Optional" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveAccount}>{editItem?"Save Changes":"Add Account"}</button>
      </Modal>}

      {showModal==="assumptions"&&<Modal title="Retirement Assumptions" onClose={closeModal}>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Current Age</label><input type="number" style={S.input} value={form.current_age||""} onChange={e=>setForm(p=>({...p,current_age:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Retirement Age</label><input type="number" style={S.input} value={form.retirement_age||""} onChange={e=>setForm(p=>({...p,retirement_age:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Withdrawal Rate (%)</label>
        <input type="number" step="0.1" style={S.input} value={form.withdrawal_rate_pct||""} onChange={e=>setForm(p=>({...p,withdrawal_rate_pct:e.target.value}))}/>
        <label style={S.label}>Expected Annual Retirement Spending</label>
        <input type="number" style={S.input} value={form.annual_retirement_spending||""} onChange={e=>setForm(p=>({...p,annual_retirement_spending:e.target.value}))}/>

        <label style={{...S.label,marginTop:10}}>Social Security — per person, since claim ages and benefits usually differ</label>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Matt: Est. (annual)</label><input type="number" style={S.input} value={form.social_security_estimate||""} onChange={e=>setForm(p=>({...p,social_security_estimate:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Matt: Claim Age</label><input type="number" style={S.input} placeholder="67" value={form.ss_claim_age||""} onChange={e=>setForm(p=>({...p,ss_claim_age:e.target.value}))}/></div>
        </div>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Kalee: Est. (annual)</label><input type="number" style={S.input} value={form.social_security_estimate_spouse||""} onChange={e=>setForm(p=>({...p,social_security_estimate_spouse:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Kalee: Claim Age</label><input type="number" style={S.input} placeholder="67" value={form.ss_claim_age_spouse||""} onChange={e=>setForm(p=>({...p,ss_claim_age_spouse:e.target.value}))}/></div>
        </div>
        <div style={{fontSize:15,color:COLORS.slate,marginTop:-4,marginBottom:10,lineHeight:1.4}}>Each benefit starts independently at that person's claim age — most couples don't claim simultaneously. Estimates available at ssa.gov/myaccount.</div>

        <label style={S.label}>Healthcare Est. (annual)</label>
        <input type="number" style={S.input} value={form.healthcare_estimate||""} onChange={e=>setForm(p=>({...p,healthcare_estimate:e.target.value}))}/>
        <label style={S.label}>Annual Contribution Increase (%)</label>
        <input type="number" step="0.5" style={S.input} placeholder="e.g. 3 for typical raises/auto-escalation" value={form.contribution_increase_pct||""} onChange={e=>setForm(p=>({...p,contribution_increase_pct:e.target.value}))}/>
        <label style={S.label}>Inflation Rate (%)</label>
        <input type="number" step="0.5" style={S.input} placeholder="3" value={form.inflation_pct||""} onChange={e=>setForm(p=>({...p,inflation_pct:e.target.value}))}/>
        <label style={S.label}>Medicare Age</label>
        <input type="number" style={S.input} placeholder="65" value={form.medicare_age||""} onChange={e=>setForm(p=>({...p,medicare_age:e.target.value}))}/>
        <label style={S.label}>Plan Through Age (end of life)</label>
        <input type="number" style={S.input} placeholder="90" value={form.plan_end_age||""} onChange={e=>setForm(p=>({...p,plan_end_age:e.target.value}))}/>

        <label style={{...S.label,marginTop:14}}>Return Rate Assumptions (%)</label>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Conservative</label><input type="number" step="0.5" style={S.input} placeholder="5" value={form.conservative_rate_pct||""} onChange={e=>setForm(p=>({...p,conservative_rate_pct:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Moderate</label><input type="number" step="0.5" style={S.input} placeholder="7" value={form.moderate_rate_pct||""} onChange={e=>setForm(p=>({...p,moderate_rate_pct:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Aggressive</label><input type="number" step="0.5" style={S.input} placeholder="9" value={form.aggressive_rate_pct||""} onChange={e=>setForm(p=>({...p,aggressive_rate_pct:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Drawdown Rate (%) — used during retirement spending</label>
        <input type="number" step="0.5" style={S.input} placeholder="5" value={form.drawdown_rate_pct||""} onChange={e=>setForm(p=>({...p,drawdown_rate_pct:e.target.value}))}/>
        <div style={{fontSize:15,color:COLORS.slate,marginTop:-4,marginBottom:10,lineHeight:1.4}}>Set these based on your actual fund allocation. Defaults assume a balanced (not 100% equity) portfolio, and a more conservative rate once spending down in retirement than while accumulating.</div>

        <label style={S.label}>Return Volatility (%) — used by Monte Carlo simulation</label>
        <input type="number" step="1" style={S.input} placeholder="15" value={form.return_volatility_pct||""} onChange={e=>setForm(p=>({...p,return_volatility_pct:e.target.value}))}/>
        <div style={{fontSize:15,color:COLORS.slate,marginTop:-4,marginBottom:10,lineHeight:1.4}}>Default 15% roughly matches 100% equities historically. A 60/40 stock/bond mix runs closer to 10-12%. Lower volatility = higher Monte Carlo success rates.</div>

        <div style={{fontSize:15,color:COLORS.slate,marginTop:10,lineHeight:1.5}}>Healthcare costs are modeled at ~5.5%/year growth for the full plan, faster than general inflation. Medicare eligibility and Social Security claiming age are tracked separately since most people claim SS later than 65.</div>
        <button style={{...S.btn,marginTop:16}} onClick={saveAssumptions}>Save Assumptions</button>
      </Modal>}

      {showModal==="college-savings"&&<Modal title="Update 529 Balance" onClose={closeModal}>
        <label style={S.label}>Current Balance</label>
        <input type="number" style={S.input} value={form.balance||""} onChange={e=>setForm(p=>({...p,balance:e.target.value}))}/>
        <label style={S.label}>Monthly Contribution</label>
        <input type="number" style={S.input} value={form.monthly_contribution||""} onChange={e=>setForm(p=>({...p,monthly_contribution:e.target.value}))}/>
        <label style={S.label}>Last Updated</label>
        <input type="date" style={S.input} value={form.last_updated||""} onChange={e=>setForm(p=>({...p,last_updated:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveCollegeSavings}>Save</button>
      </Modal>}

      {showModal==="college-goal"&&<Modal title="Edit College Goal" onClose={closeModal}>
        <label style={S.label}>Target Amount</label>
        <input type="number" style={S.input} value={form.target_amount||""} onChange={e=>setForm(p=>({...p,target_amount:e.target.value}))}/>
        <label style={S.label}>Target Year</label>
        <input type="number" style={S.input} value={form.target_year||""} onChange={e=>setForm(p=>({...p,target_year:e.target.value}))}/>
        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="School targets, in-state vs out-of-state, etc." value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveCollegeGoal}>Save Goal</button>
      </Modal>}

      {showModal==="mortgage"&&<Modal title="Update Mortgage" onClose={closeModal}>
        <label style={S.label}>Home Value (estimated)</label>
        <input type="number" style={S.input} placeholder="" value={form.home_value||""} onChange={e=>setForm(p=>({...p,home_value:e.target.value}))}/>
        <label style={S.label}>Current Balance</label>
        <input type="number" style={S.input} value={form.current_balance||""} onChange={e=>setForm(p=>({...p,current_balance:e.target.value}))}/>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Interest Rate (%)</label><input type="number" step="0.01" style={S.input} value={form.interest_rate||""} onChange={e=>setForm(p=>({...p,interest_rate:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Monthly Payment</label><input type="number" style={S.input} value={form.monthly_payment||""} onChange={e=>setForm(p=>({...p,monthly_payment:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Extra Monthly Payment</label>
        <input type="number" style={S.input} value={form.extra_payment_monthly||""} onChange={e=>setForm(p=>({...p,extra_payment_monthly:e.target.value}))}/>
        <label style={S.label}>Last Updated</label>
        <input type="date" style={S.input} value={form.last_updated||""} onChange={e=>setForm(p=>({...p,last_updated:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveMortgage}>Save</button>
      </Modal>}

      {showModal==="debt"&&<Modal title={editItem?"Edit Debt":"Add Debt"} onClose={closeModal}>
        <label style={S.label}>Debt Name</label>
        <input style={S.input} placeholder="e.g. Personal Loan" value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/>
        <label style={S.label}>Balance</label>
        <input type="number" style={S.input} value={form.balance||""} onChange={e=>setForm(p=>({...p,balance:e.target.value}))}/>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Interest Rate (%)</label><input type="number" step="0.1" style={S.input} value={form.interest_rate||""} onChange={e=>setForm(p=>({...p,interest_rate:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Payment Amount</label><input type="number" style={S.input} value={form.payment_amount||""} onChange={e=>setForm(p=>({...p,payment_amount:e.target.value}))}/></div>
        </div>
        <label style={S.label}>Payment Frequency</label>
        <div>{["weekly","biweekly","monthly"].map(f=><span key={f} style={S.chip(form.payment_frequency===f,COLORS.blue)} onClick={()=>setForm(p=>({...p,payment_frequency:f}))}>{f}</span>)}</div>
        <label style={S.label}>Extra Payment (one-time or recurring)</label>
        <input type="number" style={S.input} placeholder="" value={form.extra_payment||""} onChange={e=>setForm(p=>({...p,extra_payment:e.target.value}))}/>
        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="Optional" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveDebt}>{editItem?"Save Changes":"Add Debt"}</button>
      </Modal>}

      {showModal==="snapshot"&&<Modal title="Save Net Worth Snapshot" onClose={closeModal}>
        <div style={{fontSize:15,color:COLORS.slateLight,marginBottom:12,lineHeight:1.5}}>
          Captures current totals: {formatMoney(totalAssets)} assets, {formatMoney(totalLiabilities)} liabilities, {formatMoney(netWorth)} net worth.
        </div>
        <label style={S.label}>Date</label>
        <input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="What changed this month?" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:16}} onClick={saveSnapshot}>Save Snapshot</button>
      </Modal>}

      {showModal==="action"&&<Modal title="Add Action Item" onClose={closeModal}>
        <label style={S.label}>Title</label>
        <input style={S.input} placeholder="e.g. Increase 401k contribution" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
        <label style={S.label}>Category</label>
        <div>{["retirement","college","debt","other"].map(c=><span key={c} style={S.chip(form.category===c,COLORS.blue)} onClick={()=>setForm(p=>({...p,category:c}))}>{c}</span>)}</div>
        <label style={S.label}>Priority</label>
        <div>{["high","med","low"].map(p=><span key={p} style={S.chip(form.priority===p,priorityColors[p])} onClick={()=>setForm(prev=>({...prev,priority:p}))}>{p}</span>)}</div>
        <button style={{...S.btn,marginTop:16}} onClick={saveActionItem}>Add Item</button>
      </Modal>}
    </div>
  );
}

// ─── QUICK ADD ────────────────────────────────────────────────────────────────
function QuickAdd({onNavigate}){
  const [open,setOpen] = useState(false);
  const readings = useTable("pool_readings","logged_at");
  const maintLog = useTable("pool_maintenance","date");
  const deadlines = useTable("college_deadlines","due_date",true);
  const notes    = useTable("notes","created_at");
  const [form,setForm] = useState({});
  const [mode,setMode] = useState(null); // "pool"|"maint"|"college"|"note"

  const [saveError,setSaveError] = useState(null);

  function close(){setOpen(false);setMode(null);setForm({});setSaveError(null);}

  const options=[
    {id:"pool",    icon:"🏊", label:"Pool Reading",    color:COLORS.blue},
    {id:"maint",   icon:"🔧", label:"Maintenance Task", color:COLORS.amber},
    {id:"college", icon:"🎓", label:"College Deadline", color:COLORS.purple},
    {id:"note",    icon:"📝", label:"Quick Note",       color:COLORS.slate},
  ];

  const NOTE_TAGS = ["Pool","Home","College","Finance","General"];

  async function saveNote(){
    setSaveError(null);
    if(!form.body?.trim()){setSaveError("Note body is required");return;}
    const row={title:form.title||"",body:form.body.trim(),tag:form.tag||"General",created_at:new Date().toISOString()};
    try{
      const{error}=await sb.from("notes").insert(row);
      if(error){setSaveError(`Save failed — ${error.message||JSON.stringify(error)}`);return;}
      close();
    }catch(e){setSaveError(`Error: ${e.message}`);}
  }

  async function savePool(){
    setSaveError(null);
    function num(v){return(v===undefined||v===null||v==='') ? null : +v;}
    let fc = num(form.free_chlorine);
    if(form._drops && fc!==null) fc = Math.round(fc * 0.5 * 10) / 10;
    const d = form.date||TODAY_STR;
    const timeStr = form.time || new Date().toTimeString().slice(0,5);
    const loggedAt = new Date(`${d}T${timeStr}:00`).toISOString();
    const row={
      date:d, logged_at:loggedAt,
      ph:num(form.ph), free_chlorine:fc, cc:num(form.cc),
      salt:num(form.salt), cya:num(form.cya), alkalinity:num(form.alkalinity),
      calcium_hardness:num(form.calcium_hardness), water_temp:num(form.water_temp),
      filter_pressure:num(form.filter_pressure), swg_setting:num(form.swg_setting),
      pump_hours:num(form.pump_hours), notes:form.notes||""
    };
    try{
      const{data,error}=await sb.from("pool_readings").insert(row);
      if(error){setSaveError(`Save failed — ${error.message||JSON.stringify(error)}`);return;}
      close();onNavigate("pool");
    }catch(e){setSaveError(`Error: ${e.message}`);}
  }
  async function saveMaint(){
    if(!form.type)return;
    await maintLog.insert({date:form.date||TODAY_STR,type:form.type,notes:form.notes||""});
    close();onNavigate("pool");
  }
  async function saveCollege(){
    if(!form.title||!form.due_date)return;
    await deadlines.insert({title:form.title,due_date:form.due_date,school:form.school||"",category:form.category||"other",completed:false});
    close();onNavigate("college");
  }

  return(<>
    {/* Floating button — sits above the nav bar */}
    <button
      onClick={()=>setOpen(true)}
      style={{position:"fixed",bottom:80,right:20,width:52,height:52,borderRadius:"50%",background:COLORS.blue,color:"#fff",border:"none",fontSize:26,fontWeight:300,cursor:"pointer",zIndex:30,boxShadow:"0 4px 20px rgba(74,144,217,0.4)",display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,WebkitTapHighlightColor:"transparent"}}
    >+</button>

    {open&&<div style={S.modal} onClick={e=>e.target===e.currentTarget&&close()}>
      <div style={S.sheet}>
        <div style={S.sheetHandle}/>
        {!mode&&<>
          <div style={{...S.sheetTitle,marginBottom:20}}>Quick Add</div>
          {options.map(o=>(
            <button key={o.id} onClick={()=>setMode(o.id)} style={{display:"flex",alignItems:"center",gap:14,width:"100%",background:COLORS.navyLight,border:`1px solid ${COLORS.navyLight}`,borderLeft:`3px solid ${o.color}`,borderRadius:12,padding:"14px 16px",marginBottom:10,cursor:"pointer",color:COLORS.white,textAlign:"left"}}>
              <span style={{fontSize:22}}>{o.icon}</span>
              <span style={{fontSize:15,fontWeight:600}}>{o.label}</span>
            </button>
          ))}
          <button onClick={close} style={{...S.btnSm,width:"100%",marginTop:10}}>Cancel</button>
        </>}

        {mode==="pool"&&<>
          <div style={{...S.sheetTitle}}>🏊 Pool Reading</div>

          {/* Date + Time */}
          <div style={S.row}>
            <div style={S.col}>
              <label style={S.label}>Date</label>
              <input type="date" style={S.input} value={form.date||TODAY_STR} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
            </div>
            <div style={{flex:"0 0 100px"}}>
              <label style={S.label}>Time</label>
              <input type="time" style={S.input} value={form.time||new Date().toTimeString().slice(0,5)} onChange={e=>setForm(p=>({...p,time:e.target.value}))}/>
            </div>
          </div>

          {/* FC with K-2006 toggle */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <label style={{...S.label,marginBottom:0}}>Free Chlorine</label>
            <div style={{display:"flex",gap:6}}>
              <span style={S.chip(!form._drops,COLORS.blue)} onClick={()=>setForm(p=>({...p,_drops:false}))}>ppm</span>
              <span style={S.chip(!!form._drops,COLORS.purple)} onClick={()=>setForm(p=>({...p,_drops:true}))}>K-2006</span>
            </div>
          </div>
          <input type="number" step="0.5" style={S.input}
            placeholder={form._drops?"e.g. 11 drops":"e.g. 5.5"}
            value={form.free_chlorine||""}
            onChange={e=>setForm(p=>({...p,free_chlorine:e.target.value}))}/>
          {form._drops&&form.free_chlorine&&<div style={{fontSize:15,color:COLORS.purple,marginTop:-6,marginBottom:10}}>= {(+form.free_chlorine*0.5).toFixed(1)} ppm FC</div>}

          {/* CC */}
          <label style={S.label}>CC (Combined Chlorine)</label>
          <input type="number" step="0.5" style={S.input} placeholder="0" value={form.cc!==undefined?form.cc:""} onChange={e=>setForm(p=>({...p,cc:e.target.value}))}/>

          {/* pH + Salt */}
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>pH</label><input type="number" step="0.1" style={S.input} value={form.ph||""} onChange={e=>setForm(p=>({...p,ph:e.target.value}))}/></div>
            <div style={S.col}><label style={S.label}>Salt (ppm)</label><input type="number" style={S.input} value={form.salt||""} onChange={e=>setForm(p=>({...p,salt:e.target.value}))}/></div>
          </div>

          {/* CYA + TA */}
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>CYA (ppm)</label><input type="number" style={S.input} value={form.cya||""} onChange={e=>setForm(p=>({...p,cya:e.target.value}))}/></div>
            <div style={S.col}><label style={S.label}>TA (ppm)</label><input type="number" style={S.input} value={form.alkalinity||""} onChange={e=>setForm(p=>({...p,alkalinity:e.target.value}))}/></div>
          </div>

          {/* Calcium + Water Temp */}
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Calcium (ppm)</label><input type="number" style={S.input} placeholder="150–250" value={form.calcium_hardness||""} onChange={e=>setForm(p=>({...p,calcium_hardness:e.target.value}))}/></div>
            <div style={S.col}><label style={S.label}>Water Temp (°F)</label><input type="number" style={S.input} value={form.water_temp||""} onChange={e=>setForm(p=>({...p,water_temp:e.target.value}))}/></div>
          </div>

          {/* Filter PSI + SWG */}
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Filter PSI</label><input type="number" style={S.input} value={form.filter_pressure||""} onChange={e=>setForm(p=>({...p,filter_pressure:e.target.value}))}/></div>
            <div style={S.col}><label style={S.label}>SWG (%)</label><input type="number" style={S.input} value={form.swg_setting||""} onChange={e=>setForm(p=>({...p,swg_setting:e.target.value}))}/></div>
          </div>

          {/* Pump hours */}
          <div style={S.row}>
            <div style={S.col}><label style={S.label}>Pump Hours/Day</label><input type="number" style={S.input} value={form.pump_hours||""} onChange={e=>setForm(p=>({...p,pump_hours:e.target.value}))}/></div>
            <div style={S.col}/>
          </div>

          <label style={S.label}>Notes</label>
          <input style={S.input} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
          <button style={S.btn} onClick={savePool}>Save Reading</button>
          {saveError&&<div style={{fontSize:15,color:COLORS.red,marginTop:10,lineHeight:1.4}}>{saveError}</div>}
          <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>setMode(null)}>← Back</button>
        </>}

        {mode==="maint"&&<>
          <div style={{...S.sheetTitle}}>🔧 Maintenance Task</div>
          <label style={S.label}>Task</label>
          <div>{["Check water level","Clean skimmer basket","Brushed walls & floor","Added salt","Cleaned cartridge filter","Cleaned salt cell","Checked flow switch","Other"].map(t=>(
            <span key={t} style={S.chip(form.type===t,COLORS.amber)} onClick={()=>setForm(p=>({...p,type:t}))}>{t}</span>
          ))}</div>
          <label style={S.label}>Date</label>
          <input type="date" style={S.input} value={form.date||TODAY_STR} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
          <label style={S.label}>Notes</label>
          <input style={S.input} value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
          <button style={S.btn} onClick={saveMaint}>Log Task</button>
          <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>setMode(null)}>← Back</button>
        </>}

        {mode==="college"&&<>
          <div style={{...S.sheetTitle}}>🎓 College Deadline</div>
          <label style={S.label}>Title</label>
          <input style={S.input} placeholder="e.g. Submit Common App" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
          <label style={S.label}>Due Date</label>
          <input type="date" style={S.input} value={form.due_date||""} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}/>
          <label style={S.label}>School (optional)</label>
          <input style={S.input} value={form.school||""} onChange={e=>setForm(p=>({...p,school:e.target.value}))}/>
          <button style={S.btn} onClick={saveCollege}>Add Deadline</button>
          <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>setMode(null)}>← Back</button>
        </>}

        {mode==="note"&&<>
          <div style={{...S.sheetTitle}}>📝 Quick Note</div>
          <label style={S.label}>Tag</label>
          <div style={{marginBottom:14}}>
            {NOTE_TAGS.map(t=><span key={t} style={S.chip(form.tag===t,COLORS.slate)} onClick={()=>setForm(p=>({...p,tag:t}))}>{t}</span>)}
          </div>
          <label style={S.label}>Title (optional)</label>
          <input style={S.input} placeholder="e.g. Contractor quote, reminder, idea…" value={form.title||""} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
          <label style={S.label}>Note</label>
          <textarea
            style={{...S.input,minHeight:120,resize:"none",lineHeight:1.5}}
            placeholder="What do you want to remember?"
            value={form.body||""}
            onChange={e=>setForm(p=>({...p,body:e.target.value}))}
          />
          <button style={S.btn} onClick={saveNote}>Save Note</button>
          {saveError&&<div style={{fontSize:14,color:COLORS.red,marginTop:10,lineHeight:1.4}}>{saveError}</div>}
          <button style={{...S.btnSm,width:"100%",marginTop:10}} onClick={()=>setMode(null)}>← Back</button>
        </>}
      </div>
    </div>}
  </>);
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [tab,setTab] = useState("home");
  const gc           = useGoogleCalendar();

  // Scroll to top on every tab change — matches native app behavior
  function switchTab(t){
    setTab(t);
    window.scrollTo({top:0,behavior:"instant"});
  }

  // Swipe hint: show once, then remember via sessionStorage
  const [swipeHintSeen] = useState(()=>{
    try{ return sessionStorage.getItem("swipeHintSeen")==="1"; }catch{ return false; }
  });
  function markSwipeHintSeen(){
    try{ sessionStorage.setItem("swipeHintSeen","1"); }catch{}
  }

  const TABS=[
    {id:"home",     label:"Home",     icon:I.home},
    {id:"finance",  label:"Finance",  icon:I.finance},
    {id:"pool",     label:"Pool",     icon:I.pool},
    {id:"home-mgmt",label:"House",    icon:I.house},
    {id:"college",  label:"College",  icon:I.college},
  ];
  const TITLES={home:"FamilyOS",college:"College Planning","home-mgmt":"Home",pool:"Pool",finance:"Finance"};

  return(
    <div style={S.app}>
      <style>{`
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
        input[type=number]::-webkit-inner-spin-button{opacity:0.4;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5);}
        input[type=time]::-webkit-calendar-picker-indicator{filter:invert(0.5);}
        select option{background:#1A2540;}
        ::-webkit-scrollbar{width:0;}
        @keyframes slideUp{
          from{transform:translateY(100%);opacity:0;}
          to{transform:translateY(0);opacity:1;}
        }
        @keyframes shimmer{
          from{transform:translateX(-100%);}
          to{transform:translateX(100%);}
        }
          from{opacity:0;transform:translateY(4px);}
          to{opacity:1;transform:translateY(0);}
        }
        button:active{opacity:0.65 !important;transform:scale(0.97);}
        input:focus,textarea:focus,select:focus{
          border-color:#4A90D9 !important;
          box-shadow:0 0 0 3px rgba(74,144,217,0.18) !important;
        }
        button{-webkit-tap-highlight-color:transparent;}
        *{-webkit-tap-highlight-color:transparent;}
        ::placeholder{color:#4a5a78;}
      `}</style>

      <div style={S.header}>
        <div style={S.headerRow}>
          <div>
            <div style={S.logo}>{tab==="home"?<><span style={S.logoAccent}>Family</span>OS</>:TITLES[tab]}</div>
            {tab==="home"&&<div style={S.dateLabel}>{formatTodayShort()}</div>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {gc.token
              ?<div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:COLORS.green}}/><span style={{fontSize:15,color:COLORS.slate}}>Synced</span></div>
              :<button onClick={gc.signIn} style={{background:COLORS.blue+"22",color:COLORS.blue,border:`1px solid ${COLORS.blue}44`,borderRadius:6,padding:"3px 8px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Connect</button>
            }
          </div>
        </div>
      </div>

      {tab==="home"     &&<Dashboard onNavigate={switchTab} gc={gc}/>}
      {tab==="college"  &&<College/>}
      {tab==="home-mgmt"&&<HomeMgmt/>}
      {tab==="pool"     &&<Pool/>}
      {tab==="finance"  &&<Finance/>}

      <QuickAdd onNavigate={switchTab}/>

      <nav style={S.nav}>
        {TABS.map(t=>(
          <button key={t.id} style={S.navItem(tab===t.id)} onClick={()=>switchTab(t.id)}>
            {t.icon(tab===t.id)}<span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
