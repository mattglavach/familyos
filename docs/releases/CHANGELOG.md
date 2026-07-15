# Changelog

## Unreleased
- Added a manifest-driven, PowerShell-only blank test-project initializer and read-only verifier aligned to Release 3.2.0 and all 25 production history versions.
- Added fail-closed project-reference, production-target, non-empty database, file completeness, migration-order, secret-output, and prohibited-command safeguards with offline tests.
- Corrected the legacy baseline boundary so Pool profiles, equipment, and action audits are created by their approved migrations with canonical constraints and text-key relationships.
- Reconciled the redundant historical baseline and superseded local-only household draft as history-only versions, leaving one executable `schema.sql` baseline plus 23 approved production migrations.
- Documented the manual Supabase linkage, Auth/Storage setup, partial-failure recovery, separately guarded demo seed, and long-term CLI-native baseline recommendation.
- Added `pnpm run db:test:validate-local`, which creates an isolated loopback-only PostgreSQL cluster, executes the complete blank-database chain and verifier, validates Auth bootstrap behavior transactionally, and removes the disposable environment.
- Executed the Release 3.2 chain successfully on PostgreSQL 18.4 with 23 executable migrations, two history-only entries, 25-version parity, no demo/application data, and no hosted Supabase access.

## 3.2.0 - 2026-07-14
- Added permission-scoped Family Assistant, AI Family Brief, weekly planning, context controls, structured advisory cards, source indicators, and current-session history.
- Added provider abstraction, deterministic mock/fallback, server authentication and household authorization, prompt-injection defenses, timeouts, rate limits, safe observability, and schema validation.
- Added human-reviewed proposed-action handoffs, recommendation feedback/reset, and cross-surface deduplication.
- Added additive AI preference, recommendation, proposed-action audit, and feedback tables with RLS and explicit anonymous denial.
- Added Calendar analysis and reused deterministic Pool calculation/context contracts; AI never invents dosage or changes records automatically.

## 3.1.0 - 2026-07-14

- Added the Relationships module with durable profiles, editable prompts and activity ideas, birthdays, priorities, lifecycle status, quick logging, planned time together, and goals.
- Added transparent Excellent, Good, and Needs Attention health using visible 7-, 14-, and 30-day priority guides without AI scoring.
- Added a compact Home Relationship Focus and weekly relationship summary with at most three deduplicated recommendations.
- Added Relationship events to Household Timeline with domain/audit deduplication and added relationship fields to global search.
- Added an additive, household-scoped, RLS-protected migration for relationship profiles, goals, and activities.
- Explicitly revoked anonymous table privileges while preserving authenticated, household-isolated access.
- Added unit, migration-safety, seeded browser, responsive, dark-mode, Timeline, search, and accessibility coverage.
- Backed up and migrated production, published and tagged `main` as `v3.1.0`, deployed READY on Vercel, and completed desktop/mobile public verification.

## 3.0.0 - 2026-07-14

- Removed the redundant overdue-task instruction from Family Brief recommendation cards.
- Made checklist Habit and Routine summaries expand inline without opening edit details.
- Limited expanded content to directly completable checklist items and retained editing as a separate explicit action.
- Added a sticky, safe-area-aware Habit edit footer so Save and Cancel remain accessible on mobile.
- Removed duplicated dosage guidance from Pool Attention while retaining the full Recommended Next Step workflow.
- Preserved schemas, migrations, dependencies, authentication, permissions, completion history, Pool calculations, and integrations.
- Published `main`, created the `v3.0.0` release tag, deployed to Vercel production, and completed desktop/mobile public production verification.

## 2.10.1 - 2026-07-14

- Simplified the Home greeting and replaced Personalize and AI Brief text actions with shared accessible icon controls.
- Removed confidence, consequence, engine-category, and generic instruction metadata from normal Family Brief cards while retaining prioritization evidence internally.
- Grouped the next three Home Calendar events by Today, Tomorrow, or weekday with chronological deep links and View Calendar.
- Made routine steps a quiet, accessible disclosure with inline completion, preserved derived completion/reopening, and improved default daily ordering.
- Added visible Active, Paused, and Archived lifecycle controls, archive confirmation, status filters, and direct empty states for Habits and Routines.
- Limited Home habit recommendations to relevant unfinished work and excluded completed, paused, archived, and duplicate items.
- Reused the shared icon-action primitive for affected Home and Pool actions and retained 44px touch targets.
- Added concise AI Workspace onboarding, Ask/Plan/Take Action guidance, seven starter prompts, and explicit approval language.
- Added an additive routine lifecycle migration that preserves history, RLS, household scope, and existing archive state.
- Deferred Microsoft To Do synchronization to Release 2.11.0.

## 2.10.0 - 2026-07-13

- Replaced Family Brief Take Action and Completed buttons with compact, keyboard-accessible recommendation card navigation and a centralized resolver that safely handles specific, missing, deleted, and unavailable targets.
- Renamed Upcoming to Upcoming Calendar and retained specific event opening.
- Set mobile navigation to Home, Habits, Calendar, Tasks, and More while preserving one global header Add entry point and every existing Quick Add workflow.
- Matured Habits and Routines with practical categories, household assignment semantics, action-first details, step guidance/order/archive/removal, persistent partial progress, derived completion/reopen behavior, skip and not-applicable states, streak and seven-day context, and calm empty states.
- Added the backward-compatible `20260713010000_release_2_10_core_experience.sql` migration for category and routine-item metadata plus explicit completion statuses; existing habits remain simple habits without user migration.

