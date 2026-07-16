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

Production preflight and schema snapshot confirmed 26 versions through Release 3.3. The additive Release 3.4 migration was applied to verified project `dsowansazqleudupnjug`; postflight confirmed four new empty tables, unchanged existing recommendation counts, expected lifecycle constraints and indexes, RLS, owner/adult write checks, anonymous denial, and migration version `20260715010000`.

Initial production smoke identified one pre-existing WCAG AA contrast failure on the public sign-in button. Release closeout includes the narrow sign-in contrast correction and requires a final Vercel deployment plus stable/immutable production revalidation before tagging.
