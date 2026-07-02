import { useCallback, useEffect, useMemo, useState } from "react";
import { COLORS, MEMBER_COLORS } from "../../theme";
import { useHousehold } from "../../context/HouseholdContext";
import { supabase } from "../../lib/supabase";

export const DEFAULT_FAMILY_MEMBERS = [
  { id: "matt", name: "Matt", role: "Parent", status: "active", color: MEMBER_COLORS.Matt || COLORS.blue, notes: "" },
  { id: "kalee", name: "Kalee", role: "Parent", status: "active", color: MEMBER_COLORS.Kalee || COLORS.purple, notes: "" },
  { id: "aubrey", name: "Aubrey", role: "Child", status: "active", color: MEMBER_COLORS.Aubrey || COLORS.red, notes: "" },
  { id: "blake", name: "Blake", role: "Child", status: "active", color: MEMBER_COLORS.Blake || COLORS.green, notes: "" },
  { id: "brayden", name: "Brayden", role: "Child", status: "active", color: MEMBER_COLORS.Brayden || COLORS.amber, notes: "" },
];

function normalizeName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

function memberTypeFromRole(role) {
  const value = String(role || "").toLowerCase();
  if (value === "parent" || value === "caregiver" || value === "adult") return "adult";
  if (value === "teen") return "teen";
  if (value === "child") return "child";
  if (value === "viewer") return "viewer";
  return "other";
}

function displayRoleFromPerson(person, membership) {
  if (person?.relationship) return person.relationship;
  if (membership?.role === "owner" || membership?.role === "adult") return "Parent";
  if (membership?.role === "teen") return "Teen";
  if (membership?.role === "child" || person?.member_type === "child") return "Child";
  if (person?.member_type === "adult") return "Parent";
  if (person?.member_type === "viewer") return "Viewer";
  return "Family";
}

function personName(person) {
  return normalizeName(person?.display_name || [person?.first_name, person?.last_name].filter(Boolean).join(" "));
}

function memberFromPerson(person, membership) {
  const name = personName(person);
  return normalizeMember({
    id: person.id,
    name,
    role: displayRoleFromPerson(person, membership),
    status: person.status,
    color: person.color || MEMBER_COLORS[name] || COLORS.blue,
    notes: person.notes || "",
  });
}

function normalizeMember(member, index = 0) {
  const source = member && typeof member === "object" ? member : {};
  const name = normalizeName(source.name);
  const fallbackId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "member";
  return {
    id: source.id || `${fallbackId}-${Date.now()}-${index}`,
    name,
    role: source.role || "Family",
    status: source.status === "inactive" ? "inactive" : "active",
    color: source.color || MEMBER_COLORS[name] || COLORS.blue,
    notes: source.notes || "",
  };
}

function validateMember(input, members, editingId) {
  const name = normalizeName(input.name);
  if (!name) return "Name is required.";
  const duplicate = members.some(member => member.id !== editingId && member.name.toLowerCase() === name.toLowerCase());
  if (duplicate) return "A family member with that name already exists.";
  return "";
}

export function useFamilyMembers() {
  const household = useHousehold();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const membershipByPersonId = household.memberships.reduce((map, membership) => {
      if (membership.person_id) map[membership.person_id] = membership;
      return map;
    }, {});
    const nextMembers = household.people
      .map(person => memberFromPerson(person, membershipByPersonId[person.id]))
      .filter(member => member.name);
    setMembers(nextMembers.length ? nextMembers : household.householdId && !household.error && !household.loading ? [] : DEFAULT_FAMILY_MEMBERS);
    setLoading(household.loading);
    setError(household.error);
  }, [household.error, household.householdId, household.loading, household.memberships, household.people]);

  const saveMembership = useCallback(async (personId, role, status = "active") => {
    if (!household.householdId || !personId) return;
    const { error: membershipError } = await supabase.from("household_members").insert({
      household_id: household.householdId,
      person_id: personId,
      role: memberTypeFromRole(role) === "other" ? "viewer" : memberTypeFromRole(role),
      status,
    });
    if (membershipError) {
      console.info("Household member row was not created; people row remains available:", membershipError);
    }
  }, [household.householdId]);

  const addMember = useCallback(async input => {
    const validationError = validateMember(input, members);
    if (validationError) return { ok: false, error: validationError };
    if (!household.householdId || !household.canManageHousehold) {
      return { ok: false, error: "Only household managers can add family members." };
    }
    const member = normalizeMember(input);
    try {
      const { data, error: personError } = await supabase.from("people").insert({
        household_id: household.householdId,
        display_name: member.name,
        first_name: member.name.split(" ")[0] || null,
        relationship: member.role,
        member_type: memberTypeFromRole(member.role),
        color: member.color,
        status: member.status,
        notes: member.notes,
      }).select().single();
      if (personError) throw personError;
      await saveMembership(data.id, member.role, member.status);
      await household.refresh();
      return { ok: true, error: "" };
    } catch (error) {
      console.error("Family member add failed:", error);
      setError("Family member could not be saved right now.");
      return { ok: false, error: "Family member could not be saved right now." };
    }
  }, [household, members, saveMembership]);

  const updateMember = useCallback(async (id, input) => {
    const validationError = validateMember(input, members, id);
    if (validationError) return { ok: false, error: validationError };
    if (!household.canManageHousehold) {
      return { ok: false, error: "Only household managers can update family members." };
    }
    const member = normalizeMember({ ...input, id });
    try {
      const { error: updateError } = await supabase.from("people").update({
        display_name: member.name,
        first_name: member.name.split(" ")[0] || null,
        relationship: member.role,
        member_type: memberTypeFromRole(member.role),
        color: member.color,
        status: member.status,
        notes: member.notes,
      }).eq("id", id);
      if (updateError) throw updateError;
      await household.refresh();
      return { ok: true, error: "" };
    } catch (error) {
      console.error("Family member update failed:", error);
      setError("Family member could not be updated right now.");
      return { ok: false, error: "Family member could not be updated right now." };
    }
  }, [household, members]);

  const deactivateMember = useCallback(async id => {
    if (!household.canManageHousehold) {
      return { ok: false, error: "Only household managers can deactivate family members." };
    }
    try {
      const { error: updateError } = await supabase.from("people").update({ status: "inactive" }).eq("id", id);
      if (updateError) throw updateError;
      await household.refresh();
      return { ok: true, error: "" };
    } catch (error) {
      console.error("Family member deactivate failed:", error);
      setError("Family member could not be removed right now.");
      return { ok: false, error: "Family member could not be removed right now." };
    }
  }, [household]);

  const removeMember = useCallback(id => {
    return deactivateMember(id);
  }, [deactivateMember]);

  const activeMembers = useMemo(() => members.filter(member => member.status !== "inactive"), [members]);
  const memberByName = useMemo(() => {
    return members.reduce((map, member) => {
      map[member.name.toLowerCase()] = member;
      return map;
    }, {});
  }, [members]);

  return {
    members,
    activeMembers,
    memberByName,
    loading,
    error,
    addMember,
    updateMember,
    deactivateMember,
    removeMember,
  };
}
