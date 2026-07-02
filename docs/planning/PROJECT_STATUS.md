# Project Status

## Current Version
1.0

## Current State
Release 1.0 core MVP implementation and authenticated local browser smoke validation are complete on branch `release/1.0`.

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
- Release 0.6B Milestone 6 settings/profile pass
- Release 0.6B Milestone 7 stability and release candidate pass
- Release 0.6C Milestone 1 data model audit and migration plan
- Release 0.6C Milestone 2 production household foundation migration draft
- Release 0.6C Milestone 3 migration dry-run preparation and validation plan
- Release 0.6C Milestone 4 dry-run execution-pending update with exact local/staging commands
- Release 0.6C Milestone 5 local household foundation migration dry run, revision, validation SQL, and RLS smoke tests
- Release 0.6C Milestone 6 fresh schema-only and staging-like migration validation, idempotency checks, RLS smoke tests, and task compatibility checks
- Release 0.6C Milestone 7 migrated-local app smoke tests, post-migration auth user bootstrap trigger, and production readiness checklist
- Release 0.6C Milestone 8 production readiness signoff review and recommendation to apply the combined migration as-is after backup capture and owner approval
- Release 0.6C production attempt 1 target verification, backup artifact capture, failed preflight, and baseline drift diagnosis
- Release 0.6C production baseline alignment plan for missing `user_id` ownership and public/open policy drift
- Release 0.6C production auth ownership baseline migration with approved owner backfill
- Release 0.6C production household foundation migration
- Release 0.6C production validation SQL, grants validation, RLS checks, and app-path smoke tests
- Release 0.7 active household runtime context
- Release 0.7 household-aware Supabase table access
- Release 0.7 Supabase-backed family members, settings/profile defaults, and task metadata
- Release 0.7 Google Calendar server-side storage assessment
- Release 0.8 `calendar_connections` migration and API foundation
- Release 0.8 Settings UI for server-side Google Calendar connection status
- Release 0.8 signed Google OAuth callback exchange
- Release 0.8 encrypted server-side Google token persistence, refresh, revoke, and normalized event fetch
- Release 0.8 dashboard integration for server-side Google Calendar events
- Release 0.8 legacy browser calendar fallback labelling and no new `gc_token` persistence
- Release 0.9 secure household invitation migration with hashed invite tokens and RPC accept/decline flows
- Release 0.9 invite acceptance UI, invite token preservation through auth redirects, active household switching, and Settings household member/invite management
- Release 0.9 disposable local Supabase validation for migration chain, invitation lifecycle, owner-only controls, RLS denial paths, and active household preference switching
- Release 0.9 browser smoke validation on local Supabase for owner, adult, and viewer collaboration flows, including invite create/preview/accept/decline/revoke, role update, member removal, active household switching, and hidden non-owner controls
- Release 0.9.1 permanent engineering process framework covering release, feature, coding, architecture, UI, testing, documentation, git, review, checklist, and prompt workflows
- Release 0.9.1 governance framework covering Family OS principles, project structure, module template, production readiness, AI engineering, API, security, performance, environments, dependencies, ADRs, planning logs, and reusable templates
- v0.9.0 released with household collaboration validation complete
- v0.9.1 released with permanent engineering framework and governance templates
- v0.9.2 repository documentation cleanup completed
- Release 1.0 specification and implementation blueprint defined in `docs/planning/RELEASE_1_0_SPEC.md`
- Release 0.9.3 permanent Product Handbook established under `docs/product`
- Release 1.0 core MVP implementation added Home dashboard ordering, Calendar, More navigation, Universal Quick Add launch, Universal Search, in-app Notifications, and task search
- Release 1.0 authenticated local browser smoke validation passed against local Supabase for owner, adult, viewer, Home, Tasks, Calendar, Quick Add, Universal Search, Notifications, More, household switching, Settings, invite create/revoke, owner role update, non-owner control hiding, and mobile sanity checks

## In Progress
- None for Release 1.0 validation.

## Next
- Final release review, merge, and tag decision for Release 1.0.
- Configure Release 0.8 server OAuth environment values in Vercel before removing the legacy calendar fallback.
- Decide whether to remove the legacy browser calendar fallback after deployed validation.
- Keep household migration work separate from Release 0.6B UI milestones unless explicitly requested

## Known Bugs

- No active deploy-blocking build errors after the CI lint cleanup.
- Production magic-link redirects depend on Supabase Auth Site URL and allowed redirect URLs being set to the deployed FamilyOS origin.
- Google Calendar sync requires the active browser origin to be listed in Google Cloud Console Authorized JavaScript origins for the configured OAuth client.
- Google Calendar token storage remains browser-local only for older legacy fallback sessions. Release 0.8C no longer writes new `gc_token` values, and the server route does not expose tokens to the frontend. Deployed validation still requires server env configuration and Google Cloud redirect URI setup.
- Legacy browser metadata keys for Release 0.6B settings, family members, and task metadata may remain on devices until local browser data is reset, but they are no longer the normal persistence path.
- Six-item bottom navigation should be checked on physical mobile devices before broad family use.
- The legacy household foundation migration is marked local-only and must not be applied to production.
- Release 0.7 now uses the household foundation for active household context, family members, settings/profile defaults, and task metadata while preserving staged module-table compatibility.
- Release 0.9 invite acceptance requires the invited email to already have or receive a valid Supabase auth session; public sign-up remains deferred.
- Release 0.9 validation passed against disposable local database `familyos_r09_validation` and local browser smoke users; production was not touched.

## Technical Debt
- Existing feature screens still contain substantial inline styles and should be migrated gradually to shadcn/ui and Origin UI components during feature work.
- Release 0.7 removes normal browser-local persistence for settings, family members, and task metadata. Release 0.8 moves secure calendar connection state server-side while selected UI-only module preferences remain browser-local.
- Current Supabase module tables still use direct `user_id = auth.uid()` RLS; household-scoped RLS must be introduced only after backfill and active-household app context are validated.
- The household foundation draft intentionally keeps module-table `user_id` RLS in place while adding nullable `household_id` fields for staged migration.
- Release 0.6C production baseline alignment backfilled existing module rows to the approved owner UUID. Future household-scoped sharing should move access through `household_id` once active-household runtime context is implemented.
- Ownership transfer, owner recovery, and full household-only module RLS remain Release 0.9 follow-up work.
- The new process framework should be tested against the next release and refined if any required step is unclear or redundant.
- Governance templates should remain lightweight; expand them only when real releases expose gaps.
- Historical audit and implementation docs are intentionally retained but should not be treated as current process guidance.
- Release 1.0 should avoid broad module expansion and focus on dashboard, tasks, navigation, settings, household management, responsive UX, and validation.
- Product direction should start from the Product Handbook; engineering execution should start from `docs/process/ENGINEERING_INDEX.md`.
- Release 1.0 introduced Universal Search and an in-app notification center as scoped local/app-shell features; push/email/SMS delivery remains deferred.
- Release 1.0 local smoke used disposable seeded records in local Supabase. Production deployment still requires normal post-merge/deploy smoke validation.

## Last Updated
July 2, 2026
