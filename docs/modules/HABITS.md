# Habits

## Release 2.6.0 scope

Habits now support simple completion and one-level checklist habits. Checklist actions retain name, display order, required/optional designation, and active state. The parent has no manual bypass: daily completion is calculated using an `any`, `count`, or `all` threshold, while displayed progress includes every active action. Daily snapshots preserve total active actions, completed count, threshold result, and completed action IDs without overwriting prior dates. Existing habits remain simple by default.

The workspace uses compact Today, Active, Routines, and Needs Completion filters with expanded status, frequency, and habit-type filters.

## Release 2.3.0 scope

Habits are now durable household-scoped records with daily, weekly, or monthly periods, personal or household visibility, one completion per applicable period, undo, current streaks, and history-preserving archive behavior. Global Add creates habits without navigating first.

Advanced analytics, flexible targets, milestones, stacking, challenges, rewards, pause/vacation modes, smart reminders, AI recommendations, cross-module insights, health/wearable integration, and advanced family reporting remain intentionally deferred.

## Historical Release 2.2.0 scope

Habits supports seven intentionally fixed daily habits: Exercise, Faith, Family Time, Read, Hydration, Stretch, and Sleep Goal. It shows completion today and a rolling seven-day completion percentage. Home summarizes the result as “Completed X of 7 today.”

Habit completion is device-local in Release 2.2.0. This avoids a database migration and is appropriate for validating the daily workflow, but it does not sync across devices or household members. Advanced analytics, reminders, custom habits, and autonomous coaching are deferred.