## 2.9.0 - 2026-07-13

- Added the typed, deterministic Unified Household Context contract with household load, freshness, evidence, missing-data, current, upcoming, and recent-activity sections.
- Added a dedicated, searchable, filterable, bounded Household Timeline that excludes Shopping and deep-links to owning modules.
- Added configurable household location/timezone and cached server-side Open-Meteo current/seven-day forecasts with evidence-backed weather recommendations.
- Added explainable recommendation priority scoring, deterministic Smart Quick Add with confirmation, broader household search, private managed attachments, persisted dashboard personalization, and improved notification reuse.
- Removed Shopping from active navigation and all new v2.9 surfaces while preserving every Shopping record, table, policy, and historical migration.
- Added migration `20260713000000_release_2_9_unified_context.sql` for location, dashboard preferences, durable activity, attachment metadata, a private Storage bucket, RLS/storage policies, and search indexes.

## 2.8.0 - 2026-07-12

- Made the Family Brief the actionable Home intelligence hub with severity-ranked recommendation cards, supporting evidence, direct actions, dismissal, and completion acknowledgement.
- Added a provider registry for Calendar, Tasks, Habits, Pool, Home Maintenance, Garden, Shopping, Life events, and recent accomplishments; future rule-based or AI providers can use the same normalized contract.
- Expanded durable notification categories and reused recommendation output for priority, read, archive, dismiss, and deep-link workflows.
- Added Home Operations for HVAC, appliances, filters, warranties, vehicles, lawn, garden, and projects, including status, maintenance dates, recurrence, notes, attachments, and immutable history foundations.
- Enhanced Shopping with recurring items, store and meal grouping, favorites/frequency foundations, quick add, and inventory flags.
- Added the additive, idempotent `20260712060000_release_2_8_family_intelligence.sql` migration with active-household RLS and no destructive data changes.
- Version note: the attached scope named v2.6.0 after repository v2.7.0 already existed. It is released as v2.8.0 to preserve valid release ordering.

## 2.7.0 - 2026-07-12

- Personalized the Home greeting from the Settings profile name, limited Today’s Focus to three items until expanded, improved maintenance drill-down metadata, moved Upcoming above Status, and added accessible Calendar and Tasks AI Brief shortcuts.
- Updated bottom navigation to Home, Life Lists, Quick Add, Finance, and More while retaining Calendar, Tasks, Habits, and all direct destinations elsewhere in the application.
- Repaired existing habit and routine management so simple habits are editable and checklist actions or ordered routine steps are visibly nested under their parent while configuration changes retain completion history.
- Made synced Google event rows open their provider link safely in a new tab, retained inline details for events without a provider link, and removed syncing account email addresses from event calendar labels.
- Kept Pool Status focused on current conditions, expanded Recommended Next Step inline with direct action logging, aligned responsive history filters, and removed Note as a selectable filter without removing records.
- Preserved existing schemas, RLS, API contracts, calculations, completion history, and authentication. No database migration was required.

## 2.6.1 - 2026-07-12

- Added standalone weekday and calendar-date labels to every Home Upcoming event, including `Tomorrow` context.
- Made checklist habits and routines directly usable from Habits with compact collapsed progress, inline expansion, child completion, quick action creation, and full details/action management.
- Reworked Pool Recommended Next Step into a concise collapsed operational summary with structured expandable guidance.
- Preserved existing habit, routine, Pool calculation, history, navigation, and responsive behavior without a database migration.

## 2.6.0 - 2026-07-12

- Simplified primary navigation to Home, Habits, Calendar, Tasks, and More; moved Pool to More and removed the duplicate floating Quick Add control.
- Consolidated Home priorities into Today’s Focus, included due dates and correct maintenance routing, moved Daily Progress to the bottom, and replaced duplicate status cards with Finance and College summaries.
- Added progressive task and habit filters, dated Calendar week grouping, streamlined Pool and History controls, and reordered Quick Add.
- Added backward-compatible checklist habits with one-level actions, configurable completion thresholds, calculated parent state, daily reset semantics, and retained daily history.
- Added the Release 2.6 migration, regression coverage, versioning, and documentation.

## 2.5.0 - 2026-07-12

- Added member-level Morning Brief, Evening Review, and Weekly Planning schedules with day/time controls, missed-window handling, persisted generation history, manual refresh, and scheduled-period idempotency.
- Expanded the in-app Notification Center with household-scoped read/dismiss state, mark-all-read, category preferences, quiet hours, urgency ordering, source navigation, and restrained navigation counts.
- Added Calendar all-day/timed and recurring-series labels plus overlap and tight-transition intelligence.
- Added a protected eight-template routine library and household template management workflows.
- Added Playwright axe-core accessibility auditing and an additive Release 2.5 migration with explicit ownership and RLS.
- Deferred external notification channels, server-side scheduling, recurrence mutation, predictive consumables, and Financial Planning integration.

## 2.4.0 - 2026-07-12

- Hardened the Release 2.3 Pool maintenance-history migration for production environments where `pool_schedule.id` is UUID rather than text; history keeps a stable textual identifier and the completion RPC compares IDs safely across either schema shape.
- Added Home preparation intelligence and daily progress across Tasks, Habits, Routines, Calendar, and Needs Attention.
- Added three user-initiated AI planning modes backed by structured FamilyOS context.
- Added richer Habit goals, streaks, completion analysis, calendar visualization, and recovery guidance.
- Added Routine progress, history, duplication, template guidance, and recurrence editing.
- Grouped and deduplicated Needs Attention with preparation alerts and task quick completion.
- Expanded universal search to Habits, Routines, and home maintenance.
- Added the additive Release 2.4 smart-planning migration and supporting indexes.

