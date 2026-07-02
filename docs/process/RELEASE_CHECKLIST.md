# Release Checklist

Use this concise checklist immediately before merge and tag.

## Merge Checklist
- [ ] Release scope matches the approved spec.
- [ ] No unrelated feature work included.
- [ ] Migrations apply cleanly in disposable/local/staging environment.
- [ ] Expected idempotency behavior documented.
- [ ] RLS/security validation passed for affected roles.
- [ ] Browser smoke tests passed for affected UI workflows.
- [ ] `pnpm run lint` passed.
- [ ] `pnpm run build` passed.
- [ ] `git diff --check` passed.
- [ ] Release notes updated.
- [ ] Changelog updated.
- [ ] Project status and roadmap updated.
- [ ] Database/RLS/architecture docs updated if affected.
- [ ] Known risks and deferred work documented.
- [ ] Branch is clean after commit.

## Tag Checklist
- [ ] Release branch merged into the intended target.
- [ ] Final release notes are accurate.
- [ ] Version/tag name is confirmed.
- [ ] Deployment or production migration notes are complete.
- [ ] Final recommendation is `READY TO TAG`.
