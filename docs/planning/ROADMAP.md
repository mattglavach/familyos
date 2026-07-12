# Roadmap

## Future consideration after core stability

- Reconsider Outlook Calendar and other Microsoft 365 integrations only after the core application is stable and mature. These integrations are not a committed near-term release, current dependency, core architecture requirement, or blocker for Calendar improvements.

## Release 2.1.0: Guided Workflows & Product Polish
- [x] Convert reviewed AI suggestions into prefilled existing forms for Tasks, Calendar, Pool, Life Lists, and Financial Planning.
- [x] Add favorite/recent prompts and progressive-disclosure prompt metadata.
- [x] Refine Home around Top Priorities, meaningful empty states, and device-local personalization.
- [x] Deduplicate and prioritize Context Engine output.
- [x] Improve Home and AI Workspace performance, accessibility, and mobile behavior without schema, auth, permission, or dependency changes.

Next: validate the guided workflows with household usage before expanding suggestion parsing or adding any provider integration.

## Release 2.0.0: Context Engine and AI Workspace
- [x] Add deterministic module context contributors and normalized aggregation.
- [x] Add privacy-aware provider-neutral prompt construction and preview metadata.
- [x] Add a centralized, copy-first AI Workspace and response review.
- [x] Add Home AI Brief and device-local AI controls.
- [x] Preserve explicit human review and prohibit automatic AI writes.

Completed in Release 2.1.0: explicit owning-module acceptance handoffs. Optional provider integrations remain deferred.

## Release 1.8.4: Core Workflow Stabilization
- [x] Consolidate Home attention into Family Snapshot, add Life Lists, and provide optional greeting weather.
- [x] Remove Shopping from the active product while preserving stored data.
- [x] Make Due the first Tasks view and correct My Tasks assignment semantics.
- [x] Simplify Calendar to Today and This Week and correct multi-day event behavior.
- [x] Complete Pool Confirm and Log and add a reviewed, copy-only ChatGPT handoff.

## Next Product Direction

Validate Release 2.1.0 with real household workflows. Preserve human review, household permissions, privacy filtering, traceable context, and FamilyOS ownership of accepted records. Gardening Operations and broader Financial Planning remain separately scoped candidates.

## Release 1.8.0: Household Context, Dashboard Intelligence, and Pool Optimization
- [x] Implement the versioned Household Context Service and deterministic cross-module attention framework.
- [x] Refocus Dashboard on household attention, today, upcoming, Tasks, Calendar, Pool, and maintenance.
- [x] Expand Pool observed trends, chlorine-demand and pH-rise summaries, retest workflow, maintenance status, data gaps, timeline, and context contract.
- [x] Preserve household-scoped Global Search after core scope remained stable.
- [x] Stabilize responsive card grids, wrapping, and overflow behavior using the existing mobile-first system.
- [ ] Complete authenticated desktop/mobile smoke in an approved non-production environment.

The previously proposed 1.9 scopes are superseded. Release 2.0.0 is next.

## Release 1.7.0: Stabilization and Pool Operations
- [x] Normalize Calendar events to `America/New_York` while preserving provider timestamps and all-day dates.
- [x] Remove Household and Health from More.
- [x] Add Pool profile, richer operations records, deterministic safety rules, linked Tasks context, and a versioned ChatGPT context contract.
- [ ] Apply the migration and complete authenticated desktop/mobile smoke after approval.

Next is Pool optimization and trend refinement. The following release is Gardening Operations. Later releases are Financial Planning, Cross-module Context Engine, and family-level AI orchestration. Broad Home asset management remains excluded.

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
- [x] Pool
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
- [x] Life Lists
- [x] Shopping & Pantry
- [x] Meal Planning

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
- [x] Establish governance, production readiness, environment, security, dependency, ADR, planning, and reusable specification templates.
- [x] Clean up repository documentation structure after Release 0.9.1.
- [x] Use the Release 0.9.1/0.9.2 process framework for Release 1.0 planning.
- [ ] Revisit process docs after two releases and refine based on actual execution gaps.

