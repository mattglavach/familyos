# Release Notes

## Release 1.0.1

### Version
1.0.1

### Date
2026-07-02

### Summary
Release 1.0.1 is a Core MVP Polish release after v1.0.0. It keeps Home as the awareness layer, makes modules more action-oriented, and avoids adding deferred major modules.

### Updates
- Home now emphasizes Today's Priorities, Today's Schedule, My Tasks, Household Insights, and compact Recent Activity.
- Calendar browsing stays in Calendar, household management stays in Settings/Household, and Quick Add stays global instead of being repeated as a Home promo.
- Tasks now centers on one primary work surface with quick creation, search, filters, sorting, assignment, completion, editing, and deletion.
- Task add/edit recurrence uses simple presets: None, Daily, Weekly, Monthly, and Yearly. Weekdays remains deferred because it needs a richer recurrence model.
- Quick Add keeps supported types enabled and marks future capture types as later instead of creating unsupported records.
- More is grouped by Household, Home, Health, Finance, Planning, and Settings.
- Notification Center now supports Unread, Today, This Week, and Archive views.

### Database Changes
- None.

### Deferred
- Life Lists, Shopping, Meal Planning, Finance expansion, Health, Smart Home, AI, Projects, full Maintenance, full Pool expansion, ownership transfer, public sign-up, push/email/SMS notifications, and major new database models remain deferred.

### Validation
- `pnpm run lint` passed.
- `pnpm run build` passed.
- `git diff --check` passed.
- Authenticated local browser smoke used local Supabase only (`REACT_APP_SUPABASE_URL=http://127.0.0.1:54321`) and local CRA on `http://localhost:3000`.

### Browser Smoke Notes
- Home dashboard: passed for awareness-focused layout, compact schedule state, My Tasks, Household Insights, and Recent Activity.
- Tasks: passed create, edit, assignment, recurrence preset display, search, filter, sorting, recurring complete/reschedule behavior, and delete.
- Recurrence: passed for Weekly, Monthly, and Quick Add Daily persistence through the existing interval-days model; Weekdays remained disabled.
- Quick Add: found and fixed a cross-surface refresh issue; retest confirmed Quick Add task creation refreshed the mounted Tasks data and was visible under Household.
- More: passed platform grouping for Household, Home, Health, Finance, Planning, and Settings with deferred modules disabled.
- Notifications: passed Unread, Today, This Week, and Archive tab switching without using destructive or state-reset actions.
- Calendar: passed first-class page navigation and disconnected local state with Settings paths.
- Quick Add deferred behavior: passed; Event, Shopping Item, and Health Entry were visible as disabled later items while supported types remained enabled.
- Dashboard drill-downs: passed for My Tasks, Tasks insight, and Today's Schedule Calendar paths.
- Mobile 390px sanity: passed for Home, More, Notifications, bottom navigation visibility, and no horizontal overflow.
- Browser console: passed with no warning or error logs after the remaining smoke checks.

## Release 1.0

### Version
1.0.0

### Date
2026-07-02

### Summary
Release 1.0 implements the Core Family OS MVP as the first true product release after the engineering and product foundations. It focuses on the daily household operating loop: Home, Tasks, Calendar, Quick Add, Search, Notifications, More navigation, and household/settings polish.

### New Features
- Product-ordered Home dashboard: Today's Priorities, Today's Schedule, My Tasks, Family Activity, Quick Add, and Household Insights.
- First-class Calendar module using existing secure/legacy Google Calendar data paths.
- Primary navigation updated to Home, Tasks, Calendar, Quick Add, and More.
- More module groups household/settings and existing lower-frequency modules while clearly marking future modules.
- Universal Quick Add can be launched from navigation or the floating action button and creates household-aware tasks through the existing ownership helper.
- Universal Search searches implemented surfaces: tasks, calendar events, household members, and navigation targets.
- In-app notification center surfaces task, calendar, and household state with local read/unread tracking.
- Tasks now include an in-module search filter in addition to existing create, edit, complete, delete, assign, status, priority, due date, filters, sorting, and recurrence visibility.

### Database Changes
- None.

### Security And RLS Notes
- Authenticated smoke testing used local Supabase only: `REACT_APP_SUPABASE_URL=http://127.0.0.1:54321`, Docker container `supabase_db_familyos`, and local CRA server `http://localhost:3000`.
- No production Supabase data was touched.
- No schema or RLS migration was added.
- Existing Supabase RLS remains the enforcement layer for task, household, invitation, and calendar records.
- Owner-only household controls remain in Settings and continue to rely on existing role/RLS/RPC behavior.
- In-app notification read state is local-only UI state; it does not store secrets, tokens, sessions, or private provider payloads.

### Fixes From Authenticated Smoke
- Fixed shared date formatting so Supabase timestamp values do not render as `Invalid Date` in task cards.
- Fixed notification due-date math for date-only task values so local dates are not shifted by timezone parsing.
- Refreshed task data when Universal Search opens so newly created Quick Add tasks are indexed.
- Updated Settings to show Release 1.0 and display named active-household switcher options instead of raw household UUIDs.

### Validation
- `pnpm run lint` passed.
- `pnpm run build` passed.
- `git diff --check` passed.
- Browser smoke on `http://localhost:3000` confirmed authenticated owner, adult, and viewer workflows against local Supabase.
- Mobile viewport smoke at 390px confirmed no horizontal overflow on the authenticated Home surface.
- Browser console error/warning check returned no logs after authenticated smoke.

### Browser Smoke Notes
- Login: passed for local owner and adult/viewer member accounts.
- Home dashboard: passed with household data, task summaries, schedule state, Quick Add entry, and More navigation.
- Tasks: passed create, edit, complete, delete, search/filtering, and assignment to household member.
- Calendar: passed first-class page and disconnected local state with Settings paths.
- Quick Add: passed global task creation and household-aware task persistence.
- Universal Search: passed task search, including newly created Quick Add tasks after the refresh-on-open fix.
- Notification Center: passed unread generation, corrected due labels, and mark-read state.
- More page: passed available/deferred module grouping without adding deferred modules.
- Household switching: passed owner switch to alternate local household and back.
- Settings household/member/invite views: passed owner directory, pending invite create/revoke, role update, member removal, active household, and non-owner views.
- Owner controls: passed invite creation/revoke, role update, and removal of a disposable non-login member.
- Adult controls: passed; owner-only invite, role, and remove controls were hidden/disabled.
- Viewer controls: passed; owner-only invite, role, and remove controls were hidden/disabled.
- Mobile responsive sanity: passed at 390px authenticated viewport with no horizontal overflow.

### Deferred
- Shopping, Life Lists, Meal Planning, Recipes, Inventory, Finance expansion, Pool expansion, College expansion, Home Assistant, Smart Home, AI Assistant, public sign-up, ownership transfer, push notifications, and broad module RLS conversion remain deferred.

### Recommendation
Ready to merge after final repository validation remains green.

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
