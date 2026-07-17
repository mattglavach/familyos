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
- REACT_APP_APPROVED_HOUSEHOLD_EMAILS, optional comma-separated approved household emails for friendlier login errors
- REACT_APP_GOOGLE_CLIENT_ID, optional browser Calendar fallback
- REACT_APP_GOOGLE_CALENDAR_ID, optional browser Calendar fallback
- SUPABASE_SERVICE_ROLE_KEY, required only for server-side Calendar sync
- GOOGLE_OAUTH_CLIENT_ID, required only for server-side Calendar sync
- GOOGLE_OAUTH_CLIENT_SECRET, required only for server-side Calendar sync
- GOOGLE_OAUTH_REDIRECT_URI, required only for server-side Calendar sync
- GOOGLE_TOKEN_ENCRYPTION_KEY, required only for server-side Calendar sync
- GOOGLE_OAUTH_STATE_SECRET, required only for server-side Calendar sync
- GOOGLE_CALENDAR_ID, optional server-side Calendar ID
- APP_BASE_URL, required only for server-side Calendar OAuth return links
- ANTHROPIC_API_KEY
- AI_PROVIDER
- AI_PROVIDER_MODEL
- AI_PROVIDER_API_KEY
- AI_REQUEST_TIMEOUT_MS
- ALLOWED_ORIGINS, when using a custom domain or non-Vercel production URL

FamilyOS is a Create React App deployment, so browser-visible variables use the `REACT_APP_` prefix. It does not use `NEXT_PUBLIC_SITE_URL`, `VITE_SITE_URL`, or `REACT_APP_SITE_URL` for Supabase Auth redirects. Email/password sign-in is the primary auth path. Fallback email magic links use the current app origin and require matching Supabase Auth allowed redirect URLs.

Google Calendar sync is optional. The preferred path uses the server-side Calendar API with Supabase membership checks and encrypted token storage. The legacy browser fallback uses Google Identity Services with `REACT_APP_GOOGLE_CLIENT_ID` and `REACT_APP_GOOGLE_CALENDAR_ID`. See `docs/setup/google-calendar-oauth.md`.

## Supabase Auth URL Settings
- Site URL should be the production FamilyOS URL.
- Allowed redirect URLs should include `http://localhost:3000`, the Vercel production URL, any custom production domain, and preview URL patterns if preview sign-in is needed.
- Public sign-up should stay disabled for the private household app.
- Create Matt and his wife's users manually in Supabase Authentication > Users and set their passwords there.

## Deployment Rules
- Git-triggered deployment through the linked GitHub repository and Vercel Git integration is the standard FamilyOS deployment workflow. A push or merge to `main` triggers the production deployment; the repository does not use a separate GitHub Actions deployment workflow.
- Feature branches should be tested before merge.
- Database migrations must be reviewed before production.

## Vercel CLI Policy

The Vercel CLI is an approved standard development and release tool when already installed and configured. Codex may use it for:

- Authentication verification.
- Project-link verification.
- Inspecting projects and deployments.
- Reviewing deployment status.
- Reviewing build and runtime logs.
- Read-only production verification.
- Local Vercel-compatible validation when specifically required.

The presence of the Vercel CLI does not authorize Codex to deploy automatically. Codex must not run a command that creates, promotes, rolls back, aliases, removes, or otherwise changes a Vercel deployment unless the requested outcome clearly authorizes that action under the canonical lifecycle rules. This includes, but is not limited to:

- `vercel` when used without an inspection subcommand because the bare command starts a deployment
- `vercel deploy`
- `vercel --prod`
- `vercel deploy --prod`
- `vercel promote`
- `vercel rollback`
- `vercel remove`
- Commands that alter domains, aliases, project settings, or environment variables.

Release-specific restrictions on deployment, installation, dependency changes, production changes, or environment changes override the general approval to use the Vercel CLI.

## Secrets and Local Vercel Files

Codex must never print, expose, copy into reports, or commit secret values. Commands that download, add, update, or remove Vercel environment variables require explicit authorization unless the current task already provides that authorization.

Generated local Vercel metadata and environment files must remain excluded from Git where appropriate. Before creating them, verify that sensitive paths such as `.vercel/`, `.env.local`, and `.env.*.local` are covered by `.gitignore`.
