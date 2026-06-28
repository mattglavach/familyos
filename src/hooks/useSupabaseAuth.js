import { useState, useEffect } from "react";
import { APP_CONFIG } from "../config";
import { supabase } from "../lib/supabase";

function getEmailRedirectTo(path = "") {
  return `${window.location.origin}${path}`;
}

function isPasswordRecoveryRoute() {
  return window.location.pathname.replace(/\/+$/,"") === "/reset-password";
}

function isApprovedHouseholdEmail(email) {
  if (!APP_CONFIG.approvedHouseholdEmails.length) return true;
  return APP_CONFIG.approvedHouseholdEmails.includes(email.trim().toLowerCase());
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

function formatPasswordResetError(error) {
  if (isMagicLinkRateLimitError(error)) {
    return "Too many reset emails requested. Please wait a few minutes before trying again.";
  }
  return "We couldn't send a password reset email. Please check your email address and try again.";
}

function isWrongPasswordError(error) {
  const status = String(error?.status || "");
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return status === "400" ||
    code.includes("invalid_credentials") ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials");
}

function formatPasswordSignInError(error) {
  if (isWrongPasswordError(error)) {
    return "That email or password did not match. Please try again.";
  }
  return "We couldn't sign you in right now. Please check your connection and try again.";
}

export function useSupabaseAuth() {
  const [session,setSession] = useState(null);
  const [loading,setLoading] = useState(true);
  const [sending,setSending] = useState(false);
  const [message,setMessage] = useState("");
  const [messageType,setMessageType] = useState("");
  const [error,setError] = useState("");
  const [resendCooldown,setResendCooldown] = useState(0);
  const [passwordRecovery,setPasswordRecovery] = useState(false);

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
      setPasswordRecovery(Boolean(data.session) && isPasswordRecoveryRoute());
      setLoading(false);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((event,nextSession)=>{
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
      }
      setLoading(false);
    });
    return ()=>{ mounted=false; subscription.unsubscribe(); };
  },[]);

  async function signInWithPassword(email,password) {
    setError("");
    setMessage("");
    setMessageType("");
    const trimmed = email.trim();
    if (!trimmed) { setError("Email is required."); return; }
    if (!isApprovedHouseholdEmail(trimmed)) {
      setError("This email is not approved for FamilyOS.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    setSending(true);
    try {
      const {error: authError} = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (authError) throw authError;
    } catch(e) {
      setError(formatPasswordSignInError(e));
    } finally {
      setSending(false);
    }
  }

  async function sendMagicLink(email) {
    if (sending || resendCooldown > 0) return;
    setError("");
    setMessage("");
    setMessageType("");
    const trimmed = email.trim();
    if (!trimmed) { setError("Email is required."); return; }
    if (!isApprovedHouseholdEmail(trimmed)) {
      setError("This email is not approved for FamilyOS.");
      return;
    }
    setSending(true);
    try {
      const {error: authError} = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: getEmailRedirectTo() },
      });
      if (authError) throw authError;
      setMessage("Check your email for the sign-in link.");
      setMessageType("magic");
      setResendCooldown(60);
    } catch(e) {
      setError(formatMagicLinkError(e));
    } finally {
      setSending(false);
    }
  }

  async function sendPasswordReset(email) {
    if (sending || resendCooldown > 0) return;
    setError("");
    setMessage("");
    setMessageType("");
    const trimmed = email.trim();
    if (!trimmed) { setError("Email is required."); return; }
    if (!isApprovedHouseholdEmail(trimmed)) {
      setError("This email is not approved for FamilyOS.");
      return;
    }
    setSending(true);
    try {
      const {error: authError} = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: getEmailRedirectTo("/reset-password"),
      });
      if (authError) throw authError;
      setMessage("Check your email for the password reset link.");
      setMessageType("reset");
      setResendCooldown(60);
    } catch(e) {
      setError(formatPasswordResetError(e));
    } finally {
      setSending(false);
    }
  }

  async function updatePassword(password,confirmPassword) {
    setError("");
    setMessage("");
    setMessageType("");
    if (!password) { setError("New password is required."); return; }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSending(true);
    try {
      const {error: authError} = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      setPasswordRecovery(false);
      setMessage("Password updated. You're signed in.");
      setMessageType("password");
      if (isPasswordRecoveryRoute()) {
        window.history.replaceState({}, "", "/");
      }
    } catch(e) {
      setError("We couldn't update your password. Please request a new reset link and try again.");
    } finally {
      setSending(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setPasswordRecovery(false);
    setMessageType("");
  }

  return {
    session,
    loading,
    sending,
    message,
    messageType,
    error,
    resendCooldown,
    passwordRecovery,
    signInWithPassword,
    sendMagicLink,
    sendPasswordReset,
    updatePassword,
    signOut,
  };
}
