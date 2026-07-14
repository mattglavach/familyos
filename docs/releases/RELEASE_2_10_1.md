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

Release validation includes lint, type checking, the full Jest suite, database migration safety checks, seed guards, production build, bundle safety, Playwright desktop/mobile/tablet/dark/accessibility coverage, Git checks, deployment verification, and production smoke. Final evidence is recorded during release closeout.

## Rollback

Application rollback is a Vercel deployment rollback to v2.10.0. The additive `routines.status` column can safely remain unused during application rollback; no destructive database rollback is required.
