# Code Quality Review

Audit date: 2026-06-27

## Large Files

Largest relevant source/docs files excluding dependencies and build artifacts:

| File | Lines | Concern |
| --- | ---: | --- |
| `src/App.js` | 2,712 | Main bottleneck; too many domains and responsibilities. |
| `src/features/tasks/Tasks.js` | 356 | Acceptable for a feature, but should eventually split cards/forms/helpers. |
| `supabase/schema.sql` | 239 | Manageable, but should move to migrations. |
| `src/features/dashboard/Dashboard.js` | 237 | Acceptable, but tightly coupled through injected `deps`. |
| `src/data/seed.js` | 92 | Reasonable, but fallback behavior can mask real data failures. |
| `src/components/common.js` | 81 | Reasonable, but common components and UI primitives need clearer boundaries. |
| `api/brief.js` | 74 | Manageable, but security and auth should be strengthened. |

## Duplicated Logic

- Add/edit modal patterns are repeated across tasks, pool, finance, college, and quick add.
- Chip/segmented controls are repeated inline instead of using a shared component.
- Save/update error handling differs between `useTable`, `QuickAdd`, and feature modules.
- Date status calculations exist in multiple places through injected helpers and local functions.
- Domain-specific formatting and calculations are mixed into UI files.

## Dead Code / TODOs / Debugging

- `rg` did not find `TODO` or `FIXME` in reviewed paths.
- `console.error` appears in `src/App.js` inside `useTable` error handling. That may be acceptable for development, but production UX needs visible error states.
- `showMsDo` in `src/features/tasks/Tasks.js` references Microsoft To Do and Claude settings, but there is no actual connector integration in this repo. This reads as placeholder UX.

## Error Handling

Current concerns:

- `useTable` falls back to seed data on select errors, which can hide RLS, network, and schema failures.
- Some write operations optimistically update local state after Supabase errors.
- Several direct inserts in Quick Add show `Save failed`, while other operations silently return or close.
- API errors from `api/brief.js` are proxied, but there is no structured app-level error taxonomy.

Recommendation: centralize user-visible error handling and avoid silently substituting seed data after real persistence failures in authenticated sessions.

## TypeScript / ESLint / Build Configuration

- `package.json` defines `lint`, `build`, and `check`.
- ESLint extends `react-app`.
- `docs/architecture/SYSTEM_ARCHITECTURE.md` says TypeScript is target stack, but there is no TypeScript setup.
- `docs/archive/development-baseline/CODING_STANDARDS.md` includes historical TypeScript guidance, while current active coding guidance lives in `docs/process/CODING_STANDARDS.md`.
- Tailwind and shadcn-style config exist, but much of the existing app still relies on inline styles from `src/theme.js`.

## Test Coverage Gaps

No test files were found. High-priority test candidates:

- `src/lib/dates.js`: date parsing, `daysBetween`, `nextDueDate`, today handling.
- Pool domain logic: health score, safe-to-swim status, chemical recommendations, stale readings.
- Finance domain logic: future value, contribution frequency, Monte Carlo boundaries, retirement projection.
- Tasks: recurring task completion and effective due dates.
- `src/lib/supabase.js`: wrapper behavior for select/insert/update/delete errors.
- `api/brief.js`: method rejection, CORS origin rejection, payload validation, tool filtering, token cap.

## Refactoring Candidates

Immediate candidates:

- `useSupabaseAuth` from `src/App.js`.
- `useGoogleCalendar` from `src/App.js`.
- `useTable` from `src/App.js`.
- Pool calculations from `src/App.js`.
- Finance calculations from `src/App.js`.
- College timeline helpers from `src/App.js`.
- Quick Add from `src/App.js`.

Next candidates:

- Shared form field components.
- Shared chip/segmented controls.
- Shared drawer/modal form shell.
- Shared status card/list row patterns.

## Build / Lint / Test Issues

Checks should be run after the audit files are created. Do not fix check failures as part of this audit-only task.
