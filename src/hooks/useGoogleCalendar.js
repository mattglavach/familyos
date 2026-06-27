import { useState, useEffect, useCallback } from "react";
import { APP_CONFIG } from "../config";

const GOOGLE_CLIENT_ID  = APP_CONFIG.googleClientId;
const GOOGLE_SCOPES     = "https://www.googleapis.com/auth/calendar.readonly";
const CALENDAR_ID       = APP_CONFIG.googleCalendarId;
function getGoogleOAuthOrigin() {
  return window.location.origin;
}

function formatGoogleOAuthError(error) {
  if (error === "origin_mismatch") {
    return `Google Calendar OAuth origin mismatch. Add ${getGoogleOAuthOrigin()} to the OAuth client's Authorized JavaScript origins in Google Cloud Console.`;
  }
  return error || "Google Calendar sign-in failed.";
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

  useEffect(()=>{
    if(document.getElementById("gsi-script"))return;
    const s=document.createElement("script");
    s.id="gsi-script";s.src="https://accounts.google.com/gsi/client";s.async=true;
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
    if(!window.google){setError("Google script not loaded yet   try again.");return;}
    const client=window.google.accounts.oauth2.initTokenClient({
      client_id:GOOGLE_CLIENT_ID,scope:GOOGLE_SCOPES,
      callback:(resp)=>{
        if(resp.error){setError(formatGoogleOAuthError(resp.error));return;}
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
  },[signOut]);

  useEffect(()=>{if(token)fetchEvents(token);},[token,fetchEvents]);
  return{token,events,loading,error,signIn,signOut,refresh:()=>fetchEvents(token),userName};
}
