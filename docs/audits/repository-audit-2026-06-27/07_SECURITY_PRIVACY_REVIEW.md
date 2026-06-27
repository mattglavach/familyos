# Security And Privacy Review

Audit date: 2026-06-27

## Secret Exposure Check

Reviewed files and references:

- `README.md`
- `.env.example`
- `src/config.js`
- `api/brief.js`
- `supabase/schema.sql`
- `src/App.js`

Findings:

- No committed literal API keys were identified in the reviewed text paths.
- `README.md` correctly distinguishes browser-visible `REACT_APP_*` values from server-only `ANTHROPIC_API_KEY`.
- `.env.local` exists locally as a directory according to `Get-ChildItem`; verify it is not tracked and correct if that is accidental.
- `ANTHROPIC_API_KEY` is only referenced in `api/brief.js` and docs, not frontend code.

## Auth / Security Risks

- Supabase Auth is used, and RLS is enabled on current app tables.
- Current RLS is `user_id` based, so household sharing is not supported by the database model.
- `api/brief.js` allows POST requests based on allowed origin but does not verify a Supabase session or user.
- API request size is constrained, but there is no rate limiting, abuse protection, per-user quota, or audit logging.
- Google Calendar OAuth access token is stored in `localStorage` as `gc_token` in `src/App.js`.
- AI brief and dismissed recommendation history are stored in `localStorage`.

## Privacy Risks For Family Data

FamilyOS may contain:

- Family schedules.
- Children's college planning.
- Finance and retirement details.
- Home maintenance.
- Pool chemistry.
- Medical records in future modules.
- Documents and travel data in future modules.

Risks:

- `localStorage` is readable by any script running on the origin, so XSS would expose Google tokens and local history.
- Seed fallback can blur the line between real and demo data if persistence fails.
- The AI brief route could send sensitive context to Anthropic without user/session-level guardrails.
- Future medical and document modules will require stronger privacy controls than the current prototype.
- No documented data retention, export, or deletion policy exists.

## Supabase RLS Concerns

Current RLS is good enough for single-user rows, but not for the platform vision:

- No `households` table.
- No household membership table.
- No roles/permissions.
- No shared household RLS policy.
- No clear RLS model for children, documents, medical records, or cross-user family data.

The current `user_id` model should not be extended casually into family sharing.

## Recommended Mitigations

Priority mitigations:

1. Add Supabase session verification to `api/brief.js` before it can process family context.
2. Add request rate limits and maximum payload documentation for AI routes.
3. Replace Google Calendar token `localStorage` storage with a safer pattern if long-term sync is required.
4. Explicitly mark seed/demo data and stop using seed fallback for authenticated persistence errors.
5. Design household membership and RLS before adding shared family accounts.
6. Add a privacy impact checklist to PRs for modules that handle finance, medical, documents, or children's data.
7. Add security docs covering secret rotation, RLS review, API key handling, and incident response.

