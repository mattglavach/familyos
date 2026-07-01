-- Release 0.6C production baseline alignment: user-owned module rows.
--
-- This migration reconciles production databases that still have older
-- public/open module-table policies and no user_id ownership columns. It must
-- run before the Release 0.6C household foundation migration.

begin;

create extension if not exists "pgcrypto";

create temporary table migration_module_tables (
  table_name text primary key
) on commit drop;

insert into migration_module_tables(table_name) values
  ('notes'),
  ('tasks'),
  ('home_maintenance'),
  ('pool_readings'),
  ('pool_maintenance'),
  ('pool_treatments'),
  ('pool_schedule'),
  ('pool_settings'),
  ('college_schools'),
  ('college_test_plan'),
  ('college_essays'),
  ('college_deadlines'),
  ('sat_scores'),
  ('college_savings'),
  ('college_goal'),
  ('retirement_accounts'),
  ('retirement_assumptions'),
  ('mortgage'),
  ('other_debt'),
  ('net_worth_snapshots'),
  ('finance_action_items');

do $$
declare
  approved_owner_user_id constant uuid := 'fc93e654-0305-4b4e-8c48-9edff3c2e800';
  missing_tables text;
  table_name text;
  null_owner_rows bigint;
  missing_user_id_columns text;
  missing_policy_tables text;
begin
  if not exists (
    select 1
    from auth.users
    where id = approved_owner_user_id
  ) then
    raise exception 'Release 0.6C auth ownership baseline failed. Approved owner auth user % does not exist.',
      approved_owner_user_id;
  end if;

  select string_agg(mt.table_name, ', ' order by mt.table_name)
  into missing_tables
  from migration_module_tables mt
  left join information_schema.tables t
    on t.table_schema = 'public'
   and t.table_name = mt.table_name
  where t.table_name is null;

  if missing_tables is not null then
    raise exception 'Release 0.6C auth ownership baseline failed. Missing expected module tables: %',
      missing_tables;
  end if;

  for table_name in
    select mt.table_name
    from migration_module_tables mt
    order by mt.table_name
  loop
    execute format(
      'alter table public.%I add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid()',
      table_name
    );

    execute format(
      'update public.%I set user_id = $1 where user_id is null',
      table_name
    )
    using approved_owner_user_id;

    execute format(
      'select count(*) from public.%I where user_id is null',
      table_name
    )
    into null_owner_rows;

    if null_owner_rows > 0 then
      raise exception 'Release 0.6C auth ownership baseline failed. Table %.% still has % null user_id rows after backfill.',
        'public',
        table_name,
        null_owner_rows;
    end if;

    execute format(
      'create index if not exists %I on public.%I(user_id)',
      table_name || '_user_id_idx',
      table_name
    );

    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);

    execute format('drop policy if exists "phase1_anon_all" on public.%I', table_name);
    execute format('drop policy if exists "Allow all for anon" on public.%I', table_name);
    execute format('drop policy if exists "open" on public.%I', table_name);
    execute format('drop policy if exists "familyos_user_all" on public.%I', table_name);
    execute format(
      'create policy "familyos_user_all" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      table_name
    );
  end loop;

  select string_agg(mt.table_name, ', ' order by mt.table_name)
  into missing_user_id_columns
  from migration_module_tables mt
  left join information_schema.columns c
    on c.table_schema = 'public'
   and c.table_name = mt.table_name
   and c.column_name = 'user_id'
  where c.column_name is null;

  if missing_user_id_columns is not null then
    raise exception 'Release 0.6C auth ownership baseline postflight failed. Missing user_id columns: %',
      missing_user_id_columns;
  end if;

  select string_agg(mt.table_name, ', ' order by mt.table_name)
  into missing_policy_tables
  from migration_module_tables mt
  where not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename = mt.table_name
      and p.policyname = 'familyos_user_all'
  );

  if missing_policy_tables is not null then
    raise exception 'Release 0.6C auth ownership baseline postflight failed. Missing familyos_user_all policies: %',
      missing_policy_tables;
  end if;
end $$;

commit;
