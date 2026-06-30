# Project Status

## Current Version
0.6 Design System & Shared Platform

## Current State
Release 0.6 shared UI foundation is in progress on `feature/household-foundation`. Platform Complete remains local/branch-only; production deployment has not occurred. The current sprint focuses on reusable presentation infrastructure only.

## Completed
- Shared UI framework components for cards, layout, status, loading, dialogs, tables, charts, and dashboard widgets
- Dashboard presentation migration to shared summary, metric, section, widget, action row, and empty-state components
- Tasks and Home Maintenance presentation migration to shared summary, section header, priority badge, empty, and loading components
- AI brief panel presentation migration to shared card/loading/empty primitives
- Authoritative Family OS release roadmap through 2.0
- Flagship module implementation standard
- Shared assumptions standard
- Shared decision engine standard
- Pool Intelligence 2.0 planning document
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
- Sprint 1E.1 Calendar OAuth verification documented as blocked until local client id is replaced

## In Progress
- Release 0.6 follow-on UI migration planning

## Next
- Continue Release 0.6 with College deadline card/form migration using shared UI primitives
- Expand shared dashboard widgets as modules are migrated into the Family Command Center
- Tag Platform Complete as `v0.5-platform-complete` after release readiness is confirmed
- Use the module, assumptions, and decision engine standards for future Pool, Finance, Retirement, and College work
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
- Flagship modules still need shared profile, assumptions, history, decision intelligence, dashboard, and AI patterns implemented after this documentation sprint.
- Pool, Finance, Retirement, and College internals still need dedicated UI migration passes; Release 0.6 only established reusable presentation foundations and low-risk Dashboard/Tasks/AI adoption.
- Browser verification of signed-in Dashboard, Tasks, and Home Maintenance screens still requires a valid local auth session; the unauthenticated shell loaded without console errors.

## Last Updated
June 30, 2026
