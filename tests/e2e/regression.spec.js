const { test, expect } = require("@playwright/test");
const { loginDemoUser, navigateModule } = require("./helpers/app");

test("authentication can sign out and sign back in", async ({ page }) => {
  await loginDemoUser(page);
  await navigateModule(page, "More");
  await page.getByRole("button", { name: /^Settings/ }).click();
  await page.getByRole("button", { name: /Sign out/i }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await loginDemoUser(page);
});

test("task CRUD round trip", async ({ page }) => {
  await loginDemoUser(page);
  await navigateModule(page, "Tasks");
  const title = `Playwright task ${Date.now()}`;
  await page.getByRole("button", { name: "New Task" }).click();
  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText(title)).toBeVisible();
  await page.getByRole("button", { name: `Edit ${title}` }).click();
  await page.getByLabel("Title").fill(`${title} updated`);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(`${title} updated`)).toBeVisible();
  await page.getByRole("button", { name: `Delete ${title} updated` }).click();
  await page.getByRole("button", { name: "Delete task" }).click();
  await expect(page.getByText(`${title} updated`)).not.toBeVisible();
});

test("responsive navigation remains usable", async ({ page }) => {
  await loginDemoUser(page);
  for (const label of ["Home", "Tasks", "Calendar", "More"]) {
    await navigateModule(page, label);
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});
