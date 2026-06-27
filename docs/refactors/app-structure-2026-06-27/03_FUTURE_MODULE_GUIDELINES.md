# Future Module Guidelines

Date: 2026-06-27

## Module Rules

- Put user-facing module screens under `src/modules/<module>/`.
- Keep app shell, tab composition, and global layout in `src/app/`.
- Put reusable hooks in `src/hooks/`.
- Put reusable domain/status helpers in `src/utils/` or a future `src/domain/` folder.
- Keep low-level UI primitives in `src/components/ui/`.
- Keep composed shared UI in `src/components/common.js` or future `src/components/common/` files.
- Keep Supabase and API service wrappers in `src/services/` or `src/lib/` until the service layer is formalized.

## Household Migration Preparation

Future household work should add active household context in one shared place. Feature modules should not each invent their own household filtering or RLS assumptions.

## Remaining Technical Debt

- Finance and Pool modules still contain large files because this refactor moved whole behavior-preserving blocks first.
- Shared form controls and chip groups are still duplicated across modules.
- The table hook still uses the pre-migration `user_id` data model and seed fallback behavior.
- Existing module files still use substantial inline styles inherited from the prototype.