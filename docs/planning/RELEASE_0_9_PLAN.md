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

## Deferred Scope
- Public self-service sign-up remains deferred because Family OS is still documented as a private manually-provisioned household app.
- Ownership transfer remains deferred until owner-count and recovery rules are designed.
- Broad module RLS conversion from user-owned compatibility to household-only policies remains deferred to avoid breaking existing data access.
- Shopping remains out of scope because there is no separate Shopping module in this codebase.

## Acceptance Checklist
- Owner/adult can create and revoke pending invites.
- Invited user can accept with the matching signed-in email.
- Invite tokens are not stored raw and are returned only on creation.
- Settings shows household members, roles, statuses, and pending invitations.
- Household switch updates `user_preferences.default_household_id`.
- Existing single-household users continue to load the same default household.

