# Dashboard

## Purpose
Home is the family's Morning Briefing. It should answer what needs attention today, what is happening next, who is involved, and what action should happen now.

Home is an awareness layer, not a work surface. It should summarize and route users into modules for action.

## Layout
The dashboard should use a mobile-first vertical flow. On wider screens, sections may become grids, but the priority order should remain clear.

Recommended widget order:
1. Today's Priorities
2. Today's Schedule
3. My Tasks
4. Household Insights
5. Recent Activity when compact and useful

## Priority Order
1. Urgent or overdue household responsibilities.
2. Today's schedule and time-sensitive events.
3. Tasks assigned to the current user.
4. Lower-frequency insights from household modules.
5. Recent activity that helps explain what changed.

## Widgets

Dashboard widgets and cards should show only the highest-value information, generally 3-5 items. They should be clickable, open the relevant module filtered where practical, and include a View All action when additional items exist.

### Today's Priorities
Shows the highest-priority tasks, overdue items, due-today items, calendar conflicts, and important household reminders.

### Today's Schedule
Shows today's calendar events, connected calendar status, empty state, and reconnect/error states. Full schedule browsing belongs in Calendar.

### My Tasks
Shows assigned tasks, due dates, status, and quick complete/reopen actions.

### Household Insights
Shows useful module signals, such as:
- Pool.
- Tasks.
- Finance snapshot.
- College reminders.

Household and family member management belongs in Settings/Household, not Home.

### Recent Activity
Shows a compact list of useful recent changes when data exists. It should not become an activity feed dashboard.

## Drill-Down Behavior
Home cards should drill into the module that owns the work. Examples:
- Task rows open Tasks.
- Calendar rows open Calendar.
- Pool insight opens Pool.
- Finance insight opens Finance.
- College insight opens College.

Home should summarize. Modules should provide the work surface.

## Card Philosophy
Cards should be actionable, compact, and status-rich. A card should usually communicate one idea: a task, event, person, status, or insight.

Cards should show:
- Title.
- Owner or source when relevant.
- Status or priority.
- Due or time context when relevant.
- One clear next action when available.

## Customization Strategy
Release 1.0 should not add broad dashboard customization. It should rely on sensible defaults.

Future customization may include:
- Reordering widgets.
- Hiding lower-priority modules.
- Personal versus household views.
- Time-of-day dashboard modes.

## Future Expansion
- AI morning summaries.
- Smart home alerts.
- Travel countdowns.
- Bill reminders.
- Seasonal pool and yard intelligence.
- School and college planning reminders.
- Household health and trend summaries.

## Release 1.0 Dashboard Scope
Release 1.0 should stabilize and polish the existing dashboard. It should not add unrelated modules or AI summaries.

## Release 1.0.1 Polish
Release 1.0.1 narrows Home to the awareness layer: Today's Priorities, Today's Schedule, My Tasks, Household Insights, and compact Recent Activity. Calendar browsing, household management, Quick Add capture, and detailed task work stay in their own modules.
