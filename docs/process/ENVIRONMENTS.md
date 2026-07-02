# Environments

This document defines environment expectations for Family OS.

## Local
- Used for development, lint/build validation, and browser smoke tests.
- `.env.local` is untracked.
- Local Supabase or disposable databases should be used for migration/RLS validation.
- Do not connect local validation scripts to production unless explicitly approved.

## Development
- Used for iterative testing and preview work.
- May use disposable or staging-like Supabase data.
- Secrets must still be managed through environment configuration.

## Staging
- Used for production-like validation.
- Should mirror production schema and auth configuration as closely as possible without using production data.
- Required for risky migrations, auth changes, RLS changes, OAuth changes, and integration changes when local validation is insufficient.

## Production
- Main branch deploy target.
- Production Supabase changes require target verification, backup/rollback plan, explicit approval, validation SQL, and post-change smoke tests.
- Public sign-up remains disabled unless a release changes that policy.

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
