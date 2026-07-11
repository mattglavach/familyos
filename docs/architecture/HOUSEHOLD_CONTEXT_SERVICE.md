# Household Context Service

## Release 1.8 implementation

`src/services/householdContextService.js` implements the versioned `familyos.household-context` contract. It aggregates household-scoped Calendar, Tasks, Pool, household settings, maintenance, birthdays, and reminders into normalized summaries and deterministic attention items. Gardening is explicitly `not-configured` in this release.

The broader Context Engine is the architectural pattern for sharing permission-aware FamilyOS information. The Household Context Service is its current local, deterministic implementation. It does not call ChatGPT or another AI provider, persist recommendations, or perform operational actions.

The contract preserves date-only Calendar values, distinguishes all-day and timed events, uses `America/New_York` unless a supported household timezone is configured, reports source freshness, and returns explicit availability states. Module-owned services remain responsible for domain rules. The household service aggregates their outputs.

Attention items are derived at runtime through `src/services/attentionItems.js`. Persistence and external delivery channels are intentionally deferred.
