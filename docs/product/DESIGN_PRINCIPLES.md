# Design Principles

## Philosophy
Family OS should feel simple, modern, fast, clean, and action-oriented. It should reduce mental load for the household instead of becoming another system to manage.

## Simple
Use plain language, predictable flows, and clear actions. Avoid feature density that makes the app feel like work before value is visible.

## Modern
Use contemporary product patterns: clean surfaces, concise cards, clear hierarchy, fast feedback, and mobile-first layouts.

## Fast
Users should be able to open the app, understand the day, and capture or complete an action quickly.

## Clean
Screens should feel calm and organized. Avoid visual noise, unnecessary decoration, and overloaded cards.

## Action-Oriented
Every core screen should answer:
- What matters?
- Who owns it?
- What happens next?
- What can I do now?

## Household-First
Design around shared family context: members, schedules, responsibilities, roles, permissions, and the reality that different users need different depth.

## Minimal Cognitive Load
Prefer the smallest usable flow. Hide advanced details until needed. Keep defaults sensible.

## Accessibility
Readable text, visible focus, accessible labels, sufficient contrast, keyboard support, and status text are product requirements.

## Consistency
Repeated actions should look and behave the same across modules: create, edit, complete, save, delete, invite, revoke, disconnect, and reset.

Design-system primitives should come from `src/components/ui` so common actions retain the same spacing, focus, disabled, loading, and feedback behavior as new modules are added.

## Progressive Disclosure
Show common actions first. Put rare, destructive, sensitive, or advanced actions behind clear secondary controls or confirmations.

## Visual Direction
Family OS should borrow the restraint and polish of Apple, the structured calm of Notion, and the task clarity of Todoist without copying any one product.

The visual system should remain:
- Mobile-first.
- Calm and operational.
- Dense enough for repeated use.
- Clear about status, priority, ownership, and next action.
- Respectful of privacy and household seriousness.

Detailed UI execution standards remain in `docs/ui/DESIGN_SYSTEM.md` and `docs/process/UI_GUIDELINES.md`.
