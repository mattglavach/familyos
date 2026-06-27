import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
function getEmailRedirectTo() {
  return window.location.origin;
}

function isMagicLinkRateLimitError(error) {
  const status = String(error?.status || "");
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  return status === "429" ||
    code.toLowerCase().includes("over_email_send_rate_limit") ||
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("over_email_send_rate_limit");
}

function formatMagicLinkError(error) {
  if (isMagicLinkRateLimitError(error)) {
    return "Too many sign-in links requested. Please wait a few minutes before trying again.";
  }
  return "We couldn't send a sign-in link. Please check your email address and try again.";
}

export function useSupabaseAuth() {
  const [session,setSession] = useState(null);
  const [loading,setLoading] = useState(true);
  const [sending,setSending] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [resendCooldown,setResendCooldown] = useState(0);

  useEffect(()=>{
    if (resendCooldown <= 0) return undefined;
    const timer = setTimeout(()=>setResendCooldown(seconds=>Math.max(seconds - 1,0)),1000);
    return ()=>clearTimeout(timer);
  },[resendCooldown]);

  useEffect(()=>{
    let mounted = true;
    supabase.auth.getSession().then(({data})=>{
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,nextSession)=>{
      setSession(nextSession);
      setLoading(false);
    });
    return ()=>{ mounted=false; subscription.unsubscribe(); };
  },[]);

  async function sendMagicLink(email) {
    if (sending || resendCooldown > 0) return;
    setError("");
    setMessage("");
    const trimmed = email.trim();
    if (!trimmed) { setError("Email is required."); return; }
    setSending(true);
    try {
      const {error: authError} = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: getEmailRedirectTo() },
      });
      if (authError) throw authError;
      setMessage("Check your email for the sign-in link.");
      setResendCooldown(60);
    } catch(e) {
      setError(formatMagicLinkError(e));
    } finally {
      setSending(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  return {session,loading,sending,message,error,resendCooldown,sendMagicLink,signOut};
}
