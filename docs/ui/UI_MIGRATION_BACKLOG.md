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
| `PoolBrief` | 826-1033 | 24 | 3 | 1 | 0 | AI brief output, follow-up chat, loading/error states. |
| `RetirementBrief` | 1726-1874 | 19 | 4 | 1 | 0 | AI brief output similar to PoolBrief. |
| `CalendarBanner` | 505-527 | 8 | 4 | 0 | 0 | Low-risk shared banner, currently unused. |
| `AuthGate` | 469-488 | 6 | 5 | 0 | 0 | Low-risk standalone form. |
| `SetupRequired` | 456-468 | 5 | 2 | 0 | 0 | Low-risk standalone state. |
| `App` shell | 2764-2844 | 7 | 9 | 0 | 0 | Header and bottom nav should migrate after shared primitives are ready. |

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
- Risk: Low.
- Effort: Small.
- Inline-heavy signs: Custom cards, typography, messages, and button styles.

### 7. Header and bottom navigation shell
- Scope: Replace root header buttons, connection status, and bottom nav styles with shared app-shell patterns.
- Why: Visible everywhere and currently low line count.
- Risk: Medium.
- Effort: Medium.
- Notes: Verify safe-area behavior and mobile tap targets.

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
- Risk: Medium.
- Effort: Medium.
- Notes: Preserve copy, refresh, history, and follow-up behavior.

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
Migrate `AuthGate` and `SetupRequired` next. They are standalone, low-risk screens that can validate the shared form and card primitives before larger module work.
