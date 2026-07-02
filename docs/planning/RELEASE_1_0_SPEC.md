# Release 1.0 Specification

## Release
Version: 1.0.0

Branch: `release/1.0`

Planning branch: `release/1.0-planning`

Target date: TBD after implementation sizing and staging validation

Status: Planning complete, implementation not started

## Mission
Release 1.0 makes Family OS a production-quality private household operating app. It should stabilize and polish the core daily workflows that already exist: dashboard, tasks, navigation, settings, household management, secure calendar status, and responsive UX.

Release 1.0 is not a broad product expansion. It is the first major readiness release for everyday household use on mobile and desktop.

## Vision
Family OS should open to a clear daily command center, show what matters today, let household members manage shared tasks, make household membership understandable, and preserve private household data through validated auth, RLS, and production-safe operations.

## Target Users
- Household owner: manages household settings, invitations, membership, integrations, and operating defaults.
- Adult household member: participates in household tasks and daily workflows without owner-only controls.
- Viewer or read-oriented member: can inspect household context where allowed, with management actions hidden and denied server-side.
- Single-user household: continues to work without requiring multi-user setup.

## Primary Household Workflows
- Sign in to the private household app.
- Review the daily dashboard for schedule, tasks, household status, and next actions.
- Create, edit, assign, complete, reopen, and filter household tasks.
- Switch active household when the user has more than one active membership.
- Invite a household member, preview/accept/decline invitations, revoke pending invitations, and manage member roles/removal as owner.
- Review Settings for profile, household defaults, calendar connection status, local fallback state, and safe reset/disconnect actions.
- Use the app on mobile-first layouts without broken wrapping, inaccessible controls, or confusing empty/error states.

## Release Theme
Core household operating readiness.

## Scope
In scope:
- Dashboard readiness and daily workflow polish.
- Task workflow readiness and household-aware behavior polish.
- Navigation and app shell polish for active modules.
- Settings and household management readiness.
- Notification framework planning and minimal internal foundation only if needed for user-visible status feedback.
- Responsive UI, accessibility, loading, empty, error, and success-state polish.
- Security review and validation for touched auth, household, task, settings, and calendar surfaces.
- Documentation updates required by implementation.

Out of scope:
- Shopping.
- Life Lists.
- Meal Planning.
- Recipes.
- Inventory.
- Home Maintenance.
- Home Assistant.
- Smart Home.
- AI Assistant.
- Ownership transfer.
- Public sign-up.
- Major new integrations.
- Broad finance, pool, college, retirement, documents, medical, vehicles, garden, or travel expansion.
- Full household-scoped RLS conversion for every module table unless a specific Release 1.0 task requires a narrow validated change.

## Current State
Already complete:
- Modular React app structure with `src/app`, `src/modules`, hooks, context, shared UI primitives, and compatibility entry point.
- Private Supabase email/password authentication with magic-link fallback.
- Household foundation schema, active household context, Supabase-backed people/family members, settings/profile defaults, and structured task metadata.
- Server-side Google Calendar connection foundation, encrypted token storage, refresh/revoke/event fetch API, and dashboard preference for server-side events where configured.
- Household invitations with hash-only token storage, invitation lifecycle RPCs, active household switching, owner-only Settings controls, and local validation.
- Engineering process docs, governance docs, reusable templates, and repository cleanup after Release 0.9.2.

Known constraints:
- Existing module tables preserve user-owned compatibility RLS while household-scoped migration is staged.
- Public sign-up is disabled and remains deferred.
- Ownership transfer and owner recovery are deferred.
- Legacy browser calendar fallback remains until deployed OAuth validation supports removal.
- Automated test coverage is thin; validation still relies on lint/build, SQL checks, and browser smoke testing.
- Historical docs preserve older states and should not override current process docs.

## Architecture
Modules affected:
- `src/app`: app shell, navigation, provider composition, and route-level state.
- `src/modules/dashboard`: daily command center and schedule/task/family summaries.
- `src/modules/tasks`: shared household task workflow.
- `src/modules/settings`: profile, household defaults, calendar status, invite/member management, active household switching.
- `src/context/HouseholdContext.js`: active household runtime boundary.
- `src/hooks`: household collaboration, auth, table access, calendar connection hooks.
- `src/components/ui` and `src/components/origin`: shared UI primitives used by touched surfaces.

