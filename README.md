# FamilyOS

Current version: 2.10.0

FamilyOS is a mobile-first household operating system centered on one question: “What should I do next?” Home, Family Brief, Habits and Routines, Calendar, Tasks, and global Quick Add form the mature daily operating loop.

FamilyOS is a mobile-first React app for household operations: calendar overview, tasks, pool care, college planning, and finance snapshots. The current Phase 1 app is a Create React App frontend with Vercel serverless API support and Supabase REST persistence.

## Documentation

Start with the v1 documentation workspace:

- [Master Documentation Index](docs/00_MASTER_INDEX.md)
- [Agent Instructions](AGENTS.md)
- [Product Vision](docs/product/PRODUCT_VISION.md)
- [Product Roadmap](docs/product/PRODUCT_ROADMAP.md)
- [Engineering Index](docs/process/ENGINEERING_INDEX.md)
- [Release Playbook](docs/process/RELEASE_PLAYBOOK.md)
- [Feature Playbook](docs/process/FEATURE_PLAYBOOK.md)
- [Family OS Principles](docs/process/FAMILY_OS_PRINCIPLES.md)
- [Production Readiness](docs/process/PRODUCTION_READINESS.md)
- [Engineering Process Docs](docs/process/)
- [Reusable Templates](docs/templates/)

## Phase 1 Setup

### Prerequisites

- Node.js and pnpm
- A Supabase project
- Optional: a Google Cloud OAuth web client for Calendar access
- An Anthropic API key for the AI brief endpoint

### Local Development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the example environment file and fill in the project values:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Create the Supabase schema by running the current migration chain or `supabase/schema.sql` in a disposable/local/staging Supabase environment first. The Release 0.9 household collaboration migration must be present for household invitations.

4. In Supabase Auth settings, enable Email sign-in for email/password authentication. Keep public sign-up disabled for the private household app, then manually create the two household users in Authentication > Users.

5. Optional: set `REACT_APP_APPROVED_HOUSEHOLD_EMAILS` in `.env.local` and Vercel to a comma-separated list of the two approved household emails. This is a browser-visible UX allowlist for friendlier errors; Supabase manually-created users and row-level security remain the real access control.

6. In Supabase Auth URL settings, set the Site URL to your deployed app URL, then add allowed redirect URLs:

   - `http://localhost:3000`
   - Your Vercel production URL, for example `https://your-familyos-domain.vercel.app`
   - Any custom production domain
   - Optional Vercel preview URL pattern, for example `https://*.vercel.app`

   The app sends magic links with `emailRedirectTo` set to the current browser origin, so sign-in requests from the deployed site redirect back to the deployed site instead of localhost. If Supabase's Site URL is still `http://localhost:3000`, update it before testing production email links.

   Email/password sign-in is the primary login path and uses Supabase session persistence so the app stays signed in after closing and reopening on the same device. Magic link remains a secondary fallback. After each successful magic-link request, the sign-in UI starts a 60-second resend cooldown. The resend button is disabled during the cooldown and while a request is in flight to avoid Supabase email rate limits.

7. Start local development:

   ```bash
   pnpm start
   ```

8. Sign in with one of the manually-created Supabase users.

9. If you already have data from the pre-auth prototype, copy your Supabase user UUID from Authentication > Users, replace the placeholder in `supabase/backfill-user-id.sql`, and run it in the Supabase SQL editor.

10. Optional: seed starter data by copying your Supabase user UUID from Authentication > Users, replacing the placeholder in `supabase/seed.sql`, and running it in the Supabase SQL editor.

11. Build before deployment or handoff:

   ```bash
   pnpm run build
   ```

12. Run the full local check:

   ```bash
   pnpm run check
   ```

### Environment Variables

Create `.env.local` from `.env.example` and set:

