begin;

alter table public.ai_recommendations
  add column if not exists priority_reason text not null default '',
  add column if not exists suggested_action text not null default '',
  add column if not exists estimated_effort text not null default 'quick',
  add column if not exists due_timing text,
  add column if not exists trigger_signature text not null default '',
  add column if not exists source_modules text[] not null default '{}',
  add column if not exists last_evaluated_at timestamptz not null default now(),
  add column if not exists reviewed_at timestamptz,
  add column if not exists never_remind boolean not null default false;

create table if not exists public.recommendation_history (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recommendation_key text not null,
  action text not null check (action in ('generated','accepted','dismissed','snoozed','completed','reviewed','never_remind','view','create_task','create_calendar_event','convert_maintenance')),
  trigger_signature text not null default '',
  source_modules text[] not null default '{}',
  related_record_ids text[] not null default '{}',
  remind_after timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists recommendation_history_household_key_idx on public.recommendation_history(household_id,user_id,recommendation_key,created_at desc);
create unique index if not exists recommendation_history_generated_once_idx on public.recommendation_history(household_id,user_id,recommendation_key,trigger_signature,action) where action='generated';

alter table public.recommendation_history enable row level security;
revoke all on public.recommendation_history from anon, public;
grant select, insert, update, delete on public.recommendation_history to authenticated;
drop policy if exists recommendation_history_own_all on public.recommendation_history;
create policy recommendation_history_own_all on public.recommendation_history for all to authenticated
  using(user_id=auth.uid() and public.familyos_is_household_member(household_id))
  with check(user_id=auth.uid() and public.familyos_has_household_role(household_id,array['owner','adult']));

commit;