## Product Handbook Track
- [x] Establish permanent Product Handbook for vision, IA, navigation, design principles, UX, dashboard, modules, personas, workflows, feature philosophy, and product roadmap.
- [x] Use Product Handbook and Engineering Handbook together for Release 1.0 implementation planning.

## Next Release
- [x] Complete July 10, 2026 implementation planning sprint in `docs/planning/IMPLEMENTATION_PLAN_2026_07_10.md`.
- [x] Execute Release 1.6 Core Operating Loop Hardening: app-level contracts for Calendar, Search, Notifications, Quick Add, and Home handoffs, lightweight handoff payloads for Search/Notifications/Home, Tasks filter reset polish, Calendar refresh/status clarity, and documented legacy browser Calendar fallback readiness.
- [x] Release 1.0 planning with `docs/templates/RELEASE_SPEC.md`.
- [x] Implement Release 1.0 from `docs/planning/RELEASE_1_0_SPEC.md`.
- [x] Complete Release 1.0 authenticated local/staging smoke validation.
- [x] Implement Release 1.0.1 Core MVP Polish for Home, Tasks, Quick Add, More, Notifications, and documentation.
- [x] Implement Release 1.0.2 Reliability for configuration handling, friendly errors, optional integration setup, and production-readiness documentation.
- [x] Implement Release 1.0.3 Design System for shared UI wrappers, tokens, command search, and common form control consistency.
- [x] Implement Release 1.0.4 Consumer Cleanup for task discoverability, compact filters, consumer language, confirmation dialogs, and Core MVP usability.
- [x] Implement Release 1.0.5 Calendar & Header Cleanup for Calendar tab resilience, icon-only header actions, and Calendar status clarity.
- [x] Implement Release 1.1 Life Lists with generic lists/items, Home insight, Quick Add, Search, and RLS-backed schema.
- [x] Implement Release 1.2 Shopping & Pantry with shared shopping lists/items, simple pantry inventory, Home insight, Quick Add, Search, and RLS-backed schema.
- [x] Implement Release 1.3 Meal Planning with recipes, meal plans, meal assignments, pantry-aware Shopping review, Home insight, Quick Add, Search, and RLS-backed schema.
- [x] Implement Release 1.3.1 Planning Platform polish for Calendar routing, Home awareness, grouped Search, Product Owner cleanup decisions, and validation documentation.
- [x] Implement Release 1.3.2 Calendar/Product Cleanup plus Pool Care Assistant planning without adding Pool code, schema, or UI.
- [x] Implement Release 1.4.0 Pool Care Assistant Foundation with rule-based recommendations, treatment history, equipment, maintenance, Home awareness, Quick Add, Search, and Pool schema foundations.
- [x] Implement Release 1.4.4 Pool Intelligence & UX with chemical calculation guardrails, staged stabilizer guidance, explainable recommendations, dashboard polish, grouped history, and shorter test entry.
- [x] Implement Release 1.4.5 Pool Advisor & Experience with advisor dashboard, grouped action plan, treatment review, trend visibility, history usability, test-entry improvements, maintenance awareness, contextual guidance, and help copy.
- [x] Implement Release 1.5.0 Calendar Platform with schedule dashboard, grouped event list, event details, connection/reconnect guidance, OAuth error clarity, and Home schedule awareness.

