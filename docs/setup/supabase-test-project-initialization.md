# Blank Supabase test-project initialization

This is the authoritative repository-controlled procedure for initializing a new dedicated non-production Supabase project to current FamilyOS production parity: Release 3.2.0 and 25 migration-history versions. It never seeds demo data automatically. Never use production credentials or a project containing real household data.

## Final baseline model

The executable chain has three parts:

1. Apply `supabase/schema.sql` once as the legacy baseline.
2. Apply the 23 approved migrations from `20260701000000` through `20260714030000` in manifest order.
3. Record the two non-executed historical versions only after their replacement condition is satisfied, producing the 25-version production-aligned ledger.

`supabase/approved-migrations.json` is the machine-readable source of truth shared by the initializer and verifier. It distinguishes 23 executable migrations from two history-only files. The history-only entries are never executed.

### Baseline comparison and decision

`20260626000000_baseline_schema.sql` is classified as fully redundant after `schema.sql` and is excluded from execution.

| Object category | `schema.sql` | Historical baseline migration | Decision |
| --- | --- | --- | --- |
| Schemas | Uses existing Supabase `public` and `auth`; creates no schema | Same | Duplicate |
| Extensions | Creates `pgcrypto` if absent | Same | Duplicate |
| Tables | Creates all 21 historical legacy tables | Creates the same 21 tables | Duplicate |
| Columns | Contains every historical column plus later canonical Pool columns | Historical column set only | `schema.sql` is the superset |
| Constraints | Primary keys and current baseline constraints | Historical primary keys/constraints | Covered by `schema.sql` |
| Indexes | Creates each legacy `user_id` index | Same | Duplicate |
| Functions | None | None | No difference |
| Triggers | None | None | No difference |
| Grants | Grants authenticated CRUD for every legacy table | Same | Duplicate after baseline correction |
| RLS enablement | Enables RLS for every legacy table | Same | Duplicate |
| RLS policies | Recreates `familyos_user_all`; includes a conditional later collaboration overlay | Recreates `familyos_user_all` | Historical policy is covered |
| Storage | None | None | No difference |

The historical baseline version is recorded after `schema.sql` succeeds, but its SQL is not applied. This is deliberate baseline squashing, not a claim that the historical file ran.

### Household foundation reconciliation

`20260627000000_household_foundation.sql` and `20260701010000_release_0_6c_household_foundation.sql` are different files, not a rename.

- `20260627000000` was created as a local-only draft. It introduced profiles, households, people, memberships, an internal bootstrap map, household columns, bootstrap/backfill, helper functions, and early RLS.
- `20260701010000` is the production-ready Release 0.6C implementation. It deliberately converts the same model into the supported production design, adding settings/preferences, structured task metadata, the durable auth-user bootstrap trigger, stronger pre/postflight checks, and final household policies.
- Both create overlapping household/profile/membership/bootstrap objects. Executing both would apply competing implementations of the same foundation.
- The local draft is therefore excluded from execution and its history version is recorded only after `20260701010000` succeeds.

The preceding production migration `20260701000000_release_0_6c_auth_ownership_baseline.sql` now depends directly on `schema.sql`. It prepares legacy ownership and policies before the canonical household foundation.

## Production migration reconciliation

`Execute` means the SQL runs. `History only` means the file remains immutable and its production version is recorded only after its replacement has succeeded.