Data/RLS/API impact:
- Prefer no new schema unless Release 1.0 implementation discovers a blocking readiness issue.
- If task, household, or notification work needs schema changes, use ordered Supabase migrations and validate against disposable/local/staging databases.
- Preserve existing user-owned module RLS compatibility unless a scoped migration is explicitly included and validated.
- Owner-only household actions must remain enforced by RLS/RPC, not by UI hiding only.

Security impact:
- Validate private auth, session persistence, invite token handling, active household switching, owner-only controls, non-owner denial paths, and no plaintext token persistence.
- Do not touch production Supabase without explicit approval, target verification, backup/rollback notes, and post-change validation.

## Module Plan

### Dashboard
Current maturity: Functional command center with schedule, family overview, action groups, task references, Google Calendar status, loading and empty states.

Required Release 1.0 work:
- Verify the dashboard clearly answers "what needs attention today?"
- Tighten priority ordering for overdue/due-soon tasks, schedule items, and household action groups.
- Ensure calendar disconnected, pending, connected, empty, error, and legacy fallback states are understandable.
- Confirm dashboard actions navigate to the correct active module without unexpected state loss.
- Verify family/member references stay correct after household switching.

Dependencies:
- Active household context.
- Task data and family member data.
- Calendar connection status.

Future expansion:
- AI summaries, predictive alerts, richer module cards, and additional modules remain post-1.0.

### Tasks
Current maturity: Functional MVP with create/edit/complete/reopen/delete/reassign, filters, sorting, drawer workflow, assignee/status metadata, recurring due logic, and household context usage.

Required Release 1.0 work:
- Validate task CRUD against active household behavior and single-user compatibility.
- Polish task filtering, empty states, loading states, duplicate-submit handling, and destructive confirmations.
- Confirm task metadata persistence is durable through Supabase where schema supports it and gracefully compatible where legacy local metadata remains.
- Verify adult/viewer behavior follows documented permissions if role restrictions are introduced or exposed.
- Document any remaining task RLS compatibility limits clearly.

Dependencies:
- Household people/family members.
- `tasks` schema and staged user-owned RLS compatibility.
- Shared drawer/form primitives.

Future expansion:
- Task templates, reminders, recurring rule editor, notification delivery, and cross-module task automation are deferred.

### Navigation
Current maturity: Bottom tab navigation currently exposes Home, Finance, Pool, Tasks, College, and Settings. Roadmap and UI docs list broader future navigation.

Required Release 1.0 work:
- Decide whether inactive or low-maturity modules should remain top-level or be visually de-emphasized without removing existing functionality.
- Ensure active module labels, titles, icons, and responsive wrapping work at 360px mobile width.
- Keep navigation predictable after save, sign-in, household switch, and invite acceptance.
- Avoid adding new top-level modules.

Dependencies:
- App shell tab composition.
- UI design system and navigation docs.

Future expansion:
- Grouped navigation, sidebar/tablet layout, and additional modules are post-1.0.

### Settings
Current maturity: Functional profile/app settings, household defaults, active household switcher, calendar connection controls, local data reset, household directory, pending invites, invite creation, revoke, owner-only role, and remove controls.

Required Release 1.0 work:
- Polish information hierarchy so Profile, Household, Members, Invitations, Calendar, and Local Device Data are easy to scan.
- Verify owner-only controls are hidden for unauthorized users and denied by backend checks.
- Confirm success/error feedback for save, invite, copy, revoke, role update, member removal, disconnect, and reset actions.
- Ensure active household switching refreshes dependent dashboard/task/settings data.
- Keep local reset copy clear that Supabase household data is not deleted.

Dependencies:
- Household context.
- Invitation RPCs and RLS.
- Calendar connection hook.

Future expansion:
- Ownership transfer, owner recovery, advanced permissions, public sign-up, and audit history are deferred.

### Household Management
Current maturity: Release 0.9 foundation is validated locally for owner invite/member flows, active household switching, and hidden non-owner controls.

Required Release 1.0 work:
- Revalidate invitation lifecycle against a disposable/local or staging Supabase environment.
- Verify active household selection behaves correctly for users with one household, multiple households, removed memberships, and declined invitations.
- Confirm invited authenticated users receive active membership on acceptance and no membership on decline.
- Preserve hashed-token-only invite storage.
- Document production validation requirements before any production migration or data action.

