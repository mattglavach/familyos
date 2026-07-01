# Project Status

## Current Version
0.6C

## Current State
Release 0.6C data foundation production execution is blocked by production baseline drift. The household foundation migration passed disposable local, fresh schema-only, staging-like local, and app smoke validation after three compatibility revisions, but the first production attempt failed safely during preflight because production module tables do not yet have the expected `user_id` ownership baseline.

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

## In Progress
- Release 0.6C production baseline alignment planning

## Next
- Create and validate the production auth ownership baseline alignment migration against a disposable production-drift clone
- Decide explicit ownership/backfill behavior for existing production module rows before production execution
- Re-run Release 0.6C validation after the production baseline is aligned
- Plan app active-household context and data-service changes before replacing user-owned RLS
- Keep household migration work separate from Release 0.6B UI milestones unless explicitly requested

## Known Bugs

- No active deploy-blocking build errors after the CI lint cleanup.
- Production magic-link redirects depend on Supabase Auth Site URL and allowed redirect URLs being set to the deployed FamilyOS origin.
- Google Calendar sync requires the active browser origin to be listed in Google Cloud Console Authorized JavaScript origins for the configured OAuth client.
- Dashboard family member edits are stored in browser localStorage for Release 0.6B because the current applied Supabase schema does not include a family member table.
- Task assignee, status, created date, and completed date are stored in browser localStorage for Release 0.6B because the current applied Supabase tasks table does not include those columns.
- Google Calendar token storage remains browser-local in Release 0.6B and should move server-side in a later calendar connection milestone.
- Six-item bottom navigation should be checked on physical mobile devices before broad family use.
- The legacy household foundation migration is marked local-only and must not be applied to production.
- The Release 0.6C production migration draft passed disposable local, fresh schema-only, staging-like, migrated-local app smoke validation, and production readiness signoff review, but production is missing the expected earlier `user_id` ownership baseline. The first production attempt failed during preflight and no Release 0.6C foundation tables were applied.

## Technical Debt
- Existing feature screens still contain substantial inline styles and should be migrated gradually to shadcn/ui and Origin UI components during feature work.
- Release 0.6B relies on temporary localStorage metadata for settings, family members, task metadata, and calendar tokens until the household/profile/task/calendar schema work is completed.
- Current Supabase module tables still use direct `user_id = auth.uid()` RLS; household-scoped RLS must be introduced only after backfill and active-household app context are validated.
- The household foundation draft intentionally keeps module-table `user_id` RLS in place while adding nullable `household_id` fields for staged migration.
- Production baseline alignment requires an explicit owner UUID decision for existing rows; this cannot be inferred safely by automation.

## Last Updated
July 1, 2026
