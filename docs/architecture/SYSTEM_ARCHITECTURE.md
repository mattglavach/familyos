# System Architecture

> Canonical FamilyOS governance and module ownership are defined in `docs/governance/FamilyOS_Project_Instructions.md`. This document provides specialized current-system architecture detail.

## Current Target Stack
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Vercel
- GitHub

## Architecture Pattern
Family OS should use a modular feature architecture.

Each module should have:
- Page or route
- Reusable components
- Supabase queries
- Validation
- Documentation
- Future AI hooks where useful

## Core Layers
- Product handbook layer
- Process and documentation layer
- UI layer
- Feature/module layer
- Data access layer
- Supabase database
- Authentication and security
- Deployment pipeline

## Release 3.1 Relationship OS

`src/modules/relationships/` owns relationship presentation and deterministic domain logic. `relationships`, `relationship_goals`, and `relationship_activities` are household-scoped Supabase records accessed through the established `useTable` layer. Dashboard, Global Search, and Household Timeline consume summaries and navigation handoffs while the Relationships module remains the source of truth. Health computation is pure application logic with explicit priority thresholds and no AI provider dependency.

## Key Architectural Principles
- Keep modules independent where possible.
- Share common components.
- Avoid global state unless needed.
- Prefer explicit data flows.
- Design for future mobile use.

## Engineering Process Layer
`docs/process/` is the permanent engineering framework for releases, features, coding standards, architecture guidance, UI guidance, testing, documentation, git workflow, review, release checklists, and reusable prompts. Future architecture work should start from the process playbooks and then update this architecture documentation when durable decisions change.

Material architecture decisions should use `docs/architecture/decisions/ADR_TEMPLATE.md`. Lightweight decisions can be recorded in `docs/planning/DECISION_LOG.md`.

## Product Handbook Layer
`docs/product/` is the permanent product handbook for Family OS. It defines what Family OS is, why it exists, how it should feel, the product information architecture, navigation model, dashboard strategy, module intent, personas, workflows, feature philosophy, and product roadmap.

Architecture and implementation work should align with the product handbook and then use `docs/process/` for how the work is built and validated.

## Release 1.0 Architecture Direction
Release 1.0 should stabilize the existing core household operating loop instead of expanding the product surface. The implementation should build on the current modular app shell, active household context, dashboard, tasks, settings, household collaboration, and server-side calendar foundation.

Release 1.0 architecture improvements should be limited to changes required for dashboard, tasks, navigation, settings, household management, responsive UX, validation, and security readiness. Broad module expansion, full household-scoped RLS conversion, ownership transfer, public sign-up, AI assistant work, Home Assistant, smart home, and major new integrations are deferred.

The authoritative Release 1.0 blueprint is `docs/planning/RELEASE_1_0_SPEC.md`.

## Release 1.0 Implementation Notes
Release 1.0 adds app-shell-level `Calendar`, `More`, `GlobalSearch`, and `NotificationCenter` modules without changing the database schema. Universal Search and in-app Notifications are computed from existing task, calendar, household, and navigation data. Notification read/unread state is stored locally in the browser and is not a push/email/SMS delivery system.

## Release 1.0.2 Reliability Notes
Optional integrations should not create product-wide outages. Supabase browser configuration is required for authenticated app use, but Google Calendar, AI briefs, and other integrations must fail into clear setup guidance when their environment variables, OAuth settings, migrations, or schema cache are not ready.

User-facing surfaces should not expose SQL, PostgREST, Supabase internals, OAuth secret names, or server environment variable names. Detailed environment requirements live in `docs/process/ENVIRONMENTS.md` and integration-specific setup docs such as `docs/setup/google-calendar-oauth.md`.

## Release 1.0.3 Design System Notes
Release 1.0.3 establishes the permanent UI wrapper layer under `src/components/ui`. Feature modules should consume Family OS wrappers instead of importing third-party primitives directly. This keeps tokens, accessibility defaults, mobile-first behavior, and future shadcn/ui migration work centralized.

The existing stack is compatible with the shadcn/ui model: Tailwind CSS variables, Lucide icons, local utility helpers, and `components.json` are present. Release 1.0.3 adopts the model through local JavaScript wrappers instead of forcing broad dependency or TypeScript conversion work.

Origin UI-style drawers remain the composed interaction pattern for mobile create/edit surfaces. Command-style search, forms, badges, cards, alerts, toasts, tables, tabs, overlays, and selection controls should be added or evolved in the wrapper layer first, then consumed by modules.
