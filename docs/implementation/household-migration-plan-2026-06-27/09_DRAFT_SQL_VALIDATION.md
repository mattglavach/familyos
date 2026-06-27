# Draft SQL Validation

Validation date: 2026-06-27

Reviewed files:

- `docs/implementation/household-migration-plan-2026-06-27/draft_sql/2026-06-27_household_foundation_draft.sql`
- `docs/implementation/household-migration-plan-2026-06-27/08_DRAFT_SQL_REVIEW.md`

## Overall Assessment

Status: **not ready to apply**.

The draft is useful as a review artifact and appears structurally coherent for a first household foundation migration, but it should not be promoted to an executable migration yet. The biggest blocker is not table order or syntax; it is safety. If applied as real SQL, it would create new public tables without executable RLS protection, and the backfill is not safe to rerun without creating duplicate households.

No Supabase commands were run. No migration was applied. No production data was touched. No application code was changed.

## Critical Issues

### 1. New foundation tables would be unprotected if executed

The draft creates `profiles`, `households`, `people`, and `household_members` at lines 30-82, but it does not enable RLS on those tables. The only RLS material in the draft is commented at lines 247-291.

This is acceptable for a draft-only planning file, but it is not acceptable for a real Supabase migration. Public schema tables exposed through Supabase APIs should not be created without a deliberate RLS posture.

Recommended change before applying: add a reviewed foundation-table RLS step before any real migration runs. At minimum, enable RLS on the four foundation tables and add policies that allow:

- Users to read their own `profiles` row.
- Active owner/adult members to read their household.
- Active owner/adult members to read household members for their household.
- Active owner/adult members to read household people for their household.
- Owners to manage household settings and membership.

### 2. Backfill is not idempotent

The draft creates a new household for every distinct existing `user_id` at lines 192-205. If this SQL is run twice, the second run can create another household for the same user because there is no durable migration marker, no unique bootstrap key, and no reuse of an existing household.

This does not cause data loss in a single reviewed run, but it is a serious operational risk during local rehearsal or partial reruns.

Recommended change before applying: make the real migration idempotent or explicitly one-shot. Prefer idempotent:

- Add a durable way to identify bootstrap-created households, such as a `bootstrap_source_user_id` column or a separate migration mapping table.
- Reuse an existing bootstrap household for the same legacy user.
- Backfill rows only after the mapping is stable.

### 3. Backfill excludes auth users with no module rows

The temporary backfill user list is built only from existing module rows at lines 153-177. Authenticated users who exist in `auth.users` but have no current module data will not receive a `profile`, `household`, or `owner` membership.

This may be acceptable if the migration scope is only "existing user data," but it must be an explicit owner decision. Otherwise, users with accounts but no rows would need household bootstrap later on first login.

Recommended change before applying: decide whether to bootstrap all auth users or only users with existing app data.

### 4. No preflight checks are embedded

The draft has validation comments at lines 236-245, but no preflight failure conditions. A real migration should fail before writing if required assumptions are false.

Minimum preflight checks:

- Confirm every current shared table has a `user_id` column.
- Confirm existing `user_id` values either match `auth.users.id` or are intentionally excluded.
- Count rows with `user_id is null`.
- Count distinct users to be backfilled.
- Confirm no prior household bootstrap has already run.

### 5. RLS helper uses `security definer` in comments without hardening notes

The commented helper at lines 251-267 is not executable, but it should still be treated carefully. A future `security definer` helper needs explicit search-path control, ownership review, and minimal privileges. The draft sets `search_path = public`, which is good, but the final RLS plan should also avoid recursion and verify helper ownership.

## SQL Structure Review

### Table creation order

Order is valid:

1. `profiles` references `auth.users`.
2. `households` references `auth.users`.
3. `people` references `households`.
4. `household_members` references `households`, `auth.users`, and `people`.

No foreign key dependency appears out of order.

### Foreign keys

The foreign keys are reasonable for the target model:

- `profiles.id -> auth.users(id)` with cascade delete.
- `households.created_by_user_id -> auth.users(id)` with set null.
- `people.household_id -> households(id)` with cascade delete.
- `household_members.household_id -> households(id)` with cascade delete.
- `household_members.user_id -> auth.users(id)` with cascade delete.
- `household_members.person_id -> people(id)` with set null.

Concern: cascading household deletion into `people` and `household_members` is structurally normal, but household deletion should probably be soft-deleted or owner-only in app/RLS. Do not expose hard delete until owner-only policy and backup behavior are reviewed.

### Constraints

The draft constrains:

- `households.status` to `active` or `archived`.
- `people.member_type` to `adult`, `child_profile`, or `other`.
- `household_members.role` to `owner` or `adult`.
- `household_members.status` to `active` or `inactive`.
- `household_members` to require either `user_id` or `person_id`.

These choices are conservative. The main gap is that `household_members` allows both `user_id` and `person_id`, which is useful for linking a login to a person but should be documented. It also allows a `person_id` from a different household than `household_id`; enforcing same-household consistency would require a composite key or trigger later.

