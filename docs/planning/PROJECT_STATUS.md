# Project Status

## Current Version
0.6 Design System & Shared Platform

## Current State
Release 0.6A migrated the frontend from Create React App to Vite on `feature/household-foundation`. Release 0.6A.2 local infrastructure, core signed-in verification, Tasks UI controls, and Home Maintenance UI controls passed. Release 0.6A.3 confirmed the Google OAuth origin blocker is fixed, but merge readiness remains blocked pending Calendar OAuth completion in a browser session that returns a token to FamilyOS. Platform Complete remains local/branch-only; production deployment has not occurred.

## Completed
- CRA-to-Vite frontend migration with Vite dev server on port `3000`
- Post-Vite local infrastructure verification for Vite dev server, local Supabase REST reachability, auth shell rendering, build, and check
- Post-Vite signed-in verification for password login, session persistence, sign-out/sign-back-in, Dashboard rendering, Tasks rendering, temporary task create/edit/delete UI, task ownership columns, Home Maintenance zero-state add UI, Home Maintenance create/delete UI, and Home Maintenance ownership columns
- Calendar OAuth rerun after Google Cloud authorized `http://localhost:3000`; previous `origin_mismatch` no longer appears
- Vite production build output preserved at `build/`
- Browser environment variables migrated to `VITE_*` with temporary `REACT_APP_*` fallback support
- Vite migration documentation and rollback notes
- Shadcn/ui and Vite readiness assessment for the current Family OS frontend stack
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
- Release 0.6A.3 Calendar OAuth completion before merge readiness

## Next
- Complete Google Calendar live OAuth connect/events/disconnect verification in a normal Chrome browser session at `http://localhost:3000`
- Update Vercel environment variables to `VITE_*`
- Reassess merge readiness after the signed-in verification matrix passes
- After Vite review, continue Release 0.6 with College deadline card/form migration using shared UI primitives
- Expand shared dashboard widgets as modules are migrated into the Family Command Center
- Tag Platform Complete as `v0.5-platform-complete` after release readiness is confirmed
- Use the module, assumptions, and decision engine standards for future Pool, Finance, Retirement, and College work
- Replace local placeholder Google OAuth client id with the real Web client id and rerun live Calendar verification
- Manually confirm Google Cloud OAuth JavaScript origins for Calendar sync
- Review the Tasks household RLS migration before any production application
- Draft and locally validate Home Maintenance RLS after the Home Maintenance app behavior is accepted
- Migrate one feature module at a time after Tasks proves the pattern

## Known Bugs

- No active deploy-blocking build errors after the Vite migration.
- Production magic-link and password-reset redirects depend on Supabase Auth Site URL and allowed redirect URLs being set to the deployed FamilyOS origin, including `/reset-password` for recovery links.
- Google Calendar sync requires the active browser origin to be listed in Google Cloud Console Authorized JavaScript origins for the configured OAuth client.
- Live local Google Calendar no longer fails with `origin_mismatch`, but the in-app browser lands on blank `https://accounts.google.com/gsi/transform` before returning a token to FamilyOS.
- Optional starter data requires replacing `seed_user_id` in `supabase/seed.sql` with a local auth user UUID before manual seed loading.
- Production household migration remains blocked until the Tasks household RLS migration, backfill state, and later module-level RLS rollout are reviewed.
- Production password reset/change validation remains blocked until Supabase Auth Site URL, redirect URLs, and email templates are reviewed.

## Technical Debt
- Existing feature screens still contain substantial inline styles and should be migrated gradually to shadcn/ui and Origin UI components during feature work.
- App module data access still relies on current `user_id` ownership; module queries are intentionally deferred until each module receives a focused household migration.
- Flagship modules still need shared profile, assumptions, history, decision intelligence, dashboard, and AI patterns implemented after this documentation sprint.
- Pool, Finance, Retirement, and College internals still need dedicated UI migration passes; Release 0.6 only established reusable presentation foundations and low-risk Dashboard/Tasks/AI adoption.
- Release 0.6A.3 is not ready to merge until Calendar OAuth is verified in a browser session that completes the Google Identity Services token flow.
- Vite reports a large chunk warning for the current single-bundle app; this is deferred until a later code-splitting or module-splitting sprint.
- Legacy `REACT_APP_*` env names still work temporarily, but active docs and future configuration should use `VITE_*`.

## Last Updated
June 30, 2026
