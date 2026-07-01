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

Milestone 5 validated the migration with `npx supabase status` and `docker exec ... psql` against the disposable local Supabase database. Milestone 6 repeated validation against fresh schema-only and staging-like disposable local databases.

## Release 0.6C Milestone 4 Status

Milestone 4 checked local SQL tooling again. Neither `psql` nor the Supabase CLI is available in this Codex workspace, so the migration dry run was not executed here.

Status:

- SQL dry run: pending.
- Idempotency re-run: pending.
- Verification SQL: pending.
- RLS smoke tests: pending.
- Migration revisions from actual execution: none.

Milestones 5 and 6 completed the local dry-run path after concrete migration revisions. Do not apply the migration to production until app smoke tests and production backup/rollback review are also complete.

## Release 0.6C Milestone 5 Results

Milestone 5 executed the household foundation migration against the disposable local Supabase database only. No production database was touched.

Environment:

- Local Supabase status: running through `npx supabase status`.
- Database execution path: `docker exec supabase_db_familyos psql -U postgres -d postgres`.
- Local migration history before the dry run: `20260626`, `20260627`.
- Existing local foundation state before the dry run: `profiles`, `households`, `people`, `household_members`, and `familyos_internal.household_bootstrap_map` already existed from the earlier local-only foundation migration.

Execution:

- First migration attempt: failed and rolled back.
- Failure: `people.status` did not exist when the draft attempted to create `people_household_status_idx`.
- Revision made: the migration now upgrades existing 20260627 foundation tables before indexing by adding missing `people.display_name`, `people.color`, and `people.status` columns and broadening existing `people_member_type_check` and `household_members_role_check` constraints.
- Revised migration run: passed.
- Idempotency re-run: passed.
- Runtime app behavior changed: no.
- Production database touched: no.

Validation SQL results:

- `auth.users`: 3.
- `profiles`: 3.
- `households`: 4. One household was pre-existing local data beyond the three bootstrap households.
- `familyos_internal.household_bootstrap_map`: 3.
- active owner memberships: 3.
- `household_settings`: 3.
- `user_preferences`: 3.
- duplicate bootstrap households: 0 rows.
- duplicate active user memberships per household: 0 rows.
- module rows with `user_id` but missing `household_id`: 0 across all module tables.
- populated module data during validation: `tasks` had 1 row with `user_id` and 1 row with `household_id`.
- task metadata issues: 0 missing status, 0 missing module key, 0 completed/status mismatches, 0 missing creator values for rows with `user_id`.

Column and constraint results:

- `household_settings` and `user_preferences` exist with expected columns.
- `tasks` has `household_id`, `assigned_person_id`, `status`, `created_at`, `updated_at`, `completed_at`, `module_key`, `created_by_user_id`, and `updated_by_user_id`.
- `household_members_role_check` allows `owner`, `adult`, `teen`, `child`, and `viewer`.
- `people_member_type_check` allows `adult`, `teen`, `child`, `child_profile`, `viewer`, and `other`. `child_profile` is retained for compatibility with the earlier local foundation draft.
- `tasks_status_check` allows `not_started`, `in_progress`, and `completed`.
- `tasks_module_key_not_blank_check` is present.

RLS smoke-test results:

- Owner household read: pass.
- Owner membership update: pass.
- Adult people insert: pass.
- Adult membership update denial: pass. The update returned 0 rows under RLS.
- Teen people read: pass.
- Teen people insert denial: pass.
- Child people read: pass.
- Child people insert denial: pass.
- Viewer people read: pass.
- Viewer people insert denial: pass.
- Non-member household read denial: pass. The select returned 0 rows.
- Non-member people insert denial: pass.
- Existing user-owned `tasks` read and insert compatibility: pass.

Smoke-test cleanup:

- Temporary cross-household memberships used for adult/teen/child/viewer RLS tests were deleted after validation.

Remaining validation before production:

- Confirm app smoke tests against the migrated local/staging database.
- Prepare explicit production backup and rollback steps.

## Release 0.6C Milestone 6 Results

Milestone 6 validated the revised migration against two additional disposable local databases inside the local Supabase Postgres container. No production database was touched.

### Fresh Schema-Only Validation

Environment:

- Disposable database: `familyos_06c_fresh`.
- Baseline: minimal local `auth` prelude plus `supabase/schema.sql`.
- Seed data: 3 disposable auth users and 1 representative task.

Execution:

- Baseline schema applied: pass.
- First revised migration run: pass.
- Idempotency re-run: pass.
- Runtime app behavior changed: no.
- Production database touched: no.

Validation SQL:

