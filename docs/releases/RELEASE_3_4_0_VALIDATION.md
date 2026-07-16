# Release 3.4.0 Validation

## Passed locally

- ESLint and TypeScript declaration checks.
- 42 unit suites and 165 tests, including confidence, cooldown, material-change bypass, grouping, dependencies, workload, and effectiveness.
- Release 3.4 migration/RLS static assertions.
- 18 seed guards and 44 test-database safety assertions.
- Production build and bundle secret-marker scan.
- Main bundle: 230.33 kB gzip, approximately 2.11 kB above Release 3.3.
- `git diff --check`.

## Production gate

Production migration, authenticated responsive/accessibility smoke, deployment, and production postflight remain blocked until production Supabase and Vercel credentials are available in this environment. The application must not be pushed through the auto-deploying `main` branch before the additive migration is backed up, applied, and verified.
