# Backfill And Rollback Plan

Plan date: 2026-06-27

This is a planning document only. Do not run backfills from this document.

## Default Household Creation

For each distinct existing `user_id` in current module tables:

1. Create or reuse a `profiles` row for that auth user.
2. Create one default household.
3. Name the household using profile display name or email fallback.
4. Create a `household_members` row with role `owner`.
5. Use that household as the backfill target for all rows owned by that `user_id`.

This matches the accepted single-household-first decision while leaving schema room for multi-household later.

## Assign Current User As Owner

For each auth user with existing data:

- `households.created_by_user_id = user_id`
- `household_members.user_id = user_id`
- `household_members.role = 'owner'`
- `household_members.status = 'active'`

No adult members, child logins, or guest memberships should be created in the first backfill unless manually reviewed.

## Backfill `household_id`

For each current table:

1. Confirm row count before backfill.
2. For rows with `user_id`, find the default household for that `user_id`.
3. Set `household_id`.
4. Confirm no rows with non-null `user_id` have null `household_id`.
5. Confirm row count after backfill matches before.

Tables to backfill are listed in `02_TABLE_OWNERSHIP_MAPPING.md`.

## Validate Counts Before And After

For each table:

- Count total rows before.
- Count rows grouped by `user_id` before.
- Count rows with null `household_id` after.
- Count rows grouped by `household_id` after.
- Confirm total rows unchanged.
- Confirm every previous user group maps to a household.

## Rollback Assumptions

Rollback is possible only if:

- `user_id` is retained.
- Old user-based policies remain available until household policies are proven.
- The migration does not drop columns or rewrite primary keys.
- Backups/exports exist.

Recommended rollback strategy:

- Re-enable old user policies if household policies fail.
- Ignore `household_id` columns temporarily if app code has not been switched.
- Roll back app data-access changes separately from schema additions.
- Do not drop foundation tables if migrated rows already reference them unless a full restore is planned.

## What Cannot Be Easily Rolled Back

Hard to roll back safely:

- Dropping `user_id`.
- Renaming `user_id` before app migration is complete.
- Deleting old policies before verification.
- Making `household_id not null` before all rows are backfilled.
- Creating real multi-user sharing before role policy tests pass.
- Deleting or merging household records after users begin sharing data.

## Safety Checks

Before backfill:

- Backup/export confirmed.
- Current schema baseline confirmed.
- List of distinct `user_id` values reviewed.
- Default household creation logic reviewed.
- Dry run in local/disposable database completed.

After backfill:

- Total row counts unchanged.
- No orphaned `household_id` values.
- No required `household_id` values missing.
- Owner membership exists for every household.
- Old app still works with existing policies.
- Household RLS tests pass before old policy removal.

