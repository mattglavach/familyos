# Feature Playbook

Use this playbook for every feature, module addition, or meaningful user-facing change. It complements the release playbook and keeps feature work scoped before Codex executes.

## Required Feature Brief
- Problem: what user or operational problem is being solved.
- Requirements: concrete behavior the feature must provide.
- Architecture: affected modules, boundaries, state, and integrations.
- Security: auth, authorization, RLS, secrets, privacy, and abuse cases.
- Data: Supabase schema, migrations, indexes, seed/backfill, and compatibility.
- API: REST, Vercel route, Supabase RPC, or client-only behavior.
- UI: screens, states, navigation, forms, mobile behavior, and permissions.
- Testing: lint/build, unit or integration checks, SQL validation, browser smoke.
- Documentation: docs that must be updated.
- Risks: data integrity, regressions, UX edge cases, rollout risks.
- Acceptance Criteria: observable pass/fail criteria.
- Deferred Work: intentional non-goals and future follow-up.

Use `docs/templates/FEATURE_SPEC.md` for feature specifications and `docs/templates/MODULE_SPEC.md` for module-level work.

## Execution Rules
- Read existing docs before implementation.
- Reuse existing module patterns, UI primitives, hooks, and Supabase helpers.
- Keep workstream boundaries clear. Do not mix unrelated modules or future release work.
- Preserve single-user compatibility unless the feature intentionally changes it.
- Use migrations for schema changes. Do not patch production manually.
- Make permission-aware UI match backend authorization.
- Update documentation before commit.

## Acceptance Criteria Template
```text
Feature:
Problem:
Requirements:
Non-goals:
Data/API impact:
Security impact:
UI states:
Validation required:
Docs required:
Deferred work:
```
