import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20260712010000_release_2_2_pool_schema_reconciliation.sql");
const migration = await readFile(migrationPath, "utf8");

function migrationFor(schema) {
  return migration.replaceAll("public.pool_readings", `${schema}.pool_readings`);
}

const cases = [
  { schema: "pool_reconcile_a", columns: "recent_weather_notes text not null default ''" },
  { schema: "pool_reconcile_b", columns: "recent_weather_notes text, water_appearance text default ''" },
  { schema: "pool_reconcile_c", columns: "recent_weather_notes text not null default '', water_appearance text not null default ''" },
];

const setup = cases.map(({ schema, columns }) => `
create schema ${schema};
create table ${schema}.pool_readings (id integer primary key, ${columns});
insert into ${schema}.pool_readings(id) values (1);
alter table ${schema}.pool_readings enable row level security;
create policy pool_readings_select on ${schema}.pool_readings for select using (true);
`).join("\n");

const apply = cases.map(({ schema }) => `${migrationFor(schema)}\n${migrationFor(schema)}`).join("\n");
const verify = cases.map(({ schema }) => `
do $$
declare policy_count integer;
begin
  if not exists (select 1 from information_schema.columns where table_schema='${schema}' and table_name='pool_readings' and column_name='water_appearance' and data_type='text' and is_nullable='YES') then raise exception '${schema}: water_appearance contract failed'; end if;
  if not exists (select 1 from information_schema.columns where table_schema='${schema}' and table_name='pool_readings' and column_name='recent_weather_notes' and is_nullable='YES') then raise exception '${schema}: recent_weather_notes contract failed'; end if;
  if not exists (select 1 from information_schema.columns where table_schema='${schema}' and table_name='pool_readings' and column_name='test_context' and data_type='text' and is_nullable='NO' and column_default like '%Routine%') then raise exception '${schema}: test_context contract failed'; end if;
  if (select count(*) from ${schema}.pool_readings) <> 1 then raise exception '${schema}: rows changed'; end if;
  if not (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='${schema}' and c.relname='pool_readings') then raise exception '${schema}: RLS changed'; end if;
  select count(*) into policy_count from pg_policies where schemaname='${schema}' and tablename='pool_readings' and policyname='pool_readings_select';
  if policy_count <> 1 then raise exception '${schema}: policies changed'; end if;
end $$;`).join("\n");

const sql = `begin;\n${setup}\n${apply}\n${verify}\nrollback;`;
const result = spawnSync("docker", ["exec", "-i", "supabase_db_familyos", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"], { input: sql, stdio: ["pipe", "inherit", "inherit"] });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Pool schema reconciliation validated for missing, nullable, and NOT NULL starting states; rerun is idempotent.");
