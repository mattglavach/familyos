import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const migration=await readFile("supabase/migrations/20260712040000_release_2_5_proactive_planning.sql","utf8");
const fixtureId="release-2-5-upgrade-fixture";
const user1="25000000-0000-0000-0000-000000000001",user2="25000000-0000-0000-0000-000000000002",house1="25000000-0000-0000-0000-000000000011",house2="25000000-0000-0000-0000-000000000012";
const sql=`
delete from public.tasks where id='${fixtureId}';
insert into public.tasks(id,title,completed) values('${fixtureId}','Preserved pre-2.5 task',false);
${migration}
do $$ begin
 if not exists(select 1 from public.tasks where id='${fixtureId}' and title='Preserved pre-2.5 task') then raise exception 'Existing task was not preserved'; end if;
 if to_regclass('public.brief_schedules') is null or to_regclass('public.routine_templates') is null then raise exception 'Release 2.5 tables missing'; end if;
 if not exists(select 1 from pg_indexes where indexname='brief_generation_scheduled_period_unique') then raise exception 'Release 2.5 idempotency protection missing'; end if;
end $$;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('${user1}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','release25-a@example.test','',now(),'{}','{}',now(),now()),('${user2}','00000000-0000-0000-0000-000000000000','authenticated','authenticated','release25-b@example.test','',now(),'{}','{}',now(),now()) on conflict(id) do nothing;
insert into public.households(id,name,created_by_user_id) values('${house1}','Release 25 A','${user1}'),('${house2}','Release 25 B','${user2}') on conflict(id) do nothing;
insert into public.household_members(household_id,user_id,role,status) values('${house1}','${user1}','owner','active'),('${house2}','${user2}','owner','active') on conflict do nothing;
insert into public.brief_schedules(household_id,user_id,brief_type,preferred_time) values('${house1}','${user1}','morning','07:00'),('${house2}','${user2}','morning','08:00') on conflict do nothing;
set role authenticated; select set_config('request.jwt.claim.sub','${user1}',false);
do $$ begin
 if (select count(*) from public.brief_schedules) <> 1 then raise exception 'RLS household isolation failed'; end if;
 if not exists(select 1 from public.brief_schedules where household_id='${house1}') then raise exception 'RLS own-row access failed'; end if;
end $$;
reset role;
delete from public.households where id in ('${house1}','${house2}'); delete from auth.users where id in ('${user1}','${user2}');
delete from public.tasks where id='${fixtureId}';`;
const result=spawnSync("docker",["exec","-i","supabase_db_familyos","psql","-U","postgres","-d","postgres","-v","ON_ERROR_STOP=1"],{input:sql,stdio:["pipe","inherit","inherit"]});
if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1);
console.log("FamilyOS Release 2.5 upgrade path, existing-data preservation, and household RLS isolation validated.");
