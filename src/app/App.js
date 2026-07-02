import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { Dashboard } from "../modules/dashboard/Dashboard";
import { Tasks } from "../modules/tasks/Tasks";
import { Calendar } from "../modules/calendar/Calendar";
import { More } from "../modules/more/More";
import { GlobalSearch } from "../modules/search/GlobalSearch";
import { NotificationCenter } from "../modules/notifications/NotificationCenter";
import { I, S } from "../theme";
import { CONFIG_STATUS } from "../config";
import { TODAY_DATE, TODAY_STR, daysAgo, daysBetween, formatDate, formatDateFull, formatTodayShort, nextDueDate } from "../lib/dates";
import { useGoogleCalendar } from "../hooks/useGoogleCalendar";
import { useCalendarConnections } from "../hooks/useCalendarConnections";
import { roleLabel, useInvitationAcceptance } from "../hooks/useHouseholdCollaboration";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { useTable } from "../hooks/useTable";
import { HouseholdProvider, useHousehold } from "../context/HouseholdContext";
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
          <CardTitle>Setup needed</CardTitle>
          <CardDescription>Family OS needs a few setup items before this device can sign in. Ask the household owner or developer to finish setup.</CardDescription>
        </CardHeader>
        <CardContent>
          <SectionHeader title="Needs Attention" className="mt-0" tone="amber"/>
          <div className="flex flex-wrap gap-2">
            {CONFIG_STATUS.missing.map(key=><StatusBadge key={key} status="warning" className="normal-case">Setup item</StatusBadge>)}
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
  const inviteToken = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("invite");
  const signInButtonText = auth.sending ? "Signing in..." : "Sign in";
  const magicLinkButtonText = auth.sending ? "Sending..." : "Email me a sign-in link";
  return(
    <div style={S.app} className="px-5 py-10">
      <div style={S.logo}><span style={S.logoAccent}>Family</span>OS</div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            {inviteToken
              ? "Sign in with the email address that received this household invitation."
              : "Use your approved family email and password. Your session stays saved on this device until you sign out."}
          </CardDescription>
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

function InvitationAcceptance({ inviteToken, onDone }) {
  const household = useHousehold();
  const invitation = useInvitationAcceptance(inviteToken, household);
  const invite = invitation.invitation;
  const currentEmail = household.user?.email || "";
  const wrongEmail = invite?.invited_email && currentEmail && invite.invited_email.toLowerCase() !== currentEmail.toLowerCase();
  const inactive = invite && invite.status !== "pending";

  function clearInvite() {
    const url = new URL(window.location.href);
    url.searchParams.delete("invite");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    onDone?.();
  }

  async function acceptInvite() {
    const result = await invitation.accept();
    if (result.ok) clearInvite();
  }

  async function declineInvite() {
    const result = await invitation.decline();
    if (result.ok) clearInvite();
  }

  return (
    <div style={S.app} className="px-5 py-10">
      <div style={S.logo}><span style={S.logoAccent}>Family</span>OS</div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Household Invite</CardTitle>
          <CardDescription>Review the household invitation before joining.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation.loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ) : invitation.error ? (
            <FormError>{invitation.error}</FormError>
          ) : !invite ? (
            <FormError>Invitation could not be found.</FormError>
          ) : invitation.accepted ? (
            <StatusBadge status="connected">Invitation accepted</StatusBadge>
          ) : invitation.declined ? (
            <StatusBadge status="neutral">Invitation declined</StatusBadge>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-secondary/35 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Household</div>
                <div className="mt-1 text-lg font-extrabold text-foreground">{invite.household_name || "Family household"}</div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  <div>Invited email: <span className="font-semibold text-foreground">{invite.invited_email}</span></div>
                  <div>Role: <span className="font-semibold text-foreground">{roleLabel(invite.role)}</span></div>
                  <div>Status: <span className="font-semibold text-foreground">{invite.status}</span></div>
                </div>
              </div>
              {wrongEmail && <FormError>This invitation is for {invite.invited_email}. You are signed in as {currentEmail}.</FormError>}
              {inactive && <FormError>This invitation is {invite.status} and can no longer be accepted.</FormError>}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="button" onClick={acceptInvite} loading={invitation.loading} disabled={wrongEmail || inactive}>
                  Accept Invite
                </Button>
                <Button type="button" variant="secondary" onClick={declineInvite} loading={invitation.loading} disabled={wrongEmail || inactive}>
                  Decline
                </Button>
              </div>
            </>
          )}
          <Button type="button" variant="ghost" className="w-full" onClick={clearInvite}>Continue to app</Button>
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

function AppHeader({tab, auth, calendar, unreadCount, onSettings, onSearch, onNotifications}){
  const calendarLabel = calendar.loading
    ? "Syncing"
    : calendar.error
      ? "Calendar issue"
      : calendar.status === "empty"
        ? "No events"
        : calendar.connected
          ? "Calendar ready"
          : "Not connected";
  const calendarStatus = calendar.error ? "warning" : calendar.loading ? "warning" : calendar.connected ? "connected" : "neutral";
  return <header className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 pb-3.5 pt-[calc(env(safe-area-inset-top)+16px)] backdrop-blur sm:px-5">
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      <div className="min-w-0 flex-1">
        <div style={S.logo} className="truncate text-[20px] leading-tight sm:text-[22px]">{tab==="home"?<><span style={S.logoAccent}>Family</span>OS</>:TITLES[tab]}</div>
        {tab==="home"&&<div className="mt-1 truncate text-[11px] text-muted-foreground sm:text-xs">{formatTodayShort()}</div>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
        <Button type="button" variant="secondary" size="icon-xs" aria-label="Search" onClick={onSearch}>
          <Search className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button type="button" variant="secondary" size="icon-xs" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} onClick={onNotifications} className="relative">
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-slate-950">{unreadCount}</span>}
        </Button>
        {tab !== "settings" && <Button type="button" variant="secondary" size="xs" onClick={onSettings}>Settings</Button>}
        <Button type="button" variant="secondary" size="xs" className="hidden sm:inline-flex" onClick={auth.signOut}>Sign out</Button>
        {calendar.connected
          ?<StatusBadge status={calendarStatus} className="max-w-28 truncate">{calendarLabel}</StatusBadge>
          :<Button type="button" variant="outline" size="xs" loading={calendar.loading} onClick={onSettings}>Calendar</Button>
        }
      </div>
    </div>
  </header>;
}

function BottomNavigation({tab,onNavigate,onQuickAdd}){
  return <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]" aria-label="Primary navigation">
    {TABS.map(t=>{
      const active = tab===t.id || (t.id === "more" && ["settings","finance","pool","college"].includes(tab));
      return (
      <button
        key={t.id}
        type="button"
        className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 border-t-2 px-0.5 pb-2 pt-2 text-[10px] font-semibold transition-colors ${active?"border-primary text-primary":"border-transparent text-muted-foreground"}`}
        aria-current={active?"page":undefined}
        onClick={()=>t.id === "quick-add" ? onQuickAdd() : onNavigate(t.id)}
      >
        {I[t.iconKey](active)}<span>{t.label}</span>
      </button>
    );})}
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

  if (CONFIG_STATUS.missing.length) return <SetupRequired/>;
  if (auth.loading) return <GlobalLoading/>;
  if (!auth.session) return <AuthGate auth={auth}/>;

  return (
    <HouseholdProvider session={auth.session}>
      <AuthenticatedApp auth={auth}/>
    </HouseholdProvider>
  );
}

function AuthenticatedApp({ auth }) {
  const [tab,setTab] = useState("home");
  const [quickAddSignal, setQuickAddSignal] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const gc = useGoogleCalendar();
  const household = useHousehold();
  const secureCalendar = useCalendarConnections(household.householdId);

  function switchTab(t){
    if (t === "quick-add") {
      setQuickAddSignal(value => value + 1);
      return;
    }
    setTab(t);
    window.scrollTo({top:0,behavior:"auto"});
  }

  if (household.loading) return <GlobalLoading/>;

  const inviteToken = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("invite");
  if (inviteToken) return <InvitationAcceptance inviteToken={inviteToken} onDone={() => switchTab("settings")} />;

  const headerCalendar = secureCalendar.connection
    ? {
      mode: "secure",
      connected: secureCalendar.connected,
      loading: secureCalendar.loading,
      error: secureCalendar.error,
      status: secureCalendar.status,
      events: secureCalendar.events,
      lastSyncedAt: secureCalendar.lastFetchedAt,
      sourceLabel: "Google Calendar",
      detail: secureCalendar.error || "Connect Google Calendar in Settings to show your family schedule.",
      refresh: secureCalendar.fetchEvents,
      connect: secureCalendar.connect,
    }
    : {
      mode: "legacy",
      connected: Boolean(gc.token),
      loading: gc.loading || gc.status === "syncing" || gc.status === "connecting" || gc.status === "script-loading",
      error: gc.error,
      status: gc.status,
      events: gc.events,
      lastSyncedAt: gc.lastSyncedAt,
      sourceLabel: gc.sourceLabel || "Google Calendar",
      detail: "Connect Google Calendar in Settings to show your family schedule.",
      refresh: gc.refresh,
      connect: gc.signIn,
    };

  return(
    <div style={S.app}>
      <GlobalInteractionStyles/>
      <AppHeader
        tab={tab}
        auth={auth}
        calendar={headerCalendar}
        unreadCount={unreadCount}
        onSettings={()=>switchTab("settings")}
        onSearch={() => setSearchOpen(true)}
        onNotifications={() => setNotificationsOpen(true)}
      />

      {tab==="home"&&<Dashboard onNavigate={switchTab} gc={gc} secureCalendar={secureCalendar} deps={{
        TODAY_DATE,TODAY_STR,daysAgo,daysBetween,nextDueDate,formatDate,formatDateFull,
        formatMoneyShort,maintStatus,useTable,calcRetirementProjection,getChemRecommendations,
      }}/>} 
      {tab==="calendar"&&<Calendar calendar={headerCalendar} onNavigate={switchTab} deps={{
        TODAY_STR,formatDateFull,
      }}/>}
      {tab==="college"&&<College/>}
      {tab==="tasks"&&<Tasks deps={{
        TODAY_DATE,TODAY_STR,daysBetween,nextDueDate,formatDate,
        maintStatus,maintColor,useTable,
      }}/>} 
      {tab==="pool"&&<Pool/>}
      {tab==="finance"&&<Finance/>}
      {tab==="more"&&<More onNavigate={switchTab}/>}
      {tab==="settings"&&<Settings auth={auth} gc={gc} secureCalendar={secureCalendar}/>}

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} calendarEvents={headerCalendar.events} onNavigate={switchTab}/>
      <NotificationCenter
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        calendarEvents={headerCalendar.events}
        household={household}
        calendar={headerCalendar}
        onNavigate={switchTab}
        onUnreadChange={setUnreadCount}
      />
      <QuickAdd onNavigate={switchTab} openSignal={quickAddSignal}/>
      <BottomNavigation tab={tab} onNavigate={switchTab} onQuickAdd={() => setQuickAddSignal(value => value + 1)}/>
    </div>
  );
}
