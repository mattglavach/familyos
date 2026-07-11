# AI Engineering Guidelines

AI-assisted engineering is allowed and expected in Family OS. `docs/governance/FamilyOS_Project_Instructions.md` is the canonical governance source; this document provides specialized AI-engineering detail.

## Roles
- ChatGPT owns product management, architecture, release planning, technical review, QA review, risk assessment, and roadmap decisions.
- Codex owns authorized engineering execution, validation, documentation updates, and cleanup. Commits and other repository publication actions require the authorization defined by the current task and canonical approval checkpoints.
- Humans approve production actions, secrets, destructive changes, and material product decisions.

## Expectations For AI-Generated Code
- Read relevant repository docs before changing files.
- Prefer existing patterns over invented ones.
- Keep changes scoped to the prompt.
- Preserve existing behavior unless the prompt explicitly changes it.
- Validate with required commands and targeted smoke tests.
- Update documentation as part of the work.

## Safety Rules
- Do not touch production data without explicit approval.
- Do not expose or log secrets, tokens, session data, invite tokens, or private household data.
- Do not hide validation gaps.
- Do not treat UI hiding as authorization.
- Do not implement future roadmap items unless they are in scope.

## Review Rules
- AI-generated code needs the same review as human code.
- Review for scope, security, data integrity, RLS, UI states, accessibility, performance, and documentation.
- Capture durable decisions in docs, not chat only.

## Prompt Quality
Strong prompts should include:
- Branch and mission.
- Required docs to read.
- Explicit non-goals.
- Validation commands.
- Required deliverables.
- Commit message expectations.
