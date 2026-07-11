# AGENTS.md

Concise guidance for agents working in this repository.

## Canonical Governance

`docs/governance/FamilyOS_Project_Instructions.md` is the canonical FamilyOS governance source. This file is the concise repository entry point. Use specialized documents for current implementation detail and historical records.

Before work, inspect the repository, branch, working tree, and affected dependencies. Read the canonical instructions and relevant product, architecture, integration-contract, release, status, roadmap, and module documentation. Keep current implementation distinct from approved long-term direction.

Use `.agents/skills/familyos-end-to-end/SKILL.md` for FamilyOS implementation, release, documentation, architecture, navigation, module, bug-fix, testing, and repository-maintenance work.

## Project Overview

FamilyOS is a mobile-first household operations app. It is currently a Create React App frontend with a Vercel serverless API route and Supabase REST persistence.

Key paths:

- `src/App.js` is the compatibility entry point.
- `src/app/App.js` contains the app shell and tab composition.
- `src/modules/dashboard/` contains the Home dashboard tab.
- `src/modules/tasks/` contains the Tasks tab.
- `src/modules/settings/` contains Settings, profile, household, and integration controls.
- `src/components/ui/` contains shared UI primitives.
- `src/theme.js` contains shared colors, style objects, and icons.
- `src/data/seed.js` contains fallback seed data used when Supabase data is unavailable.
- `src/styles.css` contains the app styling.
- `api/brief.js` is a Vercel serverless function that proxies Anthropic API requests.
- `supabase/schema.sql` defines the Supabase database schema.
- `public/` contains static CRA assets and app icons.

## Local Commands

Use `pnpm` for package management. Do not introduce npm or yarn lockfiles.

- Install dependencies: `pnpm install`
- Start local dev server: `pnpm start`
- Production build: `pnpm run build`

There is no dedicated test script in `package.json` yet. For most code changes, run `pnpm run build` before handing off.

## Environment

Copy `.env.example` to `.env.local` for local development and fill in project-specific values:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_GOOGLE_CLIENT_ID`
- `REACT_APP_GOOGLE_CALENDAR_ID`
- `ANTHROPIC_API_KEY`

Browser-visible `REACT_APP_*` values are expected in this CRA app. Keep server-only secrets, especially `ANTHROPIC_API_KEY`, out of frontend code and use `api/brief.js` for server-side proxying.

## Coding Conventions

- Match the existing plain JavaScript and React Hooks style.
- Keep changes focused; avoid broad refactors unless they are required for the requested behavior.
- Preserve the mobile-first UX and responsive layout.
- Prefer small, local helper functions over new abstractions unless duplication or complexity justifies them.
- When touching Supabase-backed data, keep table and column names aligned with `supabase/schema.sql`.
- Do not commit generated build output from `build/` unless the user explicitly asks for it.

## Frontend Notes

- The app currently uses direct `fetch` calls and a small custom Supabase REST helper instead of `@supabase/supabase-js`.
- Google Calendar auth uses the Google Identity Services script loaded at runtime.
- Seed data in `src/App.js` supports empty or not-yet-configured Supabase states; update it deliberately when changing default app behavior.

## Verification Checklist

Before finishing a change:

1. Run `pnpm run build` for frontend or shared changes.
2. For API-only changes, also review `api/brief.js` behavior manually because there is no local API test harness yet.
3. If schema changes are made, update `supabase/schema.sql` and call out any migration/setup steps.
4. Check that no secrets or user-specific credentials were added to tracked files.

## Git Hygiene

- The worktree may contain user changes. Do not revert unrelated files.
- Keep generated dependency folders such as `node_modules/` untouched.
- Prefer concise commits that describe the user-visible or developer-visible behavior changed.
- GitHub remains the repository source of truth.
- Review `git status`, `git diff`, and `git diff --check` before completion.
- Do not commit, push, merge, tag, migrate a database, release, or deploy without explicit product-owner approval.
- Pause before destructive actions, data deletion, major dependency upgrades, security-sensitive changes, authentication or authorization changes, secrets or environment changes, or actions that could cause data loss or service interruption.
- Do not pause for routine inspection, local file changes, refactoring, documentation, tests, linting, builds, Git inspection, or non-destructive validation within scope.

## Family OS v1 Operating Manual

Family OS is an AI-first personal family management platform.

### Source of Truth

Before making code, database, UI, or architecture changes, read:

- `docs/00_MASTER_INDEX.md`
- `docs/ai/AI_CONTEXT.md`
- `docs/product/PRODUCT_VISION.md`
- `docs/product/INFORMATION_ARCHITECTURE.md`
- `docs/product/NAVIGATION.md`
- `docs/process/ENGINEERING_INDEX.md`
- `docs/process/FAMILY_OS_PRINCIPLES.md`
- `docs/process/RELEASE_PLAYBOOK.md`
- `docs/process/FEATURE_PLAYBOOK.md`
- `docs/process/PRODUCTION_READINESS.md`
- `docs/process/CODING_STANDARDS.md`
- `docs/process/ARCHITECTURE_GUIDELINES.md`
- `docs/process/UI_GUIDELINES.md`
- `docs/process/TESTING_GUIDELINES.md`
- `docs/process/DOCUMENTATION_GUIDELINES.md`
- `docs/process/SECURITY_STANDARDS.md`
- `docs/process/ENVIRONMENTS.md`
- `docs/planning/CURRENT_SPRINT.md`
- `docs/planning/ROADMAP.md`
- `docs/database/DATABASE_SCHEMA.md`
- `docs/ui/DESIGN_SYSTEM.md`

### Core Rules

- Do not remove existing functionality unless explicitly instructed.
- Do not duplicate logic or components.
- Do not duplicate guidance; extend existing documentation when possible.
- Reuse existing patterns before creating new ones.
- Keep the application mobile-first and responsive.
- Keep code simple, maintainable, and production-ready.
- Use Supabase migrations for database changes.
- Preserve security and Row Level Security assumptions.
- Update documentation after meaningful changes.
- Follow the process playbooks for release, feature, validation, security, documentation, git, and review work.
- Complete full milestones/workstreams when asked; do not stop after implementation if validation, documentation, cleanup, and commit are still required.
- Complete each release or major feature in one comprehensive implementation pass whenever practical, including code, configuration, tests, validation, and documentation.
- Apply testing and validation proportional to risk.
- Do not make unrelated changes.
- Leave the repository releasable: branch clean, validation run or blocker documented, docs current, and risks explicit.

### Required Updates After Work

After completing implementation, update:

- `docs/releases/CHANGELOG.md`
- `docs/planning/CURRENT_SPRINT.md`
- `docs/planning/PROJECT_STATUS.md`
- `docs/architecture/ARCHITECTURE_DECISIONS.md` when a major decision is made
- Any relevant process, database, RLS, UI, roadmap, or release docs listed in `docs/process/DOCUMENTATION_GUIDELINES.md`

### Completion Summary

Every implementation response should include:

1. Files changed
2. What was added or fixed
3. Database changes, if any
4. Risks or follow-up items
5. Suggested next step
