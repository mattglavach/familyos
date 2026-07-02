# Release 0.8 Plan - Secure Google Calendar Foundation

## Goal
Build the server-side foundation for Google Calendar connections so OAuth tokens are owned by the backend and scoped to the active household.

## Scope
- Add `calendar_connections` with `user_id`, `household_id`, provider metadata, server-only token placeholders, sync status, timestamps, indexes, and RLS.
- Add a Vercel API route for calendar connection status, connect URL creation, disconnect/revoke metadata, and normalized event placeholders.
- Add a frontend-safe calendar connection hook and Settings UI status surface.
- Preserve the existing browser Google Calendar path only as a legacy fallback while Release 0.8 OAuth exchange is completed.

## Acceptance Criteria
- Frontend never receives raw Google access or refresh tokens.
- New refresh-token storage is not added to browser `localStorage`.
- Connection records are scoped to `household_id` and `user_id`.
- API rejects requests without a valid Supabase session and active household membership.
- `pnpm run lint` and `pnpm run build` pass.

## Required Environment
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`

## Deferred
- Signed OAuth state storage.
- Actual Google token exchange and refresh.
- Encrypted token read/write implementation.
- Server-side Google Calendar event fetch using refreshed access tokens.
