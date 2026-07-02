# Release Notes

## Release 1.0.4

### Version
1.0.4

### Date
2026-07-02

### Summary
Release 1.0.4 is a consumer cleanup release after v1.0.3. It focuses on clarity, trust, task discoverability, compact filters, friendly empty states, and safer destructive confirmations before Release 1.1 planning.

### Fixes
- Home keeps awareness-focused summaries and adds clearer View All behavior for priority drill-downs.
- Tasks now defaults to Household instead of My Tasks so tasks created from Home or Quick Add are immediately discoverable.
- Tasks filter controls now show Search, My Tasks, Household, Today, and Overdue first, with secondary filters hidden behind More Filters.
- Task creation and update feedback now explains where a new task can be found.
- Quick Add now enables only currently supported destinations: Task and Pool Reading. Future destinations remain disabled and marked Coming later.
- Calendar and invitation setup errors now use household-friendly language and avoid implementation details.
- Calendar settings keep the real connection path when available, disable setup-blocked connection attempts, and rename status checks to Check Connection.
- Search and Notifications empty states now use friendlier, action-oriented language.
- Touched destructive flows now use specific app dialogs such as Delete task, Revoke invite, Disconnect calendar, Forget connection, and Reset device preferences.
- Header spacing and mobile behavior were tightened for the title, date, and high-priority actions.

### Root Cause
Tasks created from Quick Add could appear missing because Quick Add created household tasks, then navigated to Tasks where the default view was My Tasks. If the task was assigned to Family or no person, the default filter hid it. Release 1.0.4 changes the default Tasks view to Household and adds copy that explains new tasks are visible there.

### Calendar Decision
Google Calendar connection remains functional when the app has the required local/staging server route and Google settings. When setup is incomplete, Family OS now disables or routes connection controls into friendly setup guidance instead of exposing technical details.

### Database Changes
- None.

### Deferred
- Life Lists, Shopping, Meal Planning, Finance expansion, Health, Home platform, AI, Projects, and new integrations remain out of scope.
- Full deployed Google Calendar validation and legacy device-calendar fallback removal remain deferred.
- Deferred module UI cleanup remains tracked as technical debt.

### Validation
- `pnpm run lint` passed.
- `pnpm run build` passed.
- `git diff --check` passed.
- Authenticated browser smoke used local Supabase only and local CRA on `http://localhost:3000`; production was not touched.
- Browser smoke passed for Home drill-downs, Calendar setup guidance, Tasks create/edit/complete/delete, compact filters, task search, Quick Add supported/deferred destinations, Universal Search, Notifications, More, Settings, mobile 390px layout, and touched destructive confirmation dialogs.
- No browser console warnings or errors were observed during the final smoke path.
- Disposable local smoke tasks were deleted after validation.

## Release 1.0.3

### Version
1.0.3

### Date
2026-07-02

### Summary
Release 1.0.3 establishes the permanent Family OS design-system foundation. It adds a shadcn-compatible local wrapper layer, standardizes core design tokens, improves common task form controls, and keeps workflows unchanged.

### Updates
- Added `components.json` for the local shadcn/ui-compatible configuration.
- Added UI wrappers under `src/components/ui` for alerts, avatars, checkboxes, command search, dialogs, drawers, dropdown menus, popovers, separators, sheets, switches, tables, tabs, toasts, tooltips, and related primitives.
- Standardized semantic color, radius, elevation, and motion tokens in CSS and Tailwind.
- Updated Tasks add/edit controls so priority, status, category, and recurrence use chips instead of dropdowns.
- Updated Quick Add task recurrence to use chips while keeping unsupported future recurrence behavior disabled and honest.
- Updated Universal Search to use the local Command wrapper without expanding its data scope.

### Database Changes
- None.

### Deferred
- Life Lists, Shopping, Finance expansion, Health, Home platform, AI, Projects, Pool, Maintenance, and other major modules remain out of scope.
- Deferred-module inline UI migration remains tracked as technical debt.
- Native browser confirmations remain in some existing destructive flows until those flows are touched for product work.
- Advanced Radix-backed shadcn internals can be added later behind the same wrapper API if complex overlay behavior requires them.

