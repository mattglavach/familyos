begin;

alter table public.household_settings
  add column if not exists location jsonb not null default '{}'::jsonb,
  add column if not exists timezone text not null default 'America/New_York',
  add column if not exists dashboard_defaults jsonb not null default '{}'::jsonb;
alter table public.user_preferences
  add column if not exists dashboard_layout jsonb not null default '["brief","upcoming","status","progress"]'::jsonb,
  add column if not exists hidden_sections jsonb not null default '[]'::jsonb,
  add column if not exists pinned_sections jsonb not null default '[]'::jsonb,
  add column if not exists dashboard_density text not null default 'comfortable' check (dashboard_density in ('compact','comfortable'));

create table if not exists public.household_activity (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(), entity_type text not null,
  entity_id uuid, action text not null, title text not null, summary text not null default '', occurred_at timestamptz not null default now(),
  deep_link jsonb not null default '{}'::jsonb, metadata jsonb not null default '{}'::jsonb, idempotency_key text,
  created_at timestamptz not null default now(), unique(household_id,idempotency_key)
);
create index if not exists household_activity_household_occurred_idx on public.household_activity(household_id,occurred_at desc);
create index if not exists household_activity_household_entity_idx on public.household_activity(household_id,entity_type,entity_id);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
  entity_type text not null check (entity_type in ('task','calendar_event','pool_reading','pool_maintenance','home_asset','garden','life_item','note','accomplishment')),
  entity_id uuid not null, storage_bucket text not null default 'household-attachments', storage_path text not null unique,
  original_filename text not null, display_name text not null, mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760), category text not null default 'other',
  uploaded_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists attachments_household_entity_idx on public.attachments(household_id,entity_type,entity_id,created_at desc);

alter table public.household_activity enable row level security;
alter table public.attachments enable row level security;
grant select,insert,update,delete on public.household_activity,public.attachments to authenticated;
drop policy if exists household_activity_member_select on public.household_activity;
create policy household_activity_member_select on public.household_activity for select to authenticated using (public.familyos_is_household_member(household_id));
drop policy if exists household_activity_manager_insert on public.household_activity;
create policy household_activity_manager_insert on public.household_activity for insert to authenticated with check (user_id=auth.uid() and public.familyos_has_household_role(household_id,array['owner','adult']));
drop policy if exists attachments_member_select on public.attachments;
create policy attachments_member_select on public.attachments for select to authenticated using (public.familyos_is_household_member(household_id));
drop policy if exists attachments_manager_all on public.attachments;
create policy attachments_manager_all on public.attachments for all to authenticated using (public.familyos_has_household_role(household_id,array['owner','adult'])) with check (uploaded_by=auth.uid() and public.familyos_has_household_role(household_id,array['owner','adult']));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('household-attachments','household-attachments',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists household_attachments_select on storage.objects;
create policy household_attachments_select on storage.objects for select to authenticated using (
  bucket_id='household-attachments' and (storage.foldername(name))[1]='households' and
  public.familyos_is_household_member(((storage.foldername(name))[2])::uuid)
);
drop policy if exists household_attachments_insert on storage.objects;
create policy household_attachments_insert on storage.objects for insert to authenticated with check (
  bucket_id='household-attachments' and (storage.foldername(name))[1]='households' and
  public.familyos_has_household_role(((storage.foldername(name))[2])::uuid,array['owner','adult'])
);
drop policy if exists household_attachments_delete on storage.objects;
create policy household_attachments_delete on storage.objects for delete to authenticated using (
  bucket_id='household-attachments' and (storage.foldername(name))[1]='households' and
  public.familyos_has_household_role(((storage.foldername(name))[2])::uuid,array['owner','adult'])
);

create extension if not exists pg_trgm with schema extensions;
create index if not exists tasks_household_title_trgm_idx on public.tasks using gin(title extensions.gin_trgm_ops);
create index if not exists notes_household_title_trgm_idx on public.notes using gin(title extensions.gin_trgm_ops);
create index if not exists home_assets_household_name_trgm_idx on public.home_assets using gin(name extensions.gin_trgm_ops);

commit;
