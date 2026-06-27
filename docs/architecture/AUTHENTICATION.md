# Authentication

## Recommended Approach
Use Supabase Auth.

## Magic Links
Email magic-link sign-in uses `supabase.auth.signInWithOtp` with `emailRedirectTo` set from the current browser origin. This keeps local sign-ins on `http://localhost:3000` and production sign-ins on the deployed Vercel origin without a separate site URL environment variable.

Supabase Auth URL configuration must match this behavior:
- Set Site URL to the production FamilyOS URL, not localhost.
- Add `http://localhost:3000` as an allowed redirect URL for local development.
- Add the Vercel production URL and any custom production domain as allowed redirect URLs.
- Add a Vercel preview wildcard only if preview deployments need email sign-in.

The sign-in UI protects Supabase email delivery limits by disabling requests while a link is sending, showing a success message after delivery, and starting a 60-second resend cooldown. The resend action uses the same `signInWithOtp` flow and restarts the cooldown after each successful request. Rate-limit responses are shown as a user-friendly wait-and-retry message instead of raw provider errors.

## Roles
- admin
- adult
- child
- guest

## Google Calendar OAuth
Calendar sync uses Google Identity Services token auth in the browser. The OAuth client and calendar are configured through `REACT_APP_GOOGLE_CLIENT_ID` and `REACT_APP_GOOGLE_CALENDAR_ID`; the runtime OAuth origin is `window.location.origin`. Google Cloud Console must include each local and deployed app origin under Authorized JavaScript origins. See `docs/setup/google-calendar-oauth.md`.

## Access Principles
- Sensitive modules require authenticated access.
- Finance, medical, and documents should be restricted.
- Children should have limited access.
- Club/community views should never expose private household data.

## Future
- Role-based access control
- Household-level permissions