## Release 1.5.0 Scope
- [x] Review existing Calendar/OAuth implementation and documented deferrals from prior releases.
- [x] Improve Calendar/OAuth reliability for same-origin custom domains, setup errors, permission/reconnect states, and frontend-safe event metadata.
- [x] Add Calendar dashboard summary for today's events, next event, connection state, and last sync.
- [x] Add grouped event list sections for Today, Tomorrow, This Week, and Upcoming.
- [x] Add Calendar event detail visibility for title, date/time, location, notes, attendees, source, status, and last synced metadata.
- [x] Add Calendar connection UX with connected/disconnected/setup/permission/error states, Connect/Reconnect actions, and safe fallback copy.
- [x] Add Home dashboard Calendar awareness for next event and upcoming schedule rows with direct Calendar navigation.
- [x] Keep Pool recommendation logic, Finance, Health, Home Assistant, AI Assistant, database schema, and Vercel configuration unchanged.
- [ ] Complete lint, build, diff-check, desktop authenticated Calendar smoke, 390px authenticated Calendar smoke, Calendar connect/reconnect smoke, Home Calendar card smoke, and error/empty-state smoke before merge readiness.

## Release 1.6 Scope
- [x] Add `docs/platform/08_integration_contracts.md` for Calendar, Search, Notifications, Quick Add, Home, and module navigation handoffs.
- [x] Keep Home as an awareness surface while allowing task rows to open Tasks with useful filter/search context.
- [x] Let Search and Notifications pass best-effort destination context for Tasks, Calendar events, and Life Lists without adding URL routing.
- [x] Add Tasks Show All wording and Clear All filter reset.
- [x] Refresh server Calendar connection status on window focus/visibility return and clarify Calendar refresh button copy.
- [x] Document that legacy browser Calendar fallback remains isolated until deployed server OAuth connect/reconnect/disconnect/event-refresh smoke passes.
- [x] Keep Home Platform, Financial Planning, Context Engine runtime, durable notification schema, URL routing, and Calendar event creation/editing deferred.

## Release 1.4.5 Scope
- [x] Transform Pool dashboard into a decision screen for swim readiness, health, last test, priority next action, chemistry status, recent chemical additions, trends, and retest guidance.
- [x] Convert recommendations into grouped Do Today, Retest, This Week, and Monitor action-plan sections.
- [x] Add treatment plan review before confirming chemical or equipment recommendations.
- [x] Improve lightweight trends for FC, pH, CYA, Salt, TA, and temperature.
- [x] Improve Pool history scanability with date groups, record types, notes, major-change highlighting, and before/after visibility where available.
- [x] Improve test entry with required FC/pH fields, optional full chemistry, smart defaults, inline validation, and clear units.
- [x] Add lightweight equipment, maintenance, seasonal/contextual, and why-it-matters guidance using existing Pool data.
- [x] Preserve Release 1.4.4 calculation guardrails and avoid Auth, Google OAuth, Calendar, Supabase schema, backend API, environment, Vercel, and non-Pool module changes.
- [ ] Complete lint, build, diff-check, desktop authenticated Pool smoke, and 390px authenticated Pool smoke before merge readiness.

## Release 1.4.4 Scope
- [x] Audit stabilizer/CYA, liquid chlorine, salt, muriatic acid, baking soda/alkalinity, and calcium hardness dose formulas.
- [x] Add large-dose, missing-volume, invalid-reading, high-current-value, and duplicate-recommendation guardrails.
- [x] Add expandable calculation details to recommendation cards.
- [x] Improve Pool dashboard swim-readiness, status, trends, recent treatment, and next-action visibility.
- [x] Improve Pool test entry, history scanability, copy, and mobile density.
- [x] Document validation scenarios and the 456 oz stabilizer analysis.
- [ ] Complete desktop Pool smoke and 390px Pool smoke before merge readiness.
- [x] Keep Auth, Google OAuth, Calendar, Supabase schema, backend APIs, environment variables, Vercel configuration, and non-Pool modules unchanged.

