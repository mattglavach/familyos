# Project Status

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
