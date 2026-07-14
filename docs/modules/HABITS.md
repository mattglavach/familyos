# Habits

Release 2.10.1 makes Active the default lifecycle view, adds Paused, Archived, and All filters, and requires confirmation before archival. Paused and archived records keep history but do not create daily work or Home recommendations. Routine cards remain collapsed by default and expose keyboard-accessible inline step completion through a disclosure control. In-progress work sorts ahead of not-started and completed work.

## Release 2.10.0 core experience maturity

Habits is the daily work surface for simple habits and multi-step routines. Routine cards show today’s progress and state, persist partial completion, derive overall completion from required active steps, and reopen when a required step is unchecked. The detail view prioritizes today’s action before assignment, category, schedule, history, streak, seven-day completion, step guidance, ordering, required/optional state, archiving, and removal.

Existing habits remain simple by default and can become routines without losing history. Household-wide means one shared household completion unless a specific member is assigned. `skipped` and `not_applicable` are neutral scheduled-day states: neither counts as completed, and neither breaks streak calculations because streaks count completed applicable periods only.

## Release 2.6.1 usability

Habits is the unified daily work surface for simple habits, checklist habits, and routines. Checklist and routine rows show progress and calculated state while collapsed, expand inline for child checkboxes and quick action creation, and provide a details dialog for parent configuration, assignment, thresholds, action editing, ordering, required/optional state, activation, and deletion. Child changes reuse durable daily completion records; there is no parent-completion bypass.

## Release 2.6.0 scope

Habits now support simple completion and one-level checklist habits. Checklist actions retain name, display order, required/optional designation, and active state. The parent has no manual bypass: daily completion is calculated using an `any`, `count`, or `all` threshold, while displayed progress includes every active action. Daily snapshots preserve total active actions, completed count, threshold result, and completed action IDs without overwriting prior dates. Existing habits remain simple by default.

The workspace uses compact Today, Active, Routines, and Needs Completion filters with expanded status, frequency, and habit-type filters.

## Release 2.3.0 scope

Habits are now durable household-scoped records with daily, weekly, or monthly periods, personal or household visibility, one completion per applicable period, undo, current streaks, and history-preserving archive behavior. Global Add creates habits without navigating first.

Advanced analytics, flexible targets, milestones, stacking, challenges, rewards, pause/vacation modes, smart reminders, AI recommendations, cross-module insights, health/wearable integration, and advanced family reporting remain intentionally deferred.

## Historical Release 2.2.0 scope

Habits supports seven intentionally fixed daily habits: Exercise, Faith, Family Time, Read, Hydration, Stretch, and Sleep Goal. It shows completion today and a rolling seven-day completion percentage. Home summarizes the result as “Completed X of 7 today.”

Habit completion is device-local in Release 2.2.0. This avoids a database migration and is appropriate for validating the daily workflow, but it does not sync across devices or household members. Advanced analytics, reminders, custom habits, and autonomous coaching are deferred.
