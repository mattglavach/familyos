# Database Schema

## Release 0.6C Data Foundation

Release 0.6C starts the migration from Release 0.6B browser-local metadata to durable Supabase-backed household data. See `docs/database/RELEASE_0_6C_DATA_FOUNDATION_PLAN.md` for the Milestone 1 audit, current gaps, and proposed schema direction.

No Release 0.6C migration has been applied yet. The current executable database remains `supabase/schema.sql`, which uses user-owned rows and `user_id = auth.uid()` RLS policies.

## Core Tables

### profiles
Stores authenticated user profile details.

### households
Represents the family/household.

### family_members
Stores family member details.

Release 0.6B implementation note: the current dashboard family member manager is client-side only and stores editable member preferences in browser localStorage. No Supabase family member table is used by the current deployed app until the household/family member migration is applied in a later database milestone.

### tasks
Stores chores, reminders, and general tasks.

Release 0.6B implementation note: the applied Supabase `tasks` table currently persists `title`, `category`, `priority`, `due_date`, `recurring_interval_days`, `last_completed`, `is_important`, `notes`, and `completed`. The task MVP uses browser localStorage metadata keyed by task id for `assignee`, detailed `status`, `created_at`, and `completed_at` until the future shared household task schema is migrated.

### finance_accounts
Stores accounts for net worth and planning.

### transactions
Stores financial transactions if imported or manually added.

### retirement_accounts
Stores retirement planning balances and assumptions.

### college_accounts
Stores 529 and education savings details.

### pool_tests
Stores pool chemistry readings.

### pool_maintenance
Stores pool maintenance actions.

### garden_plants
Stores plants and garden layout.

### home_assets
Stores home systems and equipment.

### vehicles
Stores vehicles.

### vehicle_maintenance
Stores vehicle maintenance records.

### documents
Stores document metadata.

### medical_records
Stores non-emergency medical notes and records.

## Schema Rules
- Use `id` primary keys.
- Use `created_at` and `updated_at`.
- Use `household_id` where data belongs to the family.
- Use foreign keys.
- Use indexes on frequently queried fields.
- Use Row Level Security.
