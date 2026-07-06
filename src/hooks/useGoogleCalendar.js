import { useState, useEffect, useCallback } from "react";
import { APP_CONFIG } from "../config";

const GOOGLE_CLIENT_ID  = APP_CONFIG.googleClientId;
const GOOGLE_SCOPES     = "https://www.googleapis.com/auth/calendar.readonly";
const CALENDAR_ID       = APP_CONFIG.googleCalendarId;
const LAST_SYNC_KEY     = "gc_last_synced_at";
function getGoogleOAuthOrigin() {
  return window.location.origin;
}

function formatGoogleOAuthError(error) {
  if (error === "origin_mismatch") {
    return `Google Calendar is not available for ${getGoogleOAuthOrigin()} yet. Ask the household owner to finish calendar setup, then try again.`;
  }
  if (error === "popup_closed_by_user" || error === "cancelled" || error === "user_cancelled") {
    return "Calendar connection was cancelled. Nothing changed.";
  }
  if (error === "access_denied" || error === "permission_denied") {
    return "Calendar access was not approved. Connect again when you are ready to share calendar events.";
  }
  if (String(error || "").toLowerCase().includes("verified") || String(error || "").toLowerCase().includes("unverified")) {
    return "Google Calendar is waiting for app approval. Ask the household owner to add test users or finish Google verification.";
  }
  return "Google Calendar could not connect. Try again when you are ready.";
}

function formatGoogleApiError(status, message) {
  if (status === 401) return "Google Calendar session expired. Connect again to refresh access.";
  if (status === 403) return "Google Calendar permission is missing or was revoked. Connect again and approve calendar read access.";
  if (status === 404) return "Google Calendar could not find this household calendar. Ask the household owner to check the calendar connection.";
  return message || `Google Calendar sync failed with status ${status}.`;
}

