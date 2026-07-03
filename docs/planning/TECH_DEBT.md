# Technical Debt

Use this document to track durable technical debt. Do not use chat history as the only debt register.

## Process
- Add debt when a release intentionally defers cleanup, migration, testing, or architecture work.
- Include impact, owner/context, and a recommended trigger for resolution.
- Close debt only when the repository changes or docs make the debt obsolete.

## Debt Items

### Product Owner UX Opportunities
- Status: Open
- Impact: Release 1.3.1 completed the highest-priority Planning Platform polish, but several refinements remain useful before a broader household rollout.
- Trigger: Next product-owner polish release or before broad family onboarding.
- Notes:
  1. Add item-level deep-linking from Search and Home rows into the exact selected list, shopping item, pantry item, recipe, meal assignment, or task.
  2. Continue reducing duplicated create affordances inside modules while preserving action-oriented module workflows.
  3. Split Settings into clearer Account, Household, Calendar, and App sections when the page grows past comfortable scanning.
  4. Add automated responsive smoke coverage for 390px, tablet, and desktop horizontal-overflow checks.
  5. Migrate remaining legacy deferred-module inline UI patterns only when those modules become active release scope.

### Pool Care Assistant Implementation
- Status: Resolved in Release 1.4.0 for the scoped foundation.
- Impact: Release 1.4.0 implements the action engine, treatment history, equipment maintenance, Quick Add targets, Search support, schema foundation, and validation for the scoped Pool Care Assistant foundation.
- Trigger: Future Pool integration or AI Coach release.
- Notes: Pentair, Home Assistant, AI Coach runtime, automatic dosing, automatic equipment control, imports, OCR, and exact product-label dosing remain separate future work.

### Swipe Card Desktop Row Actions
- Status: Resolved in Release 1.4.0.
- Impact: Shared swipe-card row actions now include visible focusable Edit/Delete buttons and mouse-drag support while preserving the original swipe tray.
- Trigger: Monitor future row-action surfaces for density and visual fit as more modules adopt the pattern.
- Notes: Validation confirmed Pool equipment edit by desktop mouse, keyboard activation, and mobile swipe/touch path, plus Pool History fallback actions.

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

### Calendar Setup Prompt Persistence
- Status: Open
- Impact: Release 1.0.5 uses a header attention dot and compact Home/Calendar/Settings guidance instead of a persistent dismissible setup prompt.
- Trigger: Before showing recurring Calendar setup prompts after login.
- Notes: Add only after preference-backed dismissal is designed and validated for owner, adult, and viewer roles.

### Environment Configuration Drift Checks
- Status: Open
- Impact: Local, staging, and production environments can drift on optional integration variables, migration application, or Supabase schema cache state.
- Trigger: Before each release candidate and before enabling Calendar or invitation flows for broader users.
- Notes: A scripted configuration health check would reduce reliance on manual environment audits.

### Automated Test Coverage
- Status: Open
- Impact: Current validation relies heavily on lint/build/manual SQL/browser smoke.
- Trigger: Before high-risk finance, medical, document, or broad collaboration releases.

### Legacy Deferred-Module UI Migration
- Status: Open
- Impact: Some deferred modules still contain inline styles, native selects, and older local component patterns that are outside the Release 1.0.3 active surfaces.
- Trigger: When Pool, Finance, College, Health, Shopping, Life Lists, or other deferred modules become active release scope.
- Notes: Migrate through `src/components/ui` wrappers and the UI migration backlog. Do not rewrite deferred modules only for cosmetic consistency.

### Native Browser Confirmations
- Status: Open
- Impact: Release 1.0.4 replaced native confirmations in touched Core MVP task, invitation, calendar, and device-preference flows, but deferred modules may still contain older confirmation patterns.
- Trigger: When Pool, Finance, College, or other deferred modules become active release scope.
- Notes: Continue replacing native confirmations with the local Dialog or Alert wrapper without changing authorization or mutation behavior.

### Advanced shadcn Primitive Backing
- Status: Open
- Impact: Release 1.0.3 provides local JavaScript wrappers for the baseline component API, but advanced overlay behavior may eventually need Radix-backed shadcn primitives.
- Trigger: Before building complex menus, comboboxes, nested overlays, or fully keyboard-managed command palettes.
- Notes: Preserve the wrapper import contract so feature modules do not change when internals are upgraded.

### Historical Documentation Review
- Status: Open
- Impact: Audit, decision, and implementation folders intentionally preserve historical context, but some findings describe older repository states.
- Trigger: Before Release 1.0 documentation freeze.
- Notes: Review historical docs for any current links that should point to `docs/process`, without rewriting historical records.
