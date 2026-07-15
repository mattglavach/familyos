# Current Sprint

## Release 3.1.0 - Relationship OS

Status: released to production on 2026-07-14.

- [x] Add household-scoped relationship profiles with requested context and lifecycle fields.
- [x] Add transparent health, birthdays, attention, recent/planned activity, suggestions, and goals dashboard sections.
- [x] Add one-tap completed and planned activity logging with automatic contact-date and Timeline updates.
- [x] Add Home Relationship Focus and weekly relationship summary without duplicate recommendations.
- [x] Add Relationship Search and Household Timeline integration.
- [x] Add responsive, dark-theme, keyboard, screen-reader, and large-target behavior.
- [x] Add unit, migration, seed, and authenticated Playwright coverage.
- [x] Complete the full 77-test authenticated desktop/mobile/tablet/dark regression matrix.
- [x] Back up production and apply/verify both additive Relationship OS migrations with RLS and anonymous privilege hardening.
- [x] Publish, deploy, and complete public production verification.
- [ ] Create and verify the final `v3.1.0` release tag after documentation closeout.

## Release 3.0.0 - Daily Experience Polish

Status: released to production on 2026-07-14.

- [x] Remove the redundant "Complete, delegate, or reschedule" instruction from Family Brief cards.
- [x] Make checklist habits and routines expand inline without opening the edit screen.
- [x] Limit expanded habit and routine content to directly completable checklist items.
- [x] Keep editing available through a separate, explicit Edit action.
- [x] Keep Habit edit Save and Cancel actions visible with a sticky, safe-area-aware mobile footer.
- [x] Remove dosage guidance from the Pool Attention summary while preserving detailed recommendations below.
- [x] Add focused automated coverage and update release documentation/versioning.
- [x] Complete the full local and authenticated desktop/390px release validation matrix.
- [x] Publish `main`, tag `v3.0.0`, deploy to Vercel production, and complete public production smoke.

## Release 2.10.1 - Usability Stabilization

Status: released to production on 2026-07-14.

- [x] Simplify the Home header and replace Personalize and AI Brief text controls with shared accessible icon actions.
- [x] Remove confidence, engine metadata, and generic instructions from Family Brief cards.
- [x] Group the next three Calendar events under relative day headings with a compact Calendar handoff.
- [x] Keep routine steps collapsed by default and allow inline accessible step completion when expanded.
- [x] Add Active, Paused, Archived, and All lifecycle filtering with archive confirmation and history preservation.
- [x] Sort unfinished and in-progress daily Habits work ahead of completed work.
- [x] Limit relevant Home habit recommendations and exclude completed, paused, and archived records.
- [x] Reuse the shared icon-action primitive in affected Home and Pool actions.
- [x] Add concise AI Workspace onboarding, interaction intent, and seven starter prompts.
- [x] Add the additive routine lifecycle migration and automated migration safety validation.
- [x] Defer Microsoft To Do synchronization to Release 2.11.0.
- [x] Complete the full validation matrix, production migration, deployment, and production smoke.

## Release 2.10.0 - Core Experience Maturity

Status: released to production on 2026-07-13.

- [x] Make Family Brief cards compact, action-first, keyboard accessible, and specifically deep-linked without Take Action or Completed buttons.
- [x] Rename Upcoming to Upcoming Calendar and preserve event-level navigation.
- [x] Restore Home, Habits, Calendar, Tasks, More bottom navigation and keep one global header Add entry point.
- [x] Mature simple habits and routines with categories, assignments, step guidance/order/archive, partial progress, derived completion, skip/not-applicable, history, and action-first details.
- [x] Add the backward-compatible Release 2.10 migration, focused unit coverage, and release documentation.
- [x] Complete the 21-migration blank-database rebuild, full automated checks, and 73-test desktop/mobile/tablet/dark browser matrix.
- [x] Complete the production backup, migration, READY deployment, tag, and source/deployment alignment verification.

## Release 2.9.0 - Unified Context

Status: released to production on 2026-07-13.

- [x] Unified Context Engine, Timeline, recommendation prioritization, weather, search, Smart Quick Add, attachments, dashboard preferences, notifications, and Settings implementation.
- [x] Additive migration with RLS, private storage policies, indexes, and Shopping preservation.
- [x] Unit tests and release documentation.
- [x] Full local database chain, production migration, READY deployment, and post-deployment verification.

## Release 2.8.0 - From Tracking to Intelligence

Status: released to production on 2026-07-12.

- [x] Modular recommendation registry and normalized insight contract.
- [x] Family Brief landing experience with evidence and human-controlled actions.
- [x] Notification Center integration and expanded categories.
- [x] Home Operations data model and responsive workspace.
- [x] Shopping recurrence, grouping, frequency, and inventory foundations.
- [x] Additive RLS migration, automated unit coverage, and release documentation.
- [x] Production migration, deployment, tag, and post-deployment verification.

