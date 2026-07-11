# Database Schema

## Release 1.8 Context and attention model

Household Context, Pool trend summaries, and attention items are derived at runtime from household-scoped source records. No attention table is added because conditions resolve with their source state. Existing Release 1.7 treatment fields support the retest workflow. No Release 1.8 migration is required or applied.

## Release 1.7 Pool Operations
Migration `20260711_release_1_7_pool_operations.sql` adds household-scoped `pool_profiles` with member-read and owner/adult-write RLS. It adds test context/water appearance and richer treatment traceability. It is additive and does not rewrite production history.

## Release 0.6C Data Foundation

Release 0.6C starts the migration from Release 0.6B browser-local metadata to durable Supabase-backed household data. See `docs/database/RELEASE_0_6C_DATA_FOUNDATION_PLAN.md` for the Milestone 1 audit, current gaps, and proposed schema direction.

Release 0.6C has been applied to production. Production now has the user-owned auth baseline plus the household foundation schema.

Milestone 2 added a production migration draft at `supabase/migrations/20260701_release_0_6c_household_foundation.sql`. The migration creates the household foundation tables, adds nullable `household_id` compatibility columns to existing module tables, adds structured task metadata columns, and preserves existing module-table `user_id` RLS behavior for staged rollout.

Milestone 3 adds the dry-run and smoke-test guide at `docs/database/RELEASE_0_6C_MIGRATION_VALIDATION.md`. Milestone 5 executed the draft against the disposable local Supabase database, revised the migration for compatibility with the earlier local-only 20260627 foundation tables, and passed the revised execution, idempotency re-run, validation SQL, and RLS smoke tests.

Milestone 6 validated the revised migration against fresh schema-only and staging-like disposable local databases. A second validated migration revision grants `select`, `insert`, `update`, and `delete` on existing module tables to `authenticated` so current user-owned RLS policies can continue to work on clean installs.

Milestone 7 ran app smoke tests against the migrated local Supabase API. The smoke test found and fixed missing bootstrap behavior for auth users created after the migration; the migration now adds `public.familyos_bootstrap_auth_user()` and an `auth.users` insert trigger that creates the user's profile, default household, owner membership, household settings, user preferences, and bootstrap mapping.

Production note: the first Release 0.6C production attempt failed safely because production was missing the earlier `user_id` ownership baseline expected by `supabase/schema.sql`. The follow-up migration `supabase/migrations/20260701_release_0_6c_auth_ownership_baseline.sql` added missing `user_id` ownership columns, backfilled existing module rows to the approved owner, added indexes and grants, and replaced public/open policies with `familyos_user_all` policies. The Release 0.6C household foundation migration was then applied successfully.

Release 0.9 readiness note: the 0.6C auth ownership baseline migration now skips the approved-owner preflight only when a disposable/fresh database has zero module rows to backfill. Databases with existing module rows still require the approved owner UUID before backfill proceeds.

The selected household role vocabulary is `owner`, `adult`, `teen`, `child`, and `viewer`. `owner` can manage household membership, `adult` can manage household operating data, and `teen`/`child`/`viewer` are conservative read-oriented roles until child-safe product flows are implemented.

Compatibility note: the migration keeps `people.member_type = 'child_profile'` valid alongside the Release 0.6C member-type values so local/staging databases that already ran the 20260627 household foundation draft remain upgradeable.

Production validation note: Release 0.6C production validation confirmed 67 existing module rows with non-null `user_id`, non-null `household_id` where applicable, no remaining public/open module policies, no duplicate bootstrap records, and passing app-path smoke tests for owner reads, task CRUD, new-user bootstrap, and non-member denial.

Release 0.7 runtime note: the app now resolves the active household after login and uses the household foundation for people/family members, household settings, user preferences, and structured task metadata. Module tables still preserve the existing user-owned compatibility policies while the frontend writes `household_id` where available.

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

Release 0.9 expands membership lifecycle statuses to `pending`, `active`, `inactive`, `removed`, and `declined`. Active memberships are the only memberships treated as selectable runtime households by the app.

### household_invitations
Stores household invitation metadata for Release 0.9 collaboration.

Rows include `household_id`, normalized `invited_email`, `invited_by`, target `role`, lifecycle `status`, `expires_at`, accepted/declined/revoked timestamps, and a SHA-256 `token_hash`. Raw invite tokens are never stored. The app receives the raw token only from `familyos_create_household_invitation()` so it can show a one-time invite link.

Invitation acceptance uses `familyos_get_household_invitation()`, `familyos_accept_household_invitation()`, and `familyos_decline_household_invitation()` RPCs. Acceptance requires a signed-in user whose auth email matches `invited_email`.

Invitation creation, listing, and revocation are owner-only in Release 0.9. Member role changes and removal remain owner-only through `household_members` RLS.