Dependencies:
- Release 0.9 migration.
- Supabase Auth users in disposable/local/staging environment.
- `user_preferences.default_household_id`.

Future expansion:
- Ownership transfer, owner recovery, granular permissions, child-safe workflows, and public sign-up are deferred.

### Notifications Framework
Current maturity: No durable notification delivery framework is active. UI has local toasts/status feedback and roadmap mentions alerts.

Required Release 1.0 work:
- Define a minimal notification/status-feedback contract for in-app success/error/loading messages if existing local toasts are inconsistent.
- Do not add push, email, SMS, AI alerting, or background delivery in Release 1.0.
- Document future notification engine expectations using existing platform notes if implementation work touches this area.

Dependencies:
- UI primitives.
- Task/dashboard status surfaces.

Future expansion:
- Reminder scheduling, push notifications, email digests, AI summaries, and predictive alerts are post-1.0.

### Responsive UI
Current maturity: Mobile-first design system exists, with shared primitives and some migrated surfaces. Physical-device verification remains a known need.

Required Release 1.0 work:
- Validate dashboard, tasks, settings, auth, invite acceptance, and navigation at mobile and desktop widths.
- Fix obvious wrapping, overflow, tap-target, focus, drawer, and bottom-nav issues discovered in smoke testing.
- Keep visual changes targeted; do not redesign the app.

Dependencies:
- `docs/ui/DESIGN_SYSTEM.md`.
- Shared UI primitives.

Future expansion:
- Full design-system migration and module redesigns are deferred.

### UX Polish
Current maturity: Major workflows have loading, empty, error, and success states, but consistency should be audited.

Required Release 1.0 work:
- Audit loading, empty, error, success, disabled, confirmation, and permission-aware states across core workflows.
- Ensure messages are user-safe and do not expose raw tokens, sessions, provider errors, or private data.
- Confirm keyboard focus and accessible names for icon-only buttons and dialogs/drawers.

Dependencies:
- UI guidelines.
- Security standards.

Future expansion:
- Advanced onboarding, guided setup, and analytics are deferred.

## User Experience Requirements
Primary navigation:
- Keep the first Release 1.0 experience centered on Home, Tasks, and Settings.
- Existing top-level tabs should remain stable unless the implementation spec explicitly demotes low-maturity modules.
- No new top-level modules should be added.

Dashboard experience:
- Show today's operational picture first.
- Surface schedule status, important/overdue tasks, household members, and module action cards.
- Provide clear disconnected/empty/error states for calendar and data.

Daily household workflow:
- Sign in, land on Home, scan next actions, complete or create tasks, check schedule, and adjust household/settings only when needed.

Task workflow:
- Create from Tasks or an existing quick action.
- Assign to a household member or Family.
- Set category, priority, status, due date, recurrence where supported, and notes.
- Complete/reopen/delete with clear feedback and confirmation for destructive actions.

Household workflow:
- Owner creates invite, shares one-time raw link, monitors pending invites, revokes when needed, updates roles, and removes members.
- Invited authenticated user previews, accepts, or declines.
- User switches active household only among active memberships.

Empty states:
- Every core list must show what is missing and the next valid action when one exists.
- Unauthorized users should see read-only context rather than broken controls.

Loading behavior:
- Use stable skeletons or loading labels for initial screen loads and async actions.
- Disable duplicate-submit actions while saving.

Error handling:
- Show recoverable user-safe messages near the affected action.
- Do not expose secrets, raw provider errors, auth sessions, invite tokens, or SQL internals.

Responsive expectations:
- Validate 360px mobile width, tablet/desktop width, long names/emails, long task titles, and dense Settings rows.
- Ensure fixed bottom navigation does not cover content.

Accessibility goals:
- Keyboard-accessible navigation, forms, drawers, dialogs, and destructive confirmations.
- Visible focus states.
- Programmatic labels for inputs and icon-only buttons.
- Status text in addition to color.

## Architecture Review

### Strengths
- Modular source structure is established.
- Household context provides a clear runtime boundary.
- Supabase is the durable system of record for core household data.
- Security-sensitive invitation flows use RPCs and hash-only token persistence.
- Server-side calendar storage exists for secure OAuth token handling.
- Process, template, security, and production readiness docs are now durable.