## 2.3.0 - 2026-07-12
- Fixed My Tasks identity resolution across authenticated users, household-member records, reassignment, archived/deleted rows, and active-household boundaries; restored Assigned by Me.
- Fixed Pool Maintenance Done with an idempotent household-authorized transaction that records immutable history and advances the recurring schedule atomically.
- Added durable household-scoped Habits, completion history, period deduplication, streaks, archive preservation, and global creation.
- Added lightweight Routines with ordered steps, optional-step completion rules, recurrence period resets, history, and global creation.
- Replaced More in bottom navigation with Needs Attention while preserving all module access through the Modules surface and Settings header action.
- Simplified Tasks and Home creation controls in favor of the global Add button; capped Today Focus at three items and made AI Brief a compact secondary action.
- Added additive RLS-protected notification-state and pool-maintenance-history foundations plus query indexes.
- Kept Microsoft 365, Outlook, external email, health, wearable, and smart-home integrations deferred.

## 2.2.0 - 2026-07-12
- Redesigned Home as a unified Today dashboard with Morning Brief, Today’s Focus, actionable Needs Attention, Upcoming, quick actions, and compact status cards.
- Added a floating Quick Add control for tasks, calendar events, pool tests, maintenance, shopping items, Life items, and notes.
- Added a Habits module for seven daily habits, today’s completion, and rolling seven-day completion percentage.
- Expanded Tasks with This Week and Someday views plus device-local pinning, while preserving importance, recurrence, quick completion, inline edit drawer, and bulk completion behavior.
- Lazy loaded Habits and retained the existing module-level lazy-loading strategy; no RLS or dependency changes.
- Fixed the Pool Test release blocker by allowing optional weather and appearance fields to persist as `null`; added real authenticated desktop/mobile persistence and refresh regression coverage without changing RLS.
- Scoped device-local habit completion and task pins by authenticated user and removed duplicate Today items across Focus and Needs Attention.
- Added an idempotent corrective migration after production preflight found missing Release 1.7 Pool context columns; test-context, optional-field nullability, existing records, RLS, policies, grants, and ownership are explicitly validated.
- Normalized the legacy Pool optional-field migration filename to `20260712000000_release_2_2_pool_optional_text_nulls.sql` so Supabase orders it deterministically before the `20260712010000` corrective migration; the SQL is byte-for-byte unchanged and production schema, data, RLS, policies, grants, and ownership are unaffected by the history repair.
- Normalized the legacy Release 1.4 Pool migration to `20260703010000_release_1_4_pool_care_assistant.sql`, preserving its SQL byte-for-byte while ordering it after the required Pool audit compatibility bootstrap.

## 2.1.1 - 2026-07-12

- Fixed Pool Test partial saves, zero-value handling, blank normalization, field validation, safe persistence errors, duplicate-submit protection, immediate refresh, and success confirmation.
- Removed Calendar duplication between Today and This Week using local occurrence dates.
- Replaced default expanded Calendar detail layout with compact, accessible inline expansion.
- Condensed Pool Test, chemical addition, and related entry layouts responsively.
- Moved Outlook Calendar integration to future consideration after core stability and maturity.

## 2.1.0 - 2026-07-12

- Added explicit guided acceptance from AI response review into prefilled Tasks, Google Calendar, Pool, Life Lists, and Financial Planning forms.
- Added favorite and recent prompts, selectable recent history, and a compact collapsible prompt preview with contract and privacy metadata.
- Refined Home with an explicit Top Priorities section, useful empty states, configurable card order, optional AI Brief visibility, and a configurable default prompt.
- Improved Context Engine output with deterministic deduplication, priority ordering, and bounded section sizes.
- Improved responsive wrapping, touch-friendly actions, and rendering efficiency across Home and AI Workspace.
- Fixed optional Home weather handling when a household has no settings row.
- Preserved manual confirmation, existing permissions, authentication, schema, and dependencies. No automatic AI write or database migration was added.

## 2.0.0 - 2026-07-12

- Added the deterministic, permission-aware Context Engine and standard module contribution contract.
- Added the provider-neutral Prompt Builder with privacy filtering, module/size/exclusion preview, and version metadata.
- Added AI Workspace under More with suggested questions, prompt preview, Copy Prompt, recent trace metadata, and pasted-response review.
- Added Home AI Brief and device-local AI Settings without API keys or provider authentication.
- Removed the active Pool ChatGPT button and the active Finance retirement brief entry point so prompt generation is centralized.
- Preserved FamilyOS as the system of record with no automatic prompt transmission, AI writes, conversation storage, response storage, migration, or dependency addition.

## 1.8.4 - 2026-07-12

- Consolidated Home attention items into compact Family Snapshot rows and added the persistent Life Lists entry.
- Added optional, cached greeting weather through a server-side Open-Meteo boundary; weather stays hidden without a configured household location.
- Removed Shopping from active navigation, Add, Search, Home, and route exposure without deleting stored data.
- Replaced Assigned by Me with Due as the default Tasks view and corrected household/direct assignment filtering.
- Simplified Calendar to Today and This Week, fixed local multi-day/all-day expansion and exclusive Google end dates, and retained safe source links.
- Corrected Pool Confirm and Log to prefill the shared chemical form before any write, added duplicate-submit protection, and added a reviewed Copy Prompt ChatGPT handoff.
- No schema, authentication, permission, or dependency changes.

