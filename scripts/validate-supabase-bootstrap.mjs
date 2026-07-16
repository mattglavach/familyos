import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "supabase", "approved-migrations.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

assert.equal(manifest.expectedLatestRelease, "3.3.0");
assert.equal(manifest.expectedMigrationCount, 26);
assert.equal(manifest.expectedExecutionMigrationCount, 24);
assert.equal(manifest.expectedHistoryOnlyCount, 2);
assert.equal(manifest.approvedMigrations.length, 24);
assert.equal(manifest.historyOnlyMigrations.length, 2);
assert.equal(manifest.approvedMigrations.at(-1).file, manifest.expectedLatestMigrationFile);
assert.equal(manifest.approvedMigrations.at(-1).version, "20260715000000");

const baselineFile = path.join(root, manifest.baseline.file);
assert.ok(fs.existsSync(baselineFile), "schema.sql baseline is missing");
const baselineSql = fs.readFileSync(baselineFile, "utf8");
const historicalBaselineSql = fs.readFileSync(path.join(root, manifest.baseline.historicalFile), "utf8");
const tablePattern = /create\s+table\s+if\s+not\s+exists\s+public\.([a-z_][a-z0-9_]*)/gi;
const tables = (sql) => new Set([...sql.matchAll(tablePattern)].map((match) => match[1]));
const currentTables = tables(baselineSql);
for (const table of tables(historicalBaselineSql)) assert.ok(currentTables.has(table), `schema.sql is missing historical table ${table}`);
assert.match(baselineSql, /create extension if not exists "pgcrypto"/i);
assert.match(baselineSql, /grant select, insert, update, delete on public\.%I to authenticated/i);

const executableFiles = manifest.approvedMigrations.map(({ file }) => file);
const historyOnlyFiles = manifest.historyOnlyMigrations.map(({ file }) => file);
assert.ok(!executableFiles.includes("supabase/migrations/20260626000000_baseline_schema.sql"));
assert.ok(!executableFiles.includes("supabase/migrations/20260627000000_household_foundation.sql"));
assert.deepEqual(historyOnlyFiles, [
  "supabase/migrations/20260626000000_baseline_schema.sql",
  "supabase/migrations/20260627000000_household_foundation.sql",
]);

const allMigrations = [...manifest.approvedMigrations, ...manifest.historyOnlyMigrations];
assert.equal(new Set(allMigrations.map(({ version }) => version)).size, 26);
assert.equal(new Set(allMigrations.map(({ file }) => file)).size, 26);
assert.deepEqual(
  manifest.approvedMigrations.map(({ version }) => version),
  manifest.approvedMigrations.map(({ version }) => version).toSorted(),
);

const hashes = new Set();
for (const migration of manifest.approvedMigrations) {
  const file = path.join(root, migration.file);
  assert.ok(fs.existsSync(file), `approved migration is missing: ${migration.file}`);
  const hash = createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  assert.ok(!hashes.has(hash), `approved migration is a byte-identical duplicate: ${migration.file}`);
  hashes.add(hash);
}

const available = new Set([manifest.baseline.file, manifest.baseline.historyVersion]);
for (const migration of manifest.approvedMigrations) {
  for (const dependency of migration.dependencies) assert.ok(available.has(dependency), `${migration.file} has an unavailable dependency: ${dependency}`);
  assert.ok(!migration.requiresEarlierMigration || available.has(migration.requiresEarlierMigration), `${migration.file} has an unavailable required predecessor`);
  available.add(migration.version);
  available.add(migration.file);
}

const localHousehold = fs.readFileSync(path.join(root, "supabase/migrations/20260627000000_household_foundation.sql"), "utf8");
const productionHousehold = fs.readFileSync(path.join(root, "supabase/migrations/20260701010000_release_0_6c_household_foundation.sql"), "utf8");
for (const table of ["profiles", "households", "people", "household_members"]) {
  assert.match(localHousehold, new RegExp(`create table if not exists public\\.${table}`));
  assert.match(productionHousehold, new RegExp(`create table if not exists public\\.${table}`));
}
assert.match(productionHousehold, /familyos_bootstrap_auth_user_on_insert/);
assert.match(productionHousehold, /public\.household_settings/);
assert.match(productionHousehold, /public\.user_preferences/);

const aiMigration = fs.readFileSync(path.join(root, "supabase/migrations/20260714030000_release_3_2_ai_planning.sql"), "utf8");
for (const table of ["ai_preferences", "ai_recommendations", "ai_proposed_actions", "ai_feedback"]) {
  assert.match(aiMigration, new RegExp(`create table if not exists public\\.${table}`));
  assert.match(aiMigration, new RegExp(`alter table public\\.${table} enable row level security`));
}
assert.match(aiMigration, /^\s*begin;[\s\S]*commit;\s*$/i);
assert.doesNotMatch(aiMigration, /^\s*(?:insert\s+into|update\s+public\.|delete\s+from)/im);
assert.match(aiMigration, /revoke all on[\s\S]+from anon,public/);
assert.match(aiMigration, /grant select,insert,update,delete/);

const briefMigration = fs.readFileSync(path.join(root, manifest.expectedLatestMigrationFile), "utf8");
assert.match(briefMigration, /create table if not exists public\.recommendation_history/);
assert.match(briefMigration, /alter table public\.recommendation_history enable row level security/);
assert.match(briefMigration, /^\s*begin;[\s\S]*commit;\s*$/i);
assert.doesNotMatch(briefMigration, /^\s*(?:insert\s+into|update\s+public\.|delete\s+from)/im);
console.log("FamilyOS blank-database reconciliation passed statically: schema.sql + 24 executable migrations, 2 history-only versions, 26-version Release 3.3.0 parity.");
console.log("No SQL was executed. Run the guarded initializer only against an independently verified blank test project.");
