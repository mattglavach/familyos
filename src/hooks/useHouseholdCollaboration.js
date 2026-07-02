import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export const HOUSEHOLD_ROLES = ["owner", "adult", "teen", "child", "viewer"];
export const INVITABLE_ROLES = ["adult", "teen", "child", "viewer"];

export function roleLabel(role) {
  const labels = {
    owner: "Owner",
    adult: "Adult",
    teen: "Teen",
    child: "Child",
    viewer: "Viewer",
  };
  return labels[role] || "Member";
}

export function roleCanManage(role) {
  return role === "owner" || role === "adult";
}

export function roleCanManageMembers(role) {
  return role === "owner";
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function buildInviteLink(inviteToken) {
  if (!inviteToken || typeof window === "undefined") return "";
  const url = new URL(window.location.origin);
  url.searchParams.set("invite", inviteToken);
  return url.toString();
}

export function memberDisplayName(member, peopleById = {}) {
  const person = member?.person_id ? peopleById[member.person_id] : null;
  return person?.display_name || person?.first_name || member?.profile?.display_name || member?.profile?.email || "Household member";
}

export function useHouseholdInvitations(household) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdInvite, setCreatedInvite] = useState(null);

  const canManage = roleCanManage(household?.membership?.role);
  const householdId = household?.householdId;

  const load = useCallback(async () => {
    if (!householdId || !canManage) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("household_invitations")
      .select("id,household_id,invited_email,invited_by,role,status,expires_at,accepted_at,declined_at,revoked_at,created_at,updated_at")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message || "Could not load household invitations.");
      setInvitations([]);
    } else {
      setInvitations(data || []);
    }
    setLoading(false);
  }, [canManage, householdId]);

  useEffect(() => {
    load();
  }, [load]);

  const createInvitation = useCallback(async ({ email, role }) => {
    setCreatedInvite(null);
    setError("");
    const invitedEmail = normalizeEmail(email);
    if (!invitedEmail) return { ok: false, error: "Email is required." };
    if (!INVITABLE_ROLES.includes(role)) return { ok: false, error: "Choose a valid role." };
    if (!householdId || !canManage) return { ok: false, error: "Only household managers can invite members." };

    const { data, error: inviteError } = await supabase.rpc("familyos_create_household_invitation", {
      target_household_id: householdId,
      target_invited_email: invitedEmail,
      target_role: role,
    });

    if (inviteError) {
      const message = inviteError.message || "Invitation could not be created.";
      setError(message);
      return { ok: false, error: message };
    }

    const invitation = Array.isArray(data) ? data[0] : data;
    const nextInvite = {
      ...invitation,
      inviteLink: buildInviteLink(invitation?.invite_token),
    };
    setCreatedInvite(nextInvite);
    await load();
    return { ok: true, invitation: nextInvite };
  }, [canManage, householdId, load]);

  const revokeInvitation = useCallback(async invitationId => {
    setError("");
    if (!invitationId || !householdId || !canManage) {
      return { ok: false, error: "Only household managers can revoke invitations." };
    }

    const { error: revokeError } = await supabase
      .from("household_invitations")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", invitationId)
      .eq("household_id", householdId);

    if (revokeError) {
      const message = revokeError.message || "Invitation could not be revoked.";
      setError(message);
      return { ok: false, error: message };
    }

    await load();
    return { ok: true };
  }, [canManage, householdId, load]);

  return {
    invitations,
    pendingInvitations: invitations.filter(invitation => invitation.status === "pending" && !invitation.revoked_at && !invitation.accepted_at),
    loading,
    error,
    createdInvite,
    clearCreatedInvite: () => setCreatedInvite(null),
    refresh: load,
    createInvitation,
    revokeInvitation,
  };
}

export function useInvitationAcceptance(inviteToken, household) {
  const [state, setState] = useState({
    loading: false,
    error: "",
    invitation: null,
    accepted: false,
    declined: false,
  });

  const load = useCallback(async () => {
    if (!inviteToken) return;
    setState(previous => ({ ...previous, loading: true, error: "" }));
    const { data, error } = await supabase.rpc("familyos_get_household_invitation", {
      invite_token: inviteToken,
    });
    const invitation = Array.isArray(data) ? data[0] : data;
    setState(previous => ({
      ...previous,
      loading: false,
      error: error ? error.message || "Invitation could not be loaded." : "",
      invitation: error ? null : invitation || null,
    }));
  }, [inviteToken]);

  useEffect(() => {
    load();
  }, [load]);

  const accept = useCallback(async () => {
    setState(previous => ({ ...previous, loading: true, error: "" }));
    const { error } = await supabase.rpc("familyos_accept_household_invitation", {
      invite_token: inviteToken,
    });
    if (error) {
      setState(previous => ({ ...previous, loading: false, error: error.message || "Invitation could not be accepted." }));
      return { ok: false, error: error.message };
    }
    await household?.refresh?.();
    setState(previous => ({ ...previous, loading: false, accepted: true }));
    return { ok: true };
  }, [household, inviteToken]);

  const decline = useCallback(async () => {
    setState(previous => ({ ...previous, loading: true, error: "" }));
    const { error } = await supabase.rpc("familyos_decline_household_invitation", {
      invite_token: inviteToken,
    });
    if (error) {
      setState(previous => ({ ...previous, loading: false, error: error.message || "Invitation could not be declined." }));
      return { ok: false, error: error.message };
    }
    setState(previous => ({ ...previous, loading: false, declined: true }));
    return { ok: true };
  }, [inviteToken]);

  return useMemo(() => ({
    ...state,
    refresh: load,
    accept,
    decline,
  }), [accept, decline, load, state]);
}
