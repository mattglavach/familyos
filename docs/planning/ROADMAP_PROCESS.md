# Roadmap Process

This document governs how roadmap changes are proposed, reviewed, and recorded.

## Roles
- ChatGPT owns product management, roadmap sequencing, architecture review, QA review, and risk assessment.
- Codex owns engineering execution after roadmap scope is approved.
- Humans approve production, privacy, security, and household-priority decisions.

## Roadmap Inputs
- User needs.
- Family operational pain.
- Security and privacy requirements.
- Technical debt.
- Validation gaps.
- Release retrospectives.

## Roadmap States
- Idea: possible future work.
- Planned: approved for a future release.
- In Progress: active branch/workstream exists.
- Validation: implementation complete, checks underway.
- Done: merged/tagged or otherwise closed.
- Deferred: intentionally postponed with reason.

## Change Rules
- Update `docs/planning/ROADMAP.md` for durable roadmap changes.
- Update `docs/planning/PROJECT_STATUS.md` for current state.
- Update `docs/planning/TECH_DEBT.md` when deferral creates engineering risk.
- Record material architecture decisions as ADRs.

## Release Selection
Choose the next release by balancing:
- Household value.
- Security and data risk.
- Dependency on existing foundation.
- Validation cost.
- Size suitable for one Codex workstream.
