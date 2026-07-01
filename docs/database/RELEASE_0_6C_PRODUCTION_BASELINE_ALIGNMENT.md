# Release 0.6C Production Baseline Alignment

## Purpose

Release 0.6C cannot be re-attempted in production until production matches the current repository baseline for authenticated, user-owned module rows.

The first production attempt against `dsowansazqleudupnjug` failed safely during the Release 0.6C migration preflight because production module tables do not have `user_id` ownership columns. Follow-up catalog checks confirmed the affected tables still use older public/open policies.

## Current Production Drift

Production currently differs from `supabase/schema.sql` in the auth ownership layer:

- module tables are missing `user_id uuid references auth.users(id) default auth.uid()`;
- module tables have RLS enabled but still use public/open policies such as `Allow all for anon` or `open`;
- the current repository baseline expects `familyos_user_all` policies scoped to `user_id = auth.uid()`;
- Release 0.6C household foundation migration intentionally refuses to run without that baseline.

The failed Release 0.6C attempt rolled back before creating foundation tables.

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

## Required Owner Decision

Existing production rows need an explicit owner assignment before the open/public policies can be replaced with user-owned RLS.

Owner decision required:

- choose one existing Supabase auth user UUID to own all current production module rows; or
- provide a table-by-table or row-by-row ownership map; or
- choose to leave existing rows unowned temporarily and accept that they will be hidden once user-owned RLS is enabled.

Recommendation:

- Use one existing adult/owner auth user UUID as the temporary owner for all existing production rows.
- After Release 0.6C household foundation is applied, later household-aware app work can share records through household context rather than direct user ownership.

Do not guess this UUID in code or documentation. It must be supplied and approved by the owner before production execution.

## Alignment Plan

1. Capture fresh production backup artifacts.
2. Confirm the production project ref is `dsowansazqleudupnjug`.
3. Confirm the chosen owner auth user UUID.
4. Apply an idempotent auth ownership baseline migration that:
   - adds nullable `user_id` columns with `auth.uid()` defaults;
   - backfills existing null `user_id` values to the approved owner UUID;
   - creates `user_id` indexes;
   - grants module-table DML to `authenticated`;
   - drops older public/open policies;
   - creates `familyos_user_all` policies scoped to `user_id = auth.uid()`;
   - keeps existing table data intact.
5. Run validation SQL for row counts, `user_id` backfill, policy names, and app reads/writes.
6. Re-run the Release 0.6C household foundation migration after baseline alignment passes.

## Migration Requirements

The production baseline alignment migration must:

- be idempotent and rerunnable;
- fail before changing policies if an approved owner UUID is not supplied and existing rows need ownership;
- preserve existing rows;
- avoid hardcoding a personal UUID in committed source;
- avoid changing Release 0.6C household tables;
- leave `household_id` work to the existing Release 0.6C migration;
- document the exact owner UUID used in private operational notes, not committed docs.

## Validation SQL Scope

Before migration:

- count rows in each affected module table;
- confirm `auth.users` count;
- confirm existing public/open policy names;
- confirm `user_id` columns are absent.

After migration:

- confirm every affected table has `user_id`;
- confirm every existing row with data has non-null `user_id`;
- confirm every affected table has `familyos_user_all`;
- confirm older public/open policies are removed;
- confirm authenticated app reads/writes work for the owner user;
- confirm anon access is denied where expected.

## Stop Conditions

Stop before production execution if:

- the owner UUID is not approved;
- backups are not captured;
- production target verification fails;
- row counts change unexpectedly between backup and migration;
- policy validation differs from the expected older public/open state;
- app smoke tests fail after baseline alignment.

## Recommended Next Work Package

Create and validate the production auth ownership baseline migration against a disposable local database that mirrors the observed production drift, then request explicit owner approval for the production owner UUID before applying it to production.
