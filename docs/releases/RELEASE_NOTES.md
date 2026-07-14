# Release Notes

## Release 2.10.1 - Usability Stabilization

FamilyOS 2.10.1 reduces visual and instructional noise across the core daily loop. Home actions are compact and accessible, Family Brief shows only information needed to act, Upcoming Calendar is grouped by day, routines expand inline, lifecycle state is explicit and filterable, Pool uses the shared icon-action pattern where appropriate, and AI Workspace explains its safe proposal-and-approval model on first use.

The release adds one backward-compatible database change: `routines.status` supports Active, Paused, and Archived while preserving the existing `archived` flag, completion history, household ownership, and RLS. Microsoft To Do synchronization remains deferred to 2.11.0.

Production release: migration history is aligned through 22 versions and Vercel deployment `dpl_3LcUnTBGxPCL4USa2cEBkq9rdjxj` is READY at `familyos-pi-seven.vercel.app`. Authenticated production mutation testing was not run because no approved production browser session was available; the approved non-production authenticated matrix passed. The known Node deprecation warning remains non-blocking.

## Release 2.10.0 - Core Experience Maturity

FamilyOS now centers the daily experience on “What should I do next?” Family Brief recommendations are compact action surfaces that open the most specific available record and fall back safely when a record is stale or unavailable. Upcoming Calendar rows retain event-level navigation. Primary mobile navigation is Home, Habits, Calendar, Tasks, and More; Quick Add remains available through one global header Add control.

Habits supports simple one-action habits and multi-step routines in one workspace. Routines persist partial progress, derive completion from required active steps, reopen when a required step is unchecked, and provide skip or not-applicable states that do not count as completion or break streak calculations. Household-wide habits use one shared household completion; a specific household member can be assigned. Existing habit records remain simple by default.

The additive migration adds practical category metadata, routine-item guidance and lifecycle timestamps, active/archive support for legacy routine steps, and explicit completion statuses. Existing RLS and owner/adult write enforcement remain unchanged. Rollback is application-first: redeploy v2.9.0 and retain additive columns and statuses to avoid data loss.

Release validation completed: lint; declaration type checking; 35 unit suites and 134 tests; Release 2.10 migration assertions; 18 seed-safety tests; production build and bundle-safety scan; a 21-migration blank-database rebuild; and 73 authenticated Playwright tests across desktop, 390px mobile, tablet, and dark mode. The browser matrix covers navigation, persistence, failure handling, accessibility, responsive containment, Habits/Routines, Quick Add, and the established release regression suite.

Production closeout completed after schema and public-data backups. All 21 migrations are aligned, the additive v2.10 columns, indexes, and status constraints are present, and the application is READY at `familyos-pi-seven.vercel.app`. Immutable application deployment: `familyos-76i5h82az-glavach.vercel.app`. Desktop/mobile unauthenticated, weather, console, and bundle-secret checks passed. Runtime review found no application error cluster; Vercel still reports the known non-blocking Node `url.parse()` deprecation warning on serverless calendar/weather routes.

## Release 2.9.0 - Unified Context

FamilyOS now combines household signals into a prioritized, explainable view without relying on AI. A dedicated Household Timeline provides a bounded chronological record; Family Brief and Notifications reuse the same scored recommendations; Global Search and Smart Quick Add reduce navigation; and household location drives cached server-side weather context. Dashboard layout is recoverable and per-user. Managed images and PDFs use private Supabase Storage and signed access.

Shopping is no longer part of the active FamilyOS experience and is excluded from Timeline, Search, Smart Quick Add, recommendations, notifications, and navigation. Historical Shopping data and schema remain intact. Full architecture, migration, rollback, provider selection, and limitations are documented in `docs/releases/RELEASE_2_9_0.md`.

Validation completed: lint; TypeScript declaration checks; 32 unit suites and 126 tests; migration/RLS/storage policy assertions; 20-migration empty-database rebuild; direct local and production schema/policy/bucket verification; authenticated private upload/signed URL test; seed safety; production build; bundle safety; authenticated desktop, tablet, 390px mobile, and dark smoke; accessibility checks in the same viewport matrix; production database backup and migration; READY Vercel deployment; production desktop/mobile unauthenticated and weather checks; bundle secret scan; and Vercel log review with no application runtime errors. Vercel records one non-blocking Node deprecation warning from the server runtime. Production: `familyos-pi-seven.vercel.app`, immutable deployment `familyos-6b4byrzhn-glavach.vercel.app`.

## Release 2.8.0 - From Tracking to Intelligence

FamilyOS now opens with a concise Family Brief that explains what needs attention, what is due today or this week, and the recommended next action. Recommendations remain advisory: users must explicitly open the owning module or acknowledge completion, and no AI output automatically mutates household records.

The shared recommendation registry includes Calendar, Tasks, Habits, Pool, Home Maintenance, Garden, Shopping, Life events, and recent accomplishment providers. Each result includes severity, category, action, evidence, navigation, and stable identity for dismissal. Notifications reuse these results instead of duplicating domain rules.

Home Operations adds structured household assets and schedules across HVAC, appliances, filters, warranties, vehicles, lawn, garden, and projects. Shopping adds recurring-item, store-group, meal-group, purchase-frequency, and inventory-aware fields while preserving all existing lists and pantry records.

Database changes are additive and household-scoped. The migration creates `home_assets` and `home_asset_history`, extends `shopping_items`, enables RLS, and can be safely re-run through `IF NOT EXISTS` operations. Rollback is application-first: redeploy v2.7.0 and leave additive tables/columns in place to avoid data loss.

Validation completed: lint; 28 unit suites and 115 tests; seed safety; production build; bundle-safety; 19-migration empty-database chain and direct schema/RLS assertions; authenticated desktop, tablet, 390px mobile, and dark Playwright smoke; production database migration; READY Vercel deployment; desktop and 390px production HTTP/content/console verification; and clean Vercel error-log scan.

Production deployment: `familyos-ar8prbn46-glavach.vercel.app`, aliased to `familyos-pi-seven.vercel.app`. Post-deployment checks returned HTTP 200 with no browser errors or framework overlays. Release tag: `v2.8.0`.

## Release 2.7.0 - Dashboard and Workflow Refinements

Release 2.7.0 reduces routine navigation. Home now greets the signed-in profile by first name when available, initially shows three focus items, drills maintenance toward the owning record, places Upcoming before Status, and provides compact accessible Calendar and Tasks shortcuts. The primary bottom navigation is Home, Life Lists, Quick Add, Finance, and More.

Habits uses the existing Release 2.6.1 tables and history contracts. Simple habits can be edited, checklist actions remain visibly nested, and routine steps are shown in order. Existing controls support renaming, reordering, required or optional state, activation, addition, and deletion without rewriting historical completion rows.

Synced Google Calendar events open their existing provider URL in a new tab with safe opener isolation. Events without a provider URL retain FamilyOS inline details, and account email addresses are no longer used as visible calendar labels. Pool status now contains current-state language only; the operational recommendation expands inline and can be logged directly. Pool history filters are compact, aligned, responsive, and no longer offer Note as a filter. Existing note records remain available in the broader All history view.

No database migration, dependency change, production mutation, push, tag, or deployment is included.

## Release 2.6.1 - Usability Refinement

Release 2.6.1 improves clarity without changing the database. Home Upcoming entries now include their own weekday and date. The Habits page becomes the direct work surface for simple habits, checklist habits, and routines: checklist rows remain compact until expanded, child actions update calculated progress, basic actions can be added inline, and advanced configuration/action management remains available through details.

