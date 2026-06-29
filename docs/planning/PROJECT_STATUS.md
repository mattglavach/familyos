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

## In Progress
- Household foundation local environment setup

## Next
- Install Docker Desktop, Supabase CLI, and `psql`
- Initialize local Supabase configuration without linking production
- Apply the household foundation migration locally only
- Validate household bootstrap and foundation RLS locally

## Known Bugs

- No active deploy-blocking build errors after the CI lint cleanup.
- Production magic-link and password-reset redirects depend on Supabase Auth Site URL and allowed redirect URLs being set to the deployed FamilyOS origin, including `/reset-password` for recovery links.
- Google Calendar sync requires the active browser origin to be listed in Google Cloud Console Authorized JavaScript origins for the configured OAuth client.
- Household migration local apply is blocked until Docker Desktop, Supabase CLI, `psql`, and `supabase/config.toml` are available.

## Technical Debt
- Existing feature screens still contain substantial inline styles and should be migrated gradually to shadcn/ui and Origin UI components during feature work.
- App data access still relies on current `user_id` ownership; household-aware auth/session context and module queries are intentionally deferred until local migration validation passes.

## Last Updated
June 28, 2026
