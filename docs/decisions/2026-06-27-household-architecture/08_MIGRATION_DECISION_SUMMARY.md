# Migration Decision Summary

Decision date: 2026-06-27

## Final Recommended Architecture Decision

Proceed with migration planning for a household-centered Family OS architecture.

The first migration should establish:

- `households` as the ownership boundary.
- `household_members` as the membership and role boundary.
- `profiles` for authenticated user metadata.
- `people` for family members and children who may not log in.
- `household_id` on shared module data.
- RLS enforced through household membership, not direct `user_id` ownership.

`user_id` should be retained during migration as compatibility and attribution metadata, not treated as the long-term ownership model for shared data.

## In Scope For First Migration

- Create household foundation tables.
- Create one default household per current user.
- Add owner membership for each default household.
- Keep child records as profile/person data, not login users.
- Reserve guest role but grant no guest access.
- Add `household_id` to existing shared tables in a phased migration plan.
- Design owner/adult RLS policy helpers.
- Keep `user_id` until household policies and app access are verified.
- Prepare app data access for active household context.

## Out Of Scope For First Migration

- Guest access.
- Child login.
- Invitation UX.
- Multi-household switching UI.
- Per-record privacy controls.
- Full AI memory system.
- Document storage redesign.
- Calendar server-side OAuth token storage.
- Medical module implementation.
- Route-aware navigation.
- TypeScript migration.

## Required Pre-Migration Checklist

Before writing or running migrations:

- Complete `05_MIGRATION_READINESS_CHECKLIST.md`.
- Review `35fc55a updates from codex` because it includes app, schema, package, and config changes beyond decision docs.
- Confirm current `supabase/schema.sql` is the intended baseline.
- Confirm role names: `owner`, `adult`, `child_profile`, `guest_future`.
- Confirm first migration creates one default household per existing user.
- Confirm no child or guest auth access is included.
- Confirm rollback plan keeps `user_id` intact.
- Confirm RLS policy patterns for owner/adult and non-member denial.

## Implementation Readiness

Readiness: **planning-ready, not migration-ready.**

The architecture decisions are now sufficiently resolved to start writing migration tickets and SQL drafts. The project should not run migrations until the current committed baseline is reviewed, the table ownership map is confirmed, and rollback steps are written.

## Go / No-Go Recommendation

Recommendation: **Go for migration planning; no-go for running migrations yet.**

Proceed with:

- Migration SQL design.
- RLS helper design.
- Table ownership mapping.
- App data-access refactor planning.

Do not proceed yet with:

- Running migrations.
- Enabling household RLS in production.
- Removing `user_id`.
- Adding guest or child login access.

