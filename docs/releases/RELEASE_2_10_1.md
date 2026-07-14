# FamilyOS 2.10.1 Usability Stabilization

Date: 2026-07-14

## Objective

Mature the existing Home, Family Brief, Calendar, Habits and Routines, Pool, and AI Workspace experiences without adding modules or changing the core architecture. Microsoft To Do synchronization is deferred to 2.11.0.

## Delivered

- Compact Home greeting with accessible Personalize Home and Open AI Brief icon actions.
- Action-only Family Brief cards with recommendation evidence retained internally.
- Three-event Calendar cap grouped by Today, Tomorrow, weekday, or Later This Week.
- Collapsed routine disclosures with inline step completion and derived completion/reopening.
- Active, Paused, and Archived lifecycle controls, filters, confirmation, and history preservation.
- Relevant, capped habit recommendations on Home with specific deep links and partial progress.
- Pool copy separation and shared icon-action reuse for affected low-risk controls.
- AI Workspace onboarding, starter prompts, intent descriptions, and explicit approval language.

## Database

The additive routine lifecycle migration adds `routines.status`, backfills existing archived records, adds a constrained household status index, and preserves RLS and all history.

## Validation

Release validation passed lint, type checking, 36 Jest suites with 139 tests, database migration safety, 22-migration clean rebuild, seed guards, production build, bundle safety, and `git diff --check`. The Playwright run passed 65 scenarios initially; eight stale-selector failures caused by intentional label changes were updated and the affected release/smoke workflows then passed across desktop, 390px mobile, tablet, and dark mode. Accessibility, authenticated Pool persistence, auth, task CRUD, keyboard focus, responsive containment, console, and page-error checks passed.

Production database schema and data backups are retained in the local temporary recovery directory. The v2.10.1 migration is applied and all 22 migration versions align. The final Vercel deployment is READY and aliased to `https://familyos-pi-seven.vercel.app`. Desktop/mobile unauthenticated, weather, route, console, and bundle-secret production checks passed. Authenticated production mutation testing was not performed because no approved production browser session was available; authenticated validation was completed against the approved non-production project.

The known Node `url.parse()`/deprecation warning remains non-blocking and produced no functional error.

## Rollback

Application rollback is a Vercel deployment rollback to v2.10.0. The additive `routines.status` column can safely remain unused during application rollback; no destructive database rollback is required.
