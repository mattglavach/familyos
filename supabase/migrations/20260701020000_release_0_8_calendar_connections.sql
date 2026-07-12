-- Release 0.8: secure Google Calendar connection foundation.
--
-- This migration adds household-scoped calendar connection metadata and
-- server-only token storage placeholders. It does not apply a production OAuth
-- connection and does not migrate existing browser-local Google tokens.

begin;

create extension if not exists "pgcrypto";

create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  provider text not null default 'google',
  provider_account_email text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expiry timestamptz,
  scopes text[] not null default array[]::text[],
  connection_status text not null default 'pending',
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint calendar_connections_provider_check check (provider in ('google')),
  constraint calendar_connections_status_check
    check (connection_status in ('pending', 'connected', 'needs_reauth', 'error', 'revoked')),
  constraint calendar_connections_account_email_check
    check (provider_account_email is null or length(trim(provider_account_email)) > 0)
);

create index if not exists calendar_connections_household_id_idx
  on public.calendar_connections(household_id);
create index if not exists calendar_connections_user_id_idx
  on public.calendar_connections(user_id);
create index if not exists calendar_connections_household_provider_idx
  on public.calendar_connections(household_id, provider);
create index if not exists calendar_connections_user_provider_status_idx
  on public.calendar_connections(user_id, provider, connection_status);
create index if not exists calendar_connections_last_sync_at_idx
  on public.calendar_connections(last_sync_at desc);

create unique index if not exists calendar_connections_active_provider_account_unique
  on public.calendar_connections(household_id, user_id, provider, coalesce(provider_account_email, ''))
  where revoked_at is null;

drop trigger if exists calendar_connections_set_updated_at on public.calendar_connections;
create trigger calendar_connections_set_updated_at
before update on public.calendar_connections
for each row execute function public.familyos_set_updated_at();

revoke all on public.calendar_connections from authenticated;
grant select (
  id,
  user_id,
  household_id,
  provider,
  provider_account_email,
  token_expiry,
  scopes,
  connection_status,
  last_sync_at,
  created_at,
  updated_at,
  revoked_at
) on public.calendar_connections to authenticated;
grant insert (
  user_id,
  household_id,
  provider,
  provider_account_email,
  token_expiry,
  scopes,
  connection_status,
  last_sync_at,
  revoked_at
) on public.calendar_connections to authenticated;
grant update (
  provider_account_email,
  token_expiry,
  scopes,
  connection_status,
  last_sync_at,
  revoked_at
) on public.calendar_connections to authenticated;

alter table public.calendar_connections enable row level security;

drop policy if exists "calendar_connections_select_member" on public.calendar_connections;
create policy "calendar_connections_select_member"
on public.calendar_connections
for select
to authenticated
using (
  user_id = auth.uid()
  and public.familyos_is_household_member(household_id)
);

drop policy if exists "calendar_connections_insert_self_manager" on public.calendar_connections;
create policy "calendar_connections_insert_self_manager"
on public.calendar_connections
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.familyos_can_manage_household(household_id)
);

drop policy if exists "calendar_connections_update_self_manager" on public.calendar_connections;
create policy "calendar_connections_update_self_manager"
on public.calendar_connections
for update
to authenticated
using (
  user_id = auth.uid()
  and public.familyos_can_manage_household(household_id)
)
with check (
  user_id = auth.uid()
  and public.familyos_can_manage_household(household_id)
);

commit;
