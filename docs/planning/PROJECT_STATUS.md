# Project Status

Release 1.7.0 is a local release candidate covering Calendar timezone stabilization, More cleanup, and the Pool Operations foundation. No production data, deployment, push, merge, tag, or release action has been performed.

## Current Version
Release 1.7.0 local release candidate; production actions awaiting approval

## Current State
Permanent automated development testing infrastructure is implemented locally. It includes a guarded demo-account reset/seed command, five-person representative dataset, localhost development auto-login, Playwright diagnostics, major-module smoke coverage, and reusable regression tests. Environment-dependent execution remains pending because the current ignored local environment does not contain a Supabase service-role key or demo password.

Codex autonomy configuration and FamilyOS governance are aligned for complete scoped implementation and release execution. High-impact work retains target verification, recoverability, bounded scope, and post-change validation without routine approval checkpoints.

FamilyOS now has one canonical cross-domain governance source at `docs/governance/FamilyOS_Project_Instructions.md` plus a reusable maintenance prompt. Active product and navigation guidance distinguishes the implemented Home, Tasks, Calendar, Quick Add, and More shell from the approved long-term Dashboard, Calendar, Tasks, Life, Home, and Financial Planning architecture. Historical records remain preserved.

Post-release Calendar layout hardening constrains event and detail content to the app-shell width and safely wraps long provider text without changing Calendar data or behavior.

Release 1.0 core MVP through Release 1.5.1 Pool & Quick Add UX Polish are complete. Release 1.6 Core Operating Loop Hardening is validated for merge with app integration contracts, lightweight cross-surface handoff context, Tasks filter reset polish, Calendar refresh/status clarity, and corrected Settings hierarchy for device versus shared Calendar connections. Deployed RC1 smoke passed on the stable branch origin for authenticated Home, Tasks, Calendar, Search, Notifications, responsive layout, clean browser console, Google device OAuth, event loading, and the updated Settings connection state. Show All/Clear All could not be exercised with real task data because the validation account had zero tasks; this remains a documented post-deploy check rather than a merge blocker. Release 1.5.1 was merged to `main`, tagged, deployed to production, and production-smoke validated after the post-merge shared Button touch-target hardening commit. The July 10, 2026 implementation planning sprint is documented in `docs/planning/IMPLEMENTATION_PLAN_2026_07_10.md`.

