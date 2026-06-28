# Pre-Implementation Git Cleanup

Review date: 2026-06-28

## Current Branch Status

Current branch: `main`

Remote tracking: `origin/main`

Ahead/behind: `0 ahead, 0 behind`

Current status:

```text
## main...origin/main
 M docs/planning/CURRENT_SPRINT.md
 M docs/releases/CHANGELOG.md
 M docs/ui/UI_MIGRATION_BACKLOG.md
 M src/app/App.js
?? docs/implementation/household-migration-plan-2026-06-27/12_PRE_IMPLEMENTATION_GIT_CLEANUP.md
```

There are no staged files.

## Uncommitted Files

| File | Status | Appears Related To | Recommended Action | Notes |
| --- | --- | --- | --- | --- |
| `docs/planning/CURRENT_SPRINT.md` | Modified, unstaged | Prior UI migration documentation, not household migration | Commit with the UI work if intentional, otherwise stash | Notes that app shell/navigation was migrated and identifies AI brief panel pattern as the next UI target. |
| `docs/releases/CHANGELOG.md` | Modified, unstaged | Prior UI migration documentation, not household migration | Commit with the UI work if intentional, otherwise stash | Adds an Unreleased changelog line for app header, bottom navigation, and global loading migration. |
| `docs/ui/UI_MIGRATION_BACKLOG.md` | Modified, unstaged | Prior UI migration documentation, not household migration | Commit with the UI work if intentional, otherwise stash | Marks App shell migration complete and changes the suggested next UI target. |
| `src/app/App.js` | Modified, unstaged | Prior UI migration work, not household migration | Review manually, then commit separately or stash | Replaces app header, bottom navigation, and global loading UI with shared UI primitives. This is intentional-looking but unrelated to household foundation migration. |
| `docs/implementation/household-migration-plan-2026-06-27/12_PRE_IMPLEMENTATION_GIT_CLEANUP.md` | Untracked | Household migration preparation | Commit | This cleanup note is the only file that should be committed for this task. |

## Uncommitted UI Change Summary

The unstaged changes appear to continue the UI migration:

- Removes `Loading` import from `src/components/common`.
- Adds `Skeleton` import from `src/components/ui/skeleton`.
- Converts `AppHeader` from inline style object layout to shared button/status UI and utility classes.
- Converts `BottomNavigation` to shared utility-class shell styling.
- Adds `GlobalLoading` using `Card`, `CardContent`, and `Skeleton`.
- Replaces the old auth-loading wrapper with `GlobalLoading`.
- Updates sprint, changelog, and UI backlog docs to mark app shell/navigation migration complete.

This is not database work and should not be included in the household foundation branch unless explicitly accepted as part of a separate UI commit first.

## Recent Commit State

Last 8 commits:

```text
df8b288 ui
52f5ed5 ui
42aaf20 Validate revised household migration draft
a5baa80 ui
9e46e04 Revise draft household schema migration
ea71cf2 Validate draft household schema migration
a66ccc9 multiple
19f5976 Add draft household schema migration
```

Current `HEAD` is `df8b288` and matches `origin/main`.

## Architecture / Audit / Migration Planning Commits Present

Confirmed present in history:

- `affeefa Add repository audit documentation`
- `049b210 Add household architecture review`
- `a142f3b Add household architecture decision records`
- `c39de02 Resolve household architecture decisions`
- `07ab0be Add household migration implementation plan`
- `19f5976 Add draft household schema migration`
- `ea71cf2 Validate draft household schema migration`
- `9e46e04 Revise draft household schema migration`
- `42aaf20 Validate revised household migration draft`
- `e5cc397 Refactor application structure for modular architecture`

The household planning chain is present locally and on `origin/main` as of this review.

## Related Vs Unrelated Assessment

Related to household foundation implementation:

- `12_PRE_IMPLEMENTATION_GIT_CLEANUP.md`

Unrelated to household foundation implementation:

- `docs/planning/CURRENT_SPRINT.md`
- `docs/releases/CHANGELOG.md`
- `docs/ui/UI_MIGRATION_BACKLOG.md`
- `src/app/App.js`

The app-shell change set may be valid planned UI work, but it is unrelated to the migration foundation and should be handled before branching for household implementation.

## Risks Of Starting Migration With Current Worktree

Risk level: **medium** until the UI migration change set is resolved.

Risks:

- A migration branch created now would carry unrelated UI work unless the branch is created after cleanup.
- App-shell UI changes could complicate build failures during migration validation.
- If the household branch includes UI changes, reviewing database/auth behavior becomes harder.
- Stashing or committing the UI work later from the wrong branch could blur ownership of the migration implementation.

## Recommended Exact Next Steps

1. Decide what to do with the UI migration change set:

   ```text
   Recommended: review manually, then commit separately if intentional.
   Alternative: stash if experimental.
   Avoid: carrying it into feature/household-foundation by accident.
   ```

2. Commit this cleanup note only:

   ```powershell
   git add docs/implementation/household-migration-plan-2026-06-27/12_PRE_IMPLEMENTATION_GIT_CLEANUP.md
   git commit -m "Add pre-implementation git cleanup note"
   ```

3. After the UI change is either committed separately or stashed, verify:

   ```powershell
   git status -sb
   git rev-list --left-right --count origin/main...HEAD
   ```

4. Once the worktree is clean, preserve a rollback point:

   ```powershell
   git tag household-foundation-prep-2026-06-28
   git push origin household-foundation-prep-2026-06-28
   ```

5. Create the household implementation branch:

   ```powershell
   git checkout -b feature/household-foundation
   ```

6. Begin local-only migration preparation. Do not apply migrations yet.

Suggested next prompt after cleanup:

```text
Family OS next step: resolve the remaining UI worktree change before household migration branching.

Do not apply migrations.
Do not run Supabase commands.
Do not modify database schema.

Inspect the current UI migration change set and recommend whether to commit, stash, or discard it.
Do not take action until explicitly instructed.
```

## Decision

Do not create `feature/household-foundation` yet. Resolve or isolate the UI migration change set first, then tag the clean state and branch.
