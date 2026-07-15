# Relationships

Relationships is the Release 3.1.0 Relationship OS workspace. It stores durable context about important people and surfaces lightweight opportunities to connect. It is not a task manager and does not use AI or opaque scoring.

## Profile

Each household relationship supports name, category, optional birthday, favorite things, interests, conversation topics, activity ideas, notes, priority, Active or Archived status, and automatically maintained Last Contact, Last Conversation, and Last One-on-One dates. Teen, Pre-Teen, and Adult prompt sets are editable defaults, not fixed classifications.

## Activity and Goals

Quick Log records Conversation, Phone Call, Date Night, One-on-One, Family Activity, Meal Together, Visit, or Custom activity. Completed entries update contact fields and Timeline. Planned entries appear under Upcoming Planned Time Together. Goals are simple outcomes with optional target dates and Active, Completed, or Archived lifecycle.

## Transparent Health

- High priority: contact guide of 7 days.
- Medium priority: contact guide of 14 days.
- Low priority: contact guide of 30 days.
- Needs Attention: no contact is logged or the guide is exceeded.
- Good: contact remains within the guide.
- Excellent: contact is in the first half of the guide and a recent activity or completed goal provides supporting evidence.

The UI displays days since contact and the applicable guide. Birthdays are shown as context, not as an unexplained score adjustment.

## Ownership and Integration

The module owns `relationships`, `relationship_goals`, and `relationship_activities`. Home shows no more than three high-value, deduplicated recommendations. Global Search indexes profile meaning, and Household Timeline renders completed and planned relationship activity alongside other household history.
