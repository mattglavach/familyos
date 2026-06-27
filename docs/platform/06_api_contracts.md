# Platform API Contracts

## Purpose
Document conceptual service contracts for the shared Family OS platform.

## Goals
- Keep module UI thin.
- Centralize data access patterns.
- Avoid duplicated query logic.
- Provide stable contracts for future implementation.

## Scope
This document is architecture only. It does not contain implementation code and does not require backend changes.

## Architecture
Platform services should expose consistent operations for shared entities. Modules should call platform services or hooks instead of owning complex data access logic.

## Conceptual Services

### Task Service
Responsibilities:

- Create, update, complete, cancel, and list tasks.
- Filter by household, module, owner, status, priority, and due date.
- Provide Command Center task groups.

### Asset Service
Responsibilities:

- Create, update, and list assets.
- Filter by household, property, module, asset type, and status.
- Link assets to documents, tasks, reminders, metrics, notes, and events.

### People Service
Responsibilities:

- Create, update, and list people.
- Support household roles and contact details.
- Provide people lookup for owners, family calendar items, medical context, and college context.

### Reminder Service
Responsibilities:

- Create, update, dismiss, complete, and list reminders.
- Filter by household, module, linked entity, reminder type, status, and due time.
- Feed notification and Command Center views.

### Document Service
Responsibilities:

- Create, update, and list document metadata.
- Filter by household, module, document type, linked entity, and tags.
- Support future file storage without changing module contracts.

### Notification Service
Responsibilities:

- Build upcoming, overdue, today, weekly review, monthly review, and AI suggestion views.
- Apply escalation rules.
- Prepare future external notification channels.

### AI Context Service
Responsibilities:

- Build structured platform and module context.
- Assemble prompt-ready payloads.
- Track source records used for recommendations.
- Return draft suggestions for user review.

## Design Decisions
- Contracts describe behavior before implementation.
- Services should return predictable success and error shapes when implemented.
- Modules should not duplicate platform service responsibilities.
- API contracts should evolve with documented architecture decisions.

## Future Considerations
- Shared validation rules.
- Permission-aware service calls.
- Offline-friendly data access.
- Typed service contracts if the codebase adopts TypeScript.

## Related Documents
- [Platform Data Model](01_data_model.md)
- [Database Schema](02_database_schema.md)
- [Task Engine](03_task_engine.md)
- [Notification Engine](04_notification_engine.md)
- [AI Context](05_ai_context.md)
