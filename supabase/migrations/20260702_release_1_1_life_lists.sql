create extension if not exists "pgcrypto";

create or replace function public.familyos_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.life_lists (
  id text primary key default gen_random_uuid()::text,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  owner_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null,
  description text not null default '',
  visibility text not null default 'household',
  color text,
  icon text,
  favorite boolean not null default false,
  archived boolean not null default false,
  category text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint life_lists_name_not_blank_check check (length(trim(name)) > 0),
  constraint life_lists_visibility_check check (visibility in ('personal', 'household', 'shared'))
);

create table if not exists public.life_list_items (
  id text primary key default gen_random_uuid()::text,
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  list_id text not null references public.life_lists(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority text not null default 'med',
  status text not null default 'planned',
  favorite boolean not null default false,
  assigned_to_person_id uuid references public.people(id) on delete set null,
  tags text[] not null default '{}',
  link_url text not null default '',
  image_url text not null default '',
  completed_at timestamptz,
  archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint life_list_items_title_not_blank_check check (length(trim(title)) > 0),
  constraint life_list_items_priority_check check (priority in ('low', 'med', 'high')),
  constraint life_list_items_status_check check (status in ('planned', 'in_progress', 'completed', 'someday', 'deferred', 'archived'))
);

create index if not exists life_lists_household_id_idx on public.life_lists(household_id);
create index if not exists life_lists_owner_user_id_idx on public.life_lists(owner_user_id);
create index if not exists life_lists_visibility_idx on public.life_lists(visibility);
create index if not exists life_lists_updated_at_idx on public.life_lists(updated_at desc);
create index if not exists life_list_items_household_id_idx on public.life_list_items(household_id);
create index if not exists life_list_items_list_id_idx on public.life_list_items(list_id);
create index if not exists life_list_items_status_idx on public.life_list_items(status);
create index if not exists life_list_items_updated_at_idx on public.life_list_items(updated_at desc);
create index if not exists life_list_items_tags_idx on public.life_list_items using gin(tags);

drop trigger if exists life_lists_set_updated_at on public.life_lists;
create trigger life_lists_set_updated_at
before update on public.life_lists
for each row execute function public.familyos_set_updated_at();

drop trigger if exists life_list_items_set_updated_at on public.life_list_items;
create trigger life_list_items_set_updated_at
before update on public.life_list_items
for each row execute function public.familyos_set_updated_at();

alter table public.life_lists enable row level security;
alter table public.life_list_items enable row level security;

grant select, insert, update, delete on public.life_lists to authenticated;
grant select, insert, update, delete on public.life_list_items to authenticated;

drop policy if exists "life_lists_select" on public.life_lists;
create policy "life_lists_select"
on public.life_lists
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = life_lists.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
  )
  and (
    life_lists.visibility in ('household', 'shared')
    or life_lists.owner_user_id = auth.uid()
  )
);

drop policy if exists "life_lists_insert" on public.life_lists;
create policy "life_lists_insert"
on public.life_lists
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and user_id = auth.uid()
  and exists (
    select 1
    from public.household_members hm
    where hm.household_id = life_lists.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        life_lists.visibility = 'personal'
        or hm.role in ('owner', 'adult')
      )
  )
);

drop policy if exists "life_lists_update" on public.life_lists;
create policy "life_lists_update"
on public.life_lists
for update
to authenticated
using (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.household_members hm
    where hm.household_id = life_lists.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role in ('owner', 'adult')
      and life_lists.visibility in ('household', 'shared')
  )
)
with check (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.household_members hm
    where hm.household_id = life_lists.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role in ('owner', 'adult')
      and life_lists.visibility in ('household', 'shared')
  )
);

drop policy if exists "life_lists_delete" on public.life_lists;
create policy "life_lists_delete"
on public.life_lists
for delete
to authenticated
using (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.household_members hm
    where hm.household_id = life_lists.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and hm.role in ('owner', 'adult')
      and life_lists.visibility in ('household', 'shared')
  )
);

drop policy if exists "life_list_items_select" on public.life_list_items;
create policy "life_list_items_select"
on public.life_list_items
for select
to authenticated
using (
  exists (
    select 1
    from public.life_lists ll
    join public.household_members hm on hm.household_id = ll.household_id
    where ll.id = life_list_items.list_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        ll.visibility in ('household', 'shared')
        or ll.owner_user_id = auth.uid()
      )
  )
);

drop policy if exists "life_list_items_insert" on public.life_list_items;
create policy "life_list_items_insert"
on public.life_list_items
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.life_lists ll
    join public.household_members hm on hm.household_id = ll.household_id
    where ll.id = life_list_items.list_id
      and ll.household_id = life_list_items.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        ll.owner_user_id = auth.uid()
        or (ll.visibility in ('household', 'shared') and hm.role in ('owner', 'adult'))
      )
  )
);

drop policy if exists "life_list_items_update" on public.life_list_items;
create policy "life_list_items_update"
on public.life_list_items
for update
to authenticated
using (
  exists (
    select 1
    from public.life_lists ll
    join public.household_members hm on hm.household_id = ll.household_id
    where ll.id = life_list_items.list_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        ll.owner_user_id = auth.uid()
        or (ll.visibility in ('household', 'shared') and hm.role in ('owner', 'adult'))
      )
  )
)
with check (
  exists (
    select 1
    from public.life_lists ll
    join public.household_members hm on hm.household_id = ll.household_id
    where ll.id = life_list_items.list_id
      and ll.household_id = life_list_items.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        ll.owner_user_id = auth.uid()
        or (ll.visibility in ('household', 'shared') and hm.role in ('owner', 'adult'))
      )
  )
);

drop policy if exists "life_list_items_delete" on public.life_list_items;
create policy "life_list_items_delete"
on public.life_list_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.life_lists ll
    join public.household_members hm on hm.household_id = ll.household_id
    where ll.id = life_list_items.list_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (
        ll.owner_user_id = auth.uid()
        or (ll.visibility in ('household', 'shared') and hm.role in ('owner', 'adult'))
      )
  )
);
