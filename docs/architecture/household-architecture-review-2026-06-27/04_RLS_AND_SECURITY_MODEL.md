# RLS And Security Model

Review date: 2026-06-27

## Recommended Supabase RLS Strategy

Move from direct `user_id = auth.uid()` policies to household membership policies.

Current state:

- `supabase/schema.sql:251` adds `user_id`.
- `supabase/schema.sql:257` allows access when `user_id = auth.uid()`.

Target state:

- Household-scoped tables include `household_id`.
- RLS checks whether `auth.uid()` belongs to that household through `household_members`.
- Sensitive tables require role checks in addition to membership checks.

## Core Policy Concepts

Recommended helper functions:

```sql
is_household_member(target_household_id uuid)
has_household_role(target_household_id uuid, allowed_roles text[])
is_household_admin(target_household_id uuid)
```

Recommended table columns:

- `household_id`
- `created_by_user_id`
- `updated_by_user_id`
- `owner_person_id` or `subject_person_id` where relevant
- `visibility` only where module-specific privacy requires it

## Access Rules By Role

### Admin

- Can manage household settings.
- Can invite/remove members.
- Can change roles.
- Can read/write all household records unless a future private-user feature explicitly excludes admins.
- Can access finance, retirement, documents, and AI context.

### Adult

- Can read/write most household operations.
- Can access finance, retirement, college planning, pool, home maintenance, tasks, calendar, and documents unless restricted by policy.
- Cannot change admin ownership unless granted.

### Child

- Can read child-safe household data.
- Can read and update assigned tasks where allowed.
- Can see own school/calendar/task items if enabled.
- Should not access finance, retirement, adult documents, medical records for others, household settings, or raw AI context.

### Guest

- Future role.
- No default access to private household data.
- Specific scoped access only, such as a sitter checklist or a club/community view.

## Household Membership Enforcement

For household-scoped tables:

- `select`: allow active members, with role filters for sensitive tables.
- `insert`: require active membership and validate `household_id`.
- `update`: require active membership and appropriate role.
- `delete`: restrict to admin/adult depending on table sensitivity.

Avoid trusting a client-provided role. Roles must come from `household_members`.

## Child / Member Access Considerations

Model children as `people` first. Only create an auth user and `household_members.user_id` when the child needs to sign in.

Use `subject_person_id` for data about a child:

- College scores.
- College essays.
- Medical records.
- Child-specific documents.
- Assigned tasks.
- Events.

Child access should be table- and record-specific, not a blanket membership permission.

## Privacy-Sensitive Tables

Treat these as adult/admin by default:

- Finance accounts.
- Transactions.
- Mortgage and debt.
- Retirement accounts and assumptions.
- Net worth snapshots.
- Documents.
- Medical records.
- AI context snapshots.
- Calendar events involving locations or child routines.
- College essays, scores, and admissions notes.

## Common Policy Patterns

General household table:

```sql
using (is_household_member(household_id))
with check (is_household_member(household_id))
```

Adult-only table:

```sql
using (has_household_role(household_id, array['admin','adult']))
with check (has_household_role(household_id, array['admin','adult']))
```

Admin-only settings:

```sql
using (has_household_role(household_id, array['admin']))
with check (has_household_role(household_id, array['admin']))
```

Assigned child task:

```sql
using (
  has_household_role(household_id, array['admin','adult'])
  or assigned_user_id = auth.uid()
)
```

## Security Risks To Avoid

1. Do not add `household_id` without changing RLS; that creates a false sense of safety.
2. Do not rely on frontend checks for role restrictions.
3. Do not let users insert records into households where they are not members.
4. Do not expose adult-only data to AI context builders for child users.
5. Do not store long-lived OAuth tokens only in browser `localStorage`.
6. Do not make storage bucket policies looser than document metadata policies.
7. Do not create guest/community access paths that can query private household tables by accident.

