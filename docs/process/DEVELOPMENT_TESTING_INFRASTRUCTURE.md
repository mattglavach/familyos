# Development Testing Infrastructure

This is the permanent operating guide for FamilyOS demo data and automated browser testing. Canonical security and delivery rules remain in `docs/governance/FamilyOS_Project_Instructions.md`.

## Design

- The permanent demo identity is `test@familyos.app` in local or dedicated non-production Supabase only.
- `scripts/seed-demo.mjs` deletes and recreates the demo auth user, bootstrap household, household records, and representative active-module data.
- Playwright owns authenticated smoke, module regression, responsive, console, network, API-failure, screenshot, trace, and video diagnostics.
- Production, preview, and shared production-data environments must never contain demo credentials or enable auto-login.

## Local Environment

Put secrets in ignored `.env.local` or `.env.test.local`. Never commit populated values.

```text
FAMILYOS_ENV=test
SUPABASE_SERVICE_ROLE_KEY=<non-production service role key>
DEMO_USER_EMAIL=test@familyos.app
DEMO_USER_PASSWORD=<strong development-only password>
DEMO_SEED_ALLOW_REMOTE_TEST=true
DEMO_SEED_EXPECTED_PROJECT_REF=<exact-non-production-project-ref>
# Or for local Supabase: DEMO_SEED_EXPECTED_URL=http://127.0.0.1:54321
REACT_APP_ENABLE_DEMO_AUTO_LOGIN=false
REACT_APP_DEMO_EMAIL=test@familyos.app
REACT_APP_DEMO_PASSWORD=<same development-only password>
```

`SUPABASE_URL` may be set server-side; otherwise the seed reads `REACT_APP_SUPABASE_URL`. Seeding requires `FAMILYOS_ENV=test` plus an exact `DEMO_SEED_EXPECTED_PROJECT_REF` or `DEMO_SEED_EXPECTED_URL` match. Remote targets additionally require `DEMO_SEED_ALLOW_REMOTE_TEST=true`. Authorization alone never permits an arbitrary project, and target verification completes before the Supabase admin client is created.

The browser demo password is available only to the local development bundle. Webpack removes the complete development module and import branch from optimized production builds. `pnpm run test:bundle-safety` verifies that production JavaScript contains no demo identity, environment-variable names, error marker, module name, or implementation function marker.

## Commands

```powershell
cd "C:\Users\Matt Glavach\Documents\Codex\familyos"
pnpm run seed:demo
pnpm run test:seed-guards
pnpm exec playwright install chromium
pnpm run test:smoke
pnpm run test:regression
```

Use `pnpm run test:e2e:ui` for interactive diagnosis. Playwright starts CRA automatically unless `PLAYWRIGHT_SKIP_WEBSERVER=true`. Use `PLAYWRIGHT_BASE_URL` only for an approved target.

## Auto-Login Controls

Auto-login is isolated in `src/development/demoAutoLogin.js`. A compile-time `NODE_ENV` branch requires it only in development, allowing the production build to remove the branch and module. At runtime it still requires CRA development mode, a loopback hostname, the explicit enable flag, and both demo email and password. Playwright disables auto-login so smoke tests independently verify real password sign-in.

## Seed Deletion Contract

The permanent demo household uses UUID `00000000-0000-4000-8000-000000000017` and internal key `familyos-permanent-demo-v1`. Before deletion, the seed requires at most one ID match, at most one key match, exact agreement between them, the expected household name and creator, exactly one active owner membership for the demo user, and no other household memberships for that user. Any ambiguity stops before deletion. Only the deterministic household ID is deleted. The auth-created temporary bootstrap household is separately verified by its existing migration key, creator, source user, and sole owner membership before deletion.

## Seed Coverage

The deterministic dataset includes five related people, birthdays and anniversary notes, owner membership, preferences, overdue/current/future/completed/recurring tasks, home maintenance, important notes, Life goals, shopping and pantry data, financial accounts/goals/milestones, college savings goals, and Pool readings/reminders. Google Calendar remains external and is tested through disconnected/setup states rather than modified by the seed.

Future modules must extend this seed and their regression coverage when their schemas and production workflows become implemented. Do not seed speculative tables.

## Reusable Browser Utilities

`tests/e2e/helpers/app.js` provides demo login/logout, navigation, readiness waits, runtime failure monitoring, and failed API reporting. Playwright itself retains screenshots, traces, and videos for failed runs. Coverage includes task CRUD, completion persistence/reopen, dashboard seeded content, controlled mutation failure, empty state, delayed loading state, navigation, authentication, and responsive overflow.

## Release Gate

No release is complete until `pnpm run check`, `pnpm run test:smoke`, and `pnpm run test:regression` pass with zero failures. The check includes lint, unit tests, seed safety tests, production build, and production bundle safety scan. Any skipped environment-dependent validation must be reported as a release gap, not a pass.
