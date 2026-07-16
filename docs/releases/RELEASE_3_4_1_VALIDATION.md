# Release 3.4.1 Validation

## Stabilization coverage

- Aggregate `check` includes Release 3.4 database assertions and recognizes the 27-version Release 3.4 migration ledger.
- Dynamic hosted-test authorization uses two isolated households and owner, adult, teen/member-equivalent, and child identities. It validates recommendation records, reset/export scoping, tasks, habits, attachment metadata, private Storage, and signed URL denial across households.
- Disposable loopback PostgreSQL validation initializes the blank schema plus 25 executable migrations, reconciles 27 ledger versions, verifies RLS/policies/indexes/functions/triggers, tests Auth bootstrap transactionally, and removes the cluster.
- The already released 3.4 migration was applied to the verified dedicated test project after the authorization harness proved it was still at 3.3. No production database was accessed.
- Release 3.4 browser coverage records a snooze lifecycle event and verifies persistence after reload and reauthentication.
- Accessibility coverage includes keyboard opening, initial focus, Escape, focus restoration, recommendation confirmation, automated WCAG checks, 640x480 zoom-equivalent containment, tablet landscape, wide desktop, and dark-mode projects.

## DEP0169 disposition

No first-party `url.parse()` call exists in `api/weather.js` or `api/calendar.js`. The traced production-equivalent tooling source is Vercel CLI 56.2.0 at `vercel/dist/commands/dev/index.js`, where the local function proxy parses `req.url` with Node's legacy API. User impact is none observed; production weather/calendar verification passes. Operational risk is low and the warning does not block release. Remediation is deferred to a narrow Vercel CLI/platform update after the upstream implementation changes; the warning is not suppressed and no broad dependency upgrade is included.

## Manual limitations

Automated checks do not replace manual screen-reader review, real-browser 200% zoom, exhaustive keyboard traversal, or platform-specific assistive-technology testing.

## Final evidence

- Aggregate: 42 unit suites and 165 tests, 18 seed guards, 44 database safety assertions, and cumulative database checks through Release 3.4.
- Browser: 89 Playwright tests, consisting of the original 81 plus four viewport executions of the recommendation lifecycle test and four of the expanded accessibility test.
- Build: optimized production bundle plus secret-marker scan and reported gzip sizes.
- Final decision: `pnpm run release:gate` passed every stage and ended with `RELEASE READY` on 2026-07-16.
