const { test, expect } = require("@playwright/test");
const { loginDemoUser, logoutDemoUser, navigateModule } = require("./helpers/app");

test("authentication can sign out and sign back in", async ({ page }) => {
  await loginDemoUser(page);
  await logoutDemoUser(page);
  await loginDemoUser(page);
});

test("task completion persists after reload and can be reopened", async ({ page }) => {
  await loginDemoUser(page);
  await navigateModule(page, "Tasks");
  const title = "Take recycling to curb";
  await page.getByRole("button", { name: `Complete ${title}` }).click();
  await page.reload();
  await navigateModule(page, "Tasks");
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(page.getByRole("button", { name: `Reopen ${title}` })).toBeVisible();
  await page.getByRole("button", { name: `Reopen ${title}` }).click();
  await expect(page.getByText(title)).toBeVisible();
});

test("task mutation failure shows a controlled error", async ({ page }) => {
  await loginDemoUser(page);
  await page.route("**/rest/v1/tasks*", async route => {
    if (route.request().method() === "PATCH") return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "controlled test failure" }) });
    return route.continue();
  });
  await navigateModule(page, "Tasks");
  await page.getByRole("button", { name: "Complete Take recycling to curb" }).click();
  await expect(page.getByText("Task could not be completed right now.")).toBeVisible();
});

test("tasks shows a meaningful empty state", async ({ page }) => {
  await loginDemoUser(page);
  await page.route("**/rest/v1/tasks*", route => route.request().method() === "GET"
    ? route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    : route.continue());
  await navigateModule(page, "Tasks");
  await expect(page.getByText("Create your first task")).toBeVisible();
});

test("tasks exposes a loading state during a delayed request", async ({ page }) => {
  await loginDemoUser(page);
  await page.route("**/rest/v1/tasks*", async route => {
    if (route.request().method() === "GET") await new Promise(resolve => setTimeout(resolve, 1200));
    await route.continue();
  });
  const navigation = navigateModule(page, "Tasks");
  await expect(page.getByTestId("tasks-loading")).toBeVisible();
  await navigation;
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
