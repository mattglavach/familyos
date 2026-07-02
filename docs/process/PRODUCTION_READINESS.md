# Production Readiness

This is the official production readiness checklist for Family OS.

## Scope
- [ ] Release scope matches the approved specification.
- [ ] No unrelated feature work is included.
- [ ] Deferred items are documented.

## Code
- [ ] `pnpm run lint` passes.
- [ ] `pnpm run build` passes.
- [ ] `git diff --check` passes.
- [ ] Dead code, debug output, temporary scripts, and generated artifacts are removed.
- [ ] Dependency changes are justified and documented.

## Database
- [ ] Migrations apply in the intended order.
- [ ] Disposable/local/staging validation completed.
- [ ] Idempotency behavior is verified or documented.
- [ ] Backfill and rollback expectations are documented.
- [ ] Production target is verified before any production action.
- [ ] Backup/restore path is confirmed before production database changes.

## Security
- [ ] Authentication behavior is validated.
- [ ] Authorization is enforced server-side by RLS/RPC/API logic.
- [ ] RLS checks cover affected roles and non-members.
- [ ] Secrets, tokens, and private data are not logged or committed.
- [ ] Invite/OAuth/session/token flows are reviewed when touched.

## UX
- [ ] Affected workflows have loading, empty, error, and success states.
- [ ] Unauthorized controls are hidden or read-only as appropriate.
- [ ] Mobile and desktop layouts are checked.
- [ ] Accessibility expectations are met for changed UI.

## Documentation
- [ ] Release notes and changelog updated.
- [ ] Project status and roadmap updated.
- [ ] Architecture/database/RLS docs updated if affected.
- [ ] Known risks and deferred work documented.

## Release Decision
- [ ] Release summary includes validation, risks, files changed, docs updated, and commit hashes.
- [ ] Recommendation is `READY TO MERGE`, `READY TO TAG`, or `NOT READY`.
