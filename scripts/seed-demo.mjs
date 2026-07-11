import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env.test.local", override: true });

const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DEMO_USER_EMAIL || "test@familyos.app";
const password = process.env.DEMO_USER_PASSWORD;
const environment = (process.env.FAMILYOS_ENV || "").toLowerCase();

function fail(message) { throw new Error(`[seed:demo] ${message}`); }
if (!url || !serviceKey || !password) fail("SUPABASE_URL (or REACT_APP_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, and DEMO_USER_PASSWORD are required.");
if (!email.endsWith("@familyos.app")) fail("Demo email must use the familyos.app domain.");
if (!["development", "test", "local"].includes(environment)) fail("FAMILYOS_ENV must be development, test, or local.");
const localTarget = /localhost|127\.0\.0\.1/.test(url);
if (!localTarget && process.env.DEMO_SEED_ALLOW_REMOTE_TEST !== "true") fail("Remote seeding is disabled. Set DEMO_SEED_ALLOW_REMOTE_TEST=true only for a dedicated non-production Supabase project.");
if (/prod|production/i.test(url) || environment === "production") fail("Refusing to seed a production-like target.");

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const iso = (days = 0) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const stamp = (days = 0, hour = 12) => `${iso(days)}T${String(hour).padStart(2, "0")}:00:00.000Z`;

async function query(label, operation) {
  const { data, error } = await operation;
  if (error) fail(`${label}: ${error.message}`);
  return data;
}

async function findUser() {
  for (let page = 1; page <= 20; page += 1) {
    const data = await query("list demo users", admin.auth.admin.listUsers({ page, perPage: 100 }));
    const match = data.users.find(user => user.email?.toLowerCase() === email.toLowerCase());
    if (match || data.users.length < 100) return match;
  }
  fail("Could not safely finish searching auth users.");
}

async function insert(table, rows) {
  return query(`insert ${table}`, admin.from(table).insert(rows).select());
}

console.log(`[seed:demo] Resetting ${email} in ${environment}.`);
const existing = await findUser();
if (existing) {
  const memberships = await query("find demo households", admin.from("household_members").select("household_id").eq("user_id", existing.id));
  for (const membership of memberships || []) await query("delete demo household", admin.from("households").delete().eq("id", membership.household_id));
  await query("delete demo auth user", admin.auth.admin.deleteUser(existing.id));
}

const created = await query("create demo auth user", admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: "Alex Demo" } }));
const userId = created.user.id;
const bootstrapMemberships = await query("find bootstrap household", admin.from("household_members").select("household_id").eq("user_id", userId));
for (const membership of bootstrapMemberships || []) await query("delete bootstrap household", admin.from("households").delete().eq("id", membership.household_id));
await query("update demo profile", admin.from("profiles").upsert({ id: userId, email, display_name: "Alex Demo", avatar_url: "" }));
const [household] = await insert("households", { name: "Demo Family Household", created_by_user_id: userId, status: "active" });
const householdId = household.id;
const people = await insert("people", [
  { household_id: householdId, first_name: "Alex", last_name: "Demo", display_name: "Alex", relationship: "Self", member_type: "adult", color: "#4A90D9", birthday: "1982-03-14", email, notes: "Anniversary: 2008-06-21" },
  { household_id: householdId, first_name: "Jordan", last_name: "Demo", display_name: "Jordan", relationship: "Spouse", member_type: "adult", color: "#A78BFA", birthday: "1983-09-02", notes: "Anniversary: 2008-06-21" },
  { household_id: householdId, first_name: "Taylor", last_name: "Demo", display_name: "Taylor", relationship: "Child", member_type: "teen", color: "#34D399", birthday: "2010-01-18" },
  { household_id: householdId, first_name: "Casey", last_name: "Demo", display_name: "Casey", relationship: "Child", member_type: "child", color: "#F59E0B", birthday: "2014-07-08" },
  { household_id: householdId, first_name: "Riley", last_name: "Demo", display_name: "Riley", relationship: "Child", member_type: "child", color: "#F472B6", birthday: "2017-11-26" },
]);
await insert("household_members", { household_id: householdId, user_id: userId, person_id: people[0].id, role: "owner", status: "active" });
await insert("household_settings", { household_id: householdId, default_task_category: "Home", default_task_priority: "medium", default_task_status: "not_started", calendar_sync_enabled: false });
await query("update demo preferences", admin.from("user_preferences").upsert({ user_id: userId, default_household_id: householdId, default_person_id: people[0].id, default_task_category: "Home", default_task_priority: "medium" }));

