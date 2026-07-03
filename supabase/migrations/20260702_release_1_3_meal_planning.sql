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

create table if not exists public.meal_plans (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  owner_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null,
  description text not null default '',
  plan_type text not null default 'weekly',
  start_date date,
  end_date date,
  visibility text not null default 'household',
  favorite boolean not null default false,
  archived boolean not null default false,
  notes text not null default '',
  sort_order integer not null default 0,
  nutrition_ref text,
  health_ref text,
  ai_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plans_name_not_blank_check check (length(trim(name)) > 0),
  constraint meal_plans_type_check check (plan_type in ('weekly', 'monthly', 'custom')),
  constraint meal_plans_visibility_check check (visibility in ('personal', 'household', 'shared'))
);

create table if not exists public.recipe_categories (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  name text not null,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_categories_name_not_blank_check check (length(trim(name)) > 0)
);

create table if not exists public.recipes (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  owner_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  title text not null,
  description text not null default '',
  category text not null default '',
  meal_type text not null default 'dinner',
  prep_time_minutes integer not null default 0,
  cook_time_minutes integer not null default 0,
  servings numeric not null default 0,
  difficulty text not null default 'easy',
  instructions text not null default '',
  notes text not null default '',
  favorite boolean not null default false,
  image_url text not null default '',
  source_url text not null default '',
  tags text[] not null default '{}',
  visibility text not null default 'household',
  archived boolean not null default false,
  sort_order integer not null default 0,
  nutrition_ref text,
  health_ref text,
  ai_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipes_title_not_blank_check check (length(trim(title)) > 0),
  constraint recipes_meal_type_check check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  constraint recipes_difficulty_check check (difficulty in ('easy', 'medium', 'hard')),
  constraint recipes_visibility_check check (visibility in ('personal', 'household', 'shared')),
  constraint recipes_prep_time_check check (prep_time_minutes >= 0),
  constraint recipes_cook_time_check check (cook_time_minutes >= 0),
  constraint recipes_servings_check check (servings >= 0)
);

create table if not exists public.recipe_ingredients (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  recipe_id text not null references public.recipes(id) on delete cascade,
  ingredient text not null,
  quantity numeric not null default 1,
  unit text not null default '',
  optional boolean not null default false,
  pantry_item_id text references public.pantry_items(id) on delete set null,
  shopping_item_id text references public.shopping_items(id) on delete set null,
  notes text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipe_ingredients_name_not_blank_check check (length(trim(ingredient)) > 0),
  constraint recipe_ingredients_quantity_check check (quantity >= 0)
);

create table if not exists public.meal_assignments (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  meal_plan_id text not null references public.meal_plans(id) on delete cascade,
  recipe_id text references public.recipes(id) on delete set null,
  meal_date date not null,
  meal_type text not null default 'dinner',
  title text not null default '',
  notes text not null default '',
  favorite boolean not null default false,
  archived boolean not null default false,
  shopping_list_id text references public.shopping_lists(id) on delete set null,
  nutrition_ref text,
  health_ref text,
  ai_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_assignments_type_check check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  constraint meal_assignments_content_check check (recipe_id is not null or length(trim(title)) > 0)
);

create index if not exists meal_plans_household_id_idx on public.meal_plans(household_id);
create index if not exists meal_plans_owner_user_id_idx on public.meal_plans(owner_user_id);
create index if not exists meal_plans_visibility_idx on public.meal_plans(visibility);
create index if not exists meal_plans_updated_at_idx on public.meal_plans(updated_at desc);
create index if not exists recipe_categories_household_id_idx on public.recipe_categories(household_id);
create index if not exists recipes_household_id_idx on public.recipes(household_id);
create index if not exists recipes_owner_user_id_idx on public.recipes(owner_user_id);
create index if not exists recipes_visibility_idx on public.recipes(visibility);
create index if not exists recipes_meal_type_idx on public.recipes(meal_type);
create index if not exists recipes_category_idx on public.recipes(category);
create index if not exists recipes_tags_idx on public.recipes using gin(tags);
create index if not exists recipes_updated_at_idx on public.recipes(updated_at desc);
create index if not exists recipe_ingredients_recipe_id_idx on public.recipe_ingredients(recipe_id);
create index if not exists recipe_ingredients_pantry_item_id_idx on public.recipe_ingredients(pantry_item_id);
create index if not exists recipe_ingredients_shopping_item_id_idx on public.recipe_ingredients(shopping_item_id);
create index if not exists meal_assignments_household_id_idx on public.meal_assignments(household_id);
create index if not exists meal_assignments_plan_date_idx on public.meal_assignments(meal_plan_id, meal_date);
create index if not exists meal_assignments_recipe_id_idx on public.meal_assignments(recipe_id);
create index if not exists meal_assignments_shopping_list_id_idx on public.meal_assignments(shopping_list_id);

