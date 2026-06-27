import { useState } from "react";
import { Dashboard } from "../modules/dashboard/Dashboard";
import { Tasks } from "../modules/tasks/Tasks";
import { Loading } from "../components/common";
import { COLORS, I, S } from "../theme";
import { CONFIG_STATUS } from "../config";
import { TODAY_DATE, TODAY_STR, daysAgo, daysBetween, formatDate, formatDateFull, formatTodayShort, nextDueDate } from "../lib/dates";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { useTable } from "../hooks/useTable";
import { maintColor, maintStatus } from "../utils/status";
import { College } from "../modules/college/College";
import { Pool, getChemRecommendations } from "../modules/pool/Pool";
import { Finance, calcRetirementProjection, formatMoneyShort } from "../modules/finance/Finance";
import { QuickAdd } from "../modules/quick-add/QuickAdd";
import { TABS, TITLES } from "./navigation/tabs";
function SetupRequired(){
  return(
    <div style={{...S.app,padding:"40px 20px"}}>
      <div style={S.logo}><span style={S.logoAccent}>Family</span>OS</div>
      <div style={{...S.card,marginTop:24}}>
        <div style={{fontSize:20,fontWeight:800,marginBottom:10}}>Setup required</div>
        <div style={{fontSize:15,color:COLORS.slateLight,lineHeight:1.5,marginBottom:14}}>Add these missing environment variables in `.env.local` and Vercel before running the app.</div>
        {CONFIG_STATUS.missing.map(key=><div key={key} style={{fontSize:14,color:COLORS.amber,fontWeight:700,marginBottom:6}}>{key}</div>)}
      </div>
    </div>
  );
}

function AuthGate({auth}){
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const canSend = !auth.sending && auth.resendCooldown === 0;
  const hasSentLink = Boolean(auth.message);
  const signInButtonText = auth.sending ? "Signing in..." : "Sign in";
  const magicLinkButtonText = auth.sending ? "Sending..." : "Email me a sign-in link";
  return(
    <div style={{...S.app,padding:"40px 20px"}}>
      <div style={S.logo}><span style={S.logoAccent}>Family</span>OS</div>
      <div style={{...S.card,marginTop:24}}>
        <div style={{fontSize:20,fontWeight:800,marginBottom:10}}>Sign in</div>
        <div style={{fontSize:15,color:COLORS.slateLight,lineHeight:1.5,marginBottom:18}}>Use your approved family email and password. Your session stays saved on this device until you sign out.</div>
        <label style={S.label}>Email</label>
        <input style={S.input} type="email" value={email} placeholder="you@example.com" onChange={e=>setEmail(e.target.value)} />
        <label style={{...S.label,marginTop:12}}>Password</label>
        <input style={S.input} type="password" value={password} placeholder="Password" onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!auth.sending)auth.signInWithPassword(email,password);}}/>
        <button style={{...S.btn,opacity:auth.sending?0.65:1,cursor:auth.sending?"not-allowed":"pointer"}} disabled={auth.sending} onClick={()=>auth.signInWithPassword(email,password)}>{signInButtonText}</button>
        <div style={{height:1,background:COLORS.navyLight,margin:"18px 0 14px"}}/>
        <div style={{fontSize:14,color:COLORS.slateLight,lineHeight:1.4,marginBottom:10}}>Need a fallback? Send a one-time magic link to the same approved email.</div>
        {!hasSentLink&&<button style={{...S.btn,background:COLORS.slate2,opacity:canSend?1:0.65,cursor:canSend?"pointer":"not-allowed"}} disabled={!canSend} onClick={()=>auth.sendMagicLink(email)}>{magicLinkButtonText}</button>}
        {auth.message&&<div style={{fontSize:15,color:COLORS.green,marginTop:12,lineHeight:1.4}}>{auth.message}</div>}
        {auth.resendCooldown>0&&<div style={{fontSize:14,color:COLORS.slateLight,marginTop:8,lineHeight:1.4}}>You can resend in {auth.resendCooldown} seconds.</div>}
        {hasSentLink&&<button style={{...S.btn,marginTop:10,background:COLORS.slate2,opacity:canSend?1:0.65,cursor:canSend?"pointer":"not-allowed"}} disabled={!canSend} onClick={()=>auth.sendMagicLink(email)}>Resend link</button>}
        {auth.error&&<div style={{fontSize:15,color:COLORS.red,marginTop:12,lineHeight:1.4}}>{auth.error}</div>}
      </div>
    </div>
  );
}
function GlobalInteractionStyles(){
  return <style>{`
        *{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
        input[type=number]::-webkit-inner-spin-button{opacity:0.4;}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5);}
        input[type=time]::-webkit-calendar-picker-indicator{filter:invert(0.5);}
        select option{background:#1A2540;}
        ::-webkit-scrollbar{width:0;}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes shimmer{from{transform:translateX(-100%);}to{transform:translateX(100%);}}
        button:active{opacity:0.65 !important;transform:scale(0.97);}
        input:focus,textarea:focus,select:focus{border-color:#4A90D9 !important;box-shadow:0 0 0 3px rgba(74,144,217,0.18) !important;}
        button{-webkit-tap-highlight-color:transparent;}
        *{-webkit-tap-highlight-color:transparent;}
        ::placeholder{color:#4a5a78;}
      `}</style>;
}

