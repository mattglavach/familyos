# AI Workspace Developer Guide

1. Add or update a pure module contributor in `src/services/contextEngine.js`.
2. Return only normalized, permission-appropriate facts in the standard module sections.
3. Never generate provider prompts inside a module.
4. Keep prompt formatting and privacy rules in `src/services/promptBuilder.js`.
5. Keep prompt metadata local through `src/services/aiPreferences.js`; never store prompt bodies, conversations, or provider responses automatically.
6. Add deterministic unit tests for empty data, permission exclusion, privacy filtering, identifiers, and ordering.
7. Any future accepted-write workflow must open the owning module's reviewed form and require explicit user confirmation.
