# Git Workflow

This document is the active Git workflow for release-scale execution. The older development baseline is archived under `docs/archive/development-baseline/`.

## Branch Naming
- `main`: production-ready.
- `release/<version>-<topic>`: release workstreams.
- `feature/<topic>`: feature branches when not release-scoped.
- `fix/<topic>`: bug fixes.
- `docs/<topic>`: documentation-only work.

## Release Branches
- Release branches should start from the intended release base.
- Keep release branches focused on the release specification.
- Do not mix future-release feature work into validation or process releases.

## Feature Branches
- Use feature branches for isolated work not tied to a release branch.
- Merge through review after validation and docs are complete.

## Commit Expectations
- Use clear conventional messages: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
- Group commits logically by behavior, validation, or docs.
- Do not commit generated build output unless explicitly requested.

## Push Guidance
- Push only after local validation passes or after documenting why it could not run.
- Never push secrets or environment files.

## Merge Strategy
- Merge only from a clean branch with required validation complete.
- Resolve conflicts intentionally and rerun relevant checks.
- Do not conclude unrelated in-progress merges while working a separate request.

## Tag Strategy
- Tags should point at the merge commit or final release commit on the release target.
- Use semantic release tags such as `v0.9.0`.
- Tag only after release notes are final and readiness is `Tag Ready`.

## Release Closeout
- Update release notes, changelog, project status, roadmap, and known risks.
- Commit closeout docs.
- Provide commit hashes and recommendation.
