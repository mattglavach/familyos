# AI Advisory Operational Runbook

## Pre-deployment

1. Capture production schema and data backups and verify the exact Supabase project.
2. Confirm the migration is additive and the current migration history is aligned.
3. Run lint, type checking, unit tests, Release 3.2 security assertions, seed guards, production build, bundle safety, and the Playwright matrix.
4. Confirm provider credentials exist only in the server environment and `ALLOWED_ORIGINS` includes the production alias.

## Migration

Apply `20260714030000_release_3_2_ai_planning.sql`. Verify four tables, indexes, enabled RLS, owner/adult write policy, user ownership, and revoked `anon`/`public` privileges. No backfill is required. Application rollback may redeploy 3.1 while retaining the additive tables.

## Production verification

- Confirm deployment status is READY and commit/tag match the intended release.
- Verify Home renders deterministic Family Brief content before or without AI.
- Disable AI in Settings and confirm all core modules remain usable.
- Run one production-safe read-only advisory question and inspect its source indicators.
- Confirm no proposed action changes a record before the owning form's explicit Save.
- Inspect logs for success, timeout, schema-validation, and provider-error categories. Confirm no household content appears.
- Scan the production bundle for provider secrets and server-only environment names.

## Failure response

Provider outage, timeout, rate limit, or malformed output should produce deterministic fallback and a concise notice. Do not repeatedly retry from the client. If error rate is elevated, disable the provider key or AI feature while leaving FamilyOS operational. For suspected data exposure, revoke the provider key, preserve privacy-safe metadata, and follow the security incident process without copying prompts or responses into tickets.
