# Shadcn And Vite Migration Assessment

Date: June 30, 2026

Branch: `feature/household-foundation`

## Scope

This is an assessment-only document. It does not modify application code, install packages, migrate to Vite, change Supabase, change AI prompts, or change application behavior.

## Current UI Stack

Family OS is currently a Create React App frontend using:

- React 18
- `react-scripts` 5.0.1
- Tailwind CSS 3.4.19
- PostCSS and Autoprefixer
- shadcn-style local primitives in `src/components/ui/`
- Origin UI-style local drawer in `src/components/origin/drawer.jsx`
- Lucide icons
- Recharts
- Supabase client SDK and REST-style app helpers
- Vercel serverless API route at `api/brief.js`

The active scripts are:

```json
{
  "start": "react-scripts start",
  "build": "react-scripts build",
  "lint": "eslint src --ext .js,.jsx",
  "check": "pnpm run lint && pnpm run build"
}
```

There is no `vite.config.*` file and no root `index.html`. The browser entry HTML is still `public/index.html`, using CRA placeholders such as `%PUBLIC_URL%`.

## Shadcn Status

Status: partially added / shadcn-style foundation present.

Evidence:

- `components.json` exists and points to:
  - Tailwind config: `tailwind.config.js`
  - CSS file: `src/styles.css`
  - UI alias: `@/components/ui`
  - utils alias: `@/lib/utils`
- `src/lib/utils.js` provides the standard `cn(...inputs)` helper using `clsx` and `tailwind-merge`.
- `package.json` includes shadcn-compatible dependencies:
  - `class-variance-authority`
  - `clsx`
  - `tailwind-merge`
  - `lucide-react`
  - `@radix-ui/react-slot`
- `src/components/ui/button.jsx` and `src/components/ui/badge.jsx` use CVA patterns.
- Local primitives exist for Button, Badge, Card, Input, Label, Select, Skeleton, Textarea, form helpers, segmented controls, empty states, section headers, loading wrappers, chart wrapper, dashboard widgets, and card variants.

Limitations:

- The project does not appear to be using `@/...` aliases in source imports yet. Source code uses relative imports such as `../../components/ui/button`.
- `components.json` aliases are configured, but CRA does not natively honor those aliases without extra configuration.
- Only a subset of Radix primitives is installed. For example, there is no Radix Dialog package currently installed.
- The local components are shadcn-style, not a complete or fully CLI-managed shadcn/ui install.

Conclusion: Family OS should treat the current `src/components/ui/` layer as a local shadcn-style design system. It is compatible with future shadcn adoption, but not equivalent to a full shadcn CLI-managed component set.

References:

- shadcn/ui `components.json`: https://ui.shadcn.com/docs/components-json
- Vite env variables and modes: https://vite.dev/guide/env-and-mode

## Origin UI Compatibility

Status: compatible and already started.

Evidence:

- `src/components/origin/drawer.jsx` exists.
- Shared `Modal` in `src/components/common.js` delegates to `OriginDrawer`.
- QuickAdd and migrated modal surfaces already align with bottom-drawer interaction patterns.

Recommendation:

- Continue copying/adapting Origin UI-style composed patterns locally.
- Keep Origin patterns separate from low-level primitives:
  - `src/components/ui/` for primitive and module-agnostic presentation.
  - `src/components/origin/` for adapted composed interaction patterns.
- Do not add a broad Origin dependency layer unless a pattern clearly needs it.

## CRA Limitations

CRA is still functional for the current app, but it is the weakest part of the frontend foundation.

Observed limitations:

- `react-scripts` controls build tooling and limits modern bundler configuration.
- Path aliases in `components.json` are aspirational under CRA unless additional configuration is added.
- CRA env variables require the `REACT_APP_` prefix.
- `public/index.html` uses CRA-specific `%PUBLIC_URL%` placeholders.
- The build emits the recurring Node/CRA `fs.F_OK` deprecation warning.
- Long-term ecosystem energy has shifted away from CRA, while Vite is the more common modern React baseline.

Current CRA benefits:

- The app builds and checks successfully.
- Vercel deployment behavior is already documented.
- Existing environment variables and Google OAuth origins are known.
- Existing app code uses `process.env.REACT_APP_*` in one central config file.

## Vite Migration Evaluation

Recommendation: migrate to Vite before continuing deeper module UI migration, but do it as a dedicated infrastructure sprint.

### Difficulty

Medium.

