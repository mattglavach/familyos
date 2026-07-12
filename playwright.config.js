const { defineConfig, devices } = require("@playwright/test");
const path = require("path");
const { loadPlaywrightEnvironment, validatePlaywrightEnvironment } = require("./tests/e2e/helpers/environment");

loadPlaywrightEnvironment();
const { baseURL } = validatePlaywrightEnvironment();
const authFile = path.join(__dirname, "tests", "e2e", ".auth", "user.json");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER === "true" ? undefined : {
    command: "pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      BROWSER: "none",
      REACT_APP_ENABLE_DEMO_AUTO_LOGIN: "false",
    },
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.js/ },
    { name: "chromium", testIgnore: /auth\.setup\.js/, dependencies: ["setup"], use: { ...devices["Desktop Chrome"], storageState: authFile } },
    { name: "mobile-chromium", testIgnore: /auth\.setup\.js/, dependencies: ["setup"], use: { ...devices["Pixel 5"], viewport: { width: 390, height: 844 }, storageState: authFile } },
  ],
});