### Indexes

Baseline indexes are appropriate:

- Membership lookup by household, user, household/user, and household/role.
- `people(household_id)` and `people(household_id, member_type)`.
- `households(created_by_user_id)` and `households(status)`.
- One `household_id` index on every shared module table.

Compound module indexes are useful and low risk, but they should be reviewed against real query patterns before production because every index adds write overhead.

### Nullable vs non-nullable choices

Good choices:

- `household_id` on existing module tables is nullable initially.
- Existing `user_id` remains untouched.
- `households.created_by_user_id` can become null if the auth user is deleted.

Risky or unresolved choices:

- `people.household_id` is non-null, which is correct for new people records.
- `household_members.household_id` is non-null, which is correct.
- The draft does not add `created_by_user_id` or `updated_by_user_id` to module tables. That is acceptable for a first migration because `user_id` remains attribution, but it should be decided before deprecating `user_id`.

### Can it safely run once?

As pure SQL structure, it likely can run once against a database matching `supabase/schema.sql`. As an operational migration, it should not run yet because:

- Foundation table RLS is missing.
- The backfill assumption has not been verified against real data.
- There is no preflight or postflight assertion.
- The migration is not safe to rerun.
- Rollback behavior is only conceptual.

## Backfill Validation

### One-user-to-one-default-household assumption

The assumption is simple and compatible with current `user_id` ownership, but it is still an assumption. It is valid only if each current auth user represents one household workspace.

This should be accepted explicitly before implementation. If one user has data for multiple real households, the migration would merge those records into one household.

### Duplicate household risk

High for reruns. The draft does not check whether a bootstrap household already exists for a user before inserting another one.

### Existing row mapping

Existing rows map by `target.user_id = backfill.user_id` at lines 225-231. This preserves current ownership and does not delete or modify `user_id`.

Rows with `user_id is null` are not mapped. That is safer than guessing, but those rows need an inventory before migration.

### Data loss risk

Low for a single run because the draft only adds columns, creates tables, inserts bootstrap data, and updates nullable `household_id`.

Data correctness risk is medium because an incorrect user-to-household assumption can assign rows to the wrong household boundary.

### Rollback limitations

Because `user_id` remains, module-row rollback is possible by ignoring or clearing `household_id`. Foundation rows are harder:

- Created households and memberships would need to be identified reliably.
- Without a durable bootstrap marker, deleting only migration-created households is risky.
- If any app writes new household-scoped rows after migration, rollback becomes materially harder.

## Security And RLS Review

### Executable RLS check

Static review found:

- No executable `create policy` statements.
- No executable `alter table ... enable row level security` statements for foundation tables.
- RLS examples are comments only.

This matches the draft-only intent, but it also means the SQL should not be applied as a real migration.

### Should RLS be a separate migration?

Recommendation: **yes, but not after creating unprotected production tables.**

Use two reviewed migration drafts:

1. Foundation schema plus RLS enabled for new foundation tables with minimal policies.
2. Shared module household RLS replacement after app household context and tests exist.

Do not create foundation tables in production with RLS disabled. If the first real migration creates the tables, it should enable RLS on those new tables in the same migration.

### Minimum safe foundation policies

Minimum policies before production:

- `profiles_select_own`: authenticated users can select their own profile.
- `profiles_update_own`: authenticated users can update safe profile fields for themselves.
- `households_select_member`: active owner/adult members can select their household.
- `households_update_owner`: owners can update household settings.
- `household_members_select_member`: active owner/adult members can view members in their household.
- `household_members_manage_owner`: owners can insert/update/deactivate adult members.
- `people_select_member`: active owner/adult members can view people in their household.
- `people_manage_adult`: owner/adult can manage child profile/person records.

Guest and child-login policies should not exist yet.

### Security risks before household-scoped reads/writes

- Users could spoof `household_id` on inserts unless `with check` policies enforce active membership.
- Adult/owner distinctions can be bypassed if policies only check household membership.
- Sensitive finance and college tables need owner/adult-only policies, not generic household-member policies.
- Generic `useTable` error fallback can hide RLS failures by showing seed data.
- Cross-household `person_id` assignment needs enforcement before people are used as assignees or college-planning subjects.

## App Impact Review

### What breaks if this draft is applied as-is?

If the draft is applied exactly as written and existing `user_id` RLS policies remain unchanged, the current app is unlikely to break immediately because:

- Existing module columns remain.
- Existing `user_id` defaults remain from `supabase/schema.sql:251`.
- Existing `familyos_user_all` policies remain from `supabase/schema.sql:257`.
- Added nullable `household_id` fields should not break Supabase selects/inserts.
- The app does not appear to query the new foundation tables yet.

The app will break or behave incorrectly later if household RLS is enabled before app data access is updated.

### Compatibility assumptions

Current compatibility relies on:

