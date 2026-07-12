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
  const title = "Schedule annual physical";
  const completeResponse = page.waitForResponse(response => response.request().method() === "PATCH" && response.url().includes("/rest/v1/tasks"));
  await page.getByRole("checkbox", { name: `Complete ${title}` }).click();
  expect((await completeResponse).ok()).toBe(true);
  await page.reload();
  await navigateModule(page, "Tasks");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.locator('select[aria-label="Status"]').selectOption({ label: "Completed" });
  await expect(page.getByRole("checkbox", { name: `Reopen ${title}` })).toBeVisible();
  const reopenResponse = page.waitForResponse(response => response.request().method() === "PATCH" && response.url().includes("/rest/v1/tasks"));
  await page.getByRole("checkbox", { name: `Reopen ${title}` }).click();
  expect((await reopenResponse).ok()).toBe(true);
  await page.locator('select[aria-label="Status"]').selectOption({ label: "All status" });
  await expect(page.getByText(title)).toBeVisible();
});

test("task mutation failure shows a controlled error", async ({ page }) => {
  await loginDemoUser(page);
  await page.route("**/rest/v1/tasks*", async route => {
    if (route.request().method() === "PATCH") return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "controlled test failure" }) });
    return route.continue();
  });
  await navigateModule(page, "Tasks");
  await page.getByRole("checkbox", { name: "Complete Take recycling to curb" }).click();
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
  await expect(page.getByRole("button", { name: new RegExp(`^${title} updated`) })).not.toBeVisible();
});

test("responsive navigation remains usable", async ({ page }) => {
  await loginDemoUser(page);
  for (const label of ["Home", "Tasks", "Calendar", "Pool", "More"]) {
    await navigateModule(page, label);
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
});

test("Home and AI Workspace retain accessible names, focus, and responsive containment", async ({ page }) => {
  await loginDemoUser(page);
  await expect(page.getByText(/Today's Focus/i).first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBe(false);
  await navigateModule(page, "More");
  await page.getByRole("button", { name: /AI Workspace/ }).click();
  await expect(page.getByRole("heading", { name: "Ask FamilyOS" })).toBeVisible();
  await expect(page.getByLabel("Favorite current prompt")).toBeVisible();
  await expect(page.getByLabel("AI response to review")).toBeVisible();
});

test("global Add and Pool History expose the refined actions", async ({ page }) => {
  await loginDemoUser(page);
  const nav = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(nav.getByRole("button", { name: "Add", exact: true })).toHaveCount(0);
  await expect(nav.getByRole("button", { name: "Pool", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Calendar status:/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Settings", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  for (const action of ["Task Ready", "Calendar Event Google", "Pool Test Ready", "Maintenance Ready", "Shopping Item Ready", "Life Item Ready", "Note Ready"]) await expect(page.getByRole("button", { name: action, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await navigateModule(page, "Pool");
  await page.getByRole("button", { name: "History", exact: true }).click();
  const editButton = page.getByRole("button", { name: /^Edit .* entry$/ }).first();
  const deleteButton = page.getByRole("button", { name: /^Delete .* entry$/ }).first();
  await expect(editButton).toBeVisible();
  await expect(deleteButton).toBeVisible();
  await editButton.click();
  await expect(page.getByRole("heading", { name: /^Edit Pool Test$|^Chemical Added$|^Maintenance or Pool Note$/ })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await deleteButton.click();
  await expect(page.getByText("Delete pool history entry?")).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
});
