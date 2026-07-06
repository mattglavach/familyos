create extension if not exists pgcrypto;

create or replace function public.familyos_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.pool_readings add column if not exists test_source text not null default 'Manual';
alter table public.pool_readings add column if not exists recent_weather_notes text not null default '';
alter table public.pool_readings add column if not exists recent_heavy_usage boolean not null default false;
alter table public.pool_readings add column if not exists created_at timestamptz not null default now();
alter table public.pool_readings add column if not exists updated_at timestamptz not null default now();
alter table public.pool_readings drop constraint if exists pool_readings_test_source_check;
alter table public.pool_readings add constraint pool_readings_test_source_check check (test_source in ('Taylor Kit', 'Pool Store', 'Manual', 'Pentair', 'Home Assistant'));

alter table public.pool_treatments add column if not exists water_clarity text not null default '';
alter table public.pool_treatments add column if not exists created_at timestamptz not null default now();
alter table public.pool_treatments add column if not exists updated_at timestamptz not null default now();

alter table public.pool_maintenance add column if not exists equipment_id text;
alter table public.pool_maintenance add column if not exists water_clarity text not null default '';
alter table public.pool_maintenance add column if not exists created_at timestamptz not null default now();
alter table public.pool_maintenance add column if not exists updated_at timestamptz not null default now();

alter table public.pool_schedule add column if not exists equipment_id text;
alter table public.pool_schedule add column if not exists maintenance_type text not null default 'Pool reminder';
alter table public.pool_schedule add column if not exists created_at timestamptz not null default now();
alter table public.pool_schedule add column if not exists updated_at timestamptz not null default now();

create table if not exists public.pool_equipment (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  type text not null,
  name text not null,
  brand text not null default '',
  model text not null default '',
  install_date date,
  last_maintenance date,
  next_maintenance date,
  warranty_notes text not null default '',
  manual_link text not null default '',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pool_equipment_type_check check (type in ('Pump', 'Salt Cell (SWG)', 'Filter', 'Heater', 'Robot Cleaner', 'Betta Skimmer', 'Solar Cover', 'Test Kit')),
  constraint pool_equipment_name_not_blank_check check (length(trim(name)) > 0)
);

create table if not exists public.pool_action_audits (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  reading_id uuid references public.pool_readings(id) on delete set null,
  recommendation_id text not null,
  action text not null,
  explanation text not null default '',
  confidence text not null default 'Medium',
  safety_note text not null default '',
  status text not null default 'recommended',
  confirmed_at timestamptz,
  completed_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pool_action_audits_status_check check (status in ('recommended', 'confirmed', 'completed', 'dismissed'))
);

alter table public.pool_maintenance drop constraint if exists pool_maintenance_equipment_id_fkey;
alter table public.pool_maintenance add constraint pool_maintenance_equipment_id_fkey foreign key (equipment_id) references public.pool_equipment(id) on delete set null;
alter table public.pool_schedule drop constraint if exists pool_schedule_equipment_id_fkey;
alter table public.pool_schedule add constraint pool_schedule_equipment_id_fkey foreign key (equipment_id) references public.pool_equipment(id) on delete set null;

create index if not exists pool_equipment_household_type_idx on public.pool_equipment(household_id, type);
create index if not exists pool_equipment_next_maintenance_idx on public.pool_equipment(next_maintenance);
create index if not exists pool_action_audits_household_created_idx on public.pool_action_audits(household_id, created_at desc);
create index if not exists pool_action_audits_reading_idx on public.pool_action_audits(reading_id);
create index if not exists pool_readings_household_logged_at_idx on public.pool_readings(household_id, logged_at desc);
create index if not exists pool_treatments_household_logged_at_idx on public.pool_treatments(household_id, logged_at desc);
create index if not exists pool_maintenance_household_date_idx on public.pool_maintenance(household_id, date desc);
create index if not exists pool_schedule_household_type_idx on public.pool_schedule(household_id, maintenance_type);

drop trigger if exists pool_readings_set_updated_at on public.pool_readings;
create trigger pool_readings_set_updated_at before update on public.pool_readings for each row execute function public.familyos_set_updated_at();
drop trigger if exists pool_treatments_set_updated_at on public.pool_treatments;
create trigger pool_treatments_set_updated_at before update on public.pool_treatments for each row execute function public.familyos_set_updated_at();
drop trigger if exists pool_maintenance_set_updated_at on public.pool_maintenance;
create trigger pool_maintenance_set_updated_at before update on public.pool_maintenance for each row execute function public.familyos_set_updated_at();
drop trigger if exists pool_schedule_set_updated_at on public.pool_schedule;
create trigger pool_schedule_set_updated_at before update on public.pool_schedule for each row execute function public.familyos_set_updated_at();
drop trigger if exists pool_equipment_set_updated_at on public.pool_equipment;
create trigger pool_equipment_set_updated_at before update on public.pool_equipment for each row execute function public.familyos_set_updated_at();
drop trigger if exists pool_action_audits_set_updated_at on public.pool_action_audits;
create trigger pool_action_audits_set_updated_at before update on public.pool_action_audits for each row execute function public.familyos_set_updated_at();

alter table public.pool_equipment enable row level security;
alter table public.pool_action_audits enable row level security;
alter table public.pool_readings enable row level security;
alter table public.pool_treatments enable row level security;
alter table public.pool_maintenance enable row level security;
alter table public.pool_schedule enable row level security;

grant select, insert, update, delete on public.pool_equipment to authenticated;
grant select, insert, update, delete on public.pool_action_audits to authenticated;
grant select, insert, update, delete on public.pool_readings to authenticated;
grant select, insert, update, delete on public.pool_treatments to authenticated;
grant select, insert, update, delete on public.pool_maintenance to authenticated;
grant select, insert, update, delete on public.pool_schedule to authenticated;

