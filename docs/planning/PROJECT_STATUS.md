# Project Status

## 2026-07-16: Release 3.5.0 local implementation

Release 3.5 narrows Home to a 30-second Morning Command Center and removes independent recommendation generation from Notification Center. Both surfaces now use one deterministic lifecycle-aware pipeline. The release adds no schema, dependency, navigation, AI decision-making, deployment, or production mutation.

## 2026-07-16: Release 3.4.1 stabilization

Release 3.4.1 is the current local stabilization candidate. It adds no feature or migration. The work repairs release validation, restores browser regression reliability, proves dynamic household/role isolation, validates the blank migration chain, expands recommendation lifecycle and accessibility coverage, and introduces one maintainable release-gate command. Publication and production changes remain outside this local workstream.

## 2026-07-15: Release 3.4.0 implementation

The deterministic Family Brief now has an adaptive, transparent intelligence layer. Confidence remains separate from priority; household-local outcomes tune ordering and cooldowns; workload limits noise; grouping and dependency handling improve actionability. No autonomous schedule changes or external household analytics were added.

## 2026-07-15: Release 3.3.0 implementation

Actionable Family Brief is deployed to production. The release adds a canonical recommendation lifecycle and a concise Home operating view without creating a new module or changing domain ownership. Local gates, dedicated hosted-test validation, additive production migration, Vercel production deployment, stable/immutable endpoint checks, database postflight, weather/API boundary, console, responsive, accessibility, and bundle-secret verification passed. Release tagging is the final closeout action.

## Current Release

Post-release development infrastructure now includes a repository-controlled blank Supabase test-project manifest, PowerShell initializer, verifier, offline guard tests, and `pnpm run db:test:validate-local` aligned to Release 3.2.0. The final model applies `schema.sql` once, executes 23 production-ready migrations through AI Planning, and records the redundant baseline plus superseded local household draft as history-only versions for 25-version production ledger parity. The complete chain and verifier pass on both a disposable loopback-only PostgreSQL 18.4 cluster and a newly created dedicated non-production Supabase project. Hosted verification confirmed Auth bootstrap, private Storage, RLS, grants, policies, 25-version history alignment, repeatable demo seeding, and 81 authenticated browser tests. Production was not accessed or modified.

FamilyOS 3.2.0 AI Planning and Advisory is released to production. It adds a permission-scoped server advisory boundary, validated structured responses, deterministic fallback, Family Assistant, AI-assisted Family Brief, weekly planning, context controls, proposed-action review, feedback, and shared deduplication. AI remains advisory and cannot mutate FamilyOS from a model response.

The full local gate passes with 40 suites and 157 unit tests, 18 seed-safety tests, production build, bundle scan, and 81 authenticated Playwright tests across desktop, 390px mobile, tablet, dark mode, accessibility, persistence, and failure states. Production schema/data backups were captured; all 25 migrations are aligned; the four additive AI tables, RLS policies, owner/adult writes, and anonymous denial are verified. Application deployment `dpl_YXNjcd2uLmvQ17aKLVSXCmBnZwuC` is READY at `familyos-pi-seven.vercel.app`. Public checks, an authenticated read-only Anthropic advisory request, privacy-safe logs, and no-client-secret checks passed.

FamilyOS 3.1.0 Relationship OS is the current production release. It adds relationship profiles, deterministic health, quick logging, planned time together, goals, birthdays, Home and weekly brief integration, Search, and Timeline. All 148 unit tests and 77 authenticated Playwright tests pass. Production schema/data backups were captured and both additive migrations are applied with 24-version alignment, RLS, owner/adult writes, and explicit anonymous privilege denial verified. Vercel deployment `dpl_9LudwwSv6q4j4ovqvTY71YP5ZuFQ` is READY at `familyos-pi-seven.vercel.app`; desktop/mobile public checks passed.

FamilyOS 3.0.0 Daily Experience Polish is the current production release. It removes redundant Family Brief and Pool summary guidance, makes checklist Habit and Routine expansion a direct inline completion workflow, preserves editing through a separate action, and keeps Habit edit actions accessible above mobile safe areas. The combined local gate, 141 unit tests, production build and bundle scan, and 73 authenticated desktop, 390px mobile, tablet, and dark-mode browser tests pass. The release does not change schemas, migrations, authentication, permissions, dependencies, calculations, or integration contracts.

Release 3.0.0 was published from `main`, tagged `v3.0.0`, and deployed through the Vercel Git integration on 2026-07-14. Validated application deployment `dpl_5UE9GJfH2fiX8yXcYtaBNueU5afo` reached `READY` at `familyos-pi-seven.vercel.app` for commit `4094567`. Desktop and 390px mobile unauthenticated checks passed against both the production alias and immutable deployment, including sign-in rendering, console monitoring, weather response, and production bundle secret-marker scanning. Runtime review found only the known non-blocking Node `url.parse()` deprecation warning on Calendar and Weather routes. Authenticated production mutation testing was not run; the approved non-production authenticated matrix passed.

## Release 2.7.0 local release candidate

FamilyOS 2.7.0 is the current local usability release candidate. It makes common Home, Habits, Calendar, Pool, Life Lists, and Finance workflows more direct while preserving authentication, household isolation, history, provider links, calculations, Quick Add, and deep-link destinations. No database migration is included. Publication and production deployment are not part of this local release.

## Release 2.6.1 local release candidate

FamilyOS 2.6.1 is the current local usability release candidate. It refines Home event clarity, completes checklist/routine interaction from Habits, and makes Pool recommendations concise by default with full guidance on expansion. No database migration is included.

## Release 2.6.0 local release candidate

FamilyOS 2.6.0 is implemented locally. It simplifies daily navigation and duplicate controls, consolidates Home priorities, improves task/habit filtering and Calendar scanning, and adds one-level checklist habits through an additive household-scoped migration. Production migration and deployment are not part of this local release commit.

