# Code Review Checklist

Use this checklist for ChatGPT review, Codex self-review, and pull request review.

## Scope
- Does the change match the release or feature spec?
- Is unrelated work excluded?
- Are deferred items documented?

## Architecture
- Are module boundaries respected?
- Is shared logic placed in the right layer?
- Are new abstractions justified?
- Are existing patterns reused?

## Data And Security
- Are migrations ordered and validated?
- Are RLS policies correct for every affected role?
- Are RPCs validating ownership, role, status, and token inputs?
- Are secrets, tokens, and private data protected?
- Is production data untouched unless explicitly approved?

## UI
- Are loading, error, empty, and success states present?
- Are unauthorized controls hidden or read-only as appropriate?
- Does backend authorization still enforce the rule?
- Is the layout mobile-first and responsive?
- Are labels, focus states, and accessible names present?

## Code Quality
- Are imports used?
- Is dead/debug code removed?
- Is error handling user-safe?
- Is duplication reasonable?
- Are comments useful and sparse?

## Testing
- Did lint/build/diff-check run?
- Were migrations and RLS validated when relevant?
- Were browser smoke tests run for UI workflows?
- Are validation gaps documented?

## Documentation
- Are changelog, release notes, status, roadmap, architecture, database, RLS, and process docs updated as needed?

## Release Readiness
- Is the branch clean?
- Are commits logical?
- Is the final recommendation supported by evidence?
