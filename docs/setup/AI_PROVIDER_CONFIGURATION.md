# AI Provider Configuration

FamilyOS uses environment configuration so provider details remain outside the browser bundle.

Required server values for Anthropic:

- `AI_PROVIDER=anthropic`
- `AI_PROVIDER_MODEL=claude-sonnet-4-6` or another approved model
- `AI_PROVIDER_API_KEY`, with `ANTHROPIC_API_KEY` supported as a compatibility fallback
- `AI_REQUEST_TIMEOUT_MS=15000`
- `ALLOWED_ORIGINS` with the approved application origins

Use `AI_PROVIDER=mock` for deterministic automated environments. If no provider key exists, `/api/advisory` returns deterministic FamilyOS fallback content and core features continue working.

Never use a `REACT_APP_*` name for a provider key. Do not expose raw system prompts or model controls in normal user settings. Rotation requires updating the server environment, redeploying, verifying the production bundle contains no secret marker, and running one production-safe advisory request.

Provider replacement must implement `structuredCompletion`, `streamText`, timeout cancellation, normalized errors, and aggregate usage metadata in `api/_advisoryProvider.js`.
