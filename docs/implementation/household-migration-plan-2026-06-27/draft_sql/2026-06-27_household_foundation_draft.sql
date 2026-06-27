-- DRAFT ONLY - DO NOT APPLY
-- Family OS household-centered architecture foundation draft.
-- Created for review on 2026-06-27.
--
-- This file is intentionally stored under docs/implementation because the repo
-- does not currently have a Supabase migrations folder or migration naming
-- pattern. Do not copy this into a live migration until it has been reviewed.
--
-- Source baseline:
-- - supabase/schema.sql creates current module tables at lines 3-234.
-- - supabase/schema.sql adds user_id and user-scoped RLS at lines 236-261.
-- - docs/implementation/household-migration-plan-2026-06-27/01_SCHEMA_CHANGE_PLAN.md
-- - docs/decisions/2026-06-27-household-architecture/08_MIGRATION_DECISION_SUMMARY.md
--
-- Design choices in this draft:
-- - Create one default household per distinct existing user_id.
-- - Create owner membership for that user.
-- - Add nullable household_id to existing shared module tables.
-- - Keep user_id columns and existing user_id RLS policies for compatibility.
-- - Do not enforce household_id not null yet.
-- - Do not drop or replace current RLS policies yet.
-- - Children are people/profile records only for now, not auth users.
-- - Guest access is reserved for future design and is not granted here.

begin;

create extension if not exists "pgcrypto";

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_status_check check (status in ('active', 'archived'))
);

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

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists households_created_by_user_id_idx on public.households(created_by_user_id);
create index if not exists households_status_idx on public.households(status);
create index if not exists people_household_id_idx on public.people(household_id);
create index if not exists people_household_member_type_idx on public.people(household_id, member_type);
create index if not exists household_members_household_id_idx on public.household_members(household_id);
create index if not exists household_members_user_id_idx on public.household_members(user_id);
create index if not exists household_members_household_user_idx on public.household_members(household_id, user_id);
create index if not exists household_members_household_role_idx on public.household_members(household_id, role);

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
  foreach table_name in array array[
    'notes','tasks','home_maintenance','pool_readings','pool_maintenance',
    'pool_treatments','pool_schedule','pool_settings','college_schools',
    'college_test_plan','college_essays','college_deadlines','sat_scores',
    'college_savings','college_goal','retirement_accounts',
    'retirement_assumptions','mortgage','other_debt','net_worth_snapshots',
    'finance_action_items'
  ]
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

-- Backfill planning section.
-- This creates one default household per distinct existing user_id found in
-- current module tables, then assigns all of that user's legacy records to
-- the created household. Review carefully before applying to any environment:
-- this assumes each existing user currently represents exactly one household.
create temporary table household_backfill_users (
  user_id uuid primary key
) on commit drop;

insert into household_backfill_users(user_id)
select distinct user_id
from (
  select user_id from public.notes where user_id is not null
  union select user_id from public.tasks where user_id is not null
  union select user_id from public.home_maintenance where user_id is not null
  union select user_id from public.pool_readings where user_id is not null
  union select user_id from public.pool_maintenance where user_id is not null
  union select user_id from public.pool_treatments where user_id is not null
  union select user_id from public.pool_schedule where user_id is not null
  union select user_id from public.pool_settings where user_id is not null
  union select user_id from public.college_schools where user_id is not null
  union select user_id from public.college_test_plan where user_id is not null
  union select user_id from public.college_essays where user_id is not null
  union select user_id from public.college_deadlines where user_id is not null
  union select user_id from public.sat_scores where user_id is not null
  union select user_id from public.college_savings where user_id is not null
  union select user_id from public.college_goal where user_id is not null
  union select user_id from public.retirement_accounts where user_id is not null
  union select user_id from public.retirement_assumptions where user_id is not null
  union select user_id from public.mortgage where user_id is not null
  union select user_id from public.other_debt where user_id is not null
  union select user_id from public.net_worth_snapshots where user_id is not null
  union select user_id from public.finance_action_items where user_id is not null
) existing_users;

insert into public.profiles(id, email, created_at, updated_at)
select auth_users.id, auth_users.email, now(), now()
from auth.users auth_users
join household_backfill_users backfill_users on backfill_users.user_id = auth_users.id
on conflict (id) do update
set email = excluded.email,
    updated_at = now();

create temporary table household_backfill_map (
  user_id uuid primary key,
  household_id uuid not null
) on commit drop;

with created_households as (
  insert into public.households(name, created_by_user_id, status)
  select
    coalesce(nullif(split_part(auth_users.email, '@', 1), ''), 'Family') || ' household',
    backfill_users.user_id,
    'active'
  from household_backfill_users backfill_users
  left join auth.users auth_users on auth_users.id = backfill_users.user_id
  returning id, created_by_user_id
)
insert into household_backfill_map(user_id, household_id)
select created_by_user_id, id
from created_households
where created_by_user_id is not null;

insert into public.household_members(household_id, user_id, role, status)
select household_id, user_id, 'owner', 'active'
from household_backfill_map
on conflict do nothing;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'notes','tasks','home_maintenance','pool_readings','pool_maintenance',
    'pool_treatments','pool_schedule','pool_settings','college_schools',
    'college_test_plan','college_essays','college_deadlines','sat_scores',
    'college_savings','college_goal','retirement_accounts',
    'retirement_assumptions','mortgage','other_debt','net_worth_snapshots',
    'finance_action_items'
  ]
  loop
    execute format(
      'update public.%I target
       set household_id = backfill.household_id
       from household_backfill_map backfill
       where target.user_id = backfill.user_id
         and target.household_id is null',
      table_name
    );
  end loop;
end $$;

-- Validation queries to run manually after review in a local-only dry run:
--
-- select count(*) as households_created from public.households;
-- select count(*) as active_owner_memberships
-- from public.household_members
-- where role = 'owner' and status = 'active';
--
-- For each module table, compare:
-- select count(*) from public.<table_name> where user_id is not null;
-- select count(*) from public.<table_name> where user_id is not null and household_id is not null;

-- RLS DRAFT ONLY - NOT EXECUTED IN THIS FIRST DRAFT.
-- Keep the existing user_id policies from supabase/schema.sql until app access
-- has an active household context and local RLS smoke tests are written.
--
-- Example future helper:
-- create or replace function public.is_active_household_member(target_household_id uuid)
-- returns boolean
-- language sql
-- stable
-- security definer
-- set search_path = public
-- as $rls$
--   select exists (
--     select 1
--     from public.household_members hm
--     where hm.household_id = target_household_id
--       and hm.user_id = auth.uid()
--       and hm.status = 'active'
--       and hm.role in ('owner', 'adult')
--   );
-- $rls$;
--
-- Example future shared-module policy shape:
-- create policy "<table>_household_member_all"
-- on public.<table>
-- for all
-- to authenticated
-- using (public.is_active_household_member(household_id))
-- with check (public.is_active_household_member(household_id));
--
-- Example future owner-only policy shape for destructive household actions:
-- create policy "households_owner_delete"
-- on public.households
-- for delete
-- to authenticated
-- using (
--   exists (
--     select 1
--     from public.household_members hm
--     where hm.household_id = households.id
--       and hm.user_id = auth.uid()
--       and hm.status = 'active'
--       and hm.role = 'owner'
--   )
-- );

commit;
