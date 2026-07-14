import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const sql=await readFile(new URL("../supabase/migrations/20260714000000_release_2_10_1_routine_lifecycle.sql",import.meta.url),"utf8");
for(const fragment of ["add column if not exists status","default 'active'","routines_status_check","'paused'","'archived'","routines_household_status_idx","where archived = true"]){assert.ok(sql.toLowerCase().includes(fragment.toLowerCase()),`Missing Release 2.10.1 migration control: ${fragment}`);}
assert.ok(!/drop\s+table|truncate\s+|delete\s+from/i.test(sql),"Release 2.10.1 migration must remain additive and data preserving");
assert.ok(!/disable\s+row\s+level\s+security/i.test(sql),"Release 2.10.1 must preserve RLS");
console.log("Release 2.10.1 additive routine lifecycle and RLS-preservation checks passed.");
