# RLS Policy Plan

Plan date: 2026-06-27

This is a policy plan only. Do not apply policies from this document directly.

## Policy Principles

- RLS must enforce access through household membership.
- Frontend role checks are not security.
- `owner` and `adult` are active roles for first migration.
- `child_profile` has no login access in first migration.
- `guest_future` has no access in first migration.
- Sensitive modules are owner/adult only.
- Keep old `user_id` policy during staged migration until household policies pass verification.

## Common Reusable Policy Patterns

Planned helper functions:

- `is_household_member(target_household_id uuid)`
- `has_household_role(target_household_id uuid, allowed_roles text[])`
- `is_household_owner(target_household_id uuid)`

General household policy intent:

```text
allow select/insert/update when current auth.uid()
has active owner/adult membership in row.household_id
```

Owner-only policy intent:

```text
allow action only when current auth.uid()
has active owner membership in row.household_id
```

Non-member denial:

```text
no policy should allow rows for households where auth.uid()
does not have active membership
```

## Table Policy Plan

| Area | Policy Intent | Allowed Roles | Risks | Testing Approach |
| --- | --- | --- | --- | --- |
| `profiles` | User can read/update own profile; possibly household members can read basic profile fields later. | Own user only initially | Leaking profile fields across households. | User A cannot update User B profile. |
| `households` | Owner/adult can read household; owner can update settings. | Read: owner/adult. Update: owner. | Adults accidentally changing household-level settings. | Adult read works; adult update settings denied. |
| `household_members` | Owner manages memberships; adult can read household membership list if needed. | Owner manage; owner/adult read | Membership table controls all access; weak policy is high risk. | Non-member cannot read member list; adult cannot promote roles. |
| `people` | Owner/adult can manage household people. | owner/adult | Child/person data privacy. | Owner/adult access; non-member denied. |
| General module tables | Owner/adult can read/write household operational records. | owner/adult | Overly broad access for sensitive records. | Verify Pool/Tasks/Home work for adult and deny non-member. |
| Finance | Owner/adult only. | owner/adult | Financial privacy. | Non-member denied; future child/guest denied. |
| Retirement | Owner/adult only. | owner/adult | Financial privacy. | Same as finance. |
| Documents | Owner/adult only in first migration. | owner/adult | Storage policies may not match metadata policies. | Metadata denied to non-member; storage not implemented in first migration. |
| AI context | Owner/adult only; role-filtered source data. | owner/adult | Cross-module leakage. | AI context cannot read data beyond user role. |
| Tasks | Owner/adult for first migration. | owner/adult | Future child assignments need additional policy. | Existing task behavior works for owner/adult. |
| Pool/Home | Owner/adult for first migration. | owner/adult | Low privacy but tied to household/property. | Existing module behavior works for owner/adult. |
| College | Owner/adult for first migration. | owner/adult | Sensitive child data. | Child profile has no login; non-member denied. |

## RLS Transition Sequence

1. Add foundation tables and memberships.
2. Add `household_id` columns.
3. Backfill `household_id`.
4. Create helper functions.
5. Add household policies in parallel with old user policy if needed.
6. Test owner/adult/non-member.
7. Update app data access.
8. Remove or disable old user-only policies only after verification.

## Risks To Avoid

- Adding `household_id` without membership RLS.
- Removing `user_id` before app code is household-aware.
- Letting client-provided `household_id` bypass membership.
- Granting guest or child auth access during first migration.
- Applying document metadata policies without matching storage policies later.

## Testing Approach

Minimum RLS test personas:

- Owner user.
- Adult user in same household.
- Authenticated non-member.
- Child profile record with no auth user.
- Guest future role with no policy access.

Minimum tests:

- Owner can read/write household rows.
- Adult can read/write normal module rows.
- Adult cannot manage household settings/members unless explicitly allowed.
- Non-member sees zero household rows.
- Sensitive tables are owner/adult only.
- Insert with another household id fails.

