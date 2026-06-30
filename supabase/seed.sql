-- Optional starter data.
--
-- 1. Sign in once through the app so Supabase creates your auth user.
-- 2. In Supabase Authentication > Users, copy that user's UUID.
-- 3. Replace the UUID below, then run this file in the SQL editor.

do $$
declare
  seed_user_id uuid := '00000000-0000-0000-0000-000000000000';
begin
  if seed_user_id = '00000000-0000-0000-0000-000000000000' then
    raise notice 'Skipping optional starter data. Replace seed_user_id with your Supabase auth user UUID before running seed.sql manually.';
    return;
  end if;

  insert into public.pool_readings (id,user_id,date,logged_at,ph,free_chlorine,cc,salt,cya,alkalinity,notes) values
    ('7',seed_user_id,'2026-06-17','2026-06-17T18:30:00Z',8.0,5.5,0,3350,60,90,'K-2006: 11 drops FC. Acid added 2 days prior. TA 90 ppm.'),
    ('6',seed_user_id,'2026-06-15','2026-06-15T17:00:00Z',7.8,3.0,0,3450,60,null,''),
    ('5',seed_user_id,'2026-06-12','2026-06-12T16:00:00Z',8.0,4.0,0,3450,60,null,'CYA increased'),
    ('4',seed_user_id,'2026-06-10','2026-06-10T15:00:00Z',7.8,2.0,0,3300,60,null,'Hot weather'),
    ('3',seed_user_id,'2026-06-04','2026-06-04T17:30:00Z',7.8,5.0,0,3450,43,null,'SWG 54%'),
    ('2',seed_user_id,'2026-05-31','2026-05-31T16:00:00Z',8.0,5.5,0,3300,null,null,'K-2006: 11 drops FC.')
  on conflict (id) do nothing;

  insert into public.pool_maintenance (id,user_id,date,type,notes) values
    ('1',seed_user_id,'2026-06-13','Brushed walls & floor',''),
    ('2',seed_user_id,'2026-06-10','Cleaned skimmer basket','')
  on conflict (id) do nothing;

  insert into public.pool_treatments (id,user_id,date,logged_at,muriatic_acid_oz,swg_pct_before,swg_pct_after,notes) values
    ('1',seed_user_id,'2026-06-17','2026-06-17T19:00:00Z',11,54,65,'pH was 8.0')
  on conflict (id) do nothing;

  insert into public.pool_settings (id,user_id,filter_clean_baseline_psi) values
    ('1',seed_user_id,null)
  on conflict (id) do nothing;

  insert into public.pool_schedule (id,user_id,title,last_completed,interval_days,notes) values
    ('1',seed_user_id,'Check water level','2026-06-10',7,'SC evaporation heavy May Sept'),
    ('2',seed_user_id,'Clean skimmer basket','2026-06-10',7,'Check same day after storms'),
    ('3',seed_user_id,'Brush walls & floor','2026-06-13',7,'Vinyl prevents algae buildup'),
    ('4',seed_user_id,'Check cell flow switch','2026-05-15',30,'Pentair flow switch fails silently'),
    ('5',seed_user_id,'Inspect O-rings & lid','2026-05-15',30,'Salt accelerates O-ring wear'),
    ('6',seed_user_id,'Clean cartridge filter','2026-04-15',60,'Remove, hose off, reinstall'),
    ('7',seed_user_id,'Clean salt cell (IntelliChlor)','2026-03-01',90,'Inspect plates, soak in acid if scale'),
    ('8',seed_user_id,'Test calcium hardness','2026-01-01',90,'Vinyl target 150 250 ppm')
  on conflict (id) do nothing;

  insert into public.home_maintenance (id,user_id,title,last_completed,interval_days,notes) values
    ('1',seed_user_id,'HVAC Filter','2026-03-01',90,'16x25x1 filter'),
    ('2',seed_user_id,'Pool Filter Backwash','2026-06-06',14,''),
    ('3',seed_user_id,'Gutter Cleaning','2026-04-15',90,''),
    ('4',seed_user_id,'Smoke Detector Test','2026-01-01',180,''),
    ('5',seed_user_id,'Water Heater Flush','2025-12-01',365,''),
    ('6',seed_user_id,'Dryer Vent Clean','2026-01-15',180,'')
  on conflict (id) do nothing;

  insert into public.tasks (id,user_id,title,category,priority,due_date,recurring_interval_days,last_completed,is_important,notes,completed) values
    ('1',seed_user_id,'Check pool water level','Pool','med',null,7,'2026-06-17',false,'Evaporation heavy May-Sept',false),
    ('2',seed_user_id,'Clean pool skimmer basket','Pool','med',null,7,'2026-06-17',false,'Check after storms',false),
    ('3',seed_user_id,'Brush pool walls & floor','Pool','low',null,7,'2026-06-13',false,'Vinyl prevents algae',false),
    ('4',seed_user_id,'Mow front & back yard','Yard','med',null,7,'2026-06-14',false,'',false),
    ('5',seed_user_id,'Edge driveway & sidewalk','Yard','low',null,14,'2026-06-07',false,'',false),
    ('6',seed_user_id,'Check irrigation system','Yard','med',null,14,'2026-06-10',false,'',false),
    ('7',seed_user_id,'SAT registration deadline','College','high','2026-06-20',null,null,true,'August test date',false),
    ('8',seed_user_id,'Review retirement contribution','Finance','med',null,null,null,true,'Below 15% target',false)
  on conflict (id) do nothing;

  insert into public.college_schools (id,user_id,name,status,match_level,app_type,app_deadline,visit_notes) values
    ('1',seed_user_id,'University of Virginia','researching','Reach','ED','2026-11-01',''),
    ('2',seed_user_id,'Wake Forest University','researching','Reach','EA','2026-11-15',''),
    ('3',seed_user_id,'University of Richmond','target','Target','EA','2026-11-15',''),
    ('4',seed_user_id,'James Madison University','target','Safety','Regular','2027-01-15','')
  on conflict (id) do nothing;

  insert into public.college_test_plan (id,user_id,test_type,target_date,target_score,attempt_number,registered,notes) values
    ('1',seed_user_id,'SAT','2026-08-23','1400',1,false,'First official SAT attempt junior year')
  on conflict (id) do nothing;

  insert into public.college_essays (id,user_id,title,school,due_date,status,word_count,notes) values
    ('1',seed_user_id,'Common App Personal Statement','','2026-09-15','not started','650 max','')
  on conflict (id) do nothing;

  insert into public.college_deadlines (id,user_id,title,due_date,school,category,completed) values
    ('1',seed_user_id,'SAT Registration August Test','2026-06-20','','test',false),
    ('2',seed_user_id,'Common App Account Setup','2026-07-01','Common App','application',false),
    ('3',seed_user_id,'UVA Campus Visit','2026-07-15','University of Virginia','visit',false),
    ('4',seed_user_id,'Junior Year Transcript Request','2026-08-01','','application',false),
    ('5',seed_user_id,'SAT Exam Date','2026-08-23','','test',false)
  on conflict (id) do nothing;

  insert into public.sat_scores (id,user_id,date,total,math,verbal,notes) values
    ('1',seed_user_id,'2026-03-08',1280,640,640,'PSAT strong baseline')
  on conflict (id) do nothing;

  insert into public.retirement_accounts (id,user_id,name,account_type,balance,monthly_contribution,employer_match,contribution_frequency,tax_treatment,last_updated,notes) values
    ('1',seed_user_id,'Matt 403(b)','403b',520000,1200,400,'monthly','pre-tax','2026-06-01',''),
    ('2',seed_user_id,'Kalee 401(k)','401k',180000,500,250,'monthly','pre-tax','2026-06-01',''),
    ('3',seed_user_id,'Traditional IRA','IRA',65000,0,0,'monthly','pre-tax','2026-06-01',''),
    ('4',seed_user_id,'HSA','HSA',28000,300,0,'monthly','HSA','2026-06-01',''),
    ('5',seed_user_id,'Brokerage','brokerage',85000,400,0,'monthly','taxable','2026-06-01','')
  on conflict (id) do nothing;

  insert into public.retirement_assumptions (id,user_id,current_age,retirement_age,annual_return_pct,withdrawal_rate_pct,annual_retirement_spending,social_security_estimate,social_security_estimate_spouse,ss_claim_age,ss_claim_age_spouse,healthcare_estimate,contribution_increase_pct,bridge_end_age,medicare_age,plan_end_age,inflation_pct,conservative_rate_pct,moderate_rate_pct,aggressive_rate_pct,drawdown_rate_pct,return_volatility_pct) values
    ('1',seed_user_id,44,59,7,4,110000,18000,12000,67,67,18000,3,65,65,90,3,5,7,9,5,15)
  on conflict (id) do nothing;

  insert into public.college_savings (id,user_id,balance,monthly_contribution,last_updated,notes) values
    ('1',seed_user_id,50000,200,'2026-06-01','529 plan')
  on conflict (id) do nothing;

  insert into public.college_goal (id,user_id,child_name,target_amount,target_year,notes) values
    ('1',seed_user_id,'Aubrey',160000,2027,'In-state preferred.'),
    ('2',seed_user_id,'Blake',160000,2032,'Entering 7th grade (2026).'),
    ('3',seed_user_id,'Brayden',160000,2035,'Entering 4th grade (2026).')
  on conflict (id) do nothing;

  insert into public.mortgage (id,user_id,current_balance,interest_rate,monthly_payment,term_years,start_date,extra_payment_monthly,last_updated) values
    ('1',seed_user_id,310000,6.25,2400,30,'2021-08-01',0,'2026-06-01')
  on conflict (id) do nothing;

  insert into public.other_debt (id,user_id,name,balance,interest_rate,payment_amount,payment_frequency,last_updated,notes) values
    ('1',seed_user_id,'Personal Loan',21000,8.5,480,'biweekly','2026-06-01','Goal: payoff in ~7 months')
  on conflict (id) do nothing;

  insert into public.net_worth_snapshots (id,user_id,date,total_assets,total_liabilities,net_worth,notes) values
    ('1',seed_user_id,'2026-06-01',928000,331000,597000,'Initial snapshot')
  on conflict (id) do nothing;

  insert into public.finance_action_items (id,user_id,title,category,priority,completed,created_date) values
    ('1',seed_user_id,'Review retirement contribution - currently below 15% target','retirement','med',false,'2026-06-01'),
    ('2',seed_user_id,'Evaluate extra payments toward 8.5% personal loan','debt','high',false,'2026-06-01')
  on conflict (id) do nothing;
end $$;