const base = { household_id: householdId, user_id: userId };
await insert("tasks", [
  { ...base, title: "Schedule annual physical", category: "Health", priority: "high", due_date: iso(-3), status: "not_started", completed: false, assigned_person_id: people[0].id, is_important: true, notes: "Call primary care office", created_by_user_id: userId },
  { ...base, title: "Take recycling to curb", category: "Home", priority: "med", due_date: iso(0), recurring_interval_days: 7, last_completed: iso(-7), status: "not_started", completed: false, assigned_person_id: people[2].id, created_by_user_id: userId },
  { ...base, title: "Book summer vacation lodging", category: "Travel", priority: "high", due_date: iso(14), status: "in_progress", completed: false, assigned_person_id: people[1].id, is_important: true, created_by_user_id: userId },
  { ...base, title: "Replace HVAC filter", category: "Home", priority: "med", due_date: iso(30), recurring_interval_days: 90, last_completed: iso(-60), status: "not_started", completed: false, assigned_person_id: people[0].id, created_by_user_id: userId },
  { ...base, title: "Submit school permission form", category: "School", priority: "low", due_date: iso(-1), last_completed: iso(-1), status: "completed", completed: true, completed_at: stamp(-1), assigned_person_id: people[2].id, created_by_user_id: userId },
]);
await insert("notes", [
  { ...base, title: "Family meeting notes", body: "Vacation dates, summer routines, and school supply planning.", tag: "Family" },
  { ...base, title: "Emergency contacts", body: "Pediatrician, veterinarian, neighbors, and utility contacts.", tag: "Important" },
]);
await insert("home_maintenance", [
  { ...base, title: "HVAC filter", last_completed: iso(-60), interval_days: 90, notes: "20x25x1 filter in upstairs return" },
  { ...base, title: "Smoke detector test", last_completed: iso(-150), interval_days: 180, notes: "Test all bedrooms and hallways" },
  { ...base, title: "Water heater flush", last_completed: iso(-330), interval_days: 365, notes: "Annual service" },
]);
await insert("life_lists", [
  { ...base, owner_user_id: userId, name: "Family Goals", description: "Shared goals for the year", category: "Goals", visibility: "household", favorite: true },
  { ...base, owner_user_id: userId, name: "Vacation Ideas", description: "Places the family wants to visit", category: "Travel", visibility: "household" },
]);
const lists = await query("load demo life lists", admin.from("life_lists").select("id,name").eq("household_id", householdId));
await insert("life_list_items", [
  { ...base, list_id: lists.find(x => x.name === "Family Goals").id, title: "Complete a monthly family activity", priority: "high", status: "in_progress", assigned_to_person_id: people[0].id },
  { ...base, list_id: lists.find(x => x.name === "Family Goals").id, title: "Build emergency savings milestone", priority: "high", status: "planned" },
  { ...base, list_id: lists.find(x => x.name === "Vacation Ideas").id, title: "National parks road trip", priority: "med", status: "planned", tags: ["summer", "travel"] },
]);
const shoppingLists = await insert("shopping_lists", { ...base, owner_user_id: userId, name: "Weekly Groceries", description: "Household staples and meal-plan items", visibility: "household", favorite: true, category: "Groceries" });
await insert("shopping_items", [
  { ...base, list_id: shoppingLists[0].id, name: "Milk", quantity: 2, unit: "gallons", category: "Dairy", priority: "med" },
  { ...base, list_id: shoppingLists[0].id, name: "Apples", quantity: 8, unit: "each", category: "Produce", priority: "low" },
  { ...base, list_id: shoppingLists[0].id, name: "Laundry detergent", quantity: 1, unit: "bottle", category: "Household", priority: "high" },
]);
await insert("pantry_items", [
  { ...base, name: "Rice", current_quantity: 2, minimum_quantity: 1, unit: "bags", category: "Pantry", favorite: true },
  { ...base, name: "Coffee", current_quantity: 0.5, minimum_quantity: 1, unit: "bags", category: "Pantry", reorder_flag: true },
]);
await insert("retirement_accounts", [
  { ...base, name: "Demo 401(k)", account_type: "401k", balance: 285000, monthly_contribution: 1200, employer_match: 350, last_updated: iso(0) },
  { ...base, name: "Family Brokerage", account_type: "brokerage", balance: 62000, monthly_contribution: 500, last_updated: iso(0) },
]);
await insert("retirement_assumptions", { ...base, current_age: 44, retirement_age: 60, annual_return_pct: 7, withdrawal_rate_pct: 4, annual_retirement_spending: 95000, social_security_estimate: 22000, social_security_estimate_spouse: 18000 });
await insert("mortgage", { ...base, current_balance: 298000, interest_rate: 4.25, monthly_payment: 2200, term_years: 30, start_date: "2021-08-01", home_value: 525000, last_updated: iso(0) });
await insert("other_debt", { ...base, name: "Auto loan", balance: 14500, interest_rate: 5.2, payment_amount: 480, last_updated: iso(0) });
await insert("net_worth_snapshots", { ...base, date: iso(0), total_assets: 872000, total_liabilities: 312500, net_worth: 559500, notes: "Demo monthly snapshot" });
await insert("finance_action_items", [
  { ...base, title: "Review annual household budget", category: "budget", priority: "high", completed: false, created_date: iso(-5) },
  { ...base, title: "Increase emergency savings transfer", category: "savings", priority: "med", completed: false, created_date: iso(-2) },
]);
await insert("college_savings", { ...base, balance: 48000, monthly_contribution: 350, last_updated: iso(0), notes: "Sample 529 plan" });
await insert("college_goal", [{ ...base, child_name: "Taylor", target_amount: 120000, target_year: 2028 }, { ...base, child_name: "Casey", target_amount: 140000, target_year: 2032 }]);
await insert("pool_readings", [{ ...base, date: iso(-1), logged_at: stamp(-1, 18), ph: 7.6, free_chlorine: 4.5, salt: 3300, cya: 60, alkalinity: 80, water_temp: 84, test_source: "Taylor Kit", notes: "Clear water" }]);
await insert("pool_schedule", [{ ...base, title: "Clean pool filter", last_completed: iso(-45), interval_days: 60, maintenance_type: "Filter" }, { ...base, title: "Test pool chemistry", last_completed: iso(-7), interval_days: 7, maintenance_type: "Water test" }]);

console.log(`[seed:demo] Complete. User ${userId}; household ${householdId}; 5 people and representative data across active modules.`);
