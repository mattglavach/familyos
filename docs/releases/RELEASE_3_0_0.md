# FamilyOS 3.0.0 Daily Experience Polish

## Outcome

Release 3.0.0 reduces friction and interface noise in Family Brief, Habits and Routines, Habit editing, and Pool status without changing underlying business behavior or ownership contracts.

## Scope

- Family Brief omits the redundant overdue-task instruction while keeping the recommendation title, supporting data, dismissal, and owning-module navigation.
- Checklist Habits and Routines expand inline from the summary and show only completion checkboxes or the empty-checklist state.
- Editing remains available through a separate, accessible Edit action.
- Habit edit Save and Cancel actions remain visible through a sticky footer that respects mobile safe-area insets.
- Pool Attention no longer repeats a chemical dose; detailed treatment guidance remains in Recommended Next Step.

## Architecture and Data

No schema, migration, RLS, authentication, permission, API, dependency, or integration changes are included. Existing completion history and Pool calculation behavior are preserved.

## Validation

Validation passed on 2026-07-14:

- `pnpm run check`: lint, declaration type checking, 36 unit suites and 141 tests, Release 2.9 through 2.10.1 database preservation checks, 18 seed-safety tests, production build, and bundle safety.
- `pnpm run test:regression`: 73 authenticated tests across desktop, 390px mobile, tablet, and dark mode.
- Targeted browser assertions confirm expansion stays inline, only checklist completion controls appear, edit remains explicit, and Habit edit Save/Cancel actions are fully visible and clickable.
- `git diff --check` passed.

## Production

- Published from `main` and tagged `v3.0.0` on 2026-07-14.
- Vercel application deployment `dpl_5UE9GJfH2fiX8yXcYtaBNueU5afo` reached `READY` for commit `4094567` at `familyos-pi-seven.vercel.app`.
- Desktop and 390px mobile public checks passed against the production alias and immutable deployment, including sign-in rendering, browser console monitoring, Weather API response, and production bundle secret-marker scanning.
- Vercel runtime review found only the known non-blocking Node `url.parse()` deprecation warning on Calendar and Weather routes.
- Authenticated production mutation testing was not run; the approved non-production authenticated matrix passed.

## Rollback

Revert the Release 3.0.0 application commit. No database rollback is required.