Pool Recommended Next Step now starts collapsed with a concise action, supported quantity, and follow-up. Expansion reveals only relevant structured sections for condition, application, timing, retesting, safety, and follow-up while preserving the existing chemistry engine.

## Release 2.6.0 - Focused Daily Operations

Release 2.6 simplifies the daily shell around Home, Habits, Calendar, Tasks, and More. Home now uses one prioritized focus list, week events scan by day, task and habit controls use progressive filters, Pool and History remove duplicate creation controls, and Quick Add has one ordered capture surface.

Checklist habits add one level of actions beneath a habit, with `any`, `count`, and `all` thresholds. Parent completion is calculated from the daily action snapshot, not manually bypassed. The additive migration preserves existing simple habits and adds household-scoped action definitions and lightweight daily history.

Local validation includes lint, 107 unit tests, 18 seed-safety tests, production build, bundle safety, fresh 18-migration bootstrap, and authenticated desktop, 390 px mobile, tablet, and dark-mode smoke. The additive 2.6 migration was also applied to the verified non-production demo project for browser validation. Production migration and deployment were not performed.

## Release 2.5.0 - Proactive Planning and Household Automation

Release 2.5 makes planning proactive without allowing FamilyOS or AI to make autonomous record changes. Household members can configure brief schedules, see a restrained notification queue, understand calendar conflicts and recurring events, and create routines from reusable templates.

Scheduled briefs use a safe staged model: preferences and generation history are stored in Supabase, and due briefs are surfaced when an authenticated member opens FamilyOS. No browser timer, background delivery, email, SMS, push, or production cron is claimed. AI output remains a proposal.

Calendar recurrence remains provider-owned. FamilyOS identifies recurring occurrences, conflicts, and tight transitions, but directs mutation to Google Calendar until a write-safe recurrence contract exists.

Release 2.5.0 was published to production on 2026-07-12 after additive migration, merge, deployment, and post-deploy verification. Production uses the stable Vercel alias and Supabase project `dsowansazqleudupnjug`; the migration history is current through `20260712040000`.

## Release 2.4.0 - Smart Planning and Daily Operations

Production compatibility note: release validation identified historical schema variance in `pool_schedule.id` (`text` in fresh baselines and `uuid` in production). The Release 2.3 prerequisite migration now stores maintenance-history schedule identifiers as text without a cross-type foreign key and resolves schedules through a safe textual comparison. This preserves existing records and behavior across both schema shapes.

Release 2.4.0 evolves existing daily-operations foundations into a preparation-focused command center without changing module ownership. Home now combines actionable preparation signals with a compact daily progress readout. AI Workspace offers explicit Morning Brief, Evening Review, and Weekly Planning prompts using structured Tasks, Calendar, Habits, Routines, Home, and recorded Pool context; generation remains user initiated and output remains advisory.

- Habits: count-based weekly/monthly goals, weekday schedules, current and longest streaks, weekly/monthly completion rates, a 28-day completion calendar, and recovery guidance.
- Routines: progress bars, completion-history counts, duplication, recurrence editing, template guidance, and retained estimated duration.
- Needs Attention: grouped Today, This Week, Overdue, Maintenance, Habits, and Calendar preparation items with task quick completion and shared deduplication.
- Search: direct results for Habits, Routines, home maintenance, Tasks, Events, Pool history, and Life Lists.
- Data: additive `target_count` and `template_key` fields plus history query indexes. No destructive data changes.
- Validation: lint, 102 automated tests, 18 seed-safety tests, fresh 16-migration bootstrap, production build, bundle safety, `git diff --check`, and 13 authenticated non-production Playwright workflows across desktop/mobile/tablet/dark mode passed. Keyboard search and accessible labels were exercised; no separate automated WCAG audit was run.
- Production: backups captured for `public` and `auth`; Release 2.3 and 2.4 migrations applied to verified project `dsowansazqleudupnjug`; all 16 migration versions, new columns, indexes, RPC, and RLS state verified; Vercel production deployment `dpl_DETSAkJtQhdDxzRG1rMCX5Fiky98` is `READY` at commit `d58dc52`; public sign-in smoke passed; no warnings, errors, or fatal logs were found for the current deployment. Authenticated production navigation was not run because no approved production browser session or credentials were available.

## Release 2.3.0 - Daily Operations Foundation

Date: 2026-07-12

Release 2.3.0 strengthens FamilyOS as the household system of record. My Tasks now resolves the authenticated member reliably, Pool Maintenance completion is atomic and visible, Home is more concise, and the global Add menu is the primary creation surface. Durable Habits and lightweight Routines add recurrence-aware completion history. Needs Attention now occupies the mobile navigation position previously used by More, while lower-frequency modules remain available through the Modules surface and Settings remains in the header.

- Database: `20260712020000_release_2_3_daily_operations.sql` adds non-destructive task lifecycle columns, Habits, Routines, notification state, Pool maintenance history, focused indexes, RLS, grants, and the idempotent `complete_pool_maintenance` RPC.
- Security: active-household RLS applies to all new household records; personal notification state is user-owned; Pool completion requires owner/adult authorization inside the RPC.
- Known limitations: advanced habit targets/analytics, pause/vacation modes, smart reminders, full notification delivery scheduling, and advanced routine templates are deferred. Microsoft 365 and Outlook remain future considerations.
- Validation: approved non-production migration application, authenticated RLS/invariant checks, 99 application tests, 18 seed-safety tests, production build, bundle safety, fresh 15-migration bootstrap, and authenticated desktop/mobile/tablet/dark-mode smoke and Release 2.3 workflows passed. Production migration and production verification were not performed.
- Test migration history: the approved test project already contained the historical household, Calendar, Life, Shopping, Meal, and Pool structures but lacked their migration-history rows. After direct structure verification, twelve historical versions were marked applied; a dry run then confirmed Release 2.3 was the only pending migration.

## Release 2.2.0 - Today, Quick Capture, and Habits

Date: 2026-07-12

Release 2.2.0 turns FamilyOS into a faster daily operating surface. Home now prioritizes today’s schedule, urgent work, household status, habits, and five direct capture actions. Global Quick Add supports seven minimal capture paths, and Habits introduces lightweight daily consistency tracking.

- Database changes: the initial additive migration drops historical `NOT NULL` constraints from optional `pool_readings.recent_weather_notes` and `pool_readings.water_appearance`; the later corrective migration safely supplies missing Release 1.7 Pool context columns before enforcing the same final contract. RLS, grants, ownership, required chemistry fields, and existing data are unchanged.
- Corrective database note: production preflight found that `pool_readings.test_context` and `pool_readings.water_appearance` were missing. A later idempotent migration adds them only when absent, preserves the canonical required `Routine` context default, and makes optional weather and appearance values nullable without changing RLS, grants, policies, ownership, or records.
- Migration history: the already-applied optional-field contract is recorded as `20260712000000_release_2_2_pool_optional_text_nulls.sql`, normalized from the legacy date-only filename so it sorts before the `20260712010000` corrective migration. The SQL content is unchanged; this is migration-version normalization, not a new schema change.
- Dependencies: None.
- Validation: lint, 93 unit/integration tests, 18 seed-safety tests, production build, bundle safety, and 57 authenticated Playwright tests across desktop, 390px mobile, tablet, and dark-mode projects, including real Pool persistence, focus, responsive containment, failure retention, and refresh verification.
- Known limitation: habits and task pins are authenticated-user-scoped but device-local and do not sync between devices.
- Recommendation: proceed to product-owner review; deployment remains intentionally out of scope.

