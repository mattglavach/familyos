# Live Google OAuth Verification

Date: June 29, 2026
Branch: `feature/household-foundation`

## Result

Status: blocked before live OAuth.

The local app is still configured with a placeholder Google OAuth client id. Live Google OAuth cannot complete until `.env.local` is updated with a real Google OAuth Web client id and the local React app is restarted.

No production migrations were applied, no remote Supabase commands were run, no Google Cloud settings were modified automatically, no credentials or tokens were committed, and no additional household modules were migrated.

## OAuth Configuration Verified

Current implementation:

- file: `src/hooks/useGoogleCalendar.js`
- OAuth API: Google Identity Services `window.google.accounts.oauth2.initTokenClient`
- OAuth mode: popup token flow
- scope: `https://www.googleapis.com/auth/calendar.readonly`
- client id source: `REACT_APP_GOOGLE_CLIENT_ID`
- calendar id source: `REACT_APP_GOOGLE_CALENDAR_ID`
- token storage: browser `localStorage` key `gc_token`

## Redirect URI Used

Family OS Calendar sync does not configure or generate an application redirect URI.

The app uses the Google Identity Services popup token flow. For this flow, Google validates the browser origin, not an app callback URL.

Local origin expected during this test:

```text
http://127.0.0.1:3000
```

## Google Cloud Settings Verified

The required Google Cloud values are known, but they cannot be fully verified from the repo because Google Cloud Console is not modified or queried by this task.

Required Authorized JavaScript Origins:

```text
http://localhost:3000
http://127.0.0.1:3000
```

Authorized Redirect URI:

```text
None required by Family OS Calendar sync.
```

Required scope:

```text
https://www.googleapis.com/auth/calendar.readonly
```

Manual confirmations still required:

- Google Calendar API is enabled.
- OAuth consent screen is configured.
- The local test Google account is added as a test user if the app is in Testing mode.
- `.env.local` contains the real OAuth Web client id from the same Google Cloud project.

## Local Test Results

Local environment inspection:

- `REACT_APP_SUPABASE_URL` points to local Supabase: `http://127.0.0.1:54321`
- `REACT_APP_GOOGLE_CALENDAR_ID` is set to `primary`
- `REACT_APP_GOOGLE_CLIENT_ID` is set, but still matches a placeholder-style value

Live OAuth result:

- Google login: not attempted in this run
- Consent: not attempted in this run
- Redirect/app return: not applicable
- Connected state: not reached
- Events load/empty state: not reached
- Refresh persistence: not tested
- Disconnect/reconnect: not tested

Reason: attempting OAuth with a placeholder client id produces Google `invalid_client`. The app now blocks placeholder-style values before redirecting to Google and shows a local configuration error instead.

## Remaining Production Configuration

Before production Calendar verification:

- Set `REACT_APP_GOOGLE_CLIENT_ID` in Vercel to the real OAuth Web client id.
- Set `REACT_APP_GOOGLE_CALENDAR_ID` in Vercel, usually `primary`.
- Add the Vercel production origin to Google Cloud Authorized JavaScript Origins.
- Add any custom production domain to Google Cloud Authorized JavaScript Origins.
- Add preview deployment origins individually only if preview Calendar sync is required.
- Redeploy after changing Vercel environment variables.

## Risks

- Calendar tokens are still stored in browser `localStorage`; this is acceptable for local validation but should be replaced with a server-side token storage model before production-grade sync.
- OAuth configuration is origin-sensitive. `localhost` and `127.0.0.1` are separate origins and both must be configured if both are used.
- A valid-looking value ending in `.apps.googleusercontent.com` can still be invalid if it is not a real OAuth Web client id from the correct Google Cloud project.

## Recommended Next Sprint

After replacing the local placeholder client id:

1. Restart the local React app.
2. Open `http://127.0.0.1:3000`.
3. Click Calendar `Connect`.
4. Complete Google account login and consent.
5. Confirm the app displays connected/synced state.
6. Confirm events load or the schedule shows a clear empty state.
7. Refresh the browser and confirm the connected state persists.
8. Test disconnect/revoke and reconnect.
9. Update this document with the successful result without committing the OAuth client id or access token.
