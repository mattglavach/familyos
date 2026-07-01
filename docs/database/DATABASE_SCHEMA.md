# Database Schema

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