## Release 2.1.1 - Calendar and Pool Stabilization

FamilyOS 2.1.1 corrects Pool Test validation and persistence for partial measurement sets, including zero values, while retaining entered data on failure and protecting against duplicate submissions. Pool Test and related Pool entry forms use a more compact responsive layout, refresh saved readings immediately, and provide specific field and safe persistence feedback.

Calendar now keeps today's local-time occurrences exclusively in Today, begins This Week tomorrow, and expands compact event cards inline with keyboard and ARIA support. Empty event details are omitted and existing external Calendar actions remain available. Outlook Calendar is not part of this release or a near-term dependency; Microsoft integrations remain a future consideration after the core application is stable and mature.

No database migration, authentication change, dependency addition, push, tag, or deployment is included.

## Release 2.1.0 - Guided Workflows & Product Polish

AI recommendations can now become guided proposals for Tasks, Calendar, Pool, Life Lists, and Financial Planning. Choosing a proposal opens the owning module's existing form with suggested values. Calendar opens Google Calendar's existing event template. In every case, the user reviews and explicitly saves or cancels; FamilyOS performs no automatic database write.

AI Workspace now supports device-local favorite prompts, recent prompt reuse, collapsible privacy and full-prompt sections, and richer version and size metadata. Home now leads with Top Priorities, has stronger schedule and household empty states, and supports device-local card ordering, AI Brief visibility, and a default prompt template.

The Context Engine deterministically removes duplicate items, orders high-priority facts first, and bounds each repeated section. Responsive layouts avoid narrow-screen action collisions and long-text overflow. No schema migration, authentication change, permission change, dependency addition, automatic prompt transmission, or automatic AI-originated write is included.

Validation: ESLint, 78 application tests, seed-safety tests, production build, bundle-safety scan, authenticated Playwright desktop/tablet/mobile/dark-mode coverage, accessibility regression checks, and Git whitespace validation.

## Release 2.0.0 - Context Engine and AI Workspace

FamilyOS now aggregates structured context from Tasks, Calendar, Life Lists, Pool, Home, and Financial Planning through a provider-neutral Context Engine. A separate privacy-aware Prompt Builder creates compact prompts and displays included modules, estimated size, excluded sections, privacy notes, and contract versions.

AI Workspace centralizes Ask FamilyOS, suggested questions, prompt preview, Copy Prompt, recent prompt metadata, and optional response review. Prompts are never sent automatically. AI responses and conversation history are not stored. Identified suggestions require explicit review and remain manual until a separately approved owning-module acceptance workflow exists.

Known limitations: traceability is device-local, token size is an estimate, provider launch/authentication is intentionally absent, and Response Review uses deterministic line patterns rather than an AI classifier. No database migration was made.

## Release 1.8.4 - Core Workflow Stabilization

FamilyOS 1.8.4 makes the daily experience shorter and completes the Pool treatment loop. Home now uses one Family Snapshot with embedded attention details, a stable Life Lists entry, and optional non-blocking weather. Tasks opens to Due and excludes work assigned exclusively to another person from My Tasks. Calendar is limited to Today and This Week and repeats active multi-day events on every applicable local date. Google events retain their verified external source action.

Shopping is no longer exposed in the active product. Existing database tables and stored Shopping records are preserved. Pool treatment recommendations now open the existing editable chemical form and write only after confirmation. Review with ChatGPT previews a privacy-filtered prompt and requires the user to copy it; FamilyOS never transmits the prompt or accepts external AI output into Pool records.

Known limitations: greeting weather requires a supported location value on household settings (`weather_location`, `location`, `postal_code`, or `zip_code`). The current schema does not provide a Settings field for it, so weather remains gracefully hidden until location configuration is added. Release 2.0.0 is the next planned release.

## Release 1.9.0

Release 1.9.0 is a platform quality release. Universal Search now opens from the header or Ctrl+K/Cmd+K, uses fast partial matching, groups results by module, and carries useful context into the destination item or workspace. Search covers Tasks, Calendar, Life Lists, Pool History, Shopping, Pantry, and Settings, while retaining the existing implemented planning surfaces.

The Notification Center remains lightweight and in-app only. It dynamically derives overdue tasks, tasks due today, the next seven days of Calendar events, Pool testing and maintenance attention, and existing household reminders. The bell shows an unread badge, each item can be marked read, selecting an item opens its source, and Clear All archives the current set locally on the device.

Shared platform UI now provides responsive empty states, card/list/table skeletons, friendly retryable error cards, offline-aware copy, and an application-level recovery boundary so a module failure does not produce a blank screen. Keyboard focus, ARIA labeling, screen-reader loading announcements, and changed touch targets were reviewed. Lower-frequency modules and global overlays are lazy-loaded, reducing the initial production JavaScript bundle by approximately 25 KB. Home retains the 1.8.4 compact daily-brief structure and continues to hide empty sections.

Known limitations: notification read state remains device-local, notifications do not use push/email/SMS delivery, search uses the current in-memory household datasets rather than a server index, and navigation is state-based rather than URL-addressable. These are intentional platform boundaries for this release.

Future roadmap: continue Gardening Operations as a separately scoped future module release; evaluate a shared server-backed search registry and durable notification preferences only when scale or multi-device needs justify them.

No database migration, authentication change, permission change, dependency change, or new module is included.

Validation passed: ESLint; 62 application tests; 18 seed-safety tests; production build; production bundle safety; authenticated Playwright smoke on desktop Chromium, 768px tablet Chromium, 390px mobile Chromium, and dark-mode Chromium; and `git diff --check`.

## Release 1.8.4

Release 1.8.4 is a cohesive UX refinement release. The top bar replaces Calendar status with a prominent global Add action and keeps Settings as the far-right icon. The compact Add sheet routes Task, Pool Activity, and Pool Test Result into established forms, while Calendar Event hands off to Google Calendar's existing event editor.

Bottom navigation now contains Home, Tasks, Calendar, Pool, and More. Pool has its own selected state and Add is no longer a bottom destination.

Pool History cards are denser and expose accessible Edit and Delete buttons without swiping. Existing edit validation is preserved, deletion requires confirmation, and History-specific swipe instructions, gesture handlers, and hidden actions are removed.

Home opens with a compact greeting, date, and meaningful daily summary, followed only by populated Today's Schedule, Needs Attention, and Family Snapshot sections. Schedule is limited to three events, attention is capped at five prioritized items, duplicate task/alert surfaces are consolidated, and Pool status is reduced to condition, one next step, and last-test timing.

Validation covers lint, automated tests, seed safety, production build, bundle safety, authenticated desktop/mobile browser flows, navigation, Pool History edit/delete confirmation, empty-state behavior, duplicate-content review, and diff validation. No database, migration, dependency, authentication, permission, production configuration, financial calculation, or Pool chemistry logic changed.

## Release 1.8.3

Release 1.8.3 continues the focused UX cleanup. Home adds a compact Family Snapshot below Needs Attention and only shows Pool, Retirement, or Home rows when their source data produces a useful status. Each row routes to the owning Pool or Finance workspace.

Calendar removes the duplicate page-header Refresh button while retaining the connected Calendar refresh/status control, connection recovery actions, empty-state refresh, and existing pull-to-refresh behavior. Timed events now render in the user's browser-local timezone across Calendar consumers. All-day dates remain date-only.

