# Roadmap

## Phase 0 - Foundation
- [x] Documentation system
- [x] AGENTS.md
- [x] GitHub templates
- [x] Confirm current architecture
- [x] Confirm deployment flow
- [x] Permanent engineering process framework

## Phase 1 - Core App
- [x] Authentication
- [x] App shell
- [x] Navigation
- [x] Dashboard
- [x] Family members
- [x] Settings

## Phase 2 - High-Value Modules
- [ ] Pool
- [ ] Finance
- [x] Tasks
- [ ] Garden
- [ ] Home

## Phase 3 - Planning Modules
- [ ] Retirement
- [ ] College
- [ ] Vehicles
- [ ] Documents
- [ ] Medical

## Phase 4 - Intelligence
- [ ] AI assistant
- [ ] Summaries
- [ ] Alerts
- [ ] Predictive insights
- [ ] Voice interface

## Next Schema Migration Track
- [x] Audit current data gaps and existing household foundation migration work.
- [x] Convert local-only household foundation migration into a production-ready migration draft.
- [x] Prepare dry-run checklist and RLS smoke-test plan for the production household foundation migration draft.
- [x] Document execution-pending dry-run commands and results template for environments with SQL tooling.
- [x] Execute disposable local dry-run production household foundation migration and smoke-test RLS.
- [x] Repeat migration validation on fresh schema-only and sanitized staging-like databases.
- [x] Run app smoke tests against the migrated local/staging schema.
- [x] Complete production backup/rollback review and recommend applying the combined migration as-is.
- [x] Capture production backup artifacts and verify production target for the first Release 0.6C attempt.
- [x] Document production auth ownership baseline alignment plan.
- [x] Build and validate production auth ownership baseline migration after owner UUID approval.
- [x] Reconcile production auth ownership baseline before re-attempting Release 0.6C.
- [x] Re-attempt Release 0.6C after production baseline alignment passes validation.
- [x] Household and people/family member persistence.
- [x] Shared task schema fields for assignee, status, created/completed timestamps, module ownership, and recurrence clarity.
- [x] Settings/profile persistence beyond browser localStorage.
- [x] Server-side Google Calendar connection model and token storage foundation.
- [x] Complete Google OAuth callback exchange, token encryption, refresh, and server-side event sync API.
- [x] Replace dashboard calendar reads with server events when a server connection exists.
- [x] Add household invitations, member directory, and active household switching foundations.
- [x] Validate Release 0.9 household invitation migration and smoke-test multi-member flows.
- [ ] Validate deployed Google OAuth flow and remove legacy browser fallback when safe.
- [ ] Design ownership transfer and owner recovery.

## Engineering Process Track
- [x] Establish permanent release, feature, coding, architecture, UI, testing, documentation, git, review, checklist, and prompt playbooks.
- [ ] Use the Release 0.9.1 process framework for the next feature or release prompt.
- [ ] Revisit process docs after two releases and refine based on actual execution gaps.
