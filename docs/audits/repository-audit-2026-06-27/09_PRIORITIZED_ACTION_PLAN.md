# Prioritized Action Plan

Audit date: 2026-06-27

## Priority 0: Critical Fixes

| Item | Impact | Effort | Risk | Recommended Owner Type |
| --- | --- | --- | --- | --- |
| Verify `.env.local` is untracked and not accidentally a directory. | Prevents secret/config confusion. | Low | Low | Developer |
| Add Supabase session validation or explicit auth plan for `api/brief.js`. | Prevents unauthenticated AI API usage from approved origins. | Medium | Medium | Full-stack developer |
| Stop silently masking authenticated Supabase read failures with seed data. | Prevents users trusting stale/demo data when persistence fails. | Medium | Medium | Frontend developer |
| Document current `user_id` RLS as current state and `household_id` as future state. | Prevents unsafe assumptions before family sharing. | Low | Low | Architect / developer |

## Priority 1: Fix Before More Feature Growth

| Item | Impact | Effort | Risk | Recommended Owner Type |
| --- | --- | --- | --- | --- |
| Extract hooks and services from `src/App.js`. | Reduces central complexity and enables tests. | Medium | Medium | Senior frontend developer |
| Extract Pool, Finance, College, and Quick Add into feature folders. | Makes module work safer and easier. | High | Medium | Senior frontend developer |
| Move pure domain calculations into `src/domain/`. | Enables unit testing and reduces UI coupling. | Medium | Low | Frontend developer |
| Add GitHub Actions for lint/build. | Prevents broken PRs from landing. | Medium | Low | DevOps-capable developer |
| Add `supabase/migrations/` and define migration workflow. | Makes database changes reviewable and repeatable. | High | Medium | Full-stack developer |
| Decide `features` versus `modules` and update docs/source conventions. | Reduces architecture drift. | Medium | Low | Architect / frontend developer |
| Reconcile current schema docs with actual `supabase/schema.sql`. | Prevents implementation against wrong tables. | High | Low | Architect / developer |

## Priority 2: Improve Soon

| Item | Impact | Effort | Risk | Recommended Owner Type |
| --- | --- | --- | --- | --- |
| Add tests for dates, tasks, pool, finance, Supabase wrapper, and API validation. | Protects high-value logic during refactors. | Medium | Medium | Developer |
| Add common form/chip/status components. | Reduces duplicated UI logic. | Medium | Low | Frontend developer |
| Add indexes for common dashboard/module queries. | Improves performance as data grows. | Medium | Medium | Database-capable developer |
| Add a module implementation status matrix. | Clarifies product planning. | Low | Low | Product/architect |
| Add Dependabot and dependency review. | Improves security maintenance. | Medium | Low | DevOps-capable developer |
| Define AI context/privacy rules. | Reduces privacy risk before AI expansion. | High | Medium | Architect / product / developer |

## Priority 3: Later Enhancements

| Item | Impact | Effort | Risk | Recommended Owner Type |
| --- | --- | --- | --- | --- |
| Introduce route-aware navigation. | Enables deep links and module subviews. | Medium | Medium | Frontend developer |
| Migrate gradually to TypeScript if still desired. | Improves model safety but requires sustained effort. | Medium | High | Senior frontend developer |
| Add household membership and role-based sharing. | Unlocks true family platform behavior. | High | High | Full-stack architect |
| Add shared platform entities: people, assets, documents, events, metrics, reminders, timeline. | Enables long-term platform scale. | High | High | Full-stack architect |
| Add release automation and deployment previews. | Improves delivery maturity. | Medium | Medium | DevOps-capable developer |
| Add privacy/data retention documentation. | Supports sensitive future modules. | Medium | Medium | Product / security-minded developer |

## Recommended Sequence

1. Document current-state versus future-state architecture clearly.
2. Add CI and migrations.
3. Extract `src/App.js` into hooks, services, features, and domain helpers.
4. Add tests around extracted domain logic.
5. Resolve household data model before adding new family-sharing or sensitive modules.
6. Expand AI only after API auth and context privacy rules exist.