## Completed
- Permanent FamilyOS demo seed and Playwright testing framework implementation
- Canonical FamilyOS project-instructions consolidation with subordinate active references and preserved historical documentation
- Family OS v1 documentation workspace
- Platform architecture documentation
- Frontend standard foundation for Tailwind CSS, shadcn/ui primitives, Lucide icons, Recharts, and Origin UI-style drawer usage
- Vercel-style production build validation with `CI=true`
- Supabase magic-link redirect audit for deployed Vercel sign-in
- Supabase magic-link resend cooldown and rate-limit messaging
- Private household email/password login as the primary Supabase auth path
- Google Calendar OAuth origin setup documentation for local and Vercel deployments
- Modular app structure with app shell, hooks, modules, and refactor documentation
- Release 0.6B Milestone 1 dashboard layout pass
- Release 0.6B Milestone 2 Google Calendar integration pass
- Release 0.6B Milestone 3 family member management pass
- Release 0.6B Milestone 4 task management MVP
- Release 0.6B Milestone 5 UX hardening pass
- Release 0.6B Milestone 6 settings/profile pass
- Release 0.6B Milestone 7 stability and release candidate pass
- Release 0.6C Milestone 1 data model audit and migration plan
- Release 0.6C Milestone 2 production household foundation migration draft
- Release 0.6C Milestone 3 migration dry-run preparation and validation plan
- Release 0.6C Milestone 4 dry-run execution-pending update with exact local/staging commands
- Release 0.6C Milestone 5 local household foundation migration dry run, revision, validation SQL, and RLS smoke tests
- Release 0.6C Milestone 6 fresh schema-only and staging-like migration validation, idempotency checks, RLS smoke tests, and task compatibility checks
- Release 0.6C Milestone 7 migrated-local app smoke tests, post-migration auth user bootstrap trigger, and production readiness checklist
- Release 0.6C Milestone 8 production readiness signoff review and recommendation to apply the combined migration as-is after backup capture and owner approval
- Release 0.6C production attempt 1 target verification, backup artifact capture, failed preflight, and baseline drift diagnosis
- Release 0.6C production baseline alignment plan for missing `user_id` ownership and public/open policy drift
- Release 0.6C production auth ownership baseline migration with approved owner backfill
- Release 0.6C production household foundation migration
- Release 0.6C production validation SQL, grants validation, RLS checks, and app-path smoke tests
- Release 0.7 active household runtime context
- Release 0.7 household-aware Supabase table access
- Release 0.7 Supabase-backed family members, settings/profile defaults, and task metadata
- Release 0.7 Google Calendar server-side storage assessment
- Release 0.8 `calendar_connections` migration and API foundation
- Release 0.8 Settings UI for server-side Google Calendar connection status
- Release 0.8 signed Google OAuth callback exchange
- Release 0.8 encrypted server-side Google token persistence, refresh, revoke, and normalized event fetch
- Release 0.8 dashboard integration for server-side Google Calendar events
- Release 0.8 legacy browser calendar fallback labelling and no new `gc_token` persistence
- Release 0.9 secure household invitation migration with hashed invite tokens and RPC accept/decline flows
- Release 0.9 invite acceptance UI, invite token preservation through auth redirects, active household switching, and Settings household member/invite management
- Release 0.9 disposable local Supabase validation for migration chain, invitation lifecycle, owner-only controls, RLS denial paths, and active household preference switching
- Release 0.9 browser smoke validation on local Supabase for owner, adult, and viewer collaboration flows, including invite create/preview/accept/decline/revoke, role update, member removal, active household switching, and hidden non-owner controls
- Release 0.9.1 permanent engineering process framework covering release, feature, coding, architecture, UI, testing, documentation, git, review, checklist, and prompt workflows
- Release 0.9.1 governance framework covering Family OS principles, project structure, module template, production readiness, AI engineering, API, security, performance, environments, dependencies, ADRs, planning logs, and reusable templates
- v0.9.0 released with household collaboration validation complete
- v0.9.1 released with permanent engineering framework and governance templates
- v0.9.2 repository documentation cleanup completed
- Release 1.0 specification and implementation blueprint defined in `docs/planning/RELEASE_1_0_SPEC.md`
- Release 0.9.3 permanent Product Handbook established under `docs/product`
- Release 1.0 core MVP implementation added Home dashboard ordering, Calendar, More navigation, Universal Quick Add launch, Universal Search, in-app Notifications, and task search
- Release 1.0 authenticated local browser smoke validation passed against local Supabase for owner, adult, viewer, Home, Tasks, Calendar, Quick Add, Universal Search, Notifications, More, household switching, Settings, invite create/revoke, owner role update, non-owner control hiding, and mobile sanity checks
- Release 1.0.1 polished Home, Tasks, Quick Add, More grouping, notification lifecycle views, and product/planning documentation without adding deferred modules
- Release 1.0.2 improved Calendar and invitation configuration handling, friendly error guidance, optional integration behavior, setup documentation, and final local authenticated reliability smoke validation
- Release 1.0.3 established the local shadcn-compatible UI wrapper layer, design tokens, command search wrapper, and chip-based common task/Quick Add controls without adding product modules or schema changes
- Release 1.0.4 improved Core MVP consumer clarity, task discoverability, compact task filters, Quick Add supported destinations, Calendar/invite messaging, notifications/search empty states, and touched destructive confirmations without adding product modules or schema changes
- Release 1.0.5 hardened Calendar rendering, simplified header Calendar/Settings actions, clarified Calendar status behavior, and improved owner/adult Calendar setup messaging without schema changes
- Release 1.1 adds generic Life Lists and Life List Items, More navigation, Home awareness, Quick Add targets, Universal Search integration, seed fallback, and a Supabase migration with household-aware RLS
- Release 1.1 disposable/local validation passed for the full schema and migration chain, RLS owner/adult/viewer/cross-household behavior, authenticated browser smoke, 390px mobile sanity checks, no console warnings/errors, and product cleanup for Quick Add and Today's Priorities
- Release 1.2 adds Shopping Lists, Shopping Items, Categories, Pantry Items, More navigation, Home awareness, Quick Add targets, Universal Search integration, seed fallback, future recipe/meal-plan reference fields, and a Supabase migration with household-aware RLS
- Release 1.2 disposable/local validation passed for schema bootstrap, ordered migration chain, Shopping table/index/constraint/RLS checks, owner/adult/viewer/cross-household behavior, authenticated browser smoke, 390px mobile sanity checks, no console warnings/errors, and adult/viewer UI permission behavior
- Release 1.3 adds Meal Plans, Recipes, Recipe Categories, Recipe Ingredients, Meal Assignments, More navigation, Home awareness, Quick Add targets, Universal Search integration, pantry-aware Shopping review/generation, seed fallback, and a Supabase migration with household-aware RLS
- Release 1.3 disposable/local validation passed for schema bootstrap, ordered migration chain, Meal Planning table/index/constraint/RLS checks, owner/adult/viewer/cross-household behavior, authenticated browser smoke, 390px mobile sanity checks, no console warnings/errors, and product cleanup behavior
- Release 1.3.1 keeps the Planning Platform action surfaces consistent: Calendar status/setup actions route to Calendar, Home and Notifications drill Calendar attention into Calendar, Universal Search is grouped by surface, and Product Owner cleanup decisions remain enforced
- Release 1.3.2 improves Calendar recoverability, Home order, Tasks default visibility/sorting, task form grouping, and documents Pool Care Assistant as a future Home Platform submodule without adding Pool implementation
- Release 1.4.0 adds the Pool Care Assistant Foundation with a Pool action dashboard, water test logging, rule-based recommendations, treatment history, equipment inventory, maintenance reminders, Quick Add support, Universal Search support, and a Supabase migration for Pool equipment/action audit architecture
- Release 1.4.0 validation passed against disposable/local Supabase only for migration/RLS, action engine scenarios, authenticated Pool browser smoke, Quick Add/Search persistence, adult/viewer UI permissions, responsive desktop/tablet/390px checks, and console checks
- Release 1.4.4 improves Pool recommendation safety and explainability with explicit formula bases, staged CYA dosing, large-dose warnings, calculation details, swim-readiness dashboard polish, trend visibility, grouped history, and shorter test entry
- Release 1.4.5 upgrades Pool into an advisor experience with health/readiness/retest guidance, grouped action plan, treatment review before applying chemicals, richer trends/history, maintenance/context guidance, help copy, and faster required-vs-optional test entry
- Pool Test partial-log production feedback fixed: Quick Add and the Pool module share the Pool Test validation and row-building contract, FC and pH are optional, provided numeric values are range-checked, empty logs are blocked, CC appears directly after FC, Party/Rain context is available, and automated tests cover partial saves, context persistence, reload/history visibility, and Quick Add close behavior.
- Pool Test local-only persistence regression fixed: shared Supabase table mutations now throw on insert/update/delete failure instead of creating temporary local rows, Pool Test save paths only show success after persistence succeeds, and active Tasks, Life Lists, Shopping, Pool, Quick Add, and Meal Planning mutation paths handle rejected writes defensively.
- Preview-wide Supabase write failure fixed: the linked FamilyOS Supabase project was missing Release 0.9 and Release 1.1-1.4 database migrations, so module reads were falling back to seed data and writes failed across Pool, Tasks, Life Lists, Shopping, and Meal Planning. Missing migrations were applied remotely, Pool action audit `reading_id` was aligned to UUID Pool reading IDs, and Tasks now lets the database generate UUID IDs on create.
- Release 1.5.0 adds the Calendar Platform foundation with a Calendar schedule summary, Today/Tomorrow/This Week/Upcoming groups, event details, connection/reconnect guidance, safer OAuth/setup/permission messaging, Home next-event/upcoming schedule awareness, and custom-domain Calendar API origin handling
- Release 1.5.1 adds shared form controls and standardizes Pool Test, Quick Add Pool Test, Tasks, Shopping, Meal Planning, and Life Lists drawer form layouts, inline validation placement, compact notes/number/toggle controls, save/cancel footers, and duplicate-submit guards without database schema changes
- Release 1.5.1 production closeout passed on `https://familyos-glavach.vercel.app/`: main merge commit `9196bfa3a617af70d2f546a56062da5a27e6ebb2`, final tagged production commit `fffe50c250d01ee6c42f3f5a0607044ac98ca81a`, Vercel Ready/Current Production deployment, authenticated Pool Test partial save, Quick Add Pool Test open/close, Tasks, Shopping, Meal Planning, Life Lists, 390px no-overflow checks, 44x44 representative button checks, and clean production-app console checks.
- July 10, 2026 implementation planning sprint completed repository architecture, feature inventory, platform service, technical debt, module readiness, release backlog, Context Engine, design-system, risk, and Release 1.6 scope assessment without app-code or database changes.
- Release 1.6 adds `docs/platform/08_integration_contracts.md`, best-effort navigation payloads from Home/Search/Notifications into Tasks, Calendar, and Life Lists, Tasks Show All/Clear All filter polish, Calendar focus-return status refresh, and clearer Calendar refresh button copy without database schema changes.