- `auth.users`: 3.
- `profiles`: 3.
- `households`: 3.
- `familyos_internal.household_bootstrap_map`: 3.
- active owner memberships: 3.
- `household_settings`: 3.
- `user_preferences`: 3.
- duplicate bootstrap users: 0.
- duplicate active memberships: 0.
- task rows with `user_id`: 1.
- task rows with `household_id`: 1.
- task rows missing `household_id`: 0.
- task metadata issues: 0 missing status, 0 missing module key, 0 completed/status mismatches, 0 missing creator values.

RLS and compatibility:

- Owner household read: pass.
- Owner membership update: pass.
- Adult people insert: pass.
- Adult membership update denial: pass.
- Teen, child, and viewer read checks: pass.
- Teen, child, viewer, and non-member people insert denial: pass.
- Non-member household read denial: pass.
- Existing user-owned `tasks` read and insert compatibility: pass.

Finding and revision:

- Fresh schema validation exposed that the baseline module tables had RLS policies but no `authenticated` table privileges, causing existing user-owned `tasks` compatibility to fail with `permission denied for table tasks`.
- The migration now grants `select`, `insert`, `update`, and `delete` on each existing module table to `authenticated` while preserving the existing `user_id = auth.uid()` RLS policy as the row access boundary.

### Staging-Like Validation

Environment:

- Disposable database: `familyos_06c_stage_like`.
- Baseline: minimal local `auth` prelude plus `supabase/schema.sql`.
- Seed data: 3 disposable auth users and representative sanitized rows in `notes`, `tasks`, `pool_readings`, `finance_action_items`, `college_deadlines`, `home_maintenance`, and `mortgage`.

Execution:

- Baseline schema applied: pass.
- First revised migration run: pass.
- Idempotency re-run: pass.
- Runtime app behavior changed: no.
- Production database touched: no.

Validation SQL:

- `auth.users`: 3.
- `profiles`: 3.
- `households`: 3.
- `familyos_internal.household_bootstrap_map`: 3.
- active owner memberships: 3.
- `household_settings`: 3.
- `user_preferences`: 3.
- duplicate bootstrap users: 0.
- duplicate active memberships: 0.
- module rows with `user_id` but missing `household_id`: 0.
- representative rows backfilled successfully in `notes`, `tasks`, `pool_readings`, `finance_action_items`, `college_deadlines`, `home_maintenance`, and `mortgage`.
- task metadata issues: 0 missing status, 0 missing module key, 0 completed/status mismatches, 0 missing creator values.

RLS and compatibility:

- Owner household read: pass.
- Existing user-owned `tasks` read compatibility: pass.
- Adult household manage helper: pass.
- Adult people insert: pass.
- Non-member household read denial: pass.

Remaining validation before production:

- Prepare and review production backup and rollback steps.
- Decide whether to apply this combined foundation/task/settings migration as one production migration or split it before production.

## Release 0.6C Milestone 7 Results

Milestone 7 ran app-facing smoke tests against the migrated local Supabase database only. No production database was touched.

Environment:

- Local Supabase status: running through `npx supabase status`.
- API target: local `127.0.0.1` Supabase API.
- Database: local `postgres` database in the `supabase_db_familyos` container.
- Fixture: one disposable local auth user created through the local Supabase Admin API and deleted after testing.

Initial finding and migration revision:

- First app smoke run passed local auth user creation and password login but failed profile bootstrap because users created after the migration had no `profiles`, `households`, `household_members`, `household_settings`, or `user_preferences` rows.
- The migration now creates `public.familyos_bootstrap_auth_user()` and an `after insert on auth.users` trigger named `familyos_bootstrap_auth_user_on_insert`.
- The trigger bootstraps the new user's profile, default household, owner membership, household settings, user preferences, and internal bootstrap mapping.
- The revised migration was re-applied to the local database and completed successfully. No production database was touched.

App smoke-test results after the trigger revision:

- Authentication/password login: pass.
- Profile bootstrap for a post-migration auth user: pass.
- Household bootstrap and current household resolution: pass.
- Owner membership bootstrap: pass.
- `user_preferences` read/write: pass.
- `household_settings` read/write: pass.
- Task list read: pass.
- Task create/update/delete through app-style current `tasks` fields: pass.
- Task `household_id` nullable compatibility for current app writes: pass.
- Existing module nullable `household_id` compatibility: pass for `notes`, `home_maintenance`, `pool_readings`, `college_deadlines`, and `finance_action_items`.
- Fixture cleanup: pass. The disposable household was deleted before deleting the disposable auth user, and inserted module rows were deleted.

LocalStorage behavior:

- No runtime app code was changed.
- No localStorage migration behavior was added, removed, or modified.
- Release 0.6B browser-local keys for family members, settings/profile, task metadata, and Google Calendar token/sync metadata remain unchanged until a future runtime migration milestone.

