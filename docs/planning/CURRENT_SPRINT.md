# Current Sprint

## Sprint Goal
Complete Release 0.6A.1 local verification after the CRA-to-Vite migration and determine merge readiness for `feature/household-foundation`.

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
- [ ] Verify signed-in authentication, Household Context, Dashboard, Tasks, Home Maintenance, and Google Calendar with a valid local session
- [x] Create `docs/implementation/ui-platform/01_VITE_MIGRATION.md`
- [x] Update setup, deployment, planning, status, changelog, and index docs

## Blockers
- Merge readiness remains blocked until a valid local authenticated session is available in the browser and the signed-in verification matrix is completed.
- Live local Google Calendar verification remains blocked until `.env.local` uses a real Google OAuth Web client id instead of a placeholder-style value.
- Production deployment remains intentionally out of scope for this Vite migration sprint.
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
- Login, Household Context, Dashboard, Tasks, Home Maintenance, and Google Calendar post-login verification were not completed because the browser did not have a valid local authenticated session available.
- Release 0.6A.1 recommendation is `NOT READY TO MERGE` until the signed-in verification matrix is completed.
- Shared UI framework components remain in `src/components/ui/`; no UI primitives were redesigned during this sprint.
- Future flagship module work should reference `docs/architecture/MODULE_STANDARD.md`, `docs/architecture/ASSUMPTIONS_STANDARD.md`, and `docs/architecture/DECISION_ENGINE_STANDARD.md`.