Pool keeps Pool Status visible, incorporates the recommendation into that status card, and collapses Water Test Results, Recent Activity, and Trend Charts by default. Expansion preferences are saved locally per browser using one shared expandable-section component. More no longer shows placeholder destinations. Settings remains the household-management surface.

Validation passed for lint, 62 application tests, 18 seed-safety tests, production build, bundle safety, authenticated desktop Chromium, and authenticated 390px mobile Chromium. This release adds no database changes, migrations, dependencies, authentication changes, or architecture changes. It is committed locally only and is not pushed or deployed.

## Release 1.8.2

Release 1.8.2 is a focused local UX simplification release. Home now behaves as a daily brief instead of a module inventory: it shows up to three upcoming events, five time-sensitive priorities with due-date labels, and three non-duplicative Needs Attention items. Empty Home sections disappear without leaving gaps. Shopping and Meal Planning remain available in their owning modules but no longer appear on Home.

Tasks now defaults to one compact search and primary-filter toolbar. Secondary status, priority, assignee, and due-date controls expand on demand and keep their values when collapsed. Show All still resets the full search and filter state. Assigned by Me uses the existing task creator identifier and introduces no new persistence.

Pool now has one primary status summary with test timing, latest treatment, current chemistry, targets, and exception status. One Recommended Next Step replaces repeated action-plan and recommendation surfaces. Recent tests, treatments, and maintenance appear in a compact combined timeline, and Trends stays collapsed until requested and only appears with adequate history. Existing History, Equipment, Maintenance, drawers, and bottom Add behavior remain available.

Shared empty states use compact spacing and smaller optional actions. Release 1.8.2 adds no modules, dependencies, database changes, migrations, or architecture changes and is not pushed or deployed by this local release scope.

## Release 1.8.1

Release 1.8.1 is a local UX-polish and stabilization release. Tasks now reliably reveal a newly created item by resetting all filters after save, and Show All resets the complete filter state. Task filters, task rows, Calendar connection status, Calendar event rows, Dashboard cards, shared screen padding, and section spacing are substantially more compact. Completed tasks remain available through the Status filter, while Show All intentionally shows every active household task, including overdue, future, and no-due-date items. No module, schema, migration, integration contract, dependency, or architecture was added or changed.

Validation passed for ESLint, 62 automated tests, 18 demo-seed safety checks, the production build, production bundle safety, and `git diff --check`. Authenticated visual screenshots were not produced because the required local `agent-browser` executable is unavailable. No remote test environment was used.

## Release 1.8.0

### Calendar timezone blocker
Timed Calendar rendering now treats the preserved provider timestamp as authoritative and formats it explicitly in `America/New_York`. A July instant of `2026-07-11T18:00:00Z` displays as `2:00 PM`, not `6:00 PM`. The correction applies to recurring and non-recurring events across Calendar cards, details, Dashboard, Search, Notifications, server sync, and browser fallback. All-day dates remain date-only. Calendar events are not stored in Supabase, so no record repair or migration is required.

### Summary
FamilyOS now builds a normalized, household-scoped context contract and uses it to make Home an attention-focused command center. Pool Operations adds observed trend, demand, retest, maintenance, and completeness intelligence without predictive claims or automatic control.

### Safety and boundaries
- Deterministic application rules only. No ChatGPT or AI-provider call is made.
- Every Pool action requires human review and confirmation.
- No automatic dosing, SWG adjustment, equipment control, external notification delivery, or AI database update exists.
- Gardening is explicitly unavailable and scheduled for Release 1.9.

### Database
No Release 1.8 migration is required. Existing Release 1.7 traceability fields support follow-up outcomes. No migration was applied.

### Validation
Lint, 40 automated tests, seed safeguards, production build, and bundle-safety validation passed. Authenticated desktop and 390px browser smoke could not run because local Supabase was unavailable and the separate `agent-browser` executable was not installed. No remote test target, remote Git action, or production action was used.

## Release 1.7.0: Stabilization and Pool Operations
Status: local release candidate, not deployed. This release fixes Calendar timezone normalization, removes Household/Health from More, and makes Pool the first focused Home operations workspace. The additive `20260711000000_release_1_7_pool_operations.sql` migration requires approval before application and does not rewrite existing records. Advanced trends, Gardening, cross-module context, live integrations, automatic control, and broad Home asset management remain deferred.

## Release 1.6

### Version
1.6

### Date
2026-07-10

### Summary
Release 1.6 hardens the core operating loop without adding a new module or database schema. It defines app-level integration contracts, improves cross-surface handoffs from Home, Search, and Notifications into Tasks, Calendar, and Life Lists, tightens Tasks filter reset behavior, and clarifies Calendar refresh/status behavior.

### Features And Fixes
- Added `docs/platform/08_integration_contracts.md` for Calendar, Search, Notifications, Quick Add, Home, and module navigation handoffs.
- Added lightweight navigation payloads so Search, Notifications, and Home can open Tasks with useful filter/search context.
- Added best-effort Calendar event selection from Search and Notifications.
- Added best-effort Life Lists list/item handoff from Search.
- Renamed the primary Tasks all-items filter to Show All and added Clear All to reset search, filters, and sort.
- Refreshed server Calendar connection status when the browser returns to focus or visibility.
- Changed Calendar top refresh copy to distinguish Refresh Events from Refresh Status.
- Fixed shared `Button asChild` rendering so connected Calendar event links do not crash the Calendar screen when events load.

### Database Changes
- None.

### Deferred
- Legacy browser Calendar fallback removal remains deferred until deployed server OAuth connect, reconnect, disconnect, and event-refresh smoke validation passes on the production or staging origin.
- URL-based deep links, durable notification records/preferences, shared Search registry, Quick Add registry implementation, Context Engine runtime, Home Platform, Financial Planning, and Calendar event creation/editing remain deferred.

### Validation Status
- `pnpm run lint`: passed.
- `pnpm run build`: passed. CRA emitted the existing Node `fs.F_OK` deprecation warning after a successful compile.
- `pnpm test`: passed, 3 suites and 20 tests.
- `git diff --check`: passed with line-ending normalization warnings only.
- Authenticated RC1 preview connected to Google Calendar and loaded 50 events after the preview origin was authorized; validation exposed and fixed a shared Radix Slot child-structure crash in connected Calendar rendering. Connected-state browser smoke must be rerun on the amended preview deployment.
- Local browser smoke: blocked before authenticated app rendering because `.env.local` points Supabase to `http://127.0.0.1:54321`, that auth endpoint refuses local connections, and Docker Desktop is not running in this workspace. This is a local environment blocker, not a Release 1.6 auth regression.
- Deployed Calendar OAuth connect/reconnect/disconnect smoke: not run in this workspace because it requires authenticated production or staging Google OAuth access.

### Recommendation
Implementation complete, but not ready to remove the legacy browser Calendar fallback until deployed server OAuth validation passes.

## Planning Sprint - 2026-07-10

### Summary
Completed the FamilyOS implementation planning sprint in `docs/planning/IMPLEMENTATION_PLAN_2026_07_10.md`.

### Scope
- Repository architecture summary.
- Feature inventory.
- Platform services assessment.
- Technical debt assessment.
- Module readiness assessment.
- Release 1.6 through 2.0 planning.
- Context Engine roadmap.
- Design system gap analysis.
- Recommended Release 1.6 scope.

