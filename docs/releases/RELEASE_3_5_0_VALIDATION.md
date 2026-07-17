# Release 3.5.0 Validation

## Required gate

- `git diff --check`
- `pnpm run check`
- Release 3.3 and 3.4 compatibility validations
- Recommendation pipeline, ranking, outlook, Home, and Notification Center tests
- Authenticated Playwright regression, responsive, dark-mode, and accessibility matrix
- Production build and bundle-safety scan
- Database bootstrap, RLS, seed-safety, and authorization validation
- `pnpm run release:gate` returns `RELEASE READY`

## Release boundaries

No database migration, production data mutation, new dependency, navigation item, or autonomous action is permitted. Commit, push, deployment, and tagging require a separate review after this local gate passes.

## Current result

`git diff --check` and `pnpm run check` pass, including lint, type checking, 170 unit tests, Release 2.9 through 3.4 schema assertions, seed and database safety tests, production build, and bundle scan.

Release-gate investigation isolated the long stage to Playwright. Hosted seed (12.5s), Release 3.4 upgrade (4.7s), dynamic authorization (14.7s), and the disposable database (23.9s) all pass. Playwright was progressing rather than hung, but stale pre-3.5 Home assertions consumed repeated expectation timeouts across the single-worker viewport matrix. Investigation also found that a `generated` event alone incorrectly activated fatigue suppression on later renders. The stale assertions now target Morning Command Center, and fatigue requires dismiss, snooze, not-useful, or ignored evidence. The affected Chromium regression, Release 2.3, and smoke paths pass after the correction; the smoke rerun completed in 59.9s including server startup and authentication.

## Final results

| Command or stage | Result | Duration |
| --- | --- | ---: |
| `git diff --check` | Pass | <1s |
| `pnpm run check` | Pass | 104.7s |
| Full authenticated Playwright matrix | 97 passed | 812.9s |
| Aggregate `pnpm run release:gate` | Pass | 782.7s |

The authenticated matrix passed on desktop Chromium, 390 px mobile, tablet, and dark mode. Coverage includes representative accessibility, keyboard/focus, responsive containment, persistence/failure behavior, Release 2.3, 2.5, 3.1, 3.2, 3.4, and 3.5 flows, the Best Next Action, the three-recommendation maximum, and the seven-day outlook.

The aggregate gate completed every stage and returned:

```text
RELEASE READY: FamilyOS 3.5.0
```

No migration or dependency was added. All hosted mutation was restricted by the established exact-target safeguards to the dedicated non-production test project. Production was not accessed or modified.
