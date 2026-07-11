# Coding Standards

This document is the active coding standard for future Codex work. The older development baseline is archived under `docs/archive/development-baseline/`.

It provides specialized coding detail under `docs/governance/FamilyOS_Project_Instructions.md`.

## Naming
- Use descriptive names tied to domain behavior, not implementation accidents.
- Keep Supabase table, column, RPC, and policy names aligned with database docs.
- Use role names consistently: `owner`, `adult`, `teen`, `child`, `viewer`.

## Structure
- App shell and navigation belong in `src/app`.
- User-facing modules belong in `src/modules/<module>`.
- Shared UI primitives belong in `src/components/ui`.
- Shared hooks belong in `src/hooks`.
- Shared context belongs in `src/context`.
- Supabase clients and low-level helpers belong in `src/lib` or `src/services`.

## Hooks And Context
- Hooks should isolate reusable behavior, not hide unrelated side effects.
- Context should represent real app-wide state such as auth, active household, or shared connection status.
- Avoid broad context expansion for one screen.

## Components
- Prefer functional React components and existing primitives.
- Keep business logic out of low-level UI primitives.
- Use small local helpers when they reduce repetition.

## Database And SQL
- Use migrations for schema changes.
- Prefer structured SQL and explicit constraints over app-only validation.
- Security-definer RPCs must set a narrow `search_path`.
- RLS changes require validation for owner, adult, viewer/non-owner, and non-member cases when relevant.

## Error Handling
- Show user-safe messages in UI.
- Preserve technical details for logs or developer summaries when useful.
- Do not expose secrets, tokens, raw provider errors, or internal IDs unless the UI explicitly requires them.

## Logging
- Do not leave debug logging in committed frontend code.
- Server logs must not print credentials, OAuth tokens, invite tokens, session data, or private household records.

## Cleanup
- Remove unused imports, dead code, temporary scripts, debug UI, and generated artifacts.
- Do not commit `build/`, dependency folders, local env files, or validation-only data dumps.

## Dead Code Policy
- Delete dead code when it is clearly obsolete and within scope.
- Do not remove fallback behavior, migration compatibility, or legacy paths unless the release explicitly includes that removal.

## Import Policy
- Reuse existing aliases and local import style.
- Avoid adding dependencies unless the release spec justifies them.
- Do not introduce npm or yarn lockfiles; use `pnpm`.

## Comment Policy
- Comment why a non-obvious decision exists.
- Do not comment obvious assignments or JSX structure.

## Refactor Guidance
- Refactor only when it directly supports the requested work, reduces validated duplication, or removes real risk.
- Avoid broad rewrites during validation or release-closeout work.
