# Authentication

## Recommended Approach
Use Supabase Auth.

## Private Household Login
FamilyOS is currently a private household app for Matt and his wife. The primary login path is Supabase email/password authentication with persistent browser sessions. Public in-app sign-up is not exposed.

Household users should be created manually in Supabase Authentication > Users, with public sign-up disabled in Supabase Auth settings. The optional `REACT_APP_APPROVED_HOUSEHOLD_EMAILS` setting can list the two approved emails for friendlier client-side errors, but it is not a security boundary because browser environment variables are visible to users. Supabase Auth users, row-level security, and disabled public sign-up remain the enforcement layer.

The sign-in UI handles common failures with friendly messages for wrong password, missing password, invalid email format, unapproved email, and generic auth/network errors. Sessions use the Supabase client persistence settings so users stay signed in after closing and reopening the app until they explicitly sign out or the stored session is cleared.

## Password Reset
Approved household users can request a password reset from the sign-in screen. The client calls `supabase.auth.resetPasswordForEmail` with a redirect to the current app origin plus `/reset-password`, then shows a recovery password form when Supabase opens a password recovery session.

The recovery form calls `supabase.auth.updateUser` with the new password, clears the recovery route from browser history, and leaves the user signed in. Reset email sends share the same send-in-progress and 60-second resend cooldown protections used by magic links to reduce Supabase email rate-limit errors.

If a user lands on `/reset-password` without a valid Supabase recovery session, the app shows an expired/invalid reset-link state instead of the normal sign-in form. The user should request a new reset email from the sign-in screen.

## Magic Links
Email magic-link sign-in remains available only as a secondary fallback. It uses `supabase.auth.signInWithOtp` with `emailRedirectTo` set from the current browser origin. This keeps local sign-ins on `http://localhost:3000` and production sign-ins on the deployed Vercel origin without a separate site URL environment variable.

Supabase Auth URL configuration must match this behavior:
- Set Site URL to the production FamilyOS URL, not localhost.
- Add `http://localhost:3000` as an allowed redirect URL for local development.
- Add the Vercel production URL and any custom production domain as allowed redirect URLs.
- Add `/reset-password` variants for local development, Vercel production, and any custom production domain.
- Add a Vercel preview wildcard only if preview deployments need email sign-in.

The fallback magic-link UI protects Supabase email delivery limits by disabling requests while a link is sending, showing a success message after delivery, and starting a 60-second resend cooldown. The resend action uses the same `signInWithOtp` flow and restarts the cooldown after each successful request. Rate-limit responses are shown as a user-friendly wait-and-retry message instead of raw provider errors.

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
