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
- Managers can list and revoke invitations for their active household through RLS.
- Invite creation, preview, acceptance, and decline use security-definer RPCs.
- Accepting an invite requires an authenticated user whose Supabase auth email matches the invited email.
- Anonymous users are prompted to sign in first; invite links preserve `?invite=...` through magic-link redirects.
- Raw invite tokens are returned only once from invitation creation so a manager can share the invite link.

## Future
- Adult-only permissions
- Child-safe views
- Guest/community access
- Ownership transfer and owner recovery flows
