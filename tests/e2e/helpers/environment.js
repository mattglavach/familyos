const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function loadPlaywrightEnvironment(rootDir = process.cwd()) {
  for (const file of [".env.local", ".env.test.local"]) {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) dotenv.config({ path: filePath, override: file === ".env.test.local", quiet: true });
  }
}

function requireValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`[Playwright config] ${name} is required in .env.test.local.`);
  return value;
}

function parseOrigin(name, value) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`[Playwright config] ${name} must be a valid URL origin.`); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`[Playwright config] ${name} must be an http(s) origin without credentials, path, query, or fragment.`);
  }
  return url;
}

function validateBrowserKey(value, expectedProjectRef) {
  if (value.startsWith("sb_secret_")) throw new Error("[Playwright config] REACT_APP_SUPABASE_ANON_KEY must never contain a secret key.");
  const parts = value.split(".");
  if (parts.length !== 3) return;
  let payload;
  try { payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")); } catch { throw new Error("[Playwright config] REACT_APP_SUPABASE_ANON_KEY is malformed."); }
  if (payload.role && payload.role !== "anon") throw new Error("[Playwright config] REACT_APP_SUPABASE_ANON_KEY must have the anon role.");
  if (expectedProjectRef && payload.ref && payload.ref !== expectedProjectRef) {
    throw new Error(`[Playwright config] Anonymous key project mismatch: expected ${expectedProjectRef}.`);
  }
  if (expectedProjectRef && payload.iss === "supabase-demo") {
    throw new Error("[Playwright config] A local Supabase anonymous key cannot be used with the remote test project.");
  }
}

function validatePlaywrightEnvironment() {
  if ((process.env.FAMILYOS_ENV || "").toLowerCase() !== "test") {
    throw new Error("[Playwright config] FAMILYOS_ENV must be exactly test.");
  }

  const email = requireValue("DEMO_USER_EMAIL");
  requireValue("DEMO_USER_PASSWORD");
  const anonKey = requireValue("REACT_APP_SUPABASE_ANON_KEY");
  const supabaseUrl = parseOrigin("REACT_APP_SUPABASE_URL", requireValue("REACT_APP_SUPABASE_URL"));
  const baseUrl = parseOrigin("PLAYWRIGHT_BASE_URL", process.env.PLAYWRIGHT_BASE_URL?.trim() || "http://127.0.0.1:3000");
  const expectedProjectRef = process.env.DEMO_SEED_EXPECTED_PROJECT_REF?.trim();
  const expectedUrl = process.env.DEMO_SEED_EXPECTED_URL?.trim();

  if (!email.toLowerCase().endsWith("@familyos.app")) {
    throw new Error("[Playwright config] DEMO_USER_EMAIL must use the dedicated familyos.app test domain.");
  }
  if (!expectedProjectRef && !expectedUrl) {
    throw new Error("[Playwright config] Set DEMO_SEED_EXPECTED_PROJECT_REF or DEMO_SEED_EXPECTED_URL to the exact test target.");
  }

  const targetHost = supabaseUrl.hostname.toLowerCase();
  const remoteMatch = targetHost.match(/^([a-z0-9-]+)\.supabase\.co$/);
  const localTarget = LOCAL_HOSTS.has(targetHost);
  if (!localTarget && !remoteMatch) {
    throw new Error("[Playwright config] REACT_APP_SUPABASE_URL must target local Supabase or an exact *.supabase.co project origin.");
  }
  if (expectedProjectRef && remoteMatch?.[1] !== expectedProjectRef) {
    throw new Error(`[Playwright config] Supabase project mismatch: expected ${expectedProjectRef}, received ${remoteMatch?.[1] || "a local target"}.`);
  }
  validateBrowserKey(anonKey, expectedProjectRef);
  if (expectedUrl && supabaseUrl.origin !== parseOrigin("DEMO_SEED_EXPECTED_URL", expectedUrl).origin) {
    throw new Error("[Playwright config] REACT_APP_SUPABASE_URL does not match DEMO_SEED_EXPECTED_URL.");
  }
  if (process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "true" && !LOCAL_HOSTS.has(baseUrl.hostname.toLowerCase())) {
    throw new Error("[Playwright config] PLAYWRIGHT_BASE_URL must be loopback when Playwright manages the local web server.");
  }

  const approved = (process.env.REACT_APP_APPROVED_HOUSEHOLD_EMAILS || "")
    .split(",").map(value => value.trim().toLowerCase()).filter(Boolean);
  if (approved.length && !approved.includes(email.toLowerCase())) {
    throw new Error("[Playwright config] DEMO_USER_EMAIL must be included in REACT_APP_APPROVED_HOUSEHOLD_EMAILS when the allowlist is configured.");
  }

  return { baseURL: baseUrl.origin };
}

module.exports = { loadPlaywrightEnvironment, validatePlaywrightEnvironment };
