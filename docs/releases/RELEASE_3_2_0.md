# FamilyOS 3.2.0 AI Planning and Advisory

## Outcome

FamilyOS now turns permission-scoped household facts into concise planning advice without surrendering control of the system of record. Family Assistant answers cross-module questions, creates a weekly plan, shows its source modules, and presents editable proposed actions. Home adds an AI executive summary while deterministic Family Brief content loads independently.

## Architecture

- Provider-neutral server abstraction with structured completion, text streaming capability, timeout cancellation, normalized errors, usage metadata, and deterministic mock/fallback.
- Authenticated server context assembly using the caller token, active household membership, RLS, minimum selected modules, identifier redaction, and untrusted-content boundaries.
- `familyos.advisory-response` 3.2 validation for summaries, findings, recommendations, risks, evidence, supporting records, and allowlisted proposed actions.
- Owning-form handoff as the only action boundary. Model output never writes a household record.
- Deterministic Calendar conflict/open-window analysis and existing Pool chemistry/dosage contracts remain authoritative.

## Database

Migration `20260714030000_release_3_2_ai_planning.sql` adds `ai_preferences`, `ai_recommendations`, `ai_proposed_actions`, and `ai_feedback`. The migration is additive, has no backfill, enables RLS, limits writes to owner/adult users in active households, and explicitly revokes anonymous/public privileges. Full prompts, model responses, context payloads, attachments, and session conversations are not stored.

Production schema backup: `familyos-pre-3.2-20260714-230403-schema.sql`. Production data backup: `familyos-pre-3.2-20260714-230403-data.sql`. Both are retained in the local temporary backup location. All 25 migrations align in production.

## Validation

- ESLint: passed with no warnings.
- Declaration type checking: passed.
- Unit tests: 40 suites, 157 tests passed.
- Seed safety: 18 tests passed.
- Migration/security: Release 2.9 through 3.2 assertions passed; production RLS and anonymous denial verified by post-migration schema dump.
- Playwright: 81 authenticated tests passed across desktop, 390px mobile, tablet, and dark mode.
- Accessibility and keyboard semantics: passed in the authenticated viewport matrix.
- Production build and bundle-secret scan: passed.
- Prompt-injection, malformed action, fallback, timeout, permission, and deduplication controls: passed.
- `git diff --check`: passed.

## Production

Application deployment `dpl_YXNjcd2uLmvQ17aKLVSXCmBnZwuC` is READY at `https://familyos-pi-seven.vercel.app` and `https://familyos-dds5nnk7e-glavach.vercel.app`. Public desktop/mobile, weather, console, bundle-secret, and unauthenticated advisory checks passed. One authenticated, read-only production advisory request returned the 3.2 contract from Anthropic. Logs contain only request metadata, category, provider, module count, latency, and aggregate usage.

## Known limitations

- Google Calendar remains provider-owned for event writes; proposed Calendar actions open the provider review workflow.
- Current-session conversation is intentionally not durable.
- The existing Weather serverless route emits a non-blocking Node `url.parse()` deprecation warning from the runtime.
- Provider output arrives as one validated structured response in the current UI. The provider abstraction supports text streaming, but network-level incremental structured-card rendering is deferred until it can preserve schema validation and action safety.