function AppHeader({tab, auth, gc}){
  return <div style={S.header}>
    <div style={S.headerRow}>
      <div>
        <div style={S.logo}>{tab==="home"?<><span style={S.logoAccent}>Family</span>OS</>:TITLES[tab]}</div>
        {tab==="home"&&<div style={S.dateLabel}>{formatTodayShort()}</div>}
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={auth.signOut} style={{background:COLORS.navyLight,color:COLORS.slateLight,border:`1px solid ${COLORS.navyLight}`,borderRadius:6,padding:"3px 8px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Sign out</button>
        {gc.token
          ?<div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:COLORS.green}}/><span style={{fontSize:13,color:COLORS.slate}}>{gc.userName?`${gc.userName}   Synced`:"Synced"}</span></div>
          :<button onClick={gc.signIn} style={{background:COLORS.blue+"22",color:COLORS.blue,border:`1px solid ${COLORS.blue}44`,borderRadius:6,padding:"3px 8px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Connect</button>
        }
      </div>
    </div>
  </div>;
}

function BottomNavigation({tab,onNavigate}){
  return <nav style={S.nav}>
    {TABS.map(t=>(
      <button key={t.id} style={S.navItem(tab===t.id)} onClick={()=>onNavigate(t.id)}>
        {I[t.iconKey](tab===t.id)}<span>{t.label}</span>
      </button>
    ))}
  </nav>;
}

export default function App(){
  const auth = useSupabaseAuth();
  const [tab,setTab] = useState("home");
  const gc = useGoogleCalendar();

  function switchTab(t){
    setTab(t);
    window.scrollTo({top:0,behavior:"instant"});
  }

  if (CONFIG_STATUS.missing.length) return <SetupRequired/>;
  if (auth.loading) return <div style={S.app}><div style={{padding:20}}><Loading/></div></div>;
  if (!auth.session) return <AuthGate auth={auth}/>;

  return(
    <div style={S.app}>
      <GlobalInteractionStyles/>
      <AppHeader tab={tab} auth={auth} gc={gc}/>

      {tab==="home"&&<Dashboard onNavigate={switchTab} gc={gc} deps={{
        TODAY_DATE,TODAY_STR,daysAgo,daysBetween,nextDueDate,formatDate,formatDateFull,
        formatMoneyShort,maintStatus,useTable,calcRetirementProjection,getChemRecommendations,
      }}/>} 
      {tab==="college"&&<College/>}
      {tab==="tasks"&&<Tasks deps={{
        TODAY_DATE,TODAY_STR,daysBetween,nextDueDate,formatDate,
        maintStatus,maintColor,useTable,
      }}/>} 
      {tab==="pool"&&<Pool/>}
      {tab==="finance"&&<Finance/>}

      <QuickAdd onNavigate={switchTab}/>
      <BottomNavigation tab={tab} onNavigate={switchTab}/>
    </div>
  );
}
