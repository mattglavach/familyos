# Project Status

## Current Version
0.1.0

## Current State
Release 0.6B dashboard implementation is in progress.

## Completed
- Family OS v1 documentation workspace
- Platform architecture documentation
- Frontend standard foundation for Tailwind CSS, shadcn/ui primitives, Lucide icons, Recharts, and Origin UI-style drawer usage
- Vercel-style production build validation with `CI=true`
- Supabase magic-link redirect audit for deployed Vercel sign-in
- Supabase magic-link resend cooldown and rate-limit messaging
- Private household email/password login as the primary Supabase auth path
- Google Calendar OAuth origin setup documentation for local and Vercel deployments
- Modular app structure with app shell, hooks, modules, and refactor documentation
- Release 0.6B Milestone 1 dashboard layout pass
- Release 0.6B Milestone 2 Google Calendar integration pass
- Release 0.6B Milestone 3 family member management pass
- Release 0.6B Milestone 4 task management MVP
- Release 0.6B Milestone 5 UX hardening pass

## In Progress
- Release 0.6B settings/profile follow-up milestone

## Next
- Review Milestone 5 hardened dashboard/task/family/calendar behavior on real mobile viewport
- Continue with Milestone 6 settings and profile pass
- Keep household migration work separate from Release 0.6B UI milestones unless explicitly requested

## Known Bugs

- No active deploy-blocking build errors after the CI lint cleanup.
- Production magic-link redirects depend on Supabase Auth Site URL and allowed redirect URLs being set to the deployed FamilyOS origin.
- Google Calendar sync requires the active browser origin to be listed in Google Cloud Console Authorized JavaScript origins for the configured OAuth client.
- Dashboard family member edits are stored in browser localStorage for Release 0.6B because the current applied Supabase schema does not include a family member table.
- Task assignee, status, created date, and completed date are stored in browser localStorage for Release 0.6B because the current applied Supabase tasks table does not include those columns.

## Technical Debt
- Existing feature screens still contain substantial inline styles and should be migrated gradually to shadcn/ui and Origin UI components during feature work.

## Last Updated
July 1, 2026
