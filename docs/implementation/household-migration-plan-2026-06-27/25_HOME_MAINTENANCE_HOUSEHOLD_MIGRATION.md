# Home Maintenance Household Migration

Date: June 29, 2026
Branch: `feature/household-foundation`

## Scope

Migrate Home Maintenance app data access to the active household while preserving legacy `user_id` behavior and leaving RLS unchanged.

This change did not apply production migrations, did not run remote Supabase commands, did not link a remote Supabase project, did not migrate Pool, Finance, College, or Documents, did not remove legacy `user_id`, and did not enable Home Maintenance RLS.

## Files Changed

- `src/modules/tasks/Tasks.js`
- `src/modules/dashboard/Dashboard.js`
- `docs/implementation/household-migration-plan-2026-06-27/25_HOME_MAINTENANCE_HOUSEHOLD_MIGRATION.md`
- `docs/releases/CHANGELOG.md`
- `docs/planning/CURRENT_SPRINT.md`
- `docs/planning/PROJECT_STATUS.md`

## Current Schema And Policy

Local `public.home_maintenance` columns:

- `id text primary key`
- `title text not null`
- `last_completed date not null`
- `interval_days integer not null`
- `notes text`
- `user_id uuid default auth.uid()`
- `household_id uuid null`

Current RLS policy remains legacy user-scoped:

```sql
familyos_user_all
using (user_id = auth.uid())
with check (user_id = auth.uid())
```

No Home Maintenance RLS policy was added, removed, or modified.

## Query Behavior Before

Tasks module:

```js
useTable("home_maintenance", "title", true)
```

Dashboard module:

```js
useTable("home_maintenance", "title", true)
```

New maintenance inserts did not include `household_id`.

## Query Behavior After

Both Tasks and Dashboard now read the active household from Household Context and pass household-aware options to `useTable()`.

When `currentHousehold.id` is available:

```js
useTable("home_maintenance", "title", true, {
  filters: { household_id: householdId },
  insertDefaults: { household_id: householdId },
})
```

When Household Context is unavailable, the hook falls back to the existing legacy unfiltered behavior. Legacy `user_id` remains populated by the database default and is not removed.

## Dashboard Impact

Dashboard previously mixed household-aware `tasks` with legacy `home_maintenance` in the Tasks tile and Action Center.

Dashboard now uses the same household-aware data access for:

- `tasks`
- `home_maintenance`

Other Dashboard data sources remain legacy user-scoped:

- `pool_readings`
- `pool_treatments`
- `retirement_assumptions`
- `retirement_accounts`
- `college_deadlines`
- `notes`
- Google Calendar data

## Fallback Behavior

If Household Context is loading, empty, or unavailable:

- `home_maintenance` uses the previous query behavior.
- inserts omit `household_id`.
- legacy `user_id` remains the active ownership boundary.

This preserves current behavior during transition and avoids hiding data before production backfill/RLS work is reviewed.

## Validation Results

Local validation performed:

- Confirmed branch: `feature/household-foundation`
- Confirmed clean worktree before edits
- Inspected `home_maintenance` schema and current RLS policy
- Verified Tasks module is the Home Maintenance UI surface
- Verified Dashboard reads `home_maintenance` for Tasks tile, action items, and recent activity
- Confirmed no Pool, Finance, College, or Documents logic was changed
- Started local app against local Supabase only
- Confirmed authenticated app session rendered
- Confirmed Household Context-backed Tasks screen rendered
- Confirmed the current UI has maintenance edit/delete/done flows but no visible add-maintenance entry point
- Created a local Home Maintenance record through the authenticated local Supabase REST path using the same row shape the app insert path now provides
- Confirmed new local maintenance row received `household_id`
- Confirmed legacy `user_id` remained populated
- Confirmed Dashboard and Tasks rendered the household-scoped maintenance row
- Removed the temporary local validation row after the smoke test
- Checked browser console errors
- Ran `pnpm run build`
- Ran `pnpm run check`

## Risks

- Home Maintenance RLS is still legacy `user_id = auth.uid()`. This is intentional until the Home Maintenance RLS policy receives a separate draft and local validation.
- Rows with `household_id = null` will not appear when Household Context is ready because the app now filters by active `household_id`. Existing production rows must be backfilled before this behavior is deployed against production data.
- The current Tasks UI contains an edit modal for maintenance items, but the visible add-maintenance path is limited. If the add path is not reachable in the current UI, validation should use the shared insert path and document that UI limitation.

## RLS Readiness

Home Maintenance is ready for a future Home Maintenance-only RLS draft after local app behavior is accepted.

The future policy should mirror the Tasks transition pattern:

- allow owner/adult household members to read/insert/update/delete rows for active memberships
- preserve fallback for `household_id is null and user_id = auth.uid()`
- keep `household_id` nullable until backfill and production validation are complete

## Next Recommended Module

Notes should be considered next if the goal is to keep moving through small, low-risk shared household tables.

Pool and Finance should remain deferred because they have broader data surfaces, AI summaries, and more operational risk.
