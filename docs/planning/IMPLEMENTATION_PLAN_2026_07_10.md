# FamilyOS Implementation Plan

Date: July 10, 2026

## Executive Summary

FamilyOS has a strong Release 1.x foundation: authenticated private household access, active household context, Home, Tasks, Calendar, Quick Add, More, Settings, scoped Universal Search, in-app notifications, and active Planning/Home-adjacent modules for Life Lists, Shopping, Meal Planning, and Pool. The codebase has moved out of the original monolith into a modular app shell, but several modules still carry large single-file implementations, duplicated form/list logic, and local-only state for notification read status, task metadata compatibility, and AI brief history.

The next high-value work is not a new domain module. Release 1.6 should harden the existing operating loop by validating deployed Calendar OAuth, deciding whether the legacy browser Calendar fallback can be removed, tightening Home/Calendar/Notifications/Quick Add/Search drill-down behavior, and documenting the platform contracts future modules must use. Home platform, Financial Planning, and the Context Engine should remain planned, not implemented.

## Current Product Maturity

Overall maturity: Nearly Complete for the private household core operating loop; Needs Polish for cross-module consistency; Incomplete for durable shared platform services.

- Production-ready areas: private auth, app shell, Home awareness, Tasks CRUD, Settings household management, server Calendar foundation, Life Lists, Shopping, Meal Planning, Pool foundation, shared UI primitives, release/process documentation.
- Nearly complete areas: Calendar read-only workflow, Quick Add supported targets, Universal Search coverage, in-app notification center, shared drawer form patterns.
- Needs polish: item-level deep linking, durable notification preferences/read state, module-level empty/error/loading consistency, responsive automated checks, broader UI primitive adoption in College/Finance/legacy common components.
- Needs refactor: large module files, duplicated list/form/state patterns, mixed inline style and Tailwind usage, module-specific permission helpers, task metadata compatibility code.
- Incomplete or planned: Home maintenance platform, Financial Planning product-grade permissions, Context Engine, attachments/documents, comments, activity timeline, tags/favorites/archive as reusable services, import/export, audit history, future permissions.

## Repository Architecture Summary

Current stack:
- Create React App with React 18 and plain JavaScript.
- Supabase client via `@supabase/supabase-js`.
- Vercel serverless APIs in `api/`.
- Tailwind-compatible local UI wrapper layer in `src/components/ui`.
- Supabase SQL baseline plus ordered migrations under `supabase/`.

Current layers:
- App shell: `src/app/App.js`, `src/app/navigation/tabs.js`.
- Compatibility entry: `src/App.js`.
- Modules: `src/modules/dashboard`, `tasks`, `calendar`, `quick-add`, `search`, `notifications`, `settings`, `life-lists`, `shopping`, `meal-planning`, `pool`, `finance`, `college`, `more`.
- Shared data/auth/context: `src/hooks/useTable.js`, `src/hooks/useSupabaseAuth.js`, `src/context/HouseholdContext.js`, calendar hooks, household collaboration hook.
- UI primitives: `src/components/ui`, Origin drawer wrapper, AI brief helpers, legacy `src/components/common.js`.
- Persistence: Supabase tables with staged household ownership and household-aware module migrations for newer modules.

Routing is tab-state based, not URL-based. This keeps the mobile app simple but limits deep linking from Search, Home, notifications, and future AI suggestions. State management is React local state plus household context and hooks. There is no global store.

API structure is intentionally small: `api/calendar.js` owns secure Google Calendar OAuth/event behavior and `api/brief.js` proxies AI brief generation. Server-only secrets remain outside frontend code.

## Feature Inventory

