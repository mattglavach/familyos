# Dependency Policy

Dependencies should be added deliberately and removed when no longer needed.

## Evaluation
Before adding a dependency, consider:
- Is the need real and in scope?
- Is there an existing dependency or platform API that solves it?
- Is the package maintained?
- Does it affect bundle size materially?
- Does it introduce security or licensing risk?
- Can it be isolated behind a small wrapper?

## Approval
- Small dev dependencies that support existing scripts may be added with explanation.
- Runtime dependencies require stronger justification in the release summary.
- Dependencies for security-sensitive, auth, crypto, or data-migration work require review.

## Updates
- Keep package manager as `pnpm`.
- Do not introduce npm or yarn lockfiles.
- Prefer targeted updates over broad dependency churn.
- Run lint/build after dependency changes.

## Removal
- Remove unused dependencies when discovered in scope.
- Update imports, docs, and lockfile together.

## Documentation
Dependency changes should be mentioned in changelog/release notes when they affect validation, runtime, bundle, security, or developer workflow.
