-- Fresh-project compatibility for the historical Release 1.4 migration.
--
-- The authoritative legacy baseline and current FamilyOS contract use text
-- identifiers for pool_readings. A preview-specific repair later changed the
-- historical Release 1.4 table definition to expect a UUID. Creating the table
-- here preserves the canonical text relationship without rewriting history.
-- Existing environments are unchanged because this statement is idempotent.

create table if not exists public.pool_action_audits (
  id text primary key default gen_random_uuid()::text,
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  reading_id text references public.pool_readings(id) on delete set null,
  recommendation_id text not null,
  action text not null,
  explanation text not null default '',
  confidence text not null default 'Medium',
  safety_note text not null default '',
  status text not null default 'recommended',
  confirmed_at timestamptz,
  completed_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pool_action_audits_status_check
    check (status in ('recommended', 'confirmed', 'completed', 'dismissed'))
);