### Database Changes
- None.

### Recommendation
Execute Release 1.6 Core Operating Loop Hardening next.

## Release 1.5.1

### Version
1.5.1

### Date
2026-07-10

### Summary
Release 1.5.1 completes Pool & Quick Add UX polish across shared drawer forms. It standardizes compact form sections, numeric fields, validation placement, notes/context controls, save/cancel footers, duplicate-submit guards, and accessible touch-target sizing for Pool Test, Quick Add Pool Test, Tasks, Shopping, Meal Planning, and Life Lists without database schema changes.

### Fixes
- Added shared form controls for section grouping, rows, numeric fields, toggles, notes, date/time entry, validation summaries, drawer footers, and delete actions.
- Standardized Pool Test and Quick Add Pool Test around shared chemistry metadata and validation helpers.
- Kept partial Pool Test logging valid while preserving numeric range checks for entered values.
- Hardened shared Button sizing so representative production buttons remain at least 44x44 CSS pixels on mobile.

### Database Changes
- None.

### Production Closeout
- Main merge commit: `9196bfa3a617af70d2f546a56062da5a27e6ebb2`.
- Final tagged production commit: `fffe50c250d01ee6c42f3f5a0607044ac98ca81a`.
- `v1.5.1` tag: annotated tag object `936ca0f31d9b6e3c7f0b441e97c23f672f8e1fc5`, peeled commit `fffe50c250d01ee6c42f3f5a0607044ac98ca81a`.
- Production URL: `https://familyos-glavach.vercel.app/`.
- Vercel deployment: Ready, Current, Production for commit `fffe50c250d01ee6c42f3f5a0607044ac98ca81a`; deployment URL `https://familyos-quwjy7nn3-glavach.vercel.app/`.

### Production Smoke
- App load: passed.
- Authentication: passed using existing authenticated production session.
- Pool Test partial save: passed with a CYA-only partial smoke record and no visible save error.
- Quick Add Pool Test open/close: passed.
- Tasks list: passed.
- Shopping module: passed.
- Meal Planning module: passed.
- Life Lists module: passed.
- Mobile 390px horizontal overflow: passed on Home and Tasks.
- Representative 44x44 buttons: passed on desktop, mobile Home, and mobile Tasks.
- Browser console: no production-app warning/error entries captured; an earlier Vercel dashboard console error was excluded as non-app noise.
- User-visible save errors: none observed.

### Deferred
- Calendar OAuth deployed validation and legacy browser fallback removal remain separate follow-up work.
- Deeper form-state architecture and broader legacy UI migration remain future work.

### Recommendation
Released as v1.5.1.

## Release 1.5.0

### Version
1.5.0

### Date
2026-07-06

### Summary
Release 1.5.0 builds the Calendar Platform foundation for Family OS. Calendar now has a dedicated schedule dashboard, clearer Google Calendar connection guidance, grouped event lists, event detail visibility, and Home dashboard schedule awareness. The release focuses on Calendar reliability and OAuth clarity only; Pool recommendation logic, Finance, Health, Home Assistant, AI Assistant, database schema, and Vercel configuration remain unchanged.

### Calendar Platform Improvements
- Added a Calendar schedule summary with Today count, next event, and connection state.
- Added grouped event sections for Today, Tomorrow, This Week, and Upcoming.
- Added event cards with title, date/time, location, source calendar, and owner/family member when available.
- Added an event detail panel showing title, date/time, location, notes/description, attendees, calendar source, status, and last synced metadata when available.
- Added connected, disconnected, setup-needed, permission-needed, loading, empty, and error guidance that keeps non-calendar Family OS workflows usable.
- Added a Reconnect Calendar action on the Calendar screen when a connection already exists.
- Added plain-language copy explaining what Calendar access enables and what happens if connection fails.
- Added Home dashboard awareness for the next calendar event and compact upcoming schedule rows that drill into Calendar.

### Calendar/OAuth Fixes
- Added `APP_BASE_URL` / `REACT_APP_APP_BASE_URL` to the Calendar API allowed-origin list so custom-domain same-origin calls are not rejected when `ALLOWED_ORIGINS` is not separately configured.
- Improved Calendar error mapping for setup/configuration issues, session issues, permission/revocation issues, reconnect-needed states, OAuth origin mismatch, and redirect mismatch.
- Extended server-side and legacy fallback event normalization with frontend-safe detail metadata: start/end, description/notes, attendees, organizer/creator, source calendar, status, and updated time.

### OAuth And Configuration Assumptions
- Google Calendar remains optional. Missing Calendar server secrets or missing `calendar_connections` should show setup guidance and should not block Home, Tasks, Pool, Shopping, Meal Planning, Life Lists, or Settings.
- Server-side Calendar sync still requires the Release 0.8 `calendar_connections` migration plus Supabase service-role, Google OAuth client/secret/redirect, token encryption, state secret, and Google Cloud authorized redirect settings.
- Legacy browser Calendar fallback remains in place until deployed server OAuth validation and family-device smoke testing prove it is safe to remove.

### Database Changes
- None.

### Deferred
- Notifications, reminder engine, automation rules, multi-provider calendar support, Calendar event creation/editing, schema redesign, Home Assistant, AI Assistant, Finance, Health, and Pool recommendation changes remain deferred.

### Validation Status
- `pnpm run lint`: passed.
- `pnpm run build`: passed. CRA emitted the existing Node `fs.F_OK` deprecation warning after a successful compile.
- `git diff --check`: passed with line-ending normalization warnings only.
- Desktop authenticated Calendar smoke: blocked because local Supabase is not reachable at `127.0.0.1:54321`; the app remains on the global auth loading skeleton and logs Supabase auth `Failed to fetch` errors.
- 390px authenticated Calendar smoke: blocked for the same local Supabase connectivity reason.
- Calendar connect/reconnect smoke: blocked for the same local Supabase connectivity reason.
- Home Dashboard Calendar card smoke: blocked for the same local Supabase connectivity reason.
- Error/empty-state smoke: blocked for the same local Supabase connectivity reason.

### Recommendation
Not ready to merge until lint, build, diff-check, desktop authenticated Calendar smoke, 390px authenticated Calendar smoke, and Calendar connection/reconnection behavior all pass.

## Release 1.4.5

### Version
1.4.5

### Date
2026-07-06

### Summary
Release 1.4.5 transforms Pool from a calculator-led surface into a Pool Advisor experience. The Pool module now answers whether the pool is swim-ready, what needs attention, what to do next, why it matters, and when to retest. The release builds on Release 1.4.4 calculation guardrails and does not modify Auth, Google OAuth, Calendar integration, Supabase schema, backend APIs, environment variables, Vercel configuration, or non-Pool modules.

### Pool Advisor Improvements
- Added an advisor dashboard with Water Health Score, Swim Readiness, Last Test, Priority Next Action, Current Chemistry, Recent Chemical, trend indicators, and retest due guidance.
- Added a grouped action plan with Do Today, Retest, This Week, and Monitor sections. Each action keeps what to do, why, timing, safety notes, and expected outcome visible.
- Added a treatment review modal before confirming actionable recommendations. The review shows current chemistry, recommended actions, total chemicals, staged additions, expected outcome, wait time, and retest schedule.
- Expanded lightweight trends for FC, pH, CYA, Salt, TA, and temperature using mobile-safe mini bars and plain text trend labels.
- Improved Pool history with date grouping, record type labels, major-change highlighting, notes, source/context details, and before/after visibility where a later test exists.
- Added equipment and maintenance guidance for pump runtime, due reminders, salt cell inspection, and cleaner/skimmer checks using existing Pool data.
- Added seasonal/contextual guidance for heat, heavy rain, heavy swimmer load, and vacation preparation without adding new integrations or schema.
- Added concise "Why this matters" help copy for FC, CC, pH, TA, CYA, Salt, and CH.
- Improved test entry with required FC/pH fields, optional full chemistry grouping, smart SWG/pump defaults from the latest reading, inline validation, mobile numeric inputs, clear units, and reduced scrolling.

