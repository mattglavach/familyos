# UI Guidelines

This document summarizes execution rules for UI work. `docs/ui/DESIGN_SYSTEM.md` remains the detailed visual source of truth.

## Product UX Rules
- Apply the Product Owner UX Standards in `docs/product/UX_GUIDELINES.md` to every UI change.
- Home must remain an awareness layer.
- Modules must remain action-oriented work surfaces.
- Dashboard cards summarize and drill down; they should not become forms or module workspaces.
- Avoid dashboard-style KPI sections inside modules unless they directly filter, navigate, or support immediate action.
- Optimize frequent forms for speed with segmented controls, chips, button groups, and smart defaults before using dropdowns.
- Use the 10 Second Rule during review: a new user should understand what to do on the screen within 10 seconds.

## Consistency
- Reuse existing cards, badges, buttons, inputs, labels, selects, drawers, and empty-state components.
- Match the existing dark, calm, mobile-first operational style.
- Avoid new visual systems unless a release explicitly redesigns a surface.

## Accessibility
- Use semantic controls.
- Label every persisted input.
- Give icon-only buttons accessible names.
- Preserve keyboard navigation and visible focus.
- Do not rely on color alone for status.

## Loading States
- Show loading indicators for async actions that can take noticeable time.
- Disable duplicate-submit actions while saving.
- Keep layouts stable while loading.

## Error States
- Show recoverable, user-safe errors near the affected action.
- Preserve entered values after validation errors.
- Avoid raw provider or database messages when they expose implementation details.

## Empty States
- Every list or module section should have an empty state.
- Empty states should describe what is missing and provide the next valid action when one exists.

## Forms
- Use native input types where possible.
- Validate required fields before submit.
- Keep forms short; group longer workflows.
- Use confirmation for destructive actions.

## Navigation
- Preserve bottom navigation for primary modules.
- Do not add a top-level nav item until the module is active, documented, and validated.
- Avoid unexpected route changes after save unless the workflow requires it.

## Buttons
- Primary buttons are for the main action.
- Secondary buttons are for lower-priority actions.
- Destructive buttons require clear labels and confirmation when data changes are irreversible.
- Use Lucide icons where an icon improves scanning.

## Spacing
- Use the 8px spacing rhythm from the design system.
- Avoid nested cards and ad hoc spacing.
- Keep dense operational UIs readable on 360px-wide screens.

## Feedback
- Provide success feedback for saves, creates, revokes, deletes, role changes, and connection changes.
- Toasts should be concise and should not hide critical errors.

## Permission-Aware UI
- Hide unauthorized controls when the user cannot act.
- Show read-only role/status context where useful.
- Backend RLS/RPC enforcement is still required.

## Responsive Expectations
- Validate mobile and desktop layouts for affected screens.
- Check long labels, emails, names, buttons, and badges for wrapping or overflow.
