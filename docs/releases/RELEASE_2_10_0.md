# FamilyOS 2.10.0 - Core Experience Maturity

Release date: 2026-07-13

## Outcome

FamilyOS 2.10 tightens the existing daily loop instead of expanding the product surface. Home now answers “What should I do next?” through compact, keyboard-accessible Family Brief cards that open the most specific available destination and degrade safely when a record is missing. Upcoming Calendar preserves event-level navigation. Primary navigation is Home, Habits, Calendar, Tasks, and More, with one global header Add control for Quick Add.

Habits now supports both simple one-action habits and multi-step routines in one durable workspace. Users can assign practical categories and household ownership, work routine steps in order, preserve partial progress, derive completion from required active steps, reopen a routine by unchecking a required step, and record skip or not-applicable without treating either as success or a broken streak.

## Architecture and behavior

- Recommendation providers continue to own prioritization evidence while `linkResolver.js` centralizes record-level and safe fallback navigation.
- Family Brief cards are navigation surfaces only. Dismiss remains a separate explicit control, and recommendations never mutate module-owned records.
- Existing records remain simple habits by default. Multi-step behavior is additive and uses the established `habit_actions` and `habit_action_history` ownership model.
- Household-wide habits produce one shared household completion. Assigned habits retain person context without duplicating completions.
- Neutral statuses are `skipped` and `not_applicable`; they are excluded from success-rate denominators and do not break streak continuity.
- Required active steps determine routine completion. Optional, archived, or removed steps do not block completion.

## Database and rollback

Migration `20260713010000_release_2_10_core_experience.sql` adds category and guidance metadata, step active/archive and update timestamps, routine in-progress status, and explicit completed, skipped, and not-applicable completion constraints. It is additive and retains all existing tables, records, RLS policies, grants, and owner/adult write rules.

Rollback is application-first: redeploy the v2.9.0 release and retain the additive columns and completion values. Do not drop columns or delete neutral-status records. If a production rollback is required before v2.9 code can consume a newer completion value, preserve the database backup and normalize only affected statuses through a reviewed forward migration.

## Validation

- Lint and declaration type checks passed.
- 35 unit suites and 134 tests passed.
- Release 2.9 and 2.10 migration assertions and 18 seed-safety tests passed.
- All 21 migrations rebuilt successfully on a blank local database.
- Production build and bundle-secret scan passed.
- 73 authenticated Playwright tests passed across desktop, 390px mobile, tablet, and dark mode, including accessibility, persistence, failure paths, navigation, Quick Add, Habits/Routines, and established release regressions.

Production migration, deployment, tag, and post-deployment evidence are recorded during release closeout in the sprint status and release notes.
