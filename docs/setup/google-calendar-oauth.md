# Google Calendar OAuth Setup

Family OS has two Google Calendar paths:

- The secure server-side path is preferred and powers the dashboard schedule whenever a server connection exists.
- The legacy browser fallback is temporary for devices that have not completed the secure connection.

## Environment Variables

Google Calendar is optional. When these values are missing, the app should show a disconnected setup state and keep non-calendar workflows available.

Set these values locally in `.env.local`, in staging, and in Vercel production when validating Calendar sync:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_CALENDAR_ID=primary
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://your-familyos-domain.vercel.app/api/calendar?action=callback
GOOGLE_TOKEN_ENCRYPTION_KEY=base64-encoded-32-byte-key-for-token-encryption
GOOGLE_OAUTH_STATE_SECRET=your-random-state-signing-secret
GOOGLE_CALENDAR_ID=primary
APP_BASE_URL=https://your-familyos-domain.vercel.app
```

`REACT_APP_GOOGLE_CLIENT_ID` must be an OAuth 2.0 Web application client ID from Google Cloud Console. `REACT_APP_GOOGLE_CALENDAR_ID` is usually `primary`, or a specific Google Calendar ID when syncing a shared calendar.

`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_TOKEN_ENCRYPTION_KEY`, and `GOOGLE_OAUTH_STATE_SECRET` are server-only values. Do not prefix them with `REACT_APP_` and do not use them in frontend code.

The server-side path also requires the `calendar_connections` table from the Release 0.8 migration and a valid active household membership for the signed-in user.

## Release 0.8 Server-Side Foundation

The server-side foundation is implemented in `api/calendar.js` and stores metadata in `public.calendar_connections`.

- `action=status`: returns frontend-safe connection metadata.
- `action=connections`: lists frontend-safe connection metadata.
- `action=connect`: creates a pending server-side connection record and returns a Google OAuth authorization URL with signed state.
- `action=callback`: validates signed state, exchanges the authorization code, encrypts token material, and stores connection metadata.
- `action=disconnect`: revokes the Google token when available, marks the connection revoked, and clears token columns.
- `action=events`: refreshes access tokens when needed and returns normalized frontend-safe event objects for the next 30 days.

The API requires a Supabase session bearer token and validates active membership in the requested `household_id`. Responses never include `access_token_ciphertext` or `refresh_token_ciphertext`.

Release 0.8C wires dashboard schedule reads to this server-side event API when a server connection exists. The legacy browser fallback remains visible but is labelled temporary, and new fallback sessions no longer write `gc_token` to browser localStorage.

## Legacy Browser OAuth Flow

The current implementation is in `src/hooks/useGoogleCalendar.js`.

- Google script: `https://accounts.google.com/gsi/client`
- OAuth API: `window.google.accounts.oauth2.initTokenClient`
- Scope: `https://www.googleapis.com/auth/calendar.readonly`
- Client ID: `REACT_APP_GOOGLE_CLIENT_ID`
- Calendar ID: `REACT_APP_GOOGLE_CALENDAR_ID`
- Runtime origin: `window.location.origin`
- Redirect URI: none configured by Family OS for the Calendar token popup flow
- Event window: next 30 days
- Local browser storage keys: `gc_token`, `gc_user_name`, and `gc_last_synced_at`
- Release 0.8C no longer writes new `gc_token` values. Existing browser tokens may continue to work until cleared or expired.

Because the token client is initialized in browser JavaScript, Google validates the exact origin serving the app. An `Error 400: origin_mismatch` means the current origin is missing from the OAuth client's Authorized JavaScript origins.

The dashboard surfaces the Calendar connection state directly. It distinguishes disconnected, connecting, syncing, synced, empty calendar, expired token, missing permission, and failed API response states. A `401` response clears the stored token and asks the user to reconnect. A `403` response keeps the visible connection state but explains that calendar read permission must be approved again.

## Required Google Cloud Console Values

