import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const sql=await readFile(new URL("../supabase/migrations/20260713000000_release_2_9_unified_context.sql",import.meta.url),"utf8");
for(const fragment of ["create table if not exists public.attachments","create table if not exists public.household_activity","alter table public.attachments enable row level security","household_attachments_select","household_attachments_insert","household_attachments_delete","file_size_limit","allowed_mime_types","dashboard_layout","timezone text","location jsonb"]){assert.ok(sql.toLowerCase().includes(fragment.toLowerCase()),`Missing migration control: ${fragment}`);}
assert.ok(!/drop\s+table\s+.*shopping/i.test(sql),"Shopping data must not be dropped");
assert.ok(!/public\s*=\s*true/i.test(sql),"Attachment bucket must remain private");
assert.match(sql,/size_bytes[\s\S]*<=\s*10485760/i,"Attachment metadata must enforce the 10 MB limit");
console.log("Release 2.9 migration, RLS, storage, and Shopping preservation checks passed.");
