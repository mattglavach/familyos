# Release 0.6C Data Foundation Plan

## Purpose

Release 0.6C moves Family OS from Release 0.6B's browser-local dashboard features toward durable, multi-device Supabase-backed data. Milestone 1 was an audit and plan only. Milestone 2 adds a production migration draft, but does not apply it or change runtime app behavior.

## Current Executable Schema

`supabase/schema.sql` is still the production baseline. It creates module tables such as `tasks`, `notes`, `home_maintenance`, pool tables, college planning tables, retirement/finance tables, and then adds:

- `user_id uuid references auth.users(id) default auth.uid()`
- per-table `user_id` indexes
- Row Level Security
- `familyos_user_all` policies scoped to `user_id = auth.uid()`

The executable schema does not currently create:

- `profiles`
- `households`
- `household_members`
- `people` / durable family member records
- household settings or user preferences
- calendar connection records
- structured task assignee/status metadata beyond the existing `tasks` columns

## Existing Migration Work To Reuse

Do not duplicate the earlier household foundation work. The existing local-only migration at `supabase/migrations/20260627_household_foundation.sql` already drafts:

- `profiles`
- `households`
- `people`
- `household_members`
- `familyos_internal.household_bootstrap_map`
- nullable `household_id` on current module tables
- bootstrap/backfill from current `user_id` data
- initial RLS helpers and policies for the new foundation tables

That migration is explicitly marked local-only and not production-ready. Release 0.6C Milestone 2 converts the same foundation direction into `supabase/migrations/20260701_release_0_6c_household_foundation.sql` rather than creating a competing household model.

## Milestone 2 Production Draft

The production migration draft:

- creates `profiles`, `households`, `people`, `household_members`, `household_settings`, and `user_preferences`;
- creates `familyos_internal.household_bootstrap_map` for support/backfill traceability;
- adds nullable `household_id` columns to existing module tables while retaining `user_id`;
- adds task metadata columns for `assigned_person_id`, `status`, `created_at`, `updated_at`, `completed_at`, `module_key`, `created_by_user_id`, and `updated_by_user_id`;
- bootstraps one default household per existing auth user;
- creates default owner membership, household settings, and user preference rows;
- enables RLS for only the new foundation tables;
- intentionally leaves current module-table `user_id` RLS policies unchanged.

The draft should be reviewed and dry-run against a staging Supabase copy before production. Milestone 3 adds the validation checklist and dry-run guide at `docs/database/RELEASE_0_6C_MIGRATION_VALIDATION.md`.

## Release 0.6B Local Storage Audit

Release 0.6B intentionally stores several new features locally because the schema was not ready:

| Area | Local Storage Key(s) | Source | Missing Durable Model |
| --- | --- | --- | --- |
| Family members | `familyos_family_members_v1` | `src/modules/dashboard/useFamilyMembers.js` | `people` plus optional `household_members.person_id` linkage |
| Settings/Profile | `familyos_settings_v1` | `src/modules/settings/localSettings.js` | `household_settings` and/or `user_preferences` |
| Task metadata | `familyos_task_metadata_v1` | `src/modules/tasks/Tasks.js` | task columns for assignee, status, created/completed timestamps, and module ownership |
| Google Calendar | `gc_token`, `gc_user_name`, `gc_last_synced_at` | `src/hooks/useGoogleCalendar.js` | `calendar_connections` and eventually durable imported `events` |

Out-of-scope local storage also exists for AI/pool/finance helper state, such as brief history and dismissed pool recommendations. Those should be audited in a later AI/settings persistence pass, not mixed into the minimal 0.6C data foundation.

## Current Gaps

### Household Ownership

Current app data is owned by authenticated users through `user_id`. Family OS needs a household boundary so multiple adult users can share the same operational records.

Gap: no applied `households`, `household_members`, or active household context.

### User Profiles

Supabase Auth users exist, but app-visible profile fields are not persisted in public tables.

Gap: no applied `profiles` table for display name, avatar, or default app identity.

### Family Members

