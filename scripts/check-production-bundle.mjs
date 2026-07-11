import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const directory = join(process.cwd(), "build", "static", "js");
const forbidden = [
  "test@familyos.app",
  "Local demo sign-in could not complete",
  "REACT_APP_DEMO_PASSWORD",
  "REACT_APP_DEMO_EMAIL",
  "demoAutoLogin",
  "tryDevelopmentDemoLogin",
];
const files = (await readdir(directory)).filter(file => file.endsWith(".js"));
if (!files.length) throw new Error("No production JavaScript bundles were found. Run pnpm run build first.");
const contents = await Promise.all(files.map(file => readFile(join(directory, file), "utf8")));
const found = forbidden.filter(marker => contents.some(content => content.includes(marker)));
if (found.length) throw new Error(`Production bundle contains development auto-login markers: ${found.join(", ")}`);
console.log(`[bundle-safety] Passed: ${forbidden.length} development-only markers absent from ${files.length} production JavaScript bundle(s).`);
