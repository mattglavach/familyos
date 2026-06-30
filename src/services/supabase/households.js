import { supabase } from "../../lib/supabase";

const EMPTY_HOUSEHOLD_CONTEXT = {
  profile: null,
  memberships: [],
  households: [],
};

function normalizeMembership(row) {
  if (!row) return null;
  const { household, households, ...membership } = row;
  return {
    ...membership,
    household: household || households || null,
  };
}

export async function loadHouseholdContext(userId) {
  if (!userId) return EMPTY_HOUSEHOLD_CONTEXT;

  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("household_members")
      .select("*, household:households(*)")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (membershipResult.error) {
    throw membershipResult.error;
  }

  const memberships = (membershipResult.data || [])
    .map(normalizeMembership)
    .filter(Boolean);
  const households = memberships
    .map(membership => membership.household)
    .filter(Boolean);

  return {
    profile: profileResult.data || null,
    memberships,
    households,
  };
}
