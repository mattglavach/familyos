# Dashboard Household Migration

Date: June 29, 2026
Branch: `feature/household-foundation`

## Scope

Migrate Dashboard data access only where the underlying module is already household-aware.

This change does not apply production migrations, does not run remote Supabase commands, does not link a remote Supabase project, does not migrate Pool, Finance, College, or Documents, does not remove legacy `user_id`, and does not enable additional module-table RLS.

## Files Changed

- `src/modules/dashboard/Dashboard.js`
- `docs/implementation/household-migration-plan-2026-06-27/24_DASHBOARD_HOUSEHOLD_MIGRATION.md`
- `docs/releases/CHANGELOG.md`
- `docs/planning/CURRENT_SPRINT.md`
- `docs/planning/PROJECT_STATUS.md`

## Dashboard Data Sources Reviewed

| Source | Table/API | Dashboard use | Migration decision |
| --- | --- | --- | --- |
| Tasks | `tasks` | urgent task list, Tasks tile, Action Center | migrated to selected `household_id` when Household Context is available |
| Home maintenance | `home_maintenance` | Tasks tile and maintenance action items | kept legacy `user_id` behavior |
| Pool readings | `pool_readings` | Pool tile, stale reading detection, chemistry recommendations | kept legacy `user_id` behavior |
| Pool treatments | `pool_treatments` | recent activity | kept legacy `user_id` behavior |
| Finance/retirement assumptions | `retirement_assumptions` | Finance tile and retirement projection | kept legacy `user_id` behavior |
| Finance/retirement accounts | `retirement_accounts` | Finance tile and retirement projection | kept legacy `user_id` behavior |
| College deadlines | `college_deadlines` | College tile and Action Center | kept legacy `user_id` behavior |
| Notes | `notes` | Notes section | kept legacy `user_id` behavior |
| Google Calendar | Google Calendar API | Schedule section | unchanged, not Supabase household-scoped yet |

## What Was Migrated

Dashboard now reads the active household from `useHousehold()` and passes household-aware options to the shared `useTable()` call for `tasks`.

When `currentHousehold.id` is available:

```js
useTable("tasks", "due_date", true, {
  filters: { household_id: householdId },
  insertDefaults: { household_id: householdId },
})
```

This keeps Dashboard task summaries aligned with the Tasks module and the Tasks household RLS migration.

## What Stayed Legacy

The following Dashboard reads intentionally stayed on existing legacy `user_id` behavior:

- `home_maintenance`
- `college_deadlines`
- `pool_readings`
- `pool_treatments`
- `retirement_assumptions`
- `retirement_accounts`
- `notes`

Those modules have not been migrated yet, so forcing `household_id` filtering now would risk hiding valid data or breaking the current user-scoped policies.

## Fallback Behavior

If Household Context is loading, empty, or unavailable, Dashboard falls back to the existing unfiltered `tasks` query behavior.

Under the current local Tasks RLS migration, authenticated users can still read:

- household task rows where they are active owner/adult members
- legacy null-`household_id` task rows where `user_id = auth.uid()`

This preserves current Dashboard rendering while keeping the household-aware path active once context is ready.

## Validation Results

Local validation performed:

- Confirmed branch: `feature/household-foundation`
- Confirmed clean worktree before edits
- Reviewed Dashboard Supabase data sources
- Verified Dashboard renders in the local app
- Verified Household Context-backed session renders the Dashboard
- Verified Dashboard Tasks data path uses household-aware filtering when a current household exists
- Inserted a temporary local household task and confirmed it appeared in the Dashboard focus list, Action Center, and Tasks status tile
- Removed the temporary local validation task after the smoke test
- Verified non-migrated widgets still render under legacy behavior
- Checked browser console errors
- Ran `pnpm run build`
- Ran `pnpm run check`

## Risks

- Dashboard still combines household-aware `tasks` with legacy `home_maintenance` in the Tasks tile. This is intentional until home maintenance receives its own module migration.
- If a future user belongs to multiple households, Dashboard will only show `tasks` for the selected household, while legacy widgets may still show user-scoped data across contexts until migrated.
- A visible household loading state was not added because the existing Dashboard already renders safely while context loads and a new UI state would change behavior unnecessarily.

## Next Recommended Module

Home maintenance should be the next module considered because Dashboard already presents home maintenance items inside the Tasks summary. Migrating home maintenance would reduce mixed ownership behavior in the Dashboard without touching Pool, Finance, or College yet.
