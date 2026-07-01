import { useState } from "react";
import { Dashboard } from "../modules/dashboard/Dashboard";
import { Tasks } from "../modules/tasks/Tasks";
import { I, S } from "../theme";
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
import { Settings } from "../modules/settings/Settings";
import { TABS, TITLES } from "./navigation/tabs";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { FormError, FormGroup, FormHelp, FormSection } from "../components/ui/form";
import { SectionHeader } from "../components/ui/section-header";
import { StatusBadge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
function SetupRequired(){
  return(
    <div style={S.app} className="px-5 py-10">
      <div style={S.logo}><span style={S.logoAccent}>Family</span>OS</div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup required</CardTitle>
          <CardDescription>Add these missing environment variables in `.env.local` and Vercel before running the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <SectionHeader title="Missing Config" className="mt-0" tone="amber"/>
          <div className="flex flex-wrap gap-2">
            {CONFIG_STATUS.missing.map(key=><StatusBadge key={key} status="warning" className="normal-case">{key}</StatusBadge>)}
          </div>
        </CardContent>
      </Card>
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
    <div style={S.app} className="px-5 py-10">
      <div style={S.logo}><span style={S.logoAccent}>Family</span>OS</div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your approved family email and password. Your session stays saved on this device until you sign out.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormSection>
            <FormGroup>
              <Label>Email</Label>
              <Input type="email" value={email} placeholder="you@example.com" onChange={e=>setEmail(e.target.value)} />
            </FormGroup>
            <FormGroup>
              <Label>Password</Label>
              <Input type="password" value={password} placeholder="Password" onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!auth.sending)auth.signInWithPassword(email,password);}}/>
            </FormGroup>
            <Button type="button" className="w-full" disabled={auth.sending} onClick={()=>auth.signInWithPassword(email,password)}>{signInButtonText}</Button>
            <div className="border-t border-border pt-4">
              <FormHelp className="mb-3">Need a fallback? Send a one-time magic link to the same approved email.</FormHelp>
              {!hasSentLink&&<Button type="button" variant="secondary" className="w-full" disabled={!canSend} onClick={()=>auth.sendMagicLink(email)}>{magicLinkButtonText}</Button>}
              {auth.message&&<FormHelp className="mt-3 font-semibold text-emerald-300">{auth.message}</FormHelp>}
              {auth.resendCooldown>0&&<FormHelp className="mt-2">You can resend in {auth.resendCooldown} seconds.</FormHelp>}
              {hasSentLink&&<Button type="button" variant="secondary" className="mt-3 w-full" disabled={!canSend} onClick={()=>auth.sendMagicLink(email)}>Resend link</Button>}
            </div>
            {auth.error&&<FormError>{auth.error}</FormError>}
          </FormSection>
        </CardContent>
      </Card>
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
        button:focus-visible{outline:2px solid #4A90D9;outline-offset:2px;}
        button{-webkit-tap-highlight-color:transparent;}
        *{-webkit-tap-highlight-color:transparent;}
        ::placeholder{color:#4a5a78;}
      `}</style>;
}

function AppHeader({tab, auth, gc, onSettings}){
  const calendarLabel = gc.loading || gc.status === "syncing"
    ? "Syncing"
    : gc.error
      ? "Calendar issue"
      : gc.status === "empty"
        ? "No events"
        : gc.userName
          ? `${gc.userName} Synced`
          : "Synced";
  const calendarStatus = gc.error ? "warning" : gc.loading || gc.status === "syncing" ? "warning" : "connected";
  return <header className="sticky top-0 z-10 border-b border-border bg-card/95 px-5 pb-3.5 pt-[calc(env(safe-area-inset-top)+16px)] backdrop-blur">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div style={S.logo} className="truncate">{tab==="home"?<><span style={S.logoAccent}>Family</span>OS</>:TITLES[tab]}</div>
        {tab==="home"&&<div className="mt-1 truncate text-xs text-muted-foreground">{formatTodayShort()}</div>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {tab !== "settings" && <Button type="button" variant="secondary" size="xs" onClick={onSettings}>Settings</Button>}
        <Button type="button" variant="secondary" size="xs" onClick={auth.signOut}>Sign out</Button>
        {gc.token
          ?<StatusBadge status={calendarStatus} className="max-w-28 truncate">{calendarLabel}</StatusBadge>
          :<Button type="button" variant="outline" size="xs" loading={gc.status==="connecting"||gc.status==="script-loading"} onClick={gc.signIn}>Connect</Button>
        }
      </div>
    </div>
  </header>;
}

function BottomNavigation({tab,onNavigate}){
  return <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]" aria-label="Primary navigation">
    {TABS.map(t=>(
      <button
        key={t.id}
        type="button"
        className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 border-t-2 px-0.5 pb-2 pt-2 text-[10px] font-semibold transition-colors ${tab===t.id?"border-primary text-primary":"border-transparent text-muted-foreground"}`}
        aria-current={tab===t.id?"page":undefined}
        onClick={()=>onNavigate(t.id)}
      >
        {I[t.iconKey](tab===t.id)}<span>{t.label}</span>
      </button>
    ))}
  </nav>;
}

function GlobalLoading(){
  return (
    <div style={S.app} className="px-5 py-5">
      <Card>
        <CardContent className="space-y-3 pt-5">
          <Skeleton className="h-4 w-4/5"/>
          <Skeleton className="h-3 w-3/5"/>
          <Skeleton className="h-3 w-2/5"/>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App(){
  const auth = useSupabaseAuth();
  const [tab,setTab] = useState("home");
  const gc = useGoogleCalendar();

  function switchTab(t){
    setTab(t);
    window.scrollTo({top:0,behavior:"auto"});
  }

  if (CONFIG_STATUS.missing.length) return <SetupRequired/>;
  if (auth.loading) return <GlobalLoading/>;
  if (!auth.session) return <AuthGate auth={auth}/>;

  return(
    <div style={S.app}>
      <GlobalInteractionStyles/>
      <AppHeader tab={tab} auth={auth} gc={gc} onSettings={()=>switchTab("settings")}/>

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
      {tab==="settings"&&<Settings auth={auth} gc={gc}/>}

      <QuickAdd onNavigate={switchTab}/>
      <BottomNavigation tab={tab} onNavigate={switchTab}/>
    </div>
  );
}