### Safety And Guardrails
- Release 1.4.4 dose calculations, staged stabilizer guidance, large-dose warnings, invalid volume blocking, high-current-value guardrails, and duplicate chlorine suppression remain in `src/modules/pool/actionEngine.js`.
- Release 1.4.5 adds review and explanation around existing recommendations; it does not bypass the action engine or automatically dose chemicals.
- Confirmed recommendations still write only to the existing action audit path and then open the existing treatment or maintenance logging flow for human confirmation.

### Database Changes
- None.

### Deferred
- Calendar, OAuth, notifications, AI Assistant, Home Assistant, automatic dosing, automatic equipment control, live weather/Pentair integrations, new Pool schema, and non-Pool module work remain out of scope.

### Validation Status
- `pnpm run lint`: passed.
- `pnpm run build`: passed. CRA emitted the existing Node `fs.F_OK` deprecation warning after a successful compile.
- `git diff --check`: passed with line-ending normalization warnings only.
- Desktop authenticated Pool smoke: blocked because local Supabase is not reachable at `127.0.0.1:54321`; the app remains on the auth loading skeleton and logs Supabase auth `Failed to fetch` errors.
- 390px authenticated Pool smoke: blocked for the same local Supabase connectivity reason.
- Pool recommendation review, action plan, history, and test entry smoke: blocked by the authenticated app not reaching the Pool module.

### Recommendation
Not ready to merge until lint, build, diff-check, desktop authenticated Pool smoke, and 390px authenticated Pool smoke all pass.

## Release 1.4.4

### Version
1.4.4

### Date
2026-07-06

### Summary
Release 1.4.4 improves Pool recommendation trust, explainability, safety, and mobile usability. The release focuses on chemical calculation guardrails and Pool UX only. It does not modify Auth, Google OAuth, Calendar integration, Supabase schema, backend APIs, environment variables, Vercel configuration, or non-Pool modules.

### Calculation Fixes And Assumptions
- Stabilizer/CYA now uses an explicit pure cyanuric acid basis: 13 oz by weight raises CYA by 10 ppm in 10,000 gallons.
- CYA recommendations stop when current CYA is at or above target and warn instead when CYA is high.
- Large stabilizer additions are staged at 64 oz per step with instructions to circulate and retest before adding more.
- Liquid chlorine, salt, muriatic acid, baking soda, and calcium hardness recommendations now include pool-volume scaling, current/target values, raw dose, rounded dose, and guardrail notes.
- Missing or invalid pool volume blocks chemical dosing recommendations.

### UX Improvements
- Recommendation cards now show action, amount, how to add, expected outcome, warnings, retest timing, safety notes, and expandable "Show calculation" details.
- Pool dashboard now prioritizes swim readiness, current water status, FC/pH/CYA/salt status, trend chips, recent treatment visibility, and next action.
- Pool history is grouped by date with clearer Reading/Chemical/Maintenance scan labels.
- Pool test entry keeps core fields first and collapses advanced context fields to reduce mobile scrolling.

### Validation Scenarios
- CYA 0 to 30: 66 oz calculated total, staged.
- CYA 30 to 70: 88 oz calculated total, staged.
- CYA 40 to 70: 66 oz calculated total, staged.
- CYA at target and above target: no stabilizer addition.
- 456 oz stabilizer would imply roughly a 206 ppm CYA increase in a 17,000 gallon pool and is not presented as a single safe dose; large-dose warnings and staged guidance apply.
- Additional scenario coverage included high/low pH, low/high FC, low/target salt, low/high TA, missing CYA, and missing/invalid pool volume behavior.

### Validation Status
- `pnpm run lint`: passed.
- `pnpm run build`: passed.
- `git diff --check`: passed.
- Desktop and 390px Pool browser smoke: blocked in this workspace because local Supabase is unreachable at `127.0.0.1:54321` and the app remains on the auth loading skeleton.

## Release 1.4.0

### Version
1.4.0

### Date
2026-07-03

### Summary
Release 1.4.0 implements the Pool Care Assistant Foundation as the first Home Platform module. Pool now answers what needs attention, why it matters, what to do next, and when to retest. The release is a decision-support foundation, not an automation or live-integration release.

### Features
- Added a Pool dashboard with overall health, last tested, water temperature, FC, pH, salt, and the next recommended action.
- Added rule-based Pool recommendations with action, amount, timing, retest guidance, explanation, confidence, and safety note.
- Added water test logging for FC, CC, pH, TA, CYA, salt, water temperature, source, weather notes, heavy usage, SWG %, pump runtime, and notes.
- Added treatment history across tests, chemical additions, SWG changes, maintenance, notes, water clarity, weather, and party/heavy-use notes.
- Added Pool equipment tracking for pump, SWG, filter, heater, robot cleaner, Betta skimmer, solar cover, and test kit.
- Added recurring Pool maintenance reminders and completion logging.
- Added Pool Quick Add targets for Pool Test, Chemical Added, Maintenance Completed, and Pool Note.
- Added Pool tests, treatments, maintenance, equipment, and notes to Universal Search.

### Database Changes
- Added `supabase/migrations/20260703010000_release_1_4_pool_care_assistant.sql`.
- Added Pool reading context fields, treatment water clarity, maintenance equipment linkage, schedule metadata, `pool_equipment`, and `pool_action_audits`.
- Added household-aware RLS for Pool readings, treatments, maintenance, reminders, equipment, and action audits so viewers are read-only and owner/adult roles manage Pool operating data.
- Tightened Pool RLS validation findings so maintenance reminders, schedules, and action audits cannot link to another household's equipment or reading rows.

### Deferred
- Pentair live integration, Home Assistant, Weather integration, Taylor digital import, Pool Store import, image upload/OCR, automatic chemical dosing, automatic equipment control, and AI platform behavior remain deferred.

### Validation
- Disposable/local Supabase validation passed for full schema bootstrap, ordered migration chain through `20260703010000_release_1_4_pool_care_assistant.sql`, migration re-run behavior, Pool tables/columns, `pool_equipment`, `pool_action_audits`, indexes, triggers, grants, RLS enablement, and intended policies.
- RLS matrix validation passed for owner/adult Pool writes, viewer read-only behavior, cross-household denial, Pool tests/history/equipment/actions household isolation, linked-record spoofing denial, and confirmed action audit visibility.
- Authenticated browser smoke passed for adult Pool creation flows, temporary owner-role writable UI, temporary viewer-role read-only UI, Home Pool card drill-in, Pool dashboard, Pool Test logging, recommendations, confirmed treatment/history, Chemical Added, Maintenance Completed, Pool Note, equipment add, reminder creation, Quick Add Pool targets, Universal Search results, desktop/tablet/390px mobile no-overflow checks, and clean console logs.
- Action Engine validation passed for high pH, low FC, low salt, stale/no-test, and maintenance-due scenarios with action, explanation, timing, confidence, retest/safety guidance, and no automatic dosing.
- Fixed validation issue where Pool Quick Add used raw Supabase inserts and missed household context.
- Fixed the final Pool validation blocker by making shared row edit/delete actions usable by desktop mouse, keyboard, and swipe/touch. Pool equipment edit now validates end-to-end across desktop and mobile paths.

