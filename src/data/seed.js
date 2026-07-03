// - SEED DATA -
export const SEED={
  pool_readings:[
    {id:"7",date:"2026-06-17",logged_at:"2026-06-17T18:30:00Z",test_source:"Taylor Kit",ph:8.0,free_chlorine:5.5,cc:0,salt:3350,cya:60,alkalinity:90,calcium_hardness:null,water_temp:86,swg_setting:54,filter_pressure:null,pump_hours:8,recent_weather_notes:"Hot sunny week",recent_heavy_usage:false,notes:"K-2006: 11 drops FC. Acid added 2 days prior. TA 90 ppm."},
    {id:"6",date:"2026-06-15",logged_at:"2026-06-15T17:00:00Z",ph:7.8,free_chlorine:3.0,cc:0,salt:3450,cya:60,alkalinity:null,calcium_hardness:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:""},
    {id:"5",date:"2026-06-12",logged_at:"2026-06-12T16:00:00Z",ph:8.0,free_chlorine:4.0,cc:0,salt:3450,cya:60,alkalinity:null,calcium_hardness:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:"CYA increased"},
    {id:"4",date:"2026-06-10",logged_at:"2026-06-10T15:00:00Z",ph:7.8,free_chlorine:2.0,cc:0,salt:3300,cya:60,alkalinity:null,calcium_hardness:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:"Hot weather"},
    {id:"3",date:"2026-06-04",logged_at:"2026-06-04T17:30:00Z",ph:7.8,free_chlorine:5.0,cc:0,salt:3450,cya:43,alkalinity:null,calcium_hardness:null,water_temp:null,swg_setting:54,filter_pressure:null,pump_hours:null,notes:"SWG 54%"},
    {id:"2",date:"2026-05-31",logged_at:"2026-05-31T16:00:00Z",ph:8.0,free_chlorine:5.5,cc:0,salt:3300,cya:null,alkalinity:null,calcium_hardness:null,water_temp:null,swg_setting:null,filter_pressure:null,pump_hours:null,notes:"K-2006: 11 drops FC."},
  ],
  pool_maintenance:[
    {id:"1",date:"2026-06-13",type:"Brushed walls & floor",equipment_id:null,water_clarity:"Clear",notes:""},
    {id:"2",date:"2026-06-10",type:"Cleaned skimmer basket",equipment_id:null,water_clarity:"Clear",notes:""},
  ],
  pool_treatments:[
    {id:"1",date:"2026-06-17",logged_at:"2026-06-17T19:00:00Z",muriatic_acid_oz:11,soda_ash_oz:null,sodium_bicarb_oz:null,salt_lbs:null,cya_oz:null,liquid_chlorine_oz:null,shock_lbs:null,algaecide_oz:null,swg_pct_before:54,swg_pct_after:65,brushed:false,vacuumed:false,cleaned_skimmer:false,cleaned_filter:false,cleaned_cell:false,checked_flow:false,notes:"pH was 8.0"},
  ],
  pool_settings:[{id:"1",filter_clean_baseline_psi:null}],
  pool_equipment:[
    {id:"pool-eq-1",type:"Pump",name:"Main Pump",brand:"Pentair",model:"",install_date:null,last_maintenance:"2026-05-15",next_maintenance:"2026-07-15",warranty_notes:"",manual_link:"",notes:"Primary circulation pump.",active:true},
    {id:"pool-eq-2",type:"Salt Cell (SWG)",name:"Salt Cell",brand:"Pentair",model:"IntelliChlor IC40",install_date:null,last_maintenance:"2026-03-01",next_maintenance:"2026-09-01",warranty_notes:"",manual_link:"",notes:"Inspect for scale before peak season.",active:true},
    {id:"pool-eq-3",type:"Filter",name:"Cartridge Filter",brand:"",model:"",install_date:null,last_maintenance:"2026-04-15",next_maintenance:"2026-07-15",warranty_notes:"",manual_link:"",notes:"Clean when pressure rises or schedule is due.",active:true},
  ],
  pool_action_audits:[],
  pool_schedule:[
    {id:"1",title:"Check water level",maintenance_type:"Water Level",equipment_id:null,last_completed:"2026-06-10",interval_days:7,notes:"SC evaporation heavy May Sept"},
    {id:"2",title:"Clean skimmer basket",maintenance_type:"Betta Cleaning",equipment_id:null,last_completed:"2026-06-10",interval_days:7,notes:"Check same day after storms"},
    {id:"3",title:"Brush walls & floor",maintenance_type:"Pool Surface",equipment_id:null,last_completed:"2026-06-13",interval_days:7,notes:"Vinyl prevents algae buildup"},
    {id:"4",title:"Pump Inspection",maintenance_type:"Pump Inspection",equipment_id:"pool-eq-1",last_completed:"2026-05-15",interval_days:30,notes:"Pentair flow switch fails silently"},
    {id:"5",title:"Inspect O-rings & lid",maintenance_type:"Pump Inspection",equipment_id:"pool-eq-1",last_completed:"2026-05-15",interval_days:30,notes:"Salt accelerates O-ring wear"},
    {id:"6",title:"Filter Cleaning",maintenance_type:"Filter Cleaning",equipment_id:"pool-eq-3",last_completed:"2026-04-15",interval_days:60,notes:"Remove, hose off, reinstall"},
    {id:"7",title:"SWG Cleaning",maintenance_type:"SWG Cleaning",equipment_id:"pool-eq-2",last_completed:"2026-03-01",interval_days:90,notes:"Inspect plates, soak in acid if scale"},
    {id:"8",title:"Reagent Replacement",maintenance_type:"Reagent Replacement",equipment_id:null,last_completed:"2026-01-01",interval_days:180,notes:"Replace old test reagents"},
  ],
  home_maintenance:[
    {id:"1",title:"HVAC Filter",last_completed:"2026-03-01",interval_days:90,notes:"16x25x1 filter"},
    {id:"2",title:"Pool Filter Backwash",last_completed:"2026-06-06",interval_days:14,notes:""},
    {id:"3",title:"Gutter Cleaning",last_completed:"2026-04-15",interval_days:90,notes:""},
    {id:"4",title:"Smoke Detector Test",last_completed:"2026-01-01",interval_days:180,notes:""},
    {id:"5",title:"Water Heater Flush",last_completed:"2025-12-01",interval_days:365,notes:""},
    {id:"6",title:"Dryer Vent Clean",last_completed:"2026-01-15",interval_days:180,notes:""},
  ],
  tasks:[
    {id:"1",title:"Check pool water level",category:"Pool",priority:"med",due_date:null,recurring_interval_days:7,last_completed:"2026-06-17",is_important:false,notes:"Evaporation heavy May-Sept",completed:false},
    {id:"2",title:"Clean pool skimmer basket",category:"Pool",priority:"med",due_date:null,recurring_interval_days:7,last_completed:"2026-06-17",is_important:false,notes:"Check after storms",completed:false},
    {id:"3",title:"Brush pool walls & floor",category:"Pool",priority:"low",due_date:null,recurring_interval_days:7,last_completed:"2026-06-13",is_important:false,notes:"Vinyl   prevents algae",completed:false},
    {id:"4",title:"Mow front & back yard",category:"Yard",priority:"med",due_date:null,recurring_interval_days:7,last_completed:"2026-06-14",is_important:false,notes:"",completed:false},
    {id:"5",title:"Edge driveway & sidewalk",category:"Yard",priority:"low",due_date:null,recurring_interval_days:14,last_completed:"2026-06-07",is_important:false,notes:"",completed:false},
    {id:"6",title:"Check irrigation system",category:"Yard",priority:"med",due_date:null,recurring_interval_days:14,last_completed:"2026-06-10",is_important:false,notes:"",completed:false},
    {id:"7",title:"SAT registration deadline",category:"College",priority:"high",due_date:"2026-06-20",recurring_interval_days:null,last_completed:null,is_important:true,notes:"August test date",completed:false},
    {id:"8",title:"Review retirement contribution",category:"Finance",priority:"med",due_date:null,recurring_interval_days:null,last_completed:null,is_important:true,notes:"Below 15% target",completed:false},
  ],
  life_lists:[
    {id:"life-1",name:"Movies to Watch",description:"Family movie ideas for quiet weekends.",owner_user_id:null,visibility:"household",color:"#8B6FD4",icon:"▶",favorite:true,archived:false,category:"Movies",sort_order:1,created_at:"2026-07-01T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
    {id:"life-2",name:"Places to Visit",description:"Local and vacation ideas worth remembering.",owner_user_id:null,visibility:"household",color:"#4A90D9",icon:"⌂",favorite:false,archived:false,category:"Travel",sort_order:2,created_at:"2026-07-01T12:00:00Z",updated_at:"2026-07-01T12:00:00Z"},
    {id:"life-3",name:"Gift Ideas",description:"Shared ideas for birthdays and holidays.",owner_user_id:null,visibility:"shared",color:"#3DB87A",icon:"★",favorite:true,archived:false,category:"Gifts",sort_order:3,created_at:"2026-07-01T12:00:00Z",updated_at:"2026-07-01T12:00:00Z"},
  ],
  life_list_items:[
    {id:"life-item-1",list_id:"life-1",title:"The Princess Bride",description:"Good family rewatch option.",priority:"med",status:"planned",favorite:true,assigned_to_person_id:null,tags:["movie","family"],link_url:"",image_url:"",created_at:"2026-07-01T12:00:00Z",updated_at:"2026-07-02T12:00:00Z",completed_at:null,archived:false,sort_order:1},
    {id:"life-item-2",list_id:"life-2",title:"Weekend mountain cabin",description:"Save for a cooler-weather trip.",priority:"high",status:"someday",favorite:false,assigned_to_person_id:null,tags:["travel","weekend"],link_url:"",image_url:"",created_at:"2026-07-01T12:00:00Z",updated_at:"2026-07-01T12:00:00Z",completed_at:null,archived:false,sort_order:1},
    {id:"life-item-3",list_id:"life-3",title:"New pickleball paddle",description:"Potential birthday idea.",priority:"low",status:"planned",favorite:false,assigned_to_person_id:null,tags:["gift"],link_url:"",image_url:"",created_at:"2026-07-01T12:00:00Z",updated_at:"2026-07-01T12:00:00Z",completed_at:null,archived:false,sort_order:1},
  ],
  shopping_lists:[
    {id:"shop-list-1",name:"Weekly Groceries",description:"Default household grocery run.",owner_user_id:null,visibility:"household",favorite:true,archived:false,category:"Grocery",color:"#3DB87A",icon:"S",sort_order:1,recipe_ref:null,meal_plan_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
    {id:"shop-list-2",name:"Costco Run",description:"Bulk household staples.",owner_user_id:null,visibility:"shared",favorite:false,archived:false,category:"Costco",color:"#4A90D9",icon:"S",sort_order:2,recipe_ref:null,meal_plan_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
  ],
  shopping_items:[
    {id:"shop-item-1",list_id:"shop-list-1",pantry_item_id:"pantry-1",name:"Milk",quantity:1,unit:"gal",category:"Grocery",priority:"med",purchased:false,notes:"Any brand",favorite:true,assigned_to_person_id:null,sort_order:1,archived:false,purchased_at:null,recipe_ref:null,meal_plan_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
    {id:"shop-item-2",list_id:"shop-list-1",pantry_item_id:"pantry-2",name:"Rice",quantity:1,unit:"bag",category:"Grocery",priority:"high",purchased:false,notes:"Pantry is low",favorite:false,assigned_to_person_id:null,sort_order:2,archived:false,purchased_at:null,recipe_ref:null,meal_plan_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
    {id:"shop-item-3",list_id:"shop-list-2",pantry_item_id:null,name:"Paper towels",quantity:1,unit:"case",category:"Household",priority:"med",purchased:false,notes:"",favorite:false,assigned_to_person_id:null,sort_order:1,archived:false,purchased_at:null,recipe_ref:null,meal_plan_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
  ],
  pantry_items:[
    {id:"pantry-1",name:"Milk",current_quantity:1,minimum_quantity:1,unit:"gal",category:"Grocery",reorder_flag:false,favorite:true,notes:"Usually one spare.",archived:false,sort_order:1,recipe_ref:null,meal_plan_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
    {id:"pantry-2",name:"Rice",current_quantity:0.5,minimum_quantity:1,unit:"bag",category:"Grocery",reorder_flag:true,favorite:false,notes:"Keep one unopened bag.",archived:false,sort_order:2,recipe_ref:null,meal_plan_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
    {id:"pantry-3",name:"Dish soap",current_quantity:1,minimum_quantity:1,unit:"bottle",category:"Household",reorder_flag:false,favorite:false,notes:"",archived:false,sort_order:3,recipe_ref:null,meal_plan_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
  ],
  shopping_categories:[
    {id:"shop-cat-1",name:"Grocery",color:"#3DB87A",sort_order:1},
    {id:"shop-cat-2",name:"Household",color:"#4A90D9",sort_order:2},
    {id:"shop-cat-3",name:"Costco",color:"#8B6FD4",sort_order:3},
  ],
  meal_plans:[
    {id:"meal-plan-1",name:"This Week",description:"Simple household dinner plan.",plan_type:"weekly",start_date:"2026-07-05",end_date:"2026-07-11",owner_user_id:null,visibility:"household",favorite:true,archived:false,notes:"Keep weeknights easy.",sort_order:1,nutrition_ref:null,health_ref:null,ai_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
  ],
  recipes:[
    {id:"recipe-1",title:"Chicken Tacos",description:"Weeknight taco dinner.",category:"Family",meal_type:"dinner",prep_time_minutes:15,cook_time_minutes:20,servings:5,difficulty:"easy",instructions:"Cook chicken with seasoning. Warm tortillas. Set out toppings.",notes:"Use pantry rice as a side.",favorite:true,image_url:"",source_url:"",tags:["weeknight","family"],owner_user_id:null,visibility:"household",archived:false,sort_order:1,nutrition_ref:null,health_ref:null,ai_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
    {id:"recipe-2",title:"Pasta Night",description:"Quick pasta with salad.",category:"Pasta",meal_type:"dinner",prep_time_minutes:10,cook_time_minutes:15,servings:5,difficulty:"easy",instructions:"Boil pasta. Warm sauce. Serve with salad.",notes:"Good backup meal.",favorite:false,image_url:"",source_url:"",tags:["quick"],owner_user_id:null,visibility:"shared",archived:false,sort_order:2,nutrition_ref:null,health_ref:null,ai_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
  ],
  recipe_ingredients:[
    {id:"recipe-ing-1",recipe_id:"recipe-1",ingredient:"Chicken breast",quantity:2,unit:"lb",optional:false,pantry_item_id:null,shopping_item_id:null,notes:"",sort_order:1,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
    {id:"recipe-ing-2",recipe_id:"recipe-1",ingredient:"Tortillas",quantity:1,unit:"pack",optional:false,pantry_item_id:null,shopping_item_id:null,notes:"",sort_order:2,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
    {id:"recipe-ing-3",recipe_id:"recipe-1",ingredient:"Rice",quantity:1,unit:"bag",optional:false,pantry_item_id:"pantry-2",shopping_item_id:"shop-item-2",notes:"Pantry is low.",sort_order:3,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
    {id:"recipe-ing-4",recipe_id:"recipe-2",ingredient:"Pasta",quantity:1,unit:"box",optional:false,pantry_item_id:null,shopping_item_id:null,notes:"",sort_order:1,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
  ],
  meal_assignments:[
    {id:"meal-assignment-1",meal_plan_id:"meal-plan-1",recipe_id:"recipe-1",meal_date:"2026-07-05",meal_type:"dinner",title:"Chicken Tacos",notes:"",favorite:true,archived:false,shopping_list_id:null,nutrition_ref:null,health_ref:null,ai_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
    {id:"meal-assignment-2",meal_plan_id:"meal-plan-1",recipe_id:"recipe-2",meal_date:"2026-07-06",meal_type:"dinner",title:"Pasta Night",notes:"",favorite:false,archived:false,shopping_list_id:null,nutrition_ref:null,health_ref:null,ai_ref:null,created_at:"2026-07-02T12:00:00Z",updated_at:"2026-07-02T12:00:00Z"},
  ],
  recipe_categories:[
    {id:"recipe-cat-1",name:"Family",color:"#4A90D9",sort_order:1},
    {id:"recipe-cat-2",name:"Pasta",color:"#8B6FD4",sort_order:2},
  ],
  college_schools:[
    {id:"1",name:"University of Virginia",status:"researching",match_level:"Reach",app_type:"ED",app_deadline:"2026-11-01",visit_notes:""},
    {id:"2",name:"Wake Forest University",status:"researching",match_level:"Reach",app_type:"EA",app_deadline:"2026-11-15",visit_notes:""},
    {id:"3",name:"University of Richmond",status:"target",match_level:"Target",app_type:"EA",app_deadline:"2026-11-15",visit_notes:""},
    {id:"4",name:"James Madison University",status:"target",match_level:"Safety",app_type:"Regular",app_deadline:"2027-01-15",visit_notes:""},
  ],
  college_test_plan:[
    {id:"1",test_type:"SAT",target_date:"2026-08-23",target_score:"1400",attempt_number:1,registered:false,notes:"First official SAT attempt junior year"},
  ],
  college_essays:[
    {id:"1",title:"Common App Personal Statement",school:"",due_date:"2026-09-15",status:"not started",word_count:"650 max",notes:""},
  ],
  college_deadlines:[
    {id:"1",title:"SAT Registration   August Test",due_date:"2026-06-20",school:"",category:"test",completed:false},
    {id:"2",title:"Common App Account Setup",due_date:"2026-07-01",school:"Common App",category:"application",completed:false},
    {id:"3",title:"UVA Campus Visit",due_date:"2026-07-15",school:"University of Virginia",category:"visit",completed:false},
    {id:"4",title:"Junior Year Transcript Request",due_date:"2026-08-01",school:"",category:"application",completed:false},
    {id:"5",title:"SAT Exam Date",due_date:"2026-08-23",school:"",category:"test",completed:false},
  ],
  sat_scores:[
    {id:"1",date:"2026-03-08",total:1280,math:640,verbal:640,notes:"PSAT   strong baseline"},
  ],
  retirement_accounts:[
    {id:"1",name:"Matt 403(b)",account_type:"403b",balance:520000,monthly_contribution:1200,employer_match:400,contribution_frequency:"monthly",tax_treatment:"pre-tax",last_updated:"2026-06-01",notes:""},
    {id:"2",name:"Kalee 401(k)",account_type:"401k",balance:180000,monthly_contribution:500,employer_match:250,contribution_frequency:"monthly",tax_treatment:"pre-tax",last_updated:"2026-06-01",notes:""},
    {id:"3",name:"Traditional IRA",account_type:"IRA",balance:65000,monthly_contribution:0,employer_match:0,contribution_frequency:"monthly",tax_treatment:"pre-tax",last_updated:"2026-06-01",notes:""},
    {id:"4",name:"HSA",account_type:"HSA",balance:28000,monthly_contribution:300,employer_match:0,contribution_frequency:"monthly",tax_treatment:"HSA",last_updated:"2026-06-01",notes:""},
    {id:"5",name:"Brokerage",account_type:"brokerage",balance:85000,monthly_contribution:400,employer_match:0,contribution_frequency:"monthly",tax_treatment:"taxable",last_updated:"2026-06-01",notes:""},
  ],
  retirement_assumptions:[
    {id:"1",current_age:44,retirement_age:59,annual_return_pct:7,withdrawal_rate_pct:4,annual_retirement_spending:110000,social_security_estimate:18000,social_security_estimate_spouse:12000,ss_claim_age:67,ss_claim_age_spouse:67,healthcare_estimate:18000,contribution_increase_pct:3,bridge_end_age:65,medicare_age:65,plan_end_age:90,inflation_pct:3,conservative_rate_pct:5,moderate_rate_pct:7,aggressive_rate_pct:9,drawdown_rate_pct:5,return_volatility_pct:15},
  ],
  college_savings:[{id:"1",balance:50000,monthly_contribution:200,last_updated:"2026-06-01",notes:"529 plan"}],
  college_goal:[
    {id:"1",child_name:"Aubrey",target_amount:160000,target_year:2027,notes:"In-state preferred."},
    {id:"2",child_name:"Blake",target_amount:160000,target_year:2032,notes:"Entering 7th grade (2026)."},
    {id:"3",child_name:"Brayden",target_amount:160000,target_year:2035,notes:"Entering 4th grade (2026)."},
  ],
  mortgage:[{id:"1",current_balance:310000,interest_rate:6.25,monthly_payment:2400,term_years:30,start_date:"2021-08-01",extra_payment_monthly:0,last_updated:"2026-06-01"}],
  other_debt:[{id:"1",name:"Personal Loan",balance:21000,interest_rate:8.5,payment_amount:480,payment_frequency:"biweekly",last_updated:"2026-06-01",notes:"Goal: payoff in ~7 months"}],
  net_worth_snapshots:[{id:"1",date:"2026-06-01",total_assets:928000,total_liabilities:331000,net_worth:597000,notes:"Initial snapshot"}],
  finance_action_items:[
    {id:"1",title:"Review retirement contribution   currently below 15% target",category:"retirement",priority:"med",completed:false,created_date:"2026-06-01"},
    {id:"2",title:"Evaluate extra payments toward 8.5% personal loan",category:"debt",priority:"high",completed:false,created_date:"2026-06-01"},
  ],
};

