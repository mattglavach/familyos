import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const HouseholdContext = createContext(null);

function roleCanManage(role) {
  return role === "owner" || role === "adult";
}

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
    membership: null,
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
      const activeMemberships = memberships.filter(membership => membership.status !== "inactive");
      const preferredHouseholdId = preferencesResult.data?.default_household_id;
      const membership = activeMemberships.find(item => item.household_id === preferredHouseholdId) || activeMemberships[0] || memberships[0] || null;
      const householdId = membership?.household_id || preferredHouseholdId || null;

      if (!householdId) {
        setState({
          loading: false,
          error: "No active household was found for this account.",
          profile: profileResult.data || null,
          household: null,
          membership: null,
          memberships,
          people: [],
          householdSettings: null,
          userPreferences: preferencesResult.data || null,
        });
        return;
      }

      const [household, peopleResult, settings, allMembershipsResult] = await Promise.all([
        selectSingleOrNull(supabase.from("households").select("*").eq("id", householdId)),
        supabase.from("people").select("*").eq("household_id", householdId).order("display_name", { ascending: true }),
        selectSingleOrNull(supabase.from("household_settings").select("*").eq("household_id", householdId)),
        supabase.from("household_members").select("*").eq("household_id", householdId).order("created_at", { ascending: true }),
      ]);

      if (peopleResult.error) throw peopleResult.error;
      if (allMembershipsResult.error) throw allMembershipsResult.error;

      setState({
        loading: false,
        error: "",
        profile: profileResult.data || null,
        household,
        membership,
        memberships: allMembershipsResult.data?.length ? allMembershipsResult.data : memberships,
        people: peopleResult.data || [],
        householdSettings: settings,
        userPreferences: preferencesResult.data || null,
      });
    } catch (error) {
      console.error("Household context load failed:", error);
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

  const householdId = state.household?.id || state.membership?.household_id || state.userPreferences?.default_household_id || null;
  const canManageHousehold = roleCanManage(state.membership?.role);

  const value = useMemo(() => ({
    ...state,
    user,
    householdId,
    canManageHousehold,
    refresh,
  }), [canManageHousehold, householdId, refresh, state, user]);

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
      memberships: [],
      people: [],
      householdSettings: null,
      userPreferences: null,
      canManageHousehold: false,
      refresh: async () => {},
    };
  }
  return context;
}
