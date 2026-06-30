# Component Library

Family OS shared UI components live in `src/components/ui/`. They provide reusable presentation only; business logic, Supabase calls, AI prompts, and module-specific calculations should remain in modules or hooks.

## Purpose
- Keep flagship modules visually consistent.
- Reduce duplicated card, section, loading, empty, form, status, table, and chart presentation.
- Provide a dashboard widget framework that Pool, Finance, Retirement, College, and future modules can reuse.
- Preserve the mobile-first dark operational Family OS style.

## Core Rules
- Reuse shared components before creating feature-specific presentation.
- Keep data shaping and save handlers out of UI primitives.
- Use semantic status text; do not rely on color alone.
- Prefer small component composition over large module-specific wrappers.
- Do not introduce new module workflows while migrating presentation.

## Cards

### `SummaryCard`
Purpose: High-level module or screen summary with eyebrow, headline, detail, tone, and optional children.

Props:
- `eyebrow`
- `title`
- `detail`
- `tone`: `neutral`, `red`, `amber`, `green`, `blue`, `purple`, `slate`
- `children`
- `className`

Example:
```jsx
<SummaryCard eyebrow="Today" title="All clear" detail="Nothing needs attention." tone="green" />
```

### `MetricCard`
Purpose: Compact metric/status tile, optionally clickable.

Props:
- `label`
- `value`
- `detail`
- `tone`
- `icon`
- `as`
- `className`

Example:
```jsx
<MetricCard as="button" label="Pool" value="Good" detail="pH 7.6 FC 5" tone="green" onClick={openPool} />
```

### `StatusCard`
Purpose: Generic bordered card with semantic tone treatment.

### `InfoCard`
Purpose: Neutral content card for generated text, notes, or helper content.

## Layout

### `SectionHeader`
Purpose: Shared uppercase section label with optional count and action.

Props:
- `title`
- `count`
- `action`
- `tone`
- `className`

### `DashboardSection`
Purpose: Standard section wrapper for dashboard/module groups.

### `WidgetContainer`
Purpose: Reusable dashboard widget shell.

Props:
- `title`
- `subtitle`
- `icon`
- `status`
- `actions`
- `loading`
- `empty`
- `footer`
- `children`
- `className`

Example:
```jsx
<WidgetContainer title="Action Center" status={<StatusBadge status="warning" />}>
  <ActionRow title="Test pool water" detail="Due today" onClick={openTask} />
</WidgetContainer>
```

### `ActionRow`
Purpose: Standard clickable or static row with indicator, title, detail, and trailing action.

### `SectionAction`
Purpose: Compact text action used in section headers.

## Status

### `StatusBadge`
Purpose: Semantic status badge for health, warning, selected, connected, and neutral states.

### `PriorityBadge`
Purpose: Task-style priority badge mapping `high`, `med`, and `low` to semantic status tones.

### `HealthIndicator`
Purpose: Small dot plus text for compact health states.

## Loading

### `LoadingCard`
Purpose: Card skeleton for list and panel loading states.

### `LoadingMetric`
Purpose: Compact skeleton for metric cards.

### `LoadingTable`
Purpose: Repeating row skeleton for table-like layouts.

## Empty States

### `EmptyStatePanel`
Purpose: Standard empty, filtered-empty, or no-data panel.

Props:
- `icon`
- `title`
- `detail`
- `action`
- `onAction`
- `className`

## Dialogs

### `ConfirmDialog`
Purpose: Standard confirmation content for destructive or important actions.

### `StandardModalLayout`
Purpose: Standard title, description, content, and footer layout inside dialogs/drawers.

## Forms

Existing form primitives:
- `FormGroup`
- `FormRow`
- `FormSection`
- `FormHelp`
- `FormError`
- `Input`
- `Textarea`
- `Select`
- `Label`
- `SegmentedControl`
- `ChipGroup`

Use `FormHelp` as the shared field description pattern.

## Tables

### `StandardTableHeader`
Purpose: Shared table/list header row for comparison-heavy layouts.

### `EmptyTableState`
Purpose: Table-specific empty state using the standard empty panel.

## Charts

### `ChartContainer`
Purpose: Standard shell for Recharts or chart-like visualizations. It does not transform chart data.

Props:
- `title`
- `subtitle`
- `children`
- `footer`
- `className`

## AI Panels

Existing AI brief helpers:
- `AiBriefText`
- `AiBriefCard`
- `AiBriefLoading`
- `AiBriefError`
- `AiBriefEmpty`
- `AiBriefActions`
- `AiBriefFollowUp`

These now reuse shared card/loading/empty primitives. AI prompts, fetch calls, history, and follow-up behavior remain in the owning module.

## Current Application
- Dashboard uses `SummaryCard`, `MetricCard`, `DashboardSection`, `WidgetContainer`, `ActionRow`, `SectionAction`, and `EmptyStatePanel`.
- Tasks and Home Maintenance use shared section headers, summary, priority badge, empty, and loading presentation while preserving swipe cards and forms.
- AI brief panels use shared card/loading/empty presentation.
