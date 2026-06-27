# Platform Database Schema

## Purpose
Describe the logical database architecture for the Family OS platform layer.

## Goals
- Keep core records reusable across modules.
- Align table and column names with shared platform concepts.
- Support Supabase row-level security through household-scoped records.
- Make future AI context builders and Command Center queries predictable.

## Scope
This is architecture documentation only. It does not change `supabase/schema.sql` and does not define an executable migration.

## Architecture
Modules should extend shared platform tables instead of creating duplicate tables. Core records should belong to a household and include module context where relevant.

Recommended platform tables:

- `people`
- `households`
- `properties`
- `assets`
- `tasks`
- `documents`
- `events`
- `notes`
- `goals`
- `metrics`
- `reminders`
- `timeline_entries`

## Module Discriminator Pattern
Use `module_key` to identify the module context for shared records.

Examples:

- `tasks.module_key = 'pool'`
- `documents.module_key = 'college'`
- `metrics.module_key = 'finance'`
- `assets.module_key = 'home'`

Avoid creating duplicate concepts such as:

- `pool_tasks`
- `college_documents`
- `finance_reminders`
- `home_notes`

Module-specific tables are acceptable when the data has domain structure that does not fit the shared platform model. Those records should still link back to platform entities where useful.

## Example Relationships
- A household has many people, properties, assets, tasks, documents, events, notes, goals, metrics, reminders, and timeline entries.
- A property has many assets, tasks, documents, events, notes, and metrics.
- An asset can have many tasks, reminders, documents, notes, metrics, and events.
- A person can own tasks and goals.
- A task can link to a person, asset, goal, document, event, or module.
- A reminder can link to any platform entity through `linked_entity_type` and `linked_entity_id`.
- A timeline entry can reference any meaningful platform or module record.

## Naming Standards
- Use lowercase snake_case table names.
- Use lowercase snake_case column names.
- Use `id` for primary keys.
- Use `created_at` and `updated_at` on main mutable tables.
- Use `household_id` on household-scoped records.
- Use `module_key` for module context.
- Use clear foreign key names such as `owner_person_id` and `linked_asset_id`.
- Avoid unclear abbreviations.
- Avoid hiding business logic in UI-only state.

## Design Decisions
- Shared platform tables are preferred over module-specific duplicate tables.
- `household_id` is the access-control anchor for user-owned data.
- `module_key` is a lightweight discriminator, not a replacement for relationships.
- Generic linked-entity references are acceptable for reminders, notes, and timeline entries where many entity types need to be supported.

## Future Considerations
- Add formal migration files when the platform layer is implemented.
- Add indexes for Command Center, module, status, due date, and timeline queries.
- Define RLS policies consistently for all household-scoped records.
- Reconcile existing module tables with shared platform tables during implementation.

## Related Documents
- [Platform Data Model](01_data_model.md)
- [Task Engine](03_task_engine.md)
- [Notification Engine](04_notification_engine.md)
- [Database Schema](../database/DATABASE_SCHEMA.md)
- [Database Naming Standards](../database/NAMING_STANDARDS.md)
- [RLS Security](../database/SECURITY_RLS.md)
