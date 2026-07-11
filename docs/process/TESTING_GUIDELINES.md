# Testing Guidelines

This document is the active testing and validation guide. The older development baseline is archived under `docs/archive/development-baseline/`.

It provides specialized validation detail under `docs/governance/FamilyOS_Project_Instructions.md`.

## Standard Commands
- Run `pnpm run lint` for code changes.
- Run `pnpm run build` for frontend/shared changes.
- Run `git diff --check` before commit.
- Run `pnpm run check` when a release needs the combined local gate.
- Run `pnpm run seed:demo` before authenticated browser validation in an approved non-production environment.
- Run `pnpm run test:smoke` for the major-module desktop smoke gate.
- Run `pnpm run test:regression` for desktop and 390px authenticated regression coverage.

Permanent setup and security guidance is in `docs/process/DEVELOPMENT_TESTING_INFRASTRUCTURE.md`.

## Migration Validation
- Use disposable/local/staging Supabase, never production unless explicitly approved.
- Apply migrations from an empty or representative baseline.
- Verify migration ordering.
- Re-run migrations when idempotency is expected.
- Document non-idempotent behavior clearly.

## RLS Validation
- Validate owner, adult, viewer/non-owner, invited user, and non-member behavior when affected.
- Test both allowed and denied paths.
- Confirm UI permissions do not replace backend enforcement.

## Role Testing
- Owner: management actions, household settings, invite/member operations.
- Adult: operating data access without owner-only membership controls unless explicitly allowed.
- Viewer: read-oriented access and hidden management controls.
- Non-member: denied cross-household access.

## Integration Testing
- Validate API routes, RPCs, Supabase queries, and third-party integrations at the smallest reliable boundary.
- Use local or staging credentials only.
- Do not log or commit secrets, tokens, or private data.

## Browser Smoke Testing
- Launch the app locally when UI flows change.
- Test sign-in, navigation, affected forms, loading/error/empty states, permission-aware controls, and responsive behavior.
- For household features, test at least owner plus one non-owner role.
- Fail on unexpected console errors, unhandled exceptions, failed network requests, and HTTP error responses.
- Retain Playwright screenshots, traces, or videos for failed runs; do not commit generated output.

## Regression Testing
- Check nearby workflows that share data, hooks, context, or UI primitives.
- Preserve single-user compatibility unless the release intentionally changes it.

## Validation Reporting
Every release summary should include:
- Environment used.
- Commands run.
- SQL or browser smoke coverage.
- Pass/fail notes.
- Fixes made during validation.
- Remaining risks.
