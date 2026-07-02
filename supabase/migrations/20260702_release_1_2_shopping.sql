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

create table if not exists public.shopping_lists (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  owner_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null,
  description text not null default '',
  visibility text not null default 'household',
  favorite boolean not null default false,
  archived boolean not null default false,
  category text not null default '',
  color text,
  icon text,
  sort_order integer not null default 0,
  recipe_ref text,
  meal_plan_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_lists_name_not_blank_check check (length(trim(name)) > 0),
  constraint shopping_lists_visibility_check check (visibility in ('personal', 'household', 'shared'))
);

create table if not exists public.shopping_categories (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_categories_name_not_blank_check check (length(trim(name)) > 0)
);

create table if not exists public.pantry_items (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null,
  current_quantity numeric not null default 0,
  minimum_quantity numeric not null default 0,
  unit text not null default '',
  category text not null default '',
  reorder_flag boolean not null default false,
  favorite boolean not null default false,
  notes text not null default '',
  archived boolean not null default false,
  sort_order integer not null default 0,
  recipe_ref text,
  meal_plan_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pantry_items_name_not_blank_check check (length(trim(name)) > 0),
  constraint pantry_items_current_quantity_check check (current_quantity >= 0),
  constraint pantry_items_minimum_quantity_check check (minimum_quantity >= 0)
);

create table if not exists public.shopping_items (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  list_id text not null references public.shopping_lists(id) on delete cascade,
  pantry_item_id text references public.pantry_items(id) on delete set null,
  name text not null,
  quantity numeric not null default 1,
  unit text not null default '',
  category text not null default '',
  priority text not null default 'med',
  purchased boolean not null default false,
  notes text not null default '',
  favorite boolean not null default false,
  assigned_to_person_id uuid references public.people(id) on delete set null,
  sort_order integer not null default 0,
  archived boolean not null default false,
  purchased_at timestamptz,
  recipe_ref text,
  meal_plan_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_items_name_not_blank_check check (length(trim(name)) > 0),
  constraint shopping_items_quantity_check check (quantity >= 0),
  constraint shopping_items_priority_check check (priority in ('low', 'med', 'high'))
);

create index if not exists shopping_lists_household_id_idx on public.shopping_lists(household_id);
create index if not exists shopping_lists_owner_user_id_idx on public.shopping_lists(owner_user_id);
create index if not exists shopping_lists_visibility_idx on public.shopping_lists(visibility);
create index if not exists shopping_lists_updated_at_idx on public.shopping_lists(updated_at desc);
create index if not exists shopping_categories_household_id_idx on public.shopping_categories(household_id);
create index if not exists shopping_items_household_id_idx on public.shopping_items(household_id);
create index if not exists shopping_items_list_id_idx on public.shopping_items(list_id);
create index if not exists shopping_items_purchased_idx on public.shopping_items(purchased);
create index if not exists shopping_items_category_idx on public.shopping_items(category);
create index if not exists shopping_items_updated_at_idx on public.shopping_items(updated_at desc);
create index if not exists pantry_items_household_id_idx on public.pantry_items(household_id);
create index if not exists pantry_items_category_idx on public.pantry_items(category);
create index if not exists pantry_items_reorder_idx on public.pantry_items(reorder_flag);
create index if not exists pantry_items_updated_at_idx on public.pantry_items(updated_at desc);

drop trigger if exists shopping_lists_set_updated_at on public.shopping_lists;
create trigger shopping_lists_set_updated_at before update on public.shopping_lists
for each row execute function public.familyos_set_updated_at();

drop trigger if exists shopping_categories_set_updated_at on public.shopping_categories;
create trigger shopping_categories_set_updated_at before update on public.shopping_categories
for each row execute function public.familyos_set_updated_at();

drop trigger if exists shopping_items_set_updated_at on public.shopping_items;
create trigger shopping_items_set_updated_at before update on public.shopping_items
for each row execute function public.familyos_set_updated_at();

drop trigger if exists pantry_items_set_updated_at on public.pantry_items;
create trigger pantry_items_set_updated_at before update on public.pantry_items
for each row execute function public.familyos_set_updated_at();

alter table public.shopping_lists enable row level security;
alter table public.shopping_categories enable row level security;
alter table public.shopping_items enable row level security;
alter table public.pantry_items enable row level security;

grant select, insert, update, delete on public.shopping_lists to authenticated;
grant select, insert, update, delete on public.shopping_categories to authenticated;
grant select, insert, update, delete on public.shopping_items to authenticated;
grant select, insert, update, delete on public.pantry_items to authenticated;

drop policy if exists "shopping_lists_select" on public.shopping_lists;
create policy "shopping_lists_select"
on public.shopping_lists
for select
to authenticated
using (
  exists (
    select 1 from public.household_members hm
    where hm.household_id = shopping_lists.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  )
  and (
    shopping_lists.visibility in ('household', 'shared')
    or shopping_lists.owner_user_id = auth.uid()
  )
);

