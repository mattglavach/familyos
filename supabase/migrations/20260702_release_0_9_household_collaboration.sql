-- Release 0.9: household collaboration invitations and membership lifecycle.
--
-- This migration builds on the Release 0.6C household foundation. It adds
-- secure household invitations, expands membership statuses, and exposes
-- security-definer RPCs so invite tokens are never stored in raw form.

begin;

create extension if not exists "pgcrypto";

alter table public.household_members
  drop constraint if exists household_members_status_check,
  add constraint household_members_status_check
    check (status in ('pending', 'active', 'inactive', 'removed', 'declined'));

create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  invited_email text not null,
  invited_by uuid references auth.users(id) on delete set null,
  role text not null default 'adult',
  status text not null default 'pending',
  token_hash text not null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  declined_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_invitations_email_not_blank_check check (length(trim(invited_email)) > 0),
  constraint household_invitations_role_check check (role in ('owner', 'adult', 'teen', 'child', 'viewer')),
  constraint household_invitations_status_check check (status in ('pending', 'accepted', 'declined', 'revoked', 'expired'))
);

create unique index if not exists household_invitations_token_hash_unique
  on public.household_invitations(token_hash);

create unique index if not exists household_invitations_pending_email_unique
  on public.household_invitations(household_id, lower(invited_email))
  where status = 'pending' and revoked_at is null and accepted_at is null and declined_at is null;

create index if not exists household_invitations_household_status_idx
  on public.household_invitations(household_id, status, created_at desc);

create index if not exists household_invitations_invited_email_idx
  on public.household_invitations(lower(invited_email), status);

drop trigger if exists household_invitations_set_updated_at on public.household_invitations;
create trigger household_invitations_set_updated_at
before update on public.household_invitations
for each row execute function public.familyos_set_updated_at();

