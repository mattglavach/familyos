import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const sql=await readFile(new URL("../supabase/migrations/20260713010000_release_2_10_core_experience.sql",import.meta.url),"utf8");
for(const fragment of ["category text","description text","updated_at timestamptz","active boolean","not_applicable","habit_completions_status_check","routine_completions_status_check","habits_household_today_idx","completed_at is not null and status = 'in_progress'"]){assert.ok(sql.toLowerCase().includes(fragment.toLowerCase()),`Missing Release 2.10 migration control: ${fragment}`);}
assert.ok(!/drop\s+table|truncate\s+/i.test(sql),"Release 2.10 migration must remain additive and data preserving");
assert.ok(!/disable\s+row\s+level\s+security/i.test(sql),"Release 2.10 must preserve RLS");
console.log("Release 2.10 additive schema, status, and RLS-preservation checks passed.");