- `src/hooks/useTable.js:9` loading tables through generic `sb.from(table).order(...).select()`.
- `src/hooks/useTable.js:14-16` inserting, updating, and deleting without `household_id`.
- `src/modules/quick-add/QuickAdd.js:33`, `43`, and `58` inserting directly into shared tables without household context.
- Module hooks in `src/modules/dashboard/Dashboard.js:11-18`, `src/modules/tasks/Tasks.js:11-12`, `src/modules/pool/Pool.js:342-346`, `src/modules/finance/Finance.js:311-318`, and `src/modules/college/College.js:21-23` relying on generic table reads.
- Auth state in `src/hooks/useSupabaseAuth.js:65-70` not resolving an active household.

### Files likely needing updates after migration

- `src/hooks/useSupabaseAuth.js`: resolve profile, membership, active household, and role.
- `src/hooks/useTable.js`: include active `household_id` on inserts and optionally filter by active household.
- `src/lib/supabase.js`: may need a household-aware API wrapper.
- `src/modules/quick-add/QuickAdd.js`: pass `household_id` on direct inserts.
- `src/modules/dashboard/Dashboard.js`: read household-scoped data deliberately.
- `src/modules/tasks/Tasks.js`: support household and assignee/person fields later.
- `src/modules/pool/Pool.js`: add household context before any pool table RLS switch.
- `src/modules/finance/Finance.js`: add owner/adult-aware access assumptions before household RLS.
- `src/modules/college/College.js`: later connect child/person subject records.
- `supabase/seed.sql`: create household/membership and seed `household_id`.
- `supabase/backfill-user-id.sql`: superseded or paired with household backfill tooling.

## Recommended Changes Before Applying

Required:

- Add or split a real foundation RLS migration before production execution.
- Make backfill idempotent or explicitly one-shot with a durable migration marker.
- Add preflight checks for existing columns, null `user_id` rows, and unmatched auth users.
- Add postflight count validation and fail conditions.
- Decide whether to bootstrap all auth users or only users with current module data.
- Decide whether foundation tables should be readable immediately by the app or service-only until app updates land.
- Rehearse locally on a database copy before any production execution.

Recommended:

- Add a bootstrap mapping table or temporary-to-durable audit table for rollback traceability.
- Consider a `household_members` constraint or trigger to ensure `person_id` belongs to the same `household_id`.
- Consider `created_by_user_id` and `updated_by_user_id` for module tables in a follow-up migration, not necessarily this one.
- Add migration comments that explicitly state current `user_id` policies remain the active app compatibility layer.

## Optional Improvements

- Use generic default household names such as `Family household` instead of deriving from email local-part.
- Add `last_active_household_id` later on `profiles` only when multi-household switching is needed.
- Add `updated_at` trigger helpers later; do not block this migration on them.
- Add module-specific indexes only after query patterns are confirmed.
- Add a local-only SQL validation script that counts each table before and after backfill.

## Questions Requiring Owner Decision

- Should existing auth users with no module rows get households during the first migration?
- Should the real first migration include minimal RLS for foundation tables, or should foundation table creation wait until RLS is fully written?
- Is one existing `user_id` definitively one household?
- Should default household names be generic or derived from account metadata?
- Do module tables need `created_by_user_id` now, or is existing `user_id` enough until a later attribution cleanup?
- Should the first production migration be designed to rerun safely, or should the deployment process guarantee exactly-once execution?

## Go / No-Go Recommendation

Recommendation: **No-go for applying this draft. Go for a revised draft.**

The next draft should preserve the current conservative data model but add production safety:

- Foundation RLS strategy.
- Idempotent backfill.
- Preflight/postflight validation.
- Explicit rollback mapping.

Do not start Pool or Finance cleanup before those migration blockers are resolved unless they directly block household context wiring.

## Suggested Next Codex Prompt

```text
Family OS next step: revise the draft household schema migration for production-readiness, but do not apply it.

Do not run Supabase commands.
Do not modify production data.
Do not change application code.
Do not move the draft into a real migration folder.

Use:
- docs/implementation/household-migration-plan-2026-06-27/draft_sql/2026-06-27_household_foundation_draft.sql
- docs/implementation/household-migration-plan-2026-06-27/09_DRAFT_SQL_VALIDATION.md

Revise only the draft SQL and review docs to address:
- minimal foundation-table RLS plan
- idempotent or explicitly one-shot backfill
- preflight checks
- postflight validation queries
- rollback traceability
- clear handling for auth users with no module rows

Keep shared module RLS replacement out of scope.
Keep app code unchanged.
Commit with message:
Revise draft household migration safety
```

## Verification

Static review only:

- Confirmed reviewed draft exists.
- Confirmed review document exists.
- Confirmed no executable `create policy` statements in the draft.
- Confirmed no executable foundation-table RLS enablement in the draft.
- Confirmed no executable `drop` statements in the draft.
- Confirmed no Supabase commands were run.
- Confirmed no app code was changed.

No changes were made to the draft SQL during this validation pass. The issues found are design and migration-safety issues, not isolated syntax errors.
