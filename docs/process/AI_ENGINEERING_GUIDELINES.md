# AI Engineering Guidelines

AI-assisted engineering is allowed and expected in Family OS. `docs/governance/FamilyOS_Project_Instructions.md` is the canonical governance source; this document provides specialized AI-engineering detail.

## Roles
- ChatGPT owns product management, architecture, release planning, technical review, QA review, risk assessment, and roadmap decisions.
- Codex owns end-to-end engineering execution, validation, documentation, publication, deployment, recovery, and cleanup required by a clear product-owner request.
- Humans provide product outcomes and resolve only genuine external blockers or irreversible ambiguities with substantial data-loss risk.

## Expectations For AI-Generated Code
- Read relevant repository docs before changing files.
- Prefer existing patterns over invented ones.
- Keep changes scoped to the prompt.
- Preserve existing behavior unless the prompt explicitly changes it.
- Validate with required commands and targeted smoke tests.
- Update documentation as part of the work.

## Safety Rules
- Verify the target, backup and rollback path, scope, and post-change validation before touching production data.
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
