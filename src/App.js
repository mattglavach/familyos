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
    {id:"7",date:"2026-06-17",ph:8.0,free_chlorine:11,salt:3350,cya:60,alkalinity:90,water_temp:null,swg_setting:null,notes:"Added chlorine and acid 2 days earlier. TA 90 ppm."},
    {id:"6",date:"2026-06-15",ph:7.8,free_chlorine:3, salt:3450,cya:60,alkalinity:null,water_temp:null,swg_setting:null,notes:""},
    {id:"5",date:"2026-06-12",ph:8.0,free_chlorine:4, salt:3450,cya:60,alkalinity:null,water_temp:null,swg_setting:null,notes:"CYA increased"},
    {id:"4",date:"2026-06-10",ph:7.8,free_chlorine:2, salt:3300,cya:60,alkalinity:null,water_temp:null,swg_setting:null,notes:"Hot weather"},
    {id:"3",date:"2026-06-04",ph:7.8,free_chlorine:5, salt:3450,cya:43,alkalinity:null,water_temp:null,swg_setting:54, notes:"SWG 54%"},
    {id:"2",date:"2026-05-31",ph:8.0,free_chlorine:11,salt:3300,cya:null,alkalinity:null,water_temp:null,swg_setting:null,notes:"After party"},
  ],
  pool_maintenance:[
    {id:"1",date:"2026-06-13",type:"Brushed walls & floor",notes:""},
    {id:"2",date:"2026-06-10",type:"Cleaned skimmer basket",notes:""},
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
    {id:"1",name:"University of Virginia",status:"researching"},
    {id:"2",name:"Wake Forest University",status:"researching"},
    {id:"3",name:"University of Richmond",status:"target"},
    {id:"4",name:"James Madison University",status:"target"},
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
  const ranges={ph:{low:7.2,goodHigh:7.6,high:7.8},free_chlorine:{low:1.5,goodHigh:4.0,high:5.0},salt:{low:3200,goodHigh:3600,high:3800},cya:{low:50,goodHigh:80,high:90},alkalinity:{low:80,goodHigh:120,high:140}};
  const r=ranges[param];if(!r)return"green";
  if(value<r.low||value>r.high)return"red";
  if(value<=r.goodHigh)return"green";return"amber";
}
function statusColor(s){return s==="red"?COLORS.red:s==="amber"?COLORS.amber:COLORS.green;}
function maintStatus(item){const days=daysBetween(nextDueDate(item.last_completed,item.interval_days));if(days<0)return"overdue";if(days<=7)return"due-soon";return"ok";}
function maintColor(s){return s==="overdue"?COLORS.red:s==="due-soon"?COLORS.amber:COLORS.green;}

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
  const [showModal,setShowModal] = useState(null);
  const [editItem,setEditItem]   = useState(null);
  const [form,setForm]           = useState({});
  const [activeSwipe,setActiveSwipe] = useState(null);

  const catColor={test:COLORS.purple,application:COLORS.blue,visit:COLORS.green,other:COLORS.slate};
  const statusColors={researching:COLORS.slate,target:COLORS.blue,applying:COLORS.amber,applied:COLORS.purple,accepted:COLORS.green,rejected:COLORS.red};
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
    if(editItem) await schools.update(editItem.id,{name:form.name,status:form.status||"researching"});
    else await schools.insert({name:form.name,status:form.status||"researching"});
    closeModal();
  }
  async function saveScore(){
    if(!form.date||!form.total)return;
    if(editItem) await scores.update(editItem.id,{date:form.date,total:+form.total,math:+form.math||0,verbal:+form.verbal||0,notes:form.notes||""});
    else await scores.insert({date:form.date,total:+form.total,math:+form.math||0,verbal:+form.verbal||0,notes:form.notes||""});
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
        {["deadlines","schools","scores"].map(t=><button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>)}
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
                  </SwipeCard>
                ))}
              </div>
            );
          })}
          <button style={S.btn} onClick={()=>{setForm({status:"researching"});setShowModal("school");}}>+ Add School</button>
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
        <button style={{...S.btn,marginTop:16}} onClick={saveSchool}>{editItem?"Save Changes":"Add School"}</button>
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