### Validation
- `pnpm run lint` passed.
- `pnpm run build` passed.
- `git diff --check` passed.
- Browser smoke used the local app on `http://localhost:3000` with the existing authenticated local Supabase session. Production was not touched.
- Desktop smoke passed for Home load, Tasks page, task drawer chip controls, Quick Add supported/deferred type behavior, Quick Add recurrence chips, Universal Search Command results, Notification Center tabs, Calendar setup state, More grouping, Settings, and Household/member visibility.
- The authenticated local smoke session was an Adult account; owner-only household invite controls remained hidden as expected.
- Tablet smoke at 768px passed for Settings, Home, Tasks, Calendar, and More with no horizontal overflow.
- Mobile smoke at 390px passed for Home, Tasks, Calendar, More, Quick Add, Universal Search, and Notifications with no horizontal overflow.
- Browser console checks during completed smoke paths showed no warnings or errors.

## Release 1.0.2

### Version
1.0.2

### Date
2026-07-02

### Summary
Release 1.0.2 is a reliability and production-readiness release after v1.0.1. It improves configuration handling, replaces raw technical failures with actionable user guidance, and documents local/staging/production setup expectations.

### Fixes
- Calendar configuration failures now show a setup-oriented disconnected state instead of exposing missing OAuth, Supabase service-role, or schema details.
- Google Calendar is treated as an optional integration; missing Calendar config no longer blocks the rest of the app setup gate.
- Household invitation table/RPC/schema-cache failures now show an environment setup message while preserving hashed-token invitation security and owner-only controls.
- Quick Add, Settings household updates, Notifications, and household context failures avoid raw SQL, Supabase, or service configuration messages in user-facing UI.
- Expected household context load failures no longer write raw errors to the browser console.

### Configuration Notes
- Required browser config remains `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`.
- Server-side Calendar sync requires the Release 0.8 `calendar_connections` schema plus server-only OAuth, encryption, redirect, and Supabase service-role settings.
- Household invitations require `supabase/migrations/20260702_release_0_9_household_collaboration.sql` in each local/staging/production-like environment.

### Database Changes
- None.

### Deferred
- Legacy browser Calendar fallback removal remains deferred until deployed OAuth validation is complete.
- Public sign-up, ownership transfer, broad module RLS conversion, and deferred product modules remain out of scope.

### Validation
- `pnpm run lint` passed.
- `pnpm run build` passed.
- `git diff --check` passed.
- Authenticated owner smoke used the local app on `http://localhost:3000` and local Supabase only.
- Owner smoke passed for Home load, Calendar disconnected/setup state, Settings Calendar setup copy, owner household/member controls visibility, invite create, invite revoke, More page grouping, Notification Center Unread/Today/This Week/Archive tabs, Universal Search, Quick Add supported/deferred type state, Tasks household filter/search, and disposable task create.
- Adult smoke passed with the existing approved local adult account. Settings showed role `Adult`, hid owner-only invite/member controls, and showed the owner-only help text.
- Viewer smoke passed by temporarily changing the approved local smoke account's local membership role to `viewer`, reloading the authenticated app, verifying viewer permissions, and restoring the account to `adult`. Settings showed role `Viewer`, hid owner-only invite/member controls, and showed the owner-only help text.
- Full task lifecycle smoke passed for create, edit, complete, and delete of a disposable local task. The native delete confirmation bridge timed out after dispatch, but the app delete completed; direct local Postgres verification confirmed no remaining Release 1.0.2 lifecycle smoke task rows.
- Mobile 390px sanity passed for authenticated Home, Tasks, and Settings with bottom navigation visible and no horizontal overflow.
- Browser console checks during completed smoke steps showed no warnings or errors.
- Cleanup note: temporary local-only password and role changes were applied only to local Supabase smoke accounts. The adult smoke account role was restored after viewer validation, and disposable Release 1.0.2 task rows were removed.

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
