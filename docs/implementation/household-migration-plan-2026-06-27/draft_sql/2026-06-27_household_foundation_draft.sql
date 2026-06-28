-- DRAFT ONLY - DO NOT APPLY
-- Family OS household-centered architecture foundation draft.
-- Revised after validation on 2026-06-27.
--
-- This file is intentionally stored under docs/implementation because the repo
-- does not currently have a Supabase migrations folder or migration naming
-- pattern. Do not copy this into a live migration until it has been reviewed.
--
-- Source baseline:
-- - supabase/schema.sql creates current module tables at lines 3-234.
-- - supabase/schema.sql adds user_id and user-scoped RLS at lines 236-261.
-- - docs/implementation/household-migration-plan-2026-06-27/09_DRAFT_SQL_VALIDATION.md
--
-- Revision goals:
-- - Enable executable RLS for foundation tables only.
-- - Keep module-table RLS unchanged for compatibility.
-- - Bootstrap every auth user into one default household.
-- - Make bootstrap/backfill idempotent.
-- - Preserve durable rollback/support mapping in an internal schema.
-- - Keep user_id columns and nullable household_id during transition.

begin;

create extension if not exists "pgcrypto";
create schema if not exists familyos_internal;

create temporary table migration_module_tables (
  table_name text primary key
) on commit drop;

insert into migration_module_tables(table_name) values
  ('notes'),
  ('tasks'),
  ('home_maintenance'),
  ('pool_readings'),
  ('pool_maintenance'),
  ('pool_treatments'),
  ('pool_schedule'),
  ('pool_settings'),
  ('college_schools'),
  ('college_test_plan'),
  ('college_essays'),
  ('college_deadlines'),
  ('sat_scores'),
  ('college_savings'),
  ('college_goal'),
  ('retirement_accounts'),
  ('retirement_assumptions'),
  ('mortgage'),
  ('other_debt'),
  ('net_worth_snapshots'),
  ('finance_action_items');

-- Preflight checks.
-- These checks fail before writes if the repository schema assumptions are not
-- true in the target database.
do $$
declare
  missing_tables text;
  missing_user_id_columns text;
  auth_user_count integer;
  module_user_count integer;
  null_user_rows bigint := 0;
  table_null_user_rows bigint;
  table_name text;
begin
  select string_agg(mt.table_name, ', ' order by mt.table_name)
  into missing_tables
  from migration_module_tables mt
  left join information_schema.tables t
    on t.table_schema = 'public'
   and t.table_name = mt.table_name
  where t.table_name is null;

  if missing_tables is not null then
    raise exception 'Household draft preflight failed. Missing expected module tables: %', missing_tables;
  end if;

  select string_agg(mt.table_name, ', ' order by mt.table_name)
  into missing_user_id_columns
  from migration_module_tables mt
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = mt.table_name
   and c.column_name = 'user_id'
  where c.column_name is null;

  if missing_user_id_columns is not null then
    raise exception 'Household draft preflight failed. Missing user_id columns: %', missing_user_id_columns;
  end if;

  select count(*) into auth_user_count from auth.users;

  execute (
    select format(
      'select count(distinct user_id) from (%s) module_users',
      string_agg(format('select user_id from public.%I where user_id is not null', table_name), ' union all ')
    )
    from migration_module_tables
  ) into module_user_count;

  for table_name in
    select mt.table_name
    from migration_module_tables mt
    order by mt.table_name
  loop
    execute format('select count(*) from public.%I where user_id is null', table_name)
    into table_null_user_rows;
    null_user_rows := null_user_rows + table_null_user_rows;
  end loop;

  raise notice 'Household draft preflight: auth users %, module users with data %, module rows with null user_id %',
    auth_user_count,
    coalesce(module_user_count, 0),
    null_user_rows;
end $$;

-- Auth user metadata. This separates app-visible profile fields from auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Primary shared ownership boundary.
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active',
  bootstrap_source_user_id uuid references auth.users(id) on delete set null,
  bootstrap_migration_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_status_check check (status in ('active', 'archived'))
);

alter table public.households
  add column if not exists bootstrap_source_user_id uuid references auth.users(id) on delete set null;

alter table public.households
  add column if not exists bootstrap_migration_key text;

-- Household people, including child profiles that do not authenticate.
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  first_name text,
  last_name text,
  relationship text,
  member_type text not null default 'adult',
  birthday date,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_member_type_check check (member_type in ('adult', 'child_profile', 'other'))
);

-- Authenticated household membership and role boundary.
-- Single-household-first is an app behavior decision. This schema allows one
-- user to belong to multiple households later because membership is many-to-many.
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  person_id uuid references public.people(id) on delete set null,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_members_role_check check (role in ('owner', 'adult')),
  constraint household_members_status_check check (status in ('active', 'inactive')),
  constraint household_members_user_or_person_check check (user_id is not null or person_id is not null)
);

