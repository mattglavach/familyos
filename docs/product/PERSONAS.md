# Personas

## Purpose
Personas describe who Family OS serves and how product decisions should account for different household roles. Engineering role enforcement is documented in `docs/process/SECURITY_STANDARDS.md` and `docs/database/SECURITY_RLS.md`.

## Matt

Role: Household owner and power user.

Goals:
- See the full household picture quickly.
- Keep tasks, calendar, home, pool, finance, and college planning organized.
- Configure household settings and integrations.
- Reduce repeated planning work.
- Use future AI help for summaries and decisions.

Typical usage:
- Opens Home for the morning briefing.
- Reviews priorities and schedule.
- Creates and assigns tasks.
- Manages household members and invites.
- Checks planning-heavy modules when needed.

Permissions:
- Owner-level access.
- Can manage household members, roles, invites, and defaults.
- Can connect and disconnect integrations where authorized.

Dashboard expectations:
- Today's priorities first.
- Schedule and high-risk items visible.
- Household insights from pool, bills, maintenance, college, travel, and future smart-home alerts.

Task expectations:
- Fast creation and assignment.
- Clear overdue and due-soon visibility.
- Ability to reassign, complete, reopen, and clean up tasks.

Calendar expectations:
- Reliable connected calendar status.
- Today and upcoming schedule visible from Home.
- Future conflict and school/family calendar support.

## Spouse

Role: Adult collaborator.

Goals:
- Get simple access to the household picture.
- Know what needs attention today.
- Complete or add tasks without configuration complexity.
- Trust that the app is current and easy to scan.

Typical usage:
- Checks Home and Tasks.
- Adds household tasks or reminders.
- Reviews schedule and family context.
- Uses Settings only when needed.

Permissions:
- Adult member access.
- Can participate in household operating workflows.
- Does not need owner-only member management by default.

Dashboard expectations:
- Simple morning view.
- Clear personal and household priorities.
- No overwhelming admin controls.

Task expectations:
- Easy assignment, completion, and filtering.
- Clear ownership and due dates.
- Minimal friction on mobile.

Calendar expectations:
- Today's events and near-term schedule.
- Clear reconnect/error states without technical language.

## Teenager

Role: Age-appropriate household participant.

Goals:
- See assigned tasks.
- Understand schedule expectations.
- Complete chores or responsibilities.
- Avoid access to sensitive household areas.

Typical usage:
- Opens Tasks or Home.
- Reviews "my tasks."
- Completes assigned work.
- Checks schedule context if allowed.

Permissions:
- Limited role such as `teen`.
- Read or participate only in approved workflows.
- No owner/admin controls.
- No sensitive finance, medical, document, or integration management access.

Dashboard expectations:
- Personal tasks and schedule first.
- Minimal household admin content.

Task expectations:
- Very clear assigned tasks.
- Simple complete/reopen flow where allowed.
- Encouraging but not game-like unless later designed.

Calendar expectations:
- Relevant events only, based on future permission design.

## Child

Role: Child-safe participant.

Goals:
- See simple responsibilities.
- Understand routines.
- Avoid confusing or sensitive information.

Typical usage:
- Future child-safe task or routine view.
- Minimal navigation.

Permissions:
- Restricted role such as `child`.
- No management controls.
- No sensitive modules.

Dashboard expectations:
- Future child-safe view, not the full household dashboard.

Task expectations:
- Simple chore/routine cards with clear completion.

Calendar expectations:
- Future age-appropriate schedule snippets only.

## Guest (Future)

Role: External or limited collaborator.

Goals:
- Access a narrow shared context such as a community event, trip, club, or temporary household task.
- Avoid seeing private household data.

Typical usage:
- Future guest-specific surface.
- No current Release 1.0 workflow.

Permissions:
- Highly restricted.
- No private household modules by default.
- Must be separated from household member access.

Dashboard expectations:
- None in Release 1.0.
- Future guest dashboard must be scoped to the shared context only.

Task expectations:
- Future assigned limited tasks only.

Calendar expectations:
- Future shared event context only.

## Release 1.0 Persona Focus
Release 1.0 should optimize for Matt, spouse, and single-household daily use while preserving owner/adult/viewer permission behavior. Teen, child, and guest experiences remain future product work beyond basic role safety.
