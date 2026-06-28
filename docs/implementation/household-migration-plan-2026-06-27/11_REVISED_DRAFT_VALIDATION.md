# Revised Draft Validation

Validation date: 2026-06-28

Reviewed:

- `docs/implementation/household-migration-plan-2026-06-27/draft_sql/2026-06-27_household_foundation_draft.sql`
- `docs/implementation/household-migration-plan-2026-06-27/09_DRAFT_SQL_VALIDATION.md`
- `docs/implementation/household-migration-plan-2026-06-27/10_REVISED_DRAFT_SQL_NOTES.md`

## Overall Assessment

Status: **ready to prepare as a local-only migration draft after manual checklist review**.

Status is **not** production-ready. The revised SQL is structurally coherent for a Supabase local dry run, but it has not been parsed or executed against a database in this review. It should only move into a local migration file after a human confirms the manual checklist below.

No Supabase commands were run. No migration was applied. No production data was touched. No application code was changed.

## Draft SQL Safety Properties Confirmed

The reviewed draft already includes these safety properties:

- Changed preflight/postflight count variables from `integer` to `bigint` because PostgreSQL `count(*)` returns `bigint`.
- Added explicit `revoke all` statements for `familyos_internal` schema and `familyos_internal.household_bootstrap_map` from `public`, `anon`, and `authenticated`.
- Added a post-insert repair update so bootstrap owner memberships are forced back to `role = 'owner'` and `status = 'active'` on rerun.

No SQL changes were needed during this validation pass. The draft remains in `docs/implementation/.../draft_sql/` and no migration was applied.

## Critical Blockers

No critical blocker remains for **local-only dry-run preparation**.

Critical blockers remain for production:

- The draft has not been executed in a local Supabase database.
- The real production schema has not been compared against `supabase/schema.sql`.
- Existing production row counts, null `user_id` counts, and auth user counts are unknown.
- App code does not yet resolve active household context.
- Module-table RLS remains intentionally unchanged.

## Strict SQL Review

### Syntax Risks

Static review did not find an obvious ordering or dependency error, but syntax is not proven until a local Postgres/Supabase parse.

Areas to verify in local dry run:

- `auth.uid()` is available in the local Supabase environment.
- Roles `anon` and `authenticated` exist before the internal schema/table revoke statements.
- Dynamic SQL in preflight and backfill blocks parses correctly.
- `create extension if not exists "pgcrypto"` is permitted in the local environment.

### Table And Schema Creation Order

Order is valid:

1. `familyos_internal` schema is created before the internal mapping table.
2. `profiles` references `auth.users`.
3. `households` references `auth.users`.
4. `people` references `households`.
5. `household_members` references `households`, `auth.users`, and `people`.
6. `familyos_internal.household_bootstrap_map` references `auth.users` and `households`.
7. Module tables receive nullable `household_id` only after `households` exists.

### RLS Policy Correctness

Foundation-table RLS is now executable and scoped to:

- `profiles`
- `households`
- `household_members`
- `people`

No module-table RLS replacement is included.

The policy model is conservative:

- Users can read/update their own profile.
- Active owner/adult members can read their household, members, and people.
- Owners can update household settings and manage member rows.
- Owner/adult members can manage `people`.
- No delete policies are included.

This is appropriate for a local dry run.

### `auth.uid()` Assumptions

The RLS helpers depend on Supabase's `auth.uid()` function. That is valid for Supabase Postgres, but this draft should not be tested against plain Postgres without Supabase auth helpers.

### Security Definer Function Risks

The helper functions are `security definer` and use `set search_path = public`, which is the right direction. The draft now revokes public execute and grants execute to `authenticated`.

Manual review still needs to confirm:

- Function owner after migration.
- Whether function ownership bypasses RLS as expected.
- Whether helper recursion is avoided in local RLS tests.

### Index And Constraint Risks

Indexes are reasonable for local dry run.

Remaining constraint gaps:

- `household_members.person_id` is not guaranteed to belong to the same household as `household_members.household_id`.
- `bootstrap_source_user_id` uniqueness prevents duplicate bootstrap households but does not deduplicate manually created households.
- Existing null `user_id` rows remain unmapped by design.

### Idempotency On Rerun

The revised draft is materially idempotent for local rerun:

- Tables and columns use `if not exists`.
- Bootstrap households are keyed by `bootstrap_source_user_id`.
- Bootstrap mapping uses `on conflict (user_id) do update`.
- Owner membership insert uses `on conflict do nothing`.
- Owner membership repair update reasserts `owner` and `active` for mapped users.
- Module backfill only updates rows where `household_id is null`.

