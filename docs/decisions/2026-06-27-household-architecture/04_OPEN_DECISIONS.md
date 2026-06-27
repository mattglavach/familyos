# Open Household Architecture Decisions

Decision date: 2026-06-27

## 1. Can A User Belong To Multiple Households?

Recommendation: support the data model for multiple households, but implement one active/default household first.

Options:

- Single household per user.
- Multiple households per user with active household selection.

Tradeoffs:

- Single household is simpler now but may require rework for relatives, shared custody, clubs, or future community contexts.
- Multiple households is more flexible but adds UI and data-access complexity.

Recommended timing: decide before schema migration. Active household UI can be deferred.

## 2. Child Login Vs Child Profile Only

Recommendation: model children as `people` first; add child login only when there is a real child-facing workflow.

Options:

- Children are profiles only.
- Children can sign in as limited users.

Tradeoffs:

- Profile-only is simpler and safer for v1.
- Child login enables assigned tasks and child views but requires stricter RLS and UX controls.

Recommended timing: defer login until after household foundation and adult workflows are stable.

## 3. Guest Access Timing

Recommendation: include `guest` as a reserved role, but do not implement guest access in the first migration.

Options:

- Implement guest role now.
- Reserve role name and defer behavior.

Tradeoffs:

- Implementing now may overcomplicate RLS.
- Deferring keeps migration focused but requires care not to accidentally grant guest access later.

Recommended timing: after household/member foundation and sensitive-module policies are proven.

## 4. Household Invitation Model

Recommendation: start with owner-created memberships or manual admin setup; build invitation UX later.

Options:

- Manual membership creation.
- Email invitation flow.
- Invite codes.

Tradeoffs:

- Manual setup is fast for early family use.
- Email invites are better product UX but require token lifecycle and abuse handling.
- Invite codes are convenient but can be risky if not scoped and expiring.

Recommended timing: after household foundation, before adding non-owner family accounts.

## 5. Role Permissions Matrix

Recommendation: define coarse module-level permissions first.

Options:

- Coarse roles only.
- Role plus module permissions.
- Fine-grained per-record permissions.

Tradeoffs:

- Coarse roles are simplest and enough for owner/adult/child/guest.
- Module permissions help sensitive areas.
- Fine-grained permissions are powerful but too heavy for this stage.

Recommended timing: before writing RLS policies for current tables.

## 6. AI Memory / Context Scoping

Recommendation: scope AI context to household plus current user's role, with explicit module filters.

Options:

- User-only AI memory.
- Household AI context.
- Hybrid user preference plus household context.

Tradeoffs:

- User-only context misses shared family operations.
- Household context is valuable but can leak sensitive data if role filtering is weak.
- Hybrid is likely correct long-term but needs careful design.

Recommended timing: before expanding AI beyond current brief endpoint.

## 7. Module-Specific Privacy Rules

Recommendation: start with adult/owner-only restrictions for Finance, Retirement, Documents, Medical, and AI context; allow broader household access for Pool, Tasks, Home Maintenance, and safe Calendar views.

Options:

- Same permissions for all modules.
- Sensitive-module restrictions.
- Per-record visibility controls.

Tradeoffs:

- Same permissions are too risky.
- Sensitive-module restrictions are practical.
- Per-record visibility is flexible but should wait until there is a concrete need.

Recommended timing: before household RLS policy migration.

## 8. `owner` Vs `admin` Naming

Recommendation: use `owner` for the top household role and `adult` for trusted adults. Avoid mixing `owner` and `admin` in user-facing code.

Options:

- `owner`, `adult`, `child`, `guest`.
- `admin`, `adult`, `child`, `guest`.

Tradeoffs:

- `owner` is clearer for a family household.
- `admin` is more generic but less family-oriented.

Recommended timing: before schema migration so role enum/check constraints use final names.

