-- Release 2.2 Pool Test persistence repair.
-- Blank optional context fields are represented consistently as NULL by both
-- Pool Test entry paths. RLS, grants, ownership, and required fields are unchanged.

alter table public.pool_readings
  alter column recent_weather_notes drop not null,
  alter column water_appearance drop not null;
