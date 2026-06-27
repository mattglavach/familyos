# Household Architecture Decision Summary

Decision date: 2026-06-27

Decision status: **Accepted**

## Decision

Family OS will use a household-centered architecture.

Official decisions:

- Household is the primary ownership boundary for shared Family OS data.
- Users authenticate individually through Supabase Auth.
- Users belong to households through `household_members`.
- Roles must include at minimum `owner`, `adult`, `child`, and `guest` / future guest access.
- Shared modules must use `household_id`.
- Personal/private settings may remain user-scoped.
- RLS must enforce access through household membership.
- Schema migration to household ownership should happen before major new feature development.
- `src/App.js` should be split into maintainable hooks, services, domain helpers, and feature modules before expanding additional modules.

## Rationale

The repository audit identified the core mismatch: current SQL uses `user_id`, while platform docs describe household scope as the long-term access boundary. The household architecture review recommends moving to household-centered ownership because the current user-centered model cannot safely support adult, child, owner, guest, shared-module, and AI-context use cases.

Source references:

- Current SQL adds `user_id` and `user_id = auth.uid()` RLS policies in `supabase/schema.sql:236-258`.
- Current README documents user-scoped rows in `README.md:111-118`.
- Platform docs define household as the primary security and organization boundary in `docs/platform/01_data_model.md:30-39`.
- Platform database docs state `household_id` is the access-control anchor in `docs/platform/02_database_schema.md:61-75`.
- Household review recommends Phase 1.5 Household Foundation and App Modularization in `docs/architecture/household-architecture-review-2026-06-27/00_EXECUTIVE_SUMMARY.md`.

## Implications

- `user_id` should no longer be treated as the long-term ownership column for shared module data.
- Existing `user_id` columns should be retained during migration as compatibility metadata and likely become `created_by_user_id` or equivalent attribution.
- New shared tables should include `household_id` from the beginning.
- Module reads and writes must eventually be scoped through active household context.
- RLS policy design must happen before enabling true family sharing.
- Sensitive modules such as Finance, Retirement, Documents, Medical, College, Calendar, and AI context need role-aware restrictions.
- App structure work and schema work are coupled: household context should live in shared data access, not scattered across feature components.

## Risks

- Migration can break existing data access if `household_id` and RLS are introduced without compatibility.
- A weak role model can leak sensitive finance, retirement, document, AI, or child data.
- Keeping `src/App.js` monolithic while adding household context will make the migration harder to reason about.
- Over-building permissions too early can slow progress. Start with coarse roles and add fine-grained permissions only when needed.
- Guest access is a future use case and should not be allowed to shape the first migration too much.

## Alternatives Considered

### Continue User-Centered Architecture

Rejected. It is simpler for a single-user prototype, but it does not support Family OS as a family platform. Family sharing, child access, adult-only modules, and household-wide AI context would be bolted on later.

### Build Module-Specific Sharing Rules

Rejected. Every module would invent its own ownership model, which would increase RLS complexity and make AI/context queries inconsistent.

### Full Enterprise Permission System Now

Rejected. Family OS needs household roles and sensitive-module restrictions, not a heavy enterprise RBAC system at this stage.

### Household-Centered With Simple Roles

Accepted. This is the simplest model that supports a family household platform while keeping implementation realistic.

## Follow-Up

The next implementation work should start with migration readiness and app data-access preparation, not new feature modules.

