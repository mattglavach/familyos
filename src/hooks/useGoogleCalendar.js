import { useState, useEffect, useCallback } from "react";
import { APP_CONFIG } from "../config";

const GOOGLE_CLIENT_ID  = APP_CONFIG.googleClientId;
const GOOGLE_SCOPES     = "https://www.googleapis.com/auth/calendar.readonly";
const CALENDAR_ID       = APP_CONFIG.googleCalendarId;
const GOOGLE_SCRIPT_ID  = "gsi-script";
function getGoogleOAuthOrigin() {
  return window.location.origin;
}

function formatGoogleOAuthError(error) {
  if (error === "origin_mismatch") {
    return `Google Calendar OAuth origin mismatch. Add ${getGoogleOAuthOrigin()} to the OAuth client's Authorized JavaScript origins in Google Cloud Console.`;
  }
  if (error === "popup_closed") {
    return "Google Calendar connection was canceled before access was granted.";
  }
  if (error === "popup_failed_to_open") {
    return "Google Calendar popup was blocked. Allow popups for this app and try again.";
  }
  if (error === "access_denied") {
    return "Google Calendar access was denied. Grant read-only Calendar access to sync events.";
  }
  return error || "Google Calendar sign-in failed.";
}

function isPlaceholder(value) {
  return !value || /^(your-|local-placeholder|placeholder|example)/i.test(value);
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
  const [scriptReady,setScriptReady] = useState(()=>Boolean(window.google?.accounts?.oauth2));
  const [scriptLoading,setScriptLoading] = useState(()=>!window.google?.accounts?.oauth2);

  useEffect(()=>{
    if(window.google?.accounts?.oauth2){setScriptReady(true);setScriptLoading(false);return;}
    const existing=document.getElementById(GOOGLE_SCRIPT_ID);
    if(existing){
      existing.addEventListener("load",()=>{setScriptReady(true);setScriptLoading(false);});
      existing.addEventListener("error",()=>{setScriptLoading(false);setError("Google Identity Services could not load. Check your network, browser privacy settings, or ad blocker.");});
      return;
    }
    const s=document.createElement("script");
    s.id=GOOGLE_SCRIPT_ID;s.src="https://accounts.google.com/gsi/client";s.async=true;
    s.onload=()=>{setScriptReady(true);setScriptLoading(false);};
    s.onerror=()=>{setScriptLoading(false);setError("Google Identity Services could not load. Check your network, browser privacy settings, or ad blocker.");};
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

  function signIn(){
    setError(null);
    if(isPlaceholder(GOOGLE_CLIENT_ID)){setError("Google Calendar is not configured. Set VITE_GOOGLE_CLIENT_ID to a Google OAuth Web client ID.");return;}
    if(isPlaceholder(CALENDAR_ID)){setError("Google Calendar is not configured. Set VITE_GOOGLE_CALENDAR_ID to primary or a specific calendar ID.");return;}
    if(!window.google?.accounts?.oauth2){
      setError(scriptLoading
        ? "Google Calendar is still loading. Try Connect again in a moment."
        : "Google Identity Services is unavailable. Check your network, browser privacy settings, or ad blocker.");
      return;
    }
    const client=window.google.accounts.oauth2.initTokenClient({
      client_id:GOOGLE_CLIENT_ID,
      scope:GOOGLE_SCOPES,
      ux_mode:"popup",
      callback:(resp)=>{
        if(resp.error){setError(formatGoogleOAuthError(resp.error));return;}
        if(!resp.access_token){setError("Google Calendar did not return an access token. Try connecting again.");return;}
        setError(null);
        localStorage.setItem("gc_token",resp.access_token);
        setToken(resp.access_token);
        fetchUserName(resp.access_token);
      },
      error_callback:(resp)=>setError(formatGoogleOAuthError(resp?.type || resp?.error)),
    });
    client.requestAccessToken();
  }
  const signOut=useCallback(()=>{
    if(token&&window.google)window.google.accounts.oauth2.revoke(token);
    localStorage.removeItem("gc_token");
    localStorage.removeItem("gc_user_name");
    setToken(null);setEvents([]);setUserName(null);
  },[token]);

  const fetchEvents=useCallback(async(accessToken)=>{
    if(!accessToken)return;
    setLoading(true);setError(null);
    try{
      const now=new Date(),future=new Date();future.setDate(future.getDate()+30);
      const p=new URLSearchParams({timeMin:now.toISOString(),timeMax:future.toISOString(),singleEvents:"true",orderBy:"startTime",maxResults:"50"});
      const res=await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${p}`,{headers:{Authorization:`Bearer ${accessToken}`}});
      if(res.status===401){signOut();return;}
      const data=await res.json();
      if(data.error){
        setError(`${data.error.message} Confirm Calendar API access, OAuth consent, and VITE_GOOGLE_CALENDAR_ID.`);
        setLoading(false);
        return;
      }
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
  },[signOut]);

  useEffect(()=>{if(token)fetchEvents(token);},[token,fetchEvents]);
  return{token,events,loading,error,signIn,signOut,refresh:()=>fetchEvents(token),userName,scriptReady,scriptLoading,origin:getGoogleOAuthOrigin()};
}
