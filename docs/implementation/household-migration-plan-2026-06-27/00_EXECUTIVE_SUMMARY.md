# Household Migration Implementation Plan Executive Summary

Plan date: 2026-06-27

## Migration Objective

Move Family OS from the current user-owned data model to a household-centered architecture without breaking the existing app, losing data, or weakening RLS.

The first migration should establish household ownership while preserving the current `user_id` model as compatibility and attribution metadata until app queries, RLS, and validation are proven.

## Final Architecture Direction

Accepted direction from `docs/decisions/2026-06-27-household-architecture/`:

- `households` becomes the primary ownership boundary.
- `household_members` enforces membership and roles.
- Authenticated users remain individual Supabase Auth users.
- Children are `people` records only for now, not login users.
- Active roles for first migration: `owner`, `adult`.
- Reserved/non-login roles: `child_profile`, `guest_future`.
- Shared module tables get `household_id`.
- RLS moves from direct `user_id = auth.uid()` to household membership checks.

## What Changes First

First planning/execution sequence:

1. Confirm current `supabase/schema.sql` is the baseline.
2. Draft a migration for `profiles`, `households`, `household_members`, and `people`.
3. Draft a migration adding nullable `household_id` to current shared module tables.
4. Draft backfill logic that creates one default household per existing `user_id`.
5. Keep `user_id` and old policies until app access and household RLS are verified.
6. Prepare app data access for active household context.

## What Is Deferred

Deferred from first migration:

- Running migrations.
- Dropping or renaming `user_id`.
- Guest access.
- Child login.
- Invitation UX.
- Multi-household switching UI.
- Per-record privacy controls.
- Full AI memory.
- Document storage redesign.
- Calendar server-side OAuth token storage.
- Route-aware navigation.
- TypeScript migration.

## Top Risks

1. Current RLS is `user_id = auth.uid()` in `supabase/schema.sql:257`; replacing it too early can lock out valid users.
2. `src/App.js:489-501` uses a generic `useTable` hook with seed fallback on errors; this can hide migration/RLS failures.
3. Feature code reads many tables directly through `useTable`, including Dashboard, Tasks, Pool, Finance, College, and Quick Add.
4. `35fc55a updates from codex` included broad app/schema/config changes and must be reviewed before migration execution.
5. Finance, retirement, documents/future, and AI context need adult/owner-only access from the start.

## Recommended Go / No-Go

Recommendation: **Go for drafting migration files in a future task; no-go for applying migrations.**

Do not run migrations until:

- Current committed baseline is reviewed.
- Table ownership mapping is confirmed.
- RLS helper strategy is reviewed.
- Rollback plan is written beside the draft migration.
- Local verification path exists.

## Readiness Score

**6 / 10 for migration planning.**

The architecture decisions are resolved enough to write draft migrations. The project is not yet ready for execution because app data access, RLS tests, baseline review, and rollback details still need to be prepared.

## Verification Approach

Verification should happen in layers:

- Static review of draft SQL before applying anywhere.
- Local/disposable Supabase project migration test.
- Row-count validation before and after backfill.
- RLS tests for owner, adult, non-member, child profile, and guest future.
- App smoke test for auth, Home, Finance, Pool, Tasks, College, Quick Add, and Calendar connect.
- `pnpm run check` after app data-access changes.

