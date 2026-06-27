# Deployment

## Platform
Vercel

## Source Control
GitHub

## Database
Supabase

## Environment Variables
Required Vercel variables:
- REACT_APP_SUPABASE_URL
- REACT_APP_SUPABASE_ANON_KEY
- REACT_APP_GOOGLE_CLIENT_ID
- REACT_APP_GOOGLE_CALENDAR_ID
- ANTHROPIC_API_KEY
- ALLOWED_ORIGINS, when using a custom domain or non-Vercel production URL

FamilyOS is a Create React App deployment, so browser-visible variables use the `REACT_APP_` prefix. It does not use `NEXT_PUBLIC_SITE_URL`, `VITE_SITE_URL`, or `REACT_APP_SITE_URL` for Supabase Auth redirects. Email magic links use the current app origin and require matching Supabase Auth allowed redirect URLs.

Google Calendar sync uses Google Identity Services in the browser with `REACT_APP_GOOGLE_CLIENT_ID` and `REACT_APP_GOOGLE_CALENDAR_ID`. The OAuth origin is the current deployed app origin, so Google Cloud Console Authorized JavaScript origins must include the Vercel production origin and any custom production domain. See `docs/setup/google-calendar-oauth.md`.

## Supabase Auth URL Settings
- Site URL should be the production FamilyOS URL.
- Allowed redirect URLs should include `http://localhost:3000`, the Vercel production URL, any custom production domain, and preview URL patterns if preview sign-in is needed.

## Deployment Rules
- Main branch deploys production.
- Feature branches should be tested before merge.
- Database migrations must be reviewed before production.
