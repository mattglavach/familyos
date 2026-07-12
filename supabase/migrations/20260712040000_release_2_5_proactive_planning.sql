begin;

create table if not exists public.brief_schedules (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(), brief_type text not null check (brief_type in ('morning','evening','weekly')),
  enabled boolean not null default true, preferred_time time not null, active_days smallint[] not null default '{0,1,2,3,4,5,6}',
  timezone text not null default 'America/New_York', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(household_id,user_id,brief_type), check(active_days <@ array[0,1,2,3,4,5,6]::smallint[])
);
create table if not exists public.brief_generation_history (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(), brief_type text not null check (brief_type in ('morning','evening','weekly')),
  period_key text not null, trigger_type text not null default 'scheduled' check(trigger_type in ('scheduled','manual','refresh')),
  status text not null default 'generated' check(status in ('generated','skipped_empty','failed')), generated_at timestamptz not null default now(),
  context_summary jsonb not null default '{}'::jsonb, prompt_text text not null default '', created_at timestamptz not null default now()
);
create unique index if not exists brief_generation_scheduled_period_unique on public.brief_generation_history(household_id,user_id,brief_type,period_key) where trigger_type='scheduled' and status='generated';
create index if not exists brief_generation_household_recent_idx on public.brief_generation_history(household_id,user_id,generated_at desc);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(), enabled_categories jsonb not null default '{"tasks":true,"calendar":true,"habits":true,"routines":true,"briefs":true,"home":true,"pool":true}'::jsonb,
  quiet_hours_start time not null default '21:00', quiet_hours_end time not null default '07:00', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(household_id,user_id)
);

create table if not exists public.routine_templates (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(), template_key text, title text not null, description text not null default '',
  estimated_minutes integer check(estimated_minutes is null or estimated_minutes > 0), recurrence_guidance text not null default 'once', built_in boolean not null default false,
  archived boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(household_id,template_key)
);
create table if not exists public.routine_template_steps (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  template_id uuid not null references public.routine_templates(id) on delete cascade, title text not null, optional boolean not null default false,
  sort_order integer not null default 0, created_at timestamptz not null default now()
);
create index if not exists routine_templates_household_active_idx on public.routine_templates(household_id,archived,built_in);
create index if not exists routine_template_steps_order_idx on public.routine_template_steps(template_id,sort_order);

alter table public.brief_schedules enable row level security; alter table public.brief_generation_history enable row level security;
alter table public.notification_preferences enable row level security; alter table public.routine_templates enable row level security; alter table public.routine_template_steps enable row level security;
grant select,insert,update,delete on public.brief_schedules,public.brief_generation_history,public.notification_preferences,public.routine_templates,public.routine_template_steps to authenticated;

do $$ declare t text; begin foreach t in array array['brief_schedules','brief_generation_history','notification_preferences'] loop
 execute format('drop policy if exists %I on public.%I',t||'_own_all',t);
 execute format('create policy %I on public.%I for all to authenticated using(user_id=auth.uid() and exists(select 1 from public.household_members hm where hm.household_id=%I.household_id and hm.user_id=auth.uid() and hm.status=''active'')) with check(user_id=auth.uid() and exists(select 1 from public.household_members hm where hm.household_id=%I.household_id and hm.user_id=auth.uid() and hm.status=''active''))',t||'_own_all',t,t,t);
end loop; end $$;

drop policy if exists routine_templates_member_select on public.routine_templates;
create policy routine_templates_member_select on public.routine_templates for select to authenticated using(exists(select 1 from public.household_members hm where hm.household_id=routine_templates.household_id and hm.user_id=auth.uid() and hm.status='active'));
drop policy if exists routine_templates_manager_all on public.routine_templates;
create policy routine_templates_manager_all on public.routine_templates for all to authenticated using(not built_in and public.familyos_has_household_role(household_id,array['owner','adult'])) with check(not built_in and user_id=auth.uid() and public.familyos_has_household_role(household_id,array['owner','adult']));
drop policy if exists routine_template_steps_member_select on public.routine_template_steps;
create policy routine_template_steps_member_select on public.routine_template_steps for select to authenticated using(exists(select 1 from public.household_members hm where hm.household_id=routine_template_steps.household_id and hm.user_id=auth.uid() and hm.status='active'));
drop policy if exists routine_template_steps_manager_all on public.routine_template_steps;
create policy routine_template_steps_manager_all on public.routine_template_steps for all to authenticated using(public.familyos_has_household_role(household_id,array['owner','adult']) and exists(select 1 from public.routine_templates rt where rt.id=template_id and not rt.built_in)) with check(public.familyos_has_household_role(household_id,array['owner','adult']) and exists(select 1 from public.routine_templates rt where rt.id=template_id and not rt.built_in));

commit;