| # | Migration | Release | Treatment | Objects or changes | Blank safety and dependency | Production version |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `20260626000000_baseline_schema.sql` | Baseline | History only | Legacy tables, user ownership, RLS | Fully covered by `schema.sql` | `20260626000000` |
| 2 | `20260627000000_household_foundation.sql` | 0.6 local draft | History only | Draft household/profile/member/bootstrap model | Superseded by `20260701010000` | `20260627000000` |
| 3 | `20260701000000_release_0_6c_auth_ownership_baseline.sql` | 0.6C | Execute | Legacy ownership columns, indexes, policies, grants | Empty-row safeguards; requires `schema.sql` | `20260701000000` |
| 4 | `20260701010000_release_0_6c_household_foundation.sql` | 0.6C | Execute | Canonical households, profiles, people, memberships, settings, preferences, Auth bootstrap | Guarded empty backfills; requires #3 | `20260701010000` |
| 5 | `20260701020000_release_0_8_calendar_connections.sql` | 0.8 | Execute | Calendar connections and household RLS | Additive; requires #4 | `20260701020000` |
| 6 | `20260702000000_release_0_9_household_collaboration.sql` | 0.9 | Execute | Invitations, invitation RPCs, policies | Additive; requires #4 | `20260702000000` |
| 7 | `20260702010000_release_1_1_life_lists.sql` | 1.1 | Execute | Life lists/items | Additive; requires #4 | `20260702010000` |
| 8 | `20260702020000_release_1_2_shopping.sql` | 1.2 | Execute | Shopping, category, pantry tables | Additive; requires #4 | `20260702020000` |
| 9 | `20260702030000_release_1_3_meal_planning.sql` | 1.3 | Execute | Meal plans, recipes, ingredients, assignments | Additive; requires #8 | `20260702030000` |
| 10 | `20260703000000_bootstrap_pool_action_audits.sql` | 1.4 compatibility | Execute | Canonical text-keyed Pool action audit | Additive; requires baseline Pool readings | `20260703000000` |
| 11 | `20260703010000_release_1_4_pool_care_assistant.sql` | 1.4 | Execute | Pool equipment/audits, fields, policies | Guarded columns; requires #4 and #10 | `20260703010000` |
| 12 | `20260711000000_release_1_7_pool_operations.sql` | 1.7 | Execute | Pool profiles and operational fields | Additive; requires #11 | `20260711000000` |
| 13 | `20260712000000_release_2_2_pool_optional_text_nulls.sql` | 2.2 | Execute | Optional Pool text nullability | Empty-safe alteration; requires #12 | `20260712000000` |
| 14 | `20260712010000_release_2_2_pool_schema_reconciliation.sql` | 2.2 | Execute | Corrective Pool schema reconciliation | Catalog-guarded; requires #12/#13 | `20260712010000` |
| 15 | `20260712020000_release_2_3_daily_operations.sql` | 2.3 | Execute | Habits, routines, notification state, Pool history/RPC | Additive; requires #4/#14 | `20260712020000` |
| 16 | `20260712030000_release_2_4_smart_planning.sql` | 2.4 | Execute | Planning metadata and completion indexes | Defaults; requires #15 | `20260712030000` |
| 17 | `20260712040000_release_2_5_proactive_planning.sql` | 2.5 | Execute | Brief schedules/history, notification preferences, templates | Additive; requires #15 | `20260712040000` |
| 18 | `20260712050000_release_2_6_habit_actions.sql` | 2.6 | Execute | Habit actions/history | Additive; requires #15 | `20260712050000` |
| 19 | `20260712060000_release_2_8_family_intelligence.sql` | 2.8 | Execute | Home assets/history and module metadata | Conditional additions; requires #8/#15 | `20260712060000` |
| 20 | `20260713000000_release_2_9_unified_context.sql` | 2.9 | Execute | Activity, attachments, search, private Storage bucket/policies | Additive; requires #4/#19 and hosted Storage | `20260713000000` |
| 21 | `20260713010000_release_2_10_core_experience.sql` | 2.10 | Execute | Habit/routine metadata, constraints, indexes | Defaults; requires #15/#18 | `20260713010000` |
| 22 | `20260714000000_release_2_10_1_routine_lifecycle.sql` | 2.10.1 | Execute | Routine lifecycle status | Guarded backfill; requires #21 | `20260714000000` |
| 23 | `20260714010000_release_3_1_relationship_os.sql` | 3.1.0 | Execute | Relationships, goals, activities, indexes, triggers, RLS | Additive; requires #4 | `20260714010000` |
| 24 | `20260714020000_release_3_1_relationship_security_hardening.sql` | 3.1.0 | Execute | Anonymous denial and authenticated grants | Privilege-only; requires #23 | `20260714020000` |
| 25 | `20260714030000_release_3_2_ai_planning.sql` | 3.2.0 | Execute | AI preferences, recommendations, proposed actions, feedback, indexes, RLS | Transactional, additive, no backfill; requires #4/#24 | `20260714030000` |

The Release 3.2 migration is safe on a blank Supabase project after the earlier household migration. It is transactional, additive, performs no backfill, uses no environment-specific values, applies household/user foreign keys, enables RLS, grants authenticated CRUD, and revokes `anon` and `public`. It creates required `updated_at` columns but does not create updated-at triggers or database functions; callers update those timestamps under the existing application contract.

## Why `supabase db push` is not used

`db push` follows hidden CLI linkage and the raw migration directory. It cannot express the manifest's two history-only files, does not apply `schema.sql` as the authoritative baseline, and could execute the superseded household draft. The guarded scripts use the manifest and exact database URL instead. They never link, unlink, push, reset, or seed.

## Required test-only environment

Store these values in ignored `.env.test.local`. The scripts load missing process variables without printing them.

```text
TEST_SUPABASE_PROJECT_REF=<exact-20-character-test-project-ref>
TEST_SUPABASE_DB_URL=<test-project-postgresql-connection-url>
FAMILYOS_ENV=test
SUPABASE_URL=https://<same-test-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<test-only-service-role-key>
DEMO_SEED_ALLOW_REMOTE_TEST=true
DEMO_SEED_EXPECTED_PROJECT_REF=<same-test-project-ref>
```

The PostgreSQL URL may be direct or use the Supabase pooler username `postgres.<ref>`. The initializer derives that reference and requires it to match both configured and operator-supplied references. It rejects the documented production reference and never prints the URL.

