# Project Status

## Current Version
0.1.0

## Current State
Documentation foundation being established.

## Completed
- Family OS v1 documentation workspace
- Platform architecture documentation
- Frontend standard foundation for Tailwind CSS, shadcn/ui primitives, Lucide icons, Recharts, and Origin UI-style drawer usage
- Vercel-style production build validation with `CI=true`
- Supabase magic-link redirect audit for deployed Vercel sign-in
- Supabase magic-link resend cooldown and rate-limit messaging
- Private household email/password login as the primary Supabase auth path
- Supabase password reset email and recovery-session password update flow
- Authentication UX audit covering sign-in, reset request, recovery route, magic-link fallback, and sign-out state
- Google Calendar OAuth origin setup documentation for local and Vercel deployments
- Modular app structure with app shell, hooks, modules, and refactor documentation
- Household foundation branch with local-only migration file and validation/setup documentation
- Local Supabase baseline and household foundation migrations prepared for ordered local startup
- App-level household context foundation for profile, membership, role, and permissions
- Local household context smoke test with local-only auth users
- Clean local Supabase migration replay from baseline and household migrations
- Tasks household-aware read/insert preparation with legacy fallback
- Local email/password auth UI validation with Household Context and Tasks

## In Progress
- Household foundation application integration

## Next
- Create local task records through the UI and confirm `household_id` is written
- Design a separate Tasks RLS migration only after app behavior is validated
- Migrate one feature module at a time after Tasks proves the pattern

## Known Bugs

- No active deploy-blocking build errors after the CI lint cleanup.
- Production magic-link and password-reset redirects depend on Supabase Auth Site URL and allowed redirect URLs being set to the deployed FamilyOS origin, including `/reset-password` for recovery links.
- Google Calendar sync requires the active browser origin to be listed in Google Cloud Console Authorized JavaScript origins for the configured OAuth client.
- Optional starter data requires replacing `seed_user_id` in `supabase/seed.sql` with a local auth user UUID before manual seed loading.
- Production household migration remains blocked until Tasks behavior, backfill, and later module-level RLS are reviewed.
- Production password reset/change validation remains blocked until Supabase Auth Site URL, redirect URLs, and email templates are reviewed.

## Technical Debt
- Existing feature screens still contain substantial inline styles and should be migrated gradually to shadcn/ui and Origin UI components during feature work.
- App module data access still relies on current `user_id` ownership; module queries are intentionally deferred until each module receives a focused household migration.

## Last Updated
June 29, 2026
