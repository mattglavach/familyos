const path = require("path");
const { test: setup, expect } = require("@playwright/test");
const { demoCredentials, monitorPage } = require("./helpers/app");

const authFile = path.join(__dirname, ".auth", "user.json");

setup("authenticate dedicated test user", async ({ page }) => {
  const { email, password } = demoCredentials();

  await page.goto("/");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  const failures = monitorPage(page);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  const navigation = page.getByRole("navigation", { name: "Primary navigation" });
  const authError = page.locator('[role="alert"]');
  await expect(navigation.or(authError)).toBeVisible();
  if (await authError.isVisible()) {
    throw new Error(`Dedicated test-user sign-in failed: ${await authError.textContent()}`);
  }
  await expect(navigation).toBeVisible();
  await expect(page.getByText("No active household was found for this account.")).not.toBeVisible();

  const relevantFailures = failures.responses.filter(item => /\/auth\/v1\/|\/rest\/v1\/(profiles|household_members|households)/.test(item));
  if (failures.page.length || failures.requests.length || relevantFailures.length) {
    throw new Error(`Authentication setup runtime failure. Page errors: ${failures.page.length}; failed requests: ${failures.requests.length}; failed auth/household responses: ${relevantFailures.length}.`);
  }

  await page.context().storageState({ path: authFile });
});
