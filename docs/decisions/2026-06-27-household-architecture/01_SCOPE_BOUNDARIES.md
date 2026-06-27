# Household Architecture Scope Boundaries

Decision date: 2026-06-27

## Household-Owned Data

Belongs to `households` through `household_id`:

- Shared tasks and reminders.
- Home maintenance.
- Pool readings, treatments, schedules, settings, and maintenance.
- Finance accounts, debts, mortgage, transactions, net worth, and action items.
- Retirement accounts, assumptions, scenarios, and planning outputs.
- College planning records, goals, schools, test plans, essays, deadlines, and scores.
- Documents and document metadata.
- Calendar events imported or shared into Family OS.
- Properties, assets, metrics, notes, goals, and timeline entries.
- AI context snapshots/summaries generated from household data.

Rule: if the record describes shared household operations, assets, planning, or family context, it should be household-owned.

## User / Profile-Owned Data

Belongs to the authenticated user:

- Supabase Auth identity.
- Profile metadata such as display name, email, avatar, and personal preferences.
- Personal notification preferences.
- Personal OAuth connection metadata.
- Private UI preferences such as default view or theme.
- Personal-only drafts, if the product later supports them.

Rule: if the record exists because an individual signs in or configures their own experience, it can remain user-scoped.

## `household_member` Data

Belongs to the membership relationship between a user/person and a household:

- Household role: `owner`, `adult`, `child`, `guest`.
- Membership status: invited, active, disabled.
- Invitation metadata.
- Join date.
- Optional link to a `person` record.
- Future per-member permission overrides, only if coarse roles are insufficient.

Rule: do not store general user profile data here. Store household-specific membership and access facts.

## Module-Specific Records

Module-specific records should include `household_id` and optional attribution:

- `created_by_user_id`
- `updated_by_user_id`
- `owner_person_id`
- `subject_person_id`
- `module_key`, when the table is shared across modules

Module-specific tables are allowed when the data is structurally domain-specific, such as `pool_readings` or `retirement_assumptions`. Generic concepts such as tasks, documents, events, notes, goals, metrics, reminders, and timeline entries should be shared platform concepts where possible.

## App Settings

Use a split model:

- Household settings: household name, active modules, shared defaults, invite policy, household-level notification rules.
- User settings: personal display preferences, personal notification channels, selected active household, OAuth connection state.
- Module settings: household-owned unless clearly personal.

## AI Context

AI context should be household-scoped but role-filtered.

Include:

- Purpose-specific summaries.
- Source record references.
- Module and role filters.
- Prompt/context version metadata.
- Created-by user and timestamp.

Do not include:

- Raw dumps of every household table.
- Adult-only finance/document/medical data in child contexts.
- Calendar OAuth tokens.
- Unredacted sensitive document content without explicit design.

## Not Included In The First Migration

The first migration should not include:

- Guest-facing product flows.
- Full invitation UX.
- Multi-household switching UI beyond the minimum active household context.
- Fine-grained per-field permissions.
- Document storage bucket redesign.
- Medical module schema.
- Full AI memory system.
- Calendar server-side token storage.
- TypeScript migration.
- Route-aware navigation.
- Major UI redesign.

First migration goal: establish household ownership and preserve existing app behavior.

