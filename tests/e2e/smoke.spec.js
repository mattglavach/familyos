const { test, expect } = require("@playwright/test");
const { assertNoRuntimeFailures, loginDemoUser, monitorPage, navigateModule, openMoreModule } = require("./helpers/app");

test("authenticated FamilyOS major-module smoke", async ({ page }) => {
  const failures = monitorPage(page);
  await loginDemoUser(page);
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();

  await navigateModule(page, "Tasks");
  await expect(page.getByText("Schedule annual physical")).toBeVisible();
  await navigateModule(page, "Calendar");
  await expect(page.getByText("Calendar", { exact: true }).first()).toBeVisible();
  await navigateModule(page, "Home");
  await expect(page.getByText("FamilyOS", { exact: false }).first()).toBeVisible();

  await openMoreModule(page, "Life Lists");
  await expect(page.getByText("Family Goals")).toBeVisible();
  await openMoreModule(page, "Pool");
  await expect(page.getByText("Pool", { exact: true }).first()).toBeVisible();
  await openMoreModule(page, "Shopping");
  await expect(page.getByText("Weekly Groceries")).toBeVisible();
  await openMoreModule(page, "Meal Planning");
  await openMoreModule(page, "Finance");
  await expect(page.getByText("Demo 401(k)")).toBeVisible();
  await openMoreModule(page, "College");

  assertNoRuntimeFailures(failures);
});
