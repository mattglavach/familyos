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

## Release 0.9 Invitations
- Household invitations store only `token_hash`, never raw invite tokens.
- Owners can list and revoke invitations for their active household through RLS.
- Invite creation, preview, acceptance, and decline use security-definer RPCs.
- Accepting an invite requires an authenticated user whose Supabase auth email matches the invited email.
- Anonymous users are prompted to sign in first; invite links preserve `?invite=...` through magic-link redirects.
- Raw invite tokens are returned only once from invitation creation so a manager can share the invite link.
- Release 0.9 final validation confirmed hash comparisons only, invalid/expired/non-pending invite rejection paths, duplicate pending invite prevention, owner-only invite/revoke/role/remove controls, and hidden non-owner Settings controls for adult/viewer users.
- Production Supabase was not touched during Release 0.9 validation; all smoke tests used disposable local users and the local Supabase Docker stack.

## Release 1.1 Life Lists
- `life_lists` and `life_list_items` have RLS enabled.
- Active household members can read household/shared Life Lists and their items.
- Personal Life Lists are visible only to `owner_user_id`.
- Owners and adults can create, update, and delete household/shared lists and items.
- Viewers cannot manage household/shared lists or their items, including household/shared lists they created before a role change.
- Any active signed-in member can create personal lists they own.
- Item access is derived from the parent list, including personal-list owner checks and household/shared owner/adult management checks.
- Release 1.1 validation used disposable/local Supabase only and confirmed owner, adult, viewer, personal owner-only, household/shared read, archived item read, and cross-household denial paths.
- Release 1.1 does not add push/email/SMS notifications, external enrichment APIs, public sharing, ratings, or reviews.

## Release 1.2 Shopping & Pantry
- `shopping_lists`, `shopping_categories`, `shopping_items`, and `pantry_items` have RLS enabled.
- Active household members can read household/shared shopping lists and their items.
- Personal shopping lists are visible only to `owner_user_id`; items inherit access from the parent list.
- Owners and adults can create, update, and delete household/shared shopping lists and items.
- Any active signed-in member can create personal shopping lists and manage items in those personal lists.
- Viewers cannot manage household/shared shopping lists or items, but can create and manage their own personal shopping lists.
- Pantry items are readable by active household members and manageable by owners/adults only.
- Cross-household list, item, category, and pantry access is denied.
- Release 1.2 validation used disposable/local Supabase only and confirmed owner, adult, viewer, personal owner-only, household/shared read, pantry read-only viewer behavior, archived item behavior, and cross-household denial paths.
- Release 1.2 does not add recipes, meal planning, barcode scanning, OCR, AI, external grocery APIs, recommendation engines, or public sharing.

## Release 1.3 Meal Planning
- `meal_plans`, `recipe_categories`, `recipes`, `recipe_ingredients`, and `meal_assignments` have RLS enabled.
- Active household members can read household/shared meal plans, recipes, ingredients, and assignments.
- Personal meal plans and recipes are visible only to `owner_user_id`; ingredients and assignments inherit access from the parent recipe or meal plan.
- Owners and adults can create, update, and delete household/shared meal plans, recipes, ingredients, and assignments.
- Any active signed-in member can create personal meal plans and recipes they own, and manage assignments/ingredients under those personal records.
- Viewers cannot manage household/shared meal planning records, but can create and manage their own personal meal planning records.
- Recipe categories are readable by active members and manageable by owners/adults only.
- Cross-household meal plan, recipe, ingredient, assignment, and category access is denied.
- Archived records remain readable when their parent visibility allows access; archive state is a product filter, not a security boundary.
- Release 1.3 validation used disposable/local Supabase only and confirmed owner, adult, viewer, personal owner-only, household/shared read, archived visible rows, and cross-household denial paths.
- Release 1.3 does not add nutrition tracking, Health platform access, AI recommendations, recipe APIs, barcode/OCR, external recipe databases, comments, ratings, or social features.

## Release 1.4 Pool Care Assistant
- `pool_readings`, `pool_treatments`, `pool_maintenance`, `pool_schedule`, `pool_equipment`, and `pool_action_audits` have RLS enabled.
- Active household members can read Pool records for their household.
- Owners and adults can create, update, and delete Pool tests, treatments, maintenance, reminders, equipment, and action audit rows.
- Viewers are read-only in the Pool UI and are denied Pool writes by RLS unless a future release explicitly adds configurable viewer write access.
- Cross-household Pool access is denied.
- Pool maintenance and reminder rows that reference equipment must reference equipment in the same household.
- Pool action audit rows that reference readings must reference readings in the same household, preventing cross-household spoofing by linked id.
- Recommendation audit rows exist to track human-confirmed recommendations and completed actions. They do not authorize automatic dosing, equipment control, or AI-initiated changes.
- Release 1.4 validation passed against disposable/local Supabase only for owner, adult, viewer, non-member, cross-household, linked-record spoofing, and confirmed-action audit behavior.

## Future
- Adult-only permissions
- Child-safe views
- Guest/community access
- Ownership transfer and owner recovery flows