Release 0.6B family member management is local-only and cannot sync across devices.

Gap: no applied `people` table and no durable link between a person, household, and optional auth user.

### Tasks

The applied `tasks` table persists core fields:

- `title`
- `category`
- `priority`
- `due_date`
- `recurring_interval_days`
- `last_completed`
- `is_important`
- `notes`
- `completed`

Release 0.6B adds local metadata for:

- assignee
- detailed status
- created date
- completed date

Gap: `tasks` lacks structured assignment, status, lifecycle timestamps, and household/module ownership fields.

### Settings / Preferences

Settings/Profile currently saves household name, default family member, and task defaults in browser storage.

Gap: no household-level settings table and no user-level preferences table.

### Calendar

Google Calendar still uses browser token storage and in-memory fetched events.

Gap: no server-side calendar connection model, no durable sync metadata, and no imported event table.

## Minimal Schema Direction

Release 0.6C should proceed in phases. The first production migration should stay conservative and preserve the existing app while creating durable foundations.

### Phase 1: Foundation Tables

Create or finalize:

- `profiles`
  - `id uuid primary key references auth.users(id)`
  - `email text`
  - `display_name text`
  - `avatar_url text`
  - `created_at timestamptz`
  - `updated_at timestamptz`

- `households`
  - `id uuid primary key`
  - `name text not null`
  - `created_by_user_id uuid references auth.users(id)`
  - `status text default 'active'`
  - bootstrap trace fields if retained from the existing draft
  - timestamps

- `people`
  - `id uuid primary key`
  - `household_id uuid references households(id)`
  - `first_name text`
  - `last_name text`
  - `display_name text`
  - `relationship text`
  - `member_type text`
  - `color text`
  - `status text default 'active'`
  - `notes text`
  - timestamps

- `household_members`
  - `id uuid primary key`
  - `household_id uuid references households(id)`
  - `user_id uuid references auth.users(id) null`
  - `person_id uuid references people(id) null`
  - `role text`
  - `status text default 'active'`
  - timestamps

Milestone 2 standardizes household roles as `owner`, `adult`, `teen`, `child`, and `viewer`.

Rationale:

- `owner` is clearer than `admin` for the person who controls membership and household-level settings.
- `adult` covers trusted household operators without making every adult a membership owner.
- `teen`, `child`, and `viewer` reserve conservative read-limited roles for future child-safe and guest-like experiences without granting management rights.

Initial RLS treats `owner` and `adult` as household managers for people/settings data, reserves membership changes for `owner`, and keeps `teen`/`child`/`viewer` read-oriented.

### Phase 2: Compatibility Household Columns

Add nullable `household_id` to existing module tables while keeping `user_id` and existing RLS policies.

Backfill one default household per current user, matching the existing draft migration's compatibility approach.

Do not make `household_id` non-null or replace module-table RLS until the app can resolve and write the active household.

### Phase 3: Structured Task Metadata

Extend `tasks` conservatively:

- `household_id uuid`
- `assigned_person_id uuid references people(id) null`
- `status text default 'not_started'`
- `created_at timestamptz default now()`
- `completed_at timestamptz null`
- `module_key text default 'tasks'`
- optional `created_by_user_id` / `updated_by_user_id`

Keep existing `completed`, `last_completed`, and recurrence fields during compatibility. Map Release 0.6B local task metadata into these columns after migration.

### Phase 4: Settings / Preferences

The Milestone 2 draft adds:

- `household_settings`
  - `household_id uuid primary key references households(id)`
  - `household_name` can remain on `households.name`; table should store household-wide defaults only when needed
  - `default_task_category text`
  - `default_task_priority text`
  - timestamps

- `user_preferences`
  - `user_id uuid primary key references auth.users(id)`
  - `default_household_id uuid references households(id)`
  - `default_person_id uuid references people(id)`
  - UI/task defaults that are personal rather than household-wide
  - timestamps

Do not put personal display preferences or OAuth token state directly on `households`.

### Phase 5: Calendar Connection Planning

