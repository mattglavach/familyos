create extension if not exists "pgcrypto";

create table if not exists public.notes (
  id text primary key default gen_random_uuid()::text,
  title text default '',
  body text not null,
  tag text default 'General',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  category text default 'Home',
  priority text default 'med',
  due_date date,
  recurring_interval_days integer,
  last_completed date,
  is_important boolean not null default false,
  notes text default '',
  completed boolean not null default false
);

create table if not exists public.home_maintenance (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  last_completed date not null,
  interval_days integer not null,
  notes text default ''
);

create table if not exists public.pool_readings (
  id text primary key default gen_random_uuid()::text,
  date date not null,
  logged_at timestamptz not null default now(),
  ph numeric,
  free_chlorine numeric,
  cc numeric,
  salt integer,
  cya integer,
  alkalinity integer,
  calcium_hardness integer,
  water_temp numeric,
  swg_setting numeric,
  filter_pressure numeric,
  pump_hours numeric,
  test_source text not null default 'Manual',
  recent_weather_notes text not null default '',
  recent_heavy_usage boolean not null default false,
  test_context text not null default 'Routine',
  water_appearance text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notes text default ''
);

create table if not exists public.pool_maintenance (
  id text primary key default gen_random_uuid()::text,
  date date not null,
  type text not null,
  equipment_id text,
  water_clarity text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notes text default ''
);

create table if not exists public.pool_treatments (
  id text primary key default gen_random_uuid()::text,
  date date not null,
  logged_at timestamptz not null default now(),
  muriatic_acid_oz numeric,
  soda_ash_oz numeric,
  sodium_bicarb_oz numeric,
  salt_lbs numeric,
  cya_oz numeric,
  liquid_chlorine_oz numeric,
  shock_lbs numeric,
  algaecide_oz numeric,
  swg_pct_before numeric,
  swg_pct_after numeric,
  brushed boolean not null default false,
  vacuumed boolean not null default false,
  cleaned_skimmer boolean not null default false,
  cleaned_filter boolean not null default false,
  cleaned_cell boolean not null default false,
  checked_flow boolean not null default false,
  water_clarity text not null default '',
  treatment text not null default '',
  amount numeric,
  unit text not null default '',
  product_concentration text not null default '',
  reason text not null default '',
  related_reading_id text references public.pool_readings(id) on delete set null,
  pump_status text not null default '',
  pump_speed_rpm integer,
  expected_result text not null default '',
  retest_at timestamptz,
  follow_up_result text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notes text default ''
);

create table if not exists public.pool_schedule (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  equipment_id text,
  maintenance_type text not null default 'Pool reminder',
  last_completed date not null,
  interval_days integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  notes text default ''
);

create table if not exists public.pool_settings (
  id text primary key default gen_random_uuid()::text,
  filter_clean_baseline_psi numeric
);

create table if not exists public.pool_profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  user_id uuid default auth.uid(),
  name text not null default 'Pool',
  volume_gallons integer not null check (volume_gallons > 0),
  surface_type text not null,
  sanitizer_type text not null,
  saltwater boolean not null default false,
  automation_system text not null default '', pump text not null default '', filter text not null default '', heater text not null default '', salt_cell text not null default '',
  spa_relationship text not null default '', normal_pump_runtime_hours numeric, normal_pump_speed_rpm integer, minimum_salt_cell_rpm integer, swg_output_percent numeric,
  preferred_products jsonb not null default '[]'::jsonb, chemical_concentrations jsonb not null default '{}'::jsonb, target_ranges jsonb not null default '{}'::jsonb,
  seasonal_notes text not null default '', notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (household_id, name)
);

