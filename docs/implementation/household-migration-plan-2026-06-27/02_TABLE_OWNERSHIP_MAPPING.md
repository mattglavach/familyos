# Table Ownership Mapping

Plan date: 2026-06-27

Current executable tables come from `supabase/schema.sql`. Future platform tables come from household architecture decisions and platform docs.

## Current Tables

| Table | Current Ownership | Target Ownership | Add `household_id`? | Keep `user_id`? | Complexity | Privacy | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `notes` | `user_id` | Household, optional author | Yes | Yes, as compatibility/author metadata | M | Medium | Future notes should support module/link context. |
| `tasks` | `user_id` | Household, optional assignee/person | Yes | Yes | M | Medium | Shared task engine later needs `module_key`, assignment, recurrence clarity. |
| `home_maintenance` | `user_id` | Household/property/asset | Yes | Yes | M | Low/Medium | Eventually link to properties/assets and shared tasks. |
| `pool_readings` | `user_id` | Household/property/asset metric | Yes | Yes | M | Low | Needs household and later pool asset/property link. |
| `pool_maintenance` | `user_id` | Household/property/asset | Yes | Yes | M | Low | Operational household record. |
| `pool_treatments` | `user_id` | Household/property/asset metric/action | Yes | Yes | M | Low | Operational household record. |
| `pool_schedule` | `user_id` | Household/property/asset reminder/task | Yes | Yes | M | Low | Later may merge into tasks/reminders. |
| `pool_settings` | `user_id` | Household/property/pool asset setting | Yes | Yes | M | Low | Should probably be one row per household/pool asset. |
| `college_schools` | `user_id` | Household plus child/person subject | Yes | Yes | M | High | Needs `subject_person_id` later. |
| `college_test_plan` | `user_id` | Household plus child/person subject | Yes | Yes | M | High | Child profile only for now. |
| `college_essays` | `user_id` | Household plus child/person subject | Yes | Yes | M | High | Essay content/status is sensitive. |
| `college_deadlines` | `user_id` | Household plus child/person subject/event | Yes | Yes | M | Medium/High | Could later become events/tasks. |
| `sat_scores` | `user_id` | Household plus child/person subject | Yes | Yes | M | High | Sensitive child education data. |
| `college_savings` | `user_id` | Household finance/college planning | Yes | Yes | M | High | Adult/owner only by default. |
| `college_goal` | `user_id` | Household plus child/person subject | Yes | Yes | H | High | Current `child_name` should later map to `people`. |
| `retirement_accounts` | `user_id` | Household/adult finance | Yes | Yes | M | High | Owner/adult only. |
| `retirement_assumptions` | `user_id` | Household/adult finance | Yes | Yes | M | High | Owner/adult only. |
| `mortgage` | `user_id` | Household/adult finance/property | Yes | Yes | M | High | Later link to property. |
| `other_debt` | `user_id` | Household/adult finance | Yes | Yes | M | High | Owner/adult only. |
| `net_worth_snapshots` | `user_id` | Household/adult finance | Yes | Yes | M | High | Owner/adult only. |
| `finance_action_items` | `user_id` | Household/adult finance/tasks | Yes | Yes | M | High | Later may merge with tasks using finance module key. |

## New Foundation Tables

| Table | Current Ownership | Target Ownership | Add `household_id`? | Keep `user_id`? | Complexity | Privacy | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `profiles` | Missing | User | No | N/A | M | Medium | One row per `auth.users` identity. |
| `households` | Missing | Household | No | Created-by only | M | Medium | Primary ownership boundary. |
| `household_members` | Missing | Household membership | Yes | Yes, as member login link | H | High | RLS-critical table. |
| `people` | Missing | Household | Yes | Optional future link through member | M | Medium/High | Children are people records, not login users. |

## Later Platform Tables

| Table | Current Ownership | Target Ownership | Add `household_id`? | Keep `user_id`? | Complexity | Privacy | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `properties` | Missing | Household | Yes | Created-by only | M | Medium | Needed before property/asset maturity. |
| `assets` | Missing | Household/property | Yes | Created-by only | M | Medium | Home, pool, vehicles, documents. |
| `documents` | Missing | Household with role restrictions | Yes | Created-by only | H | High | Storage policies must align later. |
| `events` | Missing | Household plus user calendar source | Yes | Created-by/source user | H | High | Calendar can expose locations/routines. |
| `goals` | Missing | Household/person/module | Yes | Created-by only | M | Medium | Useful for college/finance/planning. |
| `metrics` | Missing | Household/person/asset/module | Yes | Created-by only | M | Medium | Pool chemistry, SAT, finance snapshots later. |
| `reminders` | Missing | Household/module/entity | Yes | Created-by only | M | Medium | Later shared reminder engine. |
| `timeline_entries` | Missing | Household/module/entity | Yes | Created-by/source user | M | Medium/High | Important for AI/context and audit history. |
| `ai_context_snapshots` | Missing | Household with role-filtered source | Yes | Created-by user | H | High | Not in first migration. |
| `household_settings` | Missing | Household | Yes | No | M | Medium | Not required for first migration unless needed for bootstrap. |
| `user_preferences` | Missing | User | No | Yes | M | Low/Medium | User-scoped, not household-owned. |

## Complexity Key

- S: straightforward metadata/table addition.
- M: requires backfill or app query awareness.
- H: requires privacy/RLS design and careful validation.

