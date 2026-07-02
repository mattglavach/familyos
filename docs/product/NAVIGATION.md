# Product Navigation

## Purpose
Navigation should help household members move quickly between daily context, action capture, and management surfaces. Engineering implementation details are governed by `docs/process/UI_GUIDELINES.md` and `docs/ui/DESIGN_SYSTEM.md`.

## Desktop
- Use a stable app shell with clear current-location state.
- Prefer a left rail or wider tab treatment when the viewport supports it.
- Keep Home, Tasks, Calendar, Quick Add, and More visible or immediately reachable.
- Avoid exposing future modules as if they are complete.

## Tablet
- Preserve the same information architecture as desktop.
- Allow wider dashboard and card layouts without changing workflow order.
- Keep Quick Add reachable without scrolling.

## Mobile
- Use bottom navigation for primary destinations.
- Keep labels short.
- Keep tap targets large enough for one-handed use.
- Avoid more than five primary bottom actions long-term: Home, Tasks, Calendar, Quick Add, More.
- Ensure fixed navigation never covers page actions or drawer buttons.

## Global Search
Global search should search tasks, calendar events, people, documents, lists, modules, and household records according to permissions as those surfaces become implemented.

Release 1.2 extends scoped global search to Shopping Lists, Shopping Items, and Pantry Items after their data and permission behavior is validated. Future modules should register searchable results only after their data and permission behavior are validated.

## Universal Quick Add
Universal Quick Add should become the fastest way to capture household work.

Long-term capture targets:
- Task.
- Calendar event.
- Reminder.
- Shopping item.
- Note.
- Pool reading.
- Maintenance item.
- Health entry.
- Document placeholder.

Release 1.0 should keep Quick Add focused on existing supported actions and avoid adding unsupported module types.

Release 1.2 keeps Task, Pool Reading, Life List, Life List Item, Shopping List, and Shopping Item enabled. Event, Health Entry, Note, Maintenance, recipes, and meal-planning captures are not shown until those workflows are fully supported.

## Header Status Actions
Global header actions should stay compact and trustworthy. Search, Notifications, Calendar status, and Settings may use icon-only buttons when they have accessible labels and tooltips. Calendar status should route to Calendar when healthy and to Settings when connection action or setup guidance is needed.

## Notification Bell
The notification bell is a future global surface for reminders, warnings, and household updates.

Release 1.0 includes an in-app notification center for task, calendar, and household state. It does not add push, email, SMS, AI alerts, or background notification delivery.

## Breadcrumbs
Breadcrumbs are useful for deeper future module flows such as documents, finances, projects, home systems, or college planning.

Release 1.0 should not require breadcrumbs for the current shallow app structure.

## Back Navigation
- Back should return users to the previous meaningful context.
- Save flows should not unexpectedly eject users from the current module.
- Invite acceptance should land users in the most relevant household context after sign-in.
- Household switching should refresh the current surface without confusing route jumps.

## Future Growth Strategy
1. Keep Home, Tasks, Calendar, Quick Add, and More as the long-term primary model.
2. Move lower-frequency modules into More.
3. Group More by platform: Household, Home, Health, Finance, Planning, and Settings.
4. Promote a module only when it is active, documented, validated, and used frequently.
5. Use search and Quick Add to reduce navigation depth as the product grows.

## Release 1.0 Alignment
Release 1.0 should polish current navigation and responsive behavior without forcing a large navigation rewrite. The long-term navigation model should guide labels, grouping, and deferred decisions.