| Feature | Module | Maturity | Production ready | Category | Debt / notes | Related roadmap |
| --- | --- | --- | --- | --- | --- | --- |
| Private sign-in | App/auth | Mature | Yes | Complete | Manual user provisioning remains intentional | Family Hub |
| Household context | Context/Settings | Mature MVP | Yes | Nearly Complete | Owner recovery/transfer deferred | Household |
| Household invites/roles | Settings | Mature MVP | Yes | Nearly Complete | Advanced permissions deferred | Household |
| Home awareness dashboard | Dashboard | Mature MVP | Yes | Needs Polish | Needs platform widget contract and deep links | Family Hub |
| Tasks | Tasks | Mature MVP | Yes | Needs Polish | Compatibility metadata, richer recurrence, platform task model gap | Productivity |
| Calendar read-only | Calendar/API | Mature foundation | Partially, depends on env | Needs Polish | Deployed OAuth validation and legacy fallback decision pending | Family Hub |
| Quick Add | Quick Add | Mature MVP | Yes | Needs Polish | Needs destination registry and future capture gating | Family Hub |
| Universal Search | Search | Scoped MVP | Yes | Needs Polish | No item-level deep linking; not permission-registry based | Family Hub |
| Notification Center | Notifications | Scoped MVP | Yes | Needs Refactor | Local read state; generated signals only | Notifications |
| Settings | Settings | Mature MVP | Yes | Needs Polish | Split Account/Household/Calendar/App when it grows | Household |
| Life Lists | Life Lists | Mature MVP | Yes | Nearly Complete | Category templates/recommendations deferred | Life |
| Shopping/Pantry | Shopping | Mature MVP | Yes | Nearly Complete | Store grouping, recurring staples, import/OCR deferred | Planning |
| Meal Planning | Meal Planning | Mature MVP | Yes | Nearly Complete | Nutrition/API/recommendations deferred | Planning |
| Pool Care Assistant | Pool | Mature foundation | Yes | Nearly Complete | AI Coach/live integrations/automatic actions deferred | Home |
| Finance | Finance | Prototype/partial | No for broad use | Needs Refactor | Large single file, sensitive permissions, local AI history | Finance |
| College | College | Partial | No for broad use | Needs Refactor | Legacy UI, narrow Aubrey-specific assumptions | Life/Planning |
| More navigation | More | Mature MVP | Yes | Complete | Needs grouping updates as modules mature | Navigation |
| AI brief panels | AI helpers/API | Foundation | Limited | Planned | Context builders not implemented | AI |
| Home maintenance | Future/Home | Planned | No | Planned | Do not implement before platform contracts | Home |
| Financial Planning | Future/Finance | Planned | No | Planned | Requires privacy/permission design | Finance |

## Platform Services Assessment

| Service | Current state | Future need | Recommended Release 1.6 action |
| --- | --- | --- | --- |
| Context Engine | Platform docs and AI brief endpoint exist; no reusable runtime | Typed context builders, prompt assembly, reviewable facts, citations | Plan interfaces only |
| Search Service | `GlobalSearch` directly queries implemented tables | Search provider registry, item selection payloads, permission-aware result types | Add a design spec; small deep-link prep if scoped |
| Notification Service | Notification center derives signals from tasks/calendar/household and stores read IDs locally | Durable notification records, preferences, reminder model, digests | Keep in-app only; document service contract |
| Quick Add | Supported targets implemented directly in `QuickAdd` | Destination registry, shared validation contracts, review states | Inventory current targets and standardize target contract |
| Attachments | Not implemented | Storage, metadata, permissions, retention, scanning | Defer |
| Activity Timeline | Pool has action audit; dashboard has computed recent activity | Shared timeline entry model | Defer schema; document event candidates |
| Assignments | Tasks, Life Lists, Shopping have partial person assignment | Shared person assignment semantics | Normalize docs and UI labels |
| Tags | Life Lists/Recipes have tags | Shared tag model and search filters | Defer shared model |
| Favorites | Life Lists/Shopping/Meal Planning support favorites | Cross-module saved views/favorites | Defer shared model |
| Archive | Several modules have archive flags | Consistent archive lifecycle and filters | Document conventions |
| Comments | Not implemented | Entity comments with permissions | Defer |
| Audit History | Pool action audit exists | Shared audit/timeline policy for critical domains | Defer except documentation |
| Import / Export | Not implemented | CSV/JSON import/export with validation | Defer |
| Settings | Active but broad | Account, Household, Calendar, App, notification preferences | Plan split; no broad rewrite |
| Permissions | Household roles and module RLS exist | Granular capabilities by module/action | Document future capability matrix |

## Technical Debt Assessment

