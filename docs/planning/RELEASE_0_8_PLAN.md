# Release 0.8 Plan - Secure Google Calendar Foundation

## Goal
Build the server-side foundation for Google Calendar connections so OAuth tokens are owned by the backend and scoped to the active household.

## Scope
- Add `calendar_connections` with `user_id`, `household_id`, provider metadata, server-only token placeholders, sync status, timestamps, indexes, and RLS.
- Add a Vercel API route for calendar connection status, signed OAuth start, callback exchange, disconnect/revoke, and normalized event fetch.
- Add a frontend-safe calendar connection hook and Settings UI status surface.
- Preserve the existing browser Google Calendar path only as a legacy fallback while the server-side flow is validated.

## Acceptance Criteria
- Frontend never receives raw Google access or refresh tokens.
- New refresh-token storage is not added to browser `localStorage`.
- Connection records are scoped to `household_id` and `user_id`.
- API rejects requests without a valid Supabase session and active household membership.
- OAuth state is signed and expires after 10 minutes.
- Refresh tokens are encrypted before persistence.
- Server-side event responses are normalized and frontend-safe.
- `pnpm run lint` and `pnpm run build` pass.

## Required Environment
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `GOOGLE_OAUTH_STATE_SECRET`
- `APP_BASE_URL`

## Completed In 0.8B
- Signed OAuth state generation and validation.
- Google OAuth callback code exchange.
- AES-256-GCM token encryption for access and refresh tokens.
- Server-side access-token refresh.
- Google revoke on disconnect.
- Normalized server-side event fetch for the next 30 days.

## Completed In 0.8C
- Dashboard schedule now prefers server-side Google Calendar events when a server connection exists.
- Legacy browser Google Calendar is explicitly labelled as a temporary fallback.
- New legacy browser fallback sessions no longer persist `gc_token` to localStorage.
- Settings explains secure connection, reconnect, disconnect, and fallback behavior.

## Deferred
- Dedicated callback success/error screen inside the React app.
- Manual end-to-end OAuth smoke test in Vercel after environment values are configured.
- Removal of the legacy browser fallback after deployed server OAuth is validated.
