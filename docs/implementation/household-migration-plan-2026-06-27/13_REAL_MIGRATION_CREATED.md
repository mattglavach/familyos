# Real Migration Created

Created date: 2026-06-28

## Source Draft Used

Source draft:

- `docs/implementation/household-migration-plan-2026-06-27/draft_sql/2026-06-27_household_foundation_draft.sql`

Validation reference:

- `docs/implementation/household-migration-plan-2026-06-27/11_REVISED_DRAFT_VALIDATION.md`

## Real Migration File Path

Created local-only migration file:

- `supabase/migrations/20260627000000_household_foundation.sql`

The repository did not previously have a `supabase/migrations/` folder, so this task established that folder for local migration work.

The SQL body was copied from the validated draft. The file header was changed from draft-only wording to local-only migration wording so the real migration file clearly says not to apply it to production.

## Application Status

The migration was **not applied**.

No Supabase commands were run. No database was modified. No production data was touched. App queries were not updated.

## Local-Only Application Checklist

Before applying locally:

- [ ] Confirm branch is `feature/household-foundation`.
- [ ] Confirm worktree is clean.
- [ ] Confirm local Supabase environment is disposable or backed up.
- [ ] Confirm local schema baseline matches `supabase/schema.sql`.
- [ ] Confirm local Supabase provides `auth.uid()`, `anon`, and `authenticated`.
- [ ] Review `supabase/migrations/20260627000000_household_foundation.sql` manually.
- [ ] Confirm null `user_id` rows are acceptable for local dry run.
- [ ] Confirm every auth user should receive a default household.
- [ ] Confirm `familyos_internal` should remain inaccessible to `anon` and `authenticated`.
- [ ] Prepare rollback/reset steps before applying locally.

After applying locally:

- [ ] Confirm preflight notices are expected.
- [ ] Confirm postflight block completes.
- [ ] Confirm `profiles` count is at least auth user count.
- [ ] Confirm `familyos_internal.household_bootstrap_map` maps auth users to households.
- [ ] Confirm active owner memberships exist.
- [ ] Confirm legacy rows with `user_id` have `household_id`.
- [ ] Confirm current app still loads using existing module-table `user_id` RLS.
- [ ] Confirm no module-table household RLS has been enabled yet.

## Known Production Blockers

- Migration has not been applied or tested locally.
- Production schema has not been compared against the repository baseline.
- Production row counts and null `user_id` counts are unknown.
- App code does not yet resolve active household context.
- New auth users after migration still need a bootstrap path.
- Module-table household RLS is intentionally not included yet.
- Rollback/reset process needs local proof before production planning.

## Next Prompt To Apply Locally

```text
Family OS household foundation implementation: apply the household foundation migration locally only.

Do not modify production data.
Do not run commands against a linked production Supabase project.
Do not update app queries yet.

Use:
- supabase/migrations/20260627000000_household_foundation.sql
- docs/implementation/household-migration-plan-2026-06-27/13_REAL_MIGRATION_CREATED.md

Tasks:
1. Confirm branch is feature/household-foundation.
2. Confirm worktree is clean.
3. Confirm Supabase is local-only and not linked to production.
4. Apply the migration locally only.
5. Capture preflight/postflight output.
6. Run static verification queries locally.
7. Do not change app code.
8. Document results before any app query updates.
```
