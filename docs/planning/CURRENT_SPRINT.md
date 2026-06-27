# Current Sprint

## Sprint Goal
Establish the shared AI development workspace and documentation foundation.

## Active Items
- [x] Add documentation structure
- [x] Add AGENTS.md
- [x] Add GitHub templates
- [x] Add Platform architecture documentation
- [x] Add frontend standard foundation
- [x] Fix Vercel production build failure from CRA CI lint warnings
- [x] Audit Supabase email magic-link redirect behavior for Vercel deployment
- [x] Document Google Calendar OAuth origin configuration for local and Vercel deployments
- [x] Add Supabase magic-link resend cooldown protection
- [x] Make private household email/password login the primary Supabase auth path
- [x] Validate current app structure
- [ ] Identify next implementation target

## Blockers

## Notes
- Frontend foundation now includes Tailwind CSS, shadcn/ui aliases/primitives, Lucide icons, Recharts, and an Origin UI-style drawer component for new feature work.
- Production build now passes with `CI=true`; remaining deploy validation should happen through Vercel.
- Email magic-link redirects are generated from the current browser origin; Supabase Auth Site URL and allowed redirect URLs must include the deployed Vercel origin.
- Email magic-link sign-in now disables resend for 60 seconds after successful sends to reduce Supabase rate-limit errors.
- Email/password login is now the primary private-household auth path; users should be manually created in Supabase with public sign-up disabled.
- Google Calendar OAuth uses the current browser origin; Google Cloud Console Authorized JavaScript origins must include localhost, the Vercel production origin, and any custom domain used to open the app.

- App structure refactor moved the shell, hooks, and user-facing modules out of the monolithic src/App.js; pnpm run check passes after the split.
