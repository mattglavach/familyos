const { test, expect } = require("@playwright/test");
const { assertNoRuntimeFailures, loginDemoUser, monitorPage, navigateModule } = require("./helpers/app");

const VALUES = {
  free_chlorine: "2.5",
  cc: "0",
  ph: "7.7",
  cya: "50",
  salt: "3150",
  alkalinity: "70",
  water_temp: "89",
};

async function fillPoolValues(page) {
  await page.getByLabel("FC ppm").fill(VALUES.free_chlorine);
  await page.getByLabel("CC ppm").fill(VALUES.cc);
  await page.getByLabel("pH", { exact: true }).fill(VALUES.ph);
  await page.getByLabel("CYA ppm").fill(VALUES.cya);
  await page.getByLabel("Salt ppm").fill(VALUES.salt);
  await page.getByLabel("TA ppm").fill(VALUES.alkalinity);
  await page.getByLabel("Temperature F").fill(VALUES.water_temp);
}

function poolInsert(page) {
  return page.waitForResponse(response => response.request().method() === "POST" && /\/rest\/v1\/pool_readings(?:\?|$)/.test(response.url()));
}

async function responseDetails(response) {
  const text = await response.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: response.status(), statusText: response.statusText(), body };
}

async function assertPersistedRecord(page, response, failures) {
  const details = await responseDetails(response);
  expect(details, `Pool insert failed: ${JSON.stringify(details)}`).toMatchObject({ status: 201 });
  const record = details.body;
  expect(record.id).toBeTruthy();
  expect(record).toMatchObject({
    free_chlorine: 2.5, cc: 0, ph: 7.7, cya: 50, salt: 3150, alkalinity: 70, water_temp: 89,
  });
  for (const key of ["calcium_hardness", "filter_pressure", "swg_setting", "pump_hours", "notes"]) expect(record[key]).toBeNull();
  for (const key of ["free_chlorine", "cc", "ph", "cya", "salt", "alkalinity", "water_temp"]) expect(typeof record[key]).toBe("number");
  expect(Number.isNaN(Date.parse(`${record.date}T12:00:00`))).toBe(false);
  expect(Number.isNaN(Date.parse(record.logged_at))).toBe(false);
  expect(record.household_id).toBeTruthy();
  expect(record.user_id).toBeTruthy();

  await expect(page.getByRole("status")).toBeVisible();
  const recent = page.getByRole("button", { name: "Recent Activity" });
  if (await recent.getAttribute("aria-expanded") === "false") await recent.click();
  await expect(page.getByText("Water tested").first()).toBeVisible();
  await expect(page.getByText("Last tested:", { exact: true }).locator("..")).toContainText("today");

  const reloadRows = page.waitForResponse(async candidate => candidate.request().method() === "GET" && /\/rest\/v1\/pool_readings(?:\?|$)/.test(candidate.url()) && candidate.ok());
  await page.reload();
  const rowsResponse = await reloadRows;
  const rows = await rowsResponse.json();
  expect(rows.filter(row => row.id === record.id)).toHaveLength(1);
  const reloaded = rows.find(row => row.id === record.id);
  expect(reloaded).toMatchObject({ id: record.id, household_id: record.household_id, user_id: record.user_id, cc: 0, free_chlorine: 2.5, ph: 7.7 });
  await navigateModule(page, "Pool");
  await expect(page.getByText("Last tested:", { exact: true }).locator("..")).toContainText("today");
  const refreshedRecent = page.getByRole("button", { name: "Recent Activity" });
  if (await refreshedRecent.getAttribute("aria-expanded") === "false") await refreshedRecent.click();
  await expect(page.getByText("Water tested").first()).toBeVisible();
  assertNoRuntimeFailures(failures);

  const request = response.request();
  const headers = await request.allHeaders();
  const cleanup = await page.request.delete(`${response.url().split("?")[0]}?id=eq.${record.id}`, { headers: { apikey: headers.apikey, authorization: headers.authorization } });
  expect(cleanup.ok(), `Test Pool record ${record.id} cleanup failed: ${cleanup.status()} ${await cleanup.text()}`).toBe(true);
  return record;
}

test("full Pool form saves one real reading and persists through refresh", async ({ page }) => {
  const failures = monitorPage(page);
  await loginDemoUser(page);
  await navigateModule(page, "Pool");
  await page.getByRole("button", { name: "Log Test", exact: true }).click();
  await fillPoolValues(page);
  const insert = poolInsert(page);
  await page.getByRole("button", { name: "Save Test", exact: true }).click();
  const response = await insert;
  { const details = await responseDetails(response); expect(details.status, JSON.stringify(details)).toBe(201); }
  await expect(page.getByRole("status")).toHaveText("Pool test saved.");
  await assertPersistedRecord(page, response, failures);
});

test("Quick Add Pool Test saves one real reading and persists through refresh", async ({ page }) => {
  const failures = monitorPage(page);
  await loginDemoUser(page);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Pool Test Ready", exact: true }).click();
  await fillPoolValues(page);
  const insert = poolInsert(page);
  await page.getByRole("button", { name: "Save Reading", exact: true }).click();
  const response = await insert;
  { const details = await responseDetails(response); expect(details.status, JSON.stringify(details)).toBe(201); }
  await expect(page.getByRole("status")).toContainText("Pool reading saved.");
  await assertPersistedRecord(page, response, failures);
});

test("full Pool form retains values on persistence failure and blocks duplicate submission", async ({ page }) => {
  await loginDemoUser(page);
  await navigateModule(page, "Pool");
  let posts = 0;
  await page.route("**/rest/v1/pool_readings*", async route => {
    if (route.request().method() === "POST") { posts += 1; await new Promise(resolve => setTimeout(resolve, 300)); return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ code: "TEST_FAILURE", message: "Controlled persistence failure", details: "Regression coverage", hint: "No database mutation occurred" }) }); }
    return route.continue();
  });
  await page.getByRole("button", { name: "Log Test", exact: true }).click();
  await fillPoolValues(page);
  await page.getByRole("button", { name: "Save Test", exact: true }).dblclick();
  await expect(page.getByText("Pool test could not be saved right now.")).toBeVisible();
  expect(posts).toBe(1);
  await expect(page.getByLabel("CC ppm")).toHaveValue("0");
  await expect(page.getByLabel("pH", { exact: true })).toHaveValue("7.7");
});

test("Quick Add retains values on persistence failure and blocks duplicate submission", async ({ page }) => {
  await loginDemoUser(page);
  let posts = 0;
  await page.route("**/rest/v1/pool_readings*", async route => {
    if (route.request().method() === "POST") { posts += 1; await new Promise(resolve => setTimeout(resolve, 300)); return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ code: "TEST_FAILURE", message: "Controlled persistence failure", details: "Regression coverage", hint: "No database mutation occurred" }) }); }
    return route.continue();
  });
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Pool Test Ready", exact: true }).click();
  await fillPoolValues(page);
  await page.getByRole("button", { name: "Save Reading", exact: true }).dblclick();
  await expect(page.getByText("Pool reading could not be saved right now.")).toBeVisible();
  expect(posts).toBe(1);
  await expect(page.getByLabel("CC ppm")).toHaveValue("0");
  await expect(page.getByLabel("pH", { exact: true })).toHaveValue("7.7");
});