### Recommendation
Ready to merge after final lint, build, diff-check, and commit complete.

## Release 1.3.2

### Version
1.3.2

### Date
2026-07-03

### Summary
Release 1.3.2 is a Calendar/Product cleanup and Pool Care Assistant planning release. It fixes current Core and Planning UX issues without adding new modules, database schema, Pool runtime surfaces, integrations, Finance, Health, Home platform, or AI behavior.

### Fixes
- Calendar now treats cancelled, denied, incomplete, setup-required, unverified-app, and expired-token connection states as recoverable Calendar states.
- Calendar fallback copy no longer shows the generic "Calendar needs a refresh" message.
- Google Calendar callback cancellation now returns a friendly "not completed" page and leaves Family OS unchanged.
- Home dashboard order is now Today's Priorities, Household Insights, Today's Schedule, My Tasks, then Planning awareness cards.
- Tasks now defaults to All with Due Date sorting and keeps newly created tasks visible in the default view.
- Task filters now show All, My Tasks, Today, Overdue, and More Filters as the primary filter set.
- Task create/edit layout groups Priority + Status, Category + Assignee, and Due Date + Repeat to reduce form scrolling.

### Product Planning
- Added `docs/product/POOL_CARE_ASSISTANT.md` for the future Pool Care Assistant concept.
- Updated product roadmap, module, workflow, planning, and technical-debt docs to keep Pool Care Assistant future-only until a dedicated implementation release.
- Documented Google OAuth test-user and app-verification requirements.

### Database Changes
- None.

### Deferred
- Pool code, Pool UI, Pool tables, Pool migrations, chemical calculators, AI Pool Coach, integrations, photo upload, OCR, Finance, Health, Home platform implementation, and database redesign remain deferred.

## Release 1.3.1

### Version
1.3.1

### Date
2026-07-02

### Summary
Release 1.3.1 is a Planning Platform and Product Owner polish release. It does not add a new product module or database schema. The release tightens cross-module consistency, Calendar action routing, Universal Search scanability, Home drill-down behavior, notification routing, and consumer-facing Calendar language after Life Lists, Shopping, Pantry, and Meal Planning landed.

### Product Owner UX Improvements Completed
- Calendar status in the header now routes to Calendar for setup and connection action instead of generic Settings.
- Calendar now offers direct Connect Google Calendar, Refresh Status, and Check Connection actions on the Calendar screen.
- Home Calendar awareness now summarizes setup/connection needs and drills directly into Calendar.
- Notifications for Calendar attention now open Calendar instead of Settings.
- Universal Search results are grouped by result type, with Pantry separated from Shopping for faster scanning.

### Validation Notes
- Product cleanup validation confirmed Today's Priorities has no "View all" action, each priority row remains individually clickable, the bottom Add navigation remains the primary Quick Add entry, and no generic Priorities page was introduced.
- Browser smoke coverage targeted Home, Tasks, Calendar, Life Lists, Shopping, Pantry, Meal Planning, Quick Add, Universal Search, Notifications, Settings, desktop/tablet/mobile layout, console checks, and horizontal overflow.
- No database migration was added for Release 1.3.1.

### Deferred
- Search result deep-linking to exact row selection remains a future refinement; Release 1.3.1 preserves correct module routing and grouped discovery.
- Full visual unification of legacy deferred modules remains outside this polish release.
- Push/email/SMS notifications, AI, external integrations, barcode/OCR, Finance, Health, Home platform, Pool expansion, and recommendation engines remain deferred.

## Release 1.3.0

### Version
1.3.0

### Date
2026-07-02

### Summary
Release 1.3 adds Meal Planning as the third Planning Platform module. It gives the household recipes, recipe ingredients, weekly meal plans, dated meal assignments, pantry-aware missing ingredient review, Shopping list generation with duplicate prevention, Home awareness, Quick Add, and Universal Search.

### Features
- Added a Meal Planning module under More with Week, Recipes, and Plans views.
- Added personal, household, shared, favorite, and archived meal plans and recipes.
- Added recipe ingredients with quantity, unit, optional state, pantry link, shopping link, notes, and ordering.
- Added meal assignments by date and meal type.
- Added reviewed Shopping integration that can create or merge shopping items only after user confirmation.
- Added pantry awareness for available and missing ingredients.
- Added Recipe, Meal Plan, and Meal Assignment targets to Universal Quick Add.
- Added Recipes, Meal Plans, and Meal Assignments to Universal Search.
- Added compact Home Meal Planning awareness and recent activity entries that drill into Meal Planning.

### Database Changes
- Added `supabase/migrations/20260702030000_release_1_3_meal_planning.sql`.
- Added `meal_plans`, `recipe_categories`, `recipes`, `recipe_ingredients`, and `meal_assignments`.
- Added household-aware RLS for personal, household, and shared meal planning visibility and mutation permissions.

### Deferred
- Nutrition tracking, Health platform integration, AI recommendations, recipe APIs, barcode scanning, OCR, external recipe databases, cost optimization, restaurant integrations, social features, comments, and ratings remain deferred.
- Pantry remains simple availability awareness; no depletion, conversion, substitution, or inventory intelligence was added.

### Validation
- `pnpm run lint` passed.
- `pnpm run build` passed.
- Disposable local Supabase validation passed on July 2, 2026: base schema bootstrap from empty with local auth prelude, ordered migration chain through Release 1.3, Meal Planning migration apply, table/index/constraint catalog checks, grants, RLS enablement, and policies.
- RLS smoke passed for owner, adult, viewer, personal owner-only behavior, household/shared member reads, viewer denial paths, ingredient access through recipes, assignment access through meal plans, archived visible rows, and cross-household denial.
- Authenticated local browser smoke passed for More to Meal Planning, recipe create/edit/favorite/archive/restore, ingredient create/edit path, meal plan create, meal assignment create, Shopping review/generation, duplicate prevention, generated Shopping list/item drill-down, Quick Add recipe/plan/assignment flows, Home drill-downs, Universal Search recipe/assignment results, 390px mobile layout, no horizontal overflow, and no console warnings/errors.
- Product cleanup validation confirmed no floating Quick Add FAB, no Today's Priorities "View All", individually clickable priority/module rows, Quick Add exposes only supported destinations, and consumer-facing copy avoids technical terms.

## Release 1.2.0

### Version
1.2.0

### Date
2026-07-02

### Summary
Release 1.2 adds Shopping & Pantry as the second Planning Platform module. It gives the household shared shopping lists, fast item capture, simple pantry inventory, Home awareness, Quick Add, and Universal Search without adding meal planning, recipes, barcode/OCR, AI, or external grocery integrations.

### Features
- Added a Shopping module under More with list and pantry views.
- Added personal, household, shared, favorite, and archived shopping lists.
- Added shopping items with quantity, unit, category, priority, purchased state, notes, favorite, assignment, pantry link, archive state, sorting, and filtering.
- Added simple pantry inventory with current/minimum quantity, reorder flag, favorite, category, notes, archive state, and filters.
- Added Shopping List and Shopping Item targets to Universal Quick Add.
- Added Shopping Lists, Shopping Items, and Pantry Items to Universal Search.
- Added a compact Home Shopping insight card and recent activity entries that drill into Shopping.
- Prepared database fields for future recipe and meal-plan references without implementing recipes or meal planning.

