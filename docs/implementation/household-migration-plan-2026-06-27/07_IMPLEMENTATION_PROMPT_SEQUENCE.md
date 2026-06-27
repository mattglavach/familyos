# Implementation Prompt Sequence

Plan date: 2026-06-27

Use these future prompts in order. Each prompt is intentionally narrow.

## Prompt 1: Prepare Branch And Baseline Checks

```text
Family OS household migration prep.

Do not write migrations yet.
Do not change app behavior.
Do not modify production data.

Create or confirm a clean working branch for household migration planning.
Inspect current git status, current schema, and package scripts.
Run baseline checks already defined in package.json.
Summarize current warnings/errors.
Confirm whether supabase/schema.sql is the baseline for migration drafting.
Do not fix issues unless I explicitly ask.
```

## Prompt 2: Create Draft SQL Migration Only

```text
Create a draft SQL migration file for the household foundation.

Do not apply it.
Do not run it.
Do not modify app code.
Do not modify production data.

Draft only:
- profiles
- households
- household_members
- people
- nullable household_id columns on current shared tables
- indexes
- comments explaining backfill expectations

Keep user_id intact.
Clearly mark the migration as draft if it is not ready to run.
```

## Prompt 3: Review Migration Without Applying

```text
Review the draft household migration SQL.

Do not apply it.
Do not modify app code.
Do not run migrations.

Check for:
- destructive statements
- missing indexes
- unsafe foreign keys
- user_id removal
- household_id nullability assumptions
- RLS ordering risks
- rollback gaps

Produce a review note and update the draft only for documentation/safety comments if needed.
```

## Prompt 4: Apply Locally Only

```text
Apply the reviewed household migration locally or to a disposable Supabase project only.

Do not apply to production.
Do not modify production data.
Do not remove user_id.

Run local validation:
- table exists checks
- row count checks
- backfill checks
- owner membership checks
- basic RLS smoke tests if policies are included

Document results and do not proceed to app changes unless local validation passes.
```

## Prompt 5: Update App Queries

```text
Update app data access for active household context.

Do not change schema.
Do not run migrations.
Do not add new product features.

Scope:
- extract/use active household after auth
- update table access to include household context
- keep existing module behavior
- keep user_id compatibility
- avoid silent seed fallback for authenticated RLS errors

Run pnpm run check and manual smoke notes.
```

## Prompt 6: Add RLS Policies

```text
Add household RLS policy draft/implementation for local validation.

Do not apply to production.
Do not remove old user policies until tests pass.

Implement or draft:
- membership helper functions
- owner/adult access for shared module tables
- owner-only household/member management
- non-member denial
- sensitive module owner/adult policy

Run local RLS tests for owner, adult, and non-member.
```

## Prompt 7: Validation And Cleanup

```text
Validate the household migration end to end locally.

Do not apply to production.
Do not add new features.

Run:
- row count checks
- household_id null checks
- owner/adult/non-member RLS checks
- app smoke tests
- pnpm run check

Clean up only issues directly caused by the migration branch.
Document remaining risks.
```

## Prompt 8: Final Documentation Update

```text
Update documentation after local household migration validation.

Do not modify application code.
Do not modify schema unless explicitly requested.

Update:
- database schema docs
- RLS docs
- architecture decisions if assumptions changed
- current sprint/project status
- changelog

Include:
- what was validated
- what remains before production
- rollback notes
- production go/no-go recommendation
```

