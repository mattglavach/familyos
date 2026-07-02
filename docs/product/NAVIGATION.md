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
Global search is a future capability. It should eventually search tasks, calendar events, people, documents, lists, modules, and household records according to permissions.

Release 1.0 does not need global search unless implementation discovers a simple existing path. Search should not be added as a new product surface during Release 1.0.

## Universal Quick Add
Universal Quick Add should become the fastest way to capture household work.

Long-term capture targets:
- Task.
- Calendar event.
- Reminder.
- Shopping item.
- Note.
- Maintenance record.
- Document placeholder.

Release 1.0 should keep Quick Add focused on existing supported actions and avoid adding unsupported module types.

## Notification Bell
The notification bell is a future global surface for reminders, warnings, and household updates.

Release 1.0 should only standardize in-app status feedback if needed. It should not add push, email, SMS, AI alerts, or background notification delivery.

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
3. Add module groups before adding many new top-level items.
4. Promote a module only when it is active, documented, validated, and used frequently.
5. Use search and Quick Add to reduce navigation depth as the product grows.

## Release 1.0 Alignment
Release 1.0 should polish current navigation and responsive behavior without forcing a large navigation rewrite. The long-term navigation model should guide labels, grouping, and deferred decisions.
