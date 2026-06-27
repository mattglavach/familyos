# Before And After Structure

Date: 2026-06-27

## Before

```text
src/
  App.js                 # auth, app shell, hooks, domain helpers, Pool, Finance, College, Quick Add
  components/common.js
  components/ui/*
  data/seed.js
  features/dashboard/Dashboard.js
  features/tasks/Tasks.js
  lib/dates.js
  lib/supabase.js
  theme.js
```

## After

```text
src/
  App.js                 # compatibility entry point
  app/
    App.js               # app shell and tab composition
    navigation/tabs.js
    layouts/
    providers/
    routes/
  hooks/
    useGoogleCalendar.js
    useSupabaseAuth.js
    useTable.js
  modules/
    college/College.js
    dashboard/Dashboard.js
    finance/Finance.js
    pool/Pool.js
    quick-add/QuickAdd.js
    tasks/Tasks.js
    retirement/
    documents/
    settings/
  components/
    common.js
    layout/
    ui/
  services/
    api/
    supabase/
  context/
  utils/status.js
  types/
```

## Notes

Dashboard and Tasks have been moved into `src/modules` with the other user-facing modules. Empty target folders are intentional placeholders for upcoming household migration and module work.