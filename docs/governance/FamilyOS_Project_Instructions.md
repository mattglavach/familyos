# FamilyOS Project Instructions

## Authority

This document is the canonical source of truth for FamilyOS-specific product, architecture, development, release, governance, UX, AI integration, and delivery guidance.

Use specialized documents for implementation detail, such as schemas, integration contracts, environment setup, release records, and module specifications. If active FamilyOS guidance conflicts, this document takes precedence. Historical release notes, dated audits, archived plans, and architecture decision records remain valid records of their time and must not be rewritten to match current direction.

The reusable maintenance prompt for this document is `docs/prompts/canonical_project_instructions.md`. The standard task template is `docs/prompts/familyos_standard_implementation.md`, and the reusable execution workflow is `.agents/skills/familyos-end-to-end/SKILL.md`.

## Product Purpose

FamilyOS is the family's trusted system of record. It stores persistent data, history, metadata, relationships, documents, workflows, operational records, accepted plans, and accepted decisions.

ChatGPT is the reasoning engine. It performs planning, recommendations, prioritization, summaries, scenario analysis, and decision support using structured context supplied by FamilyOS.

FamilyOS should not become a general AI recommendation engine. Recommendations remain proposed outputs until a person explicitly accepts them into the system of record.

## Product Philosophy

- Make practical family value the primary test for scope.
- Keep the product simple and reduce household mental load.
- Avoid duplicating specialized applications without a clear FamilyOS workflow need.
- Prefer maintainability and proven patterns over novelty.
- Reuse existing components, contracts, and architecture where practical.
- Avoid speculative architecture and premature platform expansion.
- Protect household trust, privacy, and data correctness.

## Current Implementation and Long-Term Direction

These states must remain explicitly separate.

### Current implementation

The current app shell implements five primary actions:

1. Home
2. Tasks
3. Calendar
4. Quick Add
5. More

Home currently serves as the dashboard. Additional implemented workspaces, including Life Lists, Shopping, Meal Planning, Pool, Household, and Settings, are reached through app navigation and More as documented by the current code and release records.

### Approved long-term product architecture

The approved long-term module architecture is:

1. Dashboard
2. Calendar
3. Tasks
4. Life
5. Home
6. Financial Planning

This target architecture is not fully implemented. Do not present it as current behavior, expose unfinished modules as complete, or force a navigation rewrite without an approved release scope. Quick Add remains a cross-module capture capability, not a long-term business domain. Settings and household administration remain management surfaces.

Historical documents that describe earlier navigation or release states must remain unchanged when they are clearly dated, archived, or release-specific.

## Long-Term Module Ownership

### Dashboard

Dashboard answers, "What should I know right now?" It is an awareness layer containing today's schedule, reminders, recent activity, family highlights, quick capture, and cross-module summaries. It summarizes and routes to the owning workspace. It must not duplicate workspace functionality or become an AI recommendation page.

### Calendar

Calendar owns events, scheduling, calendar integrations, schedule visibility, and event status. It remains the source of truth for schedules.

### Tasks

Tasks owns action items, priorities, due dates, assignments, completion, search, filters, sorting, and task context.

### Life

Life owns lists, shopping-related records, recurring household administration, and family reference information. Shopping exists in the current implementation. Its approved long-term home is Life unless a later architecture decision changes that ownership.

### Home

Home manages recurring household operational systems that benefit from structured measurements, history, treatments, maintenance workflows, and ChatGPT context. Current roadmap scope is Pool, Garden, operational settings, histories, linked Tasks, and ChatGPT context. Broad asset tracking, vehicles, appliances, tools, inventory, warranties, projects, and document management are excluded.

### Financial Planning

Financial Planning owns retirement, college planning, goals, assumptions, accounts, financial history, and scenarios. FamilyOS stores planning information and accepted decisions. ChatGPT performs analysis and scenario evaluation.

## Data and Decision Ownership

FamilyOS owns persistent data, history, documents, metadata, relationships, workflows, operational records, and explicitly accepted plans and decisions.

ChatGPT owns reasoning, planning, recommendations, prioritization, summaries, and scenario evaluation. AI output must be reviewable and must not become a permanent record or trigger a high-impact action without explicit acceptance.

Calendar owns schedule truth within the FamilyOS domain. Each other module owns its domain records and workflows. Dashboard owns no duplicate operational data.

## Architecture Principles

- Preserve separation of concerns and clear module ownership.
- Avoid duplicate logic, components, contracts, and sources of truth.
- Reuse shared UI, hooks, context, services, and established module patterns.
- Keep schemas understandable and database changes necessary, explicit, and migration-based.
- Maintain integration contracts and backward compatibility where practical.
- Keep the active household as the boundary for shared household data.
- Enforce authorization in RLS, RPC, or server-side API logic. UI hiding is not enforcement.
- Identify material technical debt and avoid hiding it through speculative abstractions.
- Record major architecture decisions in the architecture decision log or an ADR.

Detailed current architecture, folder, schema, RLS, API, and integration contracts remain in their dedicated documents.

## AI Integration

FamilyOS may send structured, permission-aware context to ChatGPT for planning, recommendations, decision support, summaries, prioritization, financial analysis, home planning, and task planning.

AI features must provide:

- Structured and scoped inputs.
- Human review and explicit acceptance where outputs become records.
- Traceable outputs and source context where practical.
- Privacy-aware data handling and minimum necessary disclosure.
- Clear confidence, assumptions, limitations, and safety notes when relevant.
- Proportionate safeguards, recovery planning, and validation for high-impact actions.

Never expose secrets, provider tokens, or household data beyond the authorized workflow. Autonomous action requires a separately approved design with bounded permissions, auditability, recovery, and human control.

## UX Principles

