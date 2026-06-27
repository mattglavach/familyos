# Folder Structure

Current modular structure:

```text
src/
  App.js                 # compatibility entry point
  app/
    App.js               # app shell and tab composition
    navigation/
    layouts/
    providers/
    routes/
  components/
    common.js
    layout/
    ui/
    origin/
  modules/
    dashboard/
    finance/
    pool/
    quick-add/
    tasks/
    college/
    retirement/
    documents/
    settings/
  hooks/
  lib/
  services/
    api/
    supabase/
  context/
  utils/
  types/
  data/

supabase/
  schema.sql
  seed.sql
  backfill-user-id.sql

docs/
```

## Rules
- App shell, tab composition, and global layout belong in `src/app`.
- User-facing modules belong in `src/modules/<module>`.
- Module-specific components stay inside their module.
- Shared UI primitives stay in `src/components/ui`.
- Shared app-level components stay in `src/components`.
- Reusable hooks stay in `src/hooks`.
- Supabase and API logic should be centralized in `src/services` or `src/lib`.
- Shared utilities stay in `src/utils` or `src/lib`.
- Types should be reusable and explicit if/when TypeScript is introduced.