## In Progress
- Release 1.6 browser/deployed OAuth validation closeout when authenticated local, staging, or production access is available.

## Next
- Complete Release 1.6 lint, build, git diff check, and available browser smoke validation.
- Complete deployed Calendar OAuth validation, legacy browser Calendar fallback removal readiness, and the next highest-value household workflow polish when authenticated production or staging OAuth access is available.
- Configure Release 0.8 server OAuth environment values in Vercel before removing the legacy calendar fallback.
- Decide whether to remove the legacy browser calendar fallback after deployed validation.
- Keep household migration work separate from Release 0.6B UI milestones unless explicitly requested

## Known Bugs

- No active deploy-blocking build errors after the CI lint cleanup.
- Production magic-link redirects depend on Supabase Auth Site URL and allowed redirect URLs being set to the deployed FamilyOS origin.
- Google Calendar sync requires the active browser origin to be listed in Google Cloud Console Authorized JavaScript origins for the configured OAuth client.
- Server-side Google Calendar sync also requires `calendar_connections`, Supabase service-role API access, Google OAuth client/secret/redirect settings, token encryption/state secrets, and either `APP_BASE_URL`, `VERCEL_URL`, or `ALLOWED_ORIGINS` coverage in each environment where Calendar is enabled.
- Household invitations require the Release 0.9 household collaboration migration and a refreshed Supabase/PostgREST schema cache in each environment.
- Life Lists requires the Release 1.1 migration and refreshed Supabase/PostgREST schema cache in each environment before durable persistence is available.
- Shopping & Pantry requires the Release 1.2 migration and refreshed Supabase/PostgREST schema cache in each environment before durable persistence is available.
- Meal Planning requires the Release 1.3 migration and refreshed Supabase/PostgREST schema cache in each environment before durable persistence is available.
- Pool Care Assistant requires the Release 1.4 migration and refreshed Supabase/PostgREST schema cache before equipment, action audit, and expanded Pool fields persist durably.
- Release 1.4.0 Pool Quick Add persistence requires the household-aware helper path added during validation. Pool Test creation also requires the shared Pool Test helper path and current `useTable` mutation behavior that surfaces Supabase write failures.
- Shared swipe-card row actions now have visible mouse/keyboard fallback controls and preserve swipe behavior. Monitor visual density as more modules adopt the pattern.
- Google Calendar token storage remains browser-local only for older legacy fallback sessions. Release 0.8C no longer writes new `gc_token` values, and the server route does not expose tokens to the frontend. Deployed validation still requires server env configuration and Google Cloud redirect URI setup.
- Legacy browser metadata keys for Release 0.6B settings, family members, and task metadata may remain on devices until local browser data is reset, but they are no longer the normal persistence path.
- Six-item bottom navigation should be checked on physical mobile devices before broad family use.
- The legacy household foundation migration is marked local-only and must not be applied to production.
- Release 0.7 now uses the household foundation for active household context, family members, settings/profile defaults, and task metadata while preserving staged module-table compatibility.
- Release 0.9 invite acceptance requires the invited email to already have or receive a valid Supabase auth session; public sign-up remains deferred.
- Release 0.9 validation passed against disposable local database `familyos_r09_validation` and local browser smoke users; production was not touched.