## 1.9.0 - 2026-07-12

- Upgraded Universal Search with Ctrl+K/Cmd+K access, partial matching, module grouping, and contextual navigation into Tasks, Calendar, Life Lists, Shopping, Pantry, Pool History, and Settings.
- Expanded dynamic in-app notifications for overdue and due-today tasks, seven-day Calendar events, Pool testing/maintenance attention, and existing household reminders, with unread count, individual read actions, and Clear All.
- Standardized responsive empty states, card/list/table skeletons, friendly error cards, retry actions, offline-aware recovery, and an application-wide error boundary.
- Improved keyboard focus, screen-reader loading announcements, ARIA labeling, and touch-friendly interaction behavior on the changed surfaces.
- Lazy-loaded lower-frequency modules and global overlays, reducing the initial production JavaScript bundle by approximately 25 KB.
- Preserved the compact Home daily brief and its hidden-empty-section behavior without adding modules or widgets.
- No database, migration, dependency, authentication, permission, or business-logic changes.

## 1.8.4 - 2026-07-11

- Moved global creation into a prominent top-bar Add sheet and kept Settings as the far-right icon.
- Replaced bottom Add with Pool while preserving five module destinations.
- Reworked Pool History into compact cards with visible Edit/Delete actions and confirmed deletion; removed History swipe behavior.
- Refined Home into a compact daily brief with three schedule events, up to five attention items, and meaningful non-duplicative snapshot rows.
- Added navigation and Pool History interaction coverage with no schema, dependency, authentication, configuration, or production changes.

- Restored the authoritative legacy Supabase baseline, added fresh-project Pool audit compatibility, and added isolated empty-database migration-chain validation for dedicated non-production environments.

## 1.8.3 - 2026-07-11

- Added a compact Family Snapshot below Needs Attention with meaningful Pool, Retirement, and Home summaries that route to their owning workspaces.
- Removed Calendar's duplicate page-header refresh while retaining connected Calendar status/refresh and pull-to-refresh behavior.
- Consolidated the Pool recommendation into Pool Status and made Water Test Results, Recent Activity, and Trend Charts collapsed by default with saved browser preferences.
- Removed remaining placeholder destinations from More and retained Settings as the household-management surface.
- Changed timed Calendar event formatting from a fixed Eastern timezone to the user's browser-local timezone across Calendar consumers while preserving date-only all-day events.
- Added a shared expandable-section component and tightened touched spacing, typography, and icon sizing.
- No database, migration, authentication, dependency, or architecture changes.

## 1.8.2 - 2026-07-11

- Redesigned Home as a concise daily brief ordered around Upcoming Schedule, Priorities, and non-duplicative Needs Attention items.
- Limited Home schedule, task, and attention lists; added concise due-date language; removed module-summary, Pool, Shopping, and Meal Planning content from Home.
- Converted Tasks filters to a compact default toolbar with Show All, My Tasks, Assigned by Me, and expandable secondary filters that preserve state.
- Consolidated Pool current condition and chemistry into Pool Status, recommendations into one Recommended Next Step, history into Recent Activity, and trends into a collapsed disclosure.
- Standardized shared and Life/Shopping empty states on a compact layout with no reserved decorative space.
- No database, migration, dependency, authentication, permission, integration, deployment, or architecture changes.

## 1.8.1 - 2026-07-11

- Fixed Tasks Show All so it clears search, status, priority, owner, due-date, workspace, and sort state; successful task creation now returns to the unfiltered active household task list immediately.
- Replaced the oversized Tasks filter panel with a compact desktop toolbar and a two-row mobile layout.
- Reduced task rows to title, status checkbox, due date, priority, and optional owner; notes and secondary metadata remain in the task drawer.
- Replaced the healthy Google Calendar connection panel with a compact status row and reduced event rows to time, title, and optional location.
- Increased information density on Dashboard and across shared screen and section spacing without changing navigation, module ownership, Household Context, Calendar timezone behavior, or Pool architecture.
- No database, migration, dependency, environment, remote Git, deployment, tag, or production changes.

## 1.8.0 - 2026-07-11

- Fixed the release-blocking Calendar defect where preserved UTC instants could be rendered using a stale UTC-clock display string. Calendar, event details, Dashboard, Search, Notifications, and Household Context now reformat the provider instant explicitly in `America/New_York`.
- Preserved provider timestamp, timezone, recurring-event, and `originalStartTime` metadata while keeping all-day dates date-only.
- Added `familyos.household-context` 1.0 with timezone, date-only, freshness, availability, aggregation, isolation, and deterministic attention semantics.
- Refocused Dashboard on actionable cross-module attention, Today, Upcoming, Tasks, Calendar, Pool, and Maintenance.
- Updated `familyos.pool-context` to 2.0 with observed trends, chlorine-demand and pH-rise summaries, retest states, maintenance intelligence, completeness flags, and safety constraints.
- Reused the derived attention framework in Notifications and retained household-scoped Global Search with Pool records.
- Preserved human confirmation, acid/chlorine separation, stale/missing-input rules, and no automatic dosing or equipment control.
- No migration, remote Git action, deployment, or production change was performed.