create table if not exists public.pool_equipment (
  id text primary key default gen_random_uuid()::text,
  household_id uuid,
  user_id uuid default auth.uid(),
  type text not null,
  name text not null,
  brand text not null default '',
  model text not null default '',
  install_date date,
  last_maintenance date,
  next_maintenance date,
  warranty_notes text not null default '',
  manual_link text not null default '',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pool_action_audits (
  id text primary key default gen_random_uuid()::text,
  household_id uuid,
  user_id uuid default auth.uid(),
  reading_id uuid references public.pool_readings(id) on delete set null,
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
  updated_at timestamptz not null default now()
);

create table if not exists public.college_schools (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  status text default 'researching',
  match_level text default 'Target',
  app_type text default 'Regular',
  app_deadline date,
  visit_notes text default ''
);

create table if not exists public.college_test_plan (
  id text primary key default gen_random_uuid()::text,
  test_type text not null,
  target_date date not null,
  target_score text default '',
  attempt_number integer default 1,
  registered boolean not null default false,
  notes text default ''
);

create table if not exists public.college_essays (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  school text default '',
  due_date date,
  status text default 'not started',
  word_count text default '',
  notes text default ''
);

create table if not exists public.college_deadlines (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  due_date date not null,
  school text default '',
  category text default 'other',
  completed boolean not null default false
);

create table if not exists public.sat_scores (
  id text primary key default gen_random_uuid()::text,
  date date not null,
  total integer not null,
  math integer default 0,
  verbal integer default 0,
  notes text default ''
);

create table if not exists public.college_savings (
  id text primary key default gen_random_uuid()::text,
  balance numeric not null default 0,
  monthly_contribution numeric not null default 0,
  last_updated date,
  notes text default ''
);

create table if not exists public.college_goal (
  id text primary key default gen_random_uuid()::text,
  child_name text not null,
  target_amount numeric not null default 0,
  target_year integer not null,
  notes text default ''
);

create table if not exists public.retirement_accounts (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  account_type text default 'other',
  balance numeric not null default 0,
  monthly_contribution numeric not null default 0,
  employer_match numeric not null default 0,
  contribution_frequency text default 'monthly',
  tax_treatment text default 'pre-tax',
  last_updated date,
  notes text default ''
);

create table if not exists public.retirement_assumptions (
  id text primary key default gen_random_uuid()::text,
  current_age integer not null default 44,
  retirement_age integer not null default 59,
  annual_return_pct numeric not null default 7,
  withdrawal_rate_pct numeric not null default 4,
  annual_retirement_spending numeric not null default 110000,
  social_security_estimate numeric not null default 0,
  social_security_estimate_spouse numeric not null default 0,
  ss_claim_age integer not null default 67,
  ss_claim_age_spouse integer not null default 67,
  healthcare_estimate numeric not null default 0,
  contribution_increase_pct numeric not null default 0,
  bridge_end_age integer not null default 65,
  medicare_age integer not null default 65,
  plan_end_age integer not null default 90,
  inflation_pct numeric not null default 3,
  conservative_rate_pct numeric not null default 5,
  moderate_rate_pct numeric not null default 7,
  aggressive_rate_pct numeric not null default 9,
  drawdown_rate_pct numeric not null default 5,
  return_volatility_pct numeric not null default 15
);

create table if not exists public.mortgage (
  id text primary key default gen_random_uuid()::text,
  current_balance numeric not null default 0,
  interest_rate numeric not null default 0,
  monthly_payment numeric not null default 0,
  term_years integer not null default 30,
  start_date date,
  extra_payment_monthly numeric not null default 0,
  home_value numeric not null default 0,
  last_updated date
);

create table if not exists public.other_debt (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  balance numeric not null default 0,
  interest_rate numeric not null default 0,
  payment_amount numeric not null default 0,
  payment_frequency text default 'monthly',
  extra_payment numeric not null default 0,
  last_updated date,
  notes text default ''
);

create table if not exists public.net_worth_snapshots (
  id text primary key default gen_random_uuid()::text,
  date date not null,
  total_assets numeric not null default 0,
  total_liabilities numeric not null default 0,
  net_worth numeric not null default 0,
  notes text default ''
);

create table if not exists public.finance_action_items (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  category text default 'other',
  priority text default 'med',
  completed boolean not null default false,
  created_date date not null default current_date
);

-- Phase 1 uses Supabase Auth magic links. Each row is owned by the signed-in
-- user that created it, and the browser sends that user's access token.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'notes','tasks','home_maintenance','pool_readings','pool_maintenance',
    'pool_treatments','pool_schedule','pool_settings','pool_equipment',
    'pool_action_audits','college_schools',
    'college_test_plan','college_essays','college_deadlines','sat_scores',
    'college_savings','college_goal','retirement_accounts',
    'retirement_assumptions','mortgage','other_debt','net_worth_snapshots',
    'finance_action_items'
  ]
  loop
    execute format('alter table public.%I add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid()', table_name);
    execute format('create index if not exists %I on public.%I(user_id)', table_name || '_user_id_idx', table_name);
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "phase1_anon_all" on public.%I', table_name);
    execute format('drop policy if exists "familyos_user_all" on public.%I', table_name);
    execute format(
      'create policy "familyos_user_all" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      table_name
    );
  end loop;
end $$;

-- Release 0.9 household collaboration overlay.
-- The production household foundation is introduced by migrations. This
-- conditional overlay keeps the schema reference aware of Release 0.9 without
-- failing older clean baselines that have not yet applied the household tables.
do $$
begin
  if to_regclass('public.household_members') is not null then
    alter table public.household_members
      drop constraint if exists household_members_status_check;
    alter table public.household_members
      add constraint household_members_status_check
        check (status in ('pending', 'active', 'inactive', 'removed', 'declined'));
  end if;

  if to_regclass('public.households') is not null
     and to_regclass('public.household_invitations') is null then
    create table public.household_invitations (
      id uuid primary key default gen_random_uuid(),
      household_id uuid not null references public.households(id) on delete cascade,
      invited_email text not null,
      invited_by uuid references auth.users(id) on delete set null,
      role text not null default 'adult',
      status text not null default 'pending',
      token_hash text not null,
      expires_at timestamptz not null default (now() + interval '14 days'),
      accepted_at timestamptz,
      declined_at timestamptz,
      revoked_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint household_invitations_email_not_blank_check check (length(trim(invited_email)) > 0),
      constraint household_invitations_role_check check (role in ('owner', 'adult', 'teen', 'child', 'viewer')),
      constraint household_invitations_status_check check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired'))
    );
  end if;
end $$;
