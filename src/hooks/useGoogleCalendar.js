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
    return `Google Calendar OAuth origin mismatch. Add ${getGoogleOAuthOrigin()} to the OAuth client's Authorized JavaScript origins in Google Cloud Console.`;
  }
  return error || "Google Calendar sign-in failed.";
}

function formatGoogleApiError(status, message) {
  if (status === 401) return "Google Calendar session expired. Connect again to refresh access.";
  if (status === 403) return "Google Calendar permission is missing or was revoked. Connect again and approve calendar read access.";
  if (status === 404) return `Google Calendar "${CALENDAR_ID}" was not found. Check REACT_APP_GOOGLE_CALENDAR_ID.`;
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
    if(!scriptReady||!window.google?.accounts?.oauth2){
      setStatus("script-loading");
      setError("Google Calendar sign-in is still loading. Try again in a moment.");
      return;
    }
    setStatus("connecting");
    const client=window.google.accounts.oauth2.initTokenClient({
      client_id:GOOGLE_CLIENT_ID,scope:GOOGLE_SCOPES,
      callback:(resp)=>{
        if(resp.error){setStatus("error");setError(formatGoogleOAuthError(resp.error));return;}
        if(!resp.access_token){setStatus("error");setError("Google Calendar did not return an access token. Try connecting again.");return;}
        setToken(resp.access_token);
        setStatus("connected");
        fetchUserName(resp.access_token);
      },
      error_callback:(resp)=>{setStatus("error");setError(formatGoogleOAuthError(resp?.type || resp?.error));},
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
      const mapped=(data.items||[]).map((e,i)=>{
        const start=e.start?.dateTime||e.start?.date||"";
        if(!start)return null;
        const allDay=!e.start?.dateTime;
        const dateStr=start.split("T")[0];
        const timeStr=allDay?"All day":formatEventTime(start);
        return{id:e.id||i,title:e.summary||"(No title)",date:dateStr,time:timeStr,allDay,member:assignMember(e.summary,e.description),location:e.location||"",source:sourceLabel(),htmlLink:e.htmlLink||""};
      }).filter(Boolean);
      setEvents(mapped);
      const syncedAt=new Date().toISOString();
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
  return{token,events,loading,error,status,scriptReady,lastSyncedAt,calendarId:CALENDAR_ID,sourceLabel:sourceLabel(),signIn,signOut,clearLocalConnection,refresh:()=>fetchEvents(token),userName};
}