drop policy if exists "familyos_user_all" on public.pool_readings;
drop policy if exists "familyos_user_all" on public.pool_treatments;
drop policy if exists "familyos_user_all" on public.pool_maintenance;
drop policy if exists "familyos_user_all" on public.pool_schedule;
drop policy if exists "familyos_user_all" on public.pool_equipment;
drop policy if exists "familyos_user_all" on public.pool_action_audits;

drop policy if exists "pool_readings_member_select" on public.pool_readings;
create policy "pool_readings_member_select" on public.pool_readings for select to authenticated using (
  exists (select 1 from public.household_members hm where hm.household_id = pool_readings.household_id and hm.user_id = auth.uid() and hm.status = 'active')
);
drop policy if exists "pool_readings_manager_all" on public.pool_readings;
create policy "pool_readings_manager_all" on public.pool_readings for all to authenticated
using (public.familyos_has_household_role(household_id, array['owner', 'adult']))
with check (user_id = auth.uid() and public.familyos_has_household_role(household_id, array['owner', 'adult']));

drop policy if exists "pool_treatments_member_select" on public.pool_treatments;
create policy "pool_treatments_member_select" on public.pool_treatments for select to authenticated using (
  exists (select 1 from public.household_members hm where hm.household_id = pool_treatments.household_id and hm.user_id = auth.uid() and hm.status = 'active')
);
drop policy if exists "pool_treatments_manager_all" on public.pool_treatments;
create policy "pool_treatments_manager_all" on public.pool_treatments for all to authenticated
using (public.familyos_has_household_role(household_id, array['owner', 'adult']))
with check (user_id = auth.uid() and public.familyos_has_household_role(household_id, array['owner', 'adult']));

drop policy if exists "pool_maintenance_member_select" on public.pool_maintenance;
create policy "pool_maintenance_member_select" on public.pool_maintenance for select to authenticated using (
  exists (select 1 from public.household_members hm where hm.household_id = pool_maintenance.household_id and hm.user_id = auth.uid() and hm.status = 'active')
);
drop policy if exists "pool_maintenance_manager_all" on public.pool_maintenance;
create policy "pool_maintenance_manager_all" on public.pool_maintenance for all to authenticated
using (
  public.familyos_has_household_role(household_id, array['owner', 'adult'])
  and (
    equipment_id is null
    or exists (
      select 1 from public.pool_equipment pe
      where pe.id = equipment_id
        and pe.household_id = pool_maintenance.household_id
    )
  )
)
with check (
  user_id = auth.uid()
  and public.familyos_has_household_role(household_id, array['owner', 'adult'])
  and (
    equipment_id is null
    or exists (
      select 1 from public.pool_equipment pe
      where pe.id = equipment_id
        and pe.household_id = pool_maintenance.household_id
    )
  )
);

drop policy if exists "pool_schedule_member_select" on public.pool_schedule;
create policy "pool_schedule_member_select" on public.pool_schedule for select to authenticated using (
  exists (select 1 from public.household_members hm where hm.household_id = pool_schedule.household_id and hm.user_id = auth.uid() and hm.status = 'active')
);
drop policy if exists "pool_schedule_manager_all" on public.pool_schedule;
create policy "pool_schedule_manager_all" on public.pool_schedule for all to authenticated
using (
  public.familyos_has_household_role(household_id, array['owner', 'adult'])
  and (
    equipment_id is null
    or exists (
      select 1 from public.pool_equipment pe
      where pe.id = equipment_id
        and pe.household_id = pool_schedule.household_id
    )
  )
)
with check (
  user_id = auth.uid()
  and public.familyos_has_household_role(household_id, array['owner', 'adult'])
  and (
    equipment_id is null
    or exists (
      select 1 from public.pool_equipment pe
      where pe.id = equipment_id
        and pe.household_id = pool_schedule.household_id
    )
  )
);

drop policy if exists "pool_equipment_member_select" on public.pool_equipment;
create policy "pool_equipment_member_select" on public.pool_equipment for select to authenticated using (
  exists (select 1 from public.household_members hm where hm.household_id = pool_equipment.household_id and hm.user_id = auth.uid() and hm.status = 'active')
);
drop policy if exists "pool_equipment_manager_all" on public.pool_equipment;
create policy "pool_equipment_manager_all" on public.pool_equipment for all to authenticated
using (public.familyos_has_household_role(household_id, array['owner', 'adult']))
with check (user_id = auth.uid() and public.familyos_has_household_role(household_id, array['owner', 'adult']));

drop policy if exists "pool_action_audits_member_select" on public.pool_action_audits;
create policy "pool_action_audits_member_select" on public.pool_action_audits for select to authenticated using (
  exists (select 1 from public.household_members hm where hm.household_id = pool_action_audits.household_id and hm.user_id = auth.uid() and hm.status = 'active')
);
drop policy if exists "pool_action_audits_manager_all" on public.pool_action_audits;
create policy "pool_action_audits_manager_all" on public.pool_action_audits for all to authenticated
using (
  public.familyos_has_household_role(household_id, array['owner', 'adult'])
  and (
    reading_id is null
    or exists (
      select 1 from public.pool_readings pr
      where pr.id = reading_id
        and pr.household_id = pool_action_audits.household_id
    )
  )
)
with check (
  user_id = auth.uid()
  and public.familyos_has_household_role(household_id, array['owner', 'adult'])
  and (
    reading_id is null
    or exists (
      select 1 from public.pool_readings pr
      where pr.id = reading_id
        and pr.household_id = pool_action_audits.household_id
    )
  )
);
