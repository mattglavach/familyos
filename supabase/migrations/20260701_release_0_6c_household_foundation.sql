-- Release 0.6C production migration draft: household data foundation.
--
-- This draft converts the local-only household foundation work into a staged
-- production migration. It creates durable household/profile/person/settings
-- foundations, adds nullable household compatibility fields to existing module
-- tables, and keeps existing module-table user_id RLS policies unchanged.
--
-- Review and dry-run this migration against a staging copy before production.
-- Runtime app behavior and localStorage-backed Release 0.6B features are not
-- changed by this SQL draft.

begin;

create extension if not exists "pgcrypto";

create schema if not exists familyos_internal;
revoke all on schema familyos_internal from public;
revoke all on schema familyos_internal from anon;
revoke all on schema familyos_internal from authenticated;

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

do $$
declare
  missing_tables text;
  missing_user_id_columns text;
begin
  select string_agg(mt.table_name, ', ' order by mt.table_name)
  into missing_tables
  from migration_module_tables mt
  left join information_schema.tables t
    on t.table_schema = 'public'
   and t.table_name = mt.table_name
  where t.table_name is null;

  if missing_tables is not null then
    raise exception 'Release 0.6C household foundation preflight failed. Missing expected module tables: %',
      missing_tables;
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
    raise exception 'Release 0.6C household foundation preflight failed. Missing user_id columns: %',
      missing_user_id_columns;
  end if;
end $$;

create or replace function public.familyos_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active',
  bootstrap_source_user_id uuid references auth.users(id) on delete set null,
  bootstrap_migration_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint households_name_not_blank_check check (length(trim(name)) > 0),
  constraint households_status_check check (status in ('active', 'archived'))
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text,
  relationship text,
  member_type text not null default 'adult',
  color text,
  birthday date,
  email text,
  phone text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint people_member_type_check check (member_type in ('adult', 'teen', 'child', 'viewer', 'other')),
  constraint people_status_check check (status in ('active', 'inactive'))
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  person_id uuid references public.people(id) on delete set null,
  role text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_members_role_check check (role in ('owner', 'adult', 'teen', 'child', 'viewer')),
  constraint household_members_status_check check (status in ('active', 'inactive')),
  constraint household_members_user_or_person_check check (user_id is not null or person_id is not null)
);

create table if not exists public.household_settings (
  household_id uuid primary key references public.households(id) on delete cascade,
  default_task_category text,
  default_task_priority text,
  default_task_status text not null default 'not_started',
  calendar_sync_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_settings_default_task_priority_check
    check (default_task_priority is null or default_task_priority in ('low', 'medium', 'high')),
  constraint household_settings_default_task_status_check
    check (default_task_status in ('not_started', 'in_progress', 'completed'))
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_household_id uuid references public.households(id) on delete set null,
  default_person_id uuid references public.people(id) on delete set null,
  default_task_category text,
  default_task_priority text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_default_task_priority_check
    check (default_task_priority is null or default_task_priority in ('low', 'medium', 'high'))
);

create table if not exists familyos_internal.household_bootstrap_map (
  migration_key text not null,
  user_id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null unique references public.households(id) on delete cascade,
  source text not null default 'auth.users',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on table familyos_internal.household_bootstrap_map from public;
revoke all on table familyos_internal.household_bootstrap_map from anon;
revoke all on table familyos_internal.household_bootstrap_map from authenticated;

-- Upgrade existing local foundation tables from the earlier 20260627 draft.
alter table public.people
  add column if not exists display_name text,
  add column if not exists color text,
  add column if not exists status text not null default 'active';

alter table public.people
  drop constraint if exists people_member_type_check,
  drop constraint if exists people_status_check,
  add constraint people_member_type_check
    check (member_type in ('adult', 'teen', 'child', 'child_profile', 'viewer', 'other')),
  add constraint people_status_check
    check (status in ('active', 'inactive'));

alter table public.household_members
  drop constraint if exists household_members_role_check,
  add constraint household_members_role_check
    check (role in ('owner', 'adult', 'teen', 'child', 'viewer'));

create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists households_created_by_user_id_idx on public.households(created_by_user_id);
create index if not exists households_status_idx on public.households(status);
create unique index if not exists households_bootstrap_source_user_unique
  on public.households(bootstrap_source_user_id)
  where bootstrap_source_user_id is not null;
create index if not exists households_bootstrap_migration_key_idx on public.households(bootstrap_migration_key);
create index if not exists people_household_id_idx on public.people(household_id);
create index if not exists people_household_status_idx on public.people(household_id, status);
create index if not exists people_household_member_type_idx on public.people(household_id, member_type);
create index if not exists household_members_household_id_idx on public.household_members(household_id);
create index if not exists household_members_user_id_idx on public.household_members(user_id);
create index if not exists household_members_household_user_idx on public.household_members(household_id, user_id);
create index if not exists household_members_household_role_idx on public.household_members(household_id, role);
create index if not exists user_preferences_default_household_id_idx on public.user_preferences(default_household_id);
create index if not exists user_preferences_default_person_id_idx on public.user_preferences(default_person_id);
create index if not exists household_bootstrap_map_household_id_idx
  on familyos_internal.household_bootstrap_map(household_id);

create unique index if not exists household_members_active_user_unique
  on public.household_members(household_id, user_id)
  where user_id is not null and status = 'active';

create unique index if not exists household_members_active_person_unique
  on public.household_members(household_id, person_id)
  where person_id is not null and status = 'active';

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
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated',
      table_name
    );
  end loop;
