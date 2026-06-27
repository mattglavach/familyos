# Folder Structure

Recommended structure:

```text
src/
  components/
    common/
    layout/
    forms/
    charts/
  modules/
    dashboard/
    finance/
    pool/
    garden/
    tasks/
    college/
    retirement/
    home/
    vehicles/
    documents/
  hooks/
  lib/
  services/
  types/
  routes/
  assets/

supabase/
  migrations/
  seed/

docs/
```

## Rules
- Module-specific components stay inside their module.
- Shared components go in components/common.
- Supabase logic should be centralized in services or lib.
- Types should be reusable and explicit.
