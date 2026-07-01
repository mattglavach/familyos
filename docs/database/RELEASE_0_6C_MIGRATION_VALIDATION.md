# Release 0.6C Migration Validation

## Purpose

This guide prepares the Release 0.6C household foundation migration for safe dry-run validation before app runtime integration or production application.

Migration under review:

- `supabase/migrations/20260701_release_0_6c_household_foundation.sql`

Do not apply this migration to production until every production readiness gate in this guide passes on a disposable local or staging Supabase database.

## Required Tools

- Supabase CLI or direct PostgreSQL access through `psql`.
- A disposable local or staging Supabase project.
- A database seeded from the current baseline schema in `supabase/schema.sql`.
- At least six test auth users:
  - one owner
  - one adult
  - one teen
  - one child
  - one viewer
  - one non-member

This repository workspace does not currently expose `psql` or the Supabase CLI, so execution validation remains pending until run in an environment with SQL tooling.

## Validation Checklist

### Syntax Review

- [ ] Migration starts with `begin;` and ends with `commit;`.
- [ ] All `do $$ ... end $$;` blocks are closed.
- [ ] Trigger creation is preceded by `drop trigger if exists`.
- [ ] New functions use explicit `security definer` and `set search_path = public` where they read RLS-protected tables.
- [ ] No production secrets, tokens, or browser-local Google OAuth values are introduced.

### Idempotency Assumptions

- [ ] Re-running the migration does not create duplicate bootstrap households.
- [ ] `create table if not exists`, `add column if not exists`, and `create index if not exists` operations succeed on a second run.
- [ ] Bootstrap inserts use stable conflict handling.
- [ ] Trigger names are dropped before recreation.
- [ ] Constraint creation blocks check for existing constraint names before altering `tasks`.

### Bootstrap Behavior

- [ ] Every existing `auth.users` row gets one `profiles` row.
- [ ] Every existing `auth.users` row gets one bootstrap household.
- [ ] Every bootstrap household gets one active owner membership.
- [ ] Every bootstrap household gets one `household_settings` row.
- [ ] Every bootstrap user gets one `user_preferences` row with `default_household_id`.
- [ ] Re-running the migration preserves existing profile display names and does not duplicate households.

### Backfill Behavior

- [ ] Every existing module row with `user_id` gets `household_id` backfilled.
- [ ] Rows without `user_id` remain valid because `household_id` is nullable during the compatibility phase.
- [ ] Existing `user_id` columns and indexes remain present.
- [ ] Existing module-table RLS policies remain unchanged.
- [ ] Existing tasks keep `completed`, `last_completed`, recurrence, category, priority, and notes behavior.
- [ ] Completed tasks get compatible `status = 'completed'` and `completed_at` where possible.

### RLS Policies

- [ ] Users can select and update their own profile only.
- [ ] Household members can select their household.
- [ ] Owners and adults can update household operating data where policies allow it.
- [ ] Owners can insert and update household membership.
- [ ] Adults cannot change household membership.
- [ ] Teen, child, and viewer roles can read conservative household data but cannot manage people, settings, or membership.
- [ ] Non-members cannot select, insert, or update household foundation rows.
- [ ] Module tables still obey existing `user_id = auth.uid()` behavior until app household context is implemented.

### Rollback Considerations

- [ ] Dry-run snapshots are available before migration execution.
- [ ] `familyos_internal.household_bootstrap_map` is retained for support and rollback analysis.
- [ ] No destructive changes are made to existing module tables.
- [ ] New columns are nullable except task metadata columns with safe defaults.
- [ ] Production rollback plan is documented before production execution.

### Production Readiness Gates

- [ ] Migration applies cleanly to a schema-only disposable database.
- [ ] Migration applies cleanly to a representative staging copy with existing auth users and module rows.
- [ ] Migration can be re-run without duplicate records or failing idempotent operations.
- [ ] Verification queries match expected counts.
- [ ] RLS smoke tests pass for owner, adult, teen, child, viewer, and non-member users.
- [ ] Existing app flows still work against staging because module-table `user_id` RLS remains intact.
- [ ] A database backup and rollback plan exist.
- [ ] Runtime app integration plan is approved separately.

## Dry-Run Setup

### Local Supabase Option

1. Install the Supabase CLI.
2. Start a local project:

```powershell
supabase start
```

3. Apply the current baseline schema to the local database:

```powershell
psql "$env:SUPABASE_DB_URL" -f supabase/schema.sql
```

4. Create representative auth users in the local Supabase auth schema. Use Supabase Studio or SQL fixtures appropriate to the local project.

5. Add representative rows to existing module tables, including `tasks`, `notes`, and at least one finance or planning table with `user_id` values.

### Staging Supabase Option

1. Create or identify a disposable staging Supabase project.
2. Restore a sanitized production-like backup or apply `supabase/schema.sql`.
3. Confirm public sign-up and external auth settings cannot affect real users.
4. Confirm `auth.users` includes enough test accounts for role and non-member validation.
5. Take a database snapshot before applying the migration.

## Migration Apply Steps

Run only against local or staging:

```powershell
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260701_release_0_6c_household_foundation.sql
```

Run the same command a second time to test idempotency. The second run should complete without duplicate household, membership, settings, or preference rows.

## Verification Queries

### Foundation Counts

