# Release 3.4.0: Intelligent Recommendation Engine

FamilyOS recommendations now use a deterministic adaptive intelligence layer. Priority remains an explicit business label while a separate 0-100 confidence score controls ordering. Each expanded recommendation explains why now, why this priority, why the signed-in household member, and why it ranked above alternatives.

The engine combines related work, resolves prerequisites, estimates daily workload, limits low-value work on heavy days, increases cooldowns after repeated dismissal or non-action, and immediately bypasses cooldown when the trigger signature materially changes. Household-local lifecycle events support completion, dismissal, snooze, timing, helpfulness, and factual trend metrics without third-party analytics or autonomous schedule changes.

The additive migration creates RLS-protected feedback, effectiveness, learning, and dependency tables. Existing data is not modified or backfilled. Owners and adults may write; authenticated household members retain scoped access; anonymous/public access is denied.

Rollback: revert the application first. The additive tables may remain safely. Remove them only through a separately reviewed forward migration after history-retention review.
