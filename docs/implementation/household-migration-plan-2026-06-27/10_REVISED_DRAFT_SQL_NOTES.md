# Revised Draft SQL Notes

Revision date: 2026-06-27

Reviewed draft:

- `docs/implementation/household-migration-plan-2026-06-27/draft_sql/2026-06-27_household_foundation_draft.sql`

Source validation:

- `docs/implementation/household-migration-plan-2026-06-27/09_DRAFT_SQL_VALIDATION.md`

## What Changed From The First Draft

The draft SQL was revised to address the validation blockers while remaining draft-only under `docs/implementation/household-migration-plan-2026-06-27/draft_sql/`.

Major changes:

- Added executable RLS enablement and policies for foundation tables only: `profiles`, `households`, `household_members`, and `people`.
- Added helper functions for owner/adult household role checks.
- Added explicit execute grants for authenticated users on the RLS helper functions.
- Added preflight checks for expected module tables and `user_id` columns.
- Changed bootstrap scope from users with existing module rows to every `auth.users` row.
- Added idempotent household bootstrap using `households.bootstrap_source_user_id`.
- Added a durable internal mapping table: `familyos_internal.household_bootstrap_map`.
- Added postflight checks for profile, household bootstrap, owner membership, and legacy row mapping counts.
- Kept existing `user_id` columns intact.
- Kept new module-table `household_id` columns nullable.
- Kept module-table RLS replacement out of scope.

## How Validation Blockers Were Addressed

### Foundation tables without RLS

Addressed by enabling RLS on:

- `public.profiles`
- `public.households`
- `public.household_members`
- `public.people`

The draft adds policies for:

- Users selecting, inserting, and updating their own profile.
- Owner/adult members selecting their household.
- Owners updating household settings.
- Owner/adult members selecting household members.
- Owners inserting/updating household members.
- Owner/adult members selecting, inserting, and updating people records.

No delete policies are included yet.

### Non-idempotent backfill

Addressed by adding:

- `households.bootstrap_source_user_id`
- `households.bootstrap_migration_key`
- A unique partial index on `households.bootstrap_source_user_id`
- `familyos_internal.household_bootstrap_map`

The bootstrap now reuses the existing mapped household on rerun instead of creating a new one.

### Duplicate default households

Addressed by the unique bootstrap source index and by checking for an existing bootstrap household before insert.

This prevents duplicate households created by this migration strategy. It does not deduplicate any unrelated household rows created manually outside the bootstrap path.

### Auth users with no module rows

Addressed by bootstrapping from `auth.users`, not from distinct module-table `user_id` values.

Every auth user gets:

- a `profiles` row,
- a default household,
- an internal bootstrap mapping,
- an active owner membership.

### Missing preflight checks

Addressed with a preflight block that verifies:

- all expected module tables exist,
- all expected module tables have `user_id`,
- auth user count can be read,
- distinct module users can be counted,
- rows with null `user_id` are counted and surfaced by notice.

### Missing postflight checks

Addressed with a postflight block that fails if:

- profiles are fewer than auth users,
- bootstrap mappings are fewer than auth users,
- active owner memberships are fewer than auth users,
- legacy rows with `user_id` still have null `household_id`.

## Remaining Risks

- The draft still assumes one auth user should receive one default household.
- Existing rows with `user_id is null` remain unmapped. The draft reports them in preflight but does not assign them.
- `household_members.person_id` is not yet constrained to the same household as `household_members.household_id`.
- The new RLS helper functions use `security definer`; ownership and search-path behavior must be reviewed in a real Supabase dry run.
- No delete policies are included for foundation tables, so delete behavior remains intentionally blocked through client RLS.
- Module-table RLS still uses the existing `user_id` policies until app household context is implemented.
- The draft creates an internal schema. Confirm Supabase API exposure settings before turning this into a real migration.

## What Still Needs Manual Review

- Confirm `supabase/schema.sql` is still the intended baseline.
- Confirm the real database has no production-only tables missing from the repo.
- Confirm all existing users should receive a default household immediately.
- Confirm generic `Family household` names are acceptable for the first migration.
- Confirm `familyos_internal.household_bootstrap_map` is the right rollback/support trace location.
- Confirm RLS helper function ownership after local dry review.
- Confirm whether foundation table deletes should remain unavailable until a later owner-only policy.
- Confirm whether existing null-`user_id` rows exist and how they should be handled.

## Module-Table RLS Decision

Module-table household RLS is **not included** in this revised draft.

Reason: current app reads and writes shared tables through generic table hooks and direct inserts that do not yet pass `household_id`. Replacing current module policies before app household context is implemented could break reads/writes or hide failures behind seed-data fallback.

The revised draft keeps the existing module-table `user_id` policies as the compatibility layer and only adds nullable `household_id` plus backfill.

## Go / No-Go Recommendation For Local-Only Dry Review

Recommendation: **Go for local-only dry review after manual SQL review.**

Still no-go for production execution.

The next step should be a local dry-run plan on an isolated database copy. Do not run Supabase commands against production and do not move this draft into `supabase/` until the local dry-run checklist is accepted.

## Verification

Static review only:

- The draft remains under `docs/implementation/.../draft_sql/`.
- No Supabase command was run.
- No migration was applied.
- No production data was touched.
- No app code was changed.
- Foundation-table RLS appears only for `profiles`, `households`, `household_members`, and `people`.
- Module-table RLS replacement remains future work.
