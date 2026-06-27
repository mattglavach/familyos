# Product And Platform Alignment

Audit date: 2026-06-27

## Alignment With Family OS Vision

The repo aligns with the FamilyOS vision at the prototype level. It already has operational surfaces for:

- Home dashboard.
- Tasks and home maintenance.
- Pool care.
- College planning.
- Finance and retirement-related calculations.
- Google Calendar context.
- AI brief endpoint integration.

However, the implementation is not yet a durable platform. It is a working app with several hard-coded modules rather than a shared household operating system with reusable entities, permissions, timeline, documents, reminders, and AI context.

## Module Support Assessment

| Module | Current Support | Notes |
| --- | --- | --- |
| Dashboard | Partial/working | `src/features/dashboard/Dashboard.js` exists and aggregates app data. |
| Tasks | Partial/working | `src/features/tasks/Tasks.js` exists; task engine is not yet platformized. |
| Pool | Working but centralized | UI and logic appear inside `src/App.js`; schema includes several pool tables. |
| Finance | Working but centralized | Logic appears inside `src/App.js`; schema includes retirement, mortgage, debt, net worth, and action items. |
| Retirement | Partial | Retirement accounts and assumptions exist, but no separate module folder. |
| College | Working but centralized | Several college tables exist; no person/child linkage. |
| Documents | Mostly planned | Docs mention documents; schema lacks current `documents` table. |
| Garden | Planned | Docs mention garden; schema lacks current garden tables. |
| Home | Partial | `home_maintenance` exists; no `properties` or `home_assets`. |
| Vehicles | Planned | Module docs mention vehicles; SQL lacks vehicle tables. |
| Medical | Planned | Module docs mention medical; SQL lacks medical tables. |
| Travel | Planned | Module docs mention travel; SQL lacks travel tables. |
| Pickleball Club | Planned | Module docs exist; no implementation detected. |
| AI Assistant | Partial | `api/brief.js` exists; platform AI context is not implemented. |

## Extensibility

Current extensibility is limited by:

- Module logic concentrated in `src/App.js`.
- No canonical `people`, `households`, `assets`, `documents`, `events`, `metrics`, `goals`, `reminders`, or `timeline_entries` tables.
- No module registry or `module_key` pattern in the implemented schema.
- No household roles or permissions.
- No test suite to protect domain behavior during extraction.

The docs already describe the right platform direction, especially `docs/platform/01_data_model.md` and `docs/platform/02_database_schema.md`. The gap is execution.

## AI / Context Readiness

Current readiness:

- `api/brief.js` can proxy Anthropic messages.
- Some AI brief history is stored client-side.
- Platform docs describe future AI context concepts.

Gaps:

- No server-side context builder.
- No explicit consent/preview flow for what family data is sent to the AI model.
- No per-module AI context contract.
- No redaction rules for finance, children, medical, or documents.
- No app-user auth requirement on the AI route.

## UX / Navigation Concerns

Strengths:

- Mobile-first bottom navigation is appropriate for core modules.
- Home dashboard focuses attention on current actions.
- Quick Add supports fast entry.

Concerns:

- Internal tab state limits deep linking.
- Five bottom tabs are already full: Home, Finance, Pool, Tasks, College. Future modules need a navigation strategy before they are added.
- Documentation lists many modules, but the current navigation only supports a few.
- Quick Add is globally useful but implemented inside `src/App.js`, making it hard to extend as modules grow.

## Platform Scalability Concerns

- Without household scope, FamilyOS remains a personal app rather than a family platform.
- Without shared entities, each module will likely duplicate tasks, reminders, notes, documents, and metrics.
- Without a timeline/activity model, AI summaries and command center views will require ad hoc queries.
- Without documents and file metadata, several planned modules cannot mature.
- Without CI/tests, refactors needed for platformization carry high regression risk.

## Recommendations

1. Treat current code as Phase 1 single-user prototype and docs as Phase 2 platform target until reconciled.
2. Create a module status matrix in docs showing planned, partial, and implemented surfaces.
3. Define Phase 2 platform foundations before adding more modules:
   - Household and household membership.
   - People/family members.
   - Shared tasks.
   - Shared documents.
   - Metrics.
   - Timeline.
   - Module registry.
4. Extract the current modules before adding Documents, Medical, Vehicles, Travel, or Garden.
5. Add AI privacy and context contracts before expanding AI features.

