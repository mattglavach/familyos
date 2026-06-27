# Repository Audit Executive Summary

Audit date: 2026-06-27

## Overall Health Score

**5.6 / 10**

FamilyOS has a useful working Phase 1 application and a serious documentation foundation, but the implementation is not yet aligned with the documented long-term platform architecture. The largest risks are concentrated in a very large `src/App.js`, a user-scoped Supabase schema that conflicts with household-scoped platform docs, missing migration/CI/test infrastructure, and privacy/security choices that are acceptable for a prototype but weak for a long-term family operating system.

## Scoring Table

| Area | Score | Rationale |
| --- | ---: | --- |
| Repository Organization | 6 | Clear top-level folders exist, but `src/App.js` still contains most app logic and `build/` plus `node_modules/` are present locally. |
| Documentation | 6 | Broad docs exist, but several are aspirational and conflict with current code/schema. |
| Architecture | 5 | Feature extraction has started for Dashboard and Tasks, but auth, hooks, data flow, Pool, Finance, College, AI brief UI, and Quick Add remain centralized in `src/App.js`. |
| Database Design | 5 | Schema is usable for Phase 1, but lacks canonical household tables, migrations folder, `updated_at`, broad relationship modeling, and many performance indexes. |
| Security | 5 | RLS exists for current tables, but policies are user-owned rather than household-owned, API lacks app-user auth, and Google tokens are stored in `localStorage`. |
| Privacy | 4 | Family, finance, college, and pool data are sensitive; local storage and fallback/mock behavior need sharper privacy boundaries. |
| Scalability | 5 | Current module list is ambitious, but app and schema patterns will become hard to extend without platform entities and module boundaries. |
| Maintainability | 4 | `src/App.js` is 2,712 lines and 240 KB, which is the main maintainability bottleneck. |
| Developer Experience | 6 | `pnpm`, lint, build, Tailwind, shadcn-style components, and docs are present, but CI and tests are missing. |
| Product Alignment | 6 | Current app supports Home, Finance, Pool, Tasks, and College, but documented modules like Documents, Medical, Travel, Vehicles, Garden, Retirement platformization, and AI context are mostly not implemented. |
| Overall Readiness | 5 | Good prototype foundation, not ready for broad feature expansion without structural cleanup. |

## Top 5 Strengths

1. `README.md` provides realistic local setup, Supabase, Google Calendar, Vercel, and environment-variable guidance.
2. `docs/` is broad and organized across architecture, platform, database, development, UI, planning, product, modules, and releases.
3. `supabase/schema.sql` enables RLS on current application tables and indexes `user_id`.
4. The frontend already contains high-value working modules: dashboard, tasks, pool, college, finance, quick add, auth gate, and Google Calendar integration.
5. Recent frontend foundation work introduced `src/components/ui`, `src/components/origin`, Tailwind config, shadcn-style aliases, Lucide, and Recharts dependencies.

## Top 10 Risks / Issues

1. `src/App.js` is 2,712 lines and contains too many domains: auth, calendar, data hooks, finance engines, pool logic, college UI, quick add, and root app.
2. Docs describe household-scoped data using `household_id`, but `supabase/schema.sql` implements per-user ownership with `user_id`.
3. `docs/architecture/SYSTEM_ARCHITECTURE.md` says the target stack includes TypeScript, but the app is plain JavaScript and no TypeScript config exists.
4. `docs/architecture/FOLDER_STRUCTURE.md` recommends `src/modules`, `src/hooks`, `src/services`, `src/types`, and `src/routes`, but the actual app uses `src/features` and keeps many modules in `src/App.js`.
5. There is no `supabase/migrations/` folder despite docs requiring migrations for database changes.
6. No GitHub Actions workflows exist under `.github/workflows`, so lint/build checks are not enforced in PRs.
7. No test files or dedicated test script exist; `package.json` defines lint/build/check only.
8. `api/brief.js` accepts browser requests by origin only and does not require a signed-in Supabase user or rate limiting.
9. Google Calendar access tokens and several AI/history/dismissal values are stored in `localStorage` in `src/App.js`.
10. Seed/fallback behavior in `useTable` can mask persistence/RLS errors by showing `src/data/seed.js` data after failed loads.

## Highest Priority Recommendations

1. Split `src/App.js` into module files, shared hooks, data services, and domain helpers before adding more feature surface.
2. Reconcile the data model: decide whether Phase 2 remains single-user or moves to household scope, then update schema, docs, and code together.
3. Add a migration strategy under `supabase/migrations/` and stop treating `supabase/schema.sql` as the only executable database history.
4. Add GitHub Actions for `pnpm install`, `pnpm run lint`, and `pnpm run build`.
5. Add focused tests around date recurrence, finance projections, pool recommendations, Supabase data wrappers, and API request validation.
6. Harden the AI API route with user authentication, request limits, and logging/error boundaries appropriate for family data.

## Fix Before More Feature Development

- Reduce `src/App.js` to a thin app shell and move Pool, Finance, College, Quick Add, Google Calendar, auth, and shared calculations into explicit modules.
- Resolve the `household_id` versus `user_id` contradiction.
- Add migration and CI workflows.
- Add at least minimal unit tests for shared business logic.
- Document actual implemented API contracts for `api/brief.js` and Supabase table operations.

## Verification

Checks run after creating audit docs:

- `pnpm run check` with the normal shell PATH failed before linting because `node` was not recognized by PowerShell.
- Retried with the bundled Codex Node runtime on PATH using the repo-defined `pnpm run check`.
- Result: passed. `eslint src --ext .js,.jsx` completed with 0 errors and 19 warnings, all in `src/App.js`.
- `react-scripts build` completed successfully with warnings matching the ESLint warnings.
- No implementation fixes were made, per audit-only instructions.
