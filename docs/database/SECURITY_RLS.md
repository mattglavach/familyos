# Supabase Security and RLS

## Principles
- Enable Row Level Security on user-owned tables.
- Restrict access by household_id.
- Sensitive modules require stricter policies.

## Sensitive Areas
- Finance
- Medical
- Documents
- College planning
- Retirement

## Basic Policy Pattern
Users can access records where their profile belongs to the same household.

## Release 0.9 Invitations
- Household invitations store only `token_hash`, never raw invite tokens.
- Owners can list and revoke invitations for their active household through RLS.
- Invite creation, preview, acceptance, and decline use security-definer RPCs.
- Accepting an invite requires an authenticated user whose Supabase auth email matches the invited email.
- Anonymous users are prompted to sign in first; invite links preserve `?invite=...` through magic-link redirects.
- Raw invite tokens are returned only once from invitation creation so a manager can share the invite link.
- Release 0.9 final validation confirmed hash comparisons only, invalid/expired/non-pending invite rejection paths, duplicate pending invite prevention, owner-only invite/revoke/role/remove controls, and hidden non-owner Settings controls for adult/viewer users.
- Production Supabase was not touched during Release 0.9 validation; all smoke tests used disposable local users and the local Supabase Docker stack.

## Release 1.1 Life Lists
- `life_lists` and `life_list_items` have RLS enabled.
- Active household members can read household/shared Life Lists and their items.
- Personal Life Lists are visible only to `owner_user_id`.
- Owners and adults can create, update, and delete household/shared lists and items.
- Any active signed-in member can create personal lists they own.
- Item access is derived from the parent list, including personal-list owner checks and household/shared owner/adult management checks.
- Release 1.1 does not add push/email/SMS notifications, external enrichment APIs, public sharing, ratings, or reviews.

## Future
- Adult-only permissions
- Child-safe views
- Guest/community access
- Ownership transfer and owner recovery flows
