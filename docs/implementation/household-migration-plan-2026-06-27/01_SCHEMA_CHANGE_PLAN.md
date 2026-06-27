# Schema Change Plan

Plan date: 2026-06-27

This is a planning document only. Do not treat this file as an executable migration.

## Proposed New Tables

### `profiles`

Purpose: user metadata for Supabase Auth identities.

Expected columns:

- `id uuid primary key references auth.users(id) on delete cascade`
- `email text`
- `display_name text`
- `avatar_url text`
- `created_at timestamptz`
- `updated_at timestamptz`

Ownership: user.

### `households`

Purpose: household workspace and primary ownership boundary.

Expected columns:

- `id uuid primary key`
- `name text not null`
- `created_by_user_id uuid references auth.users(id)`
- `status text not null default 'active'`
- `created_at timestamptz`
- `updated_at timestamptz`

Ownership: household.

### `household_members`

Purpose: joins users/people to households and stores role.

Expected columns:

- `id uuid primary key`
- `household_id uuid references households(id) on delete cascade`
- `user_id uuid references auth.users(id) on delete cascade null`
- `person_id uuid references people(id) null`
- `role text not null`
- `status text not null default 'active'`
- `created_at timestamptz`
- `updated_at timestamptz`

Role values for first migration: `owner`, `adult`.

Reserved/non-login concepts: `child_profile`, `guest_future`.

### `people`

Purpose: household people, including children who do not log in.

Expected columns:

- `id uuid primary key`
- `household_id uuid references households(id) on delete cascade`
- `first_name text`
- `last_name text`
- `relationship text`
- `member_type text`
- `birthday date`
- `email text`
- `phone text`
- `notes text`
- `created_at timestamptz`
- `updated_at timestamptz`

Ownership: household.

## Proposed Changed Tables

Current app tables are listed in `supabase/schema.sql:242-248`. Add `household_id` to each:

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

## Columns To Add

For all shared current tables:

- `household_id uuid references households(id) null` initially.

Recommended attribution columns, either in first migration or follow-up after review:

- `created_by_user_id uuid references auth.users(id) null`
- `updated_by_user_id uuid references auth.users(id) null`

Conservative recommendation: add `household_id` first; add attribution columns only if the draft migration remains manageable.

## Columns To Deprecate Later

Do not remove now:

- `user_id`

Later interpretation:

- Keep as legacy compatibility column through migration.
- Eventually replace conceptually with `created_by_user_id` and/or `owner_user_id` where needed.
- Do not drop until app queries and RLS no longer depend on it and backups are verified.

## Foreign Key Strategy

- `household_id` on module tables references `households(id)`.
- `household_members.user_id` references `auth.users(id)`.
- `household_members.person_id` references `people(id)` and remains nullable.
- `people.household_id` references `households(id)`.
- Existing `user_id` references to `auth.users(id)` remain in place.

Avoid cascading deletes on module table `household_id` until deletion policy is explicitly decided. A household delete should be owner-only and probably soft-deleted first.

## Index Strategy

Baseline indexes:

- `households(created_by_user_id)`
- `household_members(household_id)`
- `household_members(user_id)`
- `household_members(household_id, user_id)`
- `household_members(household_id, role)`
- `people(household_id)`
- Each module table: `(household_id)`

Common compound indexes:

- `tasks(household_id, completed, due_date)`
- `home_maintenance(household_id, last_completed)`
- `pool_readings(household_id, logged_at desc)`
- `pool_treatments(household_id, logged_at desc)`
- `college_deadlines(household_id, completed, due_date)`
- `college_essays(household_id, status, due_date)`
- `retirement_accounts(household_id, name)`
- `net_worth_snapshots(household_id, date desc)`

## RLS Impact

Current policy source:

- `supabase/schema.sql:257` uses `user_id = auth.uid()`.

Target policy:

- General household tables: active owner/adult membership.
- Sensitive tables: owner/adult only.
- Child profile: no login access in first migration.
- Guest future: no access in first migration.

Do not switch RLS policies until:

- `household_id` backfill is complete.
- App can resolve active household.
- Owner/adult membership exists.
- Non-member denial is tested.

## Backward Compatibility Strategy

- Add nullable `household_id`.
- Backfill `household_id`.
- Keep `user_id`.
- Keep old user policies until household policies pass verification.
- Update app access to include active household.
- Only then consider enforcing `household_id not null` and deprecating old user-only policies.

## Draft / Pseudocode Only

Future SQL migration should follow this shape, but this is not executable here:

```text
create foundation tables
add nullable household_id to current tables
create default households for distinct user_id values
create owner memberships
backfill table.household_id from table.user_id
add indexes
add RLS helpers
add household policies after verification
```

