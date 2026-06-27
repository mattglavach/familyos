# Database Naming Standards

## Tables
- Use plural snake_case.
- Examples: family_members, pool_tests, finance_accounts

## Columns
- Use snake_case.
- Foreign keys end with `_id`.

## Timestamps
Use:
- created_at
- updated_at
- deleted_at if soft deletes are needed

## Booleans
Prefix clearly:
- is_active
- has_attachment
- requires_follow_up