The app is plain React/JavaScript, already uses Tailwind, and has a centralized `src/config.js` for browser-visible env values. That makes the migration manageable. The highest-risk areas are deployment parity, CRA HTML placeholder replacement, environment variable renaming, and preserving Vercel API routing.

### Estimated Effort

One focused sprint.

Expected implementation work:

- Add Vite and React plugin dependencies.
- Replace `react-scripts` scripts with Vite scripts.
- Add `vite.config.js`.
- Move CRA HTML entry from `public/index.html` to root `index.html`.
- Replace `%PUBLIC_URL%` asset references with Vite-compatible `/...` paths.
- Add `<script type="module" src="/src/index.js"></script>`.
- Update browser env reads in `src/config.js`.
- Update `.env.example`, README, deployment docs, Google Calendar docs, and local setup docs.
- Validate Vercel build output and route rewrites.

### Files Likely Affected

- `package.json`
- `pnpm-lock.yaml`
- `vite.config.js`
- `index.html`
- `public/index.html`
- `src/config.js`
- `.env.example`
- `README.md`
- `docs/architecture/DEPLOYMENT.md`
- `docs/setup/google-calendar-oauth.md`
- `docs/planning/CURRENT_SPRINT.md`
- `docs/planning/PROJECT_STATUS.md`
- `docs/releases/CHANGELOG.md`
- Possibly `components.json` if alias behavior is enabled with Vite.

### Env Variable Changes

CRA browser variables:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_APPROVED_HOUSEHOLD_EMAILS`
- `REACT_APP_GOOGLE_CLIENT_ID`
- `REACT_APP_GOOGLE_CALENDAR_ID`

Vite browser variables should become:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APPROVED_HOUSEHOLD_EMAILS`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CALENDAR_ID`

Code change:

- Replace `process.env.REACT_APP_*` with `import.meta.env.VITE_*` in `src/config.js`.
- Keep `ANTHROPIC_API_KEY` and `ALLOWED_ORIGINS` server-only in Vercel. They should not become `VITE_*`.

Transition option:

- During migration, `src/config.js` can temporarily read both Vite and legacy CRA names to reduce local setup risk.
- After Vite is validated, docs should make `VITE_*` the authoritative browser-visible variables.

### Build Script Changes

Current:

```json
{
  "start": "react-scripts start",
  "build": "react-scripts build"
}
```

Expected:

```json
{
  "start": "vite --host 0.0.0.0",
  "dev": "vite --host 0.0.0.0",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint src --ext .js,.jsx",
  "check": "pnpm run lint && pnpm run build"
}
```

### Testing And Check Impact

- `pnpm run check` can remain the main local validation command.
- CRA-specific lint integration disappears; lint remains explicit through `eslint`.
- Build output changes from CRA `build/` to Vite default `dist/` unless configured otherwise.
- If Vercel expects `build/`, either configure Vite `build.outDir = "build"` or update Vercel output settings and docs.

Recommendation: configure Vite to output `build/` initially to reduce deployment and gitignore churn.

### Local Supabase Env Impact

- Local Supabase URL and anon key values do not change.
- Only the browser-visible variable names change from `REACT_APP_*` to `VITE_*`.
- `.env.local` must be updated or `src/config.js` must temporarily support both names.
- Supabase Auth redirect URLs still depend on runtime origin, not a frontend env variable.

### Google Calendar Env Impact

- Google OAuth client ID and calendar ID values do not change.
- Variable names change to `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CALENDAR_ID`.
- Google Cloud authorized JavaScript origins may need `http://localhost:5173` if Vite uses the default dev port.
- To minimize OAuth reconfiguration, set Vite dev server port to `3000` in `vite.config.js`.

Recommendation: keep local dev on port `3000` during migration.

### Deployment Impact

- Vercel should continue hosting the static React app plus `api/brief.js`.
- `vercel.json` rewrite behavior must be revalidated.
- Vercel environment variables must be renamed for browser-visible values.
- Server-only variables remain unchanged:
  - `ANTHROPIC_API_KEY`
  - `ALLOWED_ORIGINS`
- If Vite outputs `build/`, existing deployment assumptions are easier to preserve.

### Rollback Plan

Before migration:

- Commit this assessment.
- Start the Vite migration from a clean branch state.

Rollback steps:

- Revert the Vite migration commit.
- Restore CRA scripts, `public/index.html`, `process.env.REACT_APP_*` reads, and CRA env docs.
- Keep database and Supabase untouched.
- Confirm rollback with `pnpm install`, `pnpm run build`, and `pnpm run check`.

