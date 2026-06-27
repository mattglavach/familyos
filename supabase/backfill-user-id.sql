-- Backfill existing FamilyOS rows after adding Supabase Auth ownership.
--
-- Use this if you already have rows in Supabase from the pre-auth prototype.
-- Steps:
-- 1. Sign in once through the app so Supabase creates your auth user.
-- 2. In Supabase Authentication > Users, copy your user's UUID.
-- 3. Replace the UUID below.
-- 4. Run this file in the Supabase SQL editor.
--
-- The script only fills rows where user_id is currently null. It will not move
-- rows that are already owned by another user.

do $$
declare
  owner_user_id uuid := '00000000-0000-0000-0000-000000000000';
  table_name text;
begin
  if owner_user_id = '00000000-0000-0000-0000-000000000000' then
    raise exception 'Replace owner_user_id with your Supabase auth user UUID before running backfill-user-id.sql.';
  end if;

  foreach table_name in array array[
    'notes','tasks','home_maintenance','pool_readings','pool_maintenance',
    'pool_treatments','pool_schedule','pool_settings','college_schools',
    'college_test_plan','college_essays','college_deadlines','sat_scores',
    'college_savings','college_goal','retirement_accounts',
    'retirement_assumptions','mortgage','other_debt','net_worth_snapshots',
    'finance_action_items'
  ]
  loop
    execute format('update public.%I set user_id = $1 where user_id is null', table_name)
    using owner_user_id;
  end loop;
end $$;
