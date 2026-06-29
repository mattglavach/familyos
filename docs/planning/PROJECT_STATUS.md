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
- Local Tasks UI write validation confirming `household_id` and legacy `user_id` are both populated
- Local Tasks-only household-aware RLS migration and validation
- Dashboard household-aware Tasks data access with legacy non-migrated widgets preserved
- Home Maintenance household-aware Tasks/Dashboard access with RLS deferred
- Google Calendar connection diagnostics and FamilyOS icon/manifest audit
- Live local Google Calendar verification diagnosed as blocked by placeholder OAuth client id

## In Progress
- Household foundation application integration

## Next
- Replace local placeholder Google OAuth client id with the real Web client id and rerun live Calendar verification
- Manually confirm Google Cloud OAuth JavaScript origins for Calendar sync
- Review the Tasks household RLS migration before any production application
- Draft and locally validate Home Maintenance RLS after the Home Maintenance app behavior is accepted
- Migrate one feature module at a time after Tasks proves the pattern

## Known Bugs

- No active deploy-blocking build errors after the CI lint cleanup.
- Production magic-link and password-reset redirects depend on Supabase Auth Site URL and allowed redirect URLs being set to the deployed FamilyOS origin, including `/reset-password` for recovery links.
- Google Calendar sync requires the active browser origin to be listed in Google Cloud Console Authorized JavaScript origins for the configured OAuth client.
- Live local Google Calendar sync also requires `.env.local` to use a real Google OAuth Web client id; `local-placeholder.apps.googleusercontent.com` produces `invalid_client`.
- Optional starter data requires replacing `seed_user_id` in `supabase/seed.sql` with a local auth user UUID before manual seed loading.
- Production household migration remains blocked until the Tasks household RLS migration, backfill state, and later module-level RLS rollout are reviewed.
- Production password reset/change validation remains blocked until Supabase Auth Site URL, redirect URLs, and email templates are reviewed.

## Technical Debt
- Existing feature screens still contain substantial inline styles and should be migrated gradually to shadcn/ui and Origin UI components during feature work.
- App module data access still relies on current `user_id` ownership; module queries are intentionally deferred until each module receives a focused household migration.

## Last Updated
June 29, 2026
