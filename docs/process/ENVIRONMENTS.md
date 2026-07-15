# Environments

This document defines environment expectations for Family OS.

It provides specialized environment and deployment detail under `docs/governance/FamilyOS_Project_Instructions.md`.

## Local
- Used for development, lint/build validation, and browser smoke tests.
- `.env.local` is untracked.
- Local Supabase or disposable databases should be used for migration/RLS validation.
- `pnpm run test:db-bootstrap` rebuilds only the local Supabase database from the restored legacy baseline and every dated migration. It must pass before bootstrapping an empty hosted project.
- Do not connect local validation scripts to production unless production validation is required by the requested outcome and the target is verified.
- Required browser config: `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`.
- Authenticated Playwright config belongs in `.env.test.local`; see `docs/setup/playwright-authentication.md`. The browser and seed must target the same explicitly approved non-production project.
- Optional Calendar config can be omitted; the app should show a disconnected setup state instead of blocking local work.

## Development
- Used for iterative testing and preview work.
- May use disposable or staging-like Supabase data.
- Secrets must still be managed through environment configuration.

## Staging
- Used for production-like validation.
- Should mirror production schema and auth configuration as closely as possible without using production data.
- A brand-new project requires `20260626000000_baseline_schema.sql` before the dated upgrade chain. An existing legacy project with the preflight tables begins at `20260627000000_household_foundation.sql`. Demo data is added only afterward with the guarded `pnpm run seed:demo` workflow.
- Required for risky migrations, auth changes, RLS changes, OAuth changes, and integration changes when local validation is insufficient.
- Must include the full migration chain, including the Release 0.9 household invitation migration, before invite/member smoke testing.
- Should include Calendar server secrets when validating Google OAuth or server-side event sync.

## Production
- Main branch deploy target.
- Production Supabase changes require target verification, a backup/rollback plan, validation SQL, and post-change smoke tests.
- Public sign-up remains disabled unless a release changes that policy.
- Calendar is optional, but if enabled production must include the server-side OAuth, encryption, redirect, and Supabase service-role settings documented in `docs/setup/google-calendar-oauth.md`.

## Deployment Flow
1. Implement on release/feature branch.
2. Validate locally.
3. Validate staging when risk requires it.
4. Review summary and risks.
5. Merge to production target.
6. Tag release when ready.
7. Run post-deploy smoke checks.

## Secrets Management
- Frontend variables use `REACT_APP_` only when browser-visible.
- Server secrets must not use browser-visible prefixes.
- Rotate secrets if exposure is suspected.
- Do not store secrets in docs, prompts, screenshots, or commits.

## Optional Integrations
- Google Calendar must fail closed: if OAuth or server secrets are missing, users should see setup guidance and the rest of Family OS should remain usable.
- Family Assistant uses `AI_PROVIDER`, `AI_PROVIDER_MODEL`, and `AI_PROVIDER_API_KEY`, with `ANTHROPIC_API_KEY` as a compatibility fallback. Missing configuration returns deterministic advisory content and is not a product-wide outage.

## Troubleshooting
- Household invitations showing an environment setup message usually means `supabase/migrations/20260702000000_release_0_9_household_collaboration.sql` has not been applied, the PostgREST schema cache needs a refresh, or the environment is pointed at the wrong Supabase project.
- Calendar showing a setup message usually means one or more Google OAuth/server secrets are missing, the redirect URI does not match the deployed origin, or the `calendar_connections` schema is not present in that environment.
