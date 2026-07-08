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
- NumberField
- ToggleField
- NotesField
- DateTimeField
- SaveCancelFooter
- DeleteButton
- ValidationSummary
- SegmentedControl
- ChipGroup
- SectionHeader
- EmptyStatePanel
- AiBriefText
- AiBriefCard
- AiBriefLoading
- AiBriefError
- AiBriefEmpty
- AiBriefActions
- AiBriefFollowUp
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
- Alert
- Avatar
- Checkbox
- Command
- Dialog
- Drawer
- DropdownMenu
- Popover
- Separator
- Sheet
- Switch
- Table
- Tabs
- Toast
- Tooltip

## Rules
- Use Origin UI components for matching interaction patterns before creating custom feature UI.
- Use existing shadcn/ui primitives from `src/components/ui` where possible.
- Import UI primitives through `src/components/ui`; do not import third-party primitives directly in feature modules.
- Keep wrappers presentational and move data loading, authorization, validation, and mutation logic into modules or hooks.
- Use Lucide icons for icon buttons and commands.
- Use Recharts for charts.
- Reuse shared components before creating new ones.
- Components should expose small, predictable props.
- Keep business logic out of visual components when practical.
- Prefer shared form primitives for new or migrated drawer forms.
- Use `SegmentedControl` for mutually exclusive view/mode choices and `ChipGroup` for compact option sets.
- Use `StatusBadge` for semantic states instead of ad hoc color-only labels.
- Use the AI brief helpers for generated summary panels, loading/error states, and follow-up chat UI.

## Release 1.0.3 Notes
- `components.json` documents the shadcn/ui-compatible local configuration.
- The local wrapper layer now covers the baseline future-module primitive set requested for Release 1.0.3.
- Quick Add and Tasks use chips for common recurrence/status/priority/category choices; dynamic assignee selection remains a dropdown.
- Universal Search uses the local `Command` wrapper for keyboard-friendly command-style results without changing search scope.

## Release 1.5.1 Notes
- Shared form controls now cover compact numeric fields, notes textareas, binary toggles, date/time rows, validation summaries, delete actions, and save/cancel footers for migrated drawer forms.
- Pool Test and Quick Add Pool Test share Pool field metadata and validation helpers so labels, ranges, helper text, and inline errors stay aligned.
