# Tasks Household Write Validation

Date: June 29, 2026
Branch: `feature/household-foundation`

## Scope

Validate that the Tasks UI writes `household_id` for newly created task records after the Household Context layer and Tasks household-aware access changes.

This validation was local-only. No production migrations were applied, no remote Supabase commands were run, no remote project was linked, no additional modules were migrated, and no Tasks RLS changes were made.

## Commands And Tools Used

- `git status -sb`
- `git branch --show-current`
- `docker ps --format "{{.Names}} {{.Status}}"`
- `Invoke-WebRequest http://127.0.0.1:3000`
- In-app browser against `http://127.0.0.1:3000`
- Local-only Postgres queries through `docker exec -i supabase_db_familyos psql -U postgres -d postgres`

Local services used:

- App: `http://127.0.0.1:3000`
- Supabase API: `http://127.0.0.1:54321`
- Supabase Studio: `http://127.0.0.1:54323`

## Task Creation Result

Created one task through the normal Tasks UI:

- Title: `Household write smoke 2026-06-29T17-28-42-150Z`
- UI flow: authenticated app session -> Tasks tab -> `+ Add Task` -> title entry -> `Add Task`
- Result: task count increased from `0 tasks` to `1 tasks`
- The task appeared in the Tasks `List` view.

No browser console errors were reported during the creation and reload smoke test.

## Database Validation Result

Local database query confirmed exactly one matching row:

| Check | Result |
| --- | --- |
| Matching rows | `1` |
| Task id | `70f1291f-94ef-4f1f-ac35-a9b8613506da` |
| `household_id` populated | yes |
| `user_id` populated | yes |
| Duplicate rows | none |
| Membership match | owner, active |

Validated row:

| Field | Value |
| --- | --- |
| `household_id` | `72210168-33cb-4057-a9a4-660e6d62a05b` |
| `user_id` | `64349d4f-eaad-4357-9a9f-97bf759e5e36` |
| membership role | `owner` |
| membership status | `active` |

## Household ID Result

`household_id` was written successfully by the Tasks UI path when Household Context was available.

This confirms the app-side Tasks insert path is now carrying the current household into new task records.

## User ID Result

Legacy `user_id` remained populated on the new task row.

This is expected and required during the transition because the current Tasks RLS policy is still legacy user-scoped:

```sql
user_id = auth.uid()
```

No legacy `user_id` behavior was removed.

## Reload And Session Result

After a browser reload:

- The authenticated session persisted.
- The Tasks tab still rendered.
- The created task remained visible in the Tasks `List` view.
- No duplicate row was created during reload.

## RLS Observation

The local `tasks` table has RLS enabled with the existing legacy policy:

| policy | command | condition |
| --- | --- | --- |
| `familyos_user_all` | `ALL` | `user_id = auth.uid()` |

No Tasks RLS policies were added, removed, or modified during this validation.

This means Tasks can now write `household_id`, but household-based Tasks RLS is not ready to enable until a separate reviewed migration updates the policy model.

## Issues Found

- No write-path defect was found.
- No duplicate task row was created.
- No browser console errors were observed.
- `supabase_vector_familyos` continued restarting in Docker, but DB/Auth/REST/Studio were healthy and the issue did not block this validation.

## Fixes Made

No application code changes were required.

## Recommendation For Tasks RLS Readiness

Tasks is ready for a dedicated Tasks RLS design/review step, but not for immediate household-RLS enforcement.

Recommended next RLS preparation:

1. Keep `user_id` populated during transition.
2. Add household-aware Tasks policy drafts in a separate migration.
3. Validate household member access with at least owner and adult roles.
4. Confirm fallback behavior for older rows where `household_id` may still be null.
5. Only then replace or supplement the legacy `user_id = auth.uid()` policy.

## Production Go/No-Go

Production: no-go.

Reason: this was a local-only UI and database validation. Production household migration, Tasks backfill, and Tasks RLS policy changes still require separate review and execution planning.

Local next step: design the Tasks RLS migration in draft form, keeping it separate from additional module migrations.
