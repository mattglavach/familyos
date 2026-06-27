# App Structure Refactor Summary

Date: 2026-06-27

## What Changed

The application was reorganized from a monolithic `src/App.js` into a modular structure while preserving existing behavior and UI.

Key changes:

- `src/App.js` is now a small compatibility entry point that exports `src/app/App.js`.
- App shell, header, global interaction styles, and bottom navigation live in `src/app/App.js` and `src/app/navigation/tabs.js`.
- Auth, Google Calendar, and table-loading hooks moved to `src/hooks/`.
- College, Pool, Finance, and Quick Add moved to `src/modules/`.
- Shared status helpers moved to `src/utils/status.js`.
- Existing `src/features/dashboard` and `src/features/tasks` remain in place for compatibility.

## Why

The previous `src/App.js` carried auth, Google Calendar, data access, routing/tab state, finance engines, pool logic, college UI, quick add, and app shell rendering. Splitting those responsibilities creates clear module boundaries before any household migration work begins.

## Behavior

No database behavior, API behavior, authentication behavior, or UI design was intentionally changed.