### Database Changes
- Added `supabase/migrations/20260702020000_release_1_2_shopping.sql`.
- Added `shopping_lists`, `shopping_categories`, `shopping_items`, and `pantry_items`.
- Added household-aware RLS for personal, household, and shared shopping visibility and pantry management.

### Deferred
- Recipes, meal planning, barcode scanning, OCR, AI, external grocery APIs, recommendation engines, finance, health, Home platform, and unrelated modules remain deferred.
- Pantry remains simple inventory only; it does not generate meal plans or recommendations.

### Validation
- `pnpm run lint` passed.
- `pnpm run build` passed.
- Disposable local Supabase validation passed on July 2, 2026: base schema bootstrap from empty with local auth prelude, ordered migration chain through Release 1.2, Shopping migration apply, table/index/constraint catalog checks, grants, RLS enablement, and policies.
- RLS smoke passed for owner, adult, viewer, personal-list owner-only behavior, household/shared member reads, viewer denial paths, pantry read-only viewer behavior, cross-household denial, and archived item visibility.
- Authenticated local browser smoke passed for More to Shopping, list create/edit/favorite/archive/restore, item create/edit/purchase/favorite/archive/assignment/notes, pantry create/edit/favorite/reorder/archive/restore, module search/filter/sort, Quick Add list/item, Home drill-downs, Universal Search list/item/pantry results, adult permissions, viewer read-only controls, 390px mobile layout, no horizontal overflow, and no console warnings/errors.
- Product cleanup validation confirmed no floating Quick Add FAB, no Today's Priorities "View All", clickable priority rows remain supported, Quick Add exposes only supported destinations, and consumer-facing copy avoids technical terms.

## Release 1.1.0

### Version
1.1.0

### Date
2026-07-02

### Summary
Release 1.1 adds Life Lists as the first major lifestyle planning module in Family OS. Life Lists are generic collections for things the family wants to do, watch, read, visit, buy, remember, or plan.

### Features
- Added a generic Life Lists module under More.
- Added list sections for pinned/favorites, recently updated, my lists, and household lists.
- Added item search, status filters, favorite/archive filters, tag filtering, and manual/alphabetical/priority/recent/completed sorting.
- Added quick create/edit flows for lists and items.
- Added item status, priority, favorite, assignment, tags, link, image reference, completion, archive, and sort order fields.
- Added Life List and List Item targets to Universal Quick Add.
- Added Life Lists and Life List Items to Universal Search.
- Added a compact Home Life Lists insight that drills into the module.

### Database Changes
- Added `supabase/migrations/20260702010000_release_1_1_life_lists.sql`.
- Added `life_lists` and `life_list_items`.
- Added household-aware RLS for personal, household, and shared visibility.

### Deferred
- Shopping, meal planning, finance expansion, health, Home platform, AI, recommendation engines, ratings, reviews, external media/book/travel APIs, and image upload storage remain deferred.
- Notification delivery for assigned item, completed item, and shared list update events remains future-ready only.

### Validation
- `pnpm run lint` passed.
- Disposable local Supabase validation passed on July 2, 2026: full schema from empty database, ordered migration chain, Release 1.1 migration re-run, `life_lists`/`life_list_items` tables, indexes, constraints, grants, RLS enablement, and policies.
- RLS smoke passed for owner, adult, viewer, personal-list owner-only behavior, household/shared member reads, viewer denial paths, cross-household denial, and archived item visibility through readable parent lists.
- Authenticated local browser smoke passed for owner/adult/viewer Life Lists workflows, Quick Add list/list-item flows, Home and Universal Search drill-downs, 390px mobile layout, no horizontal overflow, and no console warnings/errors.
- Product cleanup validation removed the floating Quick Add button, removed Today's Priorities "View All", preserved individually clickable priority rows, kept Quick Add to supported destinations only, and avoided consumer-facing technical terms.

## Release 1.0.5

### Version
1.0.5

### Date
2026-07-02

### Summary
Release 1.0.5 is a focused Calendar and header cleanup release. It hardens the Calendar tab so it never fails into a blank screen, simplifies global header actions, and makes Calendar connection states clearer for owners, adults, and viewers.

### Fixes
- Added defensive Calendar rendering for missing calendar props, missing dependency values, malformed event arrays, and disconnected/setup states.
- Added a Calendar tab error boundary with a friendly fallback and Settings path if the Calendar surface cannot render cleanly.
- Added a shared Calendar status model for connected, disconnected, setup required, permission restricted, error, and checking states.
- Replaced header Settings text with an icon-only gear button.
- Replaced header Calendar text/status chips with an icon-only Calendar status button and attention dot only when action is needed.
- Routed Calendar status clicks to Calendar when connected and Settings when disconnected, setup-blocked, permission-restricted, or errored.
- Hid unusable Calendar connect actions when setup is unavailable or the user is not allowed to manage the household connection.
- Updated Settings Calendar copy and controls for owner-managed permissions, Refresh Status, and user-safe setup guidance.
- Kept Home Calendar insight compact and action-oriented without adding persistent dismissal behavior.

### Root Cause
The blank Calendar screen could not be reproduced in the final local session, but the Calendar tab had no local error boundary and assumed well-shaped `calendar`, `events`, and `deps` props. Release 1.0.5 fixes that failure class by normalizing Calendar input, guarding unexpected values, and adding a Calendar-only fallback instead of allowing a render error to blank the tab.

### Calendar Connection Decision
Google Calendar connection remains real when local/staging has the required Google and server setup. When setup is unavailable, Family OS shows setup guidance and disables owner-managed connection controls instead of showing a button that cannot connect.

### Calendar Status Model
- Connected: no attention dot; Calendar icon opens Calendar.
- Disconnected: attention dot; Calendar icon opens Settings.
- Setup required: attention dot; Calendar icon opens Settings with setup guidance.
- Permission restricted: attention dot; Calendar icon opens Settings with reconnect guidance.
- Error: attention dot; Calendar icon opens Settings with friendly troubleshooting.
- Checking: no attention dot; status refresh is in progress.

### Database Changes
- None.

### Deferred
- Persistent Calendar setup dismissal remains deferred until preference storage is explicitly designed for this prompt.
- Full deployed Google Calendar validation and legacy device-calendar fallback removal remain deferred.
- Life Lists, Shopping, Meal Planning, Finance expansion, Health, Home platform, AI, Projects, Microsoft To Do sync, and new integrations remain out of scope.

### Validation
- `pnpm run lint` passed.
- `pnpm run build` passed.
- Browser smoke used local Supabase only and local CRA on `http://localhost:3000`; production was not touched.
- Browser smoke passed for Calendar tab rendering, disconnected Calendar state, Settings Calendar setup state, header desktop/tablet/mobile layout, Calendar icon attention state/click behavior, Search, Notifications, Quick Add, Settings gear, adult permission messaging, and no horizontal overflow.
- Browser console checks showed no warnings or errors during the completed smoke paths.
- Owner invite create/revoke was not rerun in this adult authenticated session; source regression confirmed invitation errors remain mapped through user-safe copy and adult owner-only controls are hidden.

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
- Household invitations require `supabase/migrations/20260702000000_release_0_9_household_collaboration.sql` in each local/staging/production-like environment.

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