## Naming And Conflict Considerations

`src/components/ui/` is already occupied by local shadcn-style primitives plus Family OS-specific shared UI wrappers.

This is not a blocker, but it needs discipline:

- Base primitives should keep shadcn-compatible names and patterns:
  - `button.jsx`
  - `badge.jsx`
  - `card.jsx`
  - `input.jsx`
  - `label.jsx`
  - `skeleton.jsx`
- Family OS composed wrappers should remain clearly product-specific:
  - `cards.jsx`
  - `layout.jsx`
  - `dashboard-widget.jsx`
  - `status.jsx`
  - `loading.jsx`
- If the shadcn CLI is used later, do not blindly overwrite existing files.
- Add shadcn components one at a time and review diffs before accepting them.
- Vite alias support should map `@` to `src` so `components.json` aliases become usable.

## UI Strategy Options

### Option A - Stay On CRA And Current Custom UI Components

Pros:

- Lowest immediate risk.
- No env or deployment churn.
- Current build/check already pass.
- Existing shared UI work can continue immediately.

Cons:

- Keeps the project on older tooling.
- Path aliases remain awkward without CRA overrides.
- Future shadcn CLI adoption remains less smooth.
- More UI work would be built on a foundation likely to be replaced.

Risk: Low short-term, medium long-term.

Effort: Low.

Recommendation: acceptable only if the goal is to avoid infrastructure work right now.

### Option B - Stay On CRA And Incrementally Adopt Shadcn-Style Components

Pros:

- Builds on the current partial shadcn setup.
- Allows continued UI migration without a bundler migration.
- Low disruption to env and deployment.

Cons:

- Does not solve CRA limitations.
- Alias support remains unresolved unless CRA is customized.
- More components may need later import/path cleanup during Vite migration.
- Risks spending more effort polishing on a soon-to-change toolchain.

Risk: Low to medium.

Effort: Medium.

Recommendation: reasonable if Vite is deferred, but not the best next step.

### Option C - Migrate To Vite, Then Continue Tailwind/shadcn/Origin UI Work

Pros:

- Modernizes the frontend foundation before deeper UI migration.
- Makes alias support straightforward.
- Aligns better with current React/Tailwind/shadcn ecosystem expectations.
- Avoids doing large module UI work twice.
- Keeps current custom primitives usable with minimal component rewrites.

Cons:

- Requires env variable rename and documentation updates.
- Requires Vercel deployment validation.
- Requires HTML entrypoint migration.
- Needs careful handling of Google OAuth local origin and Supabase redirect assumptions.

Risk: Medium.

Effort: Medium.

Recommendation: preferred next step. Do Vite as a dedicated infrastructure sprint before additional College, Pool, Finance, or Retirement UI migration.

## Final Recommendation

Proceed with Option C in the next sprint:

1. Migrate CRA to Vite.
2. Preserve existing UI primitives and module behavior.
3. Keep local dev on port `3000`.
4. Configure Vite output to `build/` initially unless deployment testing proves `dist/` is preferable.
5. Temporarily support both `VITE_*` and `REACT_APP_*` browser variables in `src/config.js` during the migration to reduce local and Vercel cutover risk.
6. After Vite is validated, continue Release 0.6 UI migration using the current shadcn-style primitives and Origin UI-style composed patterns.

## Recommended Next Prompt

```text
Family OS infrastructure sprint: migrate Create React App to Vite.

Current branch:
feature/household-foundation

Use docs/implementation/ui-platform/00_SHADCN_VITE_ASSESSMENT.md as the source of truth.

Do not change app behavior.
Do not change database schema.
Do not create migrations.
Do not modify Supabase.
Do not change AI prompts or calculations.

Tasks:
1. Replace CRA build tooling with Vite while preserving React 18 and existing app behavior.
2. Keep local dev port at 3000 if practical.
3. Preserve Vercel API route behavior for api/brief.js.
4. Configure build output to minimize deployment churn.
5. Update browser env handling from REACT_APP_* to VITE_* with a temporary backward-compatible fallback if appropriate.
6. Update .env.example, README, deployment docs, Google Calendar setup docs, current sprint, project status, and changelog.
7. Run pnpm install if dependencies change.
8. Run pnpm run build and pnpm run check.
9. Start the app locally and verify the auth shell loads without console errors.
10. Commit with: Migrate Family OS frontend to Vite
```
