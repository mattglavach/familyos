# FamilyOS 2.9.0 - Unified Context

Release date: 2026-07-13

## Outcome

FamilyOS 2.9 connects module-owned records into one deterministic household view. The release adds typed Context Engine contracts, a dedicated bounded Timeline, explainable recommendation scoring, configurable household location and server-side weather, expanded search, deterministic Smart Quick Add, private managed attachments, per-user dashboard preferences, and a unified notification experience.

Shopping is removed from active navigation and every new v2.9 surface. Existing Shopping tables, records, migrations, and RLS policies are preserved. No destructive Shopping migration is included.

## Architecture

- Context remains derived and read-only. Module providers stay isolated, household scoped, deterministic, stably sorted, evidence-backed, and AI-independent.
- JSDoc runtime contracts and TypeScript declaration files define the unified context and timeline models without converting the established CRA JavaScript application.
- Timeline derives reconstructable activity from owning tables and uses `household_activity` only for durable transitions that cannot be reconstructed. Results are bounded to 200 items and progressively displayed.
- Recommendation priority uses documented severity, urgency, confidence, effort, and household-load weights. Raw scores are internal; user-facing cards show plain-language priority, confidence, evidence, action, consequence, and time.
- Open-Meteo was selected because it provides current conditions and seven-day forecasts without client secrets, has a stable public API, supports coordinates and timezone-aware forecasts, and creates minimal operational burden. Calls remain server-side, cached for 30 minutes, time out, and degrade safely. Ravenel, South Carolina is only the unsaved-location fallback.
- Search continues to use active-household RLS queries at current household scale, with bounded per-domain result counts and trigram indexes for major text fields. Shopping is excluded.
- Smart Quick Add parses one item deterministically, resolves natural dates in the household timezone, rejects Shopping commands, and requires review before an owning form saves.
- Attachments use a private Supabase Storage bucket, household path prefixes, signed URLs, a 10 MB limit, an explicit MIME allowlist, opaque filenames, metadata RLS, and storage-object policies. Failed metadata writes remove the uploaded object.
- Dashboard layout, hidden sections, pins, and density are stored per user with safe defaults and a reset path.

## Database and rollback

Migration `20260713000000_release_2_9_unified_context.sql` adds location/timezone settings, dashboard preferences, `household_activity`, `attachments`, private storage configuration and policies, and search indexes. It is additive and idempotent. Application rollback redeploys v2.8.0 while leaving additive records in place. Before any database rollback, preserve attachment metadata and storage objects; do not drop Shopping or attachment data.

## Environment and setup

No weather API key is required. Supabase Storage must be available in the target project. The migration creates or reconciles the `household-attachments` bucket and policies. Existing Supabase URL/anon configuration is reused; upload and signed access execute under the authenticated user and RLS.

## Known limitations

- Google Calendar remains provider-owned and read-oriented; Smart Quick Add opens the existing provider flow for calendar writes.
- Timeline reconstructs current source history where source tables do not record every historical state transition.
- Managed attachment UI is first exposed in Home Operations; the shared component and metadata model support the other approved entity types as owning-module forms adopt it.
- Open-Meteo does not provide a universal government-alert feed. The release uses conservative forecast evidence for weather recommendations rather than claiming official severe-weather alerts.

## Validation and production

The complete 20-migration chain was rebuilt from zero locally. Local and production schema dumps confirmed the v2.9 tables, indexes, RLS, private bucket row, and storage-object policies. The dedicated test project passed authenticated upload, metadata RLS, signed URL, desktop, tablet, 390px mobile, dark-mode, accessibility, console, network, and page-error checks. The production database was backed up before migration. Production deployment `familyos-6b4byrzhn-glavach.vercel.app` is READY and aliased to `familyos-pi-seven.vercel.app`; desktop/mobile unauthenticated, weather, bundle-secret, HTTP, console, and logs passed with one non-blocking Node runtime deprecation warning. Authenticated production credentials were not available to automation, so authenticated production mutation smoke was not performed.
