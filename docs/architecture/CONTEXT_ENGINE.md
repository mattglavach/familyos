# Context Engine Architecture

Release 2.0.0 adds `familyos.context-engine` version 2.0 as a deterministic, provider-neutral aggregation boundary. Module contributors emit only populated `summary`, `importantItems`, `upcomingItems`, `recommendations`, `metrics`, and `recentActivity` sections. Contributors do not create prompts and have no knowledge of ChatGPT or any other provider.

The engine sorts modules, removes internal identifiers and credential-like fields, records the active permission posture, and omits empty module contexts. The Prompt Builder is a separate layer that applies device-selected privacy filters, produces prompt text, and reports included modules, estimated token size, exclusions, privacy notes, and contract versions.

No context or prompt generation writes to Supabase. Prompt trace metadata is limited to timestamp, question, included modules, versions, and estimated token count in device-local storage. Conversation history and AI responses are not stored.
