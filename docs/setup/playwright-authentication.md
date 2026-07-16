# Playwright Authentication Setup

This guide configures authenticated FamilyOS browser tests against a dedicated non-production Supabase project. Never use production credentials, production users, or a project containing production household data.

## One-time test project setup

Use `docs/setup/supabase-test-project-initialization.md` as the authoritative blank-project procedure. It defines the Release 3.2.0 manifest, baseline/history-only treatment, guarded initialization, and post-schema verification.

1. Confirm the target is a dedicated test project. Pin its exact reference in `DEMO_SEED_EXPECTED_PROJECT_REF`; do not hard-code a rotating test-project reference in test code.
2. For an empty project, run the guarded initializer. Do not apply every file in `supabase/migrations/` blindly; the historical baseline migration is redundant and the older household foundation is a superseded local-only draft.
3. In Supabase Project Settings > API, copy the project URL and browser-safe anonymous/publishable key. Never put the service-role key in a `REACT_APP_*` variable.
4. Put the variables below in gitignored `.env.test.local`.
5. Run `pnpm run seed:demo`. The guarded seed verifies the exact target before creating an admin client, then creates a confirmed dedicated user and deterministic demo household.

Before remote work, run the offline reconciliation and safeguard gates:

```powershell
pnpm run test:db-reconciliation
pnpm run test:db-init-safety
```

Repository migrations use unique 14-digit versions, but filename order alone is not the initialization contract. The guarded initializer consumes the manifest, applies `schema.sql`, skips the two history-only files, and stops on the first SQL error.

## Required `.env.test.local` variables

```text
FAMILYOS_ENV=test
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
PLAYWRIGHT_SKIP_WEBSERVER=false
REACT_APP_SUPABASE_URL=https://<test-project-ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<test-project anonymous or publishable key>
REACT_APP_APPROVED_HOUSEHOLD_EMAILS=test@familyos.app
DEMO_USER_EMAIL=test@familyos.app
DEMO_USER_PASSWORD=<strong test-only password>
SUPABASE_URL=https://<test-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<test-project service-role key>
DEMO_SEED_ALLOW_REMOTE_TEST=true
DEMO_SEED_EXPECTED_PROJECT_REF=<test-project-ref>
```

`PLAYWRIGHT_BASE_URL` defaults to the loopback value shown. `PLAYWRIGHT_SKIP_WEBSERVER=true` is only for an already-running approved target. `REACT_APP_DEMO_*` variables are optional localhost auto-login settings; Playwright does not use them.

## Read-only verification SQL

Run only in the dedicated test project's SQL editor:

```sql
select id, email, email_confirmed_at, created_at
from auth.users
where lower(email) = lower('test@familyos.app');

select
  p.id as user_id, p.email, hm.household_id, h.name as household_name,
  hm.role, hm.status, up.default_household_id
from public.profiles p
left join public.household_members hm on hm.user_id = p.id
left join public.households h on h.id = hm.household_id
left join public.user_preferences up on up.user_id = p.id
where lower(p.email) = lower('test@familyos.app');
```

Expected: one confirmed auth user, one profile, and one `active` `owner` membership whose household matches `default_household_id`.

## Non-production repair SQL

Do not insert directly into `auth.users`. Prefer `pnpm run seed:demo`. If an administrator must repair an existing confirmed test identity, first verify both IDs, replace the placeholders, and run only in the dedicated test project:

```sql
begin;

insert into public.profiles (id, email, display_name)
values ('<test-user-uuid>'::uuid, 'test@familyos.app', 'Alex Demo')
on conflict (id) do update
set email = excluded.email, display_name = excluded.display_name;

insert into public.household_members (household_id, user_id, role, status)
values ('<verified-test-household-uuid>'::uuid, '<test-user-uuid>'::uuid, 'owner', 'active')
on conflict (household_id, user_id) where user_id is not null and status = 'active'
do update set role = excluded.role, status = excluded.status;

insert into public.user_preferences (user_id, default_household_id)
values ('<test-user-uuid>'::uuid, '<verified-test-household-uuid>'::uuid)
on conflict (user_id) do update
set default_household_id = excluded.default_household_id;

commit;
```

## Run and troubleshoot

```powershell
cd "C:\Users\Matt Glavach\Documents\Codex\familyos"
pnpm run seed:demo
pnpm run test:smoke
pnpm run test:smoke:desktop
pnpm run test:smoke:mobile
pnpm run test:regression
```

Every run recreates `tests/e2e/.auth/user.json`. It contains session material, is gitignored, and must never be shared. Desktop and mobile consume the same fresh state.

- Use an API origin such as `https://<ref>.supabase.co`, never a Supabase Dashboard URL.
- Missing variables, allowlist conflicts, and project mismatches fail before browser launch.
- `Could not find the table ... in the schema cache` means migrations are absent or PostgREST has not refreshed.
- `Invalid login credentials` means the dedicated user/password is missing or stale in the configured project; rerun the guarded seed.
- `No active household` means `household_members.status` or `user_preferences.default_household_id` is invalid.
- Failed runs retain trace, screenshot, and video in `test-results/`; setup also counts console errors and failed auth/household requests without logging credentials.
