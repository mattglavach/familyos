# Household Architecture Implementation Backlog

Decision date: 2026-06-27

## Backlog

| Epic | User Story / Task | Priority | Acceptance Criteria | Dependencies | Risk | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Household schema foundation | Add `supabase/migrations/` workflow and document migration naming. | P0 | New migrations have timestamped names; `supabase/schema.sql` role is documented. | Decision record accepted | Medium | M |
| Household schema foundation | Create `profiles`, `households`, `household_members`, and `people` migration. | P1 | Tables include primary keys, timestamps, required indexes, and basic constraints. | Migration workflow | High | M |
| Household schema foundation | Add default household bootstrap plan for existing users. | P1 | Each existing `user_id` maps to one default household and owner membership. | Foundation tables | High | M |
| Membership and roles | Define initial roles: `owner`, `adult`, `child`, `guest`. | P0 | Role definitions are documented and map to RLS behavior. | Decision record accepted | Medium | S |
| Membership and roles | Create role permission matrix for core modules. | P1 | Finance/retirement/documents/AI are adult/owner only by default; child access is limited. | Role definitions | High | M |
| Membership and roles | Define active household selection behavior. | P1 | App has a documented rule for one household now, multiple later. | Open decision on multi-household | Medium | S |
| RLS policy foundation | Design SQL helper functions for membership checks. | P1 | Helpers cover member, owner/adult, and owner-only checks. | Foundation tables | High | M |
| RLS policy foundation | Draft policy patterns for shared and sensitive tables. | P1 | Patterns exist for general household, adult-only, owner-only, and assigned-child access. | Role matrix | High | M |
| RLS policy foundation | Add RLS smoke-test checklist. | P1 | Checklist verifies member, non-member, child, adult, and owner access. | Policy patterns | High | S |
| Backfill/migration safety | Inventory all current tables and ownership columns. | P0 | Table list matches `supabase/schema.sql:242-248`; each table has migration owner mapping. | Current schema | Medium | S |
| Backfill/migration safety | Write backfill strategy for `household_id`. | P1 | Backfill is reversible through retained `user_id`; no row loses owner context. | Foundation tables | High | M |
| Backfill/migration safety | Define rollback plan for each migration phase. | P1 | Rollback steps exist before any migration is run. | Migration plan | High | M |
| `src/App.js` refactor | Extract `useSupabaseAuth`. | P1 | Behavior unchanged; auth gate still works; check passes. | Current app stable | Medium | S |
| `src/App.js` refactor | Extract `useTable` and prepare for household scoping. | P1 | Existing table reads/writes still work; hook has clear household extension point. | Auth hook extraction | High | M |
| `src/App.js` refactor | Extract `useGoogleCalendar` and calendar helpers. | P2 | Calendar connect/sync behavior unchanged. | Current app stable | Medium | M |
| `src/App.js` refactor | Extract Pool, Finance, College, and Quick Add features. | P2 | Feature behavior unchanged; no large dependency object from `App`. | Hooks extracted | High | L |
| Route/module structure | Keep `src/features` as official convention. | P0 | Architecture docs stop conflicting with current `src/features` structure. | Decision record accepted | Low | S |
| Route/module structure | Add `src/app`, `src/hooks`, `src/services`, and `src/domain` plan. | P1 | Folder structure is documented before code movement. | Feature convention | Low | S |
| Documentation updates | Update architecture/database docs after migration design. | P2 | Docs distinguish current state, migration state, and target state. | Migration design | Medium | M |
| Documentation updates | Add module ownership matrix to platform docs. | P2 | Finance, Pool, Retirement, College, Tasks, Documents, Calendar, Home, AI, Settings ownership is documented. | Decision record | Low | S |
| Warning cleanup | Resolve existing 19 `src/App.js` ESLint warnings. | P2 | `pnpm run lint` reports 0 warnings or documented intentional exceptions. | No behavior-changing refactors in progress | Medium | M |
| Validation/testing | Add tests for date/task/pool/finance domain helpers as they are extracted. | P2 | Core calculations have focused tests. | Domain extraction | Medium | M |
| Validation/testing | Add API validation tests or harness for `api/brief.js`. | P2 | Request validation and auth expectations are testable. | API auth decision | Medium | M |
| Validation/testing | Add migration verification checklist. | P1 | Local and production verification steps are documented before running migrations. | Backfill plan | High | S |

## Priority Definitions

- P0: decision or safety work required before coding starts.
- P1: required before household migration or app data-access changes.
- P2: required before substantial new module work.
- P3: useful after household foundation stabilizes.

