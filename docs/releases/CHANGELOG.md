# Changelog

## Unreleased
- Published the authoritative Family OS roadmap from 0.5.1 Platform Complete through the 2.0 ecosystem release.
- Added the flagship module implementation standard for profile, assumptions, history, decision intelligence, AI, dashboard integration, household architecture, RLS, and testing.
- Added the shared assumptions standard for editable recommendation inputs and their UI/AI behavior.
- Added the shared decision engine standard with required recommendation fields and Pool, Finance, Retirement, and College examples.
- Added the Pool Intelligence 2.0 plan covering profile, assumptions, known equipment/configuration, daily workflow, history, dashboard, AI, guardrails, confidence scoring, and implementation phases.
- Documented Sprint 1E.1 live Calendar OAuth as blocked by a still-placeholder local Google OAuth client id.
- Diagnosed live local Google Calendar OAuth as blocked by a placeholder client id and hardened placeholder detection before Google redirect.
- Improved Google Calendar connection diagnostics, documented exact local OAuth origins, and verified FamilyOS icon/manifest references.
- Migrated Home Maintenance reads/inserts in Tasks and Dashboard to use Household Context while preserving legacy `user_id` and deferring RLS.
- Migrated Dashboard task reads to use Household Context while keeping non-migrated widgets on legacy user-scoped data access.
- Added and locally validated a Tasks-only household-aware RLS migration while preserving legacy null-`household_id` fallback behavior.
- Validated through the local Tasks UI that new task records write `household_id` while preserving legacy `user_id` and avoiding duplicate rows.
- Validated local email/password auth through the app UI after household context and Tasks migration; documented future password reset/change requirements.
- Validated clean local Supabase migration replay and prepared Tasks for household-aware reads/inserts while preserving legacy `user_id` fallback behavior.
- Smoke tested the local household context path and added required authenticated table grants for local Supabase API access under existing RLS policies.
- Added the app-level household context provider, hook, and Supabase household service as the foundation for future `household_id` module migrations.
- Improved authentication UX with action-specific loading states, stricter email validation, clearer password reset confirmation, and an expired reset-link screen.
- Added household foundation local-only migration setup documentation and Sprint 1 report; local migration apply remains blocked pending Docker Desktop, Supabase CLI, and `psql`.
- Created a local-only household foundation migration file under `supabase/migrations/` without applying it.
- Added a Supabase password reset flow with approved-email validation, reset email delivery, and an in-app password update screen for recovery sessions.
- Migrated PoolBrief and RetirementBrief UI to shared AI brief panel helpers while preserving AI prompts, history, refresh, copy, and follow-up behavior.
- Migrated app header, bottom navigation, and global loading wrapper to shared UI primitives/classes while preserving routing and auth/calendar actions.
- Migrated AuthGate and SetupRequired to shared card, form, button, input, section header, and status badge primitives while preserving auth behavior.
- Migrated QuickAdd UI to the shared drawer, form primitives, segmented controls, chips, and Lucide icons while preserving existing save behavior.
- Added Phase 1 UI migration primitives for forms, segmented controls, chips, section headers, empty states, and status badges without changing feature screen behavior.
- Made email/password the primary Supabase login path for the private household app while keeping magic links as a fallback.
- Refactored the React app into a modular source structure with src/app, src/modules, src/hooks, and src/utils while preserving current behavior.
- Added resend cooldown and friendly rate-limit messaging to Supabase email magic-link sign-in.
- Documented Google Calendar OAuth origin setup for localhost, Vercel production, custom domains, and preview deployments.
- Added a clearer Google Calendar `origin_mismatch` diagnostic that reports the current app origin to add in Google Cloud Console.
- Clarified Supabase magic-link redirect configuration and kept email sign-in redirects tied to the current app origin.
- Fixed Vercel production build failure by clearing CRA ESLint warnings that are treated as errors in CI.

## 0.1.0 - Documentation Foundation
- Added Family OS operating manual.
- Added AI agent instructions.
- Added planning, architecture, database, UI, module, and release documentation.
- Added Platform architecture documentation for shared entities, task engine, notifications, AI context, API contracts, and Command Center.
- Added Tailwind CSS, shadcn/ui configuration, Lucide icons, Recharts dependency, and Origin UI-style drawer primitives for frontend feature work.
- Expanded the UI design system and added a prioritized UI migration backlog based on the current `src/App.js` inline-style hotspots.
