# Live Local Google Calendar Verification

Date: June 29, 2026
Branch: `feature/household-foundation`

## Scope

Attempt live local Google Calendar verification after the Calendar diagnostics sprint.

This validation did not apply production migrations, did not run remote Supabase commands, did not expose secrets, did not commit credentials or tokens, and did not migrate additional household modules.

## Manual Google Cloud Settings Confirmed

Manual Google Cloud confirmation is still incomplete from the repo side because the local app is not configured with a real OAuth client id.

Required Google Cloud settings remain:

Authorized JavaScript Origins:

```text
http://localhost:3000
http://127.0.0.1:3000
```

Also confirm manually:

- Google Calendar API is enabled.
- OAuth consent screen is configured.
- The local test Google account is added as a test user if the app is in Testing mode.
- `REACT_APP_GOOGLE_CLIENT_ID` in `.env.local` is the real OAuth Web client id from the same Google Cloud project.

## Local URLs Tested

- App: `http://127.0.0.1:3000`
- Current local Supabase URL from `.env.local`: `http://127.0.0.1:54321`

## OAuth Result

Live OAuth did not complete.

The in-app browser reached a Google OAuth error page:

```text
invalid_client
The OAuth client was not found.
client_id=local-placeholder.apps.googleusercontent.com
```

Diagnosis: the local app is using a placeholder Google OAuth client id, not a real Google Cloud OAuth Web client id.

This is a local environment configuration blocker. Google Cloud origin settings alone cannot fix `invalid_client`; the app must first be started with a real `REACT_APP_GOOGLE_CLIENT_ID`.

## Events Load Result

Events did not load because OAuth did not complete.

No Calendar API event request can succeed until the local OAuth client id is valid and the user grants read-only Calendar access.

## Errors Encountered

- Google OAuth `invalid_client`
- OAuth client id observed in the failed URL: `local-placeholder.apps.googleusercontent.com`

No secrets were printed or committed.

## Fixes Made

Updated `src/hooks/useGoogleCalendar.js` so placeholder-style values such as `local-placeholder.apps.googleusercontent.com` are treated as unconfigured.

Expected behavior after this fix:

- The app should show a local configuration error.
- The app should not send the user into a broken Google OAuth flow when `REACT_APP_GOOGLE_CLIENT_ID` is a placeholder.

## Token Storage Risk Note

Calendar access tokens are still stored in browser `localStorage` as `gc_token`.

This is acceptable for the current short-term local validation flow, but server-side token storage remains the safer long-term design before production-grade Calendar sync.

## Production OAuth Values Still Needed

Before production Calendar verification:

- Set `REACT_APP_GOOGLE_CLIENT_ID` in Vercel to the real OAuth Web client id.
- Set `REACT_APP_GOOGLE_CALENDAR_ID` in Vercel, usually `primary`.
- Add the Vercel production origin to Google Cloud Authorized JavaScript Origins.
- Add any custom production domain to Google Cloud Authorized JavaScript Origins.
- Add preview origins individually only if preview deployments need Calendar sync.

## Validation Results

- Confirmed branch: `feature/household-foundation`
- Confirmed worktree was clean before changes
- Confirmed `.env.local` has local Supabase values
- Confirmed `.env.local` has a placeholder Google OAuth client id
- Identified `invalid_client` as the live OAuth blocker
- Added app-side placeholder detection for `local-placeholder` style values
- Verified the local app now stays on `http://127.0.0.1:3000` and shows `Google Calendar is not configured. Set REACT_APP_GOOGLE_CLIENT_ID to a Google OAuth Web client ID.`
- Verified no browser console errors during the placeholder-guard check
- Ran `pnpm run build`
- Ran `pnpm run check`

## Recommended Next Sprint

After `.env.local` is updated with the real Google OAuth Web client id:

1. Restart the local React app so Create React App picks up the new env value.
2. Open `http://127.0.0.1:3000`.
3. Click Calendar `Connect`.
4. Complete Google OAuth with the local test account.
5. Confirm the app shows `Synced`.
6. Confirm events load or a clear empty schedule appears.
7. Test disconnect/revoke behavior.
8. Document the successful client id configuration without committing the client id or tokens.