drop trigger if exists meal_plans_set_updated_at on public.meal_plans;
create trigger meal_plans_set_updated_at before update on public.meal_plans for each row execute function public.familyos_set_updated_at();
drop trigger if exists recipe_categories_set_updated_at on public.recipe_categories;
create trigger recipe_categories_set_updated_at before update on public.recipe_categories for each row execute function public.familyos_set_updated_at();
drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at before update on public.recipes for each row execute function public.familyos_set_updated_at();
drop trigger if exists recipe_ingredients_set_updated_at on public.recipe_ingredients;
create trigger recipe_ingredients_set_updated_at before update on public.recipe_ingredients for each row execute function public.familyos_set_updated_at();
drop trigger if exists meal_assignments_set_updated_at on public.meal_assignments;
create trigger meal_assignments_set_updated_at before update on public.meal_assignments for each row execute function public.familyos_set_updated_at();

alter table public.meal_plans enable row level security;
alter table public.recipe_categories enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.meal_assignments enable row level security;

grant select, insert, update, delete on public.meal_plans to authenticated;
grant select, insert, update, delete on public.recipe_categories to authenticated;
grant select, insert, update, delete on public.recipes to authenticated;
grant select, insert, update, delete on public.recipe_ingredients to authenticated;
grant select, insert, update, delete on public.meal_assignments to authenticated;

drop policy if exists "meal_plans_select" on public.meal_plans;
create policy "meal_plans_select" on public.meal_plans for select to authenticated using (
  exists (select 1 from public.household_members hm where hm.household_id = meal_plans.household_id and hm.user_id = auth.uid() and hm.status = 'active')
  and (meal_plans.visibility in ('household', 'shared') or meal_plans.owner_user_id = auth.uid())
);
drop policy if exists "meal_plans_insert" on public.meal_plans;
create policy "meal_plans_insert" on public.meal_plans for insert to authenticated with check (
  owner_user_id = auth.uid() and user_id = auth.uid()
  and exists (
    select 1 from public.household_members hm
    where hm.household_id = meal_plans.household_id and hm.user_id = auth.uid() and hm.status = 'active'
      and (meal_plans.visibility = 'personal' or hm.role in ('owner', 'adult'))
  )
);
drop policy if exists "meal_plans_update" on public.meal_plans;
create policy "meal_plans_update" on public.meal_plans for update to authenticated using (
  (owner_user_id = auth.uid() and visibility = 'personal')
  or public.familyos_has_household_role(household_id, array['owner', 'adult']) and visibility in ('household', 'shared')
) with check (
  (owner_user_id = auth.uid() and visibility = 'personal')
  or public.familyos_has_household_role(household_id, array['owner', 'adult']) and visibility in ('household', 'shared')
);
drop policy if exists "meal_plans_delete" on public.meal_plans;
create policy "meal_plans_delete" on public.meal_plans for delete to authenticated using (
  (owner_user_id = auth.uid() and visibility = 'personal')
  or public.familyos_has_household_role(household_id, array['owner', 'adult']) and visibility in ('household', 'shared')
);

drop policy if exists "recipe_categories_member_select" on public.recipe_categories;
create policy "recipe_categories_member_select" on public.recipe_categories for select to authenticated using (
  exists (select 1 from public.household_members hm where hm.household_id = recipe_categories.household_id and hm.user_id = auth.uid() and hm.status = 'active')
);
drop policy if exists "recipe_categories_manager_all" on public.recipe_categories;
create policy "recipe_categories_manager_all" on public.recipe_categories for all to authenticated
using (public.familyos_has_household_role(household_id, array['owner', 'adult']))
with check (user_id = auth.uid() and public.familyos_has_household_role(household_id, array['owner', 'adult']));

