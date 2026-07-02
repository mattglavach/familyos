# Release Playbook

This playbook governs Family OS release execution and is the primary checklist for Codex-run release workstreams. The older development release-process baseline is archived under `docs/archive/development-baseline/`.

## Operating Model
- ChatGPT owns product management, architecture direction, release planning, technical review, QA review, risk assessment, and roadmap decisions.
- Codex owns engineering execution: implementation, validation, documentation updates, cleanup, and commits.
- A release should begin with a release specification and one comprehensive Codex prompt.
- Codex should continue through the complete release workstream unless a production approval, secret, destructive action, or major scope decision is required.

## Lifecycle
1. Plan: read the release spec, `AGENTS.md`, this playbook, `docs/process/FAMILY_OS_PRINCIPLES.md`, status docs, roadmap docs, architecture docs, database docs, and relevant module docs.
2. Architecture: confirm data ownership, RLS, API/RPC boundaries, module boundaries, UI impact, and deferred work.
3. Implementation: make scoped changes only. Do not add unrelated features.
4. Database: create or update migrations when schema changes are required. Validate ordering and rollback expectations.
5. Security: review auth, authorization, RLS, secrets, token handling, cross-household access, and production data safety.
6. Testing: run lint/build and targeted validation. Add focused tests or scripts when risk justifies them.
7. Browser validation: smoke-test user-facing flows for releases with UI behavior.
8. Documentation: update release notes, changelog, status, roadmap, database, architecture, and process docs as applicable.
9. Cleanup: remove dead code, debug output, unused imports, generated artifacts, and temporary validation data from tracked files.
10. Commit: group changes logically and use a clear conventional commit message.
11. Review: prepare a release summary for ChatGPT review.
12. Merge: merge only after validation and review pass.
13. Tag: tag only after the merge target is correct and release notes are final.
14. Release: deploy or hand off deployment with exact environment and validation notes.

## Definition Of Done
- Scope implemented or explicitly deferred.
- No unrelated product work included.
- Required database migrations apply cleanly in a disposable/local/staging environment.
- RLS and permission behavior validated for affected roles.
- Browser smoke tests completed for affected user workflows.
- `pnpm run lint`, `pnpm run build`, and `git diff --check` pass unless a documented environment blocker exists.
- Documentation is updated.
- Final commit is present.
- Release summary includes validation, risks, and recommendation.
- Production readiness checklist is complete when production or merge/tag readiness is requested.

## Readiness Levels
- Draft: planning exists, implementation not complete.
- Implementation Complete: code/docs are changed, validation not complete.
- Validation Complete: required checks pass, docs updated, no known blockers.
- Merge Ready: validation complete, review complete, branch clean, commit history acceptable.
- Tag Ready: merged target is correct, release notes final, production/deployment notes complete.

## Required Deliverables
- Summary of completed work.
- Files changed.
- Database changes and migration validation, if any.
- Browser smoke results, if UI changed.
- Security review summary.
- Documentation updates.
- Validation commands and results.
- Known risks and deferred work.
- Commit hash.
- Recommendation: `READY TO MERGE`, `READY TO TAG`, or `NOT READY`.

## Related References
- `docs/process/PRODUCTION_READINESS.md`
- `docs/process/ENVIRONMENTS.md`
- `docs/process/SECURITY_STANDARDS.md`
- `docs/templates/RELEASE_SPEC.md`

## Release Summary Format
```text
Summary
Validation
Browser Smoke
Security Review
Database Changes
Documentation
Fixes Made
Known Risks
Deferred Work
Commit Hashes
Recommendation
```
