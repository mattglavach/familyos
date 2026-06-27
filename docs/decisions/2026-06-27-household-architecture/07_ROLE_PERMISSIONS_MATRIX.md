# Role Permissions Matrix

Decision date: 2026-06-27

## Roles

- `owner`: active role. Full household control.
- `adult`: active role. Trusted adult access to shared household modules.
- `child_profile`: profile-only for now. No login or RLS access in the first migration.
- `guest_future`: reserved future role. No access in the first migration.

## Matrix

| Permission | owner | adult | child_profile | guest_future | Notes |
| --- | --- | --- | --- | --- | --- |
| View household dashboard | Yes | Yes | No login | No | Child dashboard can be added later after child auth exists. |
| Manage household settings | Yes | No | No | No | Owner-only for first migration. |
| Manage members | Yes | No | No | No | Adult member management can be revisited later. |
| Manage finance records | Yes | Yes | No | No | Finance is sensitive; owner/adult only. |
| Manage pool records | Yes | Yes | No | No | Household-shared operational data. |
| Manage home maintenance | Yes | Yes | No | No | Household-shared operational data. |
| Manage college planning | Yes | Yes | No | No | Child profile can be the subject of records, but not an actor yet. |
| Manage documents | Yes | Yes | No | No | Documents are sensitive; future document-level visibility may be needed. |
| Manage tasks | Yes | Yes | No | No | Child task participation waits for child login design. |
| Manage AI context | Yes | Yes | No | No | AI context must be role-filtered and exclude child/guest access initially. |
| Invite members | Yes | No | No | No | Invitation UX is deferred; owner-only when added. |
| Delete household data | Yes | Limited | No | No | Adult deletes should be limited to normal module records; destructive household deletion is owner-only. |

## First-Migration Policy Defaults

- Build policies for `owner` and `adult` first.
- Do not grant `child_profile` database access.
- Do not grant `guest_future` database access.
- Use owner/adult-only policies for sensitive modules.
- Add finer permissions only after real product workflows require them.

