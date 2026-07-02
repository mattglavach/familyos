import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { roleCanManage } from "../hooks/useHouseholdCollaboration";

const HouseholdContext = createContext(null);

async function selectSingleOrNull(query) {
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data || null;
}

export function HouseholdProvider({ session, children }) {
  const user = session?.user || null;
  const [state, setState] = useState({
    loading: true,
    error: "",
    profile: null,
    household: null,
    userHouseholds: [],
    membership: null,
    userMemberships: [],
    memberships: [],
    people: [],
    householdSettings: null,
    userPreferences: null,
  });

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setState(previous => ({ ...previous, loading: false }));
      return;
    }

    setState(previous => ({ ...previous, loading: true, error: "" }));
    try {
      const [profileResult, preferencesResult, membershipsResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("household_members").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (preferencesResult.error) throw preferencesResult.error;
      if (membershipsResult.error) throw membershipsResult.error;

      const memberships = membershipsResult.data || [];
      const activeMemberships = memberships.filter(membership => membership.status === "active");
      const preferredHouseholdId = preferencesResult.data?.default_household_id;
      const membership = activeMemberships.find(item => item.household_id === preferredHouseholdId) || activeMemberships[0] || null;
      const householdId = membership?.household_id || null;

      if (!householdId) {
        setState({
          loading: false,
          error: "No active household was found for this account.",
          profile: profileResult.data || null,
          household: null,
          userHouseholds: [],
          membership: null,
          userMemberships: memberships,
          memberships,
          people: [],
          householdSettings: null,
          userPreferences: preferencesResult.data || null,
        });
        return;
      }

      const activeHouseholdIds = activeMemberships.map(item => item.household_id).filter(Boolean);
      const [household, userHouseholdsResult, peopleResult, settings, allMembershipsResult] = await Promise.all([
        selectSingleOrNull(supabase.from("households").select("*").eq("id", householdId)),
        activeHouseholdIds.length
          ? supabase.from("households").select("*").in("id", activeHouseholdIds).order("created_at", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        supabase.from("people").select("*").eq("household_id", householdId).order("display_name", { ascending: true }),
        selectSingleOrNull(supabase.from("household_settings").select("*").eq("household_id", householdId)),
        supabase.from("household_members").select("*").eq("household_id", householdId).order("created_at", { ascending: true }),
      ]);

      if (userHouseholdsResult.error) throw userHouseholdsResult.error;
      if (peopleResult.error) throw peopleResult.error;
      if (allMembershipsResult.error) throw allMembershipsResult.error;

      setState({
        loading: false,
        error: "",
        profile: profileResult.data || null,
        household,
        userHouseholds: userHouseholdsResult.data || [],
        membership,
        userMemberships: memberships,
        memberships: allMembershipsResult.data?.length ? allMembershipsResult.data : memberships,
        people: peopleResult.data || [],
        householdSettings: settings,
        userPreferences: preferencesResult.data || null,
      });
    } catch {
      setState(previous => ({
        ...previous,
        loading: false,
        error: "Household data could not be loaded. Some screens may show fallback data.",
      }));
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const switchHousehold = useCallback(async nextHouseholdId => {
    if (!user?.id || !nextHouseholdId) return { ok: false, error: "Missing household selection." };
    const allowed = state.userMemberships.some(membership => (
      membership.household_id === nextHouseholdId
      && membership.user_id === user.id
      && membership.status === "active"
    ));
    if (!allowed) return { ok: false, error: "You are not an active member of that household." };

    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.id,
      default_household_id: nextHouseholdId,
    });
    if (error) return { ok: false, error: error.message || "Household could not be switched." };

    setState(previous => ({
      ...previous,
      loading: true,
      error: "",
      household: null,
      membership: null,
      people: [],
      householdSettings: null,
    }));
    await refresh();
    return { ok: true };
  }, [refresh, state.userMemberships, user?.id]);

  const householdId = state.household?.id || state.membership?.household_id || state.userPreferences?.default_household_id || null;
  const canManageHousehold = roleCanManage(state.membership?.role);

  const value = useMemo(() => ({
    ...state,
    user,
    householdId,
    canManageHousehold,
    switchHousehold,
    refresh,
  }), [canManageHousehold, householdId, refresh, state, switchHousehold, user]);

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (!context) {
    return {
      loading: false,
      error: "",
      profile: null,
      household: null,
      householdId: null,
      membership: null,
      userMemberships: [],
      memberships: [],
      people: [],
      householdSettings: null,
      userPreferences: null,
      userHouseholds: [],
      canManageHousehold: false,
      switchHousehold: async () => ({ ok: false, error: "Household context is unavailable." }),
      refresh: async () => {},
    };
  }
  return context;
}
