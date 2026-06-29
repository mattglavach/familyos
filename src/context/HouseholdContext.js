import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { loadHouseholdContext } from "../services/supabase/households";

const DEFAULT_PERMISSIONS = {
  viewHouseholdDashboard: false,
  manageHouseholdSettings: false,
  manageMembers: false,
  manageFinanceRecords: false,
  managePoolRecords: false,
  manageHomeMaintenance: false,
  manageCollegePlanning: false,
  manageDocuments: false,
  manageTasks: false,
  manageAiContext: false,
  inviteMembers: false,
  deleteHouseholdData: false,
};

function permissionsForRole(role) {
  if (role === "owner") {
    return {
      viewHouseholdDashboard: true,
      manageHouseholdSettings: true,
      manageMembers: true,
      manageFinanceRecords: true,
      managePoolRecords: true,
      manageHomeMaintenance: true,
      manageCollegePlanning: true,
      manageDocuments: true,
      manageTasks: true,
      manageAiContext: true,
      inviteMembers: true,
      deleteHouseholdData: true,
    };
  }

  if (role === "adult") {
    return {
      ...DEFAULT_PERMISSIONS,
      viewHouseholdDashboard: true,
      manageFinanceRecords: true,
      managePoolRecords: true,
      manageHomeMaintenance: true,
      manageCollegePlanning: true,
      manageDocuments: true,
      manageTasks: true,
      manageAiContext: true,
    };
  }

  return DEFAULT_PERMISSIONS;
}

function getInitialContext() {
  return {
    loading: false,
    error: null,
    status: "signed_out",
    profile: null,
    households: [],
    memberships: [],
    currentHousehold: null,
    currentMember: null,
    role: null,
    permissions: DEFAULT_PERMISSIONS,
    hasHousehold: false,
    hasMultipleHouseholds: false,
    selectedHouseholdId: null,
    selectHousehold: () => {},
    reload: async () => {},
  };
}

export const HouseholdContext = createContext(getInitialContext());

export function HouseholdProvider({ session, children }) {
  const userId = session?.user?.id || null;
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError(null);
      setProfile(null);
      setMemberships([]);
      setHouseholds([]);
      setSelectedHouseholdId(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextContext = await loadHouseholdContext(userId);
      setProfile(nextContext.profile);
      setMemberships(nextContext.memberships);
      setHouseholds(nextContext.households);
      setSelectedHouseholdId(previousId => {
        if (previousId && nextContext.households.some(household => household.id === previousId)) {
          return previousId;
        }
        return nextContext.households[0]?.id || null;
      });
    } catch (nextError) {
      console.error("Failed to load household context:", nextError);
      setError(nextError);
      setProfile(null);
      setMemberships([]);
      setHouseholds([]);
      setSelectedHouseholdId(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!active) return;
      await reload();
    }

    load();
    return () => {
      active = false;
    };
  }, [reload]);

  const currentHousehold = useMemo(() => {
    if (!selectedHouseholdId) return null;
    return households.find(household => household.id === selectedHouseholdId) || null;
  }, [households, selectedHouseholdId]);

  const currentMember = useMemo(() => {
    if (!selectedHouseholdId) return null;
    return memberships.find(membership => membership.household_id === selectedHouseholdId) || null;
  }, [memberships, selectedHouseholdId]);

  const role = currentMember?.role || null;
  const permissions = useMemo(() => permissionsForRole(role), [role]);
  const hasHousehold = Boolean(currentHousehold && currentMember);
  const status = !userId
    ? "signed_out"
    : loading
      ? "loading"
      : error
        ? "error"
        : hasHousehold
          ? "ready"
          : "empty";

  const value = useMemo(() => ({
    loading,
    error,
    status,
    profile,
    households,
    memberships,
    currentHousehold,
    currentMember,
    role,
    permissions,
    hasHousehold,
    hasMultipleHouseholds: households.length > 1,
    selectedHouseholdId,
    selectHousehold: setSelectedHouseholdId,
    reload,
  }), [
    loading,
    error,
    status,
    profile,
    households,
    memberships,
    currentHousehold,
    currentMember,
    role,
    permissions,
    hasHousehold,
    selectedHouseholdId,
    reload,
  ]);

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
}
