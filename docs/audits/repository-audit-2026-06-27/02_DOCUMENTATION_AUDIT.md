# Documentation Audit

Audit date: 2026-06-27

## Key Docs Reviewed

| Document | Status | Notes |
| --- | --- | --- |
| `README.md` | Current with caveats | Good setup guide; should state that several platform docs are aspirational and that `src/App.js` still contains most modules. |
| `AGENTS.md` | Needs Update | Says there is no dedicated test script, but `package.json` now defines `lint` and `check`. |
| `docs/00_MASTER_INDEX.md` | Needs Update | Good index, but module entries are plain names rather than links to `docs/modules/*.md`. |
| `docs/ai/AI_CONTEXT.md` | Current | Useful role and expectations doc. |
| `docs/planning/CURRENT_SPRINT.md` | Current | Accurately tracks foundation work and pending structure validation. |
| `docs/planning/ROADMAP.md` | Needs Update | Phase 0 items are unchecked even though docs, AGENTS, templates, and platform docs exist. |
| `docs/planning/PROJECT_STATUS.md` | Needs Update | Needs explicit implementation status versus aspirational docs status. |
| `docs/development/CODING_STANDARDS.md` | Needs Update | References TypeScript, Tailwind, shadcn, and centralized Supabase queries; implementation is still mostly JS and inline styles. |
| `docs/development/TESTING_STRATEGY.md` | Needs Update | Strategy exists but no implemented test suite or test script is present. |
| `docs/development/GIT_WORKFLOW.md` | Unclear | Needs alignment with actual GitHub Actions and branch protection once added. |
| `docs/database/DATABASE_SCHEMA.md` | Needs Update | Lists target platform tables such as `profiles`, `households`, and `family_members`, but SQL does not implement them. |
| `docs/database/SECURITY_RLS.md` | Needs Update | Says restrict by `household_id`; actual policies restrict by `user_id = auth.uid()`. |
| `docs/database/NAMING_STANDARDS.md` | Current with caveats | Naming guidance is directionally correct but not fully enforced by current schema. |
| `docs/database/ERD.md` | Needs Update | Must reflect actual SQL and future target separately. |
| `docs/architecture/SYSTEM_ARCHITECTURE.md` | Needs Update | Target stack includes TypeScript; actual app is JavaScript. |
| `docs/architecture/FOLDER_STRUCTURE.md` | Needs Update | Recommended structure does not match current `src/features` and monolithic `src/App.js`. |
| `docs/architecture/AUTHENTICATION.md` | Needs Update | Should describe Supabase Auth, Google Calendar token storage, and current API auth gap. |
| `docs/architecture/ROUTING.md` | Needs Update | App uses internal tab state, not a router. |
| `docs/architecture/DEPLOYMENT.md` | Needs Update | Should include CI status and Vercel API route caveats. |
| `docs/platform/01_data_model.md` | Aspirational | Good target model, but not current implementation. |
| `docs/platform/02_database_schema.md` | Aspirational | Explicitly says it does not change `supabase/schema.sql`; should be labeled as future-state. |
| `docs/platform/03_task_engine.md` | Aspirational | Current tasks are simpler and split from maintenance. |
| `docs/platform/04_notification_engine.md` | Aspirational | No notification engine implemented. |
| `docs/platform/05_ai_context.md` | Aspirational | AI brief exists, but no full platform AI context builder exists. |
| `docs/platform/06_api_contracts.md` | Needs Update | Should include exact `api/brief.js` request/response limits and auth status. |
| `docs/platform/07_command_center.md` | Aspirational | Dashboard exists; platform command center is not implemented. |
| `docs/ui/DESIGN_SYSTEM.md` | Strong but partly aspirational | Implementation still uses many inline styles from `src/theme.js`. |
| `docs/ui/COMPONENT_LIBRARY.md` | Needs Update | Should distinguish available primitives from planned components. |
| `docs/ui/NAVIGATION.md` | Current with caveats | Bottom-tab navigation exists; future modules are not active. |
| `docs/releases/CHANGELOG.md` | Needs Update | Should include this audit after commit. |

## Specific Recommended Edits

- Update `AGENTS.md` and/or docs to reflect that `package.json` includes `lint` and `check`.
- Add status labels to platform docs: `Implemented`, `Partially implemented`, `Future target`.
- Update `docs/database/DATABASE_SCHEMA.md` with two sections: current SQL schema and target platform schema.
- Update `docs/database/SECURITY_RLS.md` to describe current `user_id` RLS and future `household_id` RLS separately.
- Update `docs/architecture/SYSTEM_ARCHITECTURE.md` to say JavaScript is current and TypeScript is a target only if that is intentional.
- Update `docs/architecture/FOLDER_STRUCTURE.md` to choose `features` or `modules`.
- Update `docs/platform/06_api_contracts.md` with the actual `api/brief.js` limits: POST only, `messages` array required, max 8 messages, string content max 12,000 chars, `max_tokens` capped at 1,200, optional web-search tools only.
- Update `docs/planning/ROADMAP.md` Phase 0 checkboxes to match completed work.
- Add a documentation map that identifies which docs are current state versus future architecture.

## Documentation Gaps

- No documented migration process with file naming and deployment steps.
- No API contract documentation for all Supabase table operations used by the frontend.
- No data retention/privacy policy for family, finance, college, health, and Google Calendar data.
- No incident/security response notes for leaked environment variables or misconfigured RLS.
- No contributor guide explaining local checks, PR expectations, and review process beyond templates.
- No module implementation status matrix.
- No explicit release/versioning policy tied to tags or deployments.

