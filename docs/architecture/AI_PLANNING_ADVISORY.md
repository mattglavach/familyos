# AI Planning and Advisory Architecture

## Boundaries

FamilyOS remains the system of record. The Context Engine and domain services produce facts and deterministic calculations. The server advisory endpoint performs permission-aware context selection and provider orchestration. The model may summarize, prioritize, explain, and draft proposals. Owning modules alone validate and save records.

## Structured response contract

`familyos.advisory-response` version 3.2 contains `summary`, `findings`, `recommendations`, `risks`, `supportingRecords`, `sourceModules`, and `generatedAt`. Findings and recommendations include title, concise explanation, priority, source module, related record references, evidence level, and optional proposed action. Evidence is `confirmed`, `calculated`, or `suggested`.

Supported proposed actions are allowlisted in `src/services/advisoryContract.js`. Every action is marked approval-required. Unknown actions or malformed payloads are removed. A validation failure preserves a safe summary and does not render an unsafe action.

## Request flow

1. The client chooses the minimum relevant modules and obtains the current Supabase access token.
2. `POST /api/advisory` authenticates that token and verifies active membership in the requested household.
3. The server queries selected tables using the caller token so RLS remains authoritative.
4. Internal identifiers and excluded fields are removed before provider use. Household strings are delimited as untrusted data.
5. The provider abstraction performs structured completion with a bounded timeout.
6. The client validates the structured response again before rendering.
7. If any provider step fails, deterministic context produces a non-blocking fallback.

## Proposed actions

Confirmation means “continue to review,” not “execute.” Editable proposed fields are routed to the owning FamilyOS form or provider-owned Calendar event template. The user must use that workflow's normal Save action. This preserves validation, authorization, error handling, and audit behavior while preventing partial or duplicate AI-originated writes.

## Pool and Calendar

Pool chemistry, dosage, safe-swimming guidance, recent-treatment suppression, units, assumptions, and safety warnings come only from tested Pool domain functions. The model may explain that output but cannot calculate a dose. Calendar overlap, tight-transition, overload, and open-window signals are deterministic; suggested blocks remain proposals and never create events automatically.

## Persistence and observability

The database stores only preferences, recommendation state, proposed-action audit state, and feedback needed for product behavior. Current conversation history stays in browser memory. Full prompts, context payloads, responses, attachments, authentication tokens, and database metadata are neither persisted nor logged. Logs contain only request ID, provider, mode, module count, latency, category, and aggregate usage.
