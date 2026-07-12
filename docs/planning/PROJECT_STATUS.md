# Project Status

Release 2.1.0 is the current local release candidate. It adds explicit guided acceptance into existing module forms, favorite/recent AI prompts, collapsible prompt preview metadata, a priorities-first configurable Home briefing, and deterministic Context Engine deduplication and prioritization. No migration, authentication, permission, dependency, automatic prompt transmission, or automatic AI write is included.

Release 2.0.0 is the current local release candidate. It adds a deterministic Context Engine, provider-neutral Prompt Builder, centralized AI Workspace, device-local prompt trace metadata, privacy controls, Home AI Brief, and optional response review. FamilyOS remains the system of record and performs no automatic prompt transmission or AI-originated database writes. No schema, authentication, dependency, or provider-credential change is included.

Release 1.8.4 is the current local release candidate. It consolidates Home attention into Family Snapshot, adds Life Lists and optional weather, removes Shopping from active exposure, corrects Tasks assignment and Due views, simplifies Calendar with multi-day event correctness, and completes Pool treatment and reviewed ChatGPT handoff workflows. Stored Shopping data remains intact. No database migration, authentication change, permission change, or dependency change is included.

Playwright authentication infrastructure now fails fast on missing or inconsistent test configuration and uses one freshly generated, gitignored authenticated state for desktop and mobile. Authenticated desktop Chromium and 390px mobile Chromium smoke tests pass against the approved non-production test environment.

Release 1.8.4 is the current local release candidate. Global creation now lives in a compact top-bar Add sheet, Settings remains the far-right icon, and Pool replaces Add in the five-item bottom module navigation. Pool History uses compact cards with visible Edit/Delete controls and confirmed deletion instead of swipe gestures. Home is a concise daily brief with populated sections only and no duplicate creation surface. Release 1.8 architecture, Household Context Service, Pool data contracts, integrations, authentication, permissions, dependencies, and database contracts remain unchanged.

Release 1.7 remains committed locally. Its additive Pool migration has not been applied by this work. Release 1.8 requires no new database columns because the Release 1.7 treatment traceability fields support retest notes and outcomes. No production, deployment, remote Git, tag, merge, or migration action has been performed.

Next product scope: Release 2.0.0 architecture and a permission-aware cross-module Context Engine. Do not begin new module expansion until that design is approved.
