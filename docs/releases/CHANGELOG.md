# Changelog

## Unreleased
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
