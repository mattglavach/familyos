# Current State Review

Review date: 2026-06-27

## Current Data Model Summary

The executable schema in `supabase/schema.sql` is a Phase 1, user-owned schema. It defines module-specific tables for notes, tasks, home maintenance, pool, college planning, retirement, mortgage/debt/net worth, and finance action items. It does not define `profiles`, `households`, `household_members`, `people`, `documents`, `events`, `metrics`, `reminders`, or `timeline_entries`.

Current tables are created in `supabase/schema.sql:3-233`, then a loop adds ownership/security metadata to each table at `supabase/schema.sql:236-258`.

## Where `user_id` Is Used

`user_id` is the current access-control column:

- `supabase/schema.sql:236-237` states that each row is owned by the signed-in user.
- `supabase/schema.sql:251` adds `user_id uuid references auth.users(id) on delete cascade default auth.uid()` to each listed table.
- `supabase/schema.sql:252` creates a `user_id` index per table.
- `supabase/schema.sql:257` creates `familyos_user_all` policies using `user_id = auth.uid()`.
- `README.md:111` documents the same user-scoped behavior.
- `supabase/backfill-user-id.sql:10-32` backfills existing rows with one owner user UUID.
- `supabase/seed.sql:9-131` seeds data by requiring a `seed_user_id` and inserting `user_id` into module tables.

The application does not usually set `user_id` explicitly. Inserts rely on the database default `auth.uid()` through the Supabase session.

## Where `household_id` Is Used

`household_id` is used in documentation only, not in the executable schema or current app code.

Documentation references:

- `docs/database/SECURITY_RLS.md:5` says access should be restricted by `household_id`.
- `docs/database/DATABASE_SCHEMA.md:56` says to use `household_id` where data belongs to the family.
- `docs/platform/01_data_model.md:22` defines people with `household_id`.
- `docs/platform/01_data_model.md:30-39` defines households as the primary security and organization boundary.
- `docs/platform/02_database_schema.md:66` says household-scoped records should use `household_id`.
- `docs/platform/02_database_schema.md:74` says `household_id` is the access-control anchor.

No current SQL line creates a `households` table or a `household_id` column.

## Current Auth Assumptions

The app uses Supabase Auth magic links:

- `src/App.js:411-453` defines `useSupabaseAuth`.
- `src/App.js:419-427` reads the current Supabase session and listens for auth changes.
- `src/App.js:437-440` sends an OTP magic link.
- `src/App.js:469-483` renders the sign-in gate.
- `src/App.js:476` tells users that data stays scoped to their account.
- `src/lib/supabase.js:4-10` creates the Supabase client with persisted session, auto-refresh, and URL session detection.

The current assumption is: one signed-in Supabase user owns their own data.

## Current RLS Assumptions

Current RLS is simple and single-user:

- Every listed table gets RLS enabled (`supabase/schema.sql:253`).
- Every listed table gets a policy allowing authenticated users to operate on rows where `user_id = auth.uid()` (`supabase/schema.sql:257`).
- No household membership check exists.
- No role check exists.
- No child/adult/admin distinction exists.
- No module-specific privacy boundary exists.

## Current Application Data Access

The app reads and writes Supabase directly from the browser:

- `src/lib/supabase.js:1-10` initializes `@supabase/supabase-js`.
- `src/lib/supabase.js:16-55` defines a small wrapper with `select`, `insert`, `update`, and `delete`.
- `src/App.js:489-501` defines `useTable`.
- `src/App.js:493-494` falls back to `SEED[table]` on select errors.
- `src/App.js:498-500` logs write errors and mutates local state as fallback.

This data access pattern relies on RLS for security but does not model household context in the client.

## Gaps And Contradictions

1. Docs say household scope; SQL uses user scope.
2. Docs mention roles (`docs/architecture/AUTHENTICATION.md`) but current auth has no role table or role claim.
3. Platform docs recommend shared tables like `people`, `households`, `assets`, `documents`, `events`, `metrics`, `reminders`, and `timeline_entries` (`docs/platform/02_database_schema.md:20-31`), but SQL uses module-specific tables.
4. Platform docs recommend `module_key` (`docs/platform/02_database_schema.md:33-41`), but current SQL tables generally encode modules in table names.
5. The app has no household selector, household bootstrap flow, invite flow, or role-aware UI.
6. The API route is separate from the current auth model and should be reviewed before AI context expansion.

## Assumptions

- The project is still early enough that a household migration can be performed before large production data volume.
- The user-centered model should remain temporarily as compatibility metadata during migration.
- Future Family OS modules will include sensitive family-level data, not only personal task data.

