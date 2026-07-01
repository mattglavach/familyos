# Project Status

## Current Version
0.6C

## Current State
Release 0.6C data foundation work is in progress. The household foundation migration has passed disposable local, fresh schema-only, staging-like local, and app smoke validation after three compatibility revisions, but no Release 0.6C database migration has been applied to production.

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

## In Progress
- Release 0.6C household foundation production readiness review

## Next
- Review and approve production backup, rollback, and go/no-go checklist
- Decide whether to apply the combined foundation/task/settings migration as one production migration or split it
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
- The Release 0.6C production migration draft passed disposable local, fresh schema-only, staging-like, and migrated-local app smoke validation, but must still pass backup/rollback review and owner go/no-go approval before production use.

## Technical Debt
- Existing feature screens still contain substantial inline styles and should be migrated gradually to shadcn/ui and Origin UI components during feature work.
- Release 0.6B relies on temporary localStorage metadata for settings, family members, task metadata, and calendar tokens until the household/profile/task/calendar schema work is completed.
- Current Supabase module tables still use direct `user_id = auth.uid()` RLS; household-scoped RLS must be introduced only after backfill and active-household app context are validated.
- The household foundation draft intentionally keeps module-table `user_id` RLS in place while adding nullable `household_id` fields for staged migration.

## Last Updated
July 1, 2026
