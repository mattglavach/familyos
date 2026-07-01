# Release 0.7 Calendar Foundation Assessment

## Current Implementation
Google Calendar still uses the browser Google Identity Services token client in `src/hooks/useGoogleCalendar.js`.

The app stores:
- `gc_token`
- `gc_user_name`
- `gc_last_synced_at`

in browser localStorage. The access token is short-lived and is used directly from the browser against the Google Calendar API.

## What Must Move Server-Side
- OAuth authorization code exchange.
- Refresh token storage.
- Access token refresh.
- Calendar API reads.
- Connection ownership by `user_id` and `household_id`.
- Revocation and reconnect handling.

## Proposed Future Model
Add a server-side `calendar_connections` table with:
- `id`
- `household_id`
- `user_id`
- `provider`
- `calendar_id`
- encrypted refresh token material
- provider account email/name
- scopes
- status
- last_synced_at
- created_at / updated_at

Calendar API calls should run through a Vercel API route or dedicated backend function. The frontend should receive normalized event data and connection status, not raw OAuth tokens.

## Release 0.7 Decision
Do not build full calendar sync in Release 0.7. Keep the existing browser popup integration for continuity, document the server-side requirements, and leave token migration for Release 0.8 or a dedicated security milestone.
