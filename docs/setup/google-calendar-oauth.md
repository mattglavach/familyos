# Google Calendar OAuth Setup

Family OS has two Google Calendar paths during Release 0.8:

- The legacy browser fallback uses Google Identity Services in the browser to request a short-lived access token.
- The Release 0.8 foundation stores connection metadata server-side and prepares for backend-owned OAuth tokens.

## Environment Variables

Set these values locally in `.env.local` and in Vercel:

```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_CALENDAR_ID=primary
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://your-familyos-domain.vercel.app/api/calendar?action=callback
GOOGLE_TOKEN_ENCRYPTION_KEY=base64-encoded-32-byte-key-for-token-encryption
```

`REACT_APP_GOOGLE_CLIENT_ID` must be an OAuth 2.0 Web application client ID from Google Cloud Console. `REACT_APP_GOOGLE_CALENDAR_ID` is usually `primary`, or a specific Google Calendar ID when syncing a shared calendar.

`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_OAUTH_CLIENT_SECRET`, and `GOOGLE_TOKEN_ENCRYPTION_KEY` are server-only values. Do not prefix them with `REACT_APP_` and do not use them in frontend code.

## Release 0.8 Server-Side Foundation

The server-side foundation is implemented in `api/calendar.js` and stores metadata in `public.calendar_connections`.

- `action=status`: returns frontend-safe connection metadata.
- `action=connections`: lists frontend-safe connection metadata.
- `action=connect`: creates a pending server-side connection record and prepares an OAuth authorization URL when server OAuth env vars are present.
- `action=disconnect`: marks the connection revoked and clears token placeholder columns.
- `action=events`: returns normalized frontend-safe event placeholders until token exchange and refresh are implemented.

The API requires a Supabase session bearer token and validates active membership in the requested `household_id`. Responses never include `access_token_ciphertext` or `refresh_token_ciphertext`.

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
4. Add `http://localhost:3000` to Authorized JavaScript origins.
5. Run `pnpm start`.
6. Open `http://localhost:3000` and click **Connect**.

## Vercel Production

1. In Vercel, set `REACT_APP_GOOGLE_CLIENT_ID`.
2. In Vercel, set `REACT_APP_GOOGLE_CALENDAR_ID`.
3. In Google Cloud Console, add the deployed Vercel production origin to Authorized JavaScript origins.
4. If using a custom domain, add the custom domain origin too.
5. Redeploy after changing Vercel environment variables.
6. Open the deployed production URL and click **Connect**.

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