## Technical Debt
- Existing feature screens still contain substantial inline styles and should be migrated gradually to shadcn/ui and Origin UI components during feature work.
- Release 0.7 removes normal browser-local persistence for settings, family members, and task metadata. Release 0.8 moves secure calendar connection state server-side while selected UI-only module preferences remain browser-local.
- Current Supabase module tables still use direct `user_id = auth.uid()` RLS; household-scoped RLS must be introduced only after backfill and active-household app context are validated.
- The household foundation draft intentionally keeps module-table `user_id` RLS in place while adding nullable `household_id` fields for staged migration.
- Release 0.6C production baseline alignment backfilled existing module rows to the approved owner UUID. Future household-scoped sharing should move access through `household_id` once active-household runtime context is implemented.
- Ownership transfer, owner recovery, and full household-only module RLS remain Release 0.9 follow-up work.
- The new process framework should be tested against the next release and refined if any required step is unclear or redundant.
- Governance templates should remain lightweight; expand them only when real releases expose gaps.
- Historical audit and implementation docs are intentionally retained but should not be treated as current process guidance.
- Release 1.0 should avoid broad module expansion and focus on dashboard, tasks, navigation, settings, household management, responsive UX, and validation.
- Product direction should start from the Product Handbook; engineering execution should start from `docs/process/ENGINEERING_INDEX.md`.
- Release 1.0 introduced Universal Search and an in-app notification center as scoped local/app-shell features; push/email/SMS delivery remains deferred.
- Release 1.0 local smoke used disposable seeded records in local Supabase. Production deployment still requires normal post-merge/deploy smoke validation.
- Release 1.0.1 recurrence presets use the existing `recurring_interval_days` field. Weekday-only recurrence remains deferred until a richer recurrence model exists.
- Release 1.0.3 adds UI wrappers but does not complete migration of legacy deferred-module inline styles, native browser confirmations, or every historical component listed in the UI migration backlog.
- Release 1.0.4 removes native confirmations from touched Core MVP destructive flows, but deferred modules may still have older inline UI and confirmation patterns until they become active scope.
- Release 1.0.4 authenticated browser smoke used local Supabase only. Production was not touched.
- Release 1.0.5 keeps Calendar setup prompt persistence deferred until a preference-backed dismissal design is approved.
- Release 1.1 keeps recommendation engines, ratings, reviews, category-specific templates, external enrichment APIs, image upload storage, and notification delivery deferred.
- Release 1.1 validation used disposable/local Supabase only. Production was not touched.
- Release 1.2 keeps recipes, meal planning, barcode scanning, OCR, AI, external grocery APIs, recommendation engines, and unrelated platform work deferred.
- Release 1.2 validation used disposable/local Supabase only. Production was not touched.
- Release 1.3 keeps nutrition tracking, Health platform integration, AI recommendations, recipe APIs, barcode/OCR, external recipe databases, cost optimization, restaurant integrations, comments, ratings, and social features deferred.
- Release 1.3 validation used disposable/local Supabase only. Production was not touched.
- Release 1.3.1 adds no database migration. Validation remains local/staging only; production should not be touched during polish validation.
- Release 1.4.0 keeps Pool recommendations rule-based and human-confirmed. AI Coach, live integrations, automatic dosing, and automatic equipment control remain deferred.
- Release 1.4.5 intentionally keeps Pool advisor logic client-side and schema-neutral. Treatment review improves human confirmation but does not replace product-label safety checks or durable migration-backed workflow state.
- `pool_readings.ph` and `pool_readings.free_chlorine` remain nullable and app create flows support partial Pool Tests; validation now requires at least one tested value, note, rain context, or party/heavy-use context before insert.
- Supabase migration filenames currently reuse date-only versions for multiple same-day migrations. Remote migration metadata was repaired by date after the preview fix, but future migration work should use unique timestamp prefixes to avoid CLI ambiguity.
- Release 1.5.0 keeps Calendar read-only. Event creation/editing, reminders, automation, notifications, multi-provider support, and legacy browser fallback removal remain deferred until deployed OAuth validation and a richer scheduling model are approved.
- Release 1.5.1 intentionally adds no new modules, schema changes, or new product workflows. It centralizes shared form UI and leaves deeper form-state architecture for a future broader UI migration.

## Last Updated
July 10, 2026