## Unreleased
- Replaced Playwright's implicit demo-email fallback with validated `.env.test.local` configuration, exact Supabase-target checks, and a fresh gitignored authentication state shared by desktop and mobile; added dedicated smoke commands and permanent setup, verification SQL, and troubleshooting documentation.
- Hardened permanent test infrastructure after security review: deterministic demo-household deletion boundaries, exact pre-client Supabase target verification, production compile-time removal and bundle scanning for auto-login, seed-guard unit tests, and Playwright completion/error/empty/loading/dashboard coverage.
- Added permanent development testing infrastructure: guarded `test@familyos.app` reset/seed tooling, localhost-only development auto-login, reusable Playwright diagnostics, authenticated major-module smoke tests, task CRUD/auth/responsive regression coverage, 390px coverage, commands, security controls, and operating documentation.
- Prepared Release 1.7.0 with Calendar America/New_York normalization, More cleanup, Pool profile and operational records, deterministic safety rules, linked Task awareness, and `familyos.pool-context` v1.0.
- Configured the user-level Codex runtime for `approval_policy = "never"`, `sandbox_mode = "danger-full-access"`, and elevated Windows sandboxing; aligned global and FamilyOS instructions around autonomous end-to-end engineering, publication, migration, deployment, recovery, and genuine-blocker-only escalation.
- Consolidated FamilyOS product, architecture, AI, UX, security, delivery, and governance rules into one canonical project-instructions document; added a reusable governance-maintenance prompt; reconciled current navigation with the approved long-term module architecture; and preserved historical release, audit, decision, implementation, and archive records.
- Fixed Calendar event and detail cards exceeding the normal page width by constraining nested grid columns and safely wrapping long event locations, metadata, titles, and notes.
- Clarified Settings Calendar status after successful device OAuth: the active device connection now appears first with its account and sync state, while the optional shared household connection is labeled separately and no longer makes a working device connection look disconnected.
- Implemented Release 1.6 Core Operating Loop Hardening: added app integration contracts for Calendar/Search/Notifications/Quick Add/Home handoffs, best-effort Search/Notification/Home context into Tasks, Calendar, and Life Lists, Tasks Show All/Clear All filter polish, Calendar focus-return status refresh, clearer Calendar refresh copy, and a shared `Button asChild` fix that prevents connected Calendar event links from crashing the screen without schema changes or new modules.
- Completed the July 10, 2026 FamilyOS implementation planning sprint in `docs/planning/IMPLEMENTATION_PLAN_2026_07_10.md`, covering architecture summary, feature inventory, platform service assessment, technical debt, module readiness, Release 1.6-2.0 sequencing, Context Engine roadmap, design-system gaps, and the recommended Release 1.6 scope without app-code or database changes.
- Released v1.5.1 after production closeout: confirmed `main` contains the validated Release 1.5.1 changes, `v1.5.1` peels to final production commit `fffe50c250d01ee6c42f3f5a0607044ac98ca81a`, Vercel production is Ready/Current at `https://familyos-glavach.vercel.app/`, and focused authenticated production smoke passed for Pool Test partial save, Quick Add Pool Test open/close, Tasks, Shopping, Meal Planning, Life Lists, mobile overflow, 44x44 representative buttons, console, and save-error checks.
- Completed Release 1.5.1 production closeout follow-up: corrected the `v1.5.1` tag to the merged release commit and hardened shared Button touch-target sizing so icon-only and compact actions remain at least 44x44 CSS pixels in production.
- Implemented Release 1.5.1 Pool & Quick Add UX Polish: added shared form components for compact sections, number fields, toggles, notes, date/time entry, save/cancel footers, delete buttons, and validation summaries; standardized Pool Test and Quick Add Pool Test field metadata, labels, validation placement, context toggles, and submitting states; and aligned Tasks, Shopping, Meal Planning, and Life Lists drawer forms around the shared controls without database schema changes.
- Fixed post-release Pool Test feedback: Pool module and Quick Add now allow partial Pool Tests without required FC or pH, keep numeric range validation when values are entered, restore Party/Rain context capture using existing Pool reading columns, place CC directly after FC, improve Quick Add drawer close-button safe-area/hit-target behavior, and add regression coverage for partial saves, context persistence, reload history visibility, and drawer close behavior.
- Fixed preview-wide Supabase write failures after post-deploy validation: applied missing Release 0.9, 1.1, 1.2, 1.3, and 1.4 database migrations to the linked FamilyOS Supabase project, repaired remote migration metadata for the date-versioned migration set, aligned Pool action audit `reading_id` with the remote UUID `pool_readings.id`, and stopped sending client-generated `task-*` IDs so task creation can use the database UUID default.
- Fixed Pool Test persistence: Supabase mutation failures now throw instead of creating local-only fake rows, Pool Test save failures remain visible to the user, active Tasks, Life Lists, Shopping, Pool, Quick Add, and Meal Planning mutation paths handle rejected writes defensively, and regression coverage verifies failed inserts do not look saved plus reloaded Pool readings render in Pool history.
- Fixed the Pool Test pH production regression: Quick Add now restores pH as a required Pool Test input, shares the Pool module's FC/pH validation and row-building contract, submits numeric `ph` consistently to `pool_readings`, and adds automated coverage for pH rendering, missing-pH validation, and successful Pool Test creation.
- Implemented Release 1.5.0 Calendar Platform foundation: added a richer Calendar dashboard with connection guidance, schedule summary, Today/Tomorrow/This Week/Upcoming event groups, event details, source/owner/location/attendee/sync metadata, Home next-event and upcoming schedule awareness, safer Calendar/OAuth error messages, and custom-domain API origin handling without database schema changes.
- Implemented Release 1.4.5 Pool Advisor & Experience: upgraded Pool into a decision-oriented advisor dashboard with health/readiness/retest guidance, grouped action plan, treatment review before logging chemicals, richer trend/history/maintenance/context/help surfaces, and faster required-vs-optional test entry while preserving Release 1.4.4 calculation guardrails.
- Implemented Release 1.4.4 Pool Intelligence & UX: audited Pool chemical formulas, added staged stabilizer guidance and large-dose guardrails, expanded recommendation explanations with calculation details, improved swim-readiness/dashboard trends, grouped Pool history by date, and shortened Pool test entry without Auth, OAuth, Calendar, schema, backend, environment, or Vercel changes.
- Fixed the final Release 1.4.0 validation blocker: shared swipe-card row actions now provide visible, focusable Edit/Delete controls plus mouse-drag support while preserving touch swipe behavior; Pool equipment edit validates on desktop mouse, keyboard, and mobile swipe paths.
- Completed Release 1.4.0 Pool Care Assistant validation against disposable/local Supabase only: full schema bootstrap, ordered migration chain, idempotency behavior, Pool catalog checks, owner/adult/viewer/cross-household RLS matrix, action audit spoofing denial, authenticated browser smoke, Quick Add/Search persistence, responsive desktop/tablet/390px checks, clean console logs, and action-engine scenario checks.
- Fixed Release 1.4.0 validation issues: Pool Quick Add now uses household-aware table helpers, Pool compatibility policies are removed from new 1.4 tables, and Pool maintenance/schedule/action audit RLS now blocks linked records from other households.
- Implemented Release 1.4.0 Pool Care Assistant Foundation: new Pool action workspace, rule-based recommendations, water test logging, treatment timeline, equipment inventory, recurring maintenance reminders, Home awareness, Quick Add capture paths, Universal Search results, seed fallback, and Supabase migration for Pool equipment/action audit fields.
- Removed the legacy Pool AI brief surface from the active Pool module. Future AI Pool Coach remains architecture-only and must recommend/explain with confidence and safety notes without performing actions automatically.
- Implemented Release 1.3.2 Calendar/Product cleanup: Calendar cancelled/denied/setup/unverified states are friendly recoverable states, Home order now prioritizes Household Insights before Schedule, Tasks defaults to All with Due Date sorting, and task forms are grouped for less scrolling.
- Added Pool Care Assistant future product planning under the Home Platform roadmap without implementing Pool code, tables, migrations, UI, integrations, or AI behavior.
- Implemented Release 1.3.1 Planning Platform polish: Calendar setup/status actions now stay in Calendar, Home and Notifications drill Calendar attention directly into Calendar, and Universal Search results are grouped by Tasks, Calendar, Life Lists, Shopping, Pantry, Meal Planning, Household, and Navigation.
- Completed Product Owner cleanup checks for Today's Priorities, bottom-nav Quick Add, supported capture destinations, consumer Calendar copy, and no generic Priorities page.
- Implemented Release 1.3 Meal Planning: added meal plans, recipes, recipe categories, recipe ingredients, meal assignments, pantry-aware missing ingredient review, reviewed Shopping list generation with duplicate prevention, Quick Add targets, Home awareness, Universal Search, seed fallback, and household-aware Supabase RLS.
- Completed Release 1.3 validation against local/disposable Supabase only: base schema bootstrap, ordered migration chain through Meal Planning, table/index/constraint/RLS catalog checks, owner/adult/viewer/cross-household RLS matrix, authenticated browser smoke, 390px mobile sanity, console checks, and product cleanup validation.
- Implemented Release 1.2 Shopping & Pantry: added household/shared/personal shopping lists, shopping items, pantry inventory, category/status/filter/sort/favorite/archive workflows, Quick Add targets, Home awareness, Universal Search, seed fallback, and household-aware Supabase RLS.
- Completed Release 1.2 validation against local/disposable Supabase only: base schema bootstrap, ordered migration chain through Shopping, table/index/constraint/RLS catalog checks, owner/adult/viewer/cross-household RLS matrix, authenticated browser smoke, 390px mobile sanity, console checks, and local adult/viewer UI permission checks.
- Completed Release 1.1 validation against disposable/local Supabase only: full schema and migration chain, Life Lists RLS behavior, authenticated browser smoke, 390px mobile sanity, console checks, and product cleanup for Quick Add and Today's Priorities.
- Fixed Release 1.1 validation issues: clean schema ordering for Life Lists migrations, viewer household/shared management denial in RLS and UI, viewer Quick Add writable-list filtering, viewer personal-list creation options, floating Quick Add removal, unsupported Quick Add destination removal, and Today's Priorities "View All" removal.
- Implemented Release 1.1 Life Lists: added generic lists/items with household-aware schema and RLS, More module UI, Home awareness, Universal Quick Add targets, Universal Search results, seed fallback, and release documentation.
- Implemented Release 1.0.5 Calendar & Header Cleanup: hardened Calendar tab rendering, added a shared Calendar status model, simplified header Calendar/Settings actions to icons, improved Calendar setup/permission messaging, and validated responsive header behavior without database or product-module expansion.
- Implemented Release 1.0.4 Consumer Cleanup: tightened Home drill-down affordances, made Tasks default to the Household view so newly created tasks are discoverable, compacted task filters behind More Filters, improved Calendar and invitation consumer messaging, removed Quick Add dead-end actions, and replaced touched destructive browser confirmations with specific app dialogs.
- Improved Core MVP consumer language across Home, Tasks, Calendar, Quick Add, Search, Notifications, Settings, and More without adding deferred modules or changing the database.
- Implemented Release 1.0.3 Design System: added the shadcn-compatible local component wrapper foundation, standardized semantic design tokens, moved common Tasks and Quick Add option sets to chips, and migrated Universal Search to the local Command wrapper without changing search scope.
- Documented the Release 1.0.3 wrapper philosophy, design tokens, future UI expectations, and remaining UI technical debt for deferred modules and native confirmation migration.
- Implemented Release 1.0.2 Reliability: improved Calendar and household invitation configuration handling, removed raw technical errors from key user-facing paths, clarified optional integration behavior, and updated local/staging/production setup documentation.
- Completed remaining Release 1.0.2 authenticated local smoke validation for adult permissions, viewer permissions, mobile 390px sanity, full task create/edit/complete/delete lifecycle, cleanup, and console checks.
- Implemented Release 1.0.1 Core MVP Polish: simplified Home around awareness/drill-downs, reshaped Tasks around one action work surface, added supported recurrence presets, clarified Quick Add future types, grouped More by platform, and added Notification Center lifecycle views.
- Fixed cross-surface table refresh after mutations so Quick Add task creation is reflected in the mounted Tasks surface without requiring a page reload.
- Completed remaining Release 1.0.1 authenticated local browser smoke checks for More, Notifications, Calendar, Quick Add deferred types, Home drill-downs, mobile 390px layout, and console errors.
- Completed Release 1.0 authenticated browser smoke testing against local Supabase only; fixed timestamp/date rendering, Universal Search refresh, notification due-date math, and Settings release/household labels.
- Implemented Release 1.0 core MVP surfaces: product-ordered Home dashboard, first-class Calendar module, Home/Tasks/Calendar/Quick Add/More navigation, global search, in-app notification center, task search, and household-aware Quick Add task creation.
- Established the permanent Product Handbook under `docs/product`, defining Family OS product vision, information architecture, navigation, design principles, UX expectations, dashboard strategy, module map, personas, workflows, feature philosophy, product roadmap, and Release 1.0 alignment.
- Defined the Release 1.0 specification and implementation blueprint, including scope, architecture review, module maturity, UX requirements, deferred work, validation expectations, and prioritized backlog.
- Cleaned up the repository documentation structure for Release 0.9.2 by archiving superseded development docs, consolidating active engineering guidance under `docs/process`, updating stale release status references, and preparing planning docs for Release 1.0.
- Added Release 0.9.1 governance and engineering reference docs for principles, project structure, modules, production readiness, AI engineering, APIs, security, performance, environments, dependencies, ADRs, technical debt, decision logging, roadmap process, and reusable templates.
- Added `eslint` as a direct dev dependency so the existing `pnpm run lint` script works in clean pnpm worktrees.
- Established the Release 0.9.1 permanent engineering framework under `docs/process`, including release, feature, coding, architecture, UI, testing, documentation, git, review, checklist, and prompt playbooks, and updated repository entry points to make the process docs the default source of truth.
- Completed Release 0.9 readiness validation against disposable local Supabase only: full migration chain from empty database, Release 0.9 idempotency re-run, schema/RLS/RPC assertions, browser invite/member smoke tests on `localhost:3002`, and security review. Fixed empty-database migration ordering, local/Supabase `pgcrypto` search-path compatibility, and hidden owner-only controls for adult/viewer users.
- Validated Release 0.9 household collaboration against disposable local Supabase database `familyos_r09_validation`; fixed PostgreSQL 17 migration ambiguity, qualified invitation RPC SQL references, and tightened invitation administration to owner-only.
- Began Release 0.9 household collaboration with a hashed-token `household_invitations` migration, invitation create/preview/accept/decline RPCs, invite-link auth preservation, active household switching, and Settings household member/invite management.
- Integrated Release 0.8C secure calendar events into the dashboard schedule, preferring server-side Google Calendar events when connected, clearly labelling the legacy browser fallback, and stopping new legacy `gc_token` browser persistence.
- Implemented Release 0.8B secure Google Calendar OAuth flow with signed state validation, Google code exchange, AES-GCM token encryption, server-side token refresh, Google revoke/disconnect, and normalized server-side event fetch without exposing token material to the frontend.
- Began Release 0.8 secure Google Calendar foundation with a `calendar_connections` migration, server-side calendar API placeholders, frontend-safe connection hook, Settings connection status UI, and documentation for required OAuth/server env vars.
- Began and completed Release 0.7 runtime integration with active household context, household-aware Supabase table access, Supabase-backed family member management, Settings/Profile persistence, structured task metadata writes, and a documented server-side Google Calendar connection plan.
- Completed Release 0.6C production execution: added the production auth ownership baseline, backfilled existing module rows to the approved owner, applied the household foundation migration, validated RLS/grants/bootstrap/task metadata, and passed transaction-rolled-back app-path smoke tests without changing runtime app or localStorage behavior.
- Added the Release 0.6C production baseline alignment plan for reconciling missing `user_id` ownership columns and public/open policy drift before re-attempting the household foundation migration.
- Attempted the Release 0.6C production migration after target verification and local backup artifact capture; the migration failed safely during preflight because production is missing the expected `user_id` ownership baseline, and follow-up checks confirmed no Release 0.6C foundation tables were left behind.
- Completed Release 0.6C production readiness signoff review without touching production; confirmed backup method, restore/rollback path, migration file, validation SQL scope, post-migration smoke checks, and the owner go/no-go gate, with a recommendation to apply the combined migration as-is after backup capture and explicit approval.
- Ran Release 0.6C app smoke tests against the migrated local Supabase API, fixed missing post-migration auth user bootstrap with an `auth.users` insert trigger, documented passing auth/profile/household/settings/task/module compatibility checks, and added a production readiness checklist without touching production or changing localStorage behavior.
- Validated the revised Release 0.6C household foundation migration against fresh schema-only and staging-like local databases, added authenticated module-table grants required for clean installs, and documented passing idempotency, validation SQL, RLS, and task compatibility checks without production or runtime app changes.
- Executed the Release 0.6C household foundation migration against the disposable local Supabase database, fixed a validated compatibility issue with existing 20260627 local foundation tables, passed the revised migration and idempotency re-run, and documented validation SQL plus RLS smoke-test results.
- Marked the Release 0.6C migration dry run as execution-pending in this workspace because `psql` and the Supabase CLI are unavailable; added exact local/staging commands, a results template, and remaining manual checks to the validation guide.
- Added the Release 0.6C migration validation guide with dry-run setup steps, verification SQL, RLS smoke tests, rollback considerations, and production readiness gates for the household foundation draft.
- Drafted the Release 0.6C production household foundation migration for profiles, households, people, household memberships, settings/preferences, nullable household compatibility fields, structured task metadata, bootstrap/backfill behavior, and foundation-table RLS without changing runtime app behavior.
- Began Release 0.6C data foundation planning with an audit of the current user-owned Supabase schema, the local-only household foundation migration, Release 0.6B localStorage metadata, and the minimal schema direction for households, members, profiles, task metadata, settings/preferences, and future calendar connections.

