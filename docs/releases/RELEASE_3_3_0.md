# Release 3.3.0: Actionable Family Brief

## Outcome

Family Brief is now a concise daily operating center. Deterministic recommendations render first, explain their priority, combine related module context, and support confirmed decisions without transferring ownership away from Tasks, Calendar, Habits, Relationships, Pool, or Home Operations.

## Delivered

- Morning Brief with today's schedule, three priorities, household status, and a 30-second target.
- Evening Review with completions, remaining work, tomorrow-specific priorities, and wins.
- Today, Next Actions, This Week, Household Wins, Looking Ahead data model, Since Yesterday, What Can Wait, and Weekly Focus.
- Transparent Critical, High, Medium, and Low ranking with named factors and plain-language reasons.
- Cross-module Calendar + Task travel preparation and Calendar + Weather disruption recommendations.
- Confirmed Complete, Snooze, Dismiss, View, Create Task, Create Calendar Event, Convert to Maintenance, Mark Reviewed, and Never Remind Again decisions.
- Household/user-scoped lifecycle history for generated, accepted, dismissed, snoozed, completed, reviewed, and suppression decisions.
- Trigger-signature suppression so a dismissal can resurface only when the underlying circumstances materially change.
- Progressive explanation, accessible status labels, keyboard controls, large touch targets, reduced-motion-compatible transitions, dark-mode tokens, responsive wrapping, and horizontal overflow containment.
- AI summary remains asynchronous and optional. Deterministic content is the operational fallback.

## Database

Migration `20260715000000_release_3_3_actionable_family_brief.sql` adds transparent metadata to `ai_recommendations` and creates `recommendation_history`. The migration is additive, transactional, has no data backfill, enables RLS, denies anonymous access, and permits adult/owner household writes only.

## Rollback

Revert the application deployment first. The additive database objects can safely remain during application rollback. Remove them only through a separately reviewed forward migration after lifecycle-history retention has been assessed.

## Validation record

Local and hosted validation evidence is recorded in the completion report and release commit. Production verification must pass before the release tag is considered complete.