Production status:

- Production migration execution: not run.
- Production database touched: no.
- Production readiness recommendation: app smoke tests now pass locally, but production should remain blocked until backup/rollback steps are reviewed and an owner go/no-go decision is recorded.

## Release 0.6C Milestone 8 Production Readiness Signoff

Milestone 8 is a signoff review only. No production database was touched and no migration was applied.

Confirmed readiness items:

1. Production backup method: use a Supabase-managed backup or point-in-time recovery marker immediately before the migration, plus `pg_dump --schema-only` and targeted data exports for `auth.users`, existing module tables, and any existing household foundation tables.
2. Restore/rollback path: prefer full database restore from the pre-migration backup/PITR marker if validation fails. If a full restore is not acceptable, stop app writes and use a separately reviewed rollback script that removes only Release 0.6C-created triggers, functions, policies, indexes, tables, and nullable columns while preserving existing module rows.
3. Migration file to apply: `supabase/migrations/20260701_release_0_6c_household_foundation.sql`.
4. Validation SQL to run after migration: run the verification queries in this guide covering auth/profile/household/bootstrap counts, duplicate bootstrap guards, duplicate active memberships, module `household_id` backfill, task metadata, expected columns, role/type constraints, and RLS smoke tests.
5. Post-migration app smoke checks: verify login, profile bootstrap, household/current-household resolution, owner membership bootstrap, user preferences read/write, household settings read/write, task list/create/update/delete, representative module reads/writes, new auth user bootstrap through the trigger, non-member denial, and unchanged localStorage behavior.
6. Owner go/no-go approval: required before production execution. This document recommends go only after the owner confirms the backup is complete and explicitly approves applying the migration.

Recommendation:

- The combined Release 0.6C migration is recommended to apply as-is after explicit owner go/no-go approval.
- Rationale: fresh schema, staging-like, idempotency, RLS, task compatibility, and migrated-local app smoke checks have passed, and the migration remains staged by preserving current `user_id = auth.uid()` module-table RLS while adding nullable household compatibility fields.
- Production remains blocked until the backup artifacts are captured and the owner records the final go decision.

## Production Readiness Checklist

### Backup Steps

- [x] Confirm the target production Supabase project/ref and that the connection string must be production before execution.
- [x] Pause app deployments or user-facing writes if needed for the migration window.
- [x] Create a Supabase-managed database backup or point-in-time recovery marker immediately before migration.
- [x] Export a schema-only backup with `pg_dump --schema-only`.
- [x] Export data backups for `auth.users`, current module tables, and any existing household foundation tables if present.
- [x] Record current migration history and row counts for auth users, module rows, profiles, households, people, memberships, settings, and preferences.
- [x] Store backups in an approved private location and verify restore access before proceeding.

### Rollback Plan

- [x] Preferred rollback: restore the pre-migration database backup or PITR marker if production validation fails.
- [x] If a full restore is not acceptable, pause the app and run a reviewed rollback script that removes only Release 0.6C-created triggers, functions, policies, indexes, tables, and nullable columns.
- [x] Do not manually delete production household rows without first preserving `familyos_internal.household_bootstrap_map`.
- [x] Confirm rollback keeps existing user-owned module rows and `user_id = auth.uid()` RLS intact.
- [x] Re-run pre-migration app smoke tests after rollback before reopening writes.

### Go/No-Go Gates

- [ ] Production backup artifacts captured and restore path verified immediately before execution.
- [x] Migration file exactly matches the committed Release 0.6C candidate.
- [x] Fresh schema, staging-like, RLS, idempotency, and app smoke tests are green.
- [ ] Owner approves applying foundation, task metadata, and settings changes in one migration.
- [x] If owner does not approve the combined migration, split task/settings additions into a later migration before production.
- [x] No production secrets or browser-local OAuth tokens are included in migration artifacts.

### Production Migration Execution Sequence

- [ ] Announce migration window and freeze unrelated app/database changes.
- [ ] Capture backups and baseline counts.
- [ ] Apply `supabase/migrations/20260701_release_0_6c_household_foundation.sql` once against production.
- [ ] Save command output and any warnings.
- [ ] Re-run the migration only if the first run fully commits and the team is validating idempotency intentionally.
- [ ] Do not deploy runtime app changes as part of this migration unless separately approved.

### Post-Migration Validation

- [ ] Verify `profiles`, `households`, `people`, `household_members`, `household_settings`, and `user_preferences` exist.
- [ ] Verify every existing `auth.users` row has a profile, bootstrap mapping, active owner membership, household settings row, and user preferences row.
- [ ] Verify module rows with existing `user_id` values have `household_id` backfilled where a bootstrap household exists.
- [ ] Verify current app login, task read/create/update/delete, and key module reads/writes still work.
- [ ] Verify a newly created auth user receives bootstrap foundation rows through the trigger.
- [ ] Verify non-member access remains denied for household foundation tables.
- [ ] Confirm no localStorage migration behavior changed.

