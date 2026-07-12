# AI Workspace Developer Guide

1. Add or update a pure module contributor in `src/services/contextEngine.js`.
2. Return only normalized, permission-appropriate facts in the standard module sections.
3. Never generate provider prompts inside a module.
4. Keep prompt formatting and privacy rules in `src/services/promptBuilder.js`.
5. Keep prompt metadata local through `src/services/aiPreferences.js`; never store prompt bodies, conversations, or provider responses automatically.
6. Add deterministic unit tests for empty data, permission exclusion, privacy filtering, identifiers, and ordering.
7. Any future accepted-write workflow must open the owning module's reviewed form and require explicit user confirmation.
## Release 2.1 guided acceptance

Guided acceptance uses transient app navigation payloads with `guided`, `workflow`, `ts`, and `prefill` fields. AI Workspace never calls a table mutation. Each owning module consumes the payload once to initialize its existing form, then relies on its normal validation, permission checks, save, cancellation, and error handling. Calendar uses the Google Calendar event-template URL because Calendar remains an external schedule surface.

New destinations must not add a parallel save path. Extend the owning module's existing form contract and add unit coverage for parsing and navigation.
