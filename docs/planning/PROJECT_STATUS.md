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
- Google Calendar OAuth origin setup documentation for local and Vercel deployments

## In Progress
- Shared GitHub workspace documentation

## Next
- Validate app architecture
- Prioritize next module
- Create first implementation package for Codex

## Known Bugs

- No active deploy-blocking build errors after the CI lint cleanup.
- Production magic-link redirects depend on Supabase Auth Site URL and allowed redirect URLs being set to the deployed FamilyOS origin.
- Google Calendar sync requires the active browser origin to be listed in Google Cloud Console Authorized JavaScript origins for the configured OAuth client.

## Technical Debt
- Existing feature screens still contain substantial inline styles and should be migrated gradually to shadcn/ui and Origin UI components during feature work.

## Last Updated
June 27, 2026