## Linkage safety

The ignored `supabase/.temp` metadata currently points to production. The initializer does not read or use it. Before any future link-sensitive CLI command, independently verify the dedicated test project in the dashboard and manually remove the stale link:

```powershell
cd "C:\Users\Matt Glavach\Documents\Codex\familyos"
pnpm dlx supabase unlink
pnpm dlx supabase link --project-ref <exact-test-project-ref>
```

If ignored metadata remains after unlinking, remove only `supabase/.temp/project-ref` and `supabase/.temp/linked-project.json`. Linking is not required for the initializer.

## Commands

Disposable local execution, with an isolated PostgreSQL cluster bound only to `127.0.0.1`:

```powershell
cd "C:\Users\Matt Glavach\Documents\Codex\familyos"
pnpm run db:test:validate-local
```

This command generates temporary local credentials, creates a uniquely named disposable database, applies the actual repository initializer, runs the verifier and transactional Auth-bootstrap check, and removes the entire cluster. It never imports `TEST_SUPABASE_DB_URL`, reads Supabase linkage, seeds data, or invokes the Supabase CLI.

Dry run, with no database connection:

```powershell
cd "C:\Users\Matt Glavach\Documents\Codex\familyos"
pnpm run db:test:init -- -ConfirmTestProject -ExpectedProjectRef <exact-test-project-ref> -DryRun
```

Future initialization of a newly created empty test project:

```powershell
cd "C:\Users\Matt Glavach\Documents\Codex\familyos"
pnpm run db:test:init -- -ConfirmTestProject -ExpectedProjectRef <exact-test-project-ref>
```

Independent read-only verification:

```powershell
cd "C:\Users\Matt Glavach\Documents\Codex\familyos"
pnpm run db:test:verify -- -ConfirmTestProject -ExpectedProjectRef <exact-test-project-ref>
```

Only after both pass, verify the separate seed target and run:

```powershell
cd "C:\Users\Matt Glavach\Documents\Codex\familyos"
pnpm run seed:demo
```

## Verification and safeguards

The verifier checks all 25 production history versions, all Release 3.2 tables, required household/user columns, updated-at columns, indexes, RLS, household-scoped policies, authenticated CRUD, anonymous denial, Auth bootstrap, private attachment Storage, earlier module structures, and absence of demo data. It queries only catalogs and existence, never household content.

The initializer requires explicit confirmation, exact reference matching, a valid PostgreSQL Supabase URL, required files, `psql`, and an empty FamilyOS database unless an exceptional override is supplied. Each file runs separately with `ON_ERROR_STOP=1`. The demo seed and Supabase CLI are never invoked.

### Local executable validation

The full chain was executed successfully on 2026-07-15 against a fresh isolated PostgreSQL 18.4 cluster. The baseline, all 23 executable migrations, both history-only ledger entries, 25-version verifier, empty-data assertions, private Storage-bucket compatibility checks, and transactional Auth bootstrap behavior passed. The temporary database and cluster were then removed.

The local harness supplies only the minimal Auth and Storage catalog compatibility objects required by the SQL. It does not reproduce the complete hosted Supabase Auth, Storage API, Realtime, Edge Function, SMTP, OAuth, or dashboard configuration. Those hosted services still require the manual test-project configuration below.

`pnpm run test:db-reconciliation` remains the fast static manifest and dependency gate. `pnpm run db:test:validate-local` is the executable blank-database proof.

## Manual dashboard configuration

- Auth URL Configuration: set the local FamilyOS Site URL and exact local redirect/callback allowlist.
- Auth Providers: enable only the providers required by the test plan; email/password must support the demo identity.
- Storage: confirm `household-attachments` exists and is private after migration.
- Never reuse production OAuth, SMTP, database, service-role, user, or redirect configuration.

## Partial initialization recovery

The full chain is not one cross-file transaction. On failure, record only the filename and sanitized error. The safest recovery is to delete and recreate the disposable test project in the dashboard, update its ignored test-only values, rerun dry-run, and initialize again. Do not use `db reset`, `db push`, or another environment as a shortcut.

`-AllowNonEmptyTestDatabase` is only for an administrator-reviewed recovery on the independently verified test target. It is not a normal rerun option.

## Future migrations

1. Add the immutable migration and validate blank-project and supported-upgrade dependencies.
2. Add one ordered manifest entry with release, dependency, data, environment-value, and blank-safety metadata.
3. Update the latest release/file, history and execution counts, and verification objects.
4. Run `pnpm run test:db-init-safety` plus the repository database gates.
5. Never rewrite or delete historical migration files.

The long-term simplification is a formally approved CLI-native squashed baseline whose version ledger is created without manual history reconciliation. Until then, this manifest-driven baseline model is the single supported blank-project process.
