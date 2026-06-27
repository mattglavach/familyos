# Authentication

## Recommended Approach
Use Supabase Auth.

## Roles
- admin
- adult
- child
- guest

## Access Principles
- Sensitive modules require authenticated access.
- Finance, medical, and documents should be restricted.
- Children should have limited access.
- Club/community views should never expose private household data.

## Future
- Magic links
- Role-based access control
- Household-level permissions
