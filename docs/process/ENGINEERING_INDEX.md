# Engineering Index

## Purpose
This index routes to specialized Family OS engineering process documentation. `docs/governance/FamilyOS_Project_Instructions.md` is the canonical cross-domain governance source. When a process document conflicts with it, follow the canonical document and update the subordinate process reference.

## Core Operating Docs
- `docs/process/FAMILY_OS_PRINCIPLES.md`
- `docs/process/RELEASE_PLAYBOOK.md`
- `docs/process/FEATURE_PLAYBOOK.md`
- `docs/process/PRODUCTION_READINESS.md`
- `docs/process/RELEASE_CHECKLIST.md`
- `docs/process/CODE_REVIEW_CHECKLIST.md`

## Engineering Standards
- `docs/process/CODING_STANDARDS.md`
- `docs/process/ARCHITECTURE_GUIDELINES.md`
- `docs/process/UI_GUIDELINES.md`
- `docs/process/TESTING_GUIDELINES.md`
- `docs/process/DOCUMENTATION_GUIDELINES.md`
- `docs/process/GIT_WORKFLOW.md`

## Domain Guidance
- `docs/process/PROJECT_STRUCTURE.md`
- `docs/process/MODULE_TEMPLATE.md`
- `docs/process/API_GUIDELINES.md`
- `docs/process/SECURITY_STANDARDS.md`
- `docs/process/PERFORMANCE_GUIDELINES.md`
- `docs/process/ENVIRONMENTS.md`
- `docs/process/DEPENDENCY_POLICY.md`
- `docs/process/AI_ENGINEERING_GUIDELINES.md`

## Reusable Inputs
- `docs/templates/RELEASE_SPEC.md`
- `docs/templates/FEATURE_SPEC.md`
- `docs/templates/MODULE_SPEC.md`
- `docs/templates/BUG_REPORT.md`
- `docs/templates/RETROSPECTIVE.md`
- `docs/architecture/decisions/ADR_TEMPLATE.md`

## Planning References
- `docs/planning/ROADMAP.md`
- `docs/planning/CURRENT_SPRINT.md`
- `docs/planning/PROJECT_STATUS.md`
- `docs/planning/TECH_DEBT.md`
- `docs/planning/DECISION_LOG.md`
- `docs/planning/ROADMAP_PROCESS.md`

## Release Workflow
1. Start from `docs/templates/RELEASE_SPEC.md`.
2. Review this index, `AGENTS.md`, current roadmap/status docs, architecture docs, database/RLS docs, and relevant module docs.
3. Keep scope explicit and document deferred work.
4. Validate according to `docs/process/TESTING_GUIDELINES.md` and `docs/process/PRODUCTION_READINESS.md`.
5. Update release notes, changelog, roadmap, status, and any affected architecture/database/RLS docs.
6. Commit with a focused message and a supported readiness recommendation.