## Release 1.4.0 Scope
- [x] Add Pool Dashboard with overall health, latest readings, and next recommended action.
- [x] Add water test logging for FC, CC, pH, TA, CYA, salt, temperature, source, SWG, pump runtime, weather notes, heavy usage, and notes.
- [x] Add configurable rule-based Action Engine with amount, timing, retest guidance, explanation, confidence, and safety note.
- [x] Add treatment history timeline for readings, chemicals, SWG changes, maintenance, weather/party notes, and water clarity.
- [x] Add equipment inventory for pump, SWG, filter, heater, robot cleaner, Betta skimmer, solar cover, and test kit.
- [x] Add recurring maintenance reminders for filter, SWG, pump, robot, Betta, reagents, season opening, and season closing.
- [x] Add Pool Quick Add targets and Universal Search results.
- [x] Add Pool equipment/action audit database foundation.
- [x] Validate migration/RLS against disposable or local Supabase before production.
- [x] Complete browser smoke across desktop, tablet, and 390px mobile.
- [x] Keep Pentair live integration, Home Assistant, AI platform, automatic dosing, automatic equipment control, Finance, and Health deferred.
- [x] Resolve the desktop swipe-card row edit risk found during Pool equipment smoke.

## Release 1.3.2 Scope
- [x] Treat Calendar disconnected, setup-required, cancelled, permission-denied, unverified-app, and expired-token states as normal recoverable states.
- [x] Keep Calendar header action routed to Calendar and keep Connect Google Calendar trustworthy.
- [x] Reorder Home to Today's Priorities, Household Insights, Today's Schedule, My Tasks, then planning awareness cards.
- [x] Make Tasks default to All with Due Date sorting and keep secondary filters behind More Filters.
- [x] Tighten frequent task form grouping without changing the task schema.
- [x] Document Pool Care Assistant as a future Home Platform flagship submodule.
- [x] Keep Pool module code, Pool tables, Pool migrations, Finance, Health, AI, Home platform implementation, integrations, and database redesign deferred.

## Release 1.3.1 Scope
- [x] Keep Home as awareness and preserve direct drill-down rows without a generic Priorities page.
- [x] Keep Tasks compact with Search, My Tasks, Household, Today, Overdue, and More Filters while preserving discoverability for newly created household tasks.
- [x] Route Calendar header/status/setup actions to Calendar, with direct Connect Google Calendar, Refresh Status, and Check Connection actions.
- [x] Group Universal Search results by surface and keep Quick Add destinations limited to supported workflows.
- [x] Keep Finance, Health, Pool expansion, Home platform, AI, barcode/OCR, external APIs, recommendation engines, and database redesign deferred.

## Release 1.3 Scope
- [x] Add Meal Plans, Recipes, Recipe Categories, Recipe Ingredients, and Meal Assignments data model.
- [x] Add Meal Planning module under More.
- [x] Add recipe create/edit/favorite/archive/restore, ingredient, plan, assignment, sorting/filtering/search, and week workflows.
- [x] Add reviewed Shopping List generation, missing ingredient selection, existing list merge, and duplicate prevention.
- [x] Add simple pantry awareness for available and missing ingredients.
- [x] Add Recipe, Meal Plan, and Meal Assignment targets to Universal Quick Add.
- [x] Add Recipes, Meal Plans, and Meal Assignments to Universal Search.
- [x] Add compact Home Meal Planning awareness with drill-down.
- [x] Validate migration/RLS against disposable or local Supabase before production.
- [x] Keep nutrition tracking, Health platform integration, AI recommendations, recipe APIs, barcode/OCR, external recipe databases, cost optimization, restaurant integrations, social features, comments, and ratings deferred.

## Release 1.2 Scope
- [x] Add Shopping Lists, Shopping Items, Shopping Categories, and Pantry Items data model.
- [x] Add Shopping module under More.
- [x] Add quick create/edit, purchased status, priority, favorites, archive, assignment, pantry link, and sorting/filtering workflows.
- [x] Add simple pantry inventory with current/minimum quantity and reorder flag.
- [x] Add Shopping List and Shopping Item targets to Universal Quick Add.
- [x] Add Shopping Lists, Shopping Items, and Pantry Items to Universal Search.
- [x] Add compact Home Shopping awareness with drill-down.
- [x] Validate migration/RLS against disposable or local Supabase before production.
- [x] Keep recipes, meal planning, barcode scanning, OCR, AI, external grocery APIs, recommendation engines, finance, health, Home platform, and unrelated modules deferred.