- Design mobile-first, beginning at a 360px viewport.
- Minimize clicks and preserve user context.
- Use progressive disclosure and plain, consistent labels.
- Keep navigation predictable and distinguish current from future capabilities.
- Provide clear loading, empty, success, error, and permission states.
- Keep Dashboard as awareness and modules as action-oriented workspaces.
- Make status, ownership, urgency, and next action easy to understand.
- Meet accessibility requirements for semantics, labels, focus, contrast, keyboard access, and non-color status cues.

## Performance Principles

- Favor fast initial and interaction loading.
- Use efficient queries and the minimum practical API calls.
- Lazy-load or defer work when it improves real user experience.
- Optimize against measured or credible constraints, not hypothetical scale.

## Security Principles

- Protect family data as sensitive private information.
- Apply least privilege and validate all external inputs.
- Keep server secrets and long-lived provider tokens out of frontend code.
- Maintain secure environment configuration and fail closed for optional integrations.
- Enforce household isolation and role permissions at the backend.
- Require target verification, recoverability, and post-change validation for production mutations and other high-impact actions.

## Product and Architecture Decision Standard

Material recommendations must explain:

- User value.
- Architectural impact.
- Schema and data impact.
- Security and privacy impact.
- Risks and dependencies.
- Release and migration impact.
- Alternatives or deferred choices when material.

Prefer the simplest option that meets the approved outcome without creating duplicate ownership or unnecessary complexity.

## Development Operating Model

The product owner defines outcomes, priorities, UX expectations, acceptance criteria, and release scope. ChatGPT supports reasoning, planning, architecture, review, and decision support. Codex performs scoped engineering execution, validation, documentation, and cleanup.

For meaningful work:

1. Read this document and the specialized documents relevant to the change.
2. Inspect the repository before proposing or changing implementation.
3. Confirm current behavior, target outcome, ownership, contracts, and boundaries.
4. Complete the approved scope end-to-end without unrelated changes.
5. Update code, configuration, migrations, documentation, and validation assets required by the scope.
6. Run validation proportionate to risk.
7. Report assumptions, decisions, risks, limitations, and remaining work.

Preserve existing functionality unless removal is explicitly approved. Do not require the non-developer product owner to perform routine technical implementation.

## Autonomous Execution and Safety Boundaries

A clear product-owner request authorizes Codex to complete the practical engineering and release lifecycle required by that outcome, including implementation, validation, commits, pushes, pull requests, merges, tags, migrations, deployments, production checks, and cleanup. Do not divide that lifecycle into routine approval checkpoints.

For production, destructive, security-sensitive, dependency, authentication, authorization, migration, or other high-impact work, verify the exact target, preserve backups or rollback paths, limit scope, validate the result, and recover or revert when needed. Stop only for a genuine external blocker, missing credentials or authority, organization-managed policy, third-party outage, or irreversible ambiguity where every reasonable option risks substantial data loss.

## Release Management

Each release needs defined scope, implementation, risk-based testing, validation, documentation, release notes, and rollback consideration. Do not mix unrelated enhancements into a release.

Use the active release and feature playbooks for detailed execution. This document controls autonomous lifecycle execution and safety boundaries where older playbooks conflict.

## Definition of Done

A feature or release is complete only when applicable criteria are satisfied:

- Approved behavior is implemented and acceptance criteria pass.
- Happy paths, edge cases, regressions, and affected navigation are checked.
- Build, lint, targeted tests, and manual validation pass or blockers are documented.
- Database migrations and RLS are validated in an approved non-production environment when affected.
- Documentation, changelog, release notes, status, and roadmap are current as applicable.
- No known regression or unresolved release blocker remains.
- Authenticated UI releases use the permanent non-production demo seed and Playwright smoke/regression framework when the required test environment is available.
- Git diff and status are reviewed.
- The result is ready for product validation or the next explicitly approved release action.

Development demo accounts, seeded data, test credentials, and auto-login must remain confined to local or explicitly designated non-production environments. Auto-login must fail closed outside localhost development builds. Detailed controls are maintained in `docs/process/DEVELOPMENT_TESTING_INFRASTRUCTURE.md`.

## Documentation Governance

This is the only active canonical FamilyOS governance document. Other active documents should link here for governing principles and contain only the specialized detail needed for their domain.

Maintain dedicated current documents for product direction, architecture, AI integration, release planning, release notes, setup, deployment, integrations, schemas, RLS, and technical debt. Avoid copying this document's general rules into them.

Preserve historical release notes, audits, archived plans, dated implementation records, and superseded baselines. Add a historical or superseded label when context is unclear, but do not rewrite history.

When guidance changes:

1. Update this document first when the change affects governance or cross-domain direction.
2. Update affected specialized documents and references.
3. Record major decisions and release/status impacts.
4. Check for conflicting active guidance.

## Required Completion Summary

Every major implementation must conclude with:

1. Executive Summary
2. Scope Completed
3. Features Implemented
4. Files Changed
5. Architectural Decisions
6. Database Changes
7. Testing Performed
8. Risks and Limitations
9. Remaining Work
10. Exact Next Action
11. Git Status
12. Recommended Commit Message

## PowerShell and Git

When instructions include PowerShell or Git commands, begin with:

```powershell
cd "C:\Users\Matt Glavach\Documents\Codex\familyos"
```

Keep commands minimal, safe, correctly ordered, and clearly separate inspection from write actions.

## Default Operating Principle

1. Define the outcome.
2. Prepare one comprehensive implementation scope.
3. Let Codex complete authorized local work end-to-end.
4. Validate the result.
5. Review decisions, risks, and remaining work.
6. Continue through recoverable failures and apply proportionate safeguards to high-impact work.
7. Complete publication, migration, deployment, validation, and cleanup required by the requested outcome.
