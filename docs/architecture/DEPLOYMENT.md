# Deployment

## Platform
Vercel

`vercel.json` preserves `/api/*` serverless routes and rewrites all other paths to the React app root so Vite deep links, including `/reset-password`, load the app.

## Source Control
GitHub

## Database
Supabase

## Environment Variables
Required Vercel variables:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_APPROVED_HOUSEHOLD_EMAILS, optional comma-separated approved household emails for friendlier login errors
- VITE_GOOGLE_CLIENT_ID
- VITE_GOOGLE_CALENDAR_ID
- ANTHROPIC_API_KEY
- ALLOWED_ORIGINS, when using a custom domain or non-Vercel production URL

FamilyOS is a Vite deployment, so browser-visible variables use the `VITE_` prefix. During the migration window, legacy `REACT_APP_*` values are still accepted as fallback values by the app config, but new local and Vercel configuration should use `VITE_*`. FamilyOS does not use `NEXT_PUBLIC_SITE_URL`, `VITE_SITE_URL`, or `REACT_APP_SITE_URL` for Supabase Auth redirects. Email/password sign-in is the primary auth path. Fallback email magic links use the current app origin, while password resets use the current app origin plus `/reset-password`; both require matching Supabase Auth allowed redirect URLs.

Google Calendar sync uses Google Identity Services in the browser with `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CALENDAR_ID`. The OAuth origin is the current deployed app origin, so Google Cloud Console Authorized JavaScript origins must include the Vercel production origin and any custom production domain. See `docs/setup/google-calendar-oauth.md`.

## Supabase Auth URL Settings
- Site URL should be the production FamilyOS URL.
- Allowed redirect URLs should include `http://localhost:3000`, `http://localhost:3000/reset-password`, the Vercel production URL, the Vercel production `/reset-password` URL, any custom production domain plus its `/reset-password` URL, and preview URL patterns if preview sign-in or password reset is needed.
- Public sign-up should stay disabled for the private household app.
- Create Matt and his wife's users manually in Supabase Authentication > Users and set initial passwords there. Future password resets can be initiated from the FamilyOS sign-in screen.
- If password reset links open the app but do not show the password update form, verify the exact active origin plus `/reset-password` is present in Allowed redirect URLs and that the link has not already been used or expired.

## Deployment Rules
- Main branch deploys production.
- Feature branches should be tested before merge.
- Database migrations must be reviewed before production.
