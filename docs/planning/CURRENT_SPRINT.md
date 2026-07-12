# Current Sprint

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
