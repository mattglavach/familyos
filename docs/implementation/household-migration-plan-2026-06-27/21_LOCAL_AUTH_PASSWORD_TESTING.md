# Local Auth Password Testing

## Local Auth Links

- App: `http://127.0.0.1:3000`
- Supabase Studio: `http://127.0.0.1:54323`
- Supabase API: `http://127.0.0.1:54321`
- Local mail UI: `http://127.0.0.1:54324`

No remote Supabase project was linked or used.

## Environment

`.env.local` is ignored by git:

```text
.gitignore:4:.env.local
```

The local file points the browser app at local Supabase:

- `REACT_APP_SUPABASE_URL=http://127.0.0.1:54321`
- `REACT_APP_SUPABASE_ANON_KEY` is set to the local anon key
- `REACT_APP_APPROVED_HOUSEHOLD_EMAILS` includes the local test email
- Google Calendar variables use local placeholders only to satisfy the current setup gate

No `.env.local` content, local passwords, or local keys were committed.

## Test User Setup Approach

A local-only Supabase Auth test user was created through the local Auth Admin API using the local service-role key returned by `pnpm dlx supabase status`.

The user was manually bootstrapped in the local database with:

- `profiles`
- `households`
- `familyos_internal.household_bootstrap_map`
- `household_members` with role `owner`

This mirrors the household-ready state needed by the app without changing production data or production configuration.

## Password Login Results

Passed.

Validation was performed two ways:

1. Supabase API-level login with `signInWithPassword`
2. Browser UI login at `http://127.0.0.1:3000`

The app accepted email/password login and moved from the sign-in screen into the authenticated Family OS shell.

## Session Persistence Results

Passed.

The local Supabase client persisted the session through storage-backed auth state. The browser test also remained authenticated after reloading the local app.

## Household Context Result

Passed.

After login, the local user loaded:

- one active household membership
- role `owner`
- joined household data

The app shell rendered without crashing while Household Context loaded.

## Tasks Result

Passed.

The Tasks tab rendered after login. With no local task records for the bootstrapped household, the visible result was the expected empty state:

- `0 tasks`
- `0 maintenance`
- `All clear`
- `+ Add Task`

This confirms the household-aware Tasks query path does not crash when a household exists but has no Tasks rows.

## Issues Found

No blocking auth issues were found.

No app code fixes were required.

Notes:

- Local `supabase_vector_familyos` continued to restart, but Auth, REST, DB, Studio, Kong, and other required services were healthy.
- Password reset UI exists, but full production reset behavior still depends on Supabase Auth email and redirect configuration.

## Fixes Made

None.

## Password Reset Future Plan

Current code already exposes a password reset request flow from the sign-in screen:

- `src/hooks/useSupabaseAuth.js` calls `resetPasswordForEmail`
- redirect target is `/reset-password`
- `src/app/App.js` renders `PasswordResetGate`
- `updatePassword` calls `supabase.auth.updateUser({ password })`

Before relying on this in production:

1. Confirm Supabase Auth Site URL points to the production Family OS origin.
2. Add the exact production `/reset-password` URL to Supabase allowed redirect URLs.
3. Confirm local and production email templates communicate that reset links are single-use.
4. Test reset delivery and callback in local Inbucket first.
5. Test reset delivery and callback in production only after production Auth settings are reviewed.

## Password Change Future Plan

A signed-in password change screen is not currently implemented.

Recommended later behavior:

- Add a Settings account section.
- Require current password or recent authentication before changing password if Supabase settings require it.
- Use `supabase.auth.updateUser({ password })`.
- Show clear success/error messaging.
- Keep password rules aligned with local and production Supabase Auth settings.

This should be implemented separately from module migration work.

## Initial Password Flow For Owner/Admin-Created Users

For private household users, the simplest first production path remains:

1. Owner/admin creates users manually in Supabase Dashboard.
2. Owner/admin sets a temporary password or sends a recovery/reset email.
3. User signs in and changes password through the reset flow.

Do not open public sign-up for this phase.

## Deferred Until Production Auth Is Configured

- Production password reset smoke test
- Production email template review
- Public sign-up decisions
- Invite-based onboarding
- Signed-in password change UI
- Household owner member-management UI

## Production Auth Go/No-Go

Production auth is no-go for password reset/change validation until Supabase Dashboard auth settings are reviewed.

Local password login is go for continued local household module migration.

## Build And Check

Passed.

```powershell
pnpm run build
pnpm run check
```

Both commands completed successfully. The only observed warning was the existing Node/CRA deprecation warning for `fs.F_OK`.