create or replace function public.familyos_invite_token_hash(invite_token text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select encode(digest(coalesce(invite_token, ''), 'sha256'), 'hex');
$$;

create or replace function public.familyos_create_household_invitation(
  target_household_id uuid,
  target_invited_email text,
  target_role text default 'adult',
  target_expires_at timestamptz default null
)
returns table (
  id uuid,
  household_id uuid,
  invited_email text,
  role text,
  status text,
  expires_at timestamptz,
  created_at timestamptz,
  invite_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(target_invited_email));
  normalized_role text := coalesce(nullif(trim(target_role), ''), 'adult');
  raw_token text := encode(gen_random_bytes(32), 'hex');
  inserted_invitation public.household_invitations%rowtype;
begin
  if not public.familyos_has_household_role(target_household_id, array['owner']) then
    raise exception 'Only household owners can invite members.';
  end if;

  if normalized_email is null or normalized_email = '' then
    raise exception 'Invitation email is required.';
  end if;

  if normalized_role not in ('adult', 'teen', 'child', 'viewer') then
    raise exception 'Invalid invitation role.';
  end if;

  insert into public.household_invitations(
    household_id,
    invited_email,
    invited_by,
    role,
    status,
    token_hash,
    expires_at
  )
  values (
    target_household_id,
    normalized_email,
    auth.uid(),
    normalized_role,
    'pending',
    public.familyos_invite_token_hash(raw_token),
    coalesce(target_expires_at, now() + interval '14 days')
  )
  returning * into inserted_invitation;

  id := inserted_invitation.id;
  household_id := inserted_invitation.household_id;
  invited_email := inserted_invitation.invited_email;
  role := inserted_invitation.role;
  status := inserted_invitation.status;
  expires_at := inserted_invitation.expires_at;
  created_at := inserted_invitation.created_at;
  invite_token := raw_token;
  return next;
end;
$$;

create or replace function public.familyos_get_household_invitation(invite_token text)
returns table (
  id uuid,
  household_id uuid,
  household_name text,
  invited_email text,
  role text,
  status text,
  expires_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  revoked_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    invitation.id,
    invitation.household_id,
    household.name as household_name,
    invitation.invited_email,
    invitation.role,
    case
      when invitation.status = 'pending' and invitation.expires_at <= now() then 'expired'
      else invitation.status
    end as status,
    invitation.expires_at,
    invitation.accepted_at,
    invitation.declined_at,
    invitation.revoked_at
  from public.household_invitations invitation
  join public.households household on household.id = invitation.household_id
  where invitation.token_hash = public.familyos_invite_token_hash(invite_token)
  limit 1;
$$;

create or replace function public.familyos_accept_household_invitation(invite_token text)
returns table (
  household_id uuid,
  membership_id uuid,
  role text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.household_invitations%rowtype;
  existing_membership public.household_members%rowtype;
  accepted_membership public.household_members%rowtype;
  user_email text;
begin
  if auth.uid() is null then
    raise exception 'Sign in before accepting this invitation.';
  end if;

  select lower(auth_user.email) into user_email
  from auth.users auth_user
  where auth_user.id = auth.uid();

  select * into invitation
  from public.household_invitations
  where token_hash = public.familyos_invite_token_hash(invite_token)
  limit 1
  for update;

  if invitation.id is null then
    raise exception 'Invitation was not found.';
  end if;

  if invitation.status <> 'pending' or invitation.revoked_at is not null then
    raise exception 'Invitation is no longer active.';
  end if;

  if invitation.expires_at <= now() then
    update public.household_invitations
    set status = 'expired'
    where id = invitation.id;
    raise exception 'Invitation has expired.';
  end if;

  if lower(invitation.invited_email) <> user_email then
    raise exception 'This invitation is for a different email address.';
  end if;

  select * into existing_membership
  from public.household_members hm
  where hm.household_id = invitation.household_id
    and hm.user_id = auth.uid()
  order by hm.created_at desc
  limit 1
  for update;

  if existing_membership.id is null then
    insert into public.household_members(household_id, user_id, role, status)
    values (invitation.household_id, auth.uid(), invitation.role, 'active')
    returning * into accepted_membership;
  else
    update public.household_members hm
    set role = case when existing_membership.role = 'owner' then existing_membership.role else invitation.role end,
        status = 'active',
        updated_at = now()
    where hm.id = existing_membership.id
    returning * into accepted_membership;
  end if;

  update public.household_invitations invitation_row
  set status = 'accepted',
      accepted_at = now()
  where invitation_row.id = invitation.id;

  insert into public.user_preferences(user_id, default_household_id)
  values (auth.uid(), invitation.household_id)
  on conflict (user_id) do update
  set default_household_id = excluded.default_household_id,
      updated_at = now();

  household_id := accepted_membership.household_id;
  membership_id := accepted_membership.id;
  role := accepted_membership.role;
  status := accepted_membership.status;
  return next;
end;
$$;

create or replace function public.familyos_decline_household_invitation(invite_token text)
returns table (
  id uuid,
  status text,
  declined_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.household_invitations%rowtype;
  user_email text;
begin
  if auth.uid() is null then
    raise exception 'Sign in before declining this invitation.';
  end if;

  select lower(auth_user.email) into user_email
  from auth.users auth_user
  where auth_user.id = auth.uid();

  select * into invitation
  from public.household_invitations
  where token_hash = public.familyos_invite_token_hash(invite_token)
  limit 1
  for update;

  if invitation.id is null then
    raise exception 'Invitation was not found.';
  end if;

  if lower(invitation.invited_email) <> user_email then
    raise exception 'This invitation is for a different email address.';
  end if;

  update public.household_invitations invitation_row
  set status = 'declined',
      declined_at = now()
  where invitation_row.id = invitation.id
    and invitation_row.status = 'pending'
  returning invitation_row.id, invitation_row.status, invitation_row.declined_at
  into id, status, declined_at;

  return next;
end;
$$;

revoke all on function public.familyos_invite_token_hash(text) from public;
revoke all on function public.familyos_create_household_invitation(uuid, text, text, timestamptz) from public;
revoke all on function public.familyos_get_household_invitation(text) from public;
revoke all on function public.familyos_accept_household_invitation(text) from public;
revoke all on function public.familyos_decline_household_invitation(text) from public;

grant execute on function public.familyos_create_household_invitation(uuid, text, text, timestamptz) to authenticated;
grant execute on function public.familyos_get_household_invitation(text) to authenticated;
grant execute on function public.familyos_accept_household_invitation(text) to authenticated;
grant execute on function public.familyos_decline_household_invitation(text) to authenticated;

revoke all on table public.household_invitations from public;
revoke all on table public.household_invitations from anon;
revoke all on table public.household_invitations from authenticated;

grant select (
  id,
  household_id,
  invited_email,
  invited_by,
  role,
  status,
  expires_at,
  accepted_at,
  declined_at,
  revoked_at,
  created_at,
  updated_at
) on public.household_invitations to authenticated;

grant update (status, revoked_at, updated_at) on public.household_invitations to authenticated;

alter table public.household_invitations enable row level security;

drop policy if exists "household_invitations_select_manager" on public.household_invitations;
create policy "household_invitations_select_manager"
on public.household_invitations
for select
to authenticated
using (public.familyos_has_household_role(household_id, array['owner']));

drop policy if exists "household_invitations_update_manager" on public.household_invitations;
create policy "household_invitations_update_manager"
on public.household_invitations
for update
to authenticated
using (public.familyos_has_household_role(household_id, array['owner']))
with check (public.familyos_has_household_role(household_id, array['owner']));

commit;
