# Supabase Security and RLS

## Principles
- Enable Row Level Security on user-owned tables.
- Restrict access by household_id.
- Sensitive modules require stricter policies.

## Sensitive Areas
- Finance
- Medical
- Documents
- College planning
- Retirement

## Basic Policy Pattern
Users can access records where their profile belongs to the same household.

## Future
- Adult-only permissions
- Child-safe views
- Guest/community access
