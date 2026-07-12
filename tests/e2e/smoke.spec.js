const { test, expect } = require("@playwright/test");
const { assertNoRuntimeFailures, loginDemoUser, monitorPage, navigateModule, openMoreModule } = require("./helpers/app");

test("authenticated FamilyOS major-module smoke", async ({ page }) => {
  const failures = monitorPage(page);
  await loginDemoUser(page);
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("main", { name: "Today dashboard" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quick Add" })).toBeVisible();
  await expect(page.getByText(/today's focus/i, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Schedule annual physical/ }).first()).toBeVisible();

  await page.keyboard.press("Control+K");
  await expect(page.getByText("Search Family OS", { exact: true })).toBeVisible();
  await page.getByPlaceholder("Search tasks, pool, lists, meals...").fill("annual physical");
  await expect(page.getByText("Schedule annual physical", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Close" }).last().click();

  await navigateModule(page, "Tasks");
  await expect(page.getByRole("button", { name: "Today", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "This Week", exact: true })).toBeVisible();
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
  await page.getByRole("button", { name: /Full generated prompt/ }).click();
  await expect(page.getByLabel("Generated FamilyOS prompt")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy Prompt" })).toBeEnabled();
  await expect(page.getByLabel("AI response to review")).toBeVisible();
  await page.getByLabel("AI response to review").fill("Task: Schedule follow-up 2026-07-20\nCalendar: Dentist 2026-07-21\nPool: Retest chlorine\nLife List: Visit Maine\nFinance: Review contribution rate");
  await expect(page.getByRole("button", { name: "Review prefilled form" })).toHaveCount(4);
  await expect(page.getByRole("link", { name: "Review in Calendar" })).toHaveAttribute("href", /calendar\.google\.com/);
  await openMoreModule(page, "Meal Planning");
  await openMoreModule(page, "Finance");
  await expect(page.getByText("Monthly Contributions", { exact: true })).toBeVisible();
  await openMoreModule(page, "College");

  assertNoRuntimeFailures(failures);
});
