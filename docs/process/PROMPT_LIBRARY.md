# Process Prompt Library

These templates support complete Codex engineering workstreams under `docs/governance/FamilyOS_Project_Instructions.md`. ChatGPT should fill in release or feature specifics before handoff, and prompts must preserve canonical autonomous-execution and safety boundaries.

## Full Release
```text
You are the lead engineer for Family OS.
Branch: [branch]
Mission: complete [release] from specification through validation, docs, and commit.
Read AGENTS.md, docs/governance/FamilyOS_Project_Instructions.md, docs/process/RELEASE_PLAYBOOK.md, and docs/templates/RELEASE_SPEC.md first. Do not add unrelated scope.
Required validation: pnpm run lint, pnpm run build, git diff --check, plus release-specific SQL/RLS/browser checks.
Deliver: summary, files changed, validation, risks, commit hashes, recommendation.
```

## Feature
```text
Implement [feature] for Family OS.
Use docs/process/FEATURE_PLAYBOOK.md.
Include data/API/security/UI/testing/docs work as required.
Preserve existing behavior and document deferred work.
Commit with a focused message.
```

## Validation
```text
Validate [release/feature] without adding new features.
Use disposable/local/staging environments only. Do not touch production unless explicitly approved.
Run required commands and targeted smoke tests.
Fix only validation-discovered issues.
Update docs with exact pass/fail results and commit.
```

## Security Review
```text
Review [area] for auth, authorization, RLS, secrets, token handling, cross-household access, invalid input, replay/duplicate behavior, and logging risks.
Fix only confirmed issues in scope.
Document residual risks and validation performed.
```

## Bug Fix
```text
Fix [bug].
Reproduce or inspect the failure first.
Keep the patch minimal.
Add or run focused validation proving the bug is fixed and nearby behavior is preserved.
Update docs if user-facing behavior, schema, security, or release status changes.
Commit with a fix message.
```

## Refactor
```text
Refactor [area] without changing behavior.
Explain why the refactor is needed.
Keep changes scoped and preserve tests/build.
Do not mix feature work into the refactor.
Run validation and document residual risk.
```

## Documentation
```text
Update documentation for [topic].
Review existing docs first and avoid duplicate guidance.
Repository documentation is the source of truth.
Update master index/status/roadmap if the durable documentation set changes.
Run lint/build/diff-check if requested by release scope.
Commit with a docs message.
```

## Release Closeout
```text
Close out [release].
Validate migration, RLS, browser smoke, security, docs, lint, build, and diff-check as applicable.
Update release notes, changelog, status, roadmap, architecture/database docs, known risks, and deferred work.
Commit final closeout and report merge/tag recommendation.
```
