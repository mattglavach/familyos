# Release 0.6C Production Baseline Alignment

## Purpose

Release 0.6C production baseline alignment has been completed.

The first production attempt against `dsowansazqleudupnjug` failed safely during the Release 0.6C migration preflight because production module tables did not have `user_id` ownership columns. Follow-up catalog checks confirmed the affected tables still used older public/open policies.

The approved production owner UUID for the alignment backfill was `fc93e654-0305-4b4e-8c48-9edff3c2e800`. The baseline alignment migration now lives at:

- `supabase/migrations/20260701_release_0_6c_auth_ownership_baseline.sql`

## Current Production Drift

Production previously differed from `supabase/schema.sql` in the auth ownership layer:

- module tables are missing `user_id uuid references auth.users(id) default auth.uid()`;
- module tables have RLS enabled but still use public/open policies such as `Allow all for anon` or `open`;
- the current repository baseline expects `familyos_user_all` policies scoped to `user_id = auth.uid()`;
- Release 0.6C household foundation migration intentionally refuses to run without that baseline.

The failed Release 0.6C attempt rolled back before creating foundation tables. The subsequent production baseline alignment added the missing ownership layer, replaced public/open module-table policies, and allowed the Release 0.6C household foundation migration to apply successfully.

## Affected Tables

The production preflight reported these module tables missing `user_id`:

- `notes`
- `tasks`
- `home_maintenance`
- `pool_readings`
- `pool_maintenance`
- `pool_treatments`
- `pool_schedule`
- `pool_settings`
- `college_schools`
- `college_test_plan`
- `college_essays`
- `college_deadlines`
- `sat_scores`
- `college_savings`
- `college_goal`
- `retirement_accounts`
- `retirement_assumptions`
- `mortgage`
- `other_debt`
- `net_worth_snapshots`
- `finance_action_items`

## Owner Decision

Existing production rows need an explicit owner assignment before the open/public policies can be replaced with user-owned RLS.

Decision recorded:

- Existing production module rows are assigned to auth user `fc93e654-0305-4b4e-8c48-9edff3c2e800`.
- This is a compatibility bridge. After household-aware app context ships, shared household access should move through `household_id` and household RLS rather than direct per-user ownership.

## Alignment Execution

1. Captured fresh production backup artifacts.
2. Confirmed the production project ref is `dsowansazqleudupnjug`.
3. Confirmed approved owner auth user UUID `fc93e654-0305-4b4e-8c48-9edff3c2e800`.
4. Applied an idempotent auth ownership baseline migration that:
   - adds nullable `user_id` columns with `auth.uid()` defaults;
   - backfills existing null `user_id` values to the approved owner UUID;
   - creates `user_id` indexes;
   - grants module-table DML to `authenticated`;
   - drops older public/open policies;
   - creates `familyos_user_all` policies scoped to `user_id = auth.uid()`;
   - keeps existing table data intact.
5. Ran validation SQL for row counts, `user_id` backfill, policy names, grants, and app-path reads/writes.
6. Applied the Release 0.6C household foundation migration after baseline alignment passed.

## Migration Requirements

The production baseline alignment migration:

- is idempotent and rerunnable;
- fails fast if the approved owner UUID is absent from `auth.users`;
- preserves existing rows;
- uses the approved owner UUID for production backfill;
- avoids changing Release 0.6C household tables;
- leaves `household_id` work to the Release 0.6C household foundation migration.

## Validation SQL Scope

Before migration:

- count rows in each affected module table;
- confirm `auth.users` count;
- confirm existing public/open policy names;
- confirm `user_id` columns are absent.

After migration:

- every affected table has `user_id`;
- every existing row with data has non-null `user_id`;
- every affected table has `familyos_user_all`;
- older public/open policies are removed;
- authenticated grants are present;
- authenticated app reads/writes work for the owner user;
- non-member access is denied where expected.

Production validation results:

- module tables missing `user_id`: 0.
- module rows with null `user_id`: 0.
- module tables missing `household_id` after the household migration: 0.
- module rows with `user_id` but missing `household_id`: 0.
- module tables with public/open policies remaining: 0.
- module tables with RLS disabled: 0.
- module tables missing `authenticated` DML grants: 0.
- production module rows validated: 67.

## Stop Conditions

Stop before production execution if:

- the owner UUID is not approved;
- backups are not captured;
- production target verification fails;
- row counts change unexpectedly between backup and migration;
- policy validation differs from the expected older public/open state;
- app smoke tests fail after baseline alignment.

## Release 0.6C Closeout Status

Baseline alignment is complete and validated. The Release 0.6C household foundation migration was applied immediately after baseline alignment and passed production validation.