### Weaknesses
- Some modules remain low-maturity while still appearing in primary navigation.
- Existing module tables still preserve user-owned compatibility RLS.
- Automated tests are limited.
- Historical local/browser fallback paths still exist for compatibility.
- Architecture docs include future target language that can read broader than current implementation.

### Release 1.0 Improvements
- Tighten core module UX without broad redesign.
- Confirm or document the navigation stance for lower-maturity modules.
- Revalidate household collaboration and active household behavior in disposable/local/staging environments.
- Add only targeted schema/RLS/API changes required for core readiness.
- Improve documentation consistency where implementation finds stale references.

### Deferred Architecture Work
- Full household-scoped RLS conversion across all modules.
- Ownership transfer and owner recovery.
- Public sign-up and onboarding.
- Push/email/SMS notification delivery.
- TypeScript migration.
- Broad module expansion and new integrations.

## Release Backlog

### P0 - Finalize Release 1.0 Implementation Spec From This Blueprint
Complexity: Small

Dependencies: This document, current process docs, roadmap/status docs.

Recommended order: 1

Acceptance criteria:
- Implementation branch and exact scope are confirmed.
- Deferred items are copied into the implementation prompt.
- Required validation environments are identified.

### P0 - Core Workflow Smoke Baseline
Complexity: Medium

Dependencies: Local app, disposable/local or staging Supabase, seeded owner/adult/viewer users.

Recommended order: 2

Acceptance criteria:
- Sign-in, household load, dashboard, tasks, settings, household switching, and invite acceptance baseline are tested before code changes.
- Existing failures are documented before fixes.
- Production Supabase is not touched.

### P0 - Dashboard Readiness Pass
Complexity: Medium

Dependencies: Task data, family member data, calendar connection states.

Recommended order: 3

Acceptance criteria:
- Dashboard clearly surfaces today's schedule, important/overdue tasks, family context, and next actions.
- Loading, empty, disconnected, connected, and error states pass mobile and desktop smoke tests.
- Navigation actions work without losing active household context.

### P0 - Task Workflow Readiness Pass
Complexity: Medium

Dependencies: Tasks schema, household people, active household context.

Recommended order: 4

Acceptance criteria:
- Create/edit/complete/reopen/delete/reassign/filter/sort flows pass.
- Duplicate submits are prevented where saves are async.
- Destructive delete uses confirmation and preserves nearby state.
- Single-user and household-member flows both pass.

### P0 - Household And Settings Readiness Pass
Complexity: Medium

Dependencies: Release 0.9 invitation RPCs, RLS, household context.

Recommended order: 5

Acceptance criteria:
- Owner invite/create/copy/revoke/update-role/remove flows pass.
- Adult/viewer management controls are hidden or read-only and backend denial paths pass.
- Active household switching refreshes dependent data.
- Settings save, calendar connect/disconnect status, and local reset messaging are user-safe.

### P1 - Navigation And Responsive Polish
Complexity: Medium

Dependencies: App shell and UI guidelines.

Recommended order: 6

Acceptance criteria:
- Mobile bottom navigation works at 360px width without overflow.
- Module titles and tab labels are consistent.
- No new top-level modules are added.
- Lower-maturity modules are either left stable or visually framed as current/future without removing existing behavior.

### P1 - UX State And Accessibility Audit
Complexity: Medium

Dependencies: Dashboard, Tasks, Settings readiness passes.

Recommended order: 7

Acceptance criteria:
- Core flows have loading, empty, error, success, disabled, and confirmation states.
- Forms have labels and visible focus states.
- Icon-only buttons have accessible names.
- Long names/emails/task titles do not break layouts.

### P1 - Security And RLS Validation
Complexity: Medium

Dependencies: Any touched RPCs, table access, household flows, and settings actions.

Recommended order: 8

Acceptance criteria:
- Owner, adult, viewer, invited user, and non-member allowed/denied paths are validated for touched flows.
- Invite tokens remain hash-only at rest.
- Cross-household access is denied.
- Public sign-up and production data remain untouched.

### P1 - Notification Feedback Foundation
Complexity: Small

Dependencies: Existing toast/status patterns.

