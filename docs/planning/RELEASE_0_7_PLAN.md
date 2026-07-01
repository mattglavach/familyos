# Release 0.7 Plan

## Goal
Make the app use the Release 0.6C household foundation at runtime while preserving the existing mobile-first app experience.

## Scope
- Resolve the active household after Supabase login.
- Expose household, profile, membership, people, household settings, and user preferences through a shared React context.
- Make `useTable` apply active `household_id` and `user_id` ownership for module-table reads and writes.
- Move family member persistence from browser localStorage to `people` with best-effort `household_members` rows.
- Move Settings/Profile persistence to `profiles`, `households`, `household_settings`, and `user_preferences`.
- Move task assignee/status/completion metadata to the structured `tasks` columns added in Release 0.6C.
- Keep Google Calendar on the existing browser popup flow, but document the required server-side token model for a later release.

## Non-Goals
- No invitation workflow.
- No household switching UI beyond resolving the current/default household.
- No new module expansion.
- No production database migration in Release 0.7.
- No full Google Calendar sync redesign.
- No household-scoped RLS replacement for module tables beyond using the existing compatibility columns.

## Acceptance Criteria
- Authenticated users resolve an active household before app screens render.
- Existing module reads/writes continue to work and include household context where supported.
- Family member list, roles, colors, notes, and active/inactive status load from Supabase.
- Settings save profile name, household name, default person, task category, and task priority to Supabase.
- Task create/edit/complete/reopen/reassign/delete preserves existing UX while writing structured task metadata columns.
- Browser localStorage is no longer the normal persistence path for family members, settings, or task metadata.
- Google Calendar token storage remains documented as browser-local technical debt.
