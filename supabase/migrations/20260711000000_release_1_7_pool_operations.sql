create table if not exists public.pool_profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null default 'Pool',
  volume_gallons integer not null check (volume_gallons > 0),
  surface_type text not null,
  sanitizer_type text not null,
  saltwater boolean not null default false,
  automation_system text not null default '', pump text not null default '', filter text not null default '', heater text not null default '', salt_cell text not null default '',
  spa_relationship text not null default '', normal_pump_runtime_hours numeric, normal_pump_speed_rpm integer, minimum_salt_cell_rpm integer, swg_output_percent numeric,
  preferred_products jsonb not null default '[]'::jsonb, chemical_concentrations jsonb not null default '{}'::jsonb, target_ranges jsonb not null default '{}'::jsonb,
  seasonal_notes text not null default '', notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (household_id, name)
);

alter table public.pool_readings add column if not exists test_context text not null default 'Routine';
alter table public.pool_readings add column if not exists water_appearance text not null default '';
alter table public.pool_treatments add column if not exists treatment text not null default '';
alter table public.pool_treatments add column if not exists amount numeric;
alter table public.pool_treatments add column if not exists unit text not null default '';
alter table public.pool_treatments add column if not exists product_concentration text not null default '';
alter table public.pool_treatments add column if not exists reason text not null default '';
alter table public.pool_treatments add column if not exists related_reading_id text references public.pool_readings(id) on delete set null;
alter table public.pool_treatments add column if not exists pump_status text not null default '';
alter table public.pool_treatments add column if not exists pump_speed_rpm integer;
alter table public.pool_treatments add column if not exists expected_result text not null default '';
alter table public.pool_treatments add column if not exists retest_at timestamptz;
alter table public.pool_treatments add column if not exists follow_up_result text not null default '';

alter table public.pool_profiles enable row level security;
grant select, insert, update, delete on public.pool_profiles to authenticated;
drop policy if exists "pool_profiles_member_select" on public.pool_profiles;
create policy "pool_profiles_member_select" on public.pool_profiles for select to authenticated using (
  exists (select 1 from public.household_members hm where hm.household_id = pool_profiles.household_id and hm.user_id = auth.uid() and hm.status = 'active')
);
drop policy if exists "pool_profiles_manager_all" on public.pool_profiles;
create policy "pool_profiles_manager_all" on public.pool_profiles for all to authenticated
using (public.familyos_has_household_role(household_id, array['owner', 'adult']))
with check (user_id = auth.uid() and public.familyos_has_household_role(household_id, array['owner', 'adult']));
drop trigger if exists pool_profiles_set_updated_at on public.pool_profiles;
create trigger pool_profiles_set_updated_at before update on public.pool_profiles for each row execute function public.familyos_set_updated_at();
create index if not exists pool_profiles_household_idx on public.pool_profiles(household_id);
