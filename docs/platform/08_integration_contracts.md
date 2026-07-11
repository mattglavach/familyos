# App Integration Contracts

## Purpose
Release 1.6 defines the lightweight contracts that keep Home, Calendar, Search, Notifications, Quick Add, and module handoffs predictable without adding a new routing system or platform runtime.

## Scope
These contracts document current app-level behavior and the next safe extension path. They do not create new database tables, durable notifications, a task engine migration, URL routing, or Context Engine runtime.

## Navigation Handoff
App-level navigation accepts either a tab id or a small payload:

```js
{ tab: "tasks", search: "filter text", filter: "overdue" }
{ tab: "calendar", eventId: "provider-event-id" }
{ tab: "life-lists", listId: "list-id", search: "item title" }
```

Rules:
- `tab` is required for payload handoffs.
- Payloads are best-effort hints. If the target record is unavailable, the module should still open safely.
- Modules should keep the user inside the destination surface instead of opening hidden modals from another module.
- Search, Notifications, and Home may pass context, but the destination module owns filtering, selection, and empty states.

## Calendar Contract
Calendar is the schedule awareness surface and remains read-only in Release 1.6.

Current behavior:
- Server-side Google Calendar connection is preferred whenever a `calendar_connections` row exists.
- The legacy device fallback is shown only when no server-side connection exists.
- Refresh actions should update event data when connected and connection status when disconnected.
- Calendar status actions route to Calendar, not generic Settings.
- Calendar errors must be recoverable user states and must not block Home, Tasks, Life Lists, Shopping, Meal Planning, Pool, or Settings.

Fallback readiness:
- The legacy browser fallback remains isolated until deployed server OAuth connect, reconnect, disconnect, and event refresh smoke validation passes on the production or staging origin.
- Removal should happen only after confirming configured Vercel Calendar API secrets, Google redirect URIs, Supabase service-role access, token encryption/state secrets, and `calendar_connections` schema are present in the target environment.

## Search Result Contract
Search results should include:
- `type`: user-facing group such as `Tasks`, `Calendar`, `Life Lists`, `Shopping`, `Meal Planning`, `Pool`, `Household`, or `Navigation`.
- `label`: primary row text.
- `detail`: short supporting text.
- `nav`: tab id or navigation handoff payload.

Search should refresh current data when opened and keep item-level handoffs best-effort until URL routing or a shared registry is introduced.

## Notification Contract
Release 1.6 notifications remain generated client-side from current task, calendar, and household state.

Notification rows should include:
- Stable `id`.
- `kind` for icon treatment.
- `tone` for urgency.
- `title` and `detail`.
- `nav` payload to the most relevant surface.

Read state remains browser-local. Durable notification records, preferences, delivery channels, and reminder scheduling are deferred to a future notification foundation release.

## Quick Add Contract
Quick Add should expose only supported, validated destinations. Each target should define:
- User-facing label.
- Destination module.
- Required fields.
- Validation behavior.
- Save path.
- Post-save refresh or navigation behavior.

Unsupported future capture types should stay hidden or disabled until the destination can persist records durably and show the created item in its module.

## Home Contract
Home is an awareness surface, not a workspace.

Home cards and rows should:
- Summarize current state from source modules.
- Drill into the owning module.
- Pass lightweight context only when it reduces follow-up clicks.
- Avoid inline editing, destructive actions, or module-specific workflows.

## Deferred Work
- URL-based deep links.
- Durable notification read state and preferences.
- Shared search/provider registry.
- Quick Add target registry implementation.
- Context Engine runtime.
- New schema or RLS changes.