### Owner/Signoff Decision Points

- [ ] Approve production backup completeness before migration.
- [ ] Approve the go/no-go decision after preflight checks.
- [ ] Approve post-migration validation results.
- [ ] Approve reopening writes and continuing to runtime integration milestones.
- [ ] Record whether the combined migration should stay as one migration or be split before production.

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

- [x] Migration applies cleanly to a schema-only disposable database.
- [x] Migration applies cleanly to a representative staging copy with existing auth users and module rows.
- [x] Migration can be re-run without duplicate records or failing idempotent operations.
- [x] Verification queries match expected counts.
- [x] RLS smoke tests pass for owner, adult, teen, child, viewer, and non-member users.
- [x] Existing app flows still work against the migrated local database because module-table `user_id` RLS remains intact.
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

### Exact Pending Commands

Use these commands from the repository root after installing the required SQL tooling and setting `SUPABASE_DB_URL` to a disposable local or staging database.

Check tooling:

```powershell
Get-Command psql
Get-Command supabase
```

Optional local Supabase startup:

```powershell
supabase start
```

Apply the baseline schema if using an empty disposable database:

```powershell
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/schema.sql
```

Apply the Release 0.6C migration draft:

```powershell
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260701_release_0_6c_household_foundation.sql
```

Re-run the migration to test idempotency:

```powershell
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260701_release_0_6c_household_foundation.sql
```

Run verification queries:

```powershell
psql "$env:SUPABASE_DB_URL" -v ON_ERROR_STOP=1
```

Paste the verification and RLS smoke-test SQL from the sections below.

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

## Dry-Run Results Template

Complete this template after running the migration in a disposable local or staging Supabase database.

```text
Environment:
- Local or staging:
- Supabase project/ref:
- Database source: schema-only / sanitized backup / other:
- Migration file:
- Date/time:
- Operator:

Tooling:
- psql version:
- Supabase CLI version:

Execution:
- Baseline schema applied: pass/fail/not needed
- First migration run: pass/fail
- Idempotency re-run: pass/fail
- Runtime app behavior changed: no
- Production database touched: no

Foundation counts:
- auth.users:
- profiles:
- households:
- bootstrap mappings:
- active owner memberships:
- household_settings:
- user_preferences:

Backfill:
- module tables checked:
- rows with user_id but missing household_id:
- nullable compatibility rows reviewed:

Task metadata:
- missing status:
- missing module_key:
- completed status mismatch:
- missing creator:

RLS smoke tests:
- owner membership management: pass/fail
- adult people management: pass/fail
- adult membership denial: pass/fail
- teen read/manage behavior: pass/fail
- child read/manage behavior: pass/fail
- viewer read/manage behavior: pass/fail
- non-member denial: pass/fail
- existing user-owned tasks compatibility: pass/fail

Findings:
- Migration revisions required:
- RLS revisions required:
- Documentation revisions required:
- Production readiness recommendation:
```

## Manual Checks Still Required

- Confirm the migration runs against a database that matches the real production baseline.
- Confirm the RLS smoke-test JWT setup matches the active Supabase environment.
- Confirm backup and rollback procedures before production execution.
- Confirm whether task/settings additions should remain in this migration or be split before production.

## Release 0.6C Milestone 3 Status

Milestone 3 prepared this validation guide but did not execute the migration.

## Release 0.6C Milestone 4 Status

Milestone 4 documented the execution-pending path because SQL tooling was not available in the earlier workspace context.

## Release 0.6C Milestone 5 Status

Milestone 5 executed the migration against the disposable local Supabase database, revised the migration for compatibility with the earlier local foundation draft, reran the migration successfully, reran it for idempotency, and completed validation SQL plus RLS smoke tests.

## Release 0.6C Milestone 6 Status

Milestone 6 executed the revised migration against fresh schema-only and staging-like disposable local databases, revised the migration to grant authenticated module-table privileges required for clean installs, reran the migration successfully for idempotency, and completed validation SQL, RLS smoke tests, and task compatibility checks without touching production or changing runtime app behavior.

## Release 0.6C Milestone 7 Status

Milestone 7 ran app smoke tests against the migrated local Supabase API, found and fixed missing post-migration auth user bootstrap with a database trigger, reran the migration locally, and passed auth, profile, household, preferences/settings, task CRUD, and representative module compatibility smoke tests. Production remains untouched and blocked pending backup/rollback review and owner go/no-go approval.
