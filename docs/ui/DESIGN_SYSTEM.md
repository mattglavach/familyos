# Family OS Design System

Family OS is a mobile-first household operations app. The interface should feel calm, direct, and work-focused: dense enough for repeated family operations, but not visually noisy.

## Overall Design Principles
- Start with the user task, then choose the smallest UI needed to complete it.
- Preserve a quiet operational feel: restrained color, clear hierarchy, and minimal decoration.
- Optimize for mobile use first, then scale layouts up for tablet and desktop.
- Prefer predictable repeated patterns over novel one-off interfaces.
- Make status, urgency, ownership, and next action visible without requiring explanation text.
- Avoid removing existing behavior during UI migration; improve one surface at a time.

## Release 1.0.3 Component Strategy
- Family OS is compatible with the shadcn/ui model and uses `components.json`, Tailwind CSS variables, Lucide icons, and local wrappers under `src/components/ui`.
- Future modules should import UI primitives from `src/components/ui` only. Do not import third-party UI primitives directly into feature modules.
- The wrapper layer keeps design tokens, accessibility defaults, and Family OS interaction rules in one place while allowing the underlying implementation to change later.
- Existing Origin UI-style drawers remain the standard for mobile create/edit flows; `src/components/ui/drawer.jsx` exposes the drawer through the wrapper layer for future modules.
- Common fixed option sets should use `SegmentedControl` or `ChipGroup`. Use dropdowns for long, dynamic, or low-frequency option lists.
- Universal Search uses the local `Command` wrapper for command-style input and result rows without expanding search scope.