```sql
select count(*) as auth_users from auth.users;
select count(*) as profiles from public.profiles;
select count(*) as households from public.households;
select count(*) as bootstrap_mappings from familyos_internal.household_bootstrap_map;
select count(*) as owner_memberships
from public.household_members
where role = 'owner'
  and status = 'active'
  and user_id is not null;
select count(*) as household_settings from public.household_settings;
select count(*) as user_preferences from public.user_preferences;
```

Expected result: `profiles`, `bootstrap_mappings`, active owner memberships, `household_settings`, and `user_preferences` are each at least the number of auth users covered by the bootstrap.

### Duplicate Bootstrap Guard

```sql
select bootstrap_source_user_id, count(*)
from public.households
where bootstrap_source_user_id is not null
group by bootstrap_source_user_id
having count(*) > 1;

select household_id, user_id, count(*)
from public.household_members
where user_id is not null
  and status = 'active'
group by household_id, user_id
having count(*) > 1;
```

Expected result: both queries return zero rows.

### Module Backfill Coverage

Run for every module table listed in the migration:

```sql
select
  'tasks' as table_name,
  count(*) filter (where user_id is not null) as rows_with_user_id,
  count(*) filter (where user_id is not null and household_id is not null) as rows_with_household_id,
  count(*) filter (where user_id is null and household_id is null) as nullable_compatibility_rows
from public.tasks;
```

Expected result: `rows_with_user_id` equals `rows_with_household_id`. Rows without `user_id` may remain with null `household_id` during the compatibility phase.

### Task Metadata

```sql
select
  count(*) filter (where status is null) as missing_status,
  count(*) filter (where module_key is null or length(trim(module_key)) = 0) as missing_module_key,
  count(*) filter (where completed = true and status <> 'completed') as completed_status_mismatch,
  count(*) filter (where user_id is not null and created_by_user_id is null) as missing_creator
from public.tasks;
```

Expected result: every count is `0`.

## RLS Smoke-Test Setup

Use disposable UUIDs from `auth.users`. The examples below assume:

- `:owner_user_id`
- `:adult_user_id`
- `:teen_user_id`
- `:child_user_id`
- `:viewer_user_id`
- `:non_member_user_id`
- `:household_id`

Create role memberships for the test household as a service role or database owner before testing authenticated RLS:

```sql
insert into public.household_members(household_id, user_id, role, status)
values
  (:'household_id', :'adult_user_id', 'adult', 'active'),
  (:'household_id', :'teen_user_id', 'teen', 'active'),
  (:'household_id', :'child_user_id', 'child', 'active'),
  (:'household_id', :'viewer_user_id', 'viewer', 'active')
on conflict do nothing;
```

When using `psql`, simulate an authenticated user with:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'owner_user_id', true);
select auth.uid() as active_test_user;
rollback;
```

If your Supabase environment requires a different JWT claim shape, adapt the session setup before relying on smoke-test results.

## RLS Smoke Tests

### Owner Can Manage Membership

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'owner_user_id', true);

select count(*) as visible_household_count
from public.households
where id = :'household_id';

update public.household_members
set status = 'inactive'
where household_id = :'household_id'
  and user_id = :'viewer_user_id';

rollback;
```

Expected result: owner sees the household and the membership update is allowed.

### Adult Can Manage People But Not Membership

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'adult_user_id', true);

insert into public.people(household_id, display_name, member_type, status)
values (:'household_id', 'Adult-created test person', 'other', 'active');

update public.household_members
set status = 'inactive'
where household_id = :'household_id'
  and user_id = :'viewer_user_id';

rollback;
```

Expected result: people insert succeeds; membership update is denied by RLS.

### Teen, Child, And Viewer Read But Do Not Manage

Run once for each role user id:

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'teen_user_id', true);

select count(*) as visible_people
from public.people
where household_id = :'household_id';

insert into public.people(household_id, display_name, member_type, status)
values (:'household_id', 'Denied test person', 'other', 'active');

rollback;
```

Expected result: select succeeds; insert is denied by RLS. Repeat with `:child_user_id` and `:viewer_user_id`.

### Non-Member Denial

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'non_member_user_id', true);

select count(*) as visible_households
from public.households
where id = :'household_id';

insert into public.people(household_id, display_name, member_type, status)
values (:'household_id', 'Denied non-member person', 'other', 'active');

rollback;
```

Expected result: visible household count is `0`; insert is denied by RLS.

### Existing User-Owned Table Compatibility

```sql
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', :'owner_user_id', true);

select count(*) as visible_tasks_for_owner
from public.tasks
where user_id = auth.uid();

insert into public.tasks(title, category, priority, due_date, notes, completed, user_id)
values ('Compatibility smoke task', 'General', 'Medium', current_date, 'Created by compatibility smoke test', false, auth.uid());

rollback;
```

Expected result: current user-owned task access still works through existing `user_id` RLS. New inserted rows may have nullable `household_id` until the app writes active household context in a later milestone.

## Failure Handling

- Stop immediately on any SQL error.
- Preserve the failing database state for inspection if possible.
- Capture the exact error, migration line, database version, and whether the run was first-run or idempotency re-run.
- Do not patch production directly.
- Update this guide and the migration draft after root-cause analysis.
- Re-run the full checklist on a fresh disposable database after any migration change.

## Release 0.6C Milestone 3 Status

This guide prepares validation but does not execute the migration. Execution remains pending until `psql` or Supabase CLI tooling is available in a local/staging environment.
