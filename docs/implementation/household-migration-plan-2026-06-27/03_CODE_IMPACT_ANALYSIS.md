# Code Impact Analysis

Plan date: 2026-06-27

This analysis identifies likely code changes for a future implementation. Do not modify these files as part of this planning task.

## Impacted Files

| File Path | Current Pattern | Required Change | Risk | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| `src/lib/supabase.js` | Creates Supabase client and generic `sb.from(table)` wrapper. | Add or replace with household-aware data service methods that can scope reads/writes by active household. | High | Existing operations still work; household-aware operations cannot spoof another household. |
| `src/App.js` | Defines `useSupabaseAuth` at lines around `411-453`. | Extract auth hook and add active household bootstrap after session load. | Medium | Auth gate behavior unchanged; active household loads once session exists. |
| `src/App.js` | Defines `useTable` at lines around `489-501`; falls back to seed data on errors. | Extract hook and make household scoping explicit; avoid masking RLS errors as seed data in authenticated mode. | High | RLS errors are visible during migration testing; no silent false-success state. |
| `src/App.js` | College uses `useTable` for `college_*`, `sat_scores`, `college_savings`, `college_goal` around lines `530-532`. | Scope reads/writes by active household; later add `subject_person_id`. | High | College records remain visible after backfill and are not visible to non-members. |
| `src/App.js` | Pool uses `useTable` for pool tables around lines `1035-1039`. | Scope pool reads/writes by active household. | Medium | Pool readings, maintenance, treatments, schedule, and settings load after migration. |
| `src/App.js` | Finance uses `useTable` for retirement, college savings, mortgage, debt, snapshots, action items around lines `1876-1883`. | Scope by active household and enforce owner/adult access. | High | Finance data is inaccessible to non-members and future child/guest roles. |
| `src/App.js` | Quick Add uses table hooks and direct `sb.from` inserts around lines `2568-2620`. | Add household context to inserts and route through a service layer. | High | Quick Add creates rows with `household_id` and does not rely only on DB defaults. |
| `src/features/dashboard/Dashboard.js` | Receives `useTable` via `deps` and loads many tables. | Use household-aware hooks/services directly after extraction. | Medium | Dashboard aggregates only active household data. |
| `src/features/tasks/Tasks.js` | Receives `useTable` via `deps` and uses `tasks` and `home_maintenance`. | Scope tasks and maintenance to active household. | Medium | Task and maintenance flows remain unchanged after migration. |
| `api/brief.js` | Serverless Anthropic proxy validates origin/body but not Supabase session. | Future AI context work should require app-user auth and role-aware context filtering. | High | AI endpoint cannot process sensitive household context without authenticated allowed role. |
| `src/config.js` | Reads browser env vars. | Likely unchanged for first migration. | Low | No new server secrets added to frontend. |
| `supabase/seed.sql` | Requires `seed_user_id` and inserts `user_id`. | Future seed plan should create household and membership, then insert `household_id`. | Medium | Seed data remains usable in local/dev setup. |
| `supabase/backfill-user-id.sql` | Backfills `user_id`. | Superseded by household backfill plan; keep until no longer needed. | Medium | Current recovery path remains available until household migration is complete. |

## Query Patterns

Current query pattern:

- `useTable(table, orderCol, orderAsc)` loads whole tables and relies on RLS.
- Direct inserts use `sb.from("table").insert(row)` in Quick Add.
- Module components do not know household context.

Target query pattern:

- Auth loads session.
- Active household is resolved.
- Table services include `household_id` for inserts.
- Reads filter or rely on RLS by active household.
- Sensitive module access checks happen in RLS and optionally in UI.

## Inserts

Required future rule:

- Every shared module insert includes active `household_id`.
- `created_by_user_id` is set by database default or service layer if added.
- Client cannot choose arbitrary household unless the current user belongs to it.

## Updates / Deletes

Required future rule:

- Updates and deletes are scoped by record id and household membership.
- Destructive deletes for sensitive records should be owner/adult only.
- Whole-household deletion is owner-only and should not be part of the first migration.

## Auth / Session Logic

Current auth:

- Supabase session is loaded in `useSupabaseAuth`.
- No active household is loaded.

Required future behavior:

- After session load, fetch active/default household membership.
- If none exists, bootstrap or show setup state.
- Store active household choice user-scoped only when multi-household UI exists later.

