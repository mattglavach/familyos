-- Release 2.2 corrective Pool schema reconciliation.
-- Production missed the Release 1.7 Pool Test context columns. These guarded
-- additions preserve existing rows and make the optional text fields agree
-- with the application contract. RLS, policies, grants, and ownership are unchanged.

alter table public.pool_readings
  add column if not exists test_context text not null default 'Routine',
  add column if not exists water_appearance text default '';

alter table public.pool_readings
  alter column recent_weather_notes drop not null,
  alter column water_appearance drop not null;