## Release 2.5.0 production

FamilyOS 2.5.0 is deployed to production from `main` at merge commit `209404e`. The production Supabase project `dsowansazqleudupnjug` has all 17 migrations through Release 2.5, and the Vercel production deployment is READY at `https://familyos-glavach.vercel.app`. Public sign-in smoke, mobile containment, runtime console, and production error-log review passed. The release extends existing household-scoped architecture rather than adding a parallel planning system. Brief scheduling uses authenticated-open due evaluation; notifications remain in-app; AI output remains advisory; and Calendar recurrence writes remain provider-owned.

Production migration, merge, and deployment are complete. The production schema backup captured before migration remains at `C:\Users\Matt Glavach\AppData\Local\Temp\familyos-production-pre-2.5-schema.sql` for short-term recovery support.

Release 2.4.0 is deployed to production from `main` at commit `d58dc52`. Smart planning remains an awareness and reasoning layer over FamilyOS records: Home summarizes, source modules own data, and AI output requires user initiation and review. Lint, 102 automated tests, 18 seed-safety tests, fresh 16-migration bootstrap, production build, bundle safety, authenticated non-production desktop/mobile/tablet/dark-mode regression, production migration-history/schema verification, production deployment readiness, public sign-in smoke, and current-deployment runtime-error review pass. Authenticated production navigation was not run because no approved production browser session or credentials were available.


Release 2.3.0 is the current validated release candidate. The two release blockers are implemented: My Tasks resolves the authenticated household person deterministically, and Pool Maintenance Done uses one idempotent database transaction for history plus recurrence advancement. Durable Habits, lightweight Routines, global creation, Needs Attention navigation, and additive notification-state foundations are included. The approved non-production migration, authenticated RLS/invariant checks, local gates, and desktop/mobile/tablet/dark-mode workflows pass. Production migration and production verification were not performed.

Release 2.2.0 is the current local release candidate. It introduces the unified Today dashboard, compact module status, seven-path Quick Add, device-local Habits, and expanded daily task workflows. One required, non-destructive Pool optional-field migration is included; no authentication, permission, dependency, push, deployment, or tag change is included.

Release 2.2.0 blocker closeout adds one required, non-destructive Pool Test migration that permits `null` for optional weather and appearance fields. Real authenticated persistence now passes through both Pool and Quick Add on desktop and 390px mobile, including post-refresh ownership verification. RLS is unchanged.

Corrective release status: production preflight found `pool_readings.test_context` and `water_appearance` missing. Migration `20260712010000_release_2_2_pool_schema_reconciliation.sql` safely reconciled production to the canonical contract without changing records, RLS, policies, grants, or ownership. The already-applied optional-field migration is normalized as `20260712000000_release_2_2_pool_optional_text_nulls.sql`; this is migration-history normalization rather than an additional schema change.

The prior Release 1.4 migration is normalized as `20260703010000_release_1_4_pool_care_assistant.sql` so it deterministically follows `20260703000000_bootstrap_pool_action_audits.sql`. The SQL is byte-for-byte unchanged; only supported migration-history repair is required in existing environments.

Release 2.1.1 is the current local release candidate. It stabilizes partial Pool Test persistence, eliminates Calendar Today/This Week duplication, adds compact inline event details, and condenses Pool entry forms. Outlook Calendar is deferred as a future consideration after core stability and maturity. No schema, migration, authentication, dependency, push, tag, or deployment change is included.

Release 2.1.0 is the current local release candidate. It adds explicit guided acceptance into existing module forms, favorite/recent AI prompts, collapsible prompt preview metadata, a priorities-first configurable Home briefing, and deterministic Context Engine deduplication and prioritization. No migration, authentication, permission, dependency, automatic prompt transmission, or automatic AI write is included.

Release 2.0.0 is the current local release candidate. It adds a deterministic Context Engine, provider-neutral Prompt Builder, centralized AI Workspace, device-local prompt trace metadata, privacy controls, Home AI Brief, and optional response review. FamilyOS remains the system of record and performs no automatic prompt transmission or AI-originated database writes. No schema, authentication, dependency, or provider-credential change is included.

Release 1.8.4 is the current local release candidate. It consolidates Home attention into Family Snapshot, adds Life Lists and optional weather, removes Shopping from active exposure, corrects Tasks assignment and Due views, simplifies Calendar with multi-day event correctness, and completes Pool treatment and reviewed ChatGPT handoff workflows. Stored Shopping data remains intact. No database migration, authentication change, permission change, or dependency change is included.

Playwright authentication infrastructure now fails fast on missing or inconsistent test configuration and uses one freshly generated, gitignored authenticated state for desktop and mobile. Authenticated desktop Chromium and 390px mobile Chromium smoke tests pass against the approved non-production test environment.

Release 1.8.4 is the current local release candidate. Global creation now lives in a compact top-bar Add sheet, Settings remains the far-right icon, and Pool replaces Add in the five-item bottom module navigation. Pool History uses compact cards with visible Edit/Delete controls and confirmed deletion instead of swipe gestures. Home is a concise daily brief with populated sections only and no duplicate creation surface. Release 1.8 architecture, Household Context Service, Pool data contracts, integrations, authentication, permissions, dependencies, and database contracts remain unchanged.

Release 1.7 remains committed locally. Its additive Pool migration has not been applied by this work. Release 1.8 requires no new database columns because the Release 1.7 treatment traceability fields support retest notes and outcomes. No production, deployment, remote Git, tag, merge, or migration action has been performed.

Next product scope: Release 2.0.0 architecture and a permission-aware cross-module Context Engine. Do not begin new module expansion until that design is approved.
