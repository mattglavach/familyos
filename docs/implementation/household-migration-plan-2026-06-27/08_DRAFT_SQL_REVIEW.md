# Draft SQL Review

Review date: 2026-06-27

## What The Draft Migration Does

The draft SQL at `docs/implementation/household-migration-plan-2026-06-27/draft_sql/2026-06-27_household_foundation_draft.sql` creates a reviewable household foundation plan without touching the live Supabase migration path.

It follows the accepted decision that Family OS should move to household-centered ownership while retaining `user_id` during the migration. Current shared tables and the current `user_id = auth.uid()` RLS policy are defined in `supabase/schema.sql:236-261`.

## Tables Created

- `profiles`: app-visible metadata for Supabase Auth users.
- `households`: primary shared ownership boundary.
- `people`: household people, including child profiles that do not log in.
- `household_members`: authenticated membership and role boundary.

The first active membership roles are `owner` and `adult`. `child_profile` remains a person/profile concept only, and `guest_future` remains out of scope.

## Tables Altered

The draft adds nullable `household_id` plus an index to each current shared table listed in `supabase/schema.sql:242-248`:

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

The draft does not drop, rename, or reinterpret `user_id`.

## Data Backfill Approach

The draft creates a temporary list of distinct existing `user_id` values across current module tables.

For each distinct user:

1. Insert or update `profiles` from `auth.users`.
2. Create one default household.
3. Create an active `owner` membership for that user.
4. Backfill `household_id` on existing rows owned by that `user_id`.

This intentionally assumes the current user-centered model means one existing authenticated user maps to one household. That assumption must be verified before any real migration is applied.

## RLS Draft

The file includes RLS helper and policy examples only as comments. It does not replace the existing `familyos_user_all` policies from `supabase/schema.sql:257`.

Household RLS should not be activated until:

- `household_id` backfill has been validated.
- App data access can resolve the active household.
- Owner/adult access works locally.
- Non-member denial is tested.
- Sensitive module access rules are reviewed.

## Risks

- The backfill creates one household per distinct `user_id`; this is wrong if current rows for one user actually represent multiple households.
- The draft is not idempotent for household creation if run repeatedly without a reset.
- `household_id` remains nullable, so the database will temporarily support mixed ownership states.
- Existing app code still relies on `user_id` behavior and may not use `household_id` until a later implementation phase.
- RLS mistakes in a later phase could either expose household data or lock users out.
- Finance, college, documents, and future AI context are privacy-sensitive and need stricter policy review before household RLS replaces current policies.

## Assumptions

- `supabase/schema.sql` is the current schema baseline.
- No production migration folder exists yet; `supabase/migrations/` is absent.
- Existing app tables are the tables listed in `supabase/schema.sql:242-248`.
- Existing `user_id` columns are present because `supabase/schema.sql:251` adds them in the current setup script.
- First migration should create active `owner` memberships only for existing auth users.
- `adult` role support can exist in the schema before the app exposes member management.
- Children remain `people` records with no login.
- Guest access and invitation flows are deferred.

## Questions Before Applying

- Is `supabase/schema.sql` confirmed as the exact production baseline?
- Are there any production tables not represented in this repository?
- Should the first real migration be idempotent across repeated local runs, or should it assume a clean migration history?
- Should default household names be generic or derived from user profile/email?
- Should the first migration create `adult` memberships for any known spouse/partner data, or owner only?
- Should module tables get `created_by_user_id` now, or should `user_id` remain the only attribution field until app updates?
- Should foundation tables have RLS enabled in the same migration, or should that be a separate reviewed migration?
- What is the exact local-only database environment for dry-run validation?

## Commands That Should NOT Be Run Yet

Do not run any of these commands for this draft:

```powershell
supabase db push
supabase migration up
supabase db reset
supabase link
psql -f docs/implementation/household-migration-plan-2026-06-27/draft_sql/2026-06-27_household_foundation_draft.sql
```

Do not paste the draft SQL into the Supabase SQL editor against production.

## Manual Review Checklist

- [ ] Confirm no live migration file was created.
- [ ] Confirm the draft keeps `user_id`.
- [ ] Confirm the draft keeps existing RLS policies unchanged.
- [ ] Confirm every current shared table receives nullable `household_id`.
- [ ] Confirm no `household_id not null` constraint is added yet.
- [ ] Confirm no child login or guest access is introduced.
- [ ] Confirm the backfill assumption: one current user equals one default household.
- [ ] Confirm rollback expectations before a real migration is written.
- [ ] Confirm local dry-run environment before executing any SQL.
- [ ] Review RLS helper drafts separately before enabling them.

## Verification

No database migration commands were run. No Supabase project was modified.

Static review performed after file creation should verify:

- The draft file exists under `docs/implementation/.../draft_sql/`.
- The review document exists.
- The draft contains `create table` statements for `profiles`, `households`, `people`, and `household_members`.
- The draft contains `household_id` additions for current shared tables.
- The draft does not contain commands to drop `user_id`.
- The draft does not contain `alter table ... enable row level security` for new household policies outside commented examples.
