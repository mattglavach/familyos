begin;

alter table public.tasks add column if not exists archived boolean not null default false;
alter table public.tasks add column if not exists deleted_at timestamptz;
create index if not exists tasks_household_assignee_open_idx on public.tasks(household_id, assigned_person_id, completed, due_date) where archived = false and deleted_at is null;

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(), owner_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  assigned_person_id uuid references public.people(id) on delete set null, name text not null, description text not null default '',
  frequency text not null default 'daily' check (frequency in ('daily','weekly','monthly')), active_days smallint[] not null default '{}',
  reminder_time time, start_date date not null default current_date, status text not null default 'active' check (status in ('active','paused','archived')),
  visibility text not null default 'household' check (visibility in ('personal','household')), archived boolean not null default false,
  important boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.habit_completions (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade, user_id uuid references auth.users(id) on delete set null default auth.uid(),
  period_key text not null, status text not null default 'completed' check (status in ('completed','skipped')),
  completed_at timestamptz not null default now(), unique(habit_id, period_key)
);
create index if not exists habits_household_active_idx on public.habits(household_id, archived, frequency);
create index if not exists habit_completions_household_period_idx on public.habit_completions(household_id, period_key);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(), owner_user_id uuid references auth.users(id) on delete set null default auth.uid(),
  assigned_person_id uuid references public.people(id) on delete set null, name text not null, description text not null default '',
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0), recurrence text not null default 'once' check (recurrence in ('once','daily','weekly')),
  visibility text not null default 'household' check (visibility in ('personal','household')), archived boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.routine_steps (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade, title text not null, optional boolean not null default false,
  sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.routine_completions (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  routine_id uuid not null references public.routines(id) on delete cascade, user_id uuid references auth.users(id) on delete set null default auth.uid(),
  period_key text not null, completed_step_ids uuid[] not null default '{}', completed_at timestamptz, created_at timestamptz not null default now(),
  unique(routine_id, period_key)
);
create index if not exists routines_household_active_idx on public.routines(household_id, archived, recurrence);

create table if not exists public.notification_states (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(), source_key text not null,
  read_at timestamptz, dismissed_at timestamptz, snoozed_until timestamptz, source_version text not null default '1', updated_at timestamptz not null default now(),
  unique(user_id, household_id, source_key)
);
create index if not exists notification_states_user_household_idx on public.notification_states(user_id, household_id, updated_at desc);

create table if not exists public.pool_maintenance_history (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  -- Historical production environments may use uuid or text schedule identifiers.
  -- Store the stable textual value without a cross-type foreign key.
  schedule_id text, maintenance_item text not null, prior_due_date date,
  completed_at timestamptz not null default now(), completed_by uuid references auth.users(id) on delete set null, notes text not null default '',
  idempotency_key text not null unique, created_at timestamptz not null default now()
);
create index if not exists pool_maintenance_history_household_completed_idx on public.pool_maintenance_history(household_id, completed_at desc);

create or replace function public.complete_pool_maintenance(p_schedule_id text, p_notes text default null, p_idempotency_key text default null)
returns public.pool_maintenance_history language plpgsql security definer set search_path = public, pg_temp as $$
declare v_schedule public.pool_schedule; v_history public.pool_maintenance_history; v_key text; v_completed timestamptz := now(); v_next date;
begin
  select * into v_schedule from public.pool_schedule where id::text = p_schedule_id for update;
  if v_schedule.id is null or not public.familyos_has_household_role(v_schedule.household_id, array['owner','adult']) then raise exception 'Maintenance item is unavailable.'; end if;
  v_key := coalesce(nullif(p_idempotency_key,''), p_schedule_id::text || ':' || v_completed::date::text);
  select * into v_history from public.pool_maintenance_history where idempotency_key = v_key;
  if v_history.id is not null then return v_history; end if;
  v_next := v_completed::date + greatest(coalesce(v_schedule.interval_days, 1), 1);
  insert into public.pool_maintenance_history(household_id,schedule_id,maintenance_item,prior_due_date,completed_at,completed_by,notes,idempotency_key)
  values(v_schedule.household_id,v_schedule.id::text,coalesce(v_schedule.title,v_schedule.maintenance_type,'Pool maintenance'),v_schedule.last_completed + greatest(coalesce(v_schedule.interval_days,1),1),v_completed,auth.uid(),coalesce(p_notes,''),v_key) returning * into v_history;
  update public.pool_schedule set last_completed=v_completed::date, updated_at=v_completed where id=v_schedule.id;
  return v_history;
end $$;
grant execute on function public.complete_pool_maintenance(text,text,text) to authenticated;

alter table public.habits enable row level security; alter table public.habit_completions enable row level security;
alter table public.routines enable row level security; alter table public.routine_steps enable row level security; alter table public.routine_completions enable row level security;
alter table public.notification_states enable row level security; alter table public.pool_maintenance_history enable row level security;
grant select,insert,update,delete on public.habits,public.habit_completions,public.routines,public.routine_steps,public.routine_completions,public.notification_states to authenticated;
grant select on public.pool_maintenance_history to authenticated;

do $$ declare t text; begin foreach t in array array['habits','habit_completions','routines','routine_steps','routine_completions','pool_maintenance_history'] loop
  execute format('drop policy if exists %I on public.%I', t||'_member_select', t);
  execute format('create policy %I on public.%I for select to authenticated using (exists (select 1 from public.household_members hm where hm.household_id = %I.household_id and hm.user_id = auth.uid() and hm.status = ''active''))', t||'_member_select', t, t);
  if t <> 'pool_maintenance_history' then
    execute format('drop policy if exists %I on public.%I', t||'_manager_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.familyos_has_household_role(household_id,array[''owner'',''adult''])) with check (public.familyos_has_household_role(household_id,array[''owner'',''adult'']))', t||'_manager_all', t);
  end if;
end loop; end $$;
drop policy if exists notification_states_own_all on public.notification_states;
create policy notification_states_own_all on public.notification_states for all to authenticated using(user_id=auth.uid() and exists(select 1 from public.household_members hm where hm.household_id=notification_states.household_id and hm.user_id=auth.uid() and hm.status='active')) with check(user_id=auth.uid() and exists(select 1 from public.household_members hm where hm.household_id=notification_states.household_id and hm.user_id=auth.uid() and hm.status='active'));

commit;
