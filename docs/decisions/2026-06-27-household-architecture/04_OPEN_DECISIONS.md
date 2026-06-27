# Household Architecture Decisions Resolved

Decision date: 2026-06-27

## 1. Can A User Belong To Multiple Households?

Recommended decision: **allow multi-household eventually, but implement single-household-first.**

Rationale: Family OS is currently a family household platform, not a multi-tenant workspace product. The first migration should create one default household per existing user and keep the app behavior simple. The schema should still use `household_members` so one user can belong to multiple households later without reworking core ownership.

Options:

- Single household per user.
- Multiple households per user with active household selection.

Tradeoffs:

- Single household is simpler now but may require rework for relatives, shared custody, clubs, or future community contexts.
- Multiple households is more flexible but adds UI and data-access complexity.

Decision for first migration:

- Add `households` and `household_members`.
- Backfill one default household per current user.
- Do not build active household switching UI yet.
- Avoid schema constraints that permanently limit a user to one household.

## 2. Child Login Vs Child Profile Only

Recommended decision: **children are profile-only for now.**

Rationale: The current app does not have child-facing authentication, child-specific UI, or child-safe RLS. Children still need to exist in the model for college planning, task assignment, calendar context, and future medical/documents. Modeling them as `people` first gives the app the needed household context without creating login and permission risk too early.

Options:

- Children are profiles only.
- Children can sign in as limited users.

Tradeoffs:

- Profile-only is simpler and safer for v1.
- Child login enables assigned tasks and child views but requires stricter RLS and UX controls.

Decision for first migration:

- Add child/family records through `people`.
- Do not create child `auth.users` accounts.
- Reserve future linkage from `people` to `household_members` if a child login is later needed.

## 3. Guest Access Timing

Recommended decision: **defer guest access.**

Rationale: Guest access is useful later for sitters, relatives, service providers, or community views, but it increases policy complexity. The first migration should prove owner/adult household ownership and sensitive-module restrictions before any non-family access path exists.

Options:

- Implement guest role now.
- Reserve role name and defer behavior.

Tradeoffs:

- Implementing now may overcomplicate RLS.
- Deferring keeps migration focused but requires care not to accidentally grant guest access later.

Decision for first migration:

- Reserve `guest` / `guest_future` in documentation and permission matrices.
- Do not allow active guest accounts or guest RLS policies yet.
- Add guest behavior only after owner/adult workflows and RLS are verified.

## 4. Household Invitation Model

Recommended decision: **defer invitation UX until after core schema and owner/adult roles work.**

Rationale: The migration needs a safe ownership boundary first. Invitation flows require token lifecycle, expiration, email delivery, abuse prevention, and role assignment. Those are real product features and should not block the foundation migration.

Options:

- Manual membership creation.
- Email invitation flow.
- Invite codes.

Tradeoffs:

- Manual setup is fast for early family use.
- Email invites are better product UX but require token lifecycle and abuse handling.
- Invite codes are convenient but can be risky if not scoped and expiring.

Decision for first migration:

- Create owner membership automatically for each default household.
- Allow manual or scripted adult membership only if needed for setup.
- Build invitation UX after household RLS and app household context are stable.

## 5. Role Permissions Matrix

Recommended decision: **use coarse roles first: `owner`, `adult`, `child_profile`, and `guest_future`.**

Rationale: Coarse roles are enough for the first household migration. A heavy permission system would slow the project down before the core ownership model is stable. Sensitive modules can be protected with owner/adult policies now, and fine-grained permissions can be added later if actual workflows require them.

Options:

- Coarse roles only.
- Role plus module permissions.
- Fine-grained per-record permissions.

Tradeoffs:

- Coarse roles are simplest and enough for owner/adult/child/guest.
- Module permissions help sensitive areas.
- Fine-grained permissions are powerful but too heavy for this stage.

Decision for first migration:

- Active roles: `owner`, `adult`.
- Profile-only role/category: `child_profile`.
- Reserved future role: `guest_future`.
- Use module-level privacy defaults, not per-field permissions.
- See `07_ROLE_PERMISSIONS_MATRIX.md`.

## 6. AI Memory / Context Scoping

Recommended decision: **AI context is household-scoped by default, with role filtering and future user-private preferences.**

Rationale: Family OS AI features need household context to be useful. User-only memory misses shared tasks, pool, finance, college, calendar, and home context. The risk is privacy leakage, so AI context must be filtered by the signed-in user's household role and module access.

Options:

- User-only AI memory.
- Household AI context.
- Hybrid user preference plus household context.

Tradeoffs:

- User-only context misses shared family operations.
- Household context is valuable but can leak sensitive data if role filtering is weak.
- Hybrid is likely correct long-term but needs careful design.

Decision for first migration:

- Do not build persistent AI memory in the first migration.
- Treat future AI source data as household-owned.
- Keep user-scoped AI preferences separate from household context.
- Require owner/adult access for sensitive AI contexts.

## 7. Module-Specific Privacy Rules

Recommended decision: **sensitive modules support household visibility now and user/private visibility later.**

Rationale: The first migration should avoid over-engineering per-record privacy but should not treat all modules equally. Finance, retirement, documents, medical, and AI context are sensitive by default. Pool, home maintenance, and general tasks can be household-visible by default. User/private visibility can be added later after the household model is stable.

Options:

- Same permissions for all modules.
- Sensitive-module restrictions.
- Per-record visibility controls.

Tradeoffs:

- Same permissions are too risky.
- Sensitive-module restrictions are practical.
- Per-record visibility is flexible but should wait until there is a concrete need.

Decision for first migration:

- Owner/adult: access shared household modules.
- Owner/adult only: finance, retirement, documents, medical/future, sensitive AI context.
- Child profile: no login/access for first migration.
- Guest: no access for first migration.
- Add user/private visibility later only when concrete product flows require it.

## 8. `owner` Vs `admin` Naming

Recommended decision: **use `owner`, not `admin`, for the top household role.**

Rationale: `owner` is clearer in a family household product and matches household-level control. `adult` covers trusted adult family members without implying full ownership.

Options:

- `owner`, `adult`, `child`, `guest`.
- `admin`, `adult`, `child`, `guest`.

Tradeoffs:

- `owner` is clearer for a family household.
- `admin` is more generic but less family-oriented.

Decision for first migration:

- Use `owner` for the creator/default household controller.
- Use `adult` for trusted adult members.
- Use `child_profile` in docs to make clear that children are not login users yet.
- Reserve `guest_future`.
