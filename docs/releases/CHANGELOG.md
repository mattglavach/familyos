# Changelog

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