drop policy if exists "recipes_select" on public.recipes;
create policy "recipes_select" on public.recipes for select to authenticated using (
  exists (select 1 from public.household_members hm where hm.household_id = recipes.household_id and hm.user_id = auth.uid() and hm.status = 'active')
  and (recipes.visibility in ('household', 'shared') or recipes.owner_user_id = auth.uid())
);
drop policy if exists "recipes_insert" on public.recipes;
create policy "recipes_insert" on public.recipes for insert to authenticated with check (
  owner_user_id = auth.uid() and user_id = auth.uid()
  and exists (
    select 1 from public.household_members hm
    where hm.household_id = recipes.household_id and hm.user_id = auth.uid() and hm.status = 'active'
      and (recipes.visibility = 'personal' or hm.role in ('owner', 'adult'))
  )
);
drop policy if exists "recipes_update" on public.recipes;
create policy "recipes_update" on public.recipes for update to authenticated using (
  (owner_user_id = auth.uid() and visibility = 'personal')
  or public.familyos_has_household_role(household_id, array['owner', 'adult']) and visibility in ('household', 'shared')
) with check (
  (owner_user_id = auth.uid() and visibility = 'personal')
  or public.familyos_has_household_role(household_id, array['owner', 'adult']) and visibility in ('household', 'shared')
);
drop policy if exists "recipes_delete" on public.recipes;
create policy "recipes_delete" on public.recipes for delete to authenticated using (
  (owner_user_id = auth.uid() and visibility = 'personal')
  or public.familyos_has_household_role(household_id, array['owner', 'adult']) and visibility in ('household', 'shared')
);

drop policy if exists "recipe_ingredients_select" on public.recipe_ingredients;
create policy "recipe_ingredients_select" on public.recipe_ingredients for select to authenticated using (
  exists (
    select 1
    from public.recipes r
    join public.household_members hm on hm.household_id = r.household_id
    where r.id = recipe_ingredients.recipe_id
      and r.household_id = recipe_ingredients.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (r.visibility in ('household', 'shared') or r.owner_user_id = auth.uid())
  )
);
drop policy if exists "recipe_ingredients_mutate" on public.recipe_ingredients;
create policy "recipe_ingredients_mutate" on public.recipe_ingredients for all to authenticated using (
  exists (select 1 from public.recipes r where r.id = recipe_ingredients.recipe_id and ((r.owner_user_id = auth.uid() and r.visibility = 'personal') or (r.visibility in ('household', 'shared') and public.familyos_has_household_role(r.household_id, array['owner', 'adult']))))
) with check (
  user_id = auth.uid()
  and exists (select 1 from public.recipes r where r.id = recipe_ingredients.recipe_id and r.household_id = recipe_ingredients.household_id and ((r.owner_user_id = auth.uid() and r.visibility = 'personal') or (r.visibility in ('household', 'shared') and public.familyos_has_household_role(r.household_id, array['owner', 'adult']))))
);

drop policy if exists "meal_assignments_select" on public.meal_assignments;
create policy "meal_assignments_select" on public.meal_assignments for select to authenticated using (
  exists (
    select 1
    from public.meal_plans mp
    join public.household_members hm on hm.household_id = mp.household_id
    where mp.id = meal_assignments.meal_plan_id
      and mp.household_id = meal_assignments.household_id
      and hm.user_id = auth.uid()
      and hm.status = 'active'
      and (mp.visibility in ('household', 'shared') or mp.owner_user_id = auth.uid())
  )
);
drop policy if exists "meal_assignments_mutate" on public.meal_assignments;
create policy "meal_assignments_mutate" on public.meal_assignments for all to authenticated using (
  exists (select 1 from public.meal_plans mp where mp.id = meal_assignments.meal_plan_id and ((mp.owner_user_id = auth.uid() and mp.visibility = 'personal') or (mp.visibility in ('household', 'shared') and public.familyos_has_household_role(mp.household_id, array['owner', 'adult']))))
) with check (
  user_id = auth.uid()
  and exists (select 1 from public.meal_plans mp where mp.id = meal_assignments.meal_plan_id and mp.household_id = meal_assignments.household_id and ((mp.owner_user_id = auth.uid() and mp.visibility = 'personal') or (mp.visibility in ('household', 'shared') and public.familyos_has_household_role(mp.household_id, array['owner', 'adult']))))
);
