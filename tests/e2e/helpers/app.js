const { expect } = require("@playwright/test");

function demoCredentials() {
  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;
  if (!email || !password) throw new Error("Set DEMO_USER_EMAIL and DEMO_USER_PASSWORD in .env.test.local before browser tests.");
  return { email, password };
}

function monitorPage(page) {
  const failures = { console: [], requests: [], responses: [], page: [] };
  page.on("console", message => { if (message.type() === "error") failures.console.push(message.text()); });
  page.on("pageerror", error => failures.page.push(error.message));
  page.on("requestfailed", request => failures.requests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || "failed"}`));
  page.on("response", response => {
    if (response.status() >= 400) failures.responses.push(`${response.status()} ${response.request().method()} ${response.url()}`);
  });
  return failures;
}

async function loginDemoUser(page) {
  const { email, password } = demoCredentials();
  await page.goto("/");
  if (await page.locator('input[type="email"]').isVisible().catch(() => false)) {
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
  }
  await waitForPageReady(page, "FamilyOS");
}

async function logoutDemoUser(page) {
  await navigateModule(page, "Attention");
  await page.getByRole("button", { name: "Modules", exact: true }).click();
  await page.getByRole("button", { name: /^Settings Core/ }).click();
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page.locator('input[type="email"]')).toBeVisible();
}

async function navigateModule(page, label) {
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: label, exact: true }).click();
  await page.waitForLoadState("networkidle").catch(() => null);
}

async function openMoreModule(page, label) {
  await navigateModule(page, "Attention");
  await page.getByRole("button", { name: "Modules", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
  await waitForPageReady(page, label);
}

async function waitForPageReady(page, text) {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
  await page.waitForLoadState("networkidle").catch(() => null);
}

function assertNoRuntimeFailures(failures) {
  expect(failures.page, `Unhandled exceptions:\n${failures.page.join("\n")}`).toEqual([]);
  expect(failures.responses, `Failed API calls:\n${failures.responses.join("\n")}`).toEqual([]);
  expect(failures.console, `Console errors:\n${failures.console.join("\n")}`).toEqual([]);
  expect(failures.requests, `Network failures:\n${failures.requests.join("\n")}`).toEqual([]);
}

module.exports = { assertNoRuntimeFailures, demoCredentials, loginDemoUser, logoutDemoUser, monitorPage, navigateModule, openMoreModule, waitForPageReady };
