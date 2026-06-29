# Tasks Household RLS Validation

Date: June 29, 2026
Branch: `feature/household-foundation`

## Scope

Design and locally validate household-aware Row Level Security for `public.tasks` only.

This work did not apply production migrations, did not run remote Supabase commands, did not link to a remote Supabase project, did not migrate additional modules, did not remove legacy `user_id`, and did not change Pool, Finance, College, Dashboard, or other module policies.

## Migration File

Created:

- `supabase/migrations/20260628_tasks_household_rls.sql`

The migration keeps RLS enabled on `public.tasks`, removes the legacy Tasks-only `familyos_user_all` policy, and replaces it with separate household-aware policies for:

- `select`
- `insert`
- `update`
- `delete`

## Policy Design

The Tasks policy now allows authenticated users to access task rows when either condition is true:

1. `tasks.household_id` is not null and the user has an active `owner` or `adult` membership in that household.
2. `tasks.household_id` is null and `tasks.user_id = auth.uid()`.

The first rule is the target household model. The second rule is a transitional fallback for legacy rows created before `household_id` was available.

The policy uses the existing helper from the household foundation migration:

```sql
public.familyos_has_household_role(household_id, array['owner', 'adult'])
```

## Expected Behavior

| Scenario | Expected result |
| --- | --- |
| Authenticated owner reads household task | allowed |
| Authenticated adult reads household task | allowed when adult membership exists |
| Authenticated owner/adult inserts task with household_id | allowed |
| Authenticated owner/adult updates household task | allowed |
| Authenticated owner/adult deletes household task | allowed |
| Authenticated user reads legacy null-household task with own user_id | allowed |
| Authenticated user reads legacy null-household task owned by another user | blocked |
| Anonymous user reads or writes tasks | blocked |
| Pool/Finance/College/Dashboard policies | unchanged |

## Local Validation Plan

Validation used the local Docker Supabase database only:

- Local DB container: `supabase_db_familyos`
- Test user: local-only household owner account
- Test household: local-only owner household
- RLS role simulation: `set local role authenticated` plus local JWT subject claim
- UI smoke test: local app at `http://127.0.0.1:3000`

Commands/tools used:

- `docker ps --format "{{.Names}} {{.Status}}"`
- `docker exec -i supabase_db_familyos psql -U postgres -d postgres`
- In-app browser against `http://127.0.0.1:3000`
- `pnpm run build`
- `pnpm run check`

The migration was applied locally by piping the migration file into the local Postgres container with `ON_ERROR_STOP=1`. No Supabase remote commands were run.

## Local Validation Results

### Migration Apply

Result: passed.

The migration executed successfully against the local database:

- RLS remained enabled on `public.tasks`.
- Legacy Tasks policy `familyos_user_all` was removed from `public.tasks`.
- New Tasks-only policies were created.
- No other module policies were changed.

### Owner Read/Create/Update/Delete

Result: passed.

Using the local owner account under the `authenticated` role:

- Owner could read an existing household task.
- Owner could insert a task with `household_id`.
- Inserted task had `user_id` populated by the existing default.
- Owner could update the inserted task.
- Owner could delete the inserted task.

### Legacy Fallback

Result: passed.

A temporary row with `household_id = null` and `user_id = auth.uid()` was created inside a transaction. Under the `authenticated` role:

- The owner could select the legacy row.
- The owner could update the legacy row.
- The owner could delete the legacy row.

The transaction was rolled back, so the temporary fallback row did not persist.

### UI Smoke Test

Result: passed for create/read.

Through the local Tasks UI after the RLS change:

- A new task was created successfully.
- The row had `household_id = 72210168-33cb-4057-a9a4-660e6d62a05b`.
- The row had `user_id = 64349d4f-eaad-4357-9a9f-97bf759e5e36`.
- Exactly one matching row existed.

The UI-created smoke row was then updated and deleted through the authenticated local RLS path to validate update/delete and avoid leaving extra local test data.

### Anonymous Access

Result: blocked.

Anonymous access to `public.tasks` was blocked at the grant layer:

```text
permission denied for table tasks
```

This is acceptable for the current private household app and stricter than relying only on an anonymous RLS deny path.

### Other Module Policies

Result: unchanged.

Policy inventory confirmed that non-Tasks modules still use the existing legacy policy:

```sql
user_id = auth.uid()
```

Modules intentionally left unchanged:

- Pool
- Finance
- College
- Retirement
- Home maintenance
- Net worth/debt tables

## Risks

- The transitional fallback is intentionally permissive for legacy null-`household_id` rows owned by the current user. It should be removed after all task rows are backfilled and production behavior is validated.
- RLS alone cannot cleanly distinguish updating an existing legacy null-household row from changing a household row back to null without additional constraints or triggers. This is acceptable only as a temporary compatibility bridge.
- Adult-role behavior was validated by policy design, not with a separate local adult test account. A second local household member should be added before production rollout.
- Production remains blocked until the migration is reviewed, applied in a controlled environment, and validated with production-like users/data.

## Rollback Notes

Local rollback can restore the legacy policy by dropping the four new Tasks policies and recreating:

```sql
create policy "familyos_user_all"
on public.tasks
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
```

Do not run rollback or forward migration against production until a production deployment plan exists.

## Production Go/No-Go

Production: no-go.

Reason: Tasks household-aware RLS now passes local validation, but production still needs:

1. Review of the Tasks policy migration.
2. Production data inventory for null `household_id` task rows.
3. Adult-role validation with a second real or staging user.
4. A rollback plan approved before deployment.

Local next step: review this migration and then plan the next single-module migration only after Tasks RLS is accepted.
