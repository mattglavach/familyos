import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const source = path.join(root, "supabase");
const workspace = path.join(tmpdir(), "familyos-bootstrap-validation");
const migrations = path.join(workspace, "supabase", "migrations");

await rm(workspace, { recursive: true, force: true });
await mkdir(migrations, { recursive: true });
await cp(path.join(source, "config.toml"), path.join(workspace, "supabase", "config.toml"));

const names = (await import("node:fs/promises"))
  .readdir(path.join(source, "migrations"));
const ordered = (await names).filter((name) => name.endsWith(".sql")).sort();

for (const [index, name] of ordered.entries()) {
  const date = name.slice(0, 8);
  const suffix = name.slice(9);
  const version = `${date}${String(index).padStart(6, "0")}`;
  await cp(path.join(source, "migrations", name), path.join(migrations, `${version}_${suffix}`));
}

const reset = process.platform === "win32"
  ? spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        "& pnpm.cmd dlx supabase@2.109.1 --workdir $env:FAMILYOS_BOOTSTRAP_WORKSPACE db reset --local --no-seed",
      ],
      {
        cwd: root,
        stdio: "inherit",
        env: { ...process.env, FAMILYOS_BOOTSTRAP_WORKSPACE: workspace },
      },
    )
  : spawnSync(
      "pnpm",
      ["dlx", "supabase@2.109.1", "--workdir", workspace, "db", "reset", "--local", "--no-seed"],
      { cwd: root, stdio: "inherit" },
    );
if (reset.error) throw reset.error;
if (reset.status !== 0) process.exit(reset.status ?? 1);

const verificationSql = `
do $$
declare
  required_tables text[] := array[
    'households','profiles','household_members','household_invitations',
    'notes','tasks','home_maintenance','pool_readings','pool_action_audits',
    'calendar_connections','life_lists','shopping_lists','recipes','meal_assignments'
  ];
  missing text[];
begin
  select array_agg(name) into missing
  from unnest(required_tables) name
  where to_regclass('public.' || name) is null;
  if missing is not null then raise exception 'Missing required tables: %', missing; end if;
  if (select count(*) from supabase_migrations.schema_migrations) <> ${ordered.length} then
    raise exception 'Migration history count mismatch';
  end if;
  if (select format_type(atttypid, atttypmod) from pg_attribute where attrelid='public.pool_action_audits'::regclass and attname='reading_id') <> 'text' then
    raise exception 'pool_action_audits.reading_id must be text';
  end if;
  if (select count(*) from pg_policies where schemaname='public') = 0 then raise exception 'No public RLS policies found'; end if;
end $$;`;

const sqlPath = path.join(workspace, "verify.sql");
await writeFile(sqlPath, verificationSql);
const verify = spawnSync(
  "docker",
  ["exec", "-i", "supabase_db_familyos", "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"],
  { cwd: root, input: await readFile(sqlPath), stdio: ["pipe", "inherit", "inherit"] },
);
if (verify.status !== 0) process.exit(verify.status ?? 1);

console.log(`FamilyOS empty-database bootstrap validated: ${ordered.length} migrations applied.`);
