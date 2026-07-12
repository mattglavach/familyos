# Release 0.9 Plan - Household Collaboration

## Theme
Household Collaboration.

## Goal
Make Family OS usable by multiple household members, not only the first signed-in owner.

## Implemented Scope
- Add secure household invitations backed by `household_invitations`.
- Store only invitation token hashes in Supabase.
- Accept and decline invitations through security-definer RPCs.
- Preserve invite tokens through sign-in links with `?invite=...`.
- Add an authenticated invite acceptance screen.
- Add household switching support in `HouseholdContext`.
- Add household member directory, pending invite list, invite creation, invite revocation, and owner-only member role/removal controls in Settings.
- Keep Tasks assigned to household people through `assigned_person_id`.

## Validation Results - July 2, 2026
Environment: local Docker Supabase database container `supabase_db_familyos`, disposable database `familyos_r09_validation`. Production Supabase was not touched.

Setup:
- Dropped and recreated `familyos_r09_validation`.
- Created a minimal local Supabase auth harness with `auth.users` and `auth.uid()`.
- Seeded local-only validation users for owner, invited adult, and invited viewer.
- Applied `supabase/schema.sql`.
- Applied all migrations through `supabase/migrations/20260702000000_release_0_9_household_collaboration.sql`.

Migration results:
- Full scratch migration chain passed.
- Release 0.9 migration direct re-run passed and is idempotent for table, index, trigger, function, grants, and policy replacement behavior.
- Validation found and fixed one older local migration PostgreSQL 17 ambiguity in `20260627000000_household_foundation.sql`.
- Validation found and fixed Release 0.9 RPC ambiguity in accept/decline invitation functions.
- Validation tightened invitation administration from owner/adult to owner-only to match the Release 0.9 validation gate.

Smoke tests passed:
- `household_invitations` table, constraints, indexes, and no plaintext `invite_token` column.
- Token hash storage only.
- Owner creates invite.
- Invite preview works.
- Invited authenticated user accepts invite.
- Accepted user receives active household membership.
- Accepted user default household preference switches to invited household.
- Invited user can decline invite.
- Owner can revoke pending invite.
- Owner can update member role.
- Owner can remove member by setting membership status to `removed`.
- Non-owner cannot create/revoke invites.
- Non-owner cannot update/remove member records.
- User can switch active household via `user_preferences.default_household_id`.
- Invite redirect preservation behavior keeps `?invite=...`.

Validation still required before tag:
- Run browser smoke tests against a real local/staging Supabase API session for the Settings UI and invite acceptance screen.
- Confirm email/password or magic-link auth redirect behavior in the deployed/staging origin.

## Deferred Scope
- Public self-service sign-up remains deferred because Family OS is still documented as a private manually-provisioned household app.
- Ownership transfer remains deferred until owner-count and recovery rules are designed.
- Broad module RLS conversion from user-owned compatibility to household-only policies remains deferred to avoid breaking existing data access.
- Shopping remains out of scope because there is no separate Shopping module in this codebase.

## Acceptance Checklist
- Owner can create and revoke pending invites.
- Invited user can accept with the matching signed-in email.
- Invite tokens are not stored raw and are returned only on creation.
- Settings shows household members, roles, statuses, and pending invitations.
- Household switch updates `user_preferences.default_household_id`.
- Existing single-household users continue to load the same default household.
