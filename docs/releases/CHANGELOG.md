# Changelog

## Unreleased
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
