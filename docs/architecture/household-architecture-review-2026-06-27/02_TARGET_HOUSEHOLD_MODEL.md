# Target Household Model

Review date: 2026-06-27

## Target Architecture

Family OS should use a household-centered model with user identities as members of one or more households. The household is the default ownership boundary. Users are authentication principals. People/member profiles are domain entities representing family members, children, contacts, and other people, whether or not they can sign in.

## Core Tables

### `profiles`

Purpose: one row per `auth.users` identity.

Suggested fields:

- `id uuid primary key references auth.users(id) on delete cascade`
- `email text`
- `display_name text`
- `avatar_url text`
- `created_at timestamptz`
- `updated_at timestamptz`

Ownership: user.

Notes: Avoid putting household role here because one user may later belong to multiple households.

### `households`

Purpose: the family/household workspace.

Suggested fields:

- `id uuid primary key`
- `name text not null`
- `created_by_user_id uuid references auth.users(id)`
- `created_at timestamptz`
- `updated_at timestamptz`
- `status text default 'active'`

Ownership: household.

Notes: This should become the main partition key for Family OS data.

### `household_members`

Purpose: joins authenticated users and non-login member profiles to households.

Suggested fields:

- `id uuid primary key`
- `household_id uuid references households(id) on delete cascade`
- `user_id uuid references auth.users(id) on delete cascade null`
- `person_id uuid references people(id) null`
- `role text not null`
- `status text not null default 'active'`
- `invited_by_user_id uuid references auth.users(id) null`
- `joined_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Ownership: household membership.

Required constraint: at least one of `user_id` or `person_id` should be present.

### `people`

Purpose: represents family members, children, contacts, vendors, coaches, doctors, teachers, and other people.

Suggested fields align with `docs/platform/01_data_model.md:19-28`:

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

Ownership: household, optionally tied to a login through `household_members.user_id`.

## Roles

Recommended initial roles:

- `admin`: household owner/manager. Can manage household settings, members, roles, and all household data.
- `adult`: trusted adult. Can access most household data, with optional restrictions for private user preferences.
- `child`: limited member. Can see assigned tasks/events and child-safe views.
- `guest`: limited external access. Future role for sitters, relatives, service providers, or club/community contexts.

Keep roles coarse at first. Add granular permissions only when a real use case requires them.

## Permissions

Recommended permission model:

- Start with role-derived permissions.
- Add module-specific permission overrides later if necessary.
- Use a helper SQL function such as `is_household_member(household_id)` and `has_household_role(household_id, roles[])` for RLS.
- Store adult-only restrictions for privacy-sensitive modules in table policies, not only frontend conditionals.

## What Belongs To A User

User-owned:

- Authentication identity.
- Profile metadata.
- Personal UI preferences.
- Notification preferences.
- OAuth connection metadata/tokens if stored server-side.
- Private drafts or personal-only notes, if the product supports them.

## What Belongs To A Household

Household-owned:

- Tasks.
- Home maintenance.
- Pool readings, treatments, schedules, and settings.
- Finance accounts and snapshots.
- Retirement planning data.
- College planning records.
- Documents and document metadata.
- Calendar/event records imported into Family OS.
- AI context snapshots and summaries.
- Properties, assets, metrics, reminders, goals, notes, and timeline entries.

## What Belongs To A Household Member / Person

Member/person-owned within a household:

- Task assignment.
- Goal ownership.
- College planning records for a child.
- Medical records for a person.
- Event participation.
- Document subject/person relationship.
- Notification targets.

Use `owner_person_id`, `subject_person_id`, or join tables where multiple people are involved.

## Module-Specific Records

Module-specific records should generally include:

- `id`
- `household_id`
- `module_key` when the table is shared across modules
- `created_by_user_id`
- `updated_by_user_id`
- `created_at`
- `updated_at`

Module-specific tables are acceptable when they represent true domain structure, such as `pool_readings`, `retirement_accounts`, or `college_schools`. They should still be scoped to `household_id`.

## Target Ownership Rule

Default rule: **if a record describes household operations or shared family context, it belongs to the household.**

Use user ownership only for identity, preferences, private connections, and attribution.

