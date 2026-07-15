const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { assertNoRuntimeFailures, loginDemoUser, monitorPage, navigateModule, openMoreModule } = require("./helpers/app");

test("Release 3.1 Relationship OS end-to-end", async ({ page }, testInfo) => {
  const failures = monitorPage(page);
  const uniqueName = `Relationship ${testInfo.project.name}`;
  await loginDemoUser(page);

  await expect(page.getByText(/Relationship Focus/)).toBeVisible();
  await expect(page.getByText("People to Reach Out To", { exact: true })).toBeVisible();
  await openMoreModule(page, "Relationships");
  await expect(page.getByRole("main", { name: "Relationships dashboard" })).toBeVisible();
  await expect(page.getByText(/Relationship Health Summary/)).toBeVisible();
  await expect(page.getByText(/Upcoming Birthdays/).first()).toBeVisible();
  await expect(page.getByText(/Upcoming Planned Time Together/).first()).toBeVisible();
  await expect(page.getByText(/Relationship Goals Progress/).first()).toBeVisible();

  await page.getByRole("button", { name: "Add Person" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill(uniqueName);
  await dialog.getByLabel("Category").selectOption("Friend");
  await dialog.getByLabel("Priority", { exact: true }).selectOption("High");
  await dialog.getByLabel("Interests").fill("Pickleball\nBooks");
  await dialog.getByLabel("Conversation Topics").fill("Family\nCareer");
  await dialog.getByLabel("Activity Ideas").fill("Coffee\nWalk");
  await dialog.getByLabel("Notes").fill("Created by the Relationship OS release test");
  await dialog.getByRole("button", { name: "Save Relationship" }).click();
  await expect(page.getByText(uniqueName, { exact: true })).toBeVisible();

  await page.getByRole("button", { name: `Open ${uniqueName}` }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Notes").fill("Updated relationship note");
  await dialog.getByRole("button", { name: "Save Relationship" }).click();
  await page.getByRole("button", { name: `Log time with ${uniqueName}` }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Type").selectOption("Conversation");
  await dialog.getByLabel("Title (optional)").fill(`Coffee with ${uniqueName}`);
  await dialog.getByRole("button", { name: "Save Activity" }).click();
  await expect(page.getByRole("button", { name: `Open ${uniqueName}` })).toContainText("0 days since contact");

  await page.keyboard.press("Control+K");
  await page.getByPlaceholder("Search people, interests, tasks, lists...").fill("Pickleball");
  await expect(page.getByText(uniqueName, { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Close" }).last().click();

  await openMoreModule(page, "Household Timeline");
  await page.getByLabel("Filter timeline by module").selectOption("relationship");
  await expect(page.getByText(`Coffee with ${uniqueName}`, { exact: true })).toHaveCount(1);
  await openMoreModule(page, "Relationships");

  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(audit.violations.filter(item => item.impact === "critical")).toEqual([]);
  const layout = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, prefersDark: matchMedia("(prefers-color-scheme: dark)").matches, background: getComputedStyle(document.body).backgroundColor }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
  if (testInfo.project.name === "dark-chromium") { expect(layout.prefersDark).toBe(true); expect(layout.background).not.toBe("rgb(255, 255, 255)"); }

  await page.getByRole("button", { name: `Open ${uniqueName}` }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Status").selectOption("Archived");
  await dialog.getByRole("button", { name: "Save Relationship" }).click();
  await expect(page.getByText(uniqueName, { exact: true })).toHaveCount(0);
  assertNoRuntimeFailures(failures);
});
