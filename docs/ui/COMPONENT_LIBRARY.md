# Component Library

## Shared Components
- Button
- Badge
- StatusBadge
- Card
- Skeleton
- Input
- Textarea
- Select
- Label
- FormGroup
- FormRow
- FormSection
- FormHelp
- FormError
- SegmentedControl
- ChipGroup
- SectionHeader
- EmptyStatePanel
- OriginDrawer
- AppShell
- Sidebar
- TopNav
- ModuleCard
- StatCard
- EmptyState
- LoadingState
- ErrorState
- ConfirmDialog
- DataTable
- FormSection
- ChartCard

## Rules
- Use Origin UI components for matching interaction patterns before creating custom feature UI.
- Use existing shadcn/ui primitives from `src/components/ui` where possible.
- Use Lucide icons for icon buttons and commands.
- Use Recharts for charts.
- Reuse shared components before creating new ones.
- Components should accept typed props.
- Keep business logic out of visual components when practical.
- Prefer shared form primitives for new or migrated drawer forms.
- Use `SegmentedControl` for mutually exclusive view/mode choices and `ChipGroup` for compact option sets.
- Use `StatusBadge` for semantic states instead of ad hoc color-only labels.