function formatEventTime(start) {
  if (!start) return "";
  return new Date(start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function sourceLabel() {
  if (!CALENDAR_ID || CALENDAR_ID === "primary") return "Google Calendar";
  return CALENDAR_ID;
}

// - MEMBER KEYWORDS -
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

// - GOOGLE CALENDAR -
export function useGoogleCalendar() {
  const [token,setToken]     = useState(()=>localStorage.getItem("gc_token")||null);
  const [events,setEvents]   = useState([]);
  const [loading,setLoading] = useState(false);
  const [error,setError]     = useState(null);
  const [status,setStatus]   = useState(()=>localStorage.getItem("gc_token") ? "connected" : "signed-out");
  const [scriptReady,setScriptReady] = useState(()=>Boolean(window.google?.accounts?.oauth2));
  const [lastSyncedAt,setLastSyncedAt] = useState(()=>localStorage.getItem(LAST_SYNC_KEY)||null);

  useEffect(()=>{
    if(window.google?.accounts?.oauth2){setScriptReady(true);return;}
    if(document.getElementById("gsi-script"))return;
    const s=document.createElement("script");
    s.id="gsi-script";s.src="https://accounts.google.com/gsi/client";s.async=true;
    s.onload=()=>setScriptReady(true);
    s.onerror=()=>{setStatus("error");setError("Google Calendar sign-in script could not load. Check your connection and refresh.");};
    document.head.appendChild(s);
  },[]);

  const [userName,setUserName] = useState(()=>localStorage.getItem("gc_user_name")||null);

  async function fetchUserName(accessToken) {
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {headers:{Authorization:`Bearer ${accessToken}`}});
      const data = await res.json();
      const name = data.given_name || data.name || null;
      if(name){ localStorage.setItem("gc_user_name", name); setUserName(name); }
    } catch {}
  }

  const clearConnection=useCallback(({revoke=false}={})=>{
    if(revoke&&token&&window.google)window.google.accounts.oauth2.revoke(token);
    localStorage.removeItem("gc_token");
    localStorage.removeItem("gc_user_name");
    localStorage.removeItem(LAST_SYNC_KEY);
    setToken(null);
    setEvents([]);
    setUserName(null);
    setLastSyncedAt(null);
  },[token]);

  function signIn(){
    setError(null);
    if(!GOOGLE_CLIENT_ID){
      setStatus("error");
      setError("Google Calendar is not ready to connect yet. Ask the household owner to finish calendar setup, then try again.");
      return;
    }
    if(!scriptReady||!window.google?.accounts?.oauth2){
      setStatus("script-loading");
      setError("Google Calendar sign-in is still loading. Try again in a moment.");
      return;
    }
    setStatus("connecting");
    const client=window.google.accounts.oauth2.initTokenClient({
      client_id:GOOGLE_CLIENT_ID,scope:GOOGLE_SCOPES,
      callback:(resp)=>{
        if(resp.error){
          const message = formatGoogleOAuthError(resp.error);
          setStatus(resp.error === "access_denied" ? "permission-error" : "error");
          setError(message);
          return;
        }
        if(!resp.access_token){setStatus("cancelled");setError("Calendar connection was not completed. Nothing changed.");return;}
        setToken(resp.access_token);
        setStatus("connected");
        fetchUserName(resp.access_token);
      },
      error_callback:(resp)=>{
        const code = resp?.type || resp?.error || "error";
        setStatus(code === "popup_closed_by_user" ? "cancelled" : code === "access_denied" ? "permission-error" : "error");
        setError(formatGoogleOAuthError(code));
      },
    });
    client.requestAccessToken();
  }
  const signOut=useCallback(()=>{
    clearConnection({revoke:true});
    setStatus("signed-out");
    setError(null);
  },[clearConnection]);
  const clearLocalConnection=useCallback(()=>{
    clearConnection({revoke:false});
    setStatus("signed-out");
    setError(null);
  },[clearConnection]);

  const fetchEvents=useCallback(async(accessToken)=>{
    if(!accessToken){setStatus("signed-out");return;}
    setLoading(true);setError(null);
    try{
      const now=new Date(),future=new Date();future.setDate(future.getDate()+30);
      setStatus("syncing");
      const p=new URLSearchParams({calendarId:CALENDAR_ID,timeMin:now.toISOString(),timeMax:future.toISOString(),singleEvents:"true",orderBy:"startTime",maxResults:"50"});
      const res=await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${p}`,{headers:{Authorization:`Bearer ${accessToken}`}});
      const data=await res.json().catch(()=>({}));
      if(res.status===401){
        clearConnection();
        setStatus("expired");
        setError(formatGoogleApiError(401));
        return;
      }
      if(!res.ok||data.error){
        const statusCode=data.error?.code||res.status;
        setStatus(statusCode===403?"permission-error":"error");
        setError(formatGoogleApiError(statusCode,data.error?.message));
        return;
      }
      const syncedAt=new Date().toISOString();
      const mapped=(data.items||[]).map((e,i)=>{
        const start=e.start?.dateTime||e.start?.date||"";
        if(!start)return null;
        const allDay=!e.start?.dateTime;
        const dateStr=start.split("T")[0];
        const timeStr=allDay?"All day":formatEventTime(start);
        return{
          id:e.id||i,
          title:e.summary||"(No title)",
          date:dateStr,
          start,
          end:e.end?.dateTime||e.end?.date||"",
          time:timeStr,
          allDay,
          member:assignMember(e.summary,e.description),
          location:e.location||"",
          description:e.description||"",
          notes:e.description||"",
          attendees:(e.attendees||[]).map(attendee=>({
            email:attendee.email||"",
            name:attendee.displayName||attendee.email||"",
            responseStatus:attendee.responseStatus||"",
          })).filter(attendee=>attendee.email||attendee.name),
          organizer:e.organizer?.displayName||e.organizer?.email||"",
          creator:e.creator?.displayName||e.creator?.email||"",
          source:sourceLabel(),
          calendar:sourceLabel(),
          htmlLink:e.htmlLink||"",
          status:e.status||"confirmed",
          lastSyncedAt:e.updated||syncedAt,
          updated:e.updated||"",
        };
      }).filter(Boolean);
      setEvents(mapped);
      localStorage.setItem(LAST_SYNC_KEY,syncedAt);
      setLastSyncedAt(syncedAt);
      setStatus(mapped.length?"synced":"empty");
    }catch{
      setStatus("error");
      setError("Could not load Google Calendar. Check your connection and try again.");
    }finally{
      setLoading(false);
    }
  },[clearConnection]);

  useEffect(()=>{if(token)fetchEvents(token);},[token,fetchEvents]);
  return{token,events,loading,error,status,scriptReady,lastSyncedAt,calendarId:CALENDAR_ID,sourceLabel:sourceLabel(),canConnect:Boolean(GOOGLE_CLIENT_ID),signIn,signOut,clearLocalConnection,refresh:()=>fetchEvents(token),userName};
}
