# Canonical Project Instructions Maintenance Prompt

Use this prompt to audit or evolve FamilyOS governance documentation.

```text
Maintain the canonical FamilyOS project instructions for this repository.

Canonical document:
docs/governance/FamilyOS_Project_Instructions.md

Before changing documentation:
1. Read AGENTS.md and the canonical document.
2. Inspect active product, architecture, AI, process, planning, release, setup, deployment, integration, database, RLS, UX, and technical-debt documentation relevant to the requested change.
3. Inspect current application behavior when the documentation describes implemented functionality.
4. Classify findings as active guidance, specialized detail, duplicate guidance, conflict, obsolete active guidance, or historical record.

Governance rules:
- The canonical document is the single source of truth for FamilyOS-specific cross-domain governance.
- Keep specialized implementation detail in its owning document and link to the canonical document instead of duplicating general rules.
- Preserve historical release notes, dated audits, archived plans, decision records, and implementation records.
- Clearly distinguish current implementation from approved future direction.
- Current primary app actions are Home, Tasks, Calendar, Quick Add, and More unless repository inspection proves otherwise.
- Approved long-term module architecture is Dashboard, Calendar, Tasks, Life, Home, and Financial Planning. Do not claim it is already implemented.
- Dashboard is an awareness layer and must not duplicate module workspaces or become an AI recommendation page.
- FamilyOS is the family's system of record. ChatGPT is the reasoning engine. AI recommendations become records only after explicit acceptance.
- Preserve module ownership, integration contracts, security/RLS boundaries, and backward compatibility where practical.
- Avoid unrelated application changes.

For material updates:
- Update the canonical document first.
- Update specialized active documents and entry-point references that would otherwise conflict.
- Update docs/releases/CHANGELOG.md, docs/planning/CURRENT_SPRINT.md, and docs/planning/PROJECT_STATUS.md.
- Update architecture decisions, roadmap, database, RLS, release notes, setup, deployment, integration, UI, or technical-debt docs only when affected.

Validation:
- Verify the canonical and maintenance-prompt documents exist.
- Verify only one active document claims canonical governance authority.
- Search active documentation for conflicting current-versus-future navigation, module ownership, AI/data ownership, approval, and source-of-truth statements.
- Preserve clearly historical statements.
- Run git diff --check, git diff, and git status.
- Run code validation only when application code or executable configuration changed.

Deliver:
1. Executive Summary
2. Files Reviewed
3. Files Updated
4. Canonical Guidance Changed
5. Duplicate Guidance Removed
6. Conflicts Resolved
7. Historical Documentation Preserved
8. Validation Performed
9. Remaining Issues
10. Recommended Commit Message
11. Git Status

Do not commit, push, merge, tag, deploy, or mutate production unless the current request explicitly authorizes that action.
```
