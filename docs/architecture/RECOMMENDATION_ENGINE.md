# Recommendation Engine

Release 3.5 introduces `buildRecommendationPipeline` as the shared pure entry point for Home and Notification Center. It composes existing generation, lifecycle suppression, intelligence, normalized ranking, deterministic explanations, and canonical notification mapping. Consumers must not independently regenerate or rerank recommendation objects.

Release 3.4 extends the deterministic Release 3.3 provider pipeline with a pure intelligence layer. Domain providers continue to own facts and priority. The intelligence layer separately calculates confidence, workload, fatigue cooldown, grouping, dependency state, effectiveness, and trends. It cannot mutate schedules or accept recommendations automatically.

Confidence is a 0-100 ordering signal based on deterministic evidence, urgency, household impact, cross-module corroboration, freshness, and prior outcomes. Priority remains the user-facing urgency/impact classification. Material trigger-signature changes bypass cooldown. Learning records must include a plain-language explanation and remain scoped to one household and user.

Performance is bounded by in-memory passes over the already-loaded dashboard data and lifecycle history. No additional dashboard network request or external analytics request is introduced.
