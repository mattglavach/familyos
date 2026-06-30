# Current Sprint

## Sprint Goal
Implement the Release 0.6 shared UI framework that every flagship module can reuse without redesigning Pool, Finance, Retirement, or College internals.

## Active Items
- [x] Review current components, modules, Dashboard, Tasks, Home Maintenance, and AI components
- [x] Add reusable shared card, layout, status, loading, modal, table, and chart presentation components
- [x] Add reusable dashboard widget framework
- [x] Apply shared components to Dashboard where low risk
- [x] Apply shared components to Tasks and Home Maintenance where low risk
- [x] Apply shared components to AI brief panel presentation
- [x] Update UI documentation, migration backlog, project status, and changelog
- [x] Run final validation commands
- [x] Start local app and verify reachable shell if practical

## Blockers
- No active Sprint 1B blocker is recorded for the household context layer.
- Optional starter data still requires replacing `seed_user_id` in `supabase/seed.sql` with a local auth user UUID before manual seeding.
- Production household migration remains blocked pending review of the Tasks household RLS migration and later module-by-module rollout plan.
- Production password reset/change validation remains blocked until Supabase Auth Site URL, redirect URLs, and email templates are reviewed.
- Live local Google Calendar verification remains blocked until `.env.local` uses a real Google OAuth Web client id instead of `local-placeholder.apps.googleusercontent.com`.
- Sprint 1E.1 could not complete live Google login/consent because the local Google OAuth client id still matches a placeholder-style value.
- Production deployment remains intentionally out of scope for this Release 0.6 UI sprint.

## Notes
- This sprint is presentation infrastructure only. No schema changes, migrations, Supabase changes, AI prompt changes, calculations, or module workflow redesigns are in scope.
- Shared UI framework components now live under `src/components/ui/` and are documented in `docs/ui/COMPONENT_LIBRARY.md`.
- Dashboard now uses shared summary cards, metric cards, sections, widget containers, action rows, section actions, and empty panels.
- Tasks/Home Maintenance now use shared summary, section header, priority badge, empty, and loading presentation while preserving swipe cards and save/delete behavior.
- AI brief panel helpers now reuse shared card, loading, and empty-state presentation while preserving prompts and follow-up behavior.
- `pnpm run build` and `pnpm run check` pass for the shared UI framework.
- Local app startup reached the FamilyOS auth gate with no captured browser console warnings/errors. Dashboard, Tasks, and Home Maintenance signed-in screens still require a valid local session for visual verification.
- Future flagship module work should reference `docs/architecture/MODULE_STANDARD.md`, `docs/architecture/ASSUMPTIONS_STANDARD.md`, and `docs/architecture/DECISION_ENGINE_STANDARD.md`.
- Pool Intelligence 2.0 planning now lives at `docs/modules/pool/POOL_INTELLIGENCE_2_0_PLAN.md`.
- Frontend foundation now includes Tailwind CSS, shadcn/ui aliases/primitives, Lucide icons, Recharts, and an Origin UI-style drawer component for new feature work.
- Production build now passes with `CI=true`; remaining deploy validation should happen through Vercel.
- Email magic-link redirects are generated from the current browser origin; Supabase Auth Site URL and allowed redirect URLs must include the deployed Vercel origin.
- Email magic-link sign-in now disables resend for 60 seconds after successful sends to reduce Supabase rate-limit errors.
- Email/password login is now the primary private-household auth path; users should be manually created in Supabase with public sign-up disabled.
- Password reset uses Supabase recovery emails redirected to `/reset-password`; Supabase Auth allowed redirect URLs must include the deployed app origin plus `/reset-password`.
- Google Calendar OAuth uses the current browser origin; Google Cloud Console Authorized JavaScript origins must include localhost, the Vercel production origin, and any custom domain used to open the app.
- Phase 1 UI migration has started with shared form primitives, segmented/chip controls, status badges, section headers, and empty-state helpers only; feature screens are intentionally unchanged.
- QuickAdd is the first migrated feature surface using the shared UI primitives; Finance, Pool, College, auth/setup, and database logic were left unchanged.
- AuthGate and SetupRequired now use shared UI primitives while preserving password sign-in, magic-link fallback, setup gating, and Supabase auth behavior.
- App shell/navigation now uses shared UI primitives/classes while preserving tab routing, active tab behavior, sign-out, and Google Calendar connect/sync actions.
- PoolBrief and RetirementBrief now use shared AI brief panel helpers while preserving AI prompts, history, refresh/regenerate, copy, and follow-up behavior.
- Next UI migration target is shared dashboard/card patterns before Pool or Finance internals.
- Household foundation migration file exists at `supabase/migrations/20260627_household_foundation.sql`; local startup has applied the baseline and household migrations successfully before optional seed handling.
- `.env.local` was corrected from an empty directory to an ignored placeholder file copied from `.env.example`; local Supabase values still need to be filled in after `supabase start`.
- `pnpm run check` passes on the household foundation branch.
- Authentication audit tightened email validation, action-specific loading states, duplicate-submit protection, and expired reset-link handling. Supabase Dashboard redirect configuration still requires live verification.
- Household context now loads profile, household, membership, role, and coarse permissions after authenticated session without migrating module queries yet.
- Local household context smoke testing passed after adding authenticated table grants required by the local Supabase API; module-table RLS remains the legacy `user_id` policy.
- Clean local Supabase replay now passes from migrations, and Tasks now uses Household Context for `household_id` reads/inserts when available while retaining legacy fallback.
- Local email/password login works through the app UI, session persists after reload, Household Context loads, and Tasks renders the household-aware empty state.
- Local Tasks UI creation now writes `household_id`, preserves legacy `user_id`, survives reload, and creates no duplicate rows under the current legacy Tasks RLS policy.
- Tasks now has a local-only household-aware RLS migration that allows owner/adult household access while preserving legacy null-`household_id` fallback rows.
- Dashboard now uses Household Context for Tasks-derived data only; Pool, Finance, College, notes, and home maintenance remain legacy user-scoped until their focused migrations.
- Home Maintenance now shares the Tasks/Dashboard household-aware query pattern while retaining legacy `user_id` and legacy RLS.
- Google Calendar connection errors now surface in the app shell, and setup docs include both `localhost` and `127.0.0.1` OAuth origins for local development.
- Live Google OAuth returned `invalid_client` because local env still used a placeholder client id; placeholder detection now blocks that before redirecting to Google.
- Calendar popup flow uses no app redirect URI; Google Cloud must authorize the exact JavaScript origin and `.env.local` must use the real Web client id.

- App structure refactor moved the shell, hooks, and user-facing modules out of the monolithic src/App.js; pnpm run check passes after the split.
