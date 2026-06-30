# Module Standard

This standard is the implementation blueprint for every flagship Family OS module. Use it for Pool, Finance, Retirement, College, and future decision-support modules.

## Overview
- State the module purpose and the household decisions it supports.
- Identify the primary users, cadence of use, and core workflows.
- Define which dashboard, AI, notification, and reporting surfaces the module contributes to.
- Keep business logic transparent and explainable.

## Profile
- Store durable facts about the household, asset, account, student, or planning subject.
- Keep profile data separate from assumptions and event history.
- Show profile completeness and missing high-value fields.
- Prefer structured fields over free-form text when the value drives recommendations.

## Editable Assumptions
- Use the shared assumptions framework in `docs/architecture/ASSUMPTIONS_STANDARD.md`.
- Let users review, edit, reset, and understand assumptions.
- Mark whether each assumption is required, recommended, optional, or derived.
- Explain why each assumption matters before it affects a recommendation.

## Current Data
- Show the latest known state, freshness, source, and confidence.
- Distinguish user-entered data, imported data, calculated data, and AI-derived interpretations.
- Surface stale, missing, or contradictory data before making strong recommendations.

## History
- Preserve time-stamped records for readings, transactions, snapshots, actions, notes, and AI recommendations.
- Support trend analysis, before-and-after comparisons, and auditability.
- Avoid overwriting history when a correction should be appended as a new event.

## Decision Intelligence
- Use the shared decision engine standard in `docs/architecture/DECISION_ENGINE_STANDARD.md`.
- Every recommendation must explain its reasoning, inputs, assumptions, confidence, risk, impact, alternatives, and missing data.
- Recommendations should be actionable and tied to a household outcome.

## AI
- AI should assist with interpretation, prioritization, summaries, and scenario exploration.
- AI output must cite the data and assumptions it used.
- AI must identify uncertainty and missing inputs instead of presenting guesses as facts.
- Do not send secrets or unnecessary personal data to AI providers.

## Reports
- Reports should summarize trends, decisions, assumptions, and next actions.
- Include enough context for a household member to understand what changed and why.
- Prefer exportable, shareable summaries for planning-heavy modules.

## Dashboard Integration
- Each flagship module should contribute one or more dashboard widgets.
- Widgets should show status, urgency, trend, and next action.
- Dashboard content should be concise and link back to the module detail view.
- Avoid duplicating full module workflows in the dashboard.

## Household Architecture
- All household-owned module data should include `household_id`.
- Reads and writes should prefer Household Context.
- Preserve legacy `user_id` behavior only during migration windows.
- Keep module migrations incremental and locally validated before production rollout.

## RLS
- RLS policies must enforce household membership and role expectations.
- Apply RLS module by module after local data access has been validated.
- Preserve access to legacy rows only when explicitly required for migration.
- Document any production migration or backfill steps before they are applied.

## Testing Checklist
- Build passes with `pnpm run build`.
- `pnpm run check` passes when available.
- Loading, empty, error, and stale-data states are covered.
- Mobile layout works at 360px width.
- Reads and writes use the expected `household_id`.
- RLS behavior is validated locally before production use.
- AI recommendations include confidence and missing-data handling.

## Implementation Checklist
- Review roadmap, module standard, assumptions standard, and decision engine standard.
- Inspect existing module data flow before making changes.
- Reuse shared UI, hooks, services, and platform objects.
- Add or update documentation for meaningful behavior changes.
- Keep schema changes in Supabase migrations.
- Do not remove existing functionality unless explicitly instructed.

## Future Enhancements
- Cross-module recommendations.
- Shared attachment and notes support.
- Shared timeline and activity stream.
- Notification automation.
- Import/export and reporting improvements.
- Offline and mobile quick-action workflows.
