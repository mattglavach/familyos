begin;

alter table public.routines
  add column if not exists status text not null default 'active';

update public.routines
set status = 'archived'
where archived = true and status = 'active';

alter table public.routines
  drop constraint if exists routines_status_check;
alter table public.routines
  add constraint routines_status_check check (status in ('active', 'paused', 'archived'));

create index if not exists routines_household_status_idx
  on public.routines(household_id, status, archived, recurrence);

commit;
