# UX Guidelines

## Purpose
These guidelines define how Family OS should feel to users. Engineering implementation rules remain in `docs/process/UI_GUIDELINES.md`, `docs/process/TESTING_GUIDELINES.md`, and `docs/ui/DESIGN_SYSTEM.md`.

## Loading States
- Show stable loading states for app start, household load, dashboard data, task saves, invite actions, calendar actions, and settings saves.
- Avoid layout jumps while data loads.
- Disable duplicate-submit controls while async work is in progress.

## Empty States
- Explain what is missing.
- Offer the next valid action when one exists.
- Keep empty states short and operational.
- Do not imply future modules are available when they are not.

## Confirmation Dialogs
Use confirmations for destructive or hard-to-reverse actions:
- Delete task.
- Remove member.
- Revoke invite.
- Disconnect calendar.
- Reset local device data.

Confirmations should state what will and will not be deleted.

## Error Handling
- Use user-safe language.
- Keep the user in context.
- Preserve entered values when possible.
- Do not expose raw SQL, token, provider, session, or secret details.
- Provide a next step when one is available.

## Responsive Layouts
- Design for 360px mobile width first.
- Keep bottom navigation from covering content.
- Ensure long names, emails, task titles, and badges wrap cleanly.
- Use tablet and desktop space to improve scanning, not to change the workflow.

## Accessibility
- Use semantic controls.
- Label form fields.
- Give icon-only buttons accessible names.
- Maintain visible focus.
- Do not rely on color alone.
- Keep dialogs and drawers understandable to keyboard and assistive technology users.

## Search
Search should respect household permissions and return practical grouped results.

Release 1.0 search is scoped to implemented surfaces: tasks, calendar events, household members, and navigation targets.

## Quick Add
Quick Add should be immediate, forgiving, and available from anywhere. It should capture the user's thought first and ask for details only when needed.

Release 1.0 should keep Quick Add tied to supported workflows.

Release 1.0.1 Quick Add exposes only supported capture paths as enabled actions. Future capture types may be visible as "Later" only when disabled and clearly non-interactive.

## Tasks Work Surface
Tasks should feel like an action workspace, not a dashboard. The default surface should prioritize:
- Quick task creation.
- Search.
- Filters.
- Sorting.
- Assignment.
- Completion.
- Editing.

Summary widgets are acceptable only when they filter or navigate. Decorative KPI cards should be avoided.

## Recurrence
Normal users should choose recurrence from simple presets. Release 1.0.1 supports None, Daily, Weekly, Monthly, and Yearly through the existing interval-days field. Weekdays is deferred because it requires a richer recurrence model.

## Household Context
Users should always be able to understand which household they are viewing when multiple households are available.

Household switching should refresh data clearly and prevent cross-household confusion.

## Personal Context
The app should support personal defaults, assignments, filters, and preferences without hiding shared household truth.

## Shared Context
Shared tasks, schedules, people, and household settings should make ownership and visibility clear.

## Notification Behavior
Notifications should be useful, sparse, and actionable.

Release 1.0 includes in-app status feedback and an in-app notification center. Push, email, SMS, AI alerts, and background delivery are future capabilities.

Release 1.0.1 notification views should follow a simple lifecycle: Unread, Today, This Week, Archive.
