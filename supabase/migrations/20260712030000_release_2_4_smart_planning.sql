begin;
alter table public.habits add column if not exists target_count smallint not null default 1 check (target_count between 1 and 31);
alter table public.routines add column if not exists template_key text;
create index if not exists habit_completions_habit_completed_idx on public.habit_completions(habit_id, completed_at desc);
create index if not exists routine_completions_routine_completed_idx on public.routine_completions(routine_id, completed_at desc) where completed_at is not null;
commit;
