# Release 2.5.0 Validation and Deployment Record

## Implementation

Implemented: brief scheduling preferences/history and due-on-open behavior; notification state/preferences and derived sources; Calendar grouping, all-day/timed, recurrence, overlap, and transition indicators; built-in and household routine templates; Playwright axe-core audit.

Deferred: background/server scheduling, external notification delivery, Calendar recurrence mutation, inventory forecasting, consumables, and Financial Planning data integration.

## Migration and rollback

The Release 2.5 migration is additive. Apply it after all Release 2.4 migrations. Application rollback is a deployment rollback to Release 2.4; the new tables may safely remain unused. Database rollback is forward-only by default. If removal is ever approved, export the five new tables first, then remove policies and tables in reverse dependency order. Do not drop them during a routine application rollback.

## Production checklist

1. Confirm approved production target and backup/restore posture.
2. Apply `20260712040000_release_2_5_proactive_planning.sql`.
3. Verify tables, unique index, grants, RLS enablement, and policies.
4. Deploy the approved commit.
5. Validate authentication, household isolation, notification state, brief scheduling, routine templates, Calendar, console/network health, and responsive accessibility.
6. Merge and create `v2.5.0` only after approval and successful production verification.

## Validation record

Passed on 2026-07-12: zero-warning ESLint; 108 unit/integration tests; 18 seed-safety tests; production build; bundle safety; `git diff --check`; clean 17-migration bootstrap; existing-record upgrade and household RLS isolation; and all 73 authenticated Playwright cases across desktop, 390 px mobile, tablet, and dark-mode projects after the approved test project received migrations 2.4 and 2.5. This count includes dedicated axe-core audits and Release 2.5 workflow coverage.

Preview `https://familyos-nip6een40-glavach.vercel.app` reached READY with preview-only test-project configuration. Authenticated sign-in, Release 2.5 workflows, axe audit, major-module smoke, console monitoring, application network monitoring, and serverless Calendar status passed. Vercel toolbar JWE/HEAD requests that the browser intentionally aborts are excluded from the application-network assertion.

## Known limitations

- Due briefs are evaluated after authenticated app open; no background delivery is configured.
- Quiet hours configure future delivery policy but do not create external channels.
- Calendar recurrence mutation remains in Google Calendar.
- Built-in templates are shipped in application code; household templates are persisted.
- Automated accessibility testing is not formal WCAG certification.