Release 0.9 validation note: on July 2, 2026, the schema, ordered migrations, and Release 0.9 migration re-run passed against disposable local database `familyos_r09_validation`. Validation confirmed table existence, status/role constraints, token hash uniqueness, no plaintext token columns, owner-only policies, and RPC signatures. Browser smoke tests confirmed invite create, preview, accept, decline, revoke, member role update, member removal, and active-household switching against local Supabase only.

### household_settings
Stores household-wide defaults such as task defaults when they should be shared.

### user_preferences
Stores user-specific defaults such as preferred household or default person.

### calendar_connections
Stores server-side Google Calendar connection metadata for Release 0.8.

Rows are owned by both `user_id` and `household_id`. The frontend can see provider, account email, status, expiry, scopes, last sync, and timestamps, but server API responses must not expose `access_token_ciphertext` or `refresh_token_ciphertext`.

Release 0.8 adds `supabase/migrations/20260701_release_0_8_calendar_connections.sql`. The migration creates the table, indexes, updated-at trigger, authenticated grants, and RLS policies requiring the signed-in user to own the connection and belong to the household. OAuth token exchange, refresh, revoke, encrypted token persistence, and event reads run through `api/calendar.js`, not browser storage.

Release 0.8C uses server-side connection records as the preferred dashboard calendar source. Legacy browser tokens remain only for temporary fallback and are no longer newly persisted by the browser hook.

### tasks
Stores chores, reminders, and general tasks.

Release 0.6B implementation note: the applied Supabase `tasks` table currently persists `title`, `category`, `priority`, `due_date`, `recurring_interval_days`, `last_completed`, `is_important`, `notes`, and `completed`. The task MVP uses browser localStorage metadata keyed by task id for `assignee`, detailed `status`, `created_at`, and `completed_at` until the future shared household task schema is migrated.

### life_lists
Stores generic household, shared, and personal lightweight collections for Release 1.1 Life Lists.

Rows include `household_id`, `user_id`, `owner_user_id`, `name`, `description`, `visibility`, optional `color`/`icon`, `favorite`, `archived`, `category`, `sort_order`, `created_at`, and `updated_at`.

`visibility` supports `personal`, `household`, and `shared`. Personal lists are owner-visible. Household and shared lists are active-household records.

Release 1.1 validation note: the Life Lists migration was applied from an empty disposable local database after the base schema and ordered migration chain, then re-run idempotently. Validation confirmed both tables, required indexes, constraints, grants, RLS enablement, and policies.

### life_list_items
Stores entries inside Life Lists.

Rows include `household_id`, `user_id`, `list_id`, `title`, `description`, `priority`, `status`, `favorite`, optional `assigned_to_person_id`, `tags`, `link_url`, future-ready `image_url`, `completed_at`, `archived`, `sort_order`, `created_at`, and `updated_at`.

`priority` supports `low`, `med`, and `high`. `status` supports `planned`, `in_progress`, `completed`, `someday`, `deferred`, and `archived`.

### shopping_lists
Stores personal, household, and shared shopping lists for Release 1.2 Shopping & Pantry.

Rows include `household_id`, `user_id`, `owner_user_id`, `name`, `description`, `visibility`, `favorite`, `archived`, `category`, optional `color`/`icon`, `sort_order`, future-ready `recipe_ref` and `meal_plan_ref`, `created_at`, and `updated_at`.

`visibility` supports `personal`, `household`, and `shared`. Personal lists are owner-visible. Household and shared lists are readable by active members and manageable by owners/adults.

### shopping_categories
Stores household-scoped shopping category metadata.

Rows include `household_id`, `user_id`, `name`, `color`, `sort_order`, `created_at`, and `updated_at`.

### shopping_items
Stores entries inside shopping lists.

Rows include `household_id`, `user_id`, `list_id`, optional `pantry_item_id`, `name`, `quantity`, `unit`, `category`, `priority`, `purchased`, `notes`, `favorite`, optional `assigned_to_person_id`, `sort_order`, `archived`, `purchased_at`, future-ready `recipe_ref` and `meal_plan_ref`, `created_at`, and `updated_at`.

`priority` supports `low`, `med`, and `high`. Active item state is represented by `purchased` and `archived`.

### pantry_items
Stores simple household inventory for staples.

Rows include `household_id`, `user_id`, `name`, `current_quantity`, `minimum_quantity`, `unit`, `category`, `reorder_flag`, `favorite`, `notes`, `archived`, `sort_order`, future-ready `recipe_ref` and `meal_plan_ref`, `created_at`, and `updated_at`.

Release 1.2 validation note: the Shopping migration was applied after the base schema and ordered migration chain in disposable local Supabase, then catalog and RLS checks confirmed all Shopping/Pantry tables, indexes, constraints, grants, RLS enablement, and policies.