## Release 2.7.0 dashboard and workflow refinements

Completed scope: personalized Home greeting, progressive Today’s Focus, direct maintenance routing, AI Brief shortcuts, Life Lists and Finance primary navigation, repaired habit/routine editing and nested actions, direct Google event links with calendar-email privacy, and streamlined Pool status, recommendation, and history filters. No schema change is required.

## Release 2.6.1 usability release

Completed scope: standalone Home Upcoming dates, unified Habits-page checklist/routine execution and management, and concise expandable Pool recommendations. No schema change is required.

## Release 2.6.0 release candidate

Completed scope: navigation simplification, Home prioritization, compact task and habit filters, Calendar week grouping, Pool/History and Quick Add cleanup, and checklist habit actions with threshold-based daily history. Local release validation is recorded in the completion summary and release commit.

## Release 2.5.0 production closeout

Status: released to production from `main` at merge commit `209404e` on 2026-07-12. Production migration and deployment verification passed.

Required scope is implemented: automated brief scheduling, in-app notifications, Calendar intelligence, routine templates, and automated accessibility audit coverage. The release intentionally uses authenticated-open scheduling because no reliable server scheduler is configured. Production actions remain out of scope pending approval.

Completed gates: additive migration bootstrap and upgrade validation, full unit/build/bundle/seed validation, authenticated desktop/tablet/mobile/dark regression, axe accessibility audit, preview, production migration, merged PR #10, READY production deployment, and public production smoke.

## Release 2.4.0 smart planning and daily operations

- [x] Add actionable Home context, preparation alerts, and compact daily progress.
- [x] Add user-initiated Morning Brief, Evening Review, and Weekly Planning context.
- [x] Evolve Habits with flexible goals, completion analytics, streak history, calendar visualization, and recovery guidance.
- [x] Evolve Routines with progress, history, duplication, templates, duration, and recurrence editing.
- [x] Group and deduplicate Needs Attention and add safe task quick completion.
- [x] Expand universal search to all requested active record types.
- [x] Complete local migration bootstrap, cross-viewport, dark-mode, keyboard, and regression validation.
- [x] Apply the production migrations, deploy from `main`, and complete available production verification.

## Release 2.3.0 daily operations

- [x] Correct My Tasks identity, assignment, lifecycle, and household filtering; restore Assigned by Me.
- [x] Make Pool Maintenance Done transactional, idempotent, immediately refreshed, and history-backed.
- [x] Add durable Habits and lightweight Routines with recurrence-aware completion history.
- [x] Make global Add the primary creation surface for Tasks, Life items, Habits, and Routines.
- [x] Replace More bottom navigation with Needs Attention while preserving access to all modules and Settings.
- [x] Condense Home Today Focus to three items and keep AI Brief secondary.
- [x] Complete disposable database migration/RLS validation and authenticated cross-viewport browser regression before production release.

Microsoft 365, Outlook, email workflows, health, wearables, and smart-home integrations remain intentionally deferred.

## Release 2.2.0 Today operating system

- [x] Redesign Home around Morning Brief, Today's Focus, actionable Needs Attention, Upcoming, status cards, and Quick Actions.
- [x] Add floating Quick Add with seven minimal capture paths.
- [x] Add device-local Habits with seven defaults and daily/weekly completion.
- [x] Add six daily task views, pinning, importance, recurrence, quick/inline completion, editing, and bulk completion.
- [x] Preserve authentication, permissions, dependencies, and all existing modules; add only the required optional-field Pool Test constraint repair.
- [x] Complete authenticated Playwright desktop, mobile, tablet, dark-mode, focus, containment, and regression validation in the approved non-production environment.

One required additive Pool Test migration is included and was validated only against the approved non-production test project. No production migration, push, deployment, or tag is included.

Production preflight subsequently identified missing Release 1.7 Pool context columns. The later idempotent corrective migration reconciled production without changing existing records or security controls. The legacy date-only optional-field migration is now normalized to `20260712000000_release_2_2_pool_optional_text_nulls.sql` with byte-for-byte identical SQL so future Supabase migration ordering is deterministic.

## Release 2.1.1 Calendar and Pool stabilization

- [x] Correct partial Pool Test saves, zero handling, validation, errors, refresh, and duplicate-submit protection.
- [x] Keep Today events out of This Week across all-day, timed, recurring, and local-time occurrences.
- [x] Add compact accessible inline Calendar event details.
- [x] Condense responsive Pool data-entry forms without removing fields.
- [x] Move Outlook Calendar integration to future consideration.
- [x] Complete final lint, automated, seed-safety, build, bundle-safety, responsive, dark-mode, accessibility, console, and Git validation.

No dependency, authentication, schema, migration, push, tag, or deployment work is included.

