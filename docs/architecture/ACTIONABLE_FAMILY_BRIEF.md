# Actionable Family Brief Architecture

## Ownership

Home owns synthesis and routing, not domain records. Calendar remains schedule truth; Tasks owns tasks; Habits, Relationships, Pool, and Home Operations own their records and calculations. A recommendation is one canonical decision-support object referenced through its deduplication key.

## Deterministic pipeline

1. Existing providers evaluate due dates, events, habits, Pool measurements, maintenance, weather, and completed activity.
2. Cross-module providers combine related facts when the combined context is more useful than isolated cards.
3. The priority function uses severity, urgency, confidence, effort, and named factors such as safety, timing, impact, weather, maintenance urgency, Pool chemistry, and manual priority.
4. Deduplication retains one recommendation per canonical key.
5. Lifecycle history suppresses completed, never-remind, matching dismissed, active snoozed, and cooldown states.
6. The brief builder assigns nonduplicative Today, Next Actions, This Week, wins, changes, safe-to-wait, weekly outcomes, and looking-ahead sections.

## Lifecycle and human control

`recommendation_history` records generated and user decision events with the recommendation key, trigger signature, source modules, related records, and optional reminder time. Every action that mutates or routes FamilyOS data opens a confirmation dialog. Task completion is the only inline domain mutation in this release and uses the existing Tasks table contract. Other creation actions open the owning workflow.

## AI boundary and performance

The deterministic pipeline runs synchronously from already loaded module data. AI summary generation is asynchronous, permission-scoped, optional, and request-cached by household, date, and context. AI never creates facts, changes priority rules, or blocks the deterministic brief.

## Accessibility and responsive behavior

Cards use semantic buttons, explicit priority text, focus-visible outlines, expandable explanations, accessible loading status, touch-sized controls, token-based colors, and wrapping layouts. The Home container prevents horizontal scrolling at mobile, tablet, and desktop widths. Motion is limited to existing reduced-motion-compatible transitions.
