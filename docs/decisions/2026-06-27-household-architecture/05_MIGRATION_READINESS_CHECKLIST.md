# Migration Readiness Checklist

Decision date: 2026-06-27

Complete this checklist before running any household architecture schema migration.

## Backup / Export

- [ ] Export current Supabase schema.
- [ ] Export current table data or confirm recoverable backup exists.
- [ ] Record current Supabase project/environment.
- [ ] Confirm `.env.local` and secrets are not committed.
- [ ] Confirm rollback owner and deployment window.

## Current Schema Inventory

- [ ] Inventory all tables in `supabase/schema.sql`.
- [ ] Confirm current RLS policies on every app table.
- [ ] Confirm all current `user_id` indexes.
- [ ] Confirm seed and backfill scripts that reference `user_id`.
- [ ] Identify any tables present in Supabase but missing from repo SQL.

## Table Ownership Mapping

- [ ] Map each current table to future `household_id`.
- [ ] Decide which tables also need `created_by_user_id`.
- [ ] Decide which tables need `owner_person_id`, `subject_person_id`, or `module_key`.
- [ ] Identify adult-only tables.
- [ ] Identify child-safe tables.
- [ ] Identify tables that should wait for later platform entities.

## Affected Code References

- [ ] Review `src/lib/supabase.js`.
- [ ] Review `src/App.js` `useTable`.
- [ ] Review direct `sb.from(...)` writes.
- [ ] Review current auth hook.
- [ ] Review seed fallback behavior.
- [ ] Review `api/brief.js` auth and AI context assumptions.
- [ ] Review docs references to `user_id` and `household_id`.

## RLS Policy Design

- [ ] Define final role names.
- [ ] Define role permissions matrix.
- [ ] Draft `is_household_member` helper.
- [ ] Draft owner/adult helper.
- [ ] Draft child-safe access pattern.
- [ ] Draft sensitive-table policies.
- [ ] Verify insert policies prevent spoofing `household_id`.
- [ ] Verify non-member access is denied.

## Test Data Plan

- [ ] Create at least one owner/adult user.
- [ ] Create one child profile.
- [ ] Create one non-member user.
- [ ] Create representative rows for Tasks, Pool, Finance, College, Home Maintenance, and Notes.
- [ ] Define expected visibility for each role.
- [ ] Define expected denied operations.

## Rollback Plan

- [ ] Keep `user_id` columns through the migration.
- [ ] Keep old policies until household policies pass verification.
- [ ] Define rollback SQL for new policies.
- [ ] Define rollback SQL for new columns if safe.
- [ ] Define data restore path from backup/export.
- [ ] Confirm rollback does not require deleting user data.

## Local Verification

- [ ] Run migration locally or in a disposable Supabase project first.
- [ ] Run backfill locally.
- [ ] Verify row counts before and after backfill.
- [ ] Verify no `household_id` remains null where required.
- [ ] Run RLS smoke tests.
- [ ] Run `pnpm run check`.
- [ ] Manually test auth, Home, Finance, Pool, Tasks, College, Quick Add, and Google Calendar connect.

## Production Deployment Sequence

- [ ] Deploy foundation tables first.
- [ ] Backfill `household_id` while retaining `user_id`.
- [ ] Deploy app compatibility update.
- [ ] Enable household RLS policies in a controlled step.
- [ ] Verify production access for owner/adult.
- [ ] Verify non-member denial.
- [ ] Monitor errors.
- [ ] Only then remove or de-emphasize old user-only policies.

## Final Go / No-Go

- [ ] Decision record accepted.
- [ ] Open decisions required for migration resolved.
- [ ] Migration SQL reviewed.
- [ ] Rollback plan reviewed.
- [ ] Local verification passed.
- [ ] Production backup confirmed.
- [ ] Deployment window approved.