## Release 0.6B - 2026-07-01
- Added the Release 0.6B Settings/Profile experience with signed-in profile details, household defaults, task defaults, Google Calendar status/actions, local metadata visibility, sign-out, and confirmed local data reset without changing the database schema.
- Hardened the Release 0.6B dashboard, calendar, family, task, and app shell UX with safer malformed-data handling, more responsive action layouts, clearer focus states, labelled task drawer fields, toast live-region semantics, and documentation for mobile QA readiness.
- Implemented the Release 0.6B task management MVP with task dashboard groups, create/edit/complete/reopen/delete/reassign actions, filtering, sorting, validation, loading/empty states, delete confirmation, toast feedback, and temporary local metadata for assignee/status/created/completed fields.
- Improved Release 0.6B family member management on the dashboard with editable member cards, initials/colors/roles/statuses, local add/edit/deactivate/remove flows, schedule assignment filters, and defensive local-save error handling without changing the database schema.
- Improved Release 0.6B Google Calendar integration with explicit dashboard sync states for disconnected, connecting, syncing, synced, empty, expired-token, permission, and API error cases; added today/upcoming event grouping, source labels, and last-sync visibility while preserving the browser popup OAuth flow.
- Began Release 0.6B with a dashboard layout milestone that migrates the Home command center to shared cards, badges, buttons, skeletons, empty states, Lucide icons, and clearer calendar error/loading states while preserving existing data sources and navigation.
- Migrated PoolBrief and RetirementBrief UI to shared AI brief panel helpers while preserving AI prompts, history, refresh, copy, and follow-up behavior.
- Migrated app header, bottom navigation, and global loading wrapper to shared UI primitives/classes while preserving routing and auth/calendar actions.
- Migrated AuthGate and SetupRequired to shared card, form, button, input, section header, and status badge primitives while preserving auth behavior.
- Migrated QuickAdd UI to the shared drawer, form primitives, segmented controls, chips, and Lucide icons while preserving existing save behavior.
- Added Phase 1 UI migration primitives for forms, segmented controls, chips, section headers, empty states, and status badges without changing feature screen behavior.
- Made email/password the primary Supabase login path for the private household app while keeping magic links as a fallback.
- Refactored the React app into a modular source structure with src/app, src/modules, src/hooks, and src/utils while preserving current behavior.
- Added resend cooldown and friendly rate-limit messaging to Supabase email magic-link sign-in.
- Documented Google Calendar OAuth origin setup for localhost, Vercel production, custom domains, and preview deployments.
- Added a clearer Google Calendar `origin_mismatch` diagnostic that reports the current app origin to add in Google Cloud Console.
- Clarified Supabase magic-link redirect configuration and kept email sign-in redirects tied to the current app origin.
- Fixed Vercel production build failure by clearing CRA ESLint warnings that are treated as errors in CI.

## 0.1.0 - Documentation Foundation
- Added Family OS operating manual.
- Added AI agent instructions.
- Added planning, architecture, database, UI, module, and release documentation.
- Added Platform architecture documentation for shared entities, task engine, notifications, AI context, API contracts, and Command Center.
- Added Tailwind CSS, shadcn/ui configuration, Lucide icons, Recharts dependency, and Origin UI-style drawer primitives for frontend feature work.
- Expanded the UI design system and added a prioritized UI migration backlog based on the current `src/App.js` inline-style hotspots.