## Release 1.1 Scope
- [x] Add generic Life Lists and Life List Items data model.
- [x] Add Life Lists module under More.
- [x] Add quick create/edit, status, priority, favorites, archive, tags, link, assignment, and sorting/filtering workflows.
- [x] Add Life Lists targets to Universal Quick Add.
- [x] Add lists and list items to Universal Search.
- [x] Add compact Home Life Lists awareness with drill-down.
- [x] Validate migration/RLS against disposable or staging Supabase before production.
- [x] Keep shopping, meal planning, finance expansion, health, Home platform, AI, recommendation engines, ratings, reviews, and external enrichment APIs deferred.

## Release 1.0 Scope
- [x] Stabilize the dashboard daily command center.
- [x] Stabilize household task workflows.
- [x] Add first-class Calendar module.
- [x] Add Universal Quick Add launch.
- [x] Add Universal Search.
- [x] Add in-app Notifications framework.
- [x] Polish navigation and responsive layouts for active modules.
- [x] Harden Settings and household management workflows through authenticated browser smoke validation.
- [ ] Revalidate household collaboration, active household switching, and permission enforcement.
- [ ] Keep shopping, life lists, meal planning, recipes, inventory, Home Assistant, smart home, AI Assistant, ownership transfer, public sign-up, and major new integrations deferred.

## Release 1.0.1 Scope
- [x] Keep Home focused on awareness and module drill-downs.
- [x] Make Tasks an action-oriented work surface with quick creation, search, filters, sorting, assignment, completion, and editing.
- [x] Add simple task recurrence presets using the existing interval-days model.
- [x] Keep Quick Add lightweight and clearly mark unsupported future capture types as later.
- [x] Group More by Household, Home, Health, Finance, Planning, and Settings.
- [x] Add Notification Center lifecycle views for Unread, Today, This Week, and Archive.
- [ ] Keep Life Lists, Shopping, Meal Planning, Finance expansion, Health, Smart Home, AI, Projects, full Maintenance, and full Pool expansion deferred.

## Release 1.0.3 Scope
- [x] Establish `src/components/ui` as the wrapper layer for future UI primitives.
- [x] Document shadcn/ui-compatible local configuration in `components.json`.
- [x] Standardize design tokens for semantic color, radius, elevation, focus, and motion.
- [x] Use chip controls for frequent small option sets in Tasks and Quick Add.
- [x] Use the local Command wrapper for Universal Search.
- [ ] Continue migrating deferred module UI debt only when those modules become active release scope.

## Release 1.0.4 Scope
- [x] Keep Home as awareness while improving View All and drill-down clarity.
- [x] Make tasks created from Quick Add immediately discoverable in Tasks.
- [x] Compact default Tasks filters and move secondary filters behind More Filters.
- [x] Limit Quick Add enabled destinations to supported workflows.
- [x] Replace technical Calendar and invitation wording with consumer-safe language.
- [x] Improve Search, Notifications, Settings, More, and touched empty/success/destructive states.
- [ ] Keep Life Lists, Shopping, Meal Planning, Finance expansion, Health, Home platform, AI, Projects, integrations, and schema changes deferred.

## Release 1.0.5 Scope
- [x] Harden Calendar tab rendering against blank-screen failures.
- [x] Standardize Calendar connected, disconnected, setup required, permission restricted, error, and checking states.
- [x] Simplify global header Calendar and Settings actions to icon controls with accessible labels.
- [x] Clarify Calendar setup/connect behavior for owners and non-owners.
- [x] Validate desktop, tablet, and 390px mobile header/Calendar layouts.
- [ ] Keep Life Lists, Shopping, Meal Planning, Finance expansion, Health, Home platform, AI, Projects, Microsoft To Do sync, integrations, database redesign, and schema changes deferred.
