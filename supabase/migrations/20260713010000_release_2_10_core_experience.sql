begin;

alter table public.habits add column if not exists category text not null default 'Other';
alter table public.habit_actions add column if not exists description text not null default '';
alter table public.habit_actions add column if not exists updated_at timestamptz not null default now();
alter table public.routines add column if not exists category text not null default 'Other';
alter table public.routine_steps add column if not exists description text not null default '';
alter table public.routine_steps add column if not exists active boolean not null default true;
alter table public.routine_steps add column if not exists updated_at timestamptz not null default now();
alter table public.routine_completions add column if not exists status text not null default 'in_progress';
update public.routine_completions set status = 'completed' where completed_at is not null and status = 'in_progress';

alter table public.habit_completions drop constraint if exists habit_completions_status_check;
alter table public.habit_completions add constraint habit_completions_status_check check (status in ('completed','skipped','not_applicable'));
alter table public.routine_completions drop constraint if exists routine_completions_status_check;
alter table public.routine_completions add constraint routine_completions_status_check check (status in ('in_progress','completed','skipped','not_applicable'));

create index if not exists habits_household_today_idx on public.habits(household_id,status,archived,category);
create index if not exists habit_actions_parent_active_idx on public.habit_actions(household_id,habit_id,active,display_order);

commit;
