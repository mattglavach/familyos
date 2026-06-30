# Vite Migration

Date: June 30, 2026

Branch: `feature/household-foundation`

## Summary

Family OS was migrated from Create React App to Vite as a Release 0.6A infrastructure sprint. The migration preserves existing React behavior, routing, Supabase access, Google Calendar integration shape, Tailwind styling, shadcn-style primitives, Origin UI-style drawer patterns, and Vercel API route assumptions.

No feature work, UI redesign, database change, Supabase configuration change, AI prompt change, or business logic change was intentionally made.

## Files Changed

- `package.json`
- `pnpm-lock.yaml`
- `vite.config.mjs`
- `index.html`
- `public/index.html`
- `src/config.js`
- `src/hooks/useGoogleCalendar.js`
- `.env.example`
- `README.md`
- `docs/architecture/DEPLOYMENT.md`
- `docs/architecture/AUTHENTICATION.md`
- `docs/setup/google-calendar-oauth.md`
- `docs/planning/CURRENT_SPRINT.md`
- `docs/planning/PROJECT_STATUS.md`
- `docs/releases/CHANGELOG.md`
- `docs/00_MASTER_INDEX.md`

## Migration Steps

1. Removed `react-scripts`.
2. Added Vite and React plugin dependencies.
3. Added `vite.config.mjs`.
4. Preserved local dev server port `3000`.
5. Preserved production build output directory `build/`.
6. Added root `index.html` with Vite module entry.
7. Removed CRA-only `public/index.html`.
8. Configured Vite to support existing JSX-in-`.js` source files.
9. Configured Vite alias support for `@` to `src`.
10. Added `envPrefix` support for both `VITE_*` and legacy `REACT_APP_*` during the cutover.
11. Updated browser config reads to prefer `VITE_*` values with `REACT_APP_*` fallback.
12. Updated Google Calendar configuration messages to reference `VITE_*`.
13. Kept `api/brief.js` server-only behavior unchanged.

## Environment Variable Mapping

Browser-visible variables now use Vite names:

| CRA name | Vite name |
| --- | --- |
| `REACT_APP_SUPABASE_URL` | `VITE_SUPABASE_URL` |
| `REACT_APP_SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` |
| `REACT_APP_APPROVED_HOUSEHOLD_EMAILS` | `VITE_APPROVED_HOUSEHOLD_EMAILS` |
| `REACT_APP_GOOGLE_CLIENT_ID` | `VITE_GOOGLE_CLIENT_ID` |
| `REACT_APP_GOOGLE_CALENDAR_ID` | `VITE_GOOGLE_CALENDAR_ID` |

Temporary compatibility:

- `vite.config.mjs` exposes both `VITE_*` and `REACT_APP_*`.
- `src/config.js` prefers `VITE_*` and falls back to `REACT_APP_*`.
- Existing `.env.local` files can continue working during the migration window.

Server-only variables are unchanged:

- `ANTHROPIC_API_KEY`
- `ALLOWED_ORIGINS`

## Build Differences

Before:

- `pnpm start` ran `react-scripts start`.
- `pnpm run build` ran `react-scripts build`.
- CRA generated the `build/` folder.
- CRA used `public/index.html` with `%PUBLIC_URL%` placeholders.

After:

- `pnpm start` runs `vite --host 0.0.0.0 --port 3000`.
- `pnpm run dev` runs the same Vite dev server.
- `pnpm run build` runs `vite build`.
- Vite still outputs to `build/` to minimize deployment churn.
- Root `index.html` is the Vite entrypoint.

## Known Issues

- Vite reports a large chunk warning because the current app is still mostly bundled into one large application chunk. This is not a new behavior problem and should be addressed later through feature-level code splitting.
- Signed-in browser verification requires a valid local Supabase session or credentials. The unauthenticated auth shell was verified after migration.
- Existing historical implementation notes may still reference CRA or `REACT_APP_*`; active setup and deployment docs now use `VITE_*`.

## Rollback Instructions

1. Revert the Vite migration commit.
2. Restore `react-scripts` in `package.json`.
3. Restore CRA scripts:
   - `start`: `react-scripts start`
   - `build`: `react-scripts build`
4. Restore `public/index.html` as the application HTML entry.
5. Remove root `index.html` and `vite.config.mjs`.
6. Restore `src/config.js` to read `process.env.REACT_APP_*`.
7. Run `pnpm install`.
8. Run `pnpm run build` and `pnpm run check`.

## Verification Checklist

- [x] Remained on `feature/household-foundation`
- [x] `pnpm install` completed after approving Vite's `esbuild` build script
- [x] `pnpm run build` passed
- [x] `pnpm run check` passed
- [x] `pnpm run dev` started Vite on `http://localhost:3000`
- [x] Browser loaded the FamilyOS auth shell
- [x] Browser console had no captured warnings or errors on the auth shell
- [x] Vite served root HTML with the Vite client
- [x] Tailwind/shadcn-style components compiled
- [x] Lucide icons compiled
- [x] Radix Slot compiled
- [x] Build output remained `build/`
- [ ] Login verified with a valid local user session
- [ ] Household Context verified after sign-in
- [ ] Dashboard verified after sign-in
- [ ] Tasks verified after sign-in
- [ ] Home Maintenance verified after sign-in
- [ ] Google Calendar connect button verified after sign-in

## Verification Notes

The app loaded successfully at `http://localhost:3000` and rendered the unauthenticated FamilyOS sign-in screen. No browser console warnings or errors were captured on that reachable shell.

Signed-in screens were not verified because the browser did not have a valid local authenticated session available during this sprint. No auth flow or Supabase setup was changed to force verification.
