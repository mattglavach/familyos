# Platform Task Engine

## Purpose
Define one universal task engine for Family OS.

## Goals
- Answer what needs to be done, who owns it, when it is due, and why it matters.
- Support every module with one shared task lifecycle.
- Enable Command Center task rollups.
- Preserve completion history and support future automation.

## Scope
This document defines behavior and architecture. It does not create implementation code.

## Architecture
All modules create and read tasks through the shared platform task model. Tasks use `module_key` for module association and optional links to people, assets, goals, documents, events, reminders, notes, or metrics.

## Task Lifecycle
1. Created from a manual entry, system rule, import, or AI suggestion.
2. Assigned to an owner when appropriate.
3. Scheduled with a due date or recurrence rule when appropriate.
4. Tracked through status changes.
5. Completed, canceled, or left waiting.
6. Preserved for history and future reporting.

## Status Values
- `not_started`
- `in_progress`
- `waiting`
- `completed`
- `canceled`

## Priority Values
- `urgent`
- `high`
- `medium`
- `low`

## Recurring Task Strategy
Store recurrence as a rule on the task record first. Prefer iCal RRULE format where practical, such as `FREQ=WEEKLY` or `FREQ=MONTHLY`.

Initial implementation should avoid complex recurrence generation. Future recurrence processing can create the next task instance after completion or on a schedule.

## Ownership
Tasks can be owned by a person through `owner_person_id`. Unassigned tasks remain household-level.

## Module Association
Tasks use `module_key` to identify context, such as `pool`, `college`, `finance`, `home`, `garden`, `vehicles`, or `medical`.

## AI Suggested Tasks
AI-suggested tasks should use source `ai_suggested` and require user acceptance before becoming active recurring work.

## Completion History
Completion should preserve:

- original due date
- completion timestamp
- owner
- module context
- linked entities
- source

## Dependencies
Task dependencies may be represented later through task-to-task relationships. The first platform version should document the need but avoid overbuilding dependency logic.

## Future Considerations
- Generate recurring tasks.
- Suggest task creation from documents, notes, metrics, and events.
- Escalate overdue critical tasks.
- Create timeline entries on completion.

## Design Decisions
- There is one shared task engine.
- Module UIs should not duplicate task query logic.
- Completed tasks stay in history.
- AI can suggest tasks but should not silently create obligations.

## Related Documents
- [Platform Data Model](01_data_model.md)
- [Notification Engine](04_notification_engine.md)
- [Command Center](07_command_center.md)
- [Tasks Module](../modules/TASKS.md)
