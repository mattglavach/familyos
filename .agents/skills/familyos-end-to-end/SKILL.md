---
name: familyos-end-to-end
description: Complete FamilyOS work end to end using repository governance, established architecture, risk-based validation, documentation, and approval checkpoints. Use automatically for FamilyOS implementation, releases, documentation, architecture, navigation, modules, bug fixes, testing, and repository maintenance.
---

# FamilyOS End-to-End

## Intake

1. Read the requested outcome, repository `AGENTS.md`, and `docs/governance/FamilyOS_Project_Instructions.md`.
2. Inspect the repository, affected dependencies, current branch, and working-tree state.
3. Read the relevant roadmap, architecture, integration-contract, release, status, and module documentation.
4. Determine scope, acceptance criteria, dependencies, risks, and current behavior from repository evidence.
5. Protect unrelated work already present in the working tree.

## Clarification Standard

Ask only when a material product decision is unresolved, plausible interpretations would create substantially different user outcomes, required information cannot be found in the repository, or the next action crosses an approval checkpoint.

Otherwise, choose the most reasonable option consistent with existing product guidance and disclose the assumption in the completion summary.

## Execution

- Complete the requested scope end to end in one practical pass.
- Modify all necessary code, configuration, tests, validation assets, and documentation.
- Preserve established architecture and backward compatibility unless a redesign is justified by the approved outcome.
- Reuse existing patterns and maintain clear module ownership and context handoffs.
- Avoid unrelated changes and speculative modules, schemas, tables, abstractions, or dependencies.
- Address loading, empty, error, success, permission, accessibility, and responsive states where relevant.
- Keep current behavior distinct from approved long-term direction.

## Validation

Run relevant available linting, type checking, unit tests, integration tests, builds, documentation validation, functional checks, `git diff --check`, `git status`, and final diff review.

If a check cannot run, explain why and identify the remaining validation gap. Apply validation proportional to risk and confirm no unintended schema, dependency, environment, secret, or application behavior change occurred.

## Git Handling

- Inspect Git status before editing and review the final diff.
- Do not overwrite unrelated work.
- Stage only when explicitly requested or when asked to prepare changes for commit.
- When staging, use explicit intended paths. Avoid `git add .` when unrelated changes may exist.
- Stop before commit, push, merge, tag, deployment, release, database migration, or destructive action unless explicitly approved.

## Completion

Use the completion-summary format required by `docs/governance/FamilyOS_Project_Instructions.md`. Write for a non-developer and explicitly distinguish completed, deferred, blocked, known limitation, product-owner decision needed, and recommended next action.

Include Git status and a recommended commit message or release step. Do not imply that deferred or blocked work is complete.
