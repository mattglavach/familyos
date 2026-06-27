# Migration Plan

Review date: 2026-06-27

## Migration Goal

Move safely from current `user_id` ownership to household-centered ownership without breaking the existing app or losing data.

The migration should be phased. Do not replace all policies in one step without compatibility testing.

## Tables Likely Needing Changes

Current tables listed in `supabase/schema.sql:242-248` need household migration:

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

New foundation tables:

- `profiles`
- `households`
- `household_members`
- `people`

Later platform tables:

- `properties`
- `assets`
- `documents`
- `events`
- `goals`
- `metrics`
- `reminders`
- `timeline_entries`

## Phased Migration

### Phase 0: Decisions And Inventory

Before writing migrations:

- Confirm whether one user can belong to multiple households.
- Confirm initial roles: `admin`, `adult`, `child`, `guest`.
- Confirm whether every current user gets one default household.
- Confirm whether `user_id` becomes `created_by_user_id` or remains as legacy owner metadata.
- Confirm how seed data should map to a household.

### Phase 1: Add Foundation Tables

Add:

- `profiles`
- `households`
- `household_members`
- `people`

Create one default household per existing user. Add the user as `admin`.

Compatibility: existing app can still run against `user_id` policies during this phase.

### Phase 2: Add `household_id` Columns

Add nullable `household_id` to each existing app table.

Backfill:

- For each row, find its `user_id`.
- Find or create that user's default household.
- Set `household_id`.

Add indexes:

- `(household_id)`
- Common module-specific compound indexes such as `(household_id, due_date)` and `(household_id, logged_at desc)`.

Do not drop `user_id` yet.

### Phase 3: Dual-Write / Compatibility Update

Update app data creation so inserts include or resolve the active `household_id`.

During this phase:

- Keep `user_id` default for compatibility.
- Store `created_by_user_id` if added.
- Ensure all new rows get both `household_id` and creator metadata.

### Phase 4: RLS Policy Transition

Add household membership policies while retaining user policies temporarily if needed.

Test:

- Admin can access household rows.
- Non-member cannot access rows.
- Adult can access allowed modules.
- Child cannot access adult-only modules.
- Inserts cannot spoof another household.

Once tested, remove old user-only policies.

### Phase 5: App UI And Module Context

Add app-level household context:

- Load active household after auth.
- Provide household bootstrap if none exists.
- Pass household context to data services.
- Avoid direct table access without household scope.

### Phase 6: Cleanup

After the app no longer depends on user ownership:

- Rename or repurpose `user_id` to `created_by_user_id` if appropriate.
- Remove obsolete backfill scripts.
- Update docs to state current household architecture.
- Add tests and RLS smoke checks.

## Backfill Approach

Recommended default mapping:

1. For each distinct `user_id`, create one household named after the profile or email.
2. Insert `household_members` row with role `admin`.
3. Backfill all current rows for that `user_id` to the new household.
4. Create `people` rows only when domain data requires child/member linkage.

For `college_goal.child_name`, create future `people` records manually or via a controlled migration after reviewing names.

## Compatibility Strategy

- Keep current app behavior working while columns are added.
- Keep `user_id` until all reads/writes are household-aware.
- Add read services that default to active household.
- Avoid introducing family sharing UI before household RLS is proven.

## Rollback Considerations

Rollback should be possible through Phase 3 because existing `user_id` remains intact.

Do not drop `user_id` or old policies until:

- Full app build passes.
- RLS tests pass.
- Data backfill is verified.
- Manual QA confirms existing modules load and save.

## Before Feature Development Resumes

Required:

- Final household model decision.
- Migration plan converted into timestamped migration files.
- RLS policy helpers designed and reviewed.
- Active household app context designed.
- `src/App.js` extraction plan started or sequenced with schema work.

