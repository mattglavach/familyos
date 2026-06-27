# Database And Supabase Review

Audit date: 2026-06-27

## Schema Review

Current executable schema: `supabase/schema.sql`.

Implemented tables:

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

The schema is practical for the current modules, but it is module-specific rather than platform-oriented.

## RLS / Security Review

Strengths:

- `supabase/schema.sql` enables row-level security for every listed app table.
- Each listed table gets a `user_id uuid references auth.users(id) on delete cascade default auth.uid()`.
- Each listed table gets a `familyos_user_all` policy scoped to `user_id = auth.uid()`.
- A `user_id` index is created for each table.

Risks:

- Current RLS is per-user, not per-household. This conflicts with `docs/database/SECURITY_RLS.md` and platform docs that say `household_id` should be the access-control anchor.
- No household membership/role table exists, so family sharing cannot be implemented safely without schema changes.
- The API route `api/brief.js` is not tied to Supabase auth and cannot enforce user-specific access rules.
- RLS policy names are generic and created in a loop. This is compact, but explicit migrations may be easier to review.

## Migration Review

- No `supabase/migrations/` folder exists.
- `supabase/schema.sql` is the current setup script, but it does not provide chronological migration history.
- `supabase/backfill-user-id.sql` is a one-off migration-like script, but it is not under a migration system.
- `supabase/seed.sql` contains seed data setup, but there is no documented repeatable local database workflow.

Recommendation: introduce timestamped migrations before the next schema change.

## Naming And Relationship Review

Strengths:

- Table and column names generally use lowercase snake_case.
- Primary keys are consistently `id`.
- Most tables use clear domain names.

Issues:

- Most tables do not include `created_at` and `updated_at`, despite `docs/database/DATABASE_SCHEMA.md` listing them as schema rules.
- Many relationships are implicit. For example, college deadlines, essays, schools, and test plans are not tied to a person/child record.
- Pool readings, treatments, schedule, settings, and maintenance are not tied to an asset/property.
- Finance tables are not linked to a household, person, institution, document, or timeline entry.
- `notes` has a simple `tag`, but platform docs describe module-aware notes with `module_key`, linked entity type, and linked entity id.

## Missing Indexes / Likely Performance Risks

Current schema only creates `user_id` indexes. Likely future indexes:

- `tasks(user_id, completed, due_date)`
- `tasks(user_id, category)`
- `home_maintenance(user_id, last_completed)`
- `pool_readings(user_id, logged_at desc)`
- `pool_treatments(user_id, logged_at desc)`
- `college_deadlines(user_id, completed, due_date)`
- `college_essays(user_id, status, due_date)`
- `retirement_accounts(user_id, name)`
- `net_worth_snapshots(user_id, date desc)`
- Future household model: indexes on `household_id`, `module_key`, `status`, `owner_person_id`, and `linked_entity_type/linked_entity_id`.

## Gaps Between Docs And Actual Code

- `docs/database/DATABASE_SCHEMA.md` lists `profiles`, `households`, `family_members`, `finance_accounts`, `transactions`, `pool_tests`, `garden_plants`, `home_assets`, `vehicles`, `vehicle_maintenance`, `documents`, and `medical_records`; these are not in `supabase/schema.sql`.
- `supabase/schema.sql` includes `pool_readings`, `pool_treatments`, `pool_schedule`, `pool_settings`, `college_*`, `sat_scores`, `mortgage`, `other_debt`, and `finance_action_items`; several of these are not represented in the high-level database doc.
- Platform docs say `household_id`; SQL uses `user_id`.
- Platform docs prefer shared `tasks`, `documents`, `events`, `notes`, `goals`, `metrics`, `reminders`, and `timeline_entries`; SQL remains module-specific.

## Recommendations

1. Decide whether Phase 2 will support household sharing. If yes, design `households`, `household_members`, and RLS before adding more modules.
2. Add migrations and treat `schema.sql` as a generated/current-state snapshot or setup helper.
3. Add `created_at` and `updated_at` to mutable tables in a migration.
4. Add indexes for common dashboard and module queries.
5. Introduce platform entities gradually: `households`, `people`, `assets`, `documents`, `events`, `metrics`, and `timeline_entries`.
6. Update database docs to distinguish current schema from target platform schema.

