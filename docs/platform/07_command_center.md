# Platform Command Center

## Purpose
Define the Family OS Command Center: the shared dashboard that every module contributes to.

## Goals
- Answer what needs attention today.
- Combine module data into one household operating view.
- Prioritize tasks, alerts, events, and recommendations.
- Make Family OS useful before every module is fully built.

## Scope
This document describes dashboard architecture and expected sections. It does not implement UI code.

## Architecture
Every module contributes platform records and optional widgets to a single Command Center. The Command Center reads shared tasks, reminders, events, metrics, documents, assets, notes, and AI suggestions.

## Command Center Sections

### Today's Priorities
Highest-priority overdue items, tasks due today, reminders due today, and critical alerts.

### Upcoming Tasks
Tasks and reminders due in the next 7 to 30 days, grouped by date, owner, or module.

### Family Calendar
Upcoming household events, appointments, deadlines, school dates, travel dates, and module-specific events.

### Household Alerts
Warnings about overdue tasks, stale data, missing documents, upcoming renewals, or important module conditions.

### Financial Snapshot
High-level finance status, goals, upcoming review tasks, and important document or reminder signals.

### Pool Status
Latest pool metrics, maintenance tasks, reminders, and unresolved issues.

### Home Maintenance
Home assets, maintenance tasks, warranties, service reminders, and relevant documents.

### Garden
Seasonal tasks, plant notes, garden metrics, and upcoming reminders.

### Vehicle Reminders
Maintenance tasks, registration deadlines, mileage metrics, insurance documents, and service history signals.

### College Deadlines
Student goals, deadlines, test dates, study tasks, document needs, and application milestones.

### AI Recommendations
AI-suggested tasks, summaries, risks, and next actions that require review.

## Module Widget Registration
Each module should define:

- module key
- display name
- priority
- summary data
- primary metric or status
- top task or reminder
- optional alert
- target route

Widgets should be compact, consistent, and safe to hide when no data exists.

## Extensibility
New modules should contribute data by using platform records first. A module can add a Command Center widget when it has useful summary data, but it should not create a separate dashboard system.

## Design Decisions
- The Command Center is platform-owned.
- Modules contribute data and widgets.
- Shared platform services provide the data.
- AI recommendations appear as draft suggestions until accepted.

## Future Considerations
- User-customizable widget order.
- Household role-based visibility.
- Weekly and monthly operating reviews.
- Cross-module AI recommendations.

## Related Documents
- [Platform README](README.md)
- [Task Engine](03_task_engine.md)
- [Notification Engine](04_notification_engine.md)
- [AI Context](05_ai_context.md)
- [Dashboard Module](../modules/DASHBOARD.md)
