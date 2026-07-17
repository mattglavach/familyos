# Release 3.5.0: Morning Command Center and Unified Recommendation Engine

## Outcome

Home now presents one Best Next Action and two additional priorities through the same deterministic, lifecycle-aware recommendation pipeline used by Notification Center. A collapsed seven-day outlook adds workload, calendar pressure, deadlines, preparation, weather impact, and conflict awareness without creating a new module.

## Scope

- Stable recommendation identity, trigger signatures, ranking, suppression, and notification mapping.
- Named normalized ranking factors with a safety-critical score floor.
- Deterministic why-now, why-it-matters, ranking, and can-wait explanations.
- Device-local meaningful changes since the last Home visit.
- Exactly three recommendations above the fold.
- Responsive, dark-mode, keyboard, touch-target, and accessibility preservation.

## Boundaries

No database migration, dependency, navigation item, AI ranking, autonomous action, effectiveness dashboard, deployment, or production mutation is included. Recommendation history remains the durable lifecycle source; last-visit presentation state remains device-local.

## Rollback

Revert the application changes. Existing Release 3.3 and 3.4 database objects remain compatible and require no rollback.
