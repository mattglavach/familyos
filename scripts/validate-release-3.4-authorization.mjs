import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test.local", override: false });

const url = process.env.TEST_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.TEST_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
const serviceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const expectedRef = process.env.TEST_SUPABASE_PROJECT_REF;
const actualRef = url?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
assert.ok(url && anonKey && serviceKey && expectedRef, "Dedicated test Supabase configuration is required.");
assert.equal(process.env.FAMILYOS_ENV, "test", "FAMILYOS_ENV must be test.");
assert.equal(actualRef, expectedRef, "Test URL and expected project ref differ.");
assert.notEqual(actualRef, "dsowansazqleudupnjug", "Production is forbidden.");

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const run = crypto.randomUUID().slice(0, 8);
const password = `FamilyOS-${crypto.randomUUID()}!aA1`;
const identities = {};
const householdIds = new Set();
const storagePaths = [];

async function createIdentity(role) {
  const email = `familyos-rls-${run}-${role}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `RLS ${role}` } });
  assert.ifError(error);
  const userId = data.user.id;
  const { data: membership, error: membershipError } = await admin.from("household_members").select("household_id").eq("user_id", userId).eq("status", "active").single();
  assert.ifError(membershipError);
  householdIds.add(membership.household_id);
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  assert.ifError(signInError);
  identities[role] = { email, userId, client, originalHouseholdId: membership.household_id };
  return identities[role];
}

async function allowed(promise, label) {
  const { data, error } = await promise;
  assert.ifError(error, `${label} should be allowed`);
  return data;
}

async function denied(promise, label) {
  const { data, error } = await promise;
  assert.ok(error || !data || data.length === 0, `${label} unexpectedly succeeded`);
}

try {
  const ownerA = await createIdentity("owner-a");
  const adultA = await createIdentity("adult-a");
  const memberA = await createIdentity("teen-a");
  const childA = await createIdentity("child-a");
  const ownerB = await createIdentity("owner-b");
  const householdA = ownerA.originalHouseholdId;
  const householdB = ownerB.originalHouseholdId;

  for (const [identity, role] of [[adultA, "adult"], [memberA, "teen"], [childA, "child"]]) {
    await allowed(admin.from("household_members").insert({ household_id: householdA, user_id: identity.userId, role, status: "active" }), `add ${role} membership`);
  }

  for (const identity of [ownerA, adultA, memberA, childA]) {
    const rows = await allowed(identity.client.from("households").select("id").eq("id", householdA), `${identity.email} reads Household A`);
    assert.equal(rows.length, 1);
    const cross = await allowed(identity.client.from("households").select("id").eq("id", householdB), `${identity.email} cross-household read query`);
    assert.equal(cross.length, 0, "Household B leaked to Household A identity");
  }

  const tables = ["recommendation_feedback", "recommendation_effectiveness", "recommendation_learning", "recommendation_history"];
  for (const [index, table] of tables.entries()) {
    const base = { household_id: householdA, user_id: ownerA.userId };
    const payload = table === "recommendation_feedback" ? { ...base, recommendation_key: `${run}-${table}`, feedback_type: "helpful" }
      : table === "recommendation_effectiveness" ? { ...base, recommendation_key: `${run}-${table}`, state: "viewed" }
      : table === "recommendation_learning" ? { ...base, pattern_key: `${run}-${index}`, pattern_type: "timing", confidence: 75 }
      : { ...base, recommendation_key: `${run}-${table}`, action: "view" };
    await allowed(ownerA.client.from(table).insert(payload), `owner insert ${table}`);
    const memberPayload = { ...payload, user_id: memberA.userId, ...(table === "recommendation_learning" ? { pattern_key: `${run}-member-${index}` } : { recommendation_key: `${run}-member-${table}` }) };
    const childPayload = { ...payload, user_id: childA.userId, ...(table === "recommendation_learning" ? { pattern_key: `${run}-child-${index}` } : { recommendation_key: `${run}-child-${table}` }) };
    const crossPayload = { ...payload, household_id: householdB, ...(table === "recommendation_learning" ? { pattern_key: `${run}-cross-${index}` } : { recommendation_key: `${run}-cross-${table}` }) };
    await denied(memberA.client.from(table).insert(memberPayload), `teen insert ${table}`);
    await denied(childA.client.from(table).insert(childPayload), `child insert ${table}`);
    await denied(ownerA.client.from(table).insert(crossPayload), `cross-household insert ${table}`);
    const crossRows = await allowed(ownerA.client.from(table).select("id").eq("household_id", householdB), `cross-household select ${table}`);
    assert.equal(crossRows.length, 0, `${table} leaked across households`);
  }

  await allowed(adultA.client.from("recommendation_feedback").insert({ household_id: householdA, user_id: adultA.userId, recommendation_key: `${run}-adult`, feedback_type: "helpful" }), "adult recommendation feedback");
  await allowed(ownerB.client.from("recommendation_feedback").insert({ household_id: householdB, user_id: ownerB.userId, recommendation_key: `${run}-b`, feedback_type: "helpful" }), "Household B feedback fixture");

  const ownerExport = await allowed(ownerA.client.from("recommendation_feedback").select("household_id,recommendation_key"), "owner scoped export");
  assert.ok(ownerExport.length > 0 && ownerExport.every(row => row.household_id === householdA), "Export escaped Household A");
  await allowed(ownerA.client.from("recommendation_feedback").delete().eq("household_id", householdA).eq("user_id", ownerA.userId), "owner scoped reset");
  const { count: bCount, error: bCountError } = await admin.from("recommendation_feedback").select("id", { count: "exact", head: true }).eq("household_id", householdB).eq("recommendation_key", `${run}-b`);
  assert.ifError(bCountError);
  assert.equal(bCount, 1, "Household A reset affected Household B");

  for (const [table, payload] of [
    ["tasks", { title: `${run} task`, household_id: householdA, user_id: ownerA.userId }],
    ["habits", { name: `${run} habit`, household_id: householdA, user_id: ownerA.userId, owner_user_id: ownerA.userId }],
    ["attachments", { household_id: householdA, entity_type: "task", entity_id: crypto.randomUUID(), storage_path: `households/${householdA}/audit/${run}.pdf`, original_filename: "audit.pdf", display_name: "audit", mime_type: "application/pdf", size_bytes: 4, uploaded_by: ownerA.userId }],
  ]) {
    await allowed(ownerA.client.from(table).insert(payload), `owner insert ${table}`);
    await denied(memberA.client.from(table).insert({ ...payload, user_id: memberA.userId, owner_user_id: memberA.userId, uploaded_by: memberA.userId, title: `${run} member task`, name: `${run} member habit`, storage_path: `households/${householdA}/audit/${run}-member.pdf` }), `teen insert ${table}`);
    const crossRows = await allowed(ownerB.client.from(table).select("*").eq("household_id", householdA), `Household B reads ${table}`);
    assert.equal(crossRows.length, 0, `${table} leaked to Household B`);
  }

  const ownerPath = `households/${householdA}/audit/${run}-owner.pdf`;
  const bPath = `households/${householdB}/audit/${run}-owner.pdf`;
  storagePaths.push(ownerPath, bPath);
  await allowed(ownerA.client.storage.from("household-attachments").upload(ownerPath, new Blob(["test"], { type: "application/pdf" })), "owner storage upload");
  await denied(memberA.client.storage.from("household-attachments").upload(`households/${householdA}/audit/${run}-denied.pdf`, new Blob(["test"], { type: "application/pdf" })), "teen storage upload");
  await allowed(ownerB.client.storage.from("household-attachments").upload(bPath, new Blob(["test"], { type: "application/pdf" })), "Household B storage upload");
  await denied(ownerA.client.storage.from("household-attachments").createSignedUrl(bPath, 60), "cross-household signed URL");

  console.log("Release 3.4 dynamic authorization passed: two households; owner, adult, teen/member-equivalent, and child roles; recommendation lifecycle tables, reset/export, tasks, habits, attachment metadata, private storage, and signed URL isolation.");
} finally {
  if (storagePaths.length) await admin.storage.from("household-attachments").remove(storagePaths);
  for (const householdId of householdIds) await admin.from("households").delete().eq("id", householdId);
  for (const identity of Object.values(identities)) await admin.auth.admin.deleteUser(identity.userId).catch(() => null);
}