| Debt | Impact | Effort | Priority |
| --- | --- | --- | --- |
| Large single-file modules: Finance, Pool, Quick Add, Meal Planning, Shopping, Tasks, Dashboard | Harder review, duplicated local helpers, higher regression risk | Large | High for touched modules |
| Legacy inline styles and `src/components/common.js` patterns | UI inconsistency and accessibility drift | Medium-large | High for College/Finance |
| Direct table reads in Search/Notifications/Home | Repeated data fetching and no result/action registry | Medium | High |
| Local notification read state | Not shared across devices and not durable | Medium | Medium |
| Task metadata compatibility in localStorage | Split source of truth for task status/assignee history | Medium-large | Medium |
| Full household-scoped module RLS not complete for older tables | Sharing/security model remains staged | Large | High before broad multi-user sharing |
| Calendar legacy browser fallback | Security and behavior complexity after server OAuth exists | Medium | High after deployed OAuth validation |
| Environment drift checks are manual | Preview/production migration/config drift can break writes | Medium | High |
| Automated browser/responsive coverage is limited | Manual smoke burden and regression risk | Medium | Medium |
| Migration filename ambiguity from date-only prefixes | Supabase CLI/history ambiguity risk | Small-medium | Medium for next migration |
| Finance/College domain assumptions | Not product-ready for shared family use | Large | Defer |

## Module Readiness Assessment

### Dashboard / Home
Current maturity: Nearly Complete.
Remaining work: deep links into exact records, platform widget contract, durable notification handoff, improved Calendar deployment status.
Dependencies: Tasks, Calendar, Search, Notifications, module summaries.
Major risks: dashboard becoming a workspace instead of awareness layer.
Suggested order: polish Home cards after Calendar validation and before new module work.

### Calendar
Current maturity: Nearly Complete, read-only.
Remaining work: production OAuth validation, reconnect/disconnect smoke, legacy browser fallback removal decision, event deep-link support.
Dependencies: `api/calendar.js`, `calendar_connections`, environment config.
Major risks: env drift, OAuth origin mismatch, token handling.
Suggested order: first Release 1.6 workstream.

### Tasks
Current maturity: Nearly Complete.
Remaining work: richer recurrence model, platform task contract, durable assignment/status metadata, cross-module task creation.
Dependencies: household people, future task engine, notifications.
Major risks: changing schema/RLS too early.
Suggested order: contract planning in 1.6; schema later.

### Life
Current maturity: Active through Life Lists.
Remaining work: templates, richer category workflows, recommendations, gift/travel/deeper list types.
Dependencies: shared tags/favorites/archive/search.
Major risks: over-specializing the generic list model.
Suggested order: no Release 1.6 feature expansion.

### Home
Current maturity: Planned except Pool.
Remaining work: home assets, maintenance schedules, warranties, vendor/service history, platform asset/task/timeline links.
Dependencies: shared platform data model, attachments, tasks, notifications.
Major risks: duplicating Pool/Home maintenance logic before platform contracts exist.
Suggested order: design after Release 1.6/1.7 platform hardening.

### Financial Planning
Current maturity: Partial prototype.
Remaining work: product spec, sensitive permissions, data model review, UI refactor, validation, disclaimers.
Dependencies: granular permissions, import/export decisions, privacy model.
Major risks: exposing sensitive data too broadly, treating projections as advice.
Suggested order: high-level planning only until permissions mature.

## Release Backlogs

### Release 1.6: Core Operating Loop Hardening

Must Have:
- Complete deployed Calendar OAuth validation and reconnect/disconnect smoke.
- Decide and document legacy browser Calendar fallback removal readiness.
- Add a Calendar/Search/Notification/Quick Add integration contract document.
- Improve item/action handoff plan for Home, Search, Notifications, and Quick Add.
- Run `pnpm run build` and `git diff --check`.

Should Have:
- Add lightweight Search result action/deep-link design without URL routing rewrite.
- Add notification service planning for durable read state and preferences.
- Document Quick Add supported-target registry shape.
- Update UI migration backlog based on current large-module hotspots.

Could Have:
- Add small non-behavioral module registry constants for labels/routes/search targets if it reduces duplication.
- Add environment drift checklist for Calendar and module migrations.

