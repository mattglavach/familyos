# Local Supabase Setup Plan

Setup review date: 2026-06-28

## Current Local Environment Status

Branch confirmed:

```text
feature/household-foundation
```

Worktree status before creating this document:

```text
clean
```

Local Supabase status: **not ready**.

The repository now has a migration file at:

- `supabase/migrations/20260627_household_foundation.sql`

But the local Supabase runtime and project configuration are not available yet.

## Project Tooling Review

### `package.json`

Available scripts:

- `pnpm start`
- `pnpm run build`
- `pnpm run lint`
- `pnpm run check`

There are no Supabase-specific package scripts.

### README Setup

`README.md` currently describes a dashboard/manual Supabase workflow:

- create a Supabase project,
- run `supabase/schema.sql` in the Supabase SQL editor,
- manually create auth users,
- optionally run `supabase/backfill-user-id.sql`,
- optionally run `supabase/seed.sql`.

It does not yet document Supabase CLI local development.

### Environment Example

`.env.example` includes browser-facing Supabase settings:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

The current `.env.local` path exists as a **directory**, not a normal `.env.local` file. That should be reviewed before local app validation.

### Current `supabase/` Directory

Current contents:

- `supabase/schema.sql`
- `supabase/seed.sql`
- `supabase/backfill-user-id.sql`
- `supabase/migrations/20260627_household_foundation.sql`

Missing:

- `supabase/config.toml`

## Missing Tools / Local Blockers

The following tools were not found on `PATH`:

- Supabase CLI: `supabase`
- Docker CLI / Docker Desktop: `docker`
- PostgreSQL client: `psql`

Because these tools are missing and `supabase/config.toml` is absent, local Supabase cannot be safely initialized or started from this environment during this task.

No Supabase CLI command was run. No remote project was linked. No migration was applied.

## Required Install / Setup Steps For Windows

These are manual setup steps. Run them outside Codex only if you approve installing local tooling.

### 1. Install Docker Desktop

Supabase local development requires Docker.

Manual options:

```powershell
winget install Docker.DockerDesktop
```

Then:

- Start Docker Desktop.
- Confirm WSL 2 integration if prompted.
- Restart PowerShell.
- Verify:

```powershell
docker --version
docker ps
```

### 2. Install Supabase CLI

Manual option with Scoop:

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Manual option with npm/pnpm if preferred:

```powershell
pnpm add -g supabase
```

Verify:

```powershell
supabase --version
```

### 3. Install PostgreSQL Client Tools

`psql` is useful for local validation queries.

Manual option:

```powershell
winget install PostgreSQL.PostgreSQL
```

Verify:

```powershell
psql --version
```

### 4. Fix `.env.local`

Review the existing `.env.local` directory. The app expects `.env.local` to be a file copied from `.env.example`.

Do not delete anything blindly. First inspect why `.env.local` is a directory. If it is accidental and empty, replace it with a file:

```powershell
Copy-Item .env.example .env.local
```

For local Supabase, the eventual values should point to the local API URL and local anon key returned by `supabase start`, not production.

## Safe Local-Only Setup Sequence

After required tools are installed:

1. Confirm branch:

   ```powershell
   git branch --show-current
   ```

2. Confirm clean worktree:

   ```powershell
   git status -sb
   ```

3. Initialize local Supabase config only if `supabase/config.toml` is still missing:

   ```powershell
   supabase init
   ```

   Do not run `supabase link`.

4. Start local Supabase:

   ```powershell
   supabase start
   ```

5. Confirm local services are running:

   ```powershell
   supabase status
   ```

6. Update `.env.local` with local Supabase URL and anon key from `supabase status`.

7. Stop before applying `supabase/migrations/20260627_household_foundation.sql`.

## Commands That Must Not Be Run Against Production

Do not run these until production readiness is explicitly approved:

```powershell
supabase link
supabase db push
supabase db pull
supabase migration up --linked
supabase db reset --linked
psql "<production connection string>" -f supabase/migrations/20260627_household_foundation.sql
```

Do not paste `supabase/migrations/20260627_household_foundation.sql` into the Supabase production SQL editor.

## Readiness Checklist Before Applying Migration Locally

- [ ] `docker --version` works.
- [ ] `docker ps` works.
- [ ] `supabase --version` works.
- [ ] `supabase/config.toml` exists.
- [ ] `supabase status` confirms local services only.
- [ ] The project is not linked to production.
- [ ] `.env.local` is a file, not a directory.
- [ ] `.env.local` points to local Supabase values.
- [ ] Worktree is clean.
- [ ] Branch is `feature/household-foundation`.
- [ ] Local database is disposable or backed up.
- [ ] `supabase/migrations/20260627_household_foundation.sql` has been reviewed immediately before apply.

## Local Service Status

Not started.

Reason: local prerequisites are missing. Starting Supabase locally would require Supabase CLI and Docker, neither of which is available on `PATH`.

## Next Recommended Prompt

```text
Family OS household foundation: verify local Supabase tooling after manual installation.

Current branch:
feature/household-foundation

Do not apply the household migration yet.
Do not link to production Supabase.
Do not run remote Supabase commands.
Do not update app queries.

Tasks:
1. Confirm Docker, Supabase CLI, and psql are installed.
2. Confirm `.env.local` is a file or document why it is still a directory.
3. Run `supabase init` only if `supabase/config.toml` is still missing.
4. Start local Supabase only if it is clearly local and unlinked.
5. Do not apply `20260627_household_foundation.sql` yet.
6. Document local service status.
```

## Verification

- No migration was applied.
- No Supabase commands were run.
- No production connection was made.
- No remote Supabase project was linked.
- No app query changes were made.
