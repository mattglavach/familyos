const { test, expect } = require("@playwright/test");
const { assertNoRuntimeFailures, loginDemoUser, monitorPage, navigateModule, openMoreModule } = require("./helpers/app");

test("authenticated FamilyOS major-module smoke", async ({ page }) => {
  const failures = monitorPage(page);
  await loginDemoUser(page);
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByText("Schedule annual physical")).toBeVisible();

  await page.keyboard.press("Control+K");
  await expect(page.getByText("Search Family OS", { exact: true })).toBeVisible();
  await page.getByPlaceholder("Search tasks, pool, lists, meals...").fill("annual physical");
  await expect(page.getByText("Schedule annual physical", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Close" }).last().click();

  await navigateModule(page, "Tasks");
  await expect(page.getByText("Schedule annual physical")).toBeVisible();
  await navigateModule(page, "Calendar");
  await expect(page.getByText("Calendar", { exact: true }).first()).toBeVisible();
  await navigateModule(page, "Home");
  await expect(page.getByText("FamilyOS", { exact: false }).first()).toBeVisible();

  await openMoreModule(page, "Life Lists");
  await expect(page.getByText("Family Goals").first()).toBeVisible();
  await navigateModule(page, "Pool");
  await expect(page.getByText("Pool", { exact: true }).first()).toBeVisible();
  await openMoreModule(page, "AI Workspace");
  await expect(page.getByRole("heading", { name: "Ask FamilyOS" })).toBeVisible();
  await expect(page.getByLabel("Generated FamilyOS prompt")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy Prompt" })).toBeEnabled();
  await expect(page.getByLabel("AI response to review")).toBeVisible();
  await openMoreModule(page, "Meal Planning");
  await openMoreModule(page, "Finance");
  await expect(page.getByText("Monthly Contributions", { exact: true })).toBeVisible();
  await openMoreModule(page, "College");

  assertNoRuntimeFailures(failures);
});
