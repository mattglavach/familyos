begin;

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(), name text not null check (length(trim(name)) > 0),
  category text not null default 'Other' check (category in ('Spouse','Child','Parent','Family','Friend','Coworker','Mentor','Neighbor','Other')),
  birthday date, favorite_things text not null default '', interests text[] not null default '{}', conversation_topics text[] not null default '{}',
  activity_ideas text[] not null default '{}', notes text not null default '', last_conversation date, last_one_on_one_activity date, last_contact_date date,
  priority text not null default 'Medium' check (priority in ('High','Medium','Low')), status text not null default 'Active' check (status in ('Active','Archived')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.relationship_goals (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(), relationship_id uuid not null references public.relationships(id) on delete cascade,
  title text not null check (length(trim(title)) > 0), target_date date, status text not null default 'active' check (status in ('active','completed','archived')),
  completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.relationship_activities (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(), relationship_id uuid not null references public.relationships(id) on delete cascade,
  activity_type text not null check (activity_type in ('Conversation','Phone Call','Date Night','One-on-One','Family Activity','Meal Together','Visit','Custom')),
  title text not null check (length(trim(title)) > 0), notes text not null default '', status text not null default 'completed' check (status in ('planned','completed','cancelled')),
  occurred_at timestamptz, planned_for timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((status = 'completed' and occurred_at is not null) or (status <> 'completed')),
  check ((status = 'planned' and planned_for is not null) or (status <> 'planned'))
);

create index if not exists relationships_household_status_priority_idx on public.relationships(household_id,status,priority);
create index if not exists relationships_household_birthday_idx on public.relationships(household_id,birthday) where birthday is not null;
create index if not exists relationships_name_trgm_idx on public.relationships using gin(name extensions.gin_trgm_ops);
create index if not exists relationships_interests_idx on public.relationships using gin(interests);
create index if not exists relationships_conversation_topics_idx on public.relationships using gin(conversation_topics);
create index if not exists relationships_activity_ideas_idx on public.relationships using gin(activity_ideas);
create index if not exists relationship_goals_relationship_status_idx on public.relationship_goals(relationship_id,status);
create index if not exists relationship_activities_relationship_occurred_idx on public.relationship_activities(relationship_id,occurred_at desc);
create index if not exists relationship_activities_household_planned_idx on public.relationship_activities(household_id,planned_for) where status = 'planned';

drop trigger if exists relationships_set_updated_at on public.relationships;
create trigger relationships_set_updated_at before update on public.relationships for each row execute function public.familyos_set_updated_at();
drop trigger if exists relationship_goals_set_updated_at on public.relationship_goals;
create trigger relationship_goals_set_updated_at before update on public.relationship_goals for each row execute function public.familyos_set_updated_at();
drop trigger if exists relationship_activities_set_updated_at on public.relationship_activities;
create trigger relationship_activities_set_updated_at before update on public.relationship_activities for each row execute function public.familyos_set_updated_at();

alter table public.relationships enable row level security;
alter table public.relationship_goals enable row level security;
alter table public.relationship_activities enable row level security;
grant select,insert,update,delete on public.relationships,public.relationship_goals,public.relationship_activities to authenticated;
drop policy if exists relationships_member_select on public.relationships;
create policy relationships_member_select on public.relationships for select to authenticated using (public.familyos_is_household_member(household_id));
drop policy if exists relationships_manager_all on public.relationships;
create policy relationships_manager_all on public.relationships for all to authenticated using (public.familyos_has_household_role(household_id,array['owner','adult'])) with check (user_id=auth.uid() and public.familyos_has_household_role(household_id,array['owner','adult']));
drop policy if exists relationship_goals_member_select on public.relationship_goals;
create policy relationship_goals_member_select on public.relationship_goals for select to authenticated using (public.familyos_is_household_member(household_id));
drop policy if exists relationship_goals_manager_all on public.relationship_goals;
create policy relationship_goals_manager_all on public.relationship_goals for all to authenticated using (public.familyos_has_household_role(household_id,array['owner','adult'])) with check (user_id=auth.uid() and public.familyos_has_household_role(household_id,array['owner','adult']) and exists (select 1 from public.relationships r where r.id=relationship_id and r.household_id=relationship_goals.household_id));
drop policy if exists relationship_activities_member_select on public.relationship_activities;
create policy relationship_activities_member_select on public.relationship_activities for select to authenticated using (public.familyos_is_household_member(household_id));
drop policy if exists relationship_activities_manager_all on public.relationship_activities;
create policy relationship_activities_manager_all on public.relationship_activities for all to authenticated using (public.familyos_has_household_role(household_id,array['owner','adult'])) with check (user_id=auth.uid() and public.familyos_has_household_role(household_id,array['owner','adult']) and exists (select 1 from public.relationships r where r.id=relationship_id and r.household_id=relationship_activities.household_id));

commit;