| Variable | Used by | Notes |
| --- | --- | --- |
| `REACT_APP_SUPABASE_URL` | Browser | Supabase project REST URL. |
| `REACT_APP_SUPABASE_ANON_KEY` | Browser | Supabase anon key. Configure RLS appropriately. |
| `REACT_APP_APPROVED_HOUSEHOLD_EMAILS` | Browser | Optional comma-separated household email allowlist for friendlier login errors. |
| `REACT_APP_GOOGLE_CLIENT_ID` | Browser | Google OAuth web client ID. |
| `REACT_APP_GOOGLE_CALENDAR_ID` | Browser | Optional calendar ID to read, often `primary` or an email address. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Required only for server-side Google Calendar; never expose in frontend code. |
| `GOOGLE_OAUTH_CLIENT_ID` | Server | Required only for server-side Google Calendar OAuth. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Server | Required only for server-side Google Calendar OAuth. |
| `GOOGLE_OAUTH_REDIRECT_URI` | Server | Required only for server-side Google Calendar OAuth callback. |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Server | Required only for encrypted server-side Calendar token storage. |
| `GOOGLE_OAUTH_STATE_SECRET` | Server | Required only for signed server-side Calendar OAuth state. |
| `GOOGLE_CALENDAR_ID` | Server | Optional server-side calendar ID; defaults to `primary` when omitted. |
| `APP_BASE_URL` | Server | Public app URL used by server-side OAuth redirects. |
| `ANTHROPIC_API_KEY` | Server | Used only by `api/brief.js`; do not expose it in frontend code. |
| `ALLOWED_ORIGINS` | Server | Optional comma-separated browser origins allowed to call `api/brief.js`. |

### Google Calendar Setup

In Google Cloud Console, create an OAuth 2.0 web client and add authorized JavaScript origins for local and deployed environments, such as:

- `http://localhost:3000`
- Your Vercel production URL

Google Calendar is optional. When it is not configured, Family OS should show a setup-oriented disconnected state instead of blocking the rest of the app. The preferred server-side Calendar path stores encrypted token material on the server and returns normalized event data. The legacy browser fallback is temporary and documented in [Google Calendar OAuth Setup](docs/setup/google-calendar-oauth.md).

### Vercel Deployment

For Vercel deployment, add these environment variables in the Vercel project settings:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_APPROVED_HOUSEHOLD_EMAILS` if using the optional household email allowlist
- `REACT_APP_GOOGLE_CLIENT_ID`
- `REACT_APP_GOOGLE_CALENDAR_ID`
- `SUPABASE_SERVICE_ROLE_KEY` if using server-side Calendar sync
- `GOOGLE_OAUTH_CLIENT_ID` if using server-side Calendar sync
- `GOOGLE_OAUTH_CLIENT_SECRET` if using server-side Calendar sync
- `GOOGLE_OAUTH_REDIRECT_URI` if using server-side Calendar sync
- `GOOGLE_TOKEN_ENCRYPTION_KEY` if using server-side Calendar sync
- `GOOGLE_OAUTH_STATE_SECRET` if using server-side Calendar sync
- `GOOGLE_CALENDAR_ID` if using a non-primary server-side calendar
- `APP_BASE_URL` for server-side OAuth return links
- `ANTHROPIC_API_KEY`
- `ALLOWED_ORIGINS` if using a custom domain or non-Vercel production URL

`api/brief.js` runs as a Vercel serverless function. The frontend can use the AI brief endpoint after deployment or when running through a Vercel-compatible local dev server.

Supabase Auth does not use a `REACT_APP_SITE_URL` value in this app. Password sign-in is the default login path. Magic-link redirects are derived from `window.location.origin`, and the matching production and preview origins must be present in Supabase Auth URL configuration for fallback magic links.

The sign-in form maps wrong passwords, missing passwords, unapproved emails, Supabase email rate limits, and generic auth/network failures to friendly messages. It does not expose in-app public sign-up.

### Supabase Security Model

`supabase/schema.sql` enables row-level security on every app table. Each table gets a `user_id` column with a default of `auth.uid()`, and policies only allow authenticated users to read or write their own rows.

This means:

- The browser still uses the public Supabase anon key.
- The app must also send the signed-in user's Supabase access token.
- Rows created after sign-in are automatically owned by that user.
- Existing rows without `user_id` must be backfilled with `supabase/backfill-user-id.sql` before they are visible under the new policies.

## Notes

- The Supabase anon key and Google OAuth client ID are browser-visible by design. Keep Supabase row-level security and Google OAuth origins configured for the deployed domain.
- `api/brief.js` proxies Anthropic requests so the Anthropic API key is never exposed to the browser.
- Keep `.env.local` untracked. `.env.example` should contain placeholders only.
