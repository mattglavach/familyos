# Decision Log

## 2026-07-11: Canonical FamilyOS governance
Decision: Establish `docs/governance/FamilyOS_Project_Instructions.md` as the single canonical cross-domain governance source and preserve specialized documents as subordinate detail or historical records.

Reason: Active guidance had become distributed across product, process, AI, UX, and planning documents, including a conflict between implemented navigation and approved long-term module architecture.

Impact: Current implementation remains Home, Tasks, Calendar, Quick Add, and More. Approved long-term architecture is Dashboard, Calendar, Tasks, Life, Home, and Financial Planning. Historical release and archived documentation remains unchanged.

Use this lightweight log for decisions that matter but do not need a full ADR. Use `docs/architecture/decisions/ADR_TEMPLATE.md` for material architecture decisions.

## Format
```text
Date:
Decision:
Reason:
Scope:
Follow-up:
```

## Decisions

### 2026-07-02
Decision: Repository documentation was established as the authoritative source for engineering governance. Superseded in specificity on 2026-07-11 by the canonical FamilyOS governance decision above.
Reason: Future Family OS releases should be executable from a release spec and one comprehensive Codex prompt.
Scope: Process, planning, documentation, and AI-assisted engineering.
Follow-up: Refine governance docs after the next release uses them.