end $$;

alter table public.tasks
  add column if not exists assigned_person_id uuid references public.people(id) on delete set null,
  add column if not exists status text not null default 'not_started',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz,
  add column if not exists module_key text not null default 'tasks',
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists updated_by_user_id uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_status_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_status_check check (status in ('not_started', 'in_progress', 'completed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_module_key_not_blank_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_module_key_not_blank_check check (length(trim(module_key)) > 0);
  end if;
end $$;

update public.tasks
set status = 'completed',
    completed_at = coalesce(completed_at, last_completed::timestamptz),
    updated_at = now()
where completed = true
  and status <> 'completed';

update public.tasks
set created_by_user_id = user_id
where created_by_user_id is null
  and user_id is not null;

create index if not exists tasks_household_completed_due_date_idx
  on public.tasks(household_id, completed, due_date);
create index if not exists tasks_household_status_due_date_idx
  on public.tasks(household_id, status, due_date);
create index if not exists tasks_assigned_person_id_idx on public.tasks(assigned_person_id);
create index if not exists tasks_module_key_idx on public.tasks(module_key);
create index if not exists tasks_created_at_idx on public.tasks(created_at);
create index if not exists tasks_completed_at_idx on public.tasks(completed_at);

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

insert into public.profiles(id, email, display_name, created_at, updated_at)
select
  auth_users.id,
  auth_users.email,
  nullif(coalesce(auth_users.raw_user_meta_data->>'full_name', auth_users.raw_user_meta_data->>'name'), ''),
  now(),
  now()
from auth.users auth_users
on conflict (id) do update
set email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    updated_at = now();

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
  '20260701_release_0_6c_household_foundation'
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
  '20260701_release_0_6c_household_foundation',
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

update public.household_members household_member
set role = 'owner',
    status = 'active',
    updated_at = now()
from familyos_internal.household_bootstrap_map bootstrap
where household_member.household_id = bootstrap.household_id
  and household_member.user_id = bootstrap.user_id
  and (
    household_member.role <> 'owner'
    or household_member.status <> 'active'
  );

insert into public.household_settings(household_id, created_at, updated_at)
select bootstrap.household_id, now(), now()
from familyos_internal.household_bootstrap_map bootstrap
on conflict (household_id) do nothing;

insert into public.user_preferences(user_id, default_household_id, created_at, updated_at)
select bootstrap.user_id, bootstrap.household_id, now(), now()
from familyos_internal.household_bootstrap_map bootstrap
on conflict (user_id) do update
set default_household_id = coalesce(public.user_preferences.default_household_id, excluded.default_household_id),
    updated_at = now();

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

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.familyos_set_updated_at();

drop trigger if exists households_set_updated_at on public.households;
create trigger households_set_updated_at
before update on public.households
for each row execute function public.familyos_set_updated_at();

drop trigger if exists people_set_updated_at on public.people;
create trigger people_set_updated_at
before update on public.people
for each row execute function public.familyos_set_updated_at();

drop trigger if exists household_members_set_updated_at on public.household_members;
create trigger household_members_set_updated_at
before update on public.household_members
for each row execute function public.familyos_set_updated_at();

drop trigger if exists household_settings_set_updated_at on public.household_settings;
create trigger household_settings_set_updated_at
before update on public.household_settings
for each row execute function public.familyos_set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.familyos_set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.familyos_set_updated_at();

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

create or replace function public.familyos_is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.familyos_has_household_role(
    target_household_id,
    array['owner', 'adult', 'teen', 'child', 'viewer']
  );
$$;

create or replace function public.familyos_can_manage_household(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.familyos_has_household_role(target_household_id, array['owner', 'adult']);
$$;

revoke all on function public.familyos_set_updated_at() from public;
revoke all on function public.familyos_has_household_role(uuid, text[]) from public;
revoke all on function public.familyos_is_household_member(uuid) from public;
revoke all on function public.familyos_can_manage_household(uuid) from public;

grant execute on function public.familyos_has_household_role(uuid, text[]) to authenticated;
grant execute on function public.familyos_is_household_member(uuid) to authenticated;
grant execute on function public.familyos_can_manage_household(uuid) to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.households to authenticated;
grant select, insert, update on public.people to authenticated;
grant select, insert, update on public.household_members to authenticated;
grant select, insert, update on public.household_settings to authenticated;
grant select, insert, update on public.user_preferences to authenticated;

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.people enable row level security;
alter table public.household_settings enable row level security;
alter table public.user_preferences enable row level security;

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
using (public.familyos_is_household_member(id));

drop policy if exists "households_insert_creator" on public.households;
create policy "households_insert_creator"
on public.households
for insert
to authenticated
with check (created_by_user_id = auth.uid());

drop policy if exists "households_update_manager" on public.households;
create policy "households_update_manager"
on public.households
for update
to authenticated
using (public.familyos_can_manage_household(id))
with check (public.familyos_can_manage_household(id));

drop policy if exists "household_members_select_self_or_manager" on public.household_members;
create policy "household_members_select_self_or_manager"
on public.household_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.familyos_can_manage_household(household_id)
);

drop policy if exists "household_members_insert_owner" on public.household_members;
create policy "household_members_insert_owner"
on public.household_members
for insert
to authenticated
with check (public.familyos_has_household_role(household_id, array['owner']));

drop policy if exists "household_members_update_owner" on public.household_members;
create policy "household_members_update_owner"
on public.household_members
for update
to authenticated
using (public.familyos_has_household_role(household_id, array['owner']))
with check (public.familyos_has_household_role(household_id, array['owner']));

drop policy if exists "people_select_member" on public.people;
create policy "people_select_member"
on public.people
for select
to authenticated
using (public.familyos_is_household_member(household_id));

drop policy if exists "people_insert_manager" on public.people;
create policy "people_insert_manager"
on public.people
for insert
to authenticated
with check (public.familyos_can_manage_household(household_id));

drop policy if exists "people_update_manager" on public.people;
create policy "people_update_manager"
on public.people
for update
to authenticated
using (public.familyos_can_manage_household(household_id))
with check (public.familyos_can_manage_household(household_id));

drop policy if exists "household_settings_select_member" on public.household_settings;
create policy "household_settings_select_member"
on public.household_settings
for select
to authenticated
using (public.familyos_is_household_member(household_id));

drop policy if exists "household_settings_insert_manager" on public.household_settings;
create policy "household_settings_insert_manager"
on public.household_settings
for insert
to authenticated
with check (public.familyos_can_manage_household(household_id));

drop policy if exists "household_settings_update_manager" on public.household_settings;
create policy "household_settings_update_manager"
on public.household_settings
for update
to authenticated
using (public.familyos_can_manage_household(household_id))
with check (public.familyos_can_manage_household(household_id));

drop policy if exists "user_preferences_select_own" on public.user_preferences;
create policy "user_preferences_select_own"
on public.user_preferences
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "user_preferences_insert_own" on public.user_preferences;
create policy "user_preferences_insert_own"
on public.user_preferences
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "user_preferences_update_own" on public.user_preferences;
create policy "user_preferences_update_own"
on public.user_preferences
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

do $$
declare
  auth_user_count bigint;
  profile_count bigint;
  bootstrap_count bigint;
  owner_membership_count bigint;
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
    raise exception 'Release 0.6C household foundation postflight failed. Profiles % are fewer than auth users %.',
      profile_count,
      auth_user_count;
  end if;

  if bootstrap_count < auth_user_count then
    raise exception 'Release 0.6C household foundation postflight failed. Bootstrap mappings % are fewer than auth users %.',
      bootstrap_count,
      auth_user_count;
  end if;

  if owner_membership_count < auth_user_count then
    raise exception 'Release 0.6C household foundation postflight failed. Active owner memberships % are fewer than auth users %.',
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
    raise exception 'Release 0.6C household foundation postflight failed. % legacy rows with user_id still have null household_id.',
      missing_household_rows;
  end if;
end $$;

commit;
