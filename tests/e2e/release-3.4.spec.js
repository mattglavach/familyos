const { test, expect } = require("@playwright/test");
const { createClient } = require("@supabase/supabase-js");
const AxeBuilder = require("@axe-core/playwright").default;
const { loginDemoUser, logoutDemoUser } = require("./helpers/app");
const { validateTestAdminEnvironment } = require("./helpers/environment");

test("Release 3.4 recommendation lifecycle persists through reload and reauthentication", async ({ page }) => {
  const { url, serviceRoleKey } = validateTestAdminEnvironment();
  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  const { data: auth, error: authError } = await admin.auth.signInWithPassword({ email: process.env.DEMO_USER_EMAIL, password: process.env.DEMO_USER_PASSWORD });
  expect(authError).toBeNull();
  const userId = auth.user.id;
  const { data: membership, error: membershipError } = await admin.from("household_members").select("household_id").eq("user_id", userId).eq("status", "active").limit(1).single();
  expect(membershipError).toBeNull();
  const { error: cleanupError } = await admin.from("recommendation_history").delete().eq("household_id", membership.household_id).eq("user_id", userId).eq("action", "snoozed");
  expect(cleanupError).toBeNull();

  await loginDemoUser(page);
  const card = page.locator("section[aria-labelledby='family-brief-title']").locator("article, [class*='border-l-4']").first();
  await expect(card.getByText(/confidence/).first()).toBeVisible();
  await expect(card.getByText(/priority/).first()).toBeVisible();
  const title = (await card.getByRole("heading", { level: 3 }).innerText()).trim();
  await card.getByRole("button", { name: "Snooze", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Confirm recommendation action" });
  await expect(dialog).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include("[role='dialog']").withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(accessibility.violations.filter(item => item.impact === "critical")).toEqual([]);
  await dialog.getByRole("button", { name: "Tomorrow", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(dialog).toBeHidden();

  const { data: history, error: historyError } = await admin.from("recommendation_history").select("action,remind_after,recommendation_key").eq("household_id", membership.household_id).eq("user_id", userId).eq("action", "snoozed").order("created_at", { ascending: false }).limit(1).single();
  expect(historyError).toBeNull();
  expect(history.remind_after).toBeTruthy();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Morning Command Center" })).toBeAttached();
  await logoutDemoUser(page);
  await loginDemoUser(page);
  await expect(page.getByRole("heading", { name: "Morning Command Center" })).toBeAttached();
  const persisted = await admin.from("recommendation_history").select("id").eq("recommendation_key", history.recommendation_key).eq("action", "snoozed");
  expect(persisted.error).toBeNull();
  expect(persisted.data.length).toBeGreaterThan(0);
  expect(title.length).toBeGreaterThan(0);
});
