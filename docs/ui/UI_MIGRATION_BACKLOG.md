# UI Migration Backlog

This backlog is based on a review of `src/App.js` on June 27, 2026. The app should migrate gradually from inline style objects to Tailwind, shadcn primitives, Lucide icons, Recharts, and Origin UI-style composed patterns.

## Migration Rules
- Prioritize high-value, low-risk components first.
- Migrate shared/common components before feature screens.
- Avoid broad rewrites.
- Preserve behavior and data contracts during each migration.
- Keep each change small enough to verify with `pnpm run build`.
- Use Recharts only when replacing or introducing chart-like data visualization.

## Inline Style Hotspots

| Area | Lines | Inline styles | Token styles | Modals | Swipe cards | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `Finance` | 1875-2565 | 223 | 125 | 8 | 3 | Highest density; many cards, projections, simulations, forms, and finance summaries. |
| `Pool` | 1034-1725 | 163 | 100 | 4 | 4 | Chemistry cards, recommendations, treatment UI, logs, and health summaries. |
| `College` | 528-825 | 111 | 97 | 5 | 9 | Deadline lists, timeline cards, school/essay/test forms. |
| `QuickAdd` | `src/modules/quick-add/QuickAdd.js` | Migrated | Migrated | Drawer | 0 | Completed first feature-surface migration using shared drawer, form primitives, segmented controls, and chips. |
| `PoolBrief` | `src/modules/pool/Pool.js` | Migrated | Migrated | 1 | 0 | Completed brief panel migration using shared AI brief helpers; pool AI logic and history behavior preserved. |
| `RetirementBrief` | `src/modules/finance/Finance.js` | Migrated | Migrated | 1 | 0 | Completed brief panel migration using shared AI brief helpers; retirement AI logic and history behavior preserved. |
| `CalendarBanner` | 505-527 | 8 | 4 | 0 | 0 | Low-risk shared banner, currently unused. |
| `AuthGate` | `src/app/App.js` | Migrated | Migrated | 0 | 0 | Completed standalone auth form migration using shared card, form, input, button, and error helpers. |
| `SetupRequired` | `src/app/App.js` | Migrated | Migrated | 0 | 0 | Completed standalone setup gate migration using shared card, section header, and status badge helpers. |
| `App` shell | `src/app/App.js` | Migrated | Migrated | 0 | 0 | Completed header, bottom navigation, and global loading wrapper migration using shared primitives/classes. |

## Priority 1 - Shared, Low-Risk Foundations

### 1. Standardize form primitives
- Scope: Add or wire `Input`, `Label`, `Textarea`, `Select`, `Checkbox`, and segmented control primitives.
- Why first: Forms appear across auth, quick add, college, pool, and finance modals.
- Risk: Low.
- Effort: Medium.
- Notes: Keep existing Supabase payload logic unchanged.

### 2. Replace ad hoc chips with reusable badge/segmented controls
- Scope: Migrate `S.chip` usages into shared `Badge`, toggle chip, or segmented-control components.
- Why first: Chips are used across every feature and are visually central.
- Risk: Low.
- Effort: Medium.
- Notes: Preserve selected/unselected color semantics.

### 3. Expand common list/action components
- Scope: Standardize `SwipeCard`, `SwipeHint`, empty/loading states, and row action affordances.
- Why first: Existing `SwipeCard` is shared and already partially migrated.
- Risk: Low.
- Effort: Medium.
- Notes: Keep touch behavior stable; add visible non-swipe affordances where needed.

### 4. Standardize drawer forms
- Scope: Move all `Modal` users to the Origin UI-style drawer shell with shared footer/action patterns.
- Why first: Many feature forms already use `Modal`; the shared shell gives broad visual consistency.
- Risk: Low to medium.
- Effort: Medium.
- Notes: Do not alter form fields or save handlers in the same pass.

## Priority 2 - High-Value Shared Workflows

