# Architecture Review

Audit date: 2026-06-27

## Current Architecture Assessment

FamilyOS is currently a Create React App single-page application with internal tab navigation, Supabase client-side persistence, Google Calendar OAuth token integration, and one Vercel serverless API route for Anthropic messages.

The architecture is functional for a prototype, but it is not yet the modular platform described in `docs/architecture/SYSTEM_ARCHITECTURE.md` and `docs/platform/*.md`.

## Module Boundaries

Implemented or partially extracted:

- `src/features/dashboard/Dashboard.js`
- `src/features/tasks/Tasks.js`
- `src/components/common.js`
- `src/components/ui/*.jsx`
- `src/lib/supabase.js`
- `src/lib/dates.js`

Still centralized in `src/App.js`:

- Supabase auth hook.
- `useTable` persistence hook.
- Google Calendar hook and member assignment.
- Pool calculations and Pool UI.
- College timeline and College UI.
- Finance calculations and Finance UI.
- AI brief history and request flow.
- Quick Add UI.
- Root navigation and layout.

## Scalability Risks

- Adding finance, pool, retirement, college, tasks, documents, vehicles, medical, travel, and AI modules into the current `src/App.js` pattern will make changes slow and risky.
- Domain calculations are mixed with rendering, so they are hard to test without rendering the app.
- `useTable` is generic but underpowered for relationship-heavy data, optimistic updates, pagination, filtering, and consistent error handling.
- Internal tab state is simple, but deep links, browser history, route-level permissions, and module-specific nested views will be difficult without routing.
- The docs describe shared platform entities, but current code uses module-specific tables and direct table hooks.

## Maintainability Risks

- `src/App.js` line count is the main risk: 2,712 lines.
- Many UI elements use inline styles via `S` and local object spreads. This keeps the prototype fast but makes systematic UI migration harder.
- Domain logic and UI are coupled. Examples include pool health, finance projections, Monte Carlo logic, and college timeline construction in `src/App.js`.
- Error handling is inconsistent. `useTable` logs errors and falls back to seed/local state, while some direct inserts surface errors to the user.
- The app has no tests around business-critical calculations.

## Data Flow Concerns

- Frontend code reads and writes Supabase directly using the browser anon key and current user session.
- `useTable` falls back to `SEED[table]` when Supabase errors occur. This can make a broken RLS policy or network issue appear as a populated app.
- There is no central query invalidation, cache management, or typed model validation.
- Current table reads appear to load full tables per module without pagination.
- The API route `api/brief.js` is separate from Supabase auth and does not validate the app user session.

## Routing / Navigation

- Root navigation is a state variable in `src/App.js`: `home`, `finance`, `pool`, `tasks`, and `college`.
- This matches the mobile-first bottom-tab pattern, but it does not support direct URLs, module subroutes, or browser back/forward semantics.
- Docs should state that routing is currently tab-state based, or the app should adopt a router before module complexity grows.

## Recommended Architectural Improvements

1. Extract hooks:
   - `useSupabaseAuth`
   - `useTable`
   - `useGoogleCalendar`
   - AI brief history/request hooks

2. Extract domain logic:
   - `src/domain/pool.js`
   - `src/domain/finance.js`
   - `src/domain/college.js`
   - `src/domain/tasks.js`

3. Extract remaining features:
   - `src/features/pool/Pool.js`
   - `src/features/finance/Finance.js`
   - `src/features/college/College.js`
   - `src/features/quick-add/QuickAdd.js`

4. Add a real service boundary:
   - Supabase table services
   - AI brief client
   - Google Calendar client helpers

5. Add tests before major refactors:
   - Date recurrence.
   - Pool recommendations.
   - Finance projections.
   - Supabase wrapper behavior.
   - API request validation.

6. Decide on routing:
   - Keep bottom tabs, but add route-aware navigation if deep linking matters.

