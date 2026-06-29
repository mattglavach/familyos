# FamilyOS

FamilyOS is a mobile-first React app for household operations: calendar overview, tasks, pool care, college planning, and finance snapshots. The current Phase 1 app is a Create React App frontend with Vercel serverless API support and Supabase REST persistence.

## Documentation

Start with the v1 documentation workspace:

- [Master Documentation Index](docs/00_MASTER_INDEX.md)
- [Agent Instructions](AGENTS.md)

## Phase 1 Setup

### Prerequisites

- Node.js and pnpm
- A Supabase project
- A Google Cloud OAuth web client for Calendar access
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

3. Create the Supabase tables by running `supabase/schema.sql` in the Supabase SQL editor.

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
| `REACT_APP_GOOGLE_CALENDAR_ID` | Browser | Calendar ID to read, often `primary` or an email address. |
| `ANTHROPIC_API_KEY` | Server | Used only by `api/brief.js`; do not expose it in frontend code. |
| `ALLOWED_ORIGINS` | Server | Optional comma-separated browser origins allowed to call `api/brief.js`. |

### Google Calendar Setup

In Google Cloud Console, create an OAuth 2.0 web client and add authorized JavaScript origins for local and deployed environments, such as:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- Your Vercel production URL

The app requests read-only Google Calendar access with the Google Identity Services popup token flow and stores the returned access token in browser local storage. The Calendar flow does not use an application redirect URI; Google validates the exact browser origin instead.

### Vercel Deployment

For Vercel deployment, add these environment variables in the Vercel project settings:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_APPROVED_HOUSEHOLD_EMAILS` if using the optional household email allowlist
- `REACT_APP_GOOGLE_CLIENT_ID`
- `REACT_APP_GOOGLE_CALENDAR_ID`
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
