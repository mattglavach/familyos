# Database Schema

## Release 0.6C Data Foundation

Release 0.6C starts the migration from Release 0.6B browser-local metadata to durable Supabase-backed household data. See `docs/database/RELEASE_0_6C_DATA_FOUNDATION_PLAN.md` for the Milestone 1 audit, current gaps, and proposed schema direction.

No Release 0.6C migration has been applied yet. The current executable database remains `supabase/schema.sql`, which uses user-owned rows and `user_id = auth.uid()` RLS policies.

Milestone 2 adds a production migration draft at `supabase/migrations/20260701_release_0_6c_household_foundation.sql`. It is not applied by this milestone. The draft creates the household foundation tables, adds nullable `household_id` compatibility columns to existing module tables, adds structured task metadata columns, and preserves existing module-table `user_id` RLS behavior for staged rollout.

Milestone 3 adds the dry-run and smoke-test guide at `docs/database/RELEASE_0_6C_MIGRATION_VALIDATION.md`. Milestone 5 executed the draft against the disposable local Supabase database, revised the migration for compatibility with the earlier local-only 20260627 foundation tables, and passed the revised execution, idempotency re-run, validation SQL, and RLS smoke tests.

Milestone 6 validated the revised migration against fresh schema-only and staging-like disposable local databases. A second validated migration revision grants `select`, `insert`, `update`, and `delete` on existing module tables to `authenticated` so current user-owned RLS policies can continue to work on clean installs.

Milestone 7 ran app smoke tests against the migrated local Supabase API. The smoke test found and fixed missing bootstrap behavior for auth users created after the migration; the migration now adds `public.familyos_bootstrap_auth_user()` and an `auth.users` insert trigger that creates the user's profile, default household, owner membership, household settings, user preferences, and bootstrap mapping.

Production note: the first Release 0.6C production attempt failed safely because production is missing the earlier `user_id` ownership baseline expected by `supabase/schema.sql`. See `docs/database/RELEASE_0_6C_PRODUCTION_BASELINE_ALIGNMENT.md` before re-attempting Release 0.6C production migration.

The selected household role vocabulary is `owner`, `adult`, `teen`, `child`, and `viewer`. `owner` can manage household membership, `adult` can manage household operating data, and `teen`/`child`/`viewer` are conservative read-oriented roles until child-safe product flows are implemented.

Compatibility note: the migration keeps `people.member_type = 'child_profile'` valid alongside the Release 0.6C member-type values so local/staging databases that already ran the 20260627 household foundation draft remain upgradeable.

## Core Tables

### profiles
Stores authenticated user profile details.

### households
Represents the family/household.

### people
Stores durable household people and family member records, including people who do not authenticate.

Release 0.6B implementation note: the current dashboard family member manager is client-side only and stores editable member preferences in browser localStorage. No Supabase family member table is used by the current deployed app until the household/family member migration is applied in a later database milestone.

### household_members
Connects authenticated users and optional people records to households with role-based access.

### household_settings
Stores household-wide defaults such as task defaults when they should be shared.

### user_preferences
Stores user-specific defaults such as preferred household or default person.

### tasks
Stores chores, reminders, and general tasks.

Release 0.6B implementation note: the applied Supabase `tasks` table currently persists `title`, `category`, `priority`, `due_date`, `recurring_interval_days`, `last_completed`, `is_important`, `notes`, and `completed`. The task MVP uses browser localStorage metadata keyed by task id for `assignee`, detailed `status`, `created_at`, and `completed_at` until the future shared household task schema is migrated.

### finance_accounts
Stores accounts for net worth and planning.

### transactions
Stores financial transactions if imported or manually added.

### retirement_accounts
Stores retirement planning balances and assumptions.

### college_accounts
Stores 529 and education savings details.

### pool_tests
Stores pool chemistry readings.

### pool_maintenance
Stores pool maintenance actions.

### garden_plants
Stores plants and garden layout.

### home_assets
Stores home systems and equipment.

### vehicles
Stores vehicles.

### vehicle_maintenance
Stores vehicle maintenance records.

### documents
Stores document metadata.

### medical_records
Stores non-emergency medical notes and records.

## Schema Rules
- Use `id` primary keys.
- Use `created_at` and `updated_at`.
- Use `household_id` where data belongs to the family.
- Use foreign keys.
- Use indexes on frequently queried fields.
- Use Row Level Security.