In Google Cloud Console, open **APIs & Services > Credentials > OAuth 2.0 Client IDs** and select the Web application client used by `REACT_APP_GOOGLE_CLIENT_ID`.

Add every app origin that will run Calendar sync to **Authorized JavaScript origins**:

```text
http://localhost:3000
https://YOUR_VERCEL_PRODUCTION_DOMAIN.vercel.app
https://YOUR_CUSTOM_DOMAIN
```

Use the exact Vercel production URL shown by Vercel, including `https://` and no trailing slash. If Family OS uses a custom production domain, add that custom domain too. If Vercel preview deployments need Calendar sync, add each preview origin you intend to use. Google OAuth JavaScript origins do not support Vercel wildcard patterns.

For the current Google Identity Services token popup flow, **Authorized redirect URIs** are not used by Family OS Calendar sync. Leave them empty for this client unless another app uses the same OAuth client with a redirect-based flow.

For the Release 0.8 server-side flow, add this exact redirect URI to **Authorized redirect URIs**:

```text
https://YOUR_VERCEL_PRODUCTION_DOMAIN.vercel.app/api/calendar?action=callback
```

If Google Cloud Console requires a redirect URI for the Web client, add only exact app URLs that you intentionally support:

```text
http://localhost:3000
https://YOUR_VERCEL_PRODUCTION_DOMAIN.vercel.app
https://YOUR_CUSTOM_DOMAIN
```

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Set `REACT_APP_GOOGLE_CLIENT_ID` to the Google OAuth Web client ID.
3. Set `REACT_APP_GOOGLE_CALENDAR_ID` to `primary` or the target calendar ID.
4. Set the server-only OAuth and Supabase service-role values.
5. Add `http://localhost:3000` to Authorized JavaScript origins.
6. Add `http://localhost:3000/api/calendar?action=callback` to Authorized redirect URIs if testing the server route locally.
7. Run `pnpm start`.
8. Open `http://localhost:3000` and click **Connect** in the Server-side Google Calendar section.

If local Calendar configuration is intentionally omitted, validate that Calendar, Settings, and Notifications show setup guidance rather than raw environment-variable or SQL errors.

## Staging

1. Apply the full Supabase migration chain to staging, including `calendar_connections`.
2. Set all browser and server Calendar environment variables in the staging deployment.
3. Add the staging app origin to Authorized JavaScript origins.
4. Add the staging callback URL to Authorized redirect URIs.
5. Sign in as a staging household member and verify status, connect, event sync, disconnect, and reconnect.

## Vercel Production

1. In Vercel, set `REACT_APP_GOOGLE_CLIENT_ID`.
2. In Vercel, set `REACT_APP_GOOGLE_CALENDAR_ID`.
3. In Google Cloud Console, add the deployed Vercel production origin to Authorized JavaScript origins.
4. If using a custom domain, add the custom domain origin too.
5. Add the configured `GOOGLE_OAUTH_REDIRECT_URI` to Authorized redirect URIs.
6. Redeploy after changing Vercel environment variables.
7. Open the deployed production URL and click **Connect** in the Server-side Google Calendar section.

Do not reuse local secrets in production. Rotate `GOOGLE_TOKEN_ENCRYPTION_KEY` only with a token migration or by forcing existing Calendar connections to reconnect.

## Troubleshooting `origin_mismatch`

When the error appears, compare the browser's current origin to Google Cloud Console:

```js
window.location.origin
```

That exact value must appear in Authorized JavaScript origins for the same OAuth client ID configured in `REACT_APP_GOOGLE_CLIENT_ID`.

Common causes:

- The OAuth client has `http://localhost:3000` but not the Vercel production origin.
- The OAuth client has a custom domain but the app is being opened on the `vercel.app` domain.
- The app is using a different Google OAuth client ID than the one being edited in Google Cloud Console.
- A Vercel preview deployment is being used, but that preview origin was not added.
