# Authentication

## Recommended Approach
Use Supabase Auth.

## Private Household Login
FamilyOS is currently a private household app for Matt and his wife. The primary login path is Supabase email/password authentication with persistent browser sessions. Public in-app sign-up is not exposed.

Household users should be created manually in Supabase Authentication > Users, with public sign-up disabled in Supabase Auth settings. The optional `REACT_APP_APPROVED_HOUSEHOLD_EMAILS` setting can list the two approved emails for friendlier client-side errors, but it is not a security boundary because browser environment variables are visible to users. Supabase Auth users, row-level security, and disabled public sign-up remain the enforcement layer.

The sign-in UI handles common failures with friendly messages for wrong password, missing password, unapproved email, and generic auth/network errors. Sessions use the Supabase client persistence settings so users stay signed in after closing and reopening the app until they explicitly sign out or the stored session is cleared.

## Magic Links
Email magic-link sign-in remains available only as a secondary fallback. It uses `supabase.auth.signInWithOtp` with `emailRedirectTo` set from the current browser origin. This keeps local sign-ins on `http://localhost:3000` and production sign-ins on the deployed Vercel origin without a separate site URL environment variable.

Supabase Auth URL configuration must match this behavior:
- Set Site URL to the production FamilyOS URL, not localhost.
- Add `http://localhost:3000` as an allowed redirect URL for local development.
- Add the Vercel production URL and any custom production domain as allowed redirect URLs.
- Add a Vercel preview wildcard only if preview deployments need email sign-in.

The fallback magic-link UI protects Supabase email delivery limits by disabling requests while a link is sending, showing a success message after delivery, and starting a 60-second resend cooldown. The resend action uses the same `signInWithOtp` flow and restarts the cooldown after each successful request. Rate-limit responses are shown as a user-friendly wait-and-retry message instead of raw provider errors.

## Roles
- admin
- adult
- child
- guest

## Google Calendar OAuth
Calendar sync is optional. The preferred path uses the server-side `api/calendar.js` route with signed OAuth state, encrypted token storage, Supabase session validation, and active household membership checks. The legacy browser token path remains temporary for older devices and local fallback behavior.

The Calendar UI must show setup guidance when OAuth or server settings are missing rather than exposing raw environment variable names or provider errors. See `docs/setup/google-calendar-oauth.md`.

## Access Principles
- Sensitive modules require authenticated access.
- Finance, medical, and documents should be restricted.
- Children should have limited access.
- Club/community views should never expose private household data.

## Future
- Role-based access control
- Household-level permissions
