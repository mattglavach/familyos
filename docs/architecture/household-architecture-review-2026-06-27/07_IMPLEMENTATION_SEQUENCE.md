# Implementation Sequence

Review date: 2026-06-27

## Priority 0: Decisions Needed Before Coding

| Item | Impact | Effort | Risk | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| Decide household-centered architecture formally. | High | Low | Medium | Product/architecture agreement | Architecture decision recorded; `user_id` becomes compatibility/creator metadata, not primary ownership. |
| Define initial roles. | High | Low | Medium | Household architecture decision | Roles limited to `admin`, `adult`, `child`, `guest` with clear access rules. |
| Decide single vs multiple households per user. | High | Low | Medium | Product requirements | Active household behavior documented. |
| Decide migration compatibility policy. | High | Medium | Medium | Current data inventory | Written rule for keeping `user_id` until all household reads/writes are proven. |
| Decide `features` vs `modules` folder convention. | Medium | Low | Low | Existing source layout | One convention chosen and docs updated later. |

## Priority 1: Schema / Model Changes

| Item | Impact | Effort | Risk | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| Create migration framework under `supabase/migrations/`. | High | Medium | Medium | Priority 0 decisions | New migrations are timestamped and documented; `schema.sql` role clarified. |
| Add `profiles`, `households`, `household_members`, `people`. | High | Medium | Medium | Migration framework | Tables exist with indexes, constraints, timestamps, and reviewed RLS. |
| Add `household_id` to current app tables. | High | Medium | High | Foundation tables | Existing rows backfilled; `user_id` retained. |
| Add membership-based RLS helpers. | High | Medium | High | Foundation tables | Helper functions tested manually against member/non-member cases. |
| Add sensitive-module policies. | High | Medium | High | Role rules | Finance/retirement/documents/AI context are adult/admin only. |

## Priority 2: App Structure Refactor

| Item | Impact | Effort | Risk | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| Extract auth/data/calendar hooks. | High | Medium | Medium | Current app stable | No behavior changes; `pnpm run check` passes. |
| Extract pool feature and domain helpers. | High | Medium | Medium | Hooks extracted | Pool UI and saves still work. |
| Extract finance feature and domain helpers. | High | High | Medium | Hooks extracted | Finance calculations remain unchanged and testable. |
| Extract college feature. | Medium | Medium | Medium | Hooks extracted | College planning UI remains unchanged. |
| Extract Quick Add. | Medium | Medium | Medium | Feature modules available | Quick Add navigates and saves to the same modules. |
| Introduce active household context. | High | Medium | High | Household schema/API ready | App loads active household and scopes data services. |

## Priority 3: Module Cleanup

| Item | Impact | Effort | Risk | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| Convert tasks to household-aware shared task model. | High | High | High | Household context | Tasks have household scope, module key, assignment fields, and stable recurrence behavior. |
| Link college records to `people`. | Medium | Medium | Medium | `people` table | College goals and records stop relying on freeform child names. |
| Link pool/home records to property/assets. | Medium | Medium | Medium | `properties` and `assets` | Pool and home maintenance can attach to the right physical assets. |
| Add document metadata model. | High | High | High | Household RLS | Documents can be secured by household and module sensitivity. |
| Add AI context builder rules. | High | High | High | Household RLS and module permissions | AI context is role-filtered and auditable. |

## Priority 4: Future Enhancements

| Item | Impact | Effort | Risk | Dependencies | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| Add route-aware navigation. | Medium | Medium | Medium | App shell extraction | Primary tabs support direct URLs and back/forward behavior. |
| Add invitation flow. | High | Medium | High | Household membership model | Admins can invite users and assign roles safely. |
| Add child-safe views. | Medium | High | High | Child role policies | Child users only see assigned/allowed records. |
| Add calendar server-side connection model. | High | High | High | OAuth/security design | Calendar tokens are not stored only in browser `localStorage`. |
| Add audit logs for sensitive modules. | Medium | Medium | Medium | Household model | Sensitive reads/writes can be reviewed. |

## Recommended First Sprint

1. Record architecture decision for household model.
2. Create migration plan tickets.
3. Extract `useSupabaseAuth`, `useTable`, and `useGoogleCalendar`.
4. Add initial migration framework.
5. Draft RLS helper functions and policy examples.
6. Add minimal tests for extracted domain helpers.