// ─── POOL ─────────────────────────────────────────────────────────────────────
function Pool(){
  const readings                 = useTable("pool_readings","date");
  const maint                    = useTable("pool_maintenance","date");
  const [tab,setTab]             = useState("log");
  const [showLog,setShowLog]     = useState(false);
  const [showMaint,setShowMaint] = useState(false);
  const [editItem,setEditItem]   = useState(null);
  const [form,setForm]           = useState({});
  const [activeSwipe,setActiveSwipe] = useState(null);

  const PARAMS=[
    {k:"ph",           l:"pH",         unit:"",    target:"7.2–7.6"},
    {k:"free_chlorine",l:"Free Cl",    unit:"ppm", target:"2–4"},
    {k:"salt",         l:"Salt",       unit:"ppm", target:"3200–3600"},
    {k:"cya",          l:"CYA",        unit:"ppm", target:"50–80"},
    {k:"alkalinity",   l:"Alkalinity", unit:"ppm", target:"80–120"},
    {k:"water_temp",   l:"Temp",       unit:"°F",  target:"—"},
  ];
  const last=readings.data[0];

  function openEditReading(r){setEditItem(r);setForm(r);setShowLog(true);setActiveSwipe(null);}
  function openEditMaint(m){setEditItem(m);setForm(m);setShowMaint(true);setActiveSwipe(null);}
  function closeLog(){setShowLog(false);setEditItem(null);setForm({});}
  function closeMaint(){setShowMaint(false);setEditItem(null);setForm({});}

  async function saveReading(){
    const row={date:form.date||TODAY_STR,ph:+form.ph,free_chlorine:+form.free_chlorine,salt:+form.salt,cya:+form.cya,alkalinity:+form.alkalinity,water_temp:+form.water_temp||null,swg_setting:+form.swg_setting||null,notes:form.notes||""};
    if(editItem) await readings.update(editItem.id,row);
    else await readings.insert(row);
    closeLog();
  }
  async function saveMaint(){
    if(!form.type)return;
    const row={date:form.date||TODAY_STR,type:form.type,notes:form.notes||""};
    if(editItem) await maint.update(editItem.id,row);
    else await maint.insert(row);
    closeMaint();
  }

  return(
    <div style={S.screen}>
      {last&&(
        <div style={{...S.card,background:COLORS.navyLight,marginBottom:16}}>
          <div style={{fontSize:11,color:COLORS.blue,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:8}}>
            Last Reading — {formatDate(last.date)}{last.water_temp?` · ${last.water_temp}°F`:""}
          </div>
          <div style={S.statGrid}>
            {PARAMS.filter(p=>p.k!=="water_temp").map(p=>{
              const s=poolStatus(p.k,last[p.k]);const c=statusColor(s);
              return(<div key={p.k} style={S.statCell(c)}><div style={S.statVal}>{last[p.k]}</div><div style={S.statLbl}>{p.l}</div><div style={S.statTarget}>{p.target}</div></div>);
            })}
          </div>
          {last.swg_setting&&<div style={{fontSize:12,color:COLORS.slate,marginTop:8}}>SWG: {last.swg_setting}% · Pentair IntelliChlor</div>}
        </div>
      )}

      <div style={S.tabs}>
        {["log","trends","maintenance"].map(t=><button key={t} style={S.tabBtn(tab===t)} onClick={()=>setTab(t)}>{t}</button>)}
      </div>

      {tab==="log"&&<>
        {readings.loading?<Loading/>:<>
          <div style={S.swipeHint}>← swipe left to edit or delete</div>
          {readings.data.map(r=>(
            <SwipeCard key={r.id} id={r.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
              onEdit={()=>openEditReading(r)}
              onDelete={()=>{if(window.confirm("Delete this reading?"))readings.remove(r.id);setActiveSwipe(null);}}
              style={S.card}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div style={{fontSize:13,fontWeight:700}}>{formatDate(r.date)}</div>
                <div style={{fontSize:12,color:COLORS.slate}}>{r.water_temp?`${r.water_temp}°F · `:""}SWG {r.swg_setting}%</div>
              </div>
              <div style={{display:"flex",gap:14,marginTop:8,flexWrap:"wrap"}}>
                {PARAMS.filter(p=>p.k!=="water_temp").map(p=>{
                  const s=poolStatus(p.k,r[p.k]);
                  return <div key={p.k}><div style={{fontSize:13,fontWeight:600,color:statusColor(s)}}>{r[p.k]}</div><div style={{fontSize:10,color:COLORS.slate}}>{p.l}</div></div>;
                })}
              </div>
              {r.notes&&<div style={{fontSize:11,color:COLORS.slate,marginTop:6,fontStyle:"italic"}}>{r.notes}</div>}
            </SwipeCard>
          ))}
          <button style={S.btn} onClick={()=>{setForm({date:TODAY_STR});setShowLog(true);}}>+ Log Reading</button>
        </>}
      </>}

      {tab==="trends"&&<>
        {PARAMS.filter(p=>p.k!=="water_temp").map(p=>{
          const vals=[...readings.data].reverse().map(r=>r[p.k]);
          const latest=vals[vals.length-1];
          const s=poolStatus(p.k,latest);const c=statusColor(s);
          return(
            <div key={p.k} style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:14,fontWeight:600}}>{p.l}</div>
                <div style={{fontSize:11,color:COLORS.slate}}>Target: {p.target}{p.unit?" "+p.unit:""}</div>
                <div style={{fontSize:20,fontWeight:700,color:c,marginTop:4}}>{latest}{p.unit&&p.k!=="salt"&&p.k!=="cya"&&p.k!=="alkalinity"?p.unit:p.unit?" ppm":""}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                <Sparkline data={vals} color={c}/>
                <span style={{...S.badge(c),fontSize:10}}>{s==="green"?"OK":s==="amber"?"Watch":"Adjust"}</span>
              </div>
            </div>
          );
        })}
      </>}

      {tab==="maintenance"&&<>
        {maint.loading?<Loading/>:<>
          <div style={S.swipeHint}>← swipe left to edit or delete</div>
          {maint.data.map(m=>(
            <SwipeCard key={m.id} id={m.id} activeId={activeSwipe} setActiveId={setActiveSwipe}
              onEdit={()=>openEditMaint(m)}
              onDelete={()=>{if(window.confirm("Delete this entry?"))maint.remove(m.id);setActiveSwipe(null);}}
              style={S.card}>
              <div style={{fontSize:13,fontWeight:600}}>{m.type}</div>
              <div style={{fontSize:12,color:COLORS.slate,marginTop:2}}>{formatDate(m.date)}{m.notes?` · ${m.notes}`:""}</div>
            </SwipeCard>
          ))}
          <button style={S.btn} onClick={()=>{setForm({date:TODAY_STR});setShowMaint(true);}}>+ Log Maintenance</button>
        </>}
      </>}

      {showLog&&<Modal title={editItem?"Edit Reading":"Log Pool Reading"} onClose={closeLog}>
        <label style={S.label}>Date</label>
        <input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>pH</label><input type="number" step="0.1" style={S.input} placeholder="7.4" value={form.ph||""} onChange={e=>setForm(p=>({...p,ph:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Free Cl (ppm)</label><input type="number" step="0.1" style={S.input} placeholder="3.0" value={form.free_chlorine||""} onChange={e=>setForm(p=>({...p,free_chlorine:e.target.value}))}/></div>
        </div>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Salt (ppm)</label><input type="number" style={S.input} placeholder="3400" value={form.salt||""} onChange={e=>setForm(p=>({...p,salt:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>CYA (ppm)</label><input type="number" style={S.input} placeholder="70" value={form.cya||""} onChange={e=>setForm(p=>({...p,cya:e.target.value}))}/></div>
        </div>
        <div style={S.row}>
          <div style={S.col}><label style={S.label}>Alkalinity (ppm)</label><input type="number" style={S.input} placeholder="95" value={form.alkalinity||""} onChange={e=>setForm(p=>({...p,alkalinity:e.target.value}))}/></div>
          <div style={S.col}><label style={S.label}>Water Temp (°F)</label><input type="number" style={S.input} placeholder="84" value={form.water_temp||""} onChange={e=>setForm(p=>({...p,water_temp:e.target.value}))}/></div>
        </div>
        <label style={S.label}>SWG Setting (%)</label>
        <input type="number" style={S.input} placeholder="60" value={form.swg_setting||""} onChange={e=>setForm(p=>({...p,swg_setting:e.target.value}))}/>
        <label style={S.label}>Notes</label>
        <input style={S.input} placeholder="Optional" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:8}} onClick={saveReading}>{editItem?"Save Changes":"Save Reading"}</button>
      </Modal>}

      {showMaint&&<Modal title={editItem?"Edit Entry":"Log Pool Maintenance"} onClose={closeMaint}>
        <label style={S.label}>Date</label>
        <input type="date" style={S.input} value={form.date||""} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/>
        <label style={S.label}>Type</label>
        {["Brushed walls & floor","Cleaned skimmer basket","Backwashed filter","Added salt","Shocked pool","Cleaned filter cartridge","Other"].map(t=>(
          <span key={t} style={S.chip(form.type===t,COLORS.blue)} onClick={()=>setForm(p=>({...p,type:t}))}>{t}</span>
        ))}
        <label style={{...S.label,marginTop:8}}>Notes (optional)</label>
        <input style={S.input} placeholder="Any details" value={form.notes||""} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}/>
        <button style={{...S.btn,marginTop:8}} onClick={saveMaint}>{editItem?"Save Changes":"Save"}</button>
      </Modal>}
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
              ?<div style={{width:8,height:8,borderRadius:"50%",background:COLORS.green}}/>
              :<button onClick={()=>setTab("schedule")} style={{background:COLORS.blue+"22",color:COLORS.blue,border:`1px solid ${COLORS.blue}44`,borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Connect Calendar</button>
            }
            <div style={{display:"flex",gap:4}}>
              {Object.entries(MEMBER_COLORS).slice(0,3).map(([name,color])=>(
                <div key={name} style={{width:26,height:26,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>{name[0]}</div>
              ))}
            </div>
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
