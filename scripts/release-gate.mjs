import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const requiredVersion = "3.4.1";
const docs = ["docs/releases/RELEASE_3_4_1.md", "docs/releases/RELEASE_3_4_1_VALIDATION.md"];
const stages = [
  ["Aggregate code and database validation", ["run", "check"]],
  ["Deterministic seed first pass", ["run", "seed:demo"]],
  ["Deterministic seed second pass", ["run", "seed:demo"]],
  ["Release 3.3-to-3.4 hosted-test upgrade", ["run", "test:db-upgrade-3.4"]],
  ["Dynamic Release 3.4 authorization", ["run", "test:auth-3.4"]],
  ["Disposable blank database", ["run", "db:test:validate-local"]],
  ["Full Playwright regression and accessibility", ["run", "test:regression"]],
];

function block(message) {
  console.error(`RELEASE BLOCKED: ${message}`);
  process.exit(1);
}

if (pkg.version !== requiredVersion) block(`package version ${pkg.version} does not match ${requiredVersion}`);
for (const file of docs) if (!fs.existsSync(file)) block(`missing release document ${file}`);
const branch = spawnSync("git", ["branch", "--show-current"], { encoding: "utf8" }).stdout.trim();
if (branch !== "main") block(`expected main branch, found ${branch || "detached HEAD"}`);
const diffCheck = spawnSync("git", ["diff", "--check"], { stdio: "inherit" });
if (diffCheck.status !== 0) block("git diff --check failed");

for (const [label, args] of stages) {
  console.log(`\n[release-gate] START: ${label}`);
  const command = process.platform === "win32" ? process.execPath : "pnpm";
  const commandArgs = process.platform === "win32" ? [path.join(path.dirname(process.execPath), "node_modules/corepack/dist/pnpm.js"), ...args] : args;
  const result = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (result.status !== 0) block(`${label} failed with exit ${result.status}`);
  console.log(`[release-gate] PASS: ${label}`);
}
console.log(`\nRELEASE READY: FamilyOS ${requiredVersion}`);
