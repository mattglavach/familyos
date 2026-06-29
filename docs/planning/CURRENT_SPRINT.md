# Current Sprint

## Sprint Goal
Establish the shared AI development workspace and documentation foundation.

## Active Items
- [x] Add documentation structure
- [x] Add AGENTS.md
- [x] Add GitHub templates
- [x] Add Platform architecture documentation
- [x] Add frontend standard foundation
- [x] Fix Vercel production build failure from CRA CI lint warnings
- [x] Audit Supabase email magic-link redirect behavior for Vercel deployment
- [x] Document Google Calendar OAuth origin configuration for local and Vercel deployments
- [x] Add Supabase magic-link resend cooldown protection
- [x] Make private household email/password login the primary Supabase auth path
- [x] Add Supabase password reset flow for approved household users
- [x] Validate current app structure
- [x] Create household foundation branch and local-only migration file
- [x] Validate local environment readiness for household migration
- [x] Audit and improve authentication reset/sign-in UX without production access
- [x] Install local Supabase prerequisites
- [x] Create local baseline schema migration for Supabase startup
- [x] Fix local household migration SQL ambiguity
- [x] Allow local Supabase startup to skip optional seed data until a local auth user exists
- [x] Add app-level household context layer
- [x] Smoke test local household context with local auth users
- [x] Validate clean local Supabase migration replay
- [x] Prepare Tasks for household-aware reads and inserts

## Blockers
- No active Sprint 1B blocker is recorded for the household context layer.
- Optional starter data still requires replacing `seed_user_id` in `supabase/seed.sql` with a local auth user UUID before manual seeding.
- Production household migration remains blocked pending review of the Tasks transition and later module-level RLS plan.

## Notes
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

- App structure refactor moved the shell, hooks, and user-facing modules out of the monolithic src/App.js; pnpm run check passes after the split.