drop policy if exists "shopping_lists_insert" on public.shopping_lists;
create policy "shopping_lists_insert"
on public.shopping_lists
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and user_id = auth.uid()
  and exists (
    select 1 from public.household_members hm
    where hm.household_id = shopping_lists.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        shopping_lists.visibility = 'personal'
        or hm.role in ('owner', 'adult')
      )
  )
);

drop policy if exists "shopping_lists_update" on public.shopping_lists;
create policy "shopping_lists_update"
on public.shopping_lists
for update
to authenticated
using (
  (owner_user_id = auth.uid() and visibility = 'personal')
  or exists (
    select 1 from public.household_members hm
    where hm.household_id = shopping_lists.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role in ('owner', 'adult')
      and shopping_lists.visibility in ('household', 'shared')
  )
)
with check (
  (owner_user_id = auth.uid() and visibility = 'personal')
  or exists (
    select 1 from public.household_members hm
    where hm.household_id = shopping_lists.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role in ('owner', 'adult')
      and shopping_lists.visibility in ('household', 'shared')
  )
);

drop policy if exists "shopping_lists_delete" on public.shopping_lists;
create policy "shopping_lists_delete"
on public.shopping_lists
for delete
to authenticated
using (
  (owner_user_id = auth.uid() and visibility = 'personal')
  or exists (
    select 1 from public.household_members hm
    where hm.household_id = shopping_lists.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role in ('owner', 'adult')
      and shopping_lists.visibility in ('household', 'shared')
  )
);

drop policy if exists "shopping_categories_member_all" on public.shopping_categories;
create policy "shopping_categories_member_all"
on public.shopping_categories
for all
to authenticated
using (public.familyos_has_household_role(household_id, array['owner', 'adult']))
with check (
  user_id = auth.uid()
  and public.familyos_has_household_role(household_id, array['owner', 'adult'])
);

drop policy if exists "shopping_categories_member_select" on public.shopping_categories;
create policy "shopping_categories_member_select"
on public.shopping_categories
for select
to authenticated
using (
  exists (
    select 1 from public.household_members hm
    where hm.household_id = shopping_categories.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  )
);

drop policy if exists "pantry_items_member_select" on public.pantry_items;
create policy "pantry_items_member_select"
on public.pantry_items
for select
to authenticated
using (
  exists (
    select 1 from public.household_members hm
    where hm.household_id = pantry_items.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  )
);

drop policy if exists "pantry_items_manager_all" on public.pantry_items;
create policy "pantry_items_manager_all"
on public.pantry_items
for all
to authenticated
using (public.familyos_has_household_role(household_id, array['owner', 'adult']))
with check (
  user_id = auth.uid()
  and public.familyos_has_household_role(household_id, array['owner', 'adult'])
);

drop policy if exists "shopping_items_select" on public.shopping_items;
create policy "shopping_items_select"
on public.shopping_items
for select
to authenticated
using (
  exists (
    select 1
    from public.shopping_lists sl
    join public.household_members hm on hm.household_id = sl.household_id
    where sl.id = shopping_items.list_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        sl.visibility in ('household', 'shared')
        or sl.owner_user_id = auth.uid()
      )
  )
);

drop policy if exists "shopping_items_insert" on public.shopping_items;
create policy "shopping_items_insert"
on public.shopping_items
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.shopping_lists sl
    join public.household_members hm on hm.household_id = sl.household_id
    where sl.id = shopping_items.list_id
      and sl.household_id = shopping_items.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        (sl.owner_user_id = auth.uid() and sl.visibility = 'personal')
        or (sl.visibility in ('household', 'shared') and hm.role in ('owner', 'adult'))
      )
  )
);

drop policy if exists "shopping_items_update" on public.shopping_items;
create policy "shopping_items_update"
on public.shopping_items
for update
to authenticated
using (
  exists (
    select 1
    from public.shopping_lists sl
    join public.household_members hm on hm.household_id = sl.household_id
    where sl.id = shopping_items.list_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        (sl.owner_user_id = auth.uid() and sl.visibility = 'personal')
        or (sl.visibility in ('household', 'shared') and hm.role in ('owner', 'adult'))
      )
  )
)
with check (
  exists (
    select 1
    from public.shopping_lists sl
    join public.household_members hm on hm.household_id = sl.household_id
    where sl.id = shopping_items.list_id
      and sl.household_id = shopping_items.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        (sl.owner_user_id = auth.uid() and sl.visibility = 'personal')
        or (sl.visibility in ('household', 'shared') and hm.role in ('owner', 'adult'))
      )
  )
);

drop policy if exists "shopping_items_delete" on public.shopping_items;
create policy "shopping_items_delete"
on public.shopping_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.shopping_lists sl
    join public.household_members hm on hm.household_id = sl.household_id
    where sl.id = shopping_items.list_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        (sl.owner_user_id = auth.uid() and sl.visibility = 'personal')
        or (sl.visibility in ('household', 'shared') and hm.role in ('owner', 'adult'))
      )
  )
);
