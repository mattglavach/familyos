begin;

revoke all on table public.relationships from anon;
revoke all on table public.relationship_goals from anon;
revoke all on table public.relationship_activities from anon;

grant select,insert,update,delete on table public.relationships to authenticated;
grant select,insert,update,delete on table public.relationship_goals to authenticated;
grant select,insert,update,delete on table public.relationship_activities to authenticated;

commit;
