# Context Engine Architecture

Release 2.9 advances `familyos.context-engine` to version 2.9. The unified output adds household location/timezone, household-load classification, important-now evidence, today/upcoming/recent sections, module summaries, weather, recommendations, per-source freshness, and missing-critical-data signals. Providers remain pure and household scoped. JavaScript runtime contracts are paired with TypeScript declaration files for strong consumer typing while preserving the established CRA architecture.

Release 2.0.0 adds `familyos.context-engine` version 2.0 as a deterministic, provider-neutral aggregation boundary. Module contributors emit only populated `summary`, `importantItems`, `upcomingItems`, `recommendations`, `metrics`, and `recentActivity` sections. Contributors do not create prompts and have no knowledge of ChatGPT or any other provider.

The engine sorts modules, removes internal identifiers and credential-like fields, records the active permission posture, and omits empty module contexts. The Prompt Builder is a separate layer that applies device-selected privacy filters, produces prompt text, and reports included modules, estimated token size, exclusions, privacy notes, and contract versions.

No context or prompt generation writes to Supabase. Prompt trace metadata is limited to timestamp, question, included modules, versions, and estimated token count in device-local storage. Conversation history and AI responses are not stored.

Release 2.1.0 adds deterministic quality controls at the module boundary. Repeated sections are deduplicated by their user-visible identity, ordered by explicit priority or severity, and limited to twelve items. Guided acceptance remains outside the Context Engine: AI Workspace translates reviewed suggestions into navigation payloads, and owning modules initialize their existing forms. The normal form save action remains the only write boundary.
