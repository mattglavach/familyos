# Platform Data Model

## Purpose
Define canonical entities that every Family OS module can reuse.

## Goals
- Keep shared entities consistent across modules.
- Make cross-module dashboards, notifications, and AI summaries possible.
- Avoid separate task, document, reminder, note, and metric models per module.

## Scope
This document describes logical entities and relationships. It does not create schema changes or implementation code.

## Architecture
Platform entities belong to a household and can be associated with one or more modules through module context. Modules should extend shared entities before creating module-specific concepts.

## Canonical Entities

### Person
Purpose: Represents a family member, contact, vendor, coach, doctor, teacher, or other important person.

Key Fields: `id`, `household_id`, `first_name`, `last_name`, `relationship`, `role`, `email`, `phone`, `birthday`, `notes`.

Relationships: Belongs to a household. Can own tasks and goals. Can be linked to events, documents, notes, and metrics.

Example Usage: A child linked to college deadlines, medical records, and family calendar events.

Design Principles: Store the person once and reuse the record everywhere.

### Household
Purpose: Represents the family unit using Family OS.

Key Fields: `id`, `name`, `created_at`, `updated_at`.

Relationships: Owns people, properties, assets, tasks, documents, events, reminders, notes, goals, metrics, and timeline entries.

Example Usage: The Glavach household owns tasks across Pool, College, Finance, and Home.

Design Principles: Household scope is the primary security and organization boundary.

### Property
Purpose: Represents a home, rental, land, or other managed property.

Key Fields: `id`, `household_id`, `name`, `property_type`, `address`, `status`, `notes`.

Relationships: Belongs to a household. Can contain assets and be linked to tasks, documents, events, notes, and metrics.

Example Usage: A primary home linked to HVAC assets, pool equipment, garden zones, and insurance documents.

Design Principles: Use properties to avoid mixing assets from different physical locations.

### Asset
Purpose: Represents a physical, financial, or digital item the household manages.

Key Fields: `id`, `household_id`, `property_id`, `module_key`, `name`, `asset_type`, `manufacturer`, `model`, `serial_number`, `purchase_date`, `warranty_expiration`, `status`, `notes`.

Relationships: Belongs to a household and optionally a property. Can be linked to tasks, reminders, documents, events, notes, and metrics.

Example Usage: A pool pump linked to maintenance tasks, warranty documents, and service notes.

Design Principles: Assets should describe durable managed things, not one-time activities.

### Task
Purpose: Represents any action item across any module.

Key Fields: `id`, `household_id`, `module_key`, `title`, `description`, `status`, `priority`, `owner_person_id`, `due_date`, `recurrence_rule`, `source`, `completed_at`.

Relationships: Belongs to a household. Can link to a person, asset, goal, document, event, or module.

Example Usage: Replace HVAC filter, test pool chemistry, register for SAT, upload insurance policy.

Design Principles: Use one task engine for all modules.

### Goal
Purpose: Represents a desired outcome or planning target.

Key Fields: `id`, `household_id`, `module_key`, `title`, `description`, `owner_person_id`, `target_date`, `status`, `priority`.

Relationships: Can own tasks, metrics, notes, events, and documents.

Example Usage: Prepare for college applications, maintain pool balance, build an emergency fund.

Design Principles: Goals connect actions and measurements to an outcome.

### Reminder
Purpose: Represents a notification trigger tied to a task, event, goal, asset, document, metric, or note.

Key Fields: `id`, `household_id`, `module_key`, `title`, `reminder_type`, `linked_entity_type`, `linked_entity_id`, `remind_at`, `recurrence_rule`, `status`.

Relationships: Links to platform entities through entity type and entity id.

Example Usage: Remind the household to clean the pool filter or review a policy renewal.

Design Principles: Reminder logic should be shared, not embedded in modules.

### Document
Purpose: Represents metadata for files, records, receipts, policies, statements, manuals, contracts, and references.

Key Fields: `id`, `household_id`, `module_key`, `title`, `description`, `document_type`, `file_url`, `external_url`, `tags`.

Relationships: Can link to people, assets, goals, events, notes, and modules.

Example Usage: A pool pump manual, insurance policy, school record, or medical note.

Design Principles: Store document metadata consistently even if file storage changes later.

### Note
Purpose: Represents freeform context connected to a module or platform entity.

Key Fields: `id`, `household_id`, `module_key`, `title`, `body`, `linked_entity_type`, `linked_entity_id`, `tags`.

Relationships: Can link to any platform entity.

Example Usage: A pool service observation, doctor visit summary, or college planning note.

Design Principles: Notes provide human context without becoming a replacement for structured fields.

### Metric
Purpose: Represents a trackable value over time.

Key Fields: `id`, `household_id`, `module_key`, `metric_key`, `metric_name`, `value`, `unit`, `measured_at`, `notes`.

Relationships: Can link to people, assets, goals, and modules.

Example Usage: Pool pH, net worth, SAT score, vehicle mileage, or garden yield.

Design Principles: Metrics should be timestamped and comparable over time.

### Event
Purpose: Represents a dated occurrence, appointment, deadline, or commitment.

Key Fields: `id`, `household_id`, `module_key`, `title`, `description`, `start_time`, `end_time`, `all_day`, `location`, `source`.

Relationships: Can link to people, assets, goals, tasks, documents, and modules.

Example Usage: College application deadline, medical appointment, pool service visit, or travel date.

Design Principles: Events describe when something happens; tasks describe what must be done.

### Timeline Entry
Purpose: Represents a chronological activity record across modules.

Key Fields: `id`, `household_id`, `module_key`, `entry_type`, `title`, `summary`, `occurred_at`, `linked_entity_type`, `linked_entity_id`, `source`.

Relationships: Can reference any platform entity and provide a cross-module history.

Example Usage: "Pool chemistry logged", "SAT registration completed", "Insurance document uploaded".

Design Principles: Timeline entries should be generated from meaningful events and actions, not every minor field edit.

## Design Decisions
- Shared entities are the default.
- Module-specific data is allowed only when shared entities cannot represent the domain cleanly.
- `module_key` provides context without creating duplicate tables.
- Household scope is required for user-owned data.

## Future Considerations
- Entity tagging across multiple modules.
- Timeline generation rules.
- Household roles and permissions.
- Strong typed models if the app moves from plain JavaScript to TypeScript.

## Related Documents
- [Platform README](README.md)
- [Database Schema](02_database_schema.md)
- [Task Engine](03_task_engine.md)
- [AI Context](05_ai_context.md)