### meal_plans
Stores personal, household, and shared meal planning containers for Release 1.3 Meal Planning.

Rows include `household_id`, `user_id`, `owner_user_id`, `name`, `description`, `plan_type`, `start_date`, `end_date`, `visibility`, `favorite`, `archived`, `notes`, `sort_order`, future-ready `nutrition_ref`, `health_ref`, and `ai_ref`, `created_at`, and `updated_at`.

`plan_type` supports `weekly`, `monthly`, and `custom`. `visibility` supports `personal`, `household`, and `shared`.

### recipe_categories
Stores household-scoped recipe category metadata.

Rows include `household_id`, `user_id`, `name`, `color`, `sort_order`, `created_at`, and `updated_at`.

### recipes
Stores personal, household, and shared recipes.

Rows include `household_id`, `user_id`, `owner_user_id`, `title`, `description`, `category`, `meal_type`, prep/cook time, `servings`, `difficulty`, `instructions`, `notes`, `favorite`, media/source URL placeholders, `tags`, `visibility`, `archived`, `sort_order`, future-ready `nutrition_ref`, `health_ref`, and `ai_ref`, `created_at`, and `updated_at`.

`meal_type` supports `breakfast`, `lunch`, `dinner`, `snack`, and `other`. `difficulty` supports `easy`, `medium`, and `hard`.

### recipe_ingredients
Stores structured ingredients for recipes.

Rows include `household_id`, `user_id`, `recipe_id`, `ingredient`, `quantity`, `unit`, `optional`, optional `pantry_item_id`, optional `shopping_item_id`, `notes`, `sort_order`, `created_at`, and `updated_at`.

Ingredient access inherits from the parent recipe.

### meal_assignments
Stores dated meal slots inside meal plans.

Rows include `household_id`, `user_id`, `meal_plan_id`, optional `recipe_id`, `meal_date`, `meal_type`, `title`, `notes`, `favorite`, `archived`, optional `shopping_list_id`, future-ready `nutrition_ref`, `health_ref`, and `ai_ref`, `created_at`, and `updated_at`.

Assignment access inherits from the parent meal plan. Release 1.3 validation note: the Meal Planning migration was applied after the base schema and ordered migration chain in disposable local Supabase, then catalog and RLS checks confirmed all Meal Planning tables, indexes, constraints, grants, RLS enablement, and policies.

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

### Release 1.4 Pool Care Assistant

Release 1.4.0 adds `supabase/migrations/20260703_release_1_4_pool_care_assistant.sql`.

`pool_readings` now includes test source, recent weather notes, recent heavy usage, and timestamps in addition to chemistry readings. Supported test sources are Taylor Kit, Pool Store, Manual, and future-only Pentair/Home Assistant values.

Current app create flows allow partial Pool Test logs. `pool_readings.ph` and `pool_readings.free_chlorine` remain nullable, and app validation requires at least one tested value, note, rain context, or party/heavy-use context before insert. Party context maps to `recent_heavy_usage`; Rain is stored in `recent_weather_notes`. No new migration is required for these context fields.

Preview validation note: on July 6, 2026, post-deploy preview validation found the linked FamilyOS Supabase project had household foundation and Calendar schema but was missing Release 0.9 invitations and Release 1.1-1.4 module migrations. The missing migrations were applied to restore durable writes for Pool, Life Lists, Shopping, and Meal Planning. `pool_action_audits.reading_id` now matches the remote `pool_readings.id` UUID type.

`pool_treatments` now includes water clarity and timestamps so chemical additions, SWG changes, and related observations can appear in the treatment timeline.

`pool_maintenance` now supports optional `equipment_id`, water clarity, timestamps, and Pool notes such as weather or party context.

`pool_schedule` now supports optional equipment linkage and maintenance type metadata for recurring reminders such as filter cleaning, SWG cleaning, pump inspection, robot maintenance, Betta cleaning, reagent replacement, season opening, and season closing.

`pool_equipment` stores Pool equipment inventory. Rows include `household_id`, `user_id`, type, name, brand, model, install date, last maintenance, next maintenance, warranty notes, manual link, notes, active state, and timestamps.

`pool_action_audits` stores recommendation audit history. Rows include `household_id`, `user_id`, optional `reading_id`, recommendation id, action, explanation, confidence, safety note, status, confirmed/completed timestamps, notes, and timestamps. This table supports future AI Coach traceability without adding AI runtime behavior in Release 1.4.0.

Release 1.4.0 validation passed against disposable/local Supabase only. The migration applies from an empty schema, the ordered migration chain applies cleanly through Release 1.4, re-running the 1.4 migration is acceptable, and Pool table, index, trigger, grant, RLS, and policy catalog checks passed. RLS validation also confirmed owner/adult writes, viewer read-only access, cross-household denial, and same-household checks for linked equipment/readings in maintenance, schedule, and action audit rows.

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