Recommended order: 9

Acceptance criteria:
- Core success/error feedback is consistent enough for Release 1.0.
- No push/email/SMS/background notification system is introduced.
- Future notification delivery remains documented as post-1.0.

### P2 - Documentation And Release Closeout
Complexity: Small

Dependencies: Completed implementation validation.

Recommended order: 10

Acceptance criteria:
- Release notes, changelog, roadmap, status, architecture/database/RLS docs are updated as needed.
- Validation results and remaining risks are exact.
- Branch is clean and final recommendation is supported by evidence.

## Validation Required
Lint:
- `pnpm run lint`

Build:
- `pnpm run build`

Whitespace:
- `git diff --check`

SQL/migration:
- Required only if Release 1.0 implementation changes schema/RLS/RPCs.
- Use disposable/local/staging Supabase only unless explicit production approval is given.

RLS:
- Required for any touched household, invitation, task, settings, or active-household access path.
- Cover owner, adult, viewer/non-owner, invited user, and non-member denial paths as applicable.

Browser smoke:
- Required for dashboard, tasks, settings, household management, auth/session, invite acceptance, active household switching, and responsive layouts.

Other:
- Verify local Markdown links after documentation updates.
- Verify no secrets, token material, raw invite tokens, generated build output, or validation data are committed.

## Documentation Required
Release notes:
- Add Release 1.0 planning and implementation results.

Changelog:
- Add Release 1.0 planning and implementation entries.

Status/roadmap:
- Move Release 1.0 from planning to in-progress during implementation and complete after validation.

Architecture/database/RLS:
- Update only when implementation changes durable architecture, schema, RLS, RPCs, API routes, or module boundaries.

Other:
- Keep `docs/00_MASTER_INDEX.md` current for new durable docs.
- Update `docs/planning/TECH_DEBT.md` for any deferred cleanup discovered during implementation.

## Deferred Work
- Shopping, Life Lists, Meal Planning, Recipes, and Inventory are deferred because Release 1.0 is focused on the core household operating loop rather than new planning domains.
- Home Maintenance, Home Assistant, Smart Home, and major integrations are deferred because they require separate data, permission, and integration design.
- AI Assistant is deferred because Release 1.0 must stabilize human-operated workflows before AI automation.
- Ownership transfer and owner recovery are deferred because they need a separate security and support model.
- Public sign-up is deferred because Family OS remains a private household app.
- Full household-scoped RLS conversion is deferred unless scoped validation proves a narrow Release 1.0 need.

## Definition Of Done
- Release 1.0 implementation follows this specification or documents approved deviations.
- No unrelated product domains are added.
- Core dashboard, tasks, settings, household management, and navigation workflows pass browser smoke testing.
- Security/RLS validation passes for touched roles and denial paths.
- Lint, build, and diff-check pass.
- Documentation is updated with exact validation results and remaining risks.
- No production Supabase action occurs without explicit approval and rollback notes.
- Final release summary recommends `READY TO MERGE`, `READY TO TAG`, or `NOT READY` with rationale.

## Risks
- Lower-maturity modules in current navigation may create a perception that Release 1.0 covers more domains than intended.
- User-owned compatibility RLS may limit true household-sharing behavior in older module tables.
- Thin automated coverage increases reliance on disciplined manual smoke testing.
- Deployed Google OAuth validation remains a dependency before removing the legacy browser fallback.
- Broad UX polish could expand scope unless fixes stay tied to core workflows.

## Dependencies
- Release 0.9 household collaboration migration and validation.
- Release 0.9.1/0.9.2 process and governance docs.
- Disposable/local/staging Supabase for validation.
- Supabase Auth test users for owner/adult/viewer/invited flows.
- Google OAuth staging or local configuration for calendar validation where needed.

## Success Criteria
- A household can use Home, Tasks, and Settings daily without needing developer context.
- Household invitation and active household workflows remain secure and understandable.
- Core UI works on mobile and desktop with no obvious layout breakage.
- Release 1.0 docs make deferred work explicit and keep implementation scope narrow.
- The final implementation branch is merge-ready after validation.

## Recommendation
READY TO IMPLEMENT RELEASE 1.0 after ChatGPT/human review of this blueprint and confirmation of the implementation branch/environment plan.