Do not implement server-side OAuth token storage in Milestone 1. The minimal direction is:

- `calendar_connections`
  - `id uuid primary key`
  - `household_id uuid references households(id)`
  - `user_id uuid references auth.users(id)`
  - `provider text`
  - `calendar_id text`
  - `status text`
  - `last_synced_at timestamptz`
  - encrypted or server-managed token fields only after an OAuth/security design is approved

- Future `events`
  - `household_id`
  - `calendar_connection_id`
  - provider event id and source metadata
  - normalized start/end times
  - optional person assignment

## Migration Guardrails

- Keep Release 0.6B runtime behavior unchanged until migrations are reviewed.
- Keep current `user_id` columns during compatibility.
- Do not replace module RLS until household backfill, app active-household context, and smoke tests pass.
- Treat finance, retirement, calendar, college, documents, and future AI context as privacy-sensitive.
- Run migration work against a local or staging Supabase copy before production.
- Add explicit rollback/support notes before applying any production migration.

## Milestone 3 Validation Preparation

Milestone 3 does not apply the migration. It adds a dedicated validation guide covering:

- syntax and idempotency checks;
- bootstrap and backfill expectations;
- foundation-table RLS behavior;
- owner, adult, teen, child, viewer, and non-member smoke tests;
- existing user-owned module-table compatibility;
- rollback considerations and production readiness gates.

Execution remains pending until the migration can be run with `psql` or the Supabase CLI against a disposable local or staging database.

## Milestone 4 Dry-Run Attempt

Milestone 4 rechecked this workspace for SQL tooling. Neither `psql` nor the Supabase CLI is available here, so the dry run was not executed and no migration revisions were made from runtime findings.

The validation guide now includes:

- exact pending commands for local/staging execution;
- an explicit execution-pending status;
- a dry-run results template;
- manual checks still required before production readiness.

## Milestone 5 Local Dry Run

Milestone 5 executed the migration against the disposable local Supabase database using `npx supabase status` and `docker exec supabase_db_familyos psql`.

Results:

- Initial migration attempt failed and rolled back because the existing local `20260627` foundation tables did not have `people.status` before the draft tried to create `people_household_status_idx`.
- The migration was revised to upgrade existing foundation tables before indexing:
  - add `people.display_name`, `people.color`, and `people.status` if missing;
  - broaden `people_member_type_check`;
  - broaden `household_members_role_check`.
- Revised migration execution passed.
- Idempotency re-run passed.
- Validation SQL passed for bootstrap counts, duplicate guards, module backfill, task metadata, expected columns, and updated constraints.
- RLS smoke tests passed for owner, adult, teen, child, viewer, non-member denial, and existing user-owned `tasks` compatibility.

Compatibility note: `people.member_type` now accepts `child_profile` in addition to the Release 0.6C values so local/staging databases that previously ran the 20260627 draft remain upgradeable.

## Recommended Milestone 6

Repeat and harden validation before production:

1. Run the revised migration on a fresh schema-only local database.
2. Run the revised migration on a sanitized staging copy with representative production-like data.
3. Confirm app smoke tests still pass against the migrated local/staging database.
4. Document production backup and rollback steps.
5. Decide whether the migration is ready for production application or needs another revision.

## Milestone 6 Fresh and Staging-Like Validation

Milestone 6 validated the revised migration against two disposable local databases:

- `familyos_06c_fresh`, a clean baseline made from a minimal local `auth` prelude plus `supabase/schema.sql`;
- `familyos_06c_stage_like`, a staging-like dataset with representative sanitized rows across `notes`, `tasks`, `pool_readings`, `finance_action_items`, `college_deadlines`, `home_maintenance`, and `mortgage`.

Results:

- Fresh schema baseline apply passed.
- Fresh schema migration execution passed.
- Fresh schema idempotency re-run passed.
- Fresh validation SQL passed.
- Fresh RLS smoke tests passed after fixture setup.
- Staging-like baseline apply passed.
- Staging-like migration execution passed.
- Staging-like idempotency re-run passed.
- Staging-like validation SQL passed.
- Staging-like RLS/task compatibility checks passed.

