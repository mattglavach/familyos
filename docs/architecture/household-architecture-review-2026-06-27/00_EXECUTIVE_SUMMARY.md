# Household Architecture Review Executive Summary

Review date: 2026-06-27

## Recommendation

Family OS should move to a **household-centered architecture** before more feature development. The current `user_id` model is acceptable for a single-user Phase 1 prototype, but it is the wrong long-term ownership boundary for a family operating system.

The target model should use:

- `auth.users` for login identities.
- `profiles` for user profile metadata.
- `households` as the primary ownership and security boundary.
- `household_members` for membership, role, and permission enforcement.
- `people` or member profiles for children, adults, contacts, vendors, coaches, doctors, and other non-login people.
- Module records scoped to `household_id`, with optional `owner_user_id`, `owner_member_id`, or `created_by_user_id` when individual attribution matters.

This recommendation resolves the core contradiction identified in the repository audit: current SQL adds `user_id` and RLS policies on every table (`supabase/schema.sql:236-258`), while the platform docs state that household scope is primary (`docs/platform/01_data_model.md:30-39`) and that `household_id` is the access-control anchor (`docs/platform/02_database_schema.md:61-75`).

## Top Risks If We Do Not Change Now

1. **Family sharing will be unsafe or bolted on.** The current RLS policy is `user_id = auth.uid()` (`supabase/schema.sql:257`), which cannot represent adult, child, admin, or guest access cleanly.
2. **Feature modules will duplicate ownership logic.** Finance, pool, college, documents, calendar, tasks, and AI context need shared household semantics.
3. **Data migration cost will grow quickly.** Every new table added with only `user_id` becomes another table to backfill and re-policy later.
4. **Privacy boundaries will stay ambiguous.** Sensitive modules need household-level sharing plus member-level and role-level restrictions.
5. **AI context will be risky.** AI summaries need a consistent scope boundary; user-owned rows do not answer "what data belongs to this household?"
6. **`src/App.js` will keep absorbing platform complexity.** It already owns auth, data loading, Google Calendar, Pool, Finance, College, Quick Add, and root navigation (`src/App.js:33`, `src/App.js:411`, `src/App.js:489`, `src/App.js:528`, `src/App.js:1034`, `src/App.js:1875`, `src/App.js:2566`, `src/App.js:2764`).

## Top Benefits Of Changing Now

1. Establishes the correct security boundary before Documents, Medical, AI context, and family sharing.
2. Gives every module a consistent ownership pattern.
3. Makes RLS policies reviewable and reusable.
4. Allows children and non-login family members to be modeled correctly.
5. Enables a future Command Center and AI context builder to query by household.
6. Reduces future migration risk while data volume is likely still small.

## Overall Readiness Score

**5 / 10**

The repository is ready for planning and a careful migration design, but not ready to implement the household model immediately without first agreeing on roles, ownership rules, and compatibility requirements. Current docs are directionally correct, but code and schema still implement user-scoped ownership.

## Recommended Next Implementation Phase

Recommended phase: **Phase 1.5 - Household Foundation And App Modularization**

Scope:

1. Finalize target household model and role rules.
2. Add migrations for `profiles`, `households`, `household_members`, and `people`.
3. Add `household_id` to existing app tables while retaining `user_id` temporarily as `created_by_user_id` or compatibility metadata.
4. Update RLS policies to enforce household membership.
5. Extract `src/App.js` into hooks, services, domain helpers, and feature modules.
6. Add tests around migration helpers, RLS assumptions, date/task logic, pool logic, finance logic, and AI route validation.

## Verification

Checks run after creating these documents:

- `pnpm run check` was run with the bundled Codex Node runtime on PATH.
- Result: passed.
- `eslint src --ext .js,.jsx` completed with 0 errors and 19 warnings, all in `src/App.js`.
- `react-scripts build` completed successfully with warnings matching the ESLint warnings.
- No implementation fixes, schema changes, migrations, or application-code changes were made.
