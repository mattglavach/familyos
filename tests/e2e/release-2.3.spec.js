const { test, expect } = require("@playwright/test");
const { createClient } = require("@supabase/supabase-js");
const { loginDemoUser, navigateModule, openMoreModule } = require("./helpers/app");
const { validateTestAdminEnvironment } = require("./helpers/environment");

function adminClient() {
  const { url, serviceRoleKey } = validateTestAdminEnvironment();
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

async function activeHousehold(admin) {
  const { data: auth } = await admin.auth.signInWithPassword({ email: process.env.DEMO_USER_EMAIL, password: process.env.DEMO_USER_PASSWORD });
  const userId = auth?.user?.id;
  const { data, error } = await admin.from("household_members").select("*").eq("user_id", userId).eq("status", "active").limit(1).single();
  if (error) throw error;
  return { householdId: data.household_id, userId };
}

test("Release 2.3 Home, navigation, task views, Habits, and Routines", async ({ page }) => {
  test.setTimeout(90_000);
  const admin = adminClient();
  const marker = `R23 ${Date.now()}`;
  await loginDemoUser(page);
  await expect(page.getByRole("button", { name: "Open AI Brief", exact: true })).toBeVisible();
  await expect(page.getByText(/Family Brief/, { exact: true })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(nav.getByRole("button", { name: "Habits", exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "More", exact: true })).toBeVisible();
  await navigateModule(page, "More");
  await expect(page.getByText("Household Modules", { exact: true })).toBeVisible();
  await navigateModule(page, "Tasks");
  await expect(page.getByRole("button", { name: "My Tasks", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "More Filters", exact: true }).click();
  await expect(page.getByRole("button", { name: "Assigned by Me", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "New Task", exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Add household item", exact: true }).click();
  await page.getByRole("button", { name: "Life Item Ready", exact: true }).click();
  await page.getByRole("dialog", { name: "Life Item" }).getByRole("combobox").selectOption({ index: 1 });
  await page.getByPlaceholder("e.g. Watch The Princess Bride").fill(`${marker} life item`);
  await page.getByRole("button", { name: "Add Item", exact: true }).click();
  await expect(page.getByText("Life Lists", { exact: true }).first()).toBeVisible();
  const { data: lifeItems } = await admin.from("life_list_items").select("id").eq("title", `${marker} life item`);
  expect(lifeItems).toHaveLength(1);

  await page.getByRole("button", { name: "Add household item", exact: true }).click();
  await page.getByRole("button", { name: "Habit Ready", exact: true }).click();
  await page.getByLabel("Name").fill(`${marker} habit`);
  await page.getByRole("button", { name: "Add Habit", exact: true }).click();
  await expect(page.getByText(`${marker} habit`, { exact: true })).toBeVisible();
  const habitCompletion = page.waitForResponse(response => response.request().method() === "POST" && response.url().includes("/rest/v1/habit_completions"));
  await page.getByRole("dialog").getByRole("button", { name: "Complete today", exact: true }).click();
  expect((await habitCompletion).ok()).toBe(true);
  await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await page.reload();
  await openMoreModule(page, "Habits");
  await expect(page.getByRole("button", { name: `Undo ${marker} habit`, exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Add household item", exact: true }).click();
  await page.getByRole("button", { name: "Routine Ready", exact: true }).click();
  await page.getByLabel("Name").fill(`${marker} routine`);
  await page.getByLabel("Checklist steps").fill("First step\nSecond step");
  await page.getByRole("button", { name: "Add Routine", exact: true }).click();
  await expect(page.getByText(`${marker} routine`, { exact: true })).toBeVisible();
  const firstStepSave = page.waitForResponse(response => response.request().method() === "POST" && response.url().includes("/rest/v1/routine_completions"));
  await page.getByText("First step", { exact: true }).click();
  expect((await firstStepSave).ok()).toBe(true);
  await expect(page.getByRole("checkbox", { name: "First step" })).toBeChecked();
  const fullRoutineSave = page.waitForResponse(response => response.request().method() === "PATCH" && response.url().includes("/rest/v1/routine_completions"));
  await page.getByText(`${marker} routine`, { exact: true }).locator("..").locator("..").getByRole("button", { name: "Complete all", exact: true }).click();
  expect((await fullRoutineSave).ok()).toBe(true);
  await page.reload();
  await openMoreModule(page, "Routines");
  await expect(page.getByText("Complete", { exact: true }).first()).toBeVisible();

  await admin.from("routines").delete().ilike("name", `${marker}%`);
  await admin.from("habits").delete().ilike("name", `${marker}%`);
  await admin.from("life_list_items").delete().ilike("title", `${marker}%`);
});

test("Release 2.3 Pool Done is visible, durable, and idempotent", async ({ page }) => {
  const admin = adminClient();
  const { householdId, userId } = await activeHousehold(admin);
  const marker = `R23 Pool ${Date.now()}`;
  await admin.from("pool_schedule").insert({ id: marker, household_id: householdId, user_id: userId, title: marker, maintenance_type: "Validation", last_completed: "2026-07-01", interval_days: 7, notes: "temporary browser validation" });
  try {
    await loginDemoUser(page);
    await navigateModule(page, "Pool");
    await page.getByRole("button", { name: "Maintenance", exact: true }).click();
    const card = page.getByText(marker, { exact: true }).locator("..").locator("..");
    await card.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.getByText(new RegExp(`${marker} completed`))).toBeVisible();
    await expect(page.getByText(marker, { exact: true }).first()).toBeVisible();
    await page.reload();
    await navigateModule(page, "Pool");
    await page.getByRole("button", { name: "Maintenance", exact: true }).click();
    await expect(page.getByText(marker, { exact: true }).first()).toBeVisible();
    const { data: history } = await admin.from("pool_maintenance_history").select("id").eq("schedule_id", marker);
    expect(history).toHaveLength(1);
  } finally {
    await admin.from("pool_maintenance_history").delete().eq("schedule_id", marker);
    await admin.from("pool_schedule").delete().eq("id", marker);
  }
});