Validated revision:

- Fresh schema validation found that existing module tables had RLS policies but no `authenticated` table privileges, causing user-owned `tasks` compatibility to fail before RLS could evaluate.
- The migration now grants `select`, `insert`, `update`, and `delete` on each existing module table to `authenticated` while keeping existing `user_id = auth.uid()` RLS policies as the row-level access boundary.

## Recommended Milestone 7

Prepare production readiness without applying the migration:

1. Run app smoke tests against the migrated local database.
2. Document production backup, restore, and rollback steps.
3. Review whether to keep foundation, task metadata, and settings in one production migration or split before production.
4. Prepare a production application checklist and go/no-go decision.

## Milestone 7 App Smoke Tests and Production Readiness

Milestone 7 ran app-facing smoke tests against the migrated local Supabase API. Production was not touched.

Initial finding:

- A disposable local auth user could be created and could sign in with password auth, but post-migration bootstrap rows were missing because the migration only bootstrapped users present at migration time.

Validated revision:

- The migration now adds `public.familyos_bootstrap_auth_user()` and an `after insert on auth.users` trigger.
- The trigger creates the new user's profile, default household, active owner membership, household settings, user preferences, and bootstrap mapping.
- The revised migration re-applied cleanly to the local database.

Smoke-test result:

- Auth/login, profile bootstrap, household bootstrap/current household resolution, owner membership, user preferences read/write, household settings read/write, task list/create/update/delete, and representative module nullable `household_id` compatibility passed.
- Tested representative modules: `notes`, `home_maintenance`, `pool_readings`, `college_deadlines`, and `finance_action_items`.
- No runtime app code changed.
- No localStorage migration behavior changed.

## Recommended Milestone 8

Prepare final production execution readiness:

1. Review and approve the production backup/rollback checklist.
2. Decide whether to apply the combined foundation/task/settings migration as one production migration or split it.
3. Run one final production preflight against the real production baseline counts.
4. If approved, schedule a production migration window and capture owner signoff.

## Milestone 8 Production Readiness Signoff

Milestone 8 reviewed production readiness without applying the migration to production.

Confirmed:

- Production backup method: Supabase-managed backup or PITR marker plus schema-only and targeted data exports.
- Restore/rollback path: full restore from backup/PITR is preferred; partial rollback requires a separately reviewed rollback script and paused writes.
- Migration file: `supabase/migrations/20260701_release_0_6c_household_foundation.sql`.
- Post-migration validation: run the validation SQL and RLS smoke tests from `docs/database/RELEASE_0_6C_MIGRATION_VALIDATION.md`.
- App smoke checks: login, profile bootstrap, household resolution, preferences/settings, task CRUD, representative module compatibility, new auth user bootstrap, non-member denial, and unchanged localStorage behavior.

Recommendation:

- Apply the combined Release 0.6C migration as-is after backup artifacts are captured and owner go/no-go approval is explicitly recorded.
- Do not split the migration unless the owner rejects applying foundation, task metadata, and settings/preference changes together.

## Production Attempt 1 Result

The first production attempt was blocked by preflight schema drift after backup artifacts were captured and the target project was verified.

Result:

- Target project: `dsowansazqleudupnjug` / `FamilyOS`.
- Migration attempted: `supabase/migrations/20260701_release_0_6c_household_foundation.sql`.
- Outcome: failed and rolled back during preflight.
- Cause: production module tables do not yet have the `user_id` ownership columns expected by the Release 0.6C migration.
- Follow-up read-only checks confirmed production still has public/open module-table policies rather than the current repo baseline's user-owned `familyos_user_all` policies.
- No Release 0.6C foundation tables were left behind.

The recommendation to apply the combined Release 0.6C migration as-is is withdrawn until production baseline alignment is complete. The next milestone should reconcile the earlier auth ownership baseline before re-attempting Release 0.6C.
