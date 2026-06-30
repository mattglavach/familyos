-- Tasks household-aware RLS.
--
-- Local-first migration for the household foundation rollout. Tasks is the
-- first module policy migrated because the app now reads and inserts tasks
-- with household_id while keeping legacy user_id populated.
--
-- Transitional fallback:
-- - Rows with household_id are accessible to authenticated owner/adult members
--   of that household.
-- - Legacy rows with household_id null remain accessible only to the original
--   user_id owner.
--
-- The fallback can be removed after all existing task rows are backfilled with
-- household_id, Tasks UI has been validated in production, and legacy user_id
-- ownership is no longer needed for compatibility.

alter table public.tasks enable row level security;

drop policy if exists "familyos_user_all" on public.tasks;
drop policy if exists "tasks_select_household_or_legacy" on public.tasks;
drop policy if exists "tasks_insert_household_or_legacy" on public.tasks;
drop policy if exists "tasks_update_household_or_legacy" on public.tasks;
drop policy if exists "tasks_delete_household_or_legacy" on public.tasks;

create policy "tasks_select_household_or_legacy"
on public.tasks
for select
to authenticated
using (
  (
    household_id is not null
    and public.familyos_has_household_role(household_id, array['owner', 'adult'])
  )
  or (
    household_id is null
    and user_id = auth.uid()
  )
);

create policy "tasks_insert_household_or_legacy"
on public.tasks
for insert
to authenticated
with check (
  (
    household_id is not null
    and public.familyos_has_household_role(household_id, array['owner', 'adult'])
  )
  or (
    household_id is null
    and user_id = auth.uid()
  )
);

create policy "tasks_update_household_or_legacy"
on public.tasks
for update
to authenticated
using (
  (
    household_id is not null
    and public.familyos_has_household_role(household_id, array['owner', 'adult'])
  )
  or (
    household_id is null
    and user_id = auth.uid()
  )
)
with check (
  (
    household_id is not null
    and public.familyos_has_household_role(household_id, array['owner', 'adult'])
  )
  or (
    household_id is null
    and user_id = auth.uid()
  )
);

create policy "tasks_delete_household_or_legacy"
on public.tasks
for delete
to authenticated
using (
  (
    household_id is not null
    and public.familyos_has_household_role(household_id, array['owner', 'adult'])
  )
  or (
    household_id is null
    and user_id = auth.uid()
  )
);