This is good enough for local dry-run rehearsal. Production still needs backup and restore plans.

### Preflight/Postflight Reliability

Preflight verifies expected module tables and `user_id` columns. It reports auth user count, module user count, and null `user_id` rows.

Postflight fails if:

- profiles are fewer than auth users,
- bootstrap mappings are fewer than auth users,
- active owner memberships are fewer than auth users,
- legacy rows with `user_id` still have null `household_id`.

Known limitation: null `user_id` rows are reported but not failed before writes. That is acceptable for local dry run, but production should decide whether null `user_id` rows should block migration.

## Local-Readiness Review

### Can This Become A Local-Only Migration File?

Yes, after manual checklist review, this draft can become a **local-only migration file** for an isolated Supabase database.

It should not be moved into a real migration path for production yet.

### Manual Review Checklist

- [ ] Confirm local Supabase environment has `auth.uid()`, `anon`, and `authenticated`.
- [ ] Confirm `supabase/schema.sql` is the local baseline.
- [ ] Confirm no local-only or production-only tables are missing from the module table list.
- [ ] Confirm every expected module table has `user_id`.
- [ ] Confirm bootstrapping every auth user is intended.
- [ ] Confirm generic `Family household` names are acceptable for dry run.
- [ ] Confirm null `user_id` rows can remain unmapped for local dry run.
- [ ] Confirm internal schema/table should stay inaccessible to `anon` and `authenticated`.
- [ ] Confirm local dry run starts from a disposable database or restorable backup.
- [ ] Confirm no app household-context changes are expected in this phase.

### App Behavior That May Still Break After Applying Locally

Current app behavior should mostly continue because module-table `user_id` RLS remains unchanged and `household_id` is nullable.

Risk areas:

- If the app starts reading `households`, `household_members`, `people`, or `profiles`, it must respect the new RLS policies.
- New auth users created after the migration will not automatically get a household unless a later trigger or app bootstrap path is added.
- Generic data loading in `src/hooks/useTable.js` still does not filter by household.
- Direct inserts in `src/modules/quick-add/QuickAdd.js` still do not pass `household_id`.
- Seed fallback in `src/hooks/useTable.js` can still mask RLS errors.

### Tables Still Needing App Query Updates Later

All shared module tables still need app-level household context later:

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

Likely app files:

- `src/hooks/useSupabaseAuth.js`
- `src/hooks/useTable.js`
- `src/lib/supabase.js`
- `src/modules/quick-add/QuickAdd.js`
- `src/modules/dashboard/Dashboard.js`
- `src/modules/tasks/Tasks.js`
- `src/modules/pool/Pool.js`
- `src/modules/finance/Finance.js`
- `src/modules/college/College.js`

## Recommended Edits

Required before local dry run:

- None beyond the minor edits made in this review.

Recommended before production:

- Decide whether null `user_id` rows should block migration.
- Add a first-login household bootstrap path or trigger for future auth users.
- Add a same-household constraint or trigger for `household_members.person_id`.
- Add a documented restore path from backup.
- Add local RLS test cases for owner, adult, non-member, and unauthenticated users.

## Go / No-Go

Local-only go/no-go: **Go after manual checklist review.**

Production go/no-go: **No-go.**

Do not run this against production, do not enable module-table household RLS yet, and do not update app household queries until local migration behavior is proven.

## Exact Next Prompt

```text
Family OS next step: prepare the revised household migration for local-only dry run.

Do not apply it yet.
Do not run Supabase commands yet.
Do not modify production data.
Do not change application code.

Use:
- docs/implementation/household-migration-plan-2026-06-27/draft_sql/2026-06-27_household_foundation_draft.sql
- docs/implementation/household-migration-plan-2026-06-27/11_REVISED_DRAFT_VALIDATION.md

Tasks:
1. Create a local-only migration file under the repo's migration path only if a local Supabase migration pattern exists or is being explicitly established.
2. If no migration pattern exists, document the exact local migration setup steps instead of creating a migration file.
3. Create a local dry-run checklist and rollback checklist.
4. Do not apply the migration.
5. Do not run Supabase commands.
6. Commit with message:
Prepare household migration local dry run
```

## Verification

Static review only:

- Confirmed draft remains under `docs/implementation/.../draft_sql/`.
- Confirmed foundation-table RLS enablement is limited to `profiles`, `households`, `household_members`, and `people`.
- Confirmed module-table RLS replacement is not included.
- Confirmed idempotent bootstrap markers exist.
- Confirmed preflight/postflight sections exist.
- Confirmed no Supabase commands were run.
- Confirmed no migration was applied.
- Confirmed no app code was changed.
