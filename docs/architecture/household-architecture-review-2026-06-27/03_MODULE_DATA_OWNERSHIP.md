# Module Data Ownership

Review date: 2026-06-27

## Ownership Matrix

| Module | Owner | Sharing Model | Likely Tables | Privacy Notes | Scalability Concerns |
| --- | --- | --- | --- | --- | --- |
| Finance | Household with adult/admin access | Shared among admins/adults; hidden from children/guests by default | `finance_accounts`, `transactions`, `mortgage`, `other_debt`, `net_worth_snapshots`, `finance_action_items`, future `documents` | Highly sensitive. Requires adult-only RLS and careful AI context redaction. | Needs institution/account abstractions, snapshots, imports, document links, and audit history. |
| Pool | Household | Shared with admins/adults; child read-only may be acceptable for status | `pool_readings`, `pool_treatments`, `pool_schedule`, `pool_settings`, `pool_maintenance`, future `assets`, `metrics`, `tasks` | Low privacy, but still tied to home/property. | Should link to property/assets and shared task/reminder engine. |
| Retirement | Household with adult/admin access | Adult/admin only by default | `retirement_accounts`, `retirement_assumptions`, future `goals`, `metrics`, `documents` | Highly sensitive financial planning. | Should separate assumptions, scenarios, accounts, and generated projections. |
| College Planning | Household plus subject member/child | Adults manage; child may get limited access to own deadlines/tasks | `college_schools`, `college_test_plan`, `college_essays`, `college_deadlines`, `sat_scores`, `college_savings`, `college_goal`, future `people`, `documents`, `tasks`, `events` | Sensitive child data. Essays, scores, and school lists need role-aware visibility. | Must link records to `subject_person_id` instead of plain child names. |
| Tasks | Household with optional member assignment | Shared; assigned users/people can view relevant tasks | `tasks`, `home_maintenance`, future unified `tasks` with `module_key`, `owner_person_id`, `assigned_member_id` | Usually low/medium privacy, but tasks can reveal sensitive medical/finance details. | Needs recurrence, assignment, status, reminders, and module links. |
| Documents | Household with module and role restrictions | Adult/admin by default; selective child/guest sharing later | `documents`, storage metadata, document links | Very sensitive. Medical, finance, legal, school, and identity docs need strict RLS. | Requires storage bucket policies, metadata, tags, linked entities, retention, and AI redaction. |
| Calendar | Household plus user connection ownership | Imported/shared household events; OAuth connection belongs to user | `events`, `calendar_connections`, `event_attendees`, future `timeline_entries` | Calendar data can expose child locations and routines. OAuth tokens must not live in browser local storage long-term. | Needs multi-calendar sync, dedupe, attendee/person mapping, and source attribution. |
| Home Maintenance | Household/property | Shared among adults; child tasks can be assigned | `home_maintenance`, future `properties`, `assets`, `tasks`, `reminders`, `documents` | Moderate privacy, tied to property. | Should become asset/property-based, not just a flat maintenance table. |
| AI Context | Household with role-filtered source data | Context generated per user role and module permissions | `ai_context_snapshots`, `timeline_entries`, `notes`, `metrics`, `documents` summaries | Highest risk because it can aggregate sensitive data across modules. | Needs explicit context builders, redaction, consent, audit logs, and prompt/version history. |
| Settings / Preferences | Split user and household | Household settings shared; user preferences private | `household_settings`, `user_preferences`, `notification_preferences` | Preferences may include contact channels and personal settings. | Needs clear split to avoid making personal preferences household-wide. |

## Module Notes

### Finance

Finance should be household-owned because mortgages, net worth, retirement planning, and college funding are household decisions. Individual accounts can carry `owner_person_id` or `owner_user_id`, but RLS should still require adult/admin membership in the household.

### Pool

Pool data should belong to the household and probably link to a `property_id` and `asset_id`. Pool chemistry values are also good candidates for a future shared `metrics` table.

### Retirement

Retirement planning should be household-owned but adult-only. It should not be visible to child roles. Scenario calculations can remain client-side initially, but persisted assumptions and accounts should be household-scoped.

### College Planning

College planning should belong to the household and link to the child through `subject_person_id`. Current `college_goal.child_name` should eventually become a foreign key to `people`.

### Tasks

Tasks should be a shared platform primitive. Module-specific tasks should use `module_key`, linked entity fields, and assignment fields rather than creating new task tables.

### Documents

Documents should be household-owned with strict module-level and document-type restrictions. Storage policies must match metadata RLS; otherwise metadata can be protected while files leak.

### Calendar

Calendar OAuth connections are user-owned. Imported event records are household-owned only after the user explicitly connects/shares that calendar into the household.

### Home Maintenance

Home maintenance should become a property/asset/task pattern. The current `home_maintenance` table is usable but too flat for long-term home systems, warranties, and documents.

### AI Context

AI context should never be a raw dump of household tables. It should be generated from role-filtered, purpose-specific context builders and logged with enough metadata to audit what was sent.

### Settings / Preferences

Do not put every setting on `households`. User preferences, notification channels, personal OAuth tokens, and private display settings should stay user-owned.

