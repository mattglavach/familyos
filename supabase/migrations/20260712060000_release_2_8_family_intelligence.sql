begin;

create table if not exists public.home_assets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null check (length(trim(name)) > 0),
  category text not null check (category in ('hvac','appliance','filter','warranty','vehicle','lawn','garden','project')),
  status text not null default 'active' check (status in ('active','attention','paused','completed')),
  next_maintenance date, last_maintenance date, recurrence_days integer check (recurrence_days is null or recurrence_days > 0),
  notes text not null default '', attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.home_asset_history (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(), asset_id uuid not null references public.home_assets(id) on delete cascade,
  event_type text not null, completed_at timestamptz not null default now(), notes text not null default '', attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists home_assets_household_maintenance_idx on public.home_assets(household_id,next_maintenance) where status <> 'completed';
create index if not exists home_asset_history_asset_completed_idx on public.home_asset_history(asset_id,completed_at desc);

alter table public.shopping_items add column if not exists recurring boolean not null default false;
alter table public.shopping_items add column if not exists recurrence_days integer check (recurrence_days is null or recurrence_days > 0);
alter table public.shopping_items add column if not exists store_group text not null default '';
alter table public.shopping_items add column if not exists meal_group text not null default '';
alter table public.shopping_items add column if not exists inventory_flag boolean not null default false;
alter table public.shopping_items add column if not exists purchase_count integer not null default 0 check (purchase_count >= 0);
create index if not exists shopping_items_household_store_idx on public.shopping_items(household_id,store_group) where archived=false;

alter table public.home_assets enable row level security;
alter table public.home_asset_history enable row level security;
grant select,insert,update,delete on public.home_assets,public.home_asset_history to authenticated;
do $$ declare t text; begin foreach t in array array['home_assets','home_asset_history'] loop
  execute format('drop policy if exists %I on public.%I',t||'_member_select',t);
  execute format('create policy %I on public.%I for select to authenticated using (exists(select 1 from public.household_members hm where hm.household_id=%I.household_id and hm.user_id=auth.uid() and hm.status=''active''))',t||'_member_select',t,t);
  execute format('drop policy if exists %I on public.%I',t||'_manager_all',t);
  execute format('create policy %I on public.%I for all to authenticated using (public.familyos_has_household_role(household_id,array[''owner'',''adult''])) with check (user_id=auth.uid() and public.familyos_has_household_role(household_id,array[''owner'',''adult'']))',t||'_manager_all',t);
end loop; end $$;

commit;
