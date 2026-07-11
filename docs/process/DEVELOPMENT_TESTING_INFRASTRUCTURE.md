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
FAMILYOS_ENV=development
SUPABASE_SERVICE_ROLE_KEY=<non-production service role key>
DEMO_USER_EMAIL=test@familyos.app
DEMO_USER_PASSWORD=<strong development-only password>
DEMO_SEED_ALLOW_REMOTE_TEST=false
REACT_APP_ENABLE_DEMO_AUTO_LOGIN=false
REACT_APP_DEMO_EMAIL=test@familyos.app
REACT_APP_DEMO_PASSWORD=<same development-only password>
```

`SUPABASE_URL` may be set server-side; otherwise the seed reads `REACT_APP_SUPABASE_URL`. For a dedicated hosted test project, set `DEMO_SEED_ALLOW_REMOTE_TEST=true` only after verifying the project is non-production. The seed refuses missing environment classification, production-like targets, non-FamilyOS demo email domains, and remote targets without this explicit switch.

The browser demo password is compiled into the local development bundle. It must be test-only and must never exist in preview or production environment settings.

## Commands

```powershell
cd "C:\Users\Matt Glavach\Documents\Codex\familyos"
pnpm run seed:demo
pnpm exec playwright install chromium
pnpm run test:smoke
pnpm run test:regression
```

Use `pnpm run test:e2e:ui` for interactive diagnosis. Playwright starts CRA automatically unless `PLAYWRIGHT_SKIP_WEBSERVER=true`. Use `PLAYWRIGHT_BASE_URL` only for an approved target.

## Auto-Login Controls

Auto-login requires CRA development mode, a hostname of `localhost`, `127.0.0.1`, or `[::1]`, `REACT_APP_ENABLE_DEMO_AUTO_LOGIN=true`, and a non-empty demo password. It cannot run in optimized production builds, previews, production deployments, or non-local hosts. Playwright disables it so smoke tests independently verify real password sign-in.

## Seed Coverage

The deterministic dataset includes five related people, birthdays and anniversary notes, owner membership, preferences, overdue/current/future/completed/recurring tasks, home maintenance, important notes, Life goals, shopping and pantry data, financial accounts/goals/milestones, college savings goals, and Pool readings/reminders. Google Calendar remains external and is tested through disconnected/setup states rather than modified by the seed.

Future modules must extend this seed and their regression coverage when their schemas and production workflows become implemented. Do not seed speculative tables.

## Reusable Browser Utilities

`tests/e2e/helpers/app.js` provides demo login/logout, navigation, readiness waits, runtime failure monitoring, failed API reporting, and screenshots. Failed runs retain screenshots, traces, and videos in ignored output directories.

## Release Gate

For affected releases, run lint, unit tests, build, demo reset, Chromium smoke, affected regression suites, desktop coverage, and 390px mobile coverage. Any skipped environment-dependent validation must be reported as a release gap, not a pass.