-- Durable bootstrap trace for support and rollback analysis.
-- This schema is intentionally not public-facing app API surface.
create table if not exists familyos_internal.household_bootstrap_map (
  migration_key text not null,
  user_id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null unique references public.households(id) on delete cascade,
  source text not null default 'auth.users',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists households_created_by_user_id_idx on public.households(created_by_user_id);
create index if not exists households_status_idx on public.households(status);
create unique index if not exists households_bootstrap_source_user_unique
  on public.households(bootstrap_source_user_id)
  where bootstrap_source_user_id is not null;
create index if not exists households_bootstrap_migration_key_idx
  on public.households(bootstrap_migration_key);
create index if not exists people_household_id_idx on public.people(household_id);
create index if not exists people_household_member_type_idx on public.people(household_id, member_type);
create index if not exists household_members_household_id_idx on public.household_members(household_id);
create index if not exists household_members_user_id_idx on public.household_members(user_id);
create index if not exists household_members_household_user_idx on public.household_members(household_id, user_id);
create index if not exists household_members_household_role_idx on public.household_members(household_id, role);
create index if not exists household_bootstrap_map_household_id_idx
  on familyos_internal.household_bootstrap_map(household_id);

-- Prevent duplicate active login membership for the same user in the same household.
create unique index if not exists household_members_active_user_unique
  on public.household_members(household_id, user_id)
  where user_id is not null and status = 'active';

-- Current shared module tables from supabase/schema.sql lines 242-248.
-- household_id stays nullable in the first migration so the existing app and
-- current user_id RLS policies continue to work during review and app updates.
do $$
declare
  table_name text;
begin
  for table_name in
    select mt.table_name
    from migration_module_tables mt
    order by mt.table_name
  loop
    execute format(
      'alter table public.%I add column if not exists household_id uuid references public.households(id)',
      table_name
    );
    execute format(
      'create index if not exists %I on public.%I(household_id)',
      table_name || '_household_id_idx',
      table_name
    );
  end loop;
end $$;

create index if not exists tasks_household_completed_due_date_idx
  on public.tasks(household_id, completed, due_date);
create index if not exists home_maintenance_household_last_completed_idx
  on public.home_maintenance(household_id, last_completed);
create index if not exists pool_readings_household_logged_at_idx
  on public.pool_readings(household_id, logged_at desc);
create index if not exists pool_treatments_household_logged_at_idx
  on public.pool_treatments(household_id, logged_at desc);
create index if not exists college_deadlines_household_completed_due_date_idx
  on public.college_deadlines(household_id, completed, due_date);
create index if not exists college_essays_household_status_due_date_idx
  on public.college_essays(household_id, status, due_date);
create index if not exists retirement_accounts_household_name_idx
  on public.retirement_accounts(household_id, name);
create index if not exists net_worth_snapshots_household_date_idx
  on public.net_worth_snapshots(household_id, date desc);

-- Bootstrap every auth user. This intentionally covers users with no existing
-- module rows so first login after migration does not need a separate household
-- creation path.
insert into public.profiles(id, email, created_at, updated_at)
select auth_users.id, auth_users.email, now(), now()
from auth.users auth_users
on conflict (id) do update
set email = excluded.email,
    updated_at = now();

-- Idempotent default household creation.
-- The unique partial index on households.bootstrap_source_user_id prevents
-- duplicate bootstrap households for the same auth user across reruns.
insert into public.households(
  name,
  created_by_user_id,
  status,
  bootstrap_source_user_id,
  bootstrap_migration_key
)
select
  'Family household',
  auth_users.id,
  'active',
  auth_users.id,
  '2026-06-27_household_foundation_draft'
from auth.users auth_users
where not exists (
  select 1
  from public.households existing_household
  where existing_household.bootstrap_source_user_id = auth_users.id
)
on conflict do nothing;

insert into familyos_internal.household_bootstrap_map(
  migration_key,
  user_id,
  household_id,
  source,
  created_at,
  updated_at
)
select
  '2026-06-27_household_foundation_draft',
  auth_users.id,
  households.id,
  'auth.users',
  now(),
  now()
from auth.users auth_users
join public.households households
  on households.bootstrap_source_user_id = auth_users.id
on conflict (user_id) do update
set household_id = excluded.household_id,
    migration_key = excluded.migration_key,
    source = excluded.source,
    updated_at = now();

insert into public.household_members(household_id, user_id, role, status)
select bootstrap.household_id, bootstrap.user_id, 'owner', 'active'
from familyos_internal.household_bootstrap_map bootstrap
on conflict do nothing;

do $$
declare
  table_name text;
begin
  for table_name in
    select mt.table_name
    from migration_module_tables mt
    order by mt.table_name
  loop
    execute format(
      'update public.%I target
       set household_id = bootstrap.household_id
       from familyos_internal.household_bootstrap_map bootstrap
       where target.user_id = bootstrap.user_id
         and target.household_id is null',
      table_name
    );
  end loop;
end $$;

-- Foundation-table RLS only.
-- Module-table RLS remains the existing user_id policy from supabase/schema.sql.
create or replace function public.familyos_has_household_role(
  target_household_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role = any(allowed_roles)
  );
$$;

create or replace function public.familyos_is_household_owner(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.familyos_has_household_role(target_household_id, array['owner']);
$$;

revoke all on function public.familyos_has_household_role(uuid, text[]) from public;
grant execute on function public.familyos_has_household_role(uuid, text[]) to authenticated;

revoke all on function public.familyos_is_household_owner(uuid) from public;
grant execute on function public.familyos_is_household_owner(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.people enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "households_select_member" on public.households;
create policy "households_select_member"
on public.households
for select
to authenticated
using (public.familyos_has_household_role(id, array['owner', 'adult']));

drop policy if exists "households_update_owner" on public.households;
create policy "households_update_owner"
on public.households
for update
to authenticated
using (public.familyos_is_household_owner(id))
with check (public.familyos_is_household_owner(id));

drop policy if exists "household_members_select_member" on public.household_members;
create policy "household_members_select_member"
on public.household_members
for select
to authenticated
using (public.familyos_has_household_role(household_id, array['owner', 'adult']));

drop policy if exists "household_members_insert_owner" on public.household_members;
create policy "household_members_insert_owner"
on public.household_members
for insert
to authenticated
with check (public.familyos_is_household_owner(household_id));

drop policy if exists "household_members_update_owner" on public.household_members;
create policy "household_members_update_owner"
on public.household_members
for update
to authenticated
using (public.familyos_is_household_owner(household_id))
with check (public.familyos_is_household_owner(household_id));

drop policy if exists "people_select_member" on public.people;
create policy "people_select_member"
on public.people
for select
to authenticated
using (public.familyos_has_household_role(household_id, array['owner', 'adult']));

drop policy if exists "people_insert_adult" on public.people;
create policy "people_insert_adult"
on public.people
for insert
to authenticated
with check (public.familyos_has_household_role(household_id, array['owner', 'adult']));

drop policy if exists "people_update_adult" on public.people;
create policy "people_update_adult"
on public.people
for update
to authenticated
using (public.familyos_has_household_role(household_id, array['owner', 'adult']))
with check (public.familyos_has_household_role(household_id, array['owner', 'adult']));

-- No delete policies are included in the first draft. Hard-delete behavior for
-- households, members, and people should remain blocked until owner-only delete
-- semantics and backup expectations are reviewed.

-- Postflight checks.
do $$
declare
  auth_user_count integer;
  profile_count integer;
  bootstrap_count integer;
  owner_membership_count integer;
  missing_household_rows bigint := 0;
  table_missing_rows bigint;
  table_name text;
begin
  select count(*) into auth_user_count from auth.users;
  select count(*) into profile_count from public.profiles;
  select count(*) into bootstrap_count from familyos_internal.household_bootstrap_map;
  select count(*)
  into owner_membership_count
  from public.household_members
  where role = 'owner'
    and status = 'active'
    and user_id is not null;

  if profile_count < auth_user_count then
    raise exception 'Household draft postflight failed. Profiles % are fewer than auth users %.',
      profile_count,
      auth_user_count;
  end if;

  if bootstrap_count < auth_user_count then
    raise exception 'Household draft postflight failed. Bootstrap mappings % are fewer than auth users %.',
      bootstrap_count,
      auth_user_count;
  end if;

  if owner_membership_count < auth_user_count then
    raise exception 'Household draft postflight failed. Active owner memberships % are fewer than auth users %.',
      owner_membership_count,
      auth_user_count;
  end if;

  for table_name in
    select mt.table_name
    from migration_module_tables mt
    order by mt.table_name
  loop
    execute format(
      'select count(*) from public.%I where user_id is not null and household_id is null',
      table_name
    )
    into table_missing_rows;
    missing_household_rows := missing_household_rows + table_missing_rows;
  end loop;

  if missing_household_rows > 0 then
    raise exception 'Household draft postflight failed. % legacy rows with user_id still have null household_id.',
      missing_household_rows;
  end if;

  raise notice 'Household draft postflight passed: auth users %, profiles %, bootstrap mappings %, active owner memberships %, unmapped legacy rows %',
    auth_user_count,
    profile_count,
    bootstrap_count,
    owner_membership_count,
    missing_household_rows;
end $$;

-- Validation queries for local-only dry review after this draft is copied into
-- an isolated database copy. Do not run against production.
--
-- select count(*) as auth_users from auth.users;
-- select count(*) as bootstrap_mappings from familyos_internal.household_bootstrap_map;
-- select count(*) as households from public.households;
-- select count(*) as owners from public.household_members where role = 'owner' and status = 'active';
--
-- For each module table, compare:
-- select count(*) from public.<table_name> where user_id is not null;
-- select count(*) from public.<table_name> where user_id is not null and household_id is not null;

-- Future module-table RLS work, intentionally not executed here:
-- 1. Update app data access to resolve active household_id.
-- 2. Require inserts to include household_id.
-- 3. Add owner/adult policy checks for sensitive finance and college data.
-- 4. Replace current user_id module policies only after local RLS smoke tests.

commit;
