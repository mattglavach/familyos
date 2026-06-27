# Phased Execution Plan

Decision date: 2026-06-27

## Phase 0: Prepare And Protect Current State

Objective: make the current app and data model safe to change.

Tasks:

- Confirm current worktree state and avoid mixing unrelated changes.
- Inventory current tables from `supabase/schema.sql`.
- Map each current table from `user_id` ownership to future `household_id`.
- Confirm role names and first-migration scope.
- Decide whether one user can belong to multiple households in v1.
- Prepare migration rollback notes before writing SQL.

Files likely affected:

- `docs/decisions/2026-06-27-household-architecture/*`
- `docs/database/*`
- `docs/architecture/*`
- Future: `supabase/migrations/*`

Checks to run:

- `pnpm run check`
- Manual review of staged files

Acceptance criteria:

- Decision record accepted.
- Table ownership map exists.
- Open decisions are either resolved or explicitly deferred.
- No schema migration has been run yet.

Rollback considerations:

- Documentation-only phase. Revert docs if decision changes.

## Phase 1: Schema Foundation

Objective: add household foundation without breaking current user-scoped app behavior.

Tasks:

- Create `supabase/migrations/`.
- Add foundation tables: `profiles`, `households`, `household_members`, `people`.
- Add indexes and timestamps.
- Add minimal RLS for foundation tables.
- Create default household strategy for existing users.

Files likely affected:

- `supabase/migrations/*`
- `supabase/schema.sql`
- `docs/database/DATABASE_SCHEMA.md`
- `docs/database/SECURITY_RLS.md`

Checks to run:

- SQL review before execution.
- Local migration dry run if local Supabase workflow exists.
- `pnpm run check`

Acceptance criteria:

- Existing app can still load using current `user_id` policies.
- No existing table data is changed in this phase unless explicitly planned.
- Foundation tables are ready for backfill.

Rollback considerations:

- Drop newly added foundation tables only if no existing table data depends on them.
- Do not remove current `user_id` policies.

## Phase 2: App Data Access Update

Objective: prepare the app to read/write with active household context while preserving current behavior.

Tasks:

- Extract `useSupabaseAuth` from `src/App.js`.
- Extract `useTable` from `src/App.js`.
- Add active household resolution design.
- Update data service plan so table operations can scope by `household_id`.
- Keep compatibility with existing `user_id` rows.

Files likely affected:

- `src/App.js`
- `src/hooks/useSupabaseAuth.js`
- `src/hooks/useTable.js`
- `src/services/*`
- `src/lib/supabase.js`

Checks to run:

- `pnpm run lint`
- `pnpm run build`
- Manual sign-in and module smoke test

Acceptance criteria:

- Auth and table access behavior remains unchanged before household enforcement.
- Active household context has a single clear source.
- No feature module directly invents household filtering.

Rollback considerations:

- Revert hook/service extraction while leaving schema foundation intact.
- Keep data writes compatible with existing columns.

## Phase 3: RLS / Security Enforcement

Objective: make household membership the real access-control boundary.

Tasks:

- Add `household_id` to current app tables.
- Backfill `household_id` from existing `user_id` ownership.
- Add membership-based RLS helper functions.
- Add household policies for general and sensitive tables.
- Keep or stage removal of old user-only policies after verification.

Files likely affected:

- `supabase/migrations/*`
- `supabase/schema.sql`
- `docs/database/SECURITY_RLS.md`
- `docs/platform/02_database_schema.md`

Checks to run:

- RLS smoke tests for owner/adult/child/non-member.
- Data visibility tests before and after policy changes.
- `pnpm run check`

Acceptance criteria:

- Household member can access allowed household rows.
- Non-member cannot access household rows.
- Child role cannot access adult-only modules.
- Existing data remains visible to its migrated owner household.

Rollback considerations:

- Keep `user_id` and old policies until household policy verification passes.
- Roll back policy changes before rolling back columns.

## Phase 4: `src/App.js` Refactor

Objective: split the monolithic app before adding more modules.

Tasks:

- Extract calendar hook and helpers.
- Extract Pool feature and pool domain helpers.
- Extract Finance feature and finance domain helpers.
- Extract College feature and college helpers.
- Extract Quick Add feature.
- Move shell/navigation toward `src/app`.

Files likely affected:

- `src/App.js`
- `src/features/pool/*`
- `src/features/finance/*`
- `src/features/college/*`
- `src/features/quick-add/*`
- `src/domain/*`
- `src/hooks/*`
- `src/app/*`

Checks to run:

- `pnpm run check` after each extraction.
- Manual smoke test for Home, Finance, Pool, Tasks, College, Quick Add, auth, and calendar.

Acceptance criteria:

- `src/App.js` becomes app composition rather than business/domain implementation.
- No large `deps` object is needed for feature modules.
- Existing module behavior remains intact.

Rollback considerations:

- Extract one feature per commit.
- Revert only the failing extraction, not the household schema foundation.

## Phase 5: Validation And Cleanup

Objective: remove transitional risk and prepare for new feature work.

Tasks:

- Resolve existing ESLint warnings.
- Update docs to reflect current household implementation.
- Add focused tests for extracted domain helpers.
- Add RLS verification docs.
- Decide timing for invitation UX, guest access, and AI context expansion.

Files likely affected:

- `src/*`
- `docs/*`
- `supabase/*`
- `package.json` if test scripts are added

Checks to run:

- `pnpm run check`
- Any new test script
- Manual smoke test

Acceptance criteria:

- Household migration is documented and verified.
- No known lint warnings remain unless intentionally documented.
- New feature development can resume against household-safe patterns.

Rollback considerations:

- Cleanup changes should be small and independently revertible.

