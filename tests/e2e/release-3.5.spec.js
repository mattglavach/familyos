const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { loginDemoUser } = require("./helpers/app");

test("Release 3.5 Morning Command Center is concise, responsive, and accessible", async ({ page }) => {
  await loginDemoUser(page);
  await expect(page.getByRole("heading", { name: "Morning Command Center" })).toBeVisible();
  await expect(page.getByText("Best Next Action", { exact: true })).toHaveCount(1);
  const brief = page.locator("section[aria-labelledby='family-brief-title']");
  const recommendationCount = await brief.locator("[class*='border-l-4']").count();
  expect(recommendationCount).toBeGreaterThan(0);
  expect(recommendationCount).toBeLessThanOrEqual(3);
  await expect(brief.getByText("Next 7 Days", { exact: true })).toBeVisible();
  await brief.getByText("Next 7 Days", { exact: true }).click();
  await expect(brief.getByRole("button", { name: "Calendar" }).first()).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include("section[aria-labelledby='family-brief-title']").withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(accessibility.violations.filter(item => item.impact === "critical")).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
