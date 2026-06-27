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

4. In Supabase Auth settings, enable Email sign-in. Magic-link sign-in is enough for the current app.

5. In Supabase Auth URL settings, set the Site URL to your deployed app URL, then add allowed redirect URLs:

   - `http://localhost:3000`
   - Your Vercel production URL, for example `https://your-familyos-domain.vercel.app`
   - Any custom production domain
   - Optional Vercel preview URL pattern, for example `https://*.vercel.app`

   The app sends magic links with `emailRedirectTo` set to the current browser origin, so sign-in requests from the deployed site redirect back to the deployed site instead of localhost. If Supabase's Site URL is still `http://localhost:3000`, update it before testing production email links.

   After each successful magic-link request, the sign-in UI starts a 60-second resend cooldown. The resend button is disabled during the cooldown and while a request is in flight to avoid Supabase email rate limits.

6. Start local development:

   ```bash
   pnpm start
   ```

7. Sign in through the app once so Supabase creates your user.

8. If you already have data from the pre-auth prototype, copy your Supabase user UUID from Authentication > Users, replace the placeholder in `supabase/backfill-user-id.sql`, and run it in the Supabase SQL editor.

9. Optional: seed starter data by copying your Supabase user UUID from Authentication > Users, replacing the placeholder in `supabase/seed.sql`, and running it in the Supabase SQL editor.

10. Build before deployment or handoff:

   ```bash
   pnpm run build
   ```

11. Run the full local check:

   ```bash
   pnpm run check
   ```

### Environment Variables

Create `.env.local` from `.env.example` and set:

| Variable | Used by | Notes |
| --- | --- | --- |
| `REACT_APP_SUPABASE_URL` | Browser | Supabase project REST URL. |
| `REACT_APP_SUPABASE_ANON_KEY` | Browser | Supabase anon key. Configure RLS appropriately. |
| `REACT_APP_GOOGLE_CLIENT_ID` | Browser | Google OAuth web client ID. |
| `REACT_APP_GOOGLE_CALENDAR_ID` | Browser | Calendar ID to read, often `primary` or an email address. |
| `ANTHROPIC_API_KEY` | Server | Used only by `api/brief.js`; do not expose it in frontend code. |
| `ALLOWED_ORIGINS` | Server | Optional comma-separated browser origins allowed to call `api/brief.js`. |

### Google Calendar Setup

In Google Cloud Console, create an OAuth 2.0 web client and add authorized JavaScript origins for local and deployed environments, such as:

- `http://localhost:3000`
- Your Vercel production URL

The app requests read-only Google Calendar access and stores the returned access token in browser local storage.

### Vercel Deployment

For Vercel deployment, add these environment variables in the Vercel project settings:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_GOOGLE_CLIENT_ID`
- `REACT_APP_GOOGLE_CALENDAR_ID`
- `ANTHROPIC_API_KEY`
- `ALLOWED_ORIGINS` if using a custom domain or non-Vercel production URL

`api/brief.js` runs as a Vercel serverless function. The frontend can use the AI brief endpoint after deployment or when running through a Vercel-compatible local dev server.

Supabase Auth does not use a `REACT_APP_SITE_URL` value in this app. Magic-link redirects are derived from `window.location.origin`, and the matching production and preview origins must be present in Supabase Auth URL configuration.

The sign-in form maps Supabase email rate-limit responses to a friendly message and asks users to wait a few minutes before requesting another link.

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