## Release 2.1.0 guided workflows and polish

- [x] Add guided, prefilled, confirmation-required acceptance for Tasks, Calendar, Pool, Life Lists, and Financial Planning.
- [x] Add favorite/recent prompts and collapsible preview metadata in AI Workspace.
- [x] Add Home Top Priorities, improved empty states, card ordering, AI Brief visibility, and default prompt settings.
- [x] Add Context Engine deduplication, priority ordering, and bounded output.
- [x] Improve responsive layouts and update release, architecture, module, roadmap, status, changelog, and developer documentation.
- [x] Complete lint, automated tests, production build, bundle safety, Playwright desktop/tablet/mobile/dark-mode, accessibility, and final Git validation.

No push, deployment, tag, migration, authentication, permission, dependency, provider authentication, or automatic AI write is included.

## Release 2.0.0 architectural release

- [x] Implement Context Engine, standard contributors, and Prompt Builder.
- [x] Implement AI Workspace, response review, Home AI Brief, and Settings controls.
- [x] Centralize active prompt creation and preserve manual copy as the only sharing path.
- [x] Add architecture, module, developer, version, roadmap, status, changelog, and release documentation.
- [x] Complete final automated, build, bundle, responsive, dark-mode, and accessibility validation.

No push, deployment, tag, migration, provider authentication, or automatic AI write is included.

## Release 1.8.4 stabilization release

- [x] Consolidate Home attention into Family Snapshot and add Life Lists plus optional greeting weather.
- [x] Remove Shopping from active routes, navigation, Add, Search, and dashboard exposure without deleting data.
- [x] Implement Due, My Tasks, All Tasks, and Completed primary task views with local-date behavior.
- [x] Simplify Calendar and correct all-day and timed multi-day event expansion.
- [x] Complete Pool treatment confirmation and privacy-first ChatGPT prompt preview/copy.
- [x] Add targeted unit coverage and update release and module documentation.
- [x] Complete final build, safety, and authenticated desktop/mobile Playwright gates.

No push, deployment, tag, migration, or production mutation is included.

## Release 1.8.3 local release candidate

- [x] Add a compact, meaningful Family Snapshot to Home.
- [x] Remove duplicate Calendar header refresh and render events in the user's local timezone.
- [x] Consolidate Pool guidance and persist collapsed-section preferences.
- [x] Remove non-value placeholder destinations from More.
- [x] Preserve database, authentication, integration, and architecture contracts.
- [x] Pass lint, automated tests, production build, bundle safety, and diff validation.

No database change, migration, dependency, push, deployment, or production mutation is included.

## Playwright authentication infrastructure remediation

- [x] Diagnosed browser, seed, allowlist, and project-target configuration drift.
- [x] Added fail-fast environment validation and shared regenerated authentication state for desktop and mobile.
- [x] Added guarded dedicated-user setup and verification documentation.
- [x] Provision the approved test target and pass authenticated desktop and mobile browser validation.

No production credential, production user, remote Git, deployment, or production database change is in scope.

## Release 1.8.2 local release candidate

Release 1.8.2 simplifies the daily operating loop: Home prioritizes schedule, urgent tasks, and unique alerts; Tasks uses progressive filter disclosure; Pool provides one status, one recommendation, one activity timeline, and optional trends; shared empty states collapse compactly. Scope is local only with no schema, dependency, push, or deployment work.

## Release 1.8.1 local release candidate

- [x] Correct Tasks Show All and post-create filter reset behavior.
- [x] Compact Tasks filters and task rows.
- [x] Compact connected Calendar status and event rows.
- [x] Tighten Dashboard and shared application spacing.
- [x] Preserve Release 1.8 architecture, Household Context, Calendar timezone, Pool, and database contracts.
- [x] Complete automated lint, unit/regression tests, seed safeguards, production build, bundle safety, and diff checks.
- [ ] Local browser screenshots remain unavailable because the required `agent-browser` executable is not installed; no remote target was used.

No push, merge, commit, tag, deployment, production mutation, or migration application is authorized for this sprint.

## Release 1.8.0 local release candidate

- [x] Household Context Service contract and test coverage.
- [x] Deterministic cross-module attention framework with deduplication and expiry.
- [x] Attention-focused Dashboard with Today, Upcoming, Tasks, Calendar, Pool, and Maintenance.
- [x] Pool trend, demand, pH-rise, retest, maintenance, completeness, timeline, and context improvements.
- [x] Global Search retained with Pool record coverage.
- [x] Version and canonical documentation updated.
- [x] Full automated lint, tests, seed safeguards, build, and bundle validation.
- [ ] Authenticated desktop/390px browser smoke is blocked until local Supabase is running; no remote test target was used.

No push, merge, tag, deployment, production mutation, or migration application is authorized for this sprint.
