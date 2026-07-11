import test from "node:test";
import assert from "node:assert/strict";
import { BOOTSTRAP_HOUSEHOLD_KEY, createVerifiedAdmin, DEMO_HOUSEHOLD_ID, DEMO_HOUSEHOLD_KEY, DEMO_HOUSEHOLD_NAME, verifyDemoState, verifyFreshBootstrapState, verifySeedTarget } from "./demoSeedSafety.mjs";

const remote = "https://normal-project.supabase.co";
const target = (overrides = {}) => ({ url: remote, environment: "test", allowRemote: "true", expectedProjectRef: "normal-project", ...overrides });
const user = { id: "user-1", email: "test@familyos.app" };
const household = { id: DEMO_HOUSEHOLD_ID, name: DEMO_HOUSEHOLD_NAME, bootstrap_migration_key: DEMO_HOUSEHOLD_KEY, created_by_user_id: user.id };
const membership = { household_id: DEMO_HOUSEHOLD_ID, user_id: user.id, role: "owner", status: "active" };
const state = (overrides = {}) => ({ demoUser: user, demoHouseholds: [household], keyedHouseholds: [household], demoMemberships: [membership], userMemberships: [membership], ...overrides });

test("authorizes exact remote project and normally named URL", () => assert.equal(verifySeedTarget(target()).projectRef, "normal-project"));
test("authorizes exact expected URL", () => assert.equal(verifySeedTarget(target({ expectedProjectRef: "", expectedUrl: remote })).url, remote));
test("authorizes local only with an explicit expected target", () => assert.equal(verifySeedTarget(target({ url: "http://127.0.0.1:54321", allowRemote: "false", expectedProjectRef: "local" })).projectRef, "local"));
for (const [name, overrides] of [
  ["project mismatch", { expectedProjectRef: "other" }],
  ["missing expected target", { expectedProjectRef: "", expectedUrl: "" }],
  ["malformed URL", { url: "not-a-url" }],
  ["remote without authorization", { allowRemote: "false" }],
  ["authorization with wrong project", { allowRemote: "true", expectedProjectRef: "production-ref" }],
  ["production-like URL without exact match", { url: "https://production-ref.supabase.co" }],
  ["wrong environment", { environment: "development" }],
]) test(`rejects ${name}`, () => assert.throws(() => verifySeedTarget(target(overrides)), /Safety check failed/));

test("verification runs before admin creation", () => {
  let called = false;
  assert.throws(() => createVerifiedAdmin(target({ expectedProjectRef: "wrong" }), () => { called = true; }), /mismatch/);
  assert.equal(called, false);
});
test("accepts first seed", () => assert.equal(verifyDemoState(state({ demoUser: null, demoHouseholds: [], keyedHouseholds: [], demoMemberships: [], userMemberships: [] })).household, null));
test("accepts repeat seed with exact identity", () => assert.equal(verifyDemoState(state()).household.id, DEMO_HOUSEHOLD_ID));
test("rejects demo user in separate household", () => assert.throws(() => verifyDemoState(state({ userMemberships: [membership, { household_id: "other" }] })), /another household/));
test("rejects unexpected demo household member", () => assert.throws(() => verifyDemoState(state({ demoMemberships: [membership, { household_id: DEMO_HOUSEHOLD_ID, user_id: "other", role: "adult", status: "active" }] })), /exactly one/));
test("rejects duplicate demo identity", () => assert.throws(() => verifyDemoState(state({ keyedHouseholds: [household, { ...household, id: "other" }] })), /duplicate or ambiguous/));
test("unrelated data object remains unchanged when safety check rejects", () => {
  const unrelated = { id: "other", records: 12 };
  assert.throws(() => verifyDemoState(state({ userMemberships: [membership, { household_id: unrelated.id }] })), /another household/);
  assert.deepEqual(unrelated, { id: "other", records: 12 });
});
test("accepts only the exact fresh auth bootstrap household", () => {
  const fresh = { id: "bootstrap", created_by_user_id: user.id, bootstrap_source_user_id: user.id, bootstrap_migration_key: BOOTSTRAP_HOUSEHOLD_KEY };
  const member = { household_id: fresh.id, user_id: user.id, role: "owner", status: "active" };
  assert.equal(verifyFreshBootstrapState({ user, households: [fresh], memberships: [member], userMemberships: [member] }).id, fresh.id);
  assert.throws(() => verifyFreshBootstrapState({ user, households: [fresh], memberships: [member, { ...member, user_id: "other" }], userMemberships: [member] }), /ambiguous/);
});
