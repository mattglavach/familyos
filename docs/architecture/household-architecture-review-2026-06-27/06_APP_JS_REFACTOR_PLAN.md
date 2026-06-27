# App.js Refactor Plan

Review date: 2026-06-27

## Current `src/App.js` Issues

`src/App.js` is doing too much. Current major boundaries:

- Google Calendar hook starts at `src/App.js:33`.
- Supabase auth hook starts at `src/App.js:411`.
- Data hook starts at `src/App.js:489`.
- College module starts at `src/App.js:528`.
- Pool brief starts at `src/App.js:826`.
- Pool module starts at `src/App.js:1034`.
- Finance module starts at `src/App.js:1875`.
- Quick Add starts at `src/App.js:2566`.
- Root app starts at `src/App.js:2764`.

The root app also passes many helpers through a `deps` prop to extracted features (`src/App.js:2821-2824`), which is a sign that shared hooks/domain functions should move into modules.

## Recommended Folder Structure

Keep `src/features` since it already exists, and update docs later to match. Recommended target:

```text
src/
  app/
    AppShell.js
    navigation.js
    householdContext.js
  components/
    common/
    ui/
    origin/
  domain/
    calendar.js
    college.js
    finance.js
    pool.js
    tasks.js
  features/
    dashboard/
    tasks/
    pool/
    finance/
    college/
    quick-add/
    settings/
  hooks/
    useSupabaseAuth.js
    useActiveHousehold.js
    useTable.js
    useGoogleCalendar.js
  services/
    supabaseClient.js
    tableService.js
    briefApi.js
    calendarApi.js
  data/
    seed.js
  lib/
    dates.js
    utils.js
```

## Proposed Route Structure

The app can keep mobile bottom tabs initially:

- `/` or `/home`
- `/finance`
- `/pool`
- `/tasks`
- `/college`
- `/settings`

If a router is not added immediately, keep tab state but isolate it in `src/app/navigation.js` so route migration is easier later.

Future nested views:

- `/documents`
- `/calendar`
- `/home-maintenance`
- `/settings/household`
- `/settings/members`
- `/ai`

## Shared Layout / Components Strategy

- Move root header/nav into `src/app/AppShell.js`.
- Keep low-level primitives in `src/components/ui`.
- Keep app-specific primitives in `src/components/common`.
- Add shared composed components only after repeated usage is clear:
  - `StatusCard`
  - `ModuleHeader`
  - `SegmentedControl`
  - `ChipGroup`
  - `FormDrawer`
  - `MetricRow`

## Feature Module Organization

Each feature should own:

- Main screen component.
- Feature-specific forms.
- Feature-specific cards/lists.
- Feature-specific hooks if not shared.
- Feature docs/tests where useful.

Each feature should not own:

- Supabase client initialization.
- Global auth state.
- Household context.
- Cross-module domain helpers.
- Low-level UI primitives.

## Step-By-Step Refactor Plan

1. Extract `useSupabaseAuth` into `src/hooks/useSupabaseAuth.js`.
2. Extract `useTable` into `src/hooks/useTable.js`, preserving current behavior.
3. Extract `useGoogleCalendar` and `assignMember` into `src/hooks/useGoogleCalendar.js` and `src/domain/calendar.js`.
4. Extract pure pool helpers into `src/domain/pool.js`.
5. Extract `Pool` and `PoolBrief` into `src/features/pool/`.
6. Extract pure finance helpers into `src/domain/finance.js`.
7. Extract `Finance` into `src/features/finance/`.
8. Extract college helpers and `College` into `src/features/college/`.
9. Extract `QuickAdd` into `src/features/quick-add/`.
10. Move root app shell/navigation into `src/app/`.
11. Add household context after the data model migration decision is final.

## Risk Mitigation

- Make one extraction at a time.
- Run `pnpm run check` after each extraction.
- Preserve exports and behavior before changing UX.
- Avoid schema changes during initial refactor.
- Do not change business logic while moving files.
- Add tests for domain helpers as they are extracted.
- Keep `src/App.js` as orchestrator until each extracted module is stable.

## Refactor Acceptance Criteria

- `src/App.js` is reduced to app composition, auth gate, and shell wiring.
- No feature module depends on a large `deps` object from `App`.
- Shared calculations can be imported and tested directly.
- Build and lint pass with no new warnings.
- App behavior remains unchanged.

