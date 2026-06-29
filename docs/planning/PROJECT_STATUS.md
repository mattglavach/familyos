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

## In Progress
- Household foundation application integration

## Next
- Fill local `.env.local` from local Supabase output
- Create a local auth user for app smoke testing
- Validate household context in the running app
- Migrate one feature module at a time from `user_id` assumptions to `household_id`

## Known Bugs

- No active deploy-blocking build errors after the CI lint cleanup.
- Production magic-link and password-reset redirects depend on Supabase Auth Site URL and allowed redirect URLs being set to the deployed FamilyOS origin, including `/reset-password` for recovery links.
- Google Calendar sync requires the active browser origin to be listed in Google Cloud Console Authorized JavaScript origins for the configured OAuth client.
- Optional starter data requires replacing `seed_user_id` in `supabase/seed.sql` with a local auth user UUID before manual seed loading.

## Technical Debt
- Existing feature screens still contain substantial inline styles and should be migrated gradually to shadcn/ui and Origin UI components during feature work.
- App module data access still relies on current `user_id` ownership; module queries are intentionally deferred until each module receives a focused household migration.

## Last Updated
June 29, 2026
