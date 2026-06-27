# Authentication

## Recommended Approach
Use Supabase Auth.

## Magic Links
Email magic-link sign-in uses `supabase.auth.signInWithOtp` with `emailRedirectTo` set from the current browser origin. This keeps local sign-ins on `http://localhost:3000` and production sign-ins on the deployed Vercel origin without a separate site URL environment variable.

Supabase Auth URL configuration must match this behavior:
- Set Site URL to the production FamilyOS URL, not localhost.
- Add `http://localhost:3000` as an allowed redirect URL for local development.
- Add the Vercel production URL and any custom production domain as allowed redirect URLs.
- Add a Vercel preview wildcard only if preview deployments need email sign-in.

## Roles
- admin
- adult
- child
- guest

## Access Principles
- Sensitive modules require authenticated access.
- Finance, medical, and documents should be restricted.
- Children should have limited access.
- Club/community views should never expose private household data.

## Future
- Role-based access control
- Household-level permissions
