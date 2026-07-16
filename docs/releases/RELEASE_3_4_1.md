# Release 3.4.1: Stabilization

Release 3.4.1 closes the post-release validation gaps found in the 3.4.0 audit without adding user-facing features. It restores the aggregate database gate, repairs stale cross-viewport Playwright workflows, adds real two-household role/RLS validation, certifies the disposable blank migration chain, adds recommendation lifecycle persistence coverage, and corrects shared dialog/drawer keyboard behavior.

No database migration is added. The existing Release 3.4 migration remains the current schema target. Production is not modified by this local stabilization release.

Release readiness is controlled by `pnpm run release:gate`, which reports the failing stage and exits with `RELEASE BLOCKED` or `RELEASE READY`.
