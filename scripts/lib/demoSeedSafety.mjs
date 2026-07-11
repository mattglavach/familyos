export const DEMO_HOUSEHOLD_ID = "00000000-0000-4000-8000-000000000017";
export const DEMO_HOUSEHOLD_KEY = "familyos-permanent-demo-v1";
export const DEMO_HOUSEHOLD_NAME = "Demo Family Household";
export const BOOTSTRAP_HOUSEHOLD_KEY = "20260701_release_0_6c_household_foundation";

function stop(message) {
  throw new Error(`[seed:demo] Safety check failed: ${message}`);
}

export function parseSupabaseTarget(value) {
  let url;
  try { url = new URL(value); } catch { stop("SUPABASE_URL is missing or malformed."); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    stop("SUPABASE_URL must be an http(s) origin without credentials, path, query, or fragment.");
  }
  const hostname = url.hostname.toLowerCase();
  const local = ["localhost", "127.0.0.1", "::1"].includes(hostname);
  const remoteMatch = hostname.match(/^([a-z0-9-]+)\.supabase\.co$/);
  if (!local && !remoteMatch) stop("Remote SUPABASE_URL must be an exact *.supabase.co project origin.");
  return { url: url.origin, hostname, local, projectRef: local ? "local" : remoteMatch[1] };
}

export function verifySeedTarget({ url, environment, allowRemote, expectedProjectRef, expectedUrl }) {
  if (environment !== "test") stop("FAMILYOS_ENV must be exactly test.");
  const target = parseSupabaseTarget(url);
  if (!expectedProjectRef && !expectedUrl) stop("Set DEMO_SEED_EXPECTED_PROJECT_REF or DEMO_SEED_EXPECTED_URL.");
  if (!target.local && allowRemote !== "true") stop("Remote targets require DEMO_SEED_ALLOW_REMOTE_TEST=true.");
  if (expectedProjectRef && target.projectRef !== expectedProjectRef) stop(`Project reference mismatch; expected ${expectedProjectRef}, received ${target.projectRef}.`);
  if (expectedUrl) {
    const expected = parseSupabaseTarget(expectedUrl);
    if (target.url !== expected.url) stop(`Supabase URL mismatch; expected ${expected.hostname}, received ${target.hostname}.`);
  }
  return target;
}

export function createVerifiedAdmin(config, createAdmin) {
  const target = verifySeedTarget(config);
  return { target, admin: createAdmin(target.url) };
}

export function verifyDemoState({ demoUser, demoHouseholds, keyedHouseholds, demoMemberships, userMemberships }) {
  if (demoHouseholds.length > 1 || keyedHouseholds.length > 1) stop("duplicate or ambiguous demo household identity.");
  const household = demoHouseholds[0] || null;
  const keyed = keyedHouseholds[0] || null;
  if (keyed && keyed.id !== DEMO_HOUSEHOLD_ID) stop("the demo key is assigned to an unexpected household ID.");
  if (household && household.bootstrap_migration_key !== DEMO_HOUSEHOLD_KEY) stop("the deterministic household ID does not carry the expected demo key.");
  if (!household && keyed) stop("the demo household key and deterministic ID disagree.");

  if (!household) {
    if (demoMemberships.length) stop("memberships exist for a missing demo household.");
    if (demoUser && userMemberships.length) stop("the demo user belongs to a non-demo household; no data was changed.");
    return { household: null, user: demoUser };
  }
  if (!demoUser) stop("the demo household exists without the demo auth user.");
  if (household.id !== DEMO_HOUSEHOLD_ID || household.name !== DEMO_HOUSEHOLD_NAME || household.created_by_user_id !== demoUser.id) {
    stop("the demo household identity or owner does not match the expected contract.");
  }
  if (demoMemberships.length !== 1) stop("the demo household must contain exactly one owner membership.");
  const membership = demoMemberships[0];
  if (membership.user_id !== demoUser.id || membership.role !== "owner" || membership.status !== "active") {
    stop("the demo household membership is not the expected active owner.");
  }
  if (userMemberships.length !== 1 || userMemberships[0].household_id !== DEMO_HOUSEHOLD_ID) {
    stop("the demo user belongs to another household; unrelated data was not changed.");
  }
  return { household, user: demoUser };
}

export function verifyFreshBootstrapState({ user, households, memberships, userMemberships }) {
  if (!user || households.length !== 1 || memberships.length !== 1 || userMemberships.length !== 1) {
    stop("new demo user bootstrap state is ambiguous.");
  }
  const household = households[0];
  const membership = memberships[0];
  if (household.bootstrap_source_user_id !== user.id || household.bootstrap_migration_key !== BOOTSTRAP_HOUSEHOLD_KEY || household.created_by_user_id !== user.id) {
    stop("new demo user bootstrap household has an unexpected identity.");
  }
  if (membership.household_id !== household.id || membership.user_id !== user.id || membership.role !== "owner" || membership.status !== "active" || userMemberships[0].household_id !== household.id) {
    stop("new demo user bootstrap membership is unexpected.");
  }
  return household;
}
