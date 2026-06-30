import { useState, useEffect } from "react";
import { APP_CONFIG } from "../config";
import { supabase } from "../lib/supabase";

function getEmailRedirectTo(path = "") {
  return `${window.location.origin}${path}`;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPasswordRecoveryRoute() {
  return window.location.pathname.replace(/\/+$/,"") === "/reset-password";
}

function isApprovedHouseholdEmail(email) {
  if (!APP_CONFIG.approvedHouseholdEmails.length) return true;
  return APP_CONFIG.approvedHouseholdEmails.includes(normalizeEmail(email));
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
  const [sendingAction,setSendingAction] = useState("");
  const [message,setMessage] = useState("");
  const [messageType,setMessageType] = useState("");
  const [error,setError] = useState("");
  const [resendCooldown,setResendCooldown] = useState(0);
  const [passwordRecovery,setPasswordRecovery] = useState(false);
  const [recoveryRoute,setRecoveryRoute] = useState(()=>isPasswordRecoveryRoute());
  const sending = Boolean(sendingAction);

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
      const onRecoveryRoute = isPasswordRecoveryRoute();
      setRecoveryRoute(onRecoveryRoute);
      setPasswordRecovery(Boolean(data.session) && onRecoveryRoute);
      setLoading(false);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((event,nextSession)=>{
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryRoute(true);
        setPasswordRecovery(true);
        setError("");
        setMessage("");
        setMessageType("");
      }
      if (event === "SIGNED_OUT") {
        setPasswordRecovery(false);
      }
      setLoading(false);
    });
    return ()=>{ mounted=false; subscription.unsubscribe(); };
  },[]);

  async function signInWithPassword(email,password) {
    setError("");
    setMessage("");
    setMessageType("");
    if (sending) return;
    const trimmed = normalizeEmail(email);
    if (!trimmed) { setError("Email is required."); return; }
    if (!isValidEmail(trimmed)) { setError("Enter a valid email address."); return; }
    if (!isApprovedHouseholdEmail(trimmed)) {
      setError("This email is not approved for FamilyOS.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    setSendingAction("signIn");
    try {
      const {error: authError} = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (authError) throw authError;
    } catch(e) {
      setError(formatPasswordSignInError(e));
    } finally {
      setSendingAction("");
    }
  }

  async function sendMagicLink(email) {
    if (sending || resendCooldown > 0) return;
    setError("");
    setMessage("");
    setMessageType("");
    const trimmed = normalizeEmail(email);
    if (!trimmed) { setError("Email is required."); return; }
    if (!isValidEmail(trimmed)) { setError("Enter a valid email address."); return; }
    if (!isApprovedHouseholdEmail(trimmed)) {
      setError("This email is not approved for FamilyOS.");
      return;
    }
    setSendingAction("magic");
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
      setSendingAction("");
    }
  }

  async function sendPasswordReset(email) {
    if (sending || resendCooldown > 0) return;
    setError("");
    setMessage("");
    setMessageType("");
    const trimmed = normalizeEmail(email);
    if (!trimmed) { setError("Email is required."); return; }
    if (!isValidEmail(trimmed)) { setError("Enter a valid email address."); return; }
    if (!isApprovedHouseholdEmail(trimmed)) {
      setError("This email is not approved for FamilyOS.");
      return;
    }
    setSendingAction("reset");
    try {
      const {error: authError} = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: getEmailRedirectTo("/reset-password"),
      });
      if (authError) throw authError;
      setMessage("Check your email for the password reset link. Use the newest email if you requested more than one.");
      setMessageType("reset");
      setResendCooldown(60);
    } catch(e) {
      setError(formatPasswordResetError(e));
    } finally {
      setSendingAction("");
    }
  }

  async function updatePassword(password,confirmPassword) {
    setError("");
    setMessage("");
    setMessageType("");
    if (sending) return;
    if (!passwordRecovery) {
      setError("This reset link is expired or invalid. Please request a new password reset email.");
      return;
    }
    if (!password) { setError("New password is required."); return; }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSendingAction("updatePassword");
    try {
      const {error: authError} = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      setPasswordRecovery(false);
      setRecoveryRoute(false);
      setMessage("Password updated. You're signed in.");
      setMessageType("password");
      if (isPasswordRecoveryRoute()) {
        window.history.replaceState({}, "", "/");
      }
    } catch(e) {
      setError("We couldn't update your password. Please request a new reset link and try again.");
    } finally {
      setSendingAction("");
    }
  }

  async function signOut() {
    if (sendingAction === "signOut") return;
    setSendingAction("signOut");
    try {
      await supabase.auth.signOut();
      setSession(null);
      setPasswordRecovery(false);
      setRecoveryRoute(false);
      setMessageType("");
    } finally {
      setSendingAction("");
    }
  }

  function exitPasswordRecovery() {
    setPasswordRecovery(false);
    setRecoveryRoute(false);
    setError("");
    setMessage("");
    setMessageType("");
    if (isPasswordRecoveryRoute()) {
      window.history.replaceState({}, "", "/");
    }
  }

  return {
    session,
    loading,
    sending,
    sendingAction,
    message,
    messageType,
    error,
    resendCooldown,
    passwordRecovery,
    recoveryRoute,
    signInWithPassword,
    sendMagicLink,
    sendPasswordReset,
    updatePassword,
    signOut,
    exitPasswordRecovery,
  };
}
