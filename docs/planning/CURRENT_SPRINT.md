# Current Sprint

## Sprint Goal
Build the first usable Family OS dashboard for Release 0.6B.

## Active Items
- [x] Add documentation structure
- [x] Add AGENTS.md
- [x] Add GitHub templates
- [x] Add Platform architecture documentation
- [x] Add frontend standard foundation
- [x] Fix Vercel production build failure from CRA CI lint warnings
- [x] Audit Supabase email magic-link redirect behavior for Vercel deployment
- [x] Document Google Calendar OAuth origin configuration for local and Vercel deployments
- [x] Add Supabase magic-link resend cooldown protection
- [x] Make private household email/password login the primary Supabase auth path
- [x] Validate current app structure
- [x] Identify next implementation target
- [x] Begin Release 0.6B branch
- [x] Complete Milestone 1 dashboard layout pass
- [x] Milestone 2 Google Calendar integration pass
- [x] Milestone 3 family member management pass
- [x] Milestone 4 task management MVP pass
- [x] Milestone 5 mobile responsiveness, loading states, and error-state hardening pass
- [ ] Milestone 6 settings and profile pass

## Blockers

## Notes
- Frontend foundation now includes Tailwind CSS, shadcn/ui aliases/primitives, Lucide icons, Recharts, and an Origin UI-style drawer component for new feature work.
- Production build now passes with `CI=true`; remaining deploy validation should happen through Vercel.
- Email magic-link redirects are generated from the current browser origin; Supabase Auth Site URL and allowed redirect URLs must include the deployed Vercel origin.
- Email magic-link sign-in now disables resend for 60 seconds after successful sends to reduce Supabase rate-limit errors.
- Email/password login is now the primary private-household auth path; users should be manually created in Supabase with public sign-up disabled.
- Google Calendar OAuth uses the current browser origin; Google Cloud Console Authorized JavaScript origins must include localhost, the Vercel production origin, and any custom domain used to open the app.
- Phase 1 UI migration has started with shared form primitives, segmented/chip controls, status badges, section headers, and empty-state helpers only; feature screens are intentionally unchanged.
- QuickAdd is the first migrated feature surface using the shared UI primitives; Finance, Pool, College, auth/setup, and database logic were left unchanged.
- AuthGate and SetupRequired now use shared UI primitives while preserving password sign-in, magic-link fallback, setup gating, and Supabase auth behavior.
- App shell/navigation now uses shared UI primitives/classes while preserving tab routing, active tab behavior, sign-out, and Google Calendar connect/sync actions.
- PoolBrief and RetirementBrief now use shared AI brief panel helpers while preserving AI prompts, history, refresh/regenerate, copy, and follow-up behavior.
- App structure refactor moved the shell, hooks, and user-facing modules out of the monolithic src/App.js; pnpm run check passes after the split.
- Release 0.6B Milestone 1 migrates the dashboard command center to shared cards, status badges, buttons, skeleton loading states, empty states, and Lucide icons while preserving the current user-scoped Supabase table hooks and Google Calendar behavior.
- Release 0.6B Milestone 2 keeps the existing browser popup OAuth flow and improves dashboard calendar sync states, expired-token and permission handling, empty calendar handling, event grouping, source labels, and last-sync visibility.
- Release 0.6B Milestone 3 adds dashboard family member management with local editable members, active/inactive states, member colors, role labels, assignment filters, and reference-aware removal/deactivation. This milestone does not add Supabase family-member persistence because the current applied schema does not include a family member table.
- Release 0.6B Milestone 4 replaces the legacy inline-style task screen with a shared-card task MVP covering dashboard task groups, create/edit/complete/reopen/delete/reassign actions, filters, sorting, validation, toast feedback, and local task metadata for fields not yet present in the applied Supabase schema.
- Release 0.6B Milestone 5 hardens the dashboard, calendar, family, tasks, and app shell UX with safer localStorage parsing, malformed event/task fallbacks, responsive action rows, focus visibility, labelled task drawer fields, toast live-region semantics, and mobile QA coverage notes.
