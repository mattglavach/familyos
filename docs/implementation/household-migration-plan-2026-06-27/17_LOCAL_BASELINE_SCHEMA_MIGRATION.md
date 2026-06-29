# Local Baseline Schema Migration

## Why This Was Needed

Local Supabase startup applies SQL files from `supabase/migrations/` in filename order. The repository's current Family OS baseline schema existed in `supabase/schema.sql`, but it was not represented as an earlier migration.

Because of that, local startup attempted to apply `supabase/migrations/20260627_household_foundation.sql` before the baseline module tables existed. The household migration correctly stopped during preflight because required tables such as `tasks`, `pool_readings`, `college_schools`, `retirement_accounts`, and `finance_action_items` were missing.

## File Created

- `supabase/migrations/20260626_baseline_schema.sql`

## Source Schema

- `supabase/schema.sql`

The baseline migration was copied from the current schema with no intentional behavioral changes. It preserves the existing table definitions, `user_id` additions, indexes, and current user-scoped RLS policies from the baseline schema.

## Migration Order

Local Supabase should now apply migrations in this order:

1. `supabase/migrations/20260626_baseline_schema.sql`
2. `supabase/migrations/20260627_household_foundation.sql`

## Production Safety

No production changes were made.

Do not run remote Supabase commands for this local validation path. This baseline migration is intended to unblock local-only database startup and household foundation testing.

## Next Local Validation Commands

Run these only against the local Supabase environment:

```powershell
pnpm dlx supabase stop --no-backup
pnpm dlx supabase start
```

## Commands Not To Run

Do not run:

```powershell
supabase link
supabase db pull
supabase db push
```

Those commands can connect to or modify a remote Supabase project and are outside the local-only household foundation validation scope.

## Notes

- `supabase/migrations/20260627_household_foundation.sql` was not modified.
- Application code was not modified.
- The next validation step should confirm that the baseline migration creates all module tables before the household migration preflight runs.
