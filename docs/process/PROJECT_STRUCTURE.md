# Project Structure

This document defines expected folder organization and responsibilities. It extends `docs/architecture/FOLDER_STRUCTURE.md`.

## Source
```text
src/
  App.js
  app/
  components/
  context/
  data/
  hooks/
  lib/
  modules/
  services/
  styles.css
  theme.js
  utils/
```

## Responsibilities
- `src/App.js`: compatibility entry point only.
- `src/app/`: app shell, tab composition, providers, layouts, navigation, and route-level orchestration.
- `src/components/ui/`: reusable primitives such as buttons, cards, badges, inputs, labels, selects, dialogs, drawers, and skeletons.
- `src/components/`: shared app-level components that are not module-specific.
- `src/context/`: app-wide state such as auth, active household, and shared connection context.
- `src/hooks/`: reusable behavior and data access hooks.
- `src/lib/`: low-level clients, Supabase helpers, and shared integration utilities.
- `src/services/`: future service contracts and API-facing abstractions when logic outgrows hooks.
- `src/modules/<module>/`: user-facing module screens and module-specific helpers.
- `src/data/`: seed/fallback data.
- `src/utils/`: pure shared helpers.

## API And Serverless
- `api/`: Vercel serverless routes. Keep server-only secrets here or in Supabase, never in frontend code.

## Supabase
- `supabase/schema.sql`: baseline schema.
- `supabase/migrations/`: ordered migrations.
- `supabase/seed.sql`: optional seed data.
- Local-only or historical SQL must be clearly documented as not for production.

## Documentation
- `docs/process/`: durable engineering governance and playbooks.
- `docs/templates/`: reusable specs and report templates.
- `docs/planning/`: roadmap, status, debt, decisions, and release planning.
- `docs/architecture/`: architecture decisions, system design, folder structure, deployment, routing, and auth.
- `docs/database/`: schema, RLS, naming, migration validation.
- `docs/modules/`: module-level product and architecture notes.
- `docs/releases/`: release notes and changelog.

## Rules
- Do not create a new top-level folder when an existing folder has the correct responsibility.
- Do not place module-specific code in shared folders unless it is genuinely reusable.
- Do not place shared auth, household, or Supabase behavior inside a single module.
