# Repository Structure Audit

Audit date: 2026-06-27

## Current Structure Overview

Current top-level structure:

```text
.github/
api/
build/
docs/
node_modules/
public/
src/
supabase/
AGENTS.md
README.md
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
vercel.json
```

Important application paths:

- `src/App.js` is the main app shell and still contains most domain and UI logic.
- `src/features/dashboard/Dashboard.js` and `src/features/tasks/Tasks.js` are the only extracted feature modules.
- `src/components/common.js` holds shared modal/loading/swipe/sparkline components.
- `src/components/ui/` contains shadcn-style primitives.
- `src/components/origin/drawer.jsx` contains an Origin UI-style drawer primitive.
- `src/lib/supabase.js` wraps Supabase client usage.
- `src/lib/dates.js` contains date helpers.
- `src/data/seed.js` contains fallback data.
- `api/brief.js` is the only serverless API route.
- `supabase/schema.sql`, `supabase/seed.sql`, and `supabase/backfill-user-id.sql` hold database setup scripts.

## Strengths

- Top-level separation between `src/`, `api/`, `docs/`, `public/`, `supabase/`, and `.github/` is clear.
- Documentation is centralized under `docs/` with useful category folders.
- Static assets are isolated under `public/`.
- Server-only API logic is isolated in `api/brief.js`.
- Initial feature extraction has started with `src/features/dashboard/Dashboard.js` and `src/features/tasks/Tasks.js`.
- Shared UI primitives have started moving into `src/components/ui/`.

## Issues

- `src/App.js` is the structural bottleneck: 2,712 lines and about 240 KB. It contains root navigation plus auth, Google Calendar, data hooks, pool, finance, college, quick add, and domain calculations.
- `docs/architecture/FOLDER_STRUCTURE.md` recommends `src/modules`, `src/hooks`, `src/services`, `src/types`, `src/routes`, and `src/assets`, but the actual structure does not include most of these folders.
- The repo uses `src/features`, while docs recommend `src/modules`. Either convention can work, but the mismatch should be resolved.
- `build/` exists in the local worktree. It is ignored by guidance and should not be committed, but its presence can confuse audits and file-size reports.
- `node_modules/` exists locally. This is expected after install, but should remain untracked.
- No `tests/`, `__tests__/`, or test-specific folder exists.
- No `supabase/migrations/` folder exists, despite AGENTS guidance and platform docs expecting migrations.
- There is no `src/services/` layer for data access beyond `src/lib/supabase.js`.
- There is no `src/hooks/` folder even though hooks like `useTable`, `useGoogleCalendar`, and Supabase auth logic are significant.

## Missing Folders / Files

- `.github/workflows/` for CI.
- `supabase/migrations/` for database history.
- `src/hooks/` for `useTable`, auth, Google Calendar, AI brief history, and module hooks.
- `src/services/` for API and Supabase data access.
- `src/modules/` or a documented decision to standardize on `src/features/`.
- `src/features/pool/`, `src/features/finance/`, `src/features/college/`, and `src/features/quick-add/`.
- Test folders and sample tests.
- API contract documentation for `api/brief.js` tied to implementation.

## Duplicate Or Confusing Areas

- `docs/database/DATABASE_SCHEMA.md`, `docs/platform/02_database_schema.md`, and `supabase/schema.sql` describe different levels of database truth. The docs describe household-scoped platform entities; the SQL implements user-scoped module tables.
- `docs/architecture/FOLDER_STRUCTURE.md` and the actual `src/features` folder conflict on naming.
- Module docs exist for many future modules, but the source code only has partial extraction for Dashboard and Tasks.
- `src/components/common.js` and `src/components/ui/` overlap in purpose. Common components are app-specific; UI primitives are lower-level, but this boundary should be documented.

## Recommended Future Structure

Use one naming convention and migrate incrementally. If keeping `features`, document it and update architecture docs:

```text
src/
  app/
    AppShell.js
    navigation.js
  components/
    common/
    ui/
    origin/
  features/
    dashboard/
    tasks/
    pool/
    finance/
    college/
    quick-add/
  hooks/
    useSupabaseAuth.js
    useTable.js
    useGoogleCalendar.js
  services/
    supabaseClient.js
    briefApi.js
  domain/
    dates.js
    finance.js
    pool.js
    tasks.js
  data/
    seed.js
  styles.css

supabase/
  migrations/
  seed/
  schema.sql
```

Priority sequence:

1. Extract hooks and services from `src/App.js`.
2. Extract Pool, Finance, College, and Quick Add into feature folders.
3. Move pure calculations into `src/domain/`.
4. Add test files beside domain helpers or under `src/__tests__/`.
5. Update `docs/architecture/FOLDER_STRUCTURE.md` to match the chosen convention.

