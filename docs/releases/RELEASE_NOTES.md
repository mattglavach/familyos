# Release Notes

## Release 0.9.3 Product Handbook

### Version
0.9.3

### Date
2026-07-02

### Summary
Release 0.9.3 establishes the permanent Family OS Product Handbook. It is documentation-only and defines what Family OS is, why it exists, how it should feel, how navigation should evolve, which modules belong in the product, and how Release 1.0 aligns to the product direction.

### New Documentation
- Product vision.
- Information architecture.
- Product navigation.
- Design principles.
- UX guidelines.
- Dashboard strategy.
- Module map.
- Expanded personas.
- Core workflows.
- Feature philosophy.
- Product roadmap.

### Release 1.0 Alignment
Release 1.0 remains focused on dashboard, tasks, calendar status, household management, settings, navigation, notifications/status feedback, responsive UI, and UX polish.

Shopping, Life Lists, AI, Smart Home, Meal Planning, Inventory, and Home integrations remain intentionally deferred until the core household operating loop is stable.

### Validation
- Local documentation link verification passed.
- `pnpm run lint` passed.
- `pnpm run build` passed.
- `git diff --check` passed.

### Recommendation
Ready for Release 1.0 implementation planning review.

## Release 1.0 Planning

### Version
1.0.0 planning

### Date
2026-07-02

### Summary
Release 1.0 planning defines the implementation blueprint for the first production-quality private household operating release. It is documentation-only and does not implement application code.

### Scope Defined
- Dashboard daily command center readiness.
- Household task workflow readiness.
- Navigation and responsive UI polish.
- Settings and household management readiness.
- Household collaboration, active household switching, and permission validation.
- Minimal notification/status-feedback consistency only where needed for core workflows.

### Explicitly Deferred
- Shopping, Life Lists, Meal Planning, Recipes, Inventory, Home Maintenance, Home Assistant, Smart Home, AI Assistant, ownership transfer, public sign-up, and major new integrations.

### Planning Artifact
- `docs/planning/RELEASE_1_0_SPEC.md`

### Recommendation
Ready for Release 1.0 implementation planning review.

## Release 0.9.2

### Version
0.9.2

### Date
2026-07-02

### Summary
Release 0.9.2 cleans up the repository documentation structure after the Release 0.9.1 engineering foundation. It is documentation-only and prepares the repository guidance for Release 1.0.

### Updates
- Archived the superseded `docs/development` baseline under `docs/archive/development-baseline`.
- Consolidated active engineering guidance under `docs/process`.
- Verified README entry points and updated AGENTS, master index, planning, release, and process cross-references.
- Updated planning state to show v0.9.0 and v0.9.1 released, v0.9.2 in progress, and Release 1.0 next.

### Validation
- Required validation: `pnpm run lint`, `pnpm run build`, and `git diff --check`.

### Known Issues
- Historical audit documents still describe the repository state as of June 27, 2026 and should remain archived as historical findings.

## Release 0.9.1

### Version
0.9.1

### Date
2026-07-02

### Summary
Release 0.9.1 establishes the permanent Family OS engineering framework. It is a documentation and process release only; it does not add application features.

### New Documentation
- Release playbook
- Feature playbook
- Family OS principles
- Project structure
- Module template
- Production readiness checklist
- AI engineering guidelines
- API guidelines
- Security standards
- Performance guidelines
- Environment guidance
- Dependency policy
- Coding standards
- Architecture guidelines
- UI guidelines
- Testing guidelines
- Documentation guidelines
- Git workflow
- Code review checklist
- Release checklist
- Process prompt library
- ADR template
- Technical debt register
- Decision log
- Roadmap process
- Release, feature, module, bug report, and retrospective templates

### Updates
- Updated `AGENTS.md`, `README.md`, master documentation index, AI instructions, architecture overview, roadmap, project status, current sprint, changelog, and release notes to point future work at `docs/process`.
- Added `eslint` as a direct dev dependency after validation found the existing lint script was not portable in a clean pnpm worktree.

### Validation
- Required validation: `pnpm run lint`, `pnpm run build`, and `git diff --check`.

### Known Issues
- The process framework should be refined after it is used on the next release workstream.

