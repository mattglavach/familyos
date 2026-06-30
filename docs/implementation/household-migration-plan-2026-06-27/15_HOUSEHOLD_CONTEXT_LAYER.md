# Household Context Layer

## Summary

Added the first app-level household context foundation after the local household migration was able to apply. This layer does not migrate module queries yet. Existing feature modules still use the legacy `user_id`-scoped data access path until each module is migrated deliberately.

## Files Added

- `src/context/HouseholdContext.js`
- `src/hooks/useHousehold.js`
- `src/services/supabase/households.js`

## Files Changed

- `src/app/App.js`

## Data Loaded By Context

After an authenticated Supabase session exists, the provider loads:

- Current profile from `profiles`
- Active household membership rows from `household_members`
- Joined household records from `households`
- Current/default household
- Current household member record
- Current role
- Simple permissions object derived from role

## Behavior

- Signed-out users receive a signed-out context state.
- Users with one active household are selected automatically.
- Users with multiple active households are supported internally by `selectedHouseholdId`, but no household-switching UI was added.
- Users with no active household receive an `empty` context state.
- Household context errors are captured in context and logged, but they do not block the current app UI.

## Current Limitations

- No feature module queries were migrated to `household_id`.
- No module-table RLS changes were made.
- No household creation, invitation, or switching UI was added.
- Newly created auth users after the foundation migration may still require a household bootstrap path before they can use household-scoped modules.
- The permissions object is intentionally coarse and should be tightened as module migrations define exact role behavior.

## Future Module Migration Pattern

For each module:

1. Read `currentHousehold.id` from `useHousehold()`.
2. Keep legacy `user_id` behavior until the module has its own migration and validation step.
3. Add `household_id` to new inserts only after local RLS and app behavior are validated.
4. Filter reads by `household_id` only after the module has been backfilled and policies are ready.
5. Remove legacy `user_id` assumptions only after all active records and tests are migrated.

## Risks

- If the local or deployed database does not have the household foundation tables, the context load will fail and report an error state. The app is expected to continue rendering because modules still use legacy queries.
- Future household switching needs UI, persistence, and clear behavior for open forms or cached module data.
- Permissions are not security by themselves. Supabase RLS remains the actual enforcement layer.

## Validation Results

- `pnpm run build` passed.
- `pnpm run check` passed.
- The first build attempt failed before app compilation because the shell PATH did not expose `node` to `react-scripts`; rerunning with the bundled Node runtime on PATH completed successfully.
- No Supabase remote commands were run.
- No production migrations were applied.
- No module-table RLS changes were made.
