# Architecture Guidelines

This document defines the durable architecture guardrails for Family OS. It complements `docs/architecture/SYSTEM_ARCHITECTURE.md`, `docs/architecture/FOLDER_STRUCTURE.md`, and database documentation.

## Supabase
- Supabase is the durable system of record for household data.
- Browser-visible Supabase anon keys are acceptable only with correct RLS.
- Server-only secrets and long-lived provider tokens must stay in API routes or server-side storage.

## RLS
- RLS must be enabled for app tables.
- User-owned compatibility policies may remain during staged migrations.
- Household-scoped policies should be introduced only with validated `household_id` backfill and active-household app behavior.
- Every RLS change needs role and non-member validation.

## Households
- The active household is the runtime boundary for shared data.
- `user_preferences.default_household_id` stores a user's preferred active household.
- Membership status controls selectable household access.
- Owner-only membership management is the default until a release explicitly changes the model.

## Authentication
- Family OS is a private household app.
- Email/password Supabase auth is the primary login path.
- Magic links are fallback only.
- Public sign-up remains disabled until explicitly planned and reviewed.

## Authorization
- UI permissions must mirror backend authorization.
- Hiding controls is not sufficient; RLS or RPC checks must enforce the rule.
- Authorization should be tested across owner, adult, viewer, invited user, and non-member cases when relevant.

## RPC Philosophy
- Use RPCs for multi-step operations that need database-enforced invariants.
- Use security-definer RPCs carefully with explicit validation and narrow `search_path`.
- Do not trust frontend state for ownership, role, token status, or cross-household checks.

## Module Boundaries
- Modules should own their screen-level workflow and module-specific helpers.
- Shared concerns such as auth, household context, UI primitives, and Supabase clients stay outside modules.
- Do not let one module introduce hidden behavior changes in another module.

## Migration Strategy
- Migrations must be ordered, repeatable where intended, and validated against disposable/local/staging databases.
- Production database changes require target verification, backup/rollback plan, validation SQL, and explicit approval.
- Baseline-alignment migrations are allowed when production differs from repository assumptions.

## State Management
- Prefer local component state for local UI.
- Use hooks for reusable side effects.
- Use context for auth, active household, and app-wide shared state only.

## Folder Organization
- Follow `docs/architecture/FOLDER_STRUCTURE.md`.
- Follow `docs/process/PROJECT_STRUCTURE.md` for current repository responsibilities.
- Add new folders only when the existing structure cannot express the feature cleanly.

## Integration Philosophy
- Prefer small, validated integration steps.
- Keep Google, Supabase, AI, and future Home Assistant integrations behind clear boundaries.
- Do not expose third-party token material to frontend code.

## Decisions
- Use `docs/architecture/decisions/ADR_TEMPLATE.md` for material architecture decisions.
- Use `docs/planning/DECISION_LOG.md` for lightweight durable decisions.
