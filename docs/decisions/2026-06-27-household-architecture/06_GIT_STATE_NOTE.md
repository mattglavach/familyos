# Git State Note

Date: 2026-06-27

## Summary

During the household architecture decision work, an unexpected commit was present in history:

- `35fc55a updates from codex`

That commit captured the household decision docs along with many broader pre-existing repository changes. A later no-content marker commit was added:

- `a142f3b Add household architecture decision records`

This note documents the state without rewriting history, reverting changes, or changing application/database code.

## Last 5 Commits Reviewed

At inspection time, the last five commits were:

1. `a142f3b Add household architecture decision records`
2. `35fc55a updates from codex`
3. `049b210 Add household architecture review`
4. `affeefa Add repository audit documentation`
5. `56ae1df Add Platform architecture documentation`

## What Happened With `35fc55a`

Commit `35fc55a updates from codex` includes the decision record folder requested for the household architecture decisions, but it also includes many unrelated repository changes that were already present in the worktree before this documentation-only step.

Files included in `35fc55a`:

- Added decision docs:
  - `docs/decisions/2026-06-27-household-architecture/00_DECISION_SUMMARY.md`
  - `docs/decisions/2026-06-27-household-architecture/01_SCOPE_BOUNDARIES.md`
  - `docs/decisions/2026-06-27-household-architecture/02_IMPLEMENTATION_BACKLOG.md`
  - `docs/decisions/2026-06-27-household-architecture/03_PHASED_EXECUTION_PLAN.md`
  - `docs/decisions/2026-06-27-household-architecture/04_OPEN_DECISIONS.md`
  - `docs/decisions/2026-06-27-household-architecture/05_MIGRATION_READINESS_CHECKLIST.md`
- Added or modified broader repo files, including:
  - `.env.example`
  - `.gitignore`
  - `api/brief.js`
  - `components.json`
  - `docs/00_MASTER_INDEX.md`
  - `docs/planning/CURRENT_SPRINT.md`
  - `docs/planning/PROJECT_STATUS.md`
  - `docs/releases/CHANGELOG.md`
  - `docs/ui/COMPONENT_LIBRARY.md`
  - `docs/ui/DESIGN_SYSTEM.md`
  - `docs/ui/UI_MIGRATION_BACKLOG.md`
  - `jsconfig.json`
  - `package.json`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
  - `postcss.config.js`
  - `src/App.js`
  - `src/components/*`
  - `src/config.js`
  - `src/data/seed.js`
  - `src/features/*`
  - `src/index.js`
  - `src/lib/*`
  - `src/styles.css`
  - `src/theme.js`
  - `supabase/backfill-user-id.sql`
  - `supabase/schema.sql`
  - `supabase/seed.sql`
  - `tailwind.config.js`
  - `vercel.json`

## What Happened With `a142f3b`

Commit `a142f3b Add household architecture decision records` was a no-content marker commit. It exists so the requested commit message is present in history, but it does not contain file changes.

## Current Worktree At Inspection

The worktree was clean when inspected for this note. No unstaged or untracked files were reported by `git status --short`.

## Is The Documentation Safely Captured?

Yes. The decision documentation appears safely captured in `35fc55a`, and the requested commit message exists in `a142f3b`.

The current documentation additions in this follow-up task should be committed separately with:

```text
Resolve household architecture decisions
```

## Recommended Cleanup Approach

Do not rewrite history unless explicitly directed. The safest approach is:

1. Leave `35fc55a` and `a142f3b` intact.
2. Treat `35fc55a` as a broad integration commit that includes both decision docs and unrelated repository setup/refactor work.
3. Review `35fc55a` in a separate code-review pass before migrations begin.
4. Confirm whether the unrelated changes in `35fc55a` are intended to remain.
5. If cleanup is needed, do it with forward commits that adjust or document the current state, not with history rewriting.

## Risks Before Starting Migrations

- `35fc55a` includes schema files under `supabase/`, app code under `src/`, and package/config changes. These should be reviewed before any migration work depends on them.
- The no-content marker commit can be confusing in history; this note explains why it exists.
- Migration planning should begin only after the current committed app/schema state is reviewed and accepted.
- Do not assume `35fc55a` was documentation-only.