## Design Tokens
- Typography: system UI stack, compact headings, readable body text, and no viewport-scaled font sizes.
- Spacing: 8px rhythm with stable gaps, section spacing, and mobile padding.
- Colors: tokenized dark operational theme with semantic `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, and `info` colors.
- Radius: `--radius-sm`, `--radius-md`, and `--radius-lg`; card and control radii should stay restrained.
- Elevation: `--shadow-soft` and `--shadow-card` only when elevation clarifies layering.
- Focus: visible `focus-visible` rings using the shared ring token.
- States: hover, disabled, destructive, success, warning, and error states must be token-based and text-supported.
- Motion: use `--duration-fast`, `--duration-normal`, and `--duration-slow`; avoid decorative motion.
- Dark mode readiness: new components must use tokens instead of hard-coded light or dark colors.

## Layout Standards
- Use a constrained app shell for mobile-first flows, with comfortable side padding and persistent bottom navigation where appropriate.
- Keep primary content in a single-column flow on mobile.
- Use two-column grids only when each cell remains readable at mobile widths.
- Use full-width page bands or unframed layouts for major sections; use cards for individual grouped records, summary blocks, and repeated items.
- Keep fixed-format controls stable with explicit dimensions, aspect ratios, or grid tracks.
- Avoid nested cards. If content needs grouping inside a card, use dividers, section labels, or spacing.

## Navigation Patterns
- Use bottom tab navigation for primary modules on mobile.
- Keep current primary action labels short: Home, Tasks, Calendar, Quick Add, More. Do not treat these current labels as the approved long-term module architecture; see `docs/governance/FamilyOS_Project_Instructions.md`.
- Use sticky headers for current module context and important global actions.
- Use tabs or segmented controls for local module views.
- Use drawers for quick-create and edit workflows that should not navigate away.
- Avoid adding new top-level navigation until the module is active and documented.

## Card Patterns
- Use cards for status summaries, actionable records, and repeated items.
- Card radius should generally be `8px` through `16px`; use larger radii only for bottom drawers.
- Use a subtle border and dark surface rather than heavy shadows.
- Use left or top accent borders for urgency and category, not large saturated backgrounds.
- Cards should contain one primary idea and one obvious action path.
- Repeated list cards should share the same internal structure: title, metadata, status badge, optional action.

## Typography
- Use system UI or Inter-style sans-serif typography.
- Keep letter spacing at `0` unless an existing uppercase micro-label pattern requires slight positive spacing.
- Use compact headings inside dashboards, cards, and drawers.
- Reserve large type for module-level summaries or important metric values.
- Body text should remain readable at mobile sizes, generally `14px` to `16px`.
- Avoid viewport-based font sizing.
- Keep line height generous for explanatory text and compact for labels or metrics.

## Spacing
- Use an 8px spacing rhythm.
- Standard mobile screen padding: `16px` to `20px`.
- Card padding: `14px` to `20px`, depending on density.
- Control gaps: `6px` to `12px`.
- Section spacing: `16px` to `24px`, with tighter spacing in dense operational lists.
- Avoid ad hoc spacing values unless they solve a concrete layout problem.

## Button Usage
- Use shadcn `Button` for standard commands.
- Use Lucide icons for icon buttons and tool actions.
- Primary buttons are for the main save, submit, connect, or add action.
- Secondary buttons are for cancel, back, reveal, or lower-priority actions.
- Destructive buttons must clearly state the destructive action and should use confirmation when data is removed.
- Icon-only buttons require accessible labels.
- Button text should be short and action-oriented.

## Badge And Status Usage
- Use badges for category, priority, ownership, freshness, and state.
- Use consistent status colors:
  - Red: overdue, unsafe, failed, destructive, urgent.
  - Amber: due soon, warning, monitor, needs review.
  - Green: healthy, complete, safe, on track.
  - Blue: informational, connected, selected, primary.
  - Purple: important, personal emphasis, AI or special planning state.
  - Slate: neutral, inactive, unknown, archived.
- Do not rely on color alone; include text labels for meaningful states.
- Keep badges compact and avoid wrapping long badge text.

## Form Standards
- Use labeled inputs for every persisted field.
- Use native input types for dates, times, numbers, email, and text where possible.
- Use segmented controls, chips, or radio-style groups for small fixed option sets.
- Use checkboxes or switches for binary settings.
- Show validation errors near the field or action that caused them.
- Preserve values while errors are shown.
- Keep drawer forms short. If a form becomes long, group fields into clear sections.
- Use Supabase schema names and validation rules consistently with database docs.

## Drawer And Modal Standards
- Use Origin UI-style drawer patterns for mobile create/edit flows and quick actions.
- Drawers should slide from the bottom, respect safe areas, and cap height at the viewport.
- Use a visible drag handle, clear title, accessible close button, and `role="dialog"` semantics.
- Use modals sparingly for blocking confirmations or workflows that must interrupt the current page.
- Do not stack drawers or modals.
- Destructive confirmation should be explicit and reversible when possible.
- Drawer content should use existing shadcn form, button, badge, and card primitives where possible.

## Table And List Standards
- Prefer responsive lists/cards on mobile.
- Use tables only when row and column comparison is the primary task.
- Tables must have clear headers, right-aligned numeric values, and readable row spacing.
- Dense financial or planning data can use compact rows, but touch targets must remain large enough.
- Lists should support empty, loading, error, and filtered-empty states.
- Swipe actions are acceptable for mobile lists only when paired with visible affordances or hints.

## Chart Standards Using Recharts
- Use Recharts for charts.
- Use charts when they clarify trend, comparison, allocation, projection, or risk.
- Prefer simple chart types:
  - Line charts for trends and projections.
  - Bar charts for category comparisons.
  - Area charts for balances over time.
  - Pie or donut charts only for small allocation sets.
- Use Family OS status colors and neutral grid/axis styling.
- Include accessible labels, tooltips, and plain-text summaries for important chart insights.
- Avoid decorative charts that do not support a decision.
- Keep mobile chart height stable and avoid horizontal overflow.

## Mobile Responsiveness
- Design every screen for a 360px-wide viewport first.
- Ensure text does not overflow buttons, badges, cards, or navigation items.
- Keep tap targets at least 44px where practical.
- Use sticky or fixed navigation only when it does not cover content.
- Respect `env(safe-area-inset-*)` for fixed headers, drawers, and bottom nav.
- Test dense forms, long labels, and high-data cards on mobile widths.

## Dark Mode Expectations
- Family OS currently defaults to a dark operational theme.
- Dark surfaces should use layered neutrals, not pure black panels.
- Borders and dividers should remain visible without becoming high-contrast noise.
- Text contrast must remain accessible across primary, muted, and disabled states.
- Accent colors should be used for meaning and action, not broad decoration.
- If light mode is introduced later, tokens must support both modes without rewriting components.

## Accessibility Expectations
- Use semantic elements before custom roles.
- Provide accessible names for icon-only buttons.
- Maintain visible focus states.
- Do not communicate status by color alone.
- Ensure dialogs and drawers have titles and modal semantics.
- Keep form labels programmatically associated where possible.
- Avoid tiny text in core workflows.
- Preserve keyboard access for navigation, forms, dialogs, and destructive actions.

## When To Use shadcn Primitives
- Use shadcn primitives for common UI building blocks:
  - Button
  - Badge
  - Card
  - Skeleton
  - Input
  - Label
  - Tabs
  - Select
  - Dialog
  - Alert
  - Table
- Prefer extending these primitives before creating feature-specific UI.
- Keep business logic outside primitive components.
- Add or adapt primitives in `src/components/ui` when a reusable base component is missing.
- Release 1.0.3 provides wrappers for Button, Card, Input, Textarea, Select, Dialog, Sheet, Drawer, Tabs, Table, Badge, Toast, Alert, Avatar, Popover, DropdownMenu, Command, Separator, Tooltip, Checkbox, Switch, Skeleton, form helpers, section headers, empty states, segmented controls, and chips.
- The shadcn CLI is not required for every component addition. When adding or replacing a primitive, preserve the local wrapper API and document any required dependency change.

## When To Use Origin UI-Style Patterns
- Use Origin UI-style patterns for composed interaction blocks that shadcn primitives do not cover by themselves.
- Good candidates:
  - Mobile bottom drawers
  - Command-style quick add menus
  - Swipe/action list rows
  - Empty states with clear recovery actions
  - Dense metric cards with built-in status treatment
  - Timeline and activity patterns
- Copy or adapt the pattern into local source so it follows Family OS tokens and accessibility requirements.
- Prefer Origin UI-style patterns for matching user-facing interactions instead of inventing custom one-off layouts.
