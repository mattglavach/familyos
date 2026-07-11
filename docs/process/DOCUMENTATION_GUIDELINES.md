# Documentation Guidelines

`docs/governance/FamilyOS_Project_Instructions.md` is the single canonical source for FamilyOS cross-domain governance. This document contains specialized documentation-maintenance rules. Other specialized repository documents remain authoritative for their owned implementation details when they do not conflict with canonical governance.

## When Docs Are Required
Update docs when work changes:
- User-facing behavior.
- Architecture or module boundaries.
- Database schema, migrations, RLS, or RPCs.
- Auth, security, deployment, or environment requirements.
- Release status, roadmap, risks, or deferred work.
- Engineering process.

## Release Notes
- Use `docs/releases/RELEASE_NOTES.md` for release summaries.
- Include version, date, summary, features, fixes, database changes, validation, known issues, and recommendation.

## Changelog
- Use `docs/releases/CHANGELOG.md` for chronological notable changes.
- Keep entries concise and user/developer visible.

## Architecture Updates
- Update `docs/architecture/ARCHITECTURE_DECISIONS.md` for material decisions.
- Update module, system, or folder docs when boundaries change.

## Database Updates
- Update `docs/database/DATABASE_SCHEMA.md` for table, column, relationship, lifecycle, or migration changes.
- Update `docs/database/SECURITY_RLS.md` for policies, permissions, RPC security, or role behavior.

## Roadmap And Status
- Update `docs/planning/ROADMAP.md` when planned work moves state.
- Update `docs/planning/PROJECT_STATUS.md` for current version, completed work, next work, known bugs, and technical debt.
- Update `docs/planning/CURRENT_SPRINT.md` for active release progress.

## Deferred Work
- Record intentional non-goals in release notes or status docs.
- Do not leave deferred work only in chat.

## Known Risks
- Document validation gaps, deployment dependencies, production approval needs, and security limitations.

## Master Index
- Add new durable docs to `docs/00_MASTER_INDEX.md`.
- Avoid indexing one-off validation notes unless they are expected to be reused.

## Templates
- Use `docs/templates/RELEASE_SPEC.md` for release planning.
- Use `docs/templates/FEATURE_SPEC.md` for feature planning.
- Use `docs/templates/MODULE_SPEC.md` for new modules.
- Use `docs/templates/BUG_REPORT.md` for reproducible defects.
- Use `docs/templates/RETROSPECTIVE.md` after significant releases.