Deferred:
- Home platform implementation.
- Financial Planning implementation.
- Context Engine runtime.
- New schema unless a very small metadata-only change is explicitly approved.
- Calendar event creation/editing.

Acceptance Criteria:
- Calendar deployed behavior is validated or blocked with exact environment findings.
- Release 1.6 scope has no new large feature surface.
- Planning docs identify reusable contracts for Search, Notifications, Quick Add, and future Context Engine.
- No production data mutation occurs.

Dependencies:
- Production or staging Supabase/Google Calendar environment access.
- Existing `calendar_connections` migration and Vercel Calendar API settings.

Validation:
- `pnpm run build`.
- `git diff --check`.
- Browser smoke for Calendar status, connect/reconnect/disconnect where environment allows.
- 390px mobile smoke for Home, Calendar, Search, Notifications, and Quick Add.

Estimated complexity: Medium. Most work is validation, documentation, and small integration cleanup.

### Release 1.7: Shared Platform Contracts

Must Have:
- Define module contribution contracts for Home widgets, Search results, Notification signals, Quick Add targets, and AI context builders.
- Refactor one low-risk surface to consume a registry/contract if it is clearly safer than current duplication.
- Document assignment, favorite, archive, and tag conventions.

Should Have:
- Add focused unit tests for registry builders or notification/search result construction.
- Add responsive smoke checklist automation plan.

Could Have:
- Extract repeated list row/card patterns from Life Lists and Shopping if scoped.

Deferred:
- Durable notification schema.
- Full task engine schema migration.
- Context Engine runtime.

Acceptance Criteria:
- Future modules have a documented way to contribute to app-level services.
- Existing behavior is preserved.

Estimated complexity: Medium.

### Release 1.8: Task And Notification Foundation Planning

Must Have:
- Produce a task engine schema/RLS migration plan, not an immediate migration.
- Map current `tasks` fields and local metadata to the platform task engine.
- Design durable notification preferences/read-state model.
- Define recurrence migration strategy.

Should Have:
- Identify migration validation matrix for owner/adult/viewer/non-member.
- Add acceptance criteria for cross-module task creation.

Could Have:
- Implement a small client-only task normalization helper if it reduces duplication without schema change.

Deferred:
- Full migration and notification delivery channels.
- Push/email/SMS.

Acceptance Criteria:
- Migration risks are explicit before any table changes.
- No broad schema migration is executed in planning scope.

Estimated complexity: Medium-large.

### Release 1.9: Home Platform Readiness

Must Have:
- Create Home platform product/module spec for assets, maintenance, warranties, vendors, and reminders.
- Decide how Pool equipment maps to future shared assets without breaking Pool.
- Define attachments/documents dependency boundaries.

Should Have:
- Prototype data model in docs only.
- Identify first Home workflow narrow enough for implementation.

Could Have:
- UI wireframe or non-code IA update.

Deferred:
- Home implementation.
- Smart-home integrations.

Acceptance Criteria:
- Home implementation can begin later without duplicating Pool or Tasks architecture.

Estimated complexity: Medium.

### Release 2.0: High-Level Direction

Release 2.0 should be considered only after the core operating loop, Calendar, shared platform contracts, and task/notification foundations are stable. Candidate themes: durable Context Engine, richer household permissions, first Home maintenance workflow, documents/attachments, and carefully scoped AI suggestions with human review.

## Context Engine Roadmap

Do not implement in Release 1.6.

Required interfaces:
- `buildModuleContext({ household, user, records, options })`
- `buildHouseholdContext({ household, people, memberships, settings })`
- `buildPrompt({ householdContext, moduleContexts, userRequest, safetyRules })`
- `reviewSuggestion({ suggestion, sourceRecords, targetAction })`

Shared services:
- Household context.
- Search/result registry.
- Notification/reminder signals.
- Task engine.
- Module summary/widget registry.
- Audit/timeline events.

Context builders:
- First: Pool, Tasks, Calendar, Home dashboard.
- Next: Shopping, Meal Planning, Life Lists.
- Later: Finance, College, Home assets, Documents.

