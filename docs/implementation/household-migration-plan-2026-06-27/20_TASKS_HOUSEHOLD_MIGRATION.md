# Tasks Household Migration

## Summary

Tasks is the first module prepared for household-aware data access. This is an application-layer transition only. It does not remove legacy `user_id`, does not enable household-based Tasks RLS, and does not migrate other modules.

## Files Changed

- `src/hooks/useTable.js`
- `src/modules/tasks/Tasks.js`

## Query Behavior Before

Tasks used:

```js
useTable("tasks", "due_date", true)
```

That loaded all rows visible under the current Supabase session and relied entirely on the existing `user_id = auth.uid()` RLS policy.

New task inserts did not include `household_id`.

## Query Behavior After

Tasks reads Household Context through:

```js
useHousehold()
```

When a current household is available:

- Tasks reads include `eq("household_id", currentHousehold.id)`.
- New task inserts include `household_id: currentHousehold.id`.

When Household Context is unavailable, loading, empty, or errored:

- Tasks falls back to the legacy query behavior.
- New task inserts omit `household_id`.
- Existing `user_id` behavior remains intact through the database default and legacy RLS policy.

## Shared Hook Change

`useTable` now accepts an optional fourth argument:

```js
{
  filters: { household_id },
  insertDefaults: { household_id }
}
```

Existing callers pass no fourth argument and retain previous behavior.

## Fallback Behavior

Fallback is intentionally conservative:

- If `currentHousehold.id` exists, Tasks uses household-aware reads and inserts.
- If not, Tasks behaves as it did before this migration.

This allows local and deployed environments to keep working during the transition while household bootstrap and module migrations are completed incrementally.

## Risks

- Tasks with `household_id = null` will not appear for users who have a current household because the query filters by household. Existing production rows must be backfilled before this behavior is enabled against production data.
- Task updates do not write `household_id`. That is intentional because existing records should keep their current ownership until a controlled backfill is complete.
- The Tasks UI still includes Home Maintenance in the same screen. Home Maintenance was not migrated in this step.
- Security still depends on legacy `user_id` module-table RLS until a later Tasks RLS migration is designed and tested.

## Validation Results

Passed.

```powershell
pnpm run build
pnpm run check
```

Both commands completed successfully. The only observed warning was the existing Node/CRA deprecation warning for `fs.F_OK`.

Clean local replay passed before the Tasks change. See:

- `docs/implementation/household-migration-plan-2026-06-27/19_CLEAN_LOCAL_REPLAY_VALIDATION.md`

## Later RLS Readiness

Tasks is not ready for household-based RLS yet.

Before enabling Tasks household RLS:

1. Create local auth users and household bootstrap data after clean reset.
2. Insert Tasks records through the app and confirm `household_id` is written.
3. Confirm existing records can be backfilled from bootstrap mapping.
4. Add Tasks-specific RLS in a separate migration.
5. Validate owner/adult access and cross-household isolation locally.
