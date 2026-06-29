# Authentication Audit

Audit date: 2026-06-28

## Scope

Code-only review of Family OS authentication:

- email/password login
- password reset request
- password recovery callback handling
- magic-link fallback
- logout and session persistence
- redirect handling

No Supabase dashboard settings were changed. No production users were modified. No remote Supabase commands were run.

## Findings

### Login Flow

Primary sign-in uses `supabase.auth.signInWithPassword` with the approved household email allowlist checked client-side for friendlier errors. Supabase Auth users, disabled public sign-up, and RLS remain the real enforcement layers.

Improvements made:

- Email values are normalized before auth calls.
- Invalid email formats are rejected before submission.
- Sign-in has action-specific loading state.
- Duplicate sign-in submissions are ignored while another auth action is running.

### Password Reset Flow

Password reset requests use `supabase.auth.resetPasswordForEmail` with:

```text
redirectTo: window.location.origin + "/reset-password"
```

Likely causes of password reset issues:

- Supabase Auth allowed redirect URLs do not include the exact `/reset-password` URL for the active origin.
- The app is opened from a different origin than the one configured in Supabase.
- The reset link is expired or already used.
- The React app deep-link rewrite for `/reset-password` is missing in a deployment environment.
- A user opens `/reset-password` without a valid Supabase recovery session.

Improvements made:

- Reset requests now use action-specific loading state.
- Reset request success message now tells users to use the newest email if multiple resets were requested.
- `/reset-password` now renders an explicit expired/invalid reset-link state when no recovery session is available.
- Password update is blocked unless Supabase has established a recovery session.
- New-password fields use `autocomplete="new-password"`.
- Password form includes a visible 8-character requirement.

### Magic Link Flow

Magic-link sign-in remains a fallback and uses the current origin for redirects. The 60-second cooldown still applies to reduce Supabase email rate-limit errors.

Improvements made:

- Magic-link sends use action-specific loading state.
- Invalid email formats are rejected before submission.
- Duplicate sends are still blocked while an auth action or cooldown is active.

### Logout And Session Persistence

Session persistence remains handled by the configured Supabase client. Logout calls `supabase.auth.signOut`, clears local auth state, and now prevents duplicate sign-out submissions.

### Redirect Handling

The `/reset-password` route is handled in-app. Valid recovery sessions show the password update form. Invalid or expired recovery routes now show a clear recovery error state with a return-to-sign-in action.

## Dashboard Configuration Required

These items require Supabase Dashboard changes and were not changed in code:

- Public sign-up should remain disabled.
- Approved household users must exist in Supabase Authentication > Users.
- Email/password auth must be enabled.
- Password recovery email delivery must be enabled and working.
- Site URL should match the production Family OS URL.
- Allowed redirect URLs must include:
  - `http://localhost:3000`
  - `http://localhost:3000/reset-password`
  - production app URL
  - production app URL plus `/reset-password`
  - any custom domain and its `/reset-password` URL
  - preview URLs only if preview auth is intentionally supported

## Live Testing Required

Requires Supabase Auth access:

- Sign in with a valid approved email and password.
- Attempt sign-in with a wrong password.
- Request password reset and confirm email delivery.
- Open reset link and update password.
- Confirm reused/expired reset link shows the invalid-link state.
- Confirm magic-link fallback still works.
- Confirm sign-out clears session and returns to sign-in.
