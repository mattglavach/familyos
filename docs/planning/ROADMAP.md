# Roadmap

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
- [ ] Pool
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
- [x] Release 1.0 planning with `docs/templates/RELEASE_SPEC.md`.
- [x] Implement Release 1.0 from `docs/planning/RELEASE_1_0_SPEC.md`.
- [x] Complete Release 1.0 authenticated local/staging smoke validation.
- [x] Implement Release 1.0.1 Core MVP Polish for Home, Tasks, Quick Add, More, Notifications, and documentation.
- [x] Implement Release 1.0.2 Reliability for configuration handling, friendly errors, optional integration setup, and production-readiness documentation.
- [x] Implement Release 1.0.3 Design System for shared UI wrappers, tokens, command search, and common form control consistency.
- [x] Implement Release 1.0.4 Consumer Cleanup for task discoverability, compact filters, consumer language, confirmation dialogs, and Core MVP usability.
- [x] Implement Release 1.0.5 Calendar & Header Cleanup for Calendar tab resilience, icon-only header actions, and Calendar status clarity.
- [x] Implement Release 1.1 Life Lists with generic lists/items, Home insight, Quick Add, Search, and RLS-backed schema.

## Release 1.1 Scope
- [x] Add generic Life Lists and Life List Items data model.
- [x] Add Life Lists module under More.
- [x] Add quick create/edit, status, priority, favorites, archive, tags, link, assignment, and sorting/filtering workflows.
- [x] Add Life Lists targets to Universal Quick Add.
- [x] Add lists and list items to Universal Search.
- [x] Add compact Home Life Lists awareness with drill-down.
- [ ] Validate migration/RLS against disposable or staging Supabase before production.
- [ ] Keep shopping, meal planning, finance expansion, health, Home platform, AI, recommendation engines, ratings, reviews, and external enrichment APIs deferred.

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
