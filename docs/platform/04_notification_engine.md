# Platform Notification Engine

## Purpose
Define the shared reminder and notification architecture for Family OS.

## Goals
- Surface what needs attention at the right time.
- Support all modules with one notification model.
- Feed Command Center alerts and review views.
- Leave room for future push, email, SMS, and calendar integrations.

## Scope
This document covers notification architecture and behavior. It does not implement external notification channels.

## Architecture
Notifications are generated from platform records such as tasks, events, reminders, documents, assets, goals, metrics, and AI suggestions. The first channel should be in-app visibility through the Command Center.

## Notification Categories
- Upcoming: Items due soon or events approaching.
- Overdue: Tasks, reminders, or reviews past their due time.
- Today: Items needing attention today.
- Weekly Review: A summary of upcoming tasks, deadlines, metrics, and stale records.
- Monthly Review: A broader household operations review.
- AI Suggestions: Draft recommendations requiring user review.

## Escalation Strategy
Escalation should be based on priority, due date, recurrence, and module importance.

Suggested order:

1. Show in Command Center.
2. Move overdue urgent and high-priority items to Needs Attention.
3. Include unresolved items in weekly review.
4. Consider external channels only after in-app notification logic is stable.

## Notification Channels
Initial:

- in-app

Future:

- push notification
- email
- SMS
- calendar sync

## Future Push Notifications
Push notifications should respect user preferences, quiet hours, household roles, and notification category. Push should not be added until the shared reminder model is stable.

## Design Decisions
- Notifications are shared platform behavior.
- Modules contribute signals; the platform decides how to surface them.
- AI suggestions are visible but should not be treated as confirmed work until accepted.

## Future Considerations
- User notification preferences.
- Per-module notification settings.
- Escalation policies by priority and category.
- Digest notifications for weekly and monthly reviews.

## Related Documents
- [Task Engine](03_task_engine.md)
- [AI Context](05_ai_context.md)
- [Command Center](07_command_center.md)