### Release Status
Released as v0.9.1.

## Release 0.9

### Version
0.9

### Date
2026-07-02

### Summary
Release 0.9 adds the household collaboration foundation: secure household invitations, authenticated accept/decline flows, active household switching, and Settings-based member management.

### New Features
- Hashed-token household invitations with create, preview, accept, decline, and revoke lifecycle flows.
- Invite token preservation through auth redirects via `?invite=...`.
- Active household switching backed by `user_preferences.default_household_id`.
- Settings household directory, pending invites, invite creation, revoke controls, and owner-only role/remove management.

### Validation
- Disposable local Supabase only; production was not touched.
- Full schema plus ordered migration chain applied cleanly from an empty local validation database with a minimal Supabase auth harness.
- Release 0.9 migration re-run passed with expected idempotency notices.
- Schema/RLS/RPC assertions passed for invitation table, token-hash-only storage, constraints, indexes, RLS, owner policies, and invitation RPC signatures.
- Browser smoke tests passed on `http://localhost:3002` with local disposable users for owner, adult, and viewer flows.
- `pnpm run lint`, `pnpm run build`, and `git diff --check` passed during release validation.

### Fixes
- Allowed the Release 0.6C auth ownership baseline migration to run on empty local/staging databases while preserving the approved-owner guard when existing module rows require backfill.
- Added `extensions` to Release 0.9 invitation RPC search paths so `pgcrypto.digest` resolves in local and Supabase-style schemas.
- Hid owner-only member role/remove and pending invite controls from non-owner Settings views.

### Known Issues
- Public sign-up remains deferred; invited users still need valid Supabase auth accounts for the invited email.
- Ownership transfer and owner recovery remain deferred.
- Broad household-scoped RLS conversion for existing module tables remains deferred.
- Deployed Google OAuth validation and legacy browser calendar fallback removal remain separate Release 0.8 follow-up work.

### Recommendation
Released as v0.9.0.

## Release 0.6B

### Version
0.6B

### Date
2026-07-01

### Summary
Release 0.6B delivers the first usable Family OS dashboard for family testing. It turns the Home tab into a command center, improves Google Calendar visibility, adds local family member management, replaces the legacy task screen with a task MVP, hardens mobile UX, and adds Settings/Profile.

### New Features
- Dashboard command center with action groups, module status cards, family overview, schedule, recent activity, notes, skeletons, and empty states.
- Google Calendar dashboard pass with signed-out/syncing/synced/empty/error states, today/upcoming grouping, source labels, and last-sync visibility.
- Family member management with editable local members, roles, colors, active/inactive state, assignment filters, and reference-aware removal/deactivation.
- Task management MVP with create, edit, complete, reopen, delete, reassign, filters, sorting, dashboard task groups, toast feedback, and delete confirmation.
- Settings/Profile screen with signed-in profile details, household defaults, task defaults, calendar connection controls, local metadata visibility, sign out, and confirmed local app data reset.

### Fixes
- Hardened malformed Google Calendar events, invalid sync timestamps, malformed task records, incomplete family records, and missing localStorage records.
- Improved keyboard focus visibility, task drawer labels, toast live-region semantics, mobile action wrapping, and responsive app header behavior.
- Preserved the existing browser popup Google OAuth flow and Supabase-compatible task persistence.

### Database Changes
- None.

### Known Issues
- Family members, settings, and task metadata fields not present in the applied Supabase schema are stored in browser localStorage for Release 0.6B.
- Google Calendar access tokens are still stored in browser localStorage; future work should move calendar connection storage server-side.
- `useTable` still masks Supabase read/write failures with seed/local fallback behavior.
- Bottom navigation now has six items and should be verified on physical mobile devices before broad family testing.

### Next Priorities
- Release 0.6B stability testing on real mobile and desktop browsers.
- Household/family member schema migration.
- Shared task schema migration for assignee, status, created/completed timestamps, and module ownership.
- Server-side calendar connection model and token storage.
- Release candidate tag and merge after family test sign-off.

## Release Template

### Version

### Date

### Summary

### New Features

### Fixes

### Database Changes

### Known Issues

### Next Priorities
