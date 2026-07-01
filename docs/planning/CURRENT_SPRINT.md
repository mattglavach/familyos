# Current Sprint

## Sprint Goal
Prepare Release 0.7 runtime integration on top of the completed Release 0.6C Supabase data foundation.

## Active Items
- [x] Add documentation structure
- [x] Add AGENTS.md
- [x] Add GitHub templates
- [x] Add Platform architecture documentation
- [x] Add frontend standard foundation
- [x] Fix Vercel production build failure from CRA CI lint warnings
- [x] Audit Supabase email magic-link redirect behavior for Vercel deployment
- [x] Document Google Calendar OAuth origin configuration for local and Vercel deployments
- [x] Add Supabase magic-link resend cooldown protection
- [x] Make private household email/password login the primary Supabase auth path
- [x] Validate current app structure
- [x] Identify next implementation target
- [x] Begin Release 0.6B branch
- [x] Complete Milestone 1 dashboard layout pass
- [x] Milestone 2 Google Calendar integration pass
- [x] Milestone 3 family member management pass
- [x] Milestone 4 task management MVP pass
- [x] Milestone 5 mobile responsiveness, loading states, and error-state hardening pass
- [x] Milestone 6 settings and profile pass
- [x] Milestone 7 stability and release candidate pass
- [x] Begin Release 0.6C branch
- [x] Release 0.6C Milestone 1 data model audit and migration plan
- [x] Release 0.6C Milestone 2 production household foundation migration draft
- [x] Release 0.6C Milestone 3 migration dry-run preparation and validation plan
- [x] Release 0.6C Milestone 4 migration dry-run execution-pending update
- [x] Release 0.6C Milestone 5 local household foundation migration dry run and revision
- [x] Release 0.6C Milestone 6 fresh schema and staging-like migration validation
- [x] Release 0.6C Milestone 7 app smoke tests and production readiness checklist
- [x] Release 0.6C Milestone 8 production readiness signoff review
- [x] Release 0.6C production attempt 1 blocked by baseline schema drift
- [x] Release 0.6C production baseline alignment plan
- [x] Release 0.6C production auth ownership baseline migration
- [x] Release 0.6C production household foundation migration
- [x] Release 0.6C production validation and app-path smoke tests
- [x] Release 0.6C closeout documentation
- [ ] Release 0.7 kickoff plan

## Blockers

- Release 0.6B has no active code blockers after local lint/build validation. Real-device family testing and Vercel deployment validation remain before broad use.
- Release 0.6C has no active production migration blocker after baseline alignment and household foundation validation.

