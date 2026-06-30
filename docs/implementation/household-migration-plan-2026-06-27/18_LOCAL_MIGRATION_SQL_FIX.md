# Local Migration SQL Fix

## Error Encountered

Local Supabase startup failed while applying:

- `supabase/migrations/20260627_household_foundation.sql`

The reported SQL error was:

```text
column reference "table_name" is ambiguous
```

## Root Cause

The migration used a PL/pgSQL variable named `table_name` inside multiple `do $$` blocks while also reading from the temporary table `migration_module_tables`, which has a column named `table_name`.

In PL/pgSQL, an unqualified identifier can conflict with a local variable and a selected column name. The preflight dynamic SQL builder included an unqualified `table_name` reference, which made the statement ambiguous.

## Files Changed

- `supabase/migrations/20260627_household_foundation.sql`

## Exact Fix Made

- Renamed the PL/pgSQL loop variable from `table_name` to `module_table_name`.
- Updated related `for` loops and `execute format(...)` calls to use `module_table_name`.
- Qualified the dynamic preflight aggregation over `migration_module_tables` with alias `mt`, including `mt.table_name`.
- Preserved the temporary table column name `table_name` because it is part of the migration's internal table list, not the source of the bug by itself.

No migration behavior was intentionally changed beyond resolving the SQL ambiguity.

## Production Safety

No production commands were run.

Do not run remote Supabase commands for this local validation path.

## Next Local Retry Commands

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