### 5. QuickAdd drawer
- Scope: Replace the custom `QuickAdd` sheet and action buttons with `OriginDrawer`, shadcn `Button`, shared form controls, and Lucide icons.
- Why: High-use workflow with limited surface area.
- Status: Complete.
- Risk: Medium.
- Effort: Medium.
- Notes: Migrated in place after QuickAdd was extracted to `src/modules/quick-add/QuickAdd.js`; save handlers and Supabase row shapes were preserved.

### 6. Auth and setup states
- Scope: Migrate `AuthGate` and `SetupRequired` to `Card`, `Button`, shared inputs, and status messaging.
- Why: Low-risk standalone screens that validate the design system.
- Status: Complete.
- Risk: Low.
- Effort: Small.
- Notes: Password sign-in, magic-link fallback, resend cooldown, setup gating, and auth error handling were preserved.

### 7. Header and bottom navigation shell
- Scope: Replace root header buttons, connection status, and bottom nav styles with shared app-shell patterns.
- Why: Visible everywhere and currently low line count.
- Status: Complete.
- Risk: Medium.
- Effort: Medium.
- Notes: Preserved tab labels, icon source, active tab state, sign-out, Google Calendar connect/sync state, and bottom safe-area behavior.

## Priority 3 - Feature Screens With Clear Component Boundaries

### 8. College deadline cards and forms
- Scope: Migrate deadline list cards, status badges, and create/edit drawers before touching school, essay, or SAT sections.
- Why: Uses many `SwipeCard` and `Modal` instances with repeatable structure.
- Risk: Medium.
- Effort: Medium.
- Inline-heavy signs: Timeline row styles, repeated deadline cards, five modal flows.

### 9. Pool health summary and reading forms
- Scope: Migrate top health cards, chemistry parameter cards, and reading/treatment drawers.
- Why: High-value operational screen with strong status semantics.
- Risk: Medium.
- Effort: Large.
- Inline-heavy signs: Health summary, parameter grid, recommendation cards, four modal flows.
- Chart opportunity: Replace custom mini trend lines with Recharts where trends need axes/tooltips.

### 10. AI brief panels
- Scope: Extract shared AI brief panel for `PoolBrief` and `RetirementBrief`.
- Why: Similar interaction pattern across modules.
- Status: Complete.
- Risk: Medium.
- Effort: Medium.
- Notes: Added presentational AI brief helpers for brief text, cards, loading, error, empty, actions, and follow-up chat. Prompts, fetch calls, history, refresh/regenerate, copy, and follow-up handlers stayed inside each module.

## Priority 4 - Larger Feature Migrations

### 11. Finance dashboard cards and projections
- Scope: Migrate summary cards, account rows, action items, and modal forms in small groups.
- Why: Highest inline-style density, but also highest risk.
- Risk: High.
- Effort: Large.
- Inline-heavy signs: 223 inline style objects, eight modal flows, multiple nested planning sections.
- Chart opportunity: Use Recharts for net worth, retirement projection, Monte Carlo probability, spending sensitivity, and contribution impact.

### 12. Finance simulation and table-like sections
- Scope: Convert bridge schedules, account lists, milestone timelines, and simulation outputs into shared list/table/chart patterns.
- Why: Improves scanability and prepares for desktop layouts.
- Risk: High.
- Effort: Large.
- Notes: Split from general Finance migration to avoid a broad rewrite.

### 13. College planning timeline and school/essay/test sections
- Scope: Migrate after deadline components are stable.
- Why: More varied content and more business logic mixed with rendering.
- Risk: Medium to high.
- Effort: Large.

## Deferred Until Feature Work Requires It
- Full `src/App.js` decomposition into feature modules beyond already extracted Dashboard and Tasks.
- Global route restructuring.
- Light mode implementation.
- Replacing all inline styles in one pass.
- Redesigning existing information architecture.

## Suggested Next Step
Migrate shared dashboard/card patterns next. Focus on reusable summary cards, metric cards, action rows, and section headers before touching Pool or Finance internals.