Prompt generation:
- Separate known facts, stale data, missing data, recommendations, and proposed actions.
- Include source record IDs internally but expose user-friendly citations later.
- Keep server-only API keys in `api/brief.js` or future API routes.

User review:
- AI suggestions remain drafts.
- User confirms before creating tasks, reminders, calendar events, shopping items, or Pool actions.

Migration strategy:
1. Document context payload shape.
2. Add pure context-builder functions with tests.
3. Use builders for existing AI brief panels.
4. Add reviewable suggestion objects.
5. Add durable audit/timeline records only after schema review.

## Design System Gap Analysis

Priority improvements:
- Migrate legacy common `SwipeCard`, `Modal`, and dense inline styles to wrapper primitives during touched work.
- Bring College and Finance onto drawer/form/card/list primitives before promoting either module.
- Keep Pool improvements incremental; it is high value but large and riskier.
- Standardize empty, loading, error, and filtered-empty states across all modules.
- Add exact mobile overflow checks to validation for Home, Calendar, Quick Add, Search, Notifications, Tasks, Pool.
- Replace hard-coded color accents with semantic tokens where practical.
- Preserve 44px touch targets for compact buttons, icon buttons, drawer close controls, swipe fallbacks, and bottom navigation.

Known inconsistencies:
- Finance and College still use older inline card/modal/list patterns.
- Shared `components/common.js` still contains inline style-heavy patterns.
- Several modules define local toast, confirmation, row, and validation helpers.
- Search and notification result rows do not yet use a shared action/deep-link model.
- Table-like data is mostly rendered as custom cards; this is acceptable on mobile but needs consistency before Finance expands.

## Highest-Risk Areas

- Calendar OAuth deployment and legacy fallback removal.
- Full household-scoped RLS conversion for older module tables.
- Sensitive Finance/Financial Planning visibility and advice boundaries.
- Context Engine or AI suggestions mutating operational data before review/audit contracts exist.
- Broad Home platform work duplicating Pool, Tasks, assets, reminders, or future attachments.
- Large-module refactors without narrow validation.
- Environment and migration drift across local, preview, staging, and production.

## Recommended Release 1.6 Scope

Must Have:
- Calendar deployed OAuth validation and fallback removal decision.
- App-level integration contract for Calendar, Search, Notifications, Quick Add, and Home handoffs.
- Documentation updates to roadmap/status/changelog.
- Build and diff validation.

Should Have:
- Search/Notification deep-link design.
- Quick Add target registry plan.
- Environment drift checklist.

Could Have:
- Tiny module metadata registry if it eliminates duplicated labels/routes without behavior change.

Deferred:
- Home platform.
- Financial Planning.
- Context Engine runtime.
- New durable notification/task schema.
- Any new production data mutation.

Rationale: this scope improves product quality and architecture consistency where users already rely on FamilyOS every day. It also reduces risk before larger platform work.

## Release 1.6 Execution Update

Date: July 10, 2026

Completed in the Release 1.6 implementation pass:
- Added `docs/platform/08_integration_contracts.md` as the app-level handoff contract for Calendar, Search, Notifications, Quick Add, Home, and destination modules.
- Added best-effort navigation payloads from Home, Search, and Notifications into Tasks, Calendar, and Life Lists while keeping tab-state routing.
- Added Tasks Show All and Clear All filter behavior.
- Improved Calendar refresh/status clarity and server Calendar focus-return status refresh.
- Kept legacy browser Calendar fallback isolated and documented as retained until deployed server OAuth validation passes.

Still environment-dependent:
- Deployed Calendar OAuth connect, reconnect, disconnect, and event-refresh smoke validation.
- Legacy browser Calendar fallback removal decision after deployed OAuth validation.

Still deferred:
- Home Platform implementation.
- Financial Planning implementation.
- Context Engine runtime.
- Durable notification/task schema.
- URL routing or full item-level deep links.

## Final Recommendation

The single highest-value next implementation prompt for Release 1.6 is:

"Execute Release 1.6 Core Operating Loop Hardening: validate deployed Calendar OAuth end to end, decide and document legacy browser Calendar fallback removal readiness, and define the app-level contracts for Calendar, Search, Notifications, Quick Add, and Home handoffs without implementing Home, Financial Planning, or the Context Engine."
