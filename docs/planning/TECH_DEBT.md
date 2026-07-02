# Technical Debt

Use this document to track durable technical debt. Do not use chat history as the only debt register.

## Process
- Add debt when a release intentionally defers cleanup, migration, testing, or architecture work.
- Include impact, owner/context, and a recommended trigger for resolution.
- Close debt only when the repository changes or docs make the debt obsolete.

## Debt Items

### Full Household-Scoped Module RLS
- Status: Open
- Impact: Existing module tables still preserve staged user-owned compatibility policies.
- Trigger: Before broad multi-household sharing across all modules.
- Notes: Requires validated backfill, active-household behavior, RLS conversion, and regression smoke tests.

### Ownership Transfer And Owner Recovery
- Status: Open
- Impact: Household collaboration has owner-only membership management but no transfer/recovery workflow.
- Trigger: Before wider multi-user rollout.
- Notes: Requires product, security, and support review.

### Legacy Browser Calendar Fallback
- Status: Open
- Impact: Release 0.8 server calendar exists, but legacy browser fallback remains until deployed OAuth validation is complete.
- Trigger: After production OAuth validation and family-device smoke tests.

### Automated Test Coverage
- Status: Open
- Impact: Current validation relies heavily on lint/build/manual SQL/browser smoke.
- Trigger: Before high-risk finance, medical, document, or broad collaboration releases.

### Historical Documentation Review
- Status: Open
- Impact: Audit, decision, and implementation folders intentionally preserve historical context, but some findings describe older repository states.
- Trigger: Before Release 1.0 documentation freeze.
- Notes: Review historical docs for any current links that should point to `docs/process`, without rewriting historical records.
