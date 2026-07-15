begin;
create table if not exists public.ai_preferences (
 id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households(id) on delete cascade,user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 enabled boolean not null default true,family_brief_enabled boolean not null default true,response_length text not null default 'concise' check(response_length in('concise','standard','detailed')),
 default_modules text[] not null default array['calendar','tasks'],recommendation_frequency text not null default 'normal' check(recommendation_frequency in('minimal','normal','frequent')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(household_id,user_id));
create table if not exists public.ai_recommendations (
 id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households(id) on delete cascade,user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 recommendation_key text not null,title text not null,explanation text not null default '',priority text not null default 'medium' check(priority in('critical','high','medium','low')),
 source_module text not null,related_record_ids text[] not null default '{}',evidence_level text not null default 'suggested' check(evidence_level in('confirmed','calculated','suggested')),
 status text not null default 'active' check(status in('active','dismissed','completed','snoozed')),remind_after timestamptz,generated_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(household_id,user_id,recommendation_key));
create table if not exists public.ai_proposed_actions (
 id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households(id) on delete cascade,user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,recommendation_id uuid references public.ai_recommendations(id) on delete set null,idempotency_key text not null,
 action_type text not null check(action_type in('create_task','update_task_due_date','assign_task','create_calendar_event','suggest_calendar_block','create_maintenance_item','log_relationship_activity','create_relationship_goal','create_habit','add_note','add_pool_test_recommendation','dismiss_recommendation','mark_recommendation_completed')),
 payload jsonb not null default '{}'::jsonb,rationale text not null default '',status text not null default 'proposed' check(status in('proposed','approved','rejected','executed','failed')),
 reviewed_at timestamptz,executed_at timestamptz,error_category text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(household_id,idempotency_key));
create table if not exists public.ai_feedback (
 id uuid primary key default gen_random_uuid(),household_id uuid not null references public.households(id) on delete cascade,user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 recommendation_key text not null,feedback_type text not null check(feedback_type in('helpful','not_helpful','dismissed','completed','remind_later')),source_module text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(household_id,user_id,recommendation_key,feedback_type));
create index if not exists ai_recommendations_household_status_idx on public.ai_recommendations(household_id,user_id,status,updated_at desc);
create index if not exists ai_proposed_actions_household_status_idx on public.ai_proposed_actions(household_id,user_id,status,created_at desc);
create index if not exists ai_feedback_household_user_idx on public.ai_feedback(household_id,user_id,updated_at desc);
alter table public.ai_preferences enable row level security;alter table public.ai_recommendations enable row level security;alter table public.ai_proposed_actions enable row level security;alter table public.ai_feedback enable row level security;
revoke all on public.ai_preferences,public.ai_recommendations,public.ai_proposed_actions,public.ai_feedback from anon,public;
grant select,insert,update,delete on public.ai_preferences,public.ai_recommendations,public.ai_proposed_actions,public.ai_feedback to authenticated;
do $$ declare t text;begin foreach t in array array['ai_preferences','ai_recommendations','ai_proposed_actions','ai_feedback'] loop execute format('drop policy if exists %I on public.%I',t||'_own_all',t);execute format('create policy %I on public.%I for all to authenticated using(user_id=auth.uid() and public.familyos_is_household_member(household_id)) with check(user_id=auth.uid() and public.familyos_has_household_role(household_id,array[''owner'',''adult'']))',t||'_own_all',t);end loop;end $$;
commit;