## Notes
- Frontend foundation now includes Tailwind CSS, shadcn/ui aliases/primitives, Lucide icons, Recharts, and an Origin UI-style drawer component for new feature work.
- Production build now passes with `CI=true`; remaining deploy validation should happen through Vercel.
- Email magic-link redirects are generated from the current browser origin; Supabase Auth Site URL and allowed redirect URLs must include the deployed Vercel origin.
- Email magic-link sign-in now disables resend for 60 seconds after successful sends to reduce Supabase rate-limit errors.
- Email/password login is now the primary private-household auth path; users should be manually created in Supabase with public sign-up disabled.
- Google Calendar OAuth uses the current browser origin; Google Cloud Console Authorized JavaScript origins must include localhost, the Vercel production origin, and any custom domain used to open the app.
- Phase 1 UI migration has started with shared form primitives, segmented/chip controls, status badges, section headers, and empty-state helpers only; feature screens are intentionally unchanged.
- QuickAdd is the first migrated feature surface using the shared UI primitives; Finance, Pool, College, auth/setup, and database logic were left unchanged.
- AuthGate and SetupRequired now use shared UI primitives while preserving password sign-in, magic-link fallback, setup gating, and Supabase auth behavior.
- App shell/navigation now uses shared UI primitives/classes while preserving tab routing, active tab behavior, sign-out, and Google Calendar connect/sync actions.
- PoolBrief and RetirementBrief now use shared AI brief panel helpers while preserving AI prompts, history, refresh/regenerate, copy, and follow-up behavior.
- App structure refactor moved the shell, hooks, and user-facing modules out of the monolithic src/App.js; pnpm run check passes after the split.
- Release 0.6B Milestone 1 migrates the dashboard command center to shared cards, status badges, buttons, skeleton loading states, empty states, and Lucide icons while preserving the current user-scoped Supabase table hooks and Google Calendar behavior.
- Release 0.6B Milestone 2 keeps the existing browser popup OAuth flow and improves dashboard calendar sync states, expired-token and permission handling, empty calendar handling, event grouping, source labels, and last-sync visibility.
- Release 0.6B Milestone 3 adds dashboard family member management with local editable members, active/inactive states, member colors, role labels, assignment filters, and reference-aware removal/deactivation. This milestone does not add Supabase family-member persistence because the current applied schema does not include a family member table.
- Release 0.6B Milestone 4 replaces the legacy inline-style task screen with a shared-card task MVP covering dashboard task groups, create/edit/complete/reopen/delete/reassign actions, filters, sorting, validation, toast feedback, and local task metadata for fields not yet present in the applied Supabase schema.
- Release 0.6B Milestone 5 hardens the dashboard, calendar, family, tasks, and app shell UX with safer localStorage parsing, malformed event/task fallbacks, responsive action rows, focus visibility, labelled task drawer fields, toast live-region semantics, and mobile QA coverage notes.
- Release 0.6B Milestone 6 adds a Settings/Profile screen with signed-in user details, local household defaults, task defaults, Google Calendar status and reconnect/clear-token actions, local metadata visibility, sign-out, and confirmed local app data reset without database schema changes.
- Release 0.6B Milestone 7 closes the release candidate with lint/build validation, release notes, known limitations, no schema changes, and a manual QA checklist for dashboard, calendar, family, tasks, settings, navigation, and mobile layouts.
- Release 0.6C Milestone 1 audits the current user-owned Supabase schema, the local-only household foundation migration, and Release 0.6B localStorage usage for family members, settings, task metadata, and Google Calendar token/sync metadata.
- Release 0.6C should reuse and review `supabase/migrations/20260627_household_foundation.sql` rather than creating a competing household model.
- Release 0.6C Milestone 2 adds `supabase/migrations/20260701_release_0_6c_household_foundation.sql` as a production migration draft for profiles, households, people, household members, household/user settings, nullable household compatibility columns, and structured task metadata. It does not change runtime app behavior or apply the migration.
- Release 0.6C standardizes household roles as `owner`, `adult`, `teen`, `child`, and `viewer`; only owner/adult roles manage household operating data in the initial RLS draft, and membership changes are owner-only.
- Release 0.6C Milestone 3 adds `docs/database/RELEASE_0_6C_MIGRATION_VALIDATION.md` with the dry-run checklist, disposable Supabase setup guidance, verification SQL, RLS smoke tests, rollback considerations, and production readiness gates. It does not apply the migration.
- Release 0.6C Milestone 4 rechecks local SQL tooling and confirms `psql` and the Supabase CLI are unavailable in this workspace. The migration was not executed; the validation guide now includes exact pending commands, a dry-run results template, and manual checks still required.
- Release 0.6C Milestone 5 executes the migration against the disposable local Supabase database, finds and fixes one compatibility issue with existing 20260627 local foundation tables, passes the revised migration run, passes the idempotency re-run, passes validation SQL, and passes RLS smoke tests for owner, adult, teen, child, viewer, non-member denial, and existing user-owned task compatibility.
- Release 0.6C Milestone 6 validates the revised migration on fresh schema-only and staging-like local databases, adds authenticated module-table grants required for clean installs, passes idempotency, validation SQL, RLS smoke tests, and task compatibility checks, and leaves production/runtime behavior unchanged.
- Release 0.6C Milestone 7 runs app smoke tests against the migrated local Supabase API, adds the auth-user bootstrap trigger after smoke tests exposed missing post-migration bootstrap rows, passes auth/profile/household/settings/task/module compatibility checks, and leaves production and browser localStorage behavior unchanged.
- Release 0.6C Milestone 8 confirms the production backup method, restore/rollback path, migration file, validation SQL scope, post-migration smoke checks, and owner go/no-go gate. Recommendation: apply the combined Release 0.6C migration as-is after backup capture and explicit owner approval.
- Release 0.6C production attempt 1 verified the linked production target and captured local backup artifacts, but the migration failed safely during preflight because production is still on the older public/open module-table policy baseline without `user_id` ownership columns. No Release 0.6C foundation tables were left behind.
- Release 0.6C production baseline alignment planning documents the required owner/backfill decision, recommended temporary owner approach, validation scope, and stop conditions before another production attempt.
- Release 0.6C production execution added the auth ownership baseline, backfilled 67 existing module rows to the approved owner, applied the household foundation migration, passed production validation SQL, passed authenticated-role app-path smoke tests, and left browser localStorage behavior unchanged.
- Release 0.7 should start runtime integration: active household context, Supabase-backed family members/settings/task metadata, and eventual server-side calendar connection storage.
