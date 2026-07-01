import { useCallback, useEffect, useMemo, useState } from "react";
import { COLORS, MEMBER_COLORS } from "../../theme";

const STORAGE_KEY = "familyos_family_members_v1";

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

function normalizeMember(member, index = 0) {
  const name = normalizeName(member.name);
  return {
    id: member.id || `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}-${index}`,
    name,
    role: member.role || "Family",
    status: member.status === "inactive" ? "inactive" : "active",
    color: member.color || MEMBER_COLORS[name] || COLORS.blue,
    notes: member.notes || "",
  };
}

function readStoredMembers() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_FAMILY_MEMBERS;
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return DEFAULT_FAMILY_MEMBERS;
  const members = parsed.map(normalizeMember).filter(member => member.name);
  return members.length ? members : DEFAULT_FAMILY_MEMBERS;
}

function validateMember(input, members, editingId) {
  const name = normalizeName(input.name);
  if (!name) return "Name is required.";
  const duplicate = members.some(member => member.id !== editingId && member.name.toLowerCase() === name.toLowerCase());
  if (duplicate) return "A family member with that name already exists.";
  return "";
}

export function useFamilyMembers() {
  const [members, setMembers] = useState(DEFAULT_FAMILY_MEMBERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setMembers(readStoredMembers());
      setError("");
    } catch {
      setMembers(DEFAULT_FAMILY_MEMBERS);
      setError("Family member changes could not be loaded. Showing the default household list.");
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback(nextMembers => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMembers));
      setMembers(nextMembers);
      setError("");
      return true;
    } catch {
      setError("Family member changes could not be saved on this device.");
      return false;
    }
  }, []);

  const addMember = useCallback(input => {
    const validationError = validateMember(input, members);
    if (validationError) return { ok: false, error: validationError };
    const member = normalizeMember({ ...input, id: `member-${Date.now()}` });
    const ok = persist([...members, member]);
    return { ok, error: ok ? "" : "Family member changes could not be saved on this device." };
  }, [members, persist]);

  const updateMember = useCallback((id, input) => {
    const validationError = validateMember(input, members, id);
    if (validationError) return { ok: false, error: validationError };
    const nextMembers = members.map(member => member.id === id ? normalizeMember({ ...member, ...input, id }) : member);
    const ok = persist(nextMembers);
    return { ok, error: ok ? "" : "Family member changes could not be saved on this device." };
  }, [members, persist]);

  const deactivateMember = useCallback(id => {
    const nextMembers = members.map(member => member.id === id ? { ...member, status: "inactive" } : member);
    const ok = persist(nextMembers);
    return { ok, error: ok ? "" : "Family member changes could not be saved on this device." };
  }, [members, persist]);

  const removeMember = useCallback(id => {
    const nextMembers = members.filter(member => member.id !== id);
    const ok = persist(nextMembers);
    return { ok, error: ok ? "" : "Family member changes could not be saved on this device." };
  }, [members, persist]);

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
