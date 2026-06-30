# Current Sprint

## Sprint Goal
Close Release 0.6A after the CRA-to-Vite migration, signed-in local verification, Calendar OAuth verification, and Vercel deployment verification.

## Active Items
- [x] Replace CRA build tooling with Vite
- [x] Preserve local dev port `3000`
- [x] Preserve build output directory `build/`
- [x] Add Vite root `index.html`
- [x] Remove CRA-only `public/index.html`
- [x] Update browser environment handling to prefer `VITE_*`
- [x] Preserve temporary `REACT_APP_*` fallback support
- [x] Verify Tailwind, shadcn-style primitives, Radix Slot, Lucide, and Recharts compile
- [x] Run `pnpm install`
- [x] Run `pnpm run build`
- [x] Run `pnpm run check`
- [x] Run `pnpm run dev`
- [x] Verify unauthenticated app shell loads at `http://localhost:3000`
- [x] Verify local Supabase REST is reachable
- [x] Verify required browser-visible env values are present through the current fallback path
- [x] Rerun `pnpm run build` for post-migration readiness
- [x] Rerun `pnpm run check` for post-migration readiness
- [x] Create `docs/implementation/ui-platform/02_POST_VITE_VERIFICATION.md`
- [x] Verify signed-in password login, session persistence, sign-out, and sign-back-in with a local-only test user
- [x] Verify signed-in Dashboard and Tasks rendering
- [x] Verify temporary task create plus `household_id` and `user_id` population
- [x] Verify Tasks edit/delete UI controls and cleanup
- [x] Verify Home Maintenance zero-state add UI, create/delete controls, ownership columns, and cleanup
- [x] Rerun Google Calendar OAuth after Google Cloud authorized `http://localhost:3000`
- [x] Complete Google Calendar live OAuth verification in standard Chrome
- [x] Verify Vercel deployment after the Vite migration
- [x] Create `docs/implementation/ui-platform/01_VITE_MIGRATION.md`
- [x] Update setup, deployment, planning, status, changelog, and index docs

## Blockers
- No Release 0.6A merge blockers remain.
- The previous Google `origin_mismatch` blocker for `http://localhost:3000` is resolved.
- Embedded browsers such as ChatGPT Desktop and Codex preview may fail Google Identity Services popup/transform flows; standard Chrome is the verification authority.
- Production household migration remains blocked pending review of the Tasks household RLS migration and later module-by-module rollout plan.

## Notes
- This sprint is infrastructure-only. No UI redesign, feature work, schema changes, Supabase changes, AI prompt changes, calculations, routing changes, or module workflow changes are in scope.
- Family OS now uses Vite for local dev and production builds.
- `pnpm start` and `pnpm run dev` run Vite on `http://localhost:3000`.
- `pnpm run build` uses `vite build` and still outputs to `build/`.
- Browser-visible env vars now prefer `VITE_*`; legacy `REACT_APP_*` values remain supported as temporary fallback through `envPrefix` and `src/config.js`.
- The Vite build reports a large chunk warning for the current single-bundle app. This is expected and deferred to future code-splitting work.
- The unauthenticated auth shell loads at `http://localhost:3000` with no captured browser console warnings/errors.
- Local Supabase REST is reachable, and no required browser-visible Supabase or Google Calendar env value is missing.
- Login, session persistence, sign-out, sign-back-in, signed-in Dashboard, signed-in Tasks, task create/edit/delete UI, task ownership columns, Home Maintenance zero-state add UI, Home Maintenance create/delete UI, and Home Maintenance ownership columns passed locally.
- Release 0.6A status is `COMPLETE`.
- Release 0.6A recommendation is `READY TO MERGE`.
- Manual Google Calendar verification succeeded in standard Chrome. Embedded browser Google Identity Services limitations are documented as non-application risk.
- Vercel deployment was manually verified after the Vite migration.
- Shared UI framework components remain in `src/components/ui/`; no UI primitives were redesigned during this sprint.
- Future flagship module work should reference `docs/architecture/MODULE_STANDARD.md`, `docs/architecture/ASSUMPTIONS_STANDARD.md`, and `docs/architecture/DECISION_ENGINE_STANDARD.md`.
