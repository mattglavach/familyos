# Test And Validation Plan

Plan date: 2026-06-27

## Local Validation Steps

1. Start from a clean branch/worktree.
2. Confirm current baseline commit and schema.
3. Run dependency install only if needed.
4. Run `pnpm run check` before any migration draft work.
5. Create a disposable/local Supabase environment.
6. Apply draft migrations locally only after review.
7. Run backfill locally.
8. Run app smoke tests against local/disposable database.

## Supabase Validation Steps

Before applying anywhere:

- Review generated SQL manually.
- Confirm no destructive SQL is present.
- Confirm no `drop column user_id`.
- Confirm no production project target is selected.
- Confirm backup/export exists.

After local apply:

- Verify foundation tables exist.
- Verify default households created.
- Verify owner memberships created.
- Verify every current table has expected `household_id` values.
- Verify indexes exist.
- Verify old `user_id` values still exist.

## App Behavior Checks

Manual smoke checklist:

- Sign in with magic link.
- Auth gate still works.
- Home dashboard loads.
- Tasks load.
- Add/edit/complete task works.
- Home maintenance loads.
- Pool readings load.
- Add pool reading works.
- Finance loads.
- College planning loads.
- Quick Add creates task, note, and pool reading.
- Google Calendar connect still works.
- Sign out works.

## RLS Tests

Personas:

- Owner user.
- Adult user in same household.
- Authenticated non-member.
- Child profile with no login.
- Guest future role with no active access.

Tests:

- Owner can read/write all first-migration household tables.
- Adult can read/write shared operational tables.
- Adult can access sensitive tables only if policy allows owner/adult.
- Adult cannot manage members/settings if owner-only.
- Non-member cannot select, insert, update, or delete household rows.
- Insert with another household id fails.
- Child profile has no direct database access.
- Guest future has no direct database access.

## Regression Checks

Code checks:

- `pnpm run lint`
- `pnpm run build`
- `pnpm run check`

Known current baseline:

- Previous checks passed with 19 existing warnings in `src/App.js`.
- Warning cleanup is separate unless migration work changes those lines.

## Build / Lint / Check Commands

Preferred command:

```bash
pnpm run check
```

If local shell cannot find Node, use the bundled Codex runtime path as done in prior verification. Do not change project config just to run checks.

## Manual Smoke Test Checklist

- [ ] App starts.
- [ ] Missing env screen still works if env is absent.
- [ ] Auth session loads.
- [ ] User can sign in.
- [ ] Active/default household resolves.
- [ ] Home tab data is visible.
- [ ] Tasks tab data is visible.
- [ ] Pool tab data is visible.
- [ ] Finance tab data is visible.
- [ ] College tab data is visible.
- [ ] Quick Add writes rows with household context.
- [ ] Non-member cannot access household rows in direct Supabase tests.
- [ ] Owner/adult can access expected sensitive modules.

