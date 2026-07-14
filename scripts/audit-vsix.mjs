import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync(
  process.execPath,
  ["node_modules/@vscode/vsce/vsce", "ls", "--no-yarn"],
  { encoding: "utf8" },
)
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const forbidden = [
  /^\.codex(?:\/|$)/,
  /^scratch(?:\/|$)/,
  /(?:^|\/)\.claude(?:\/|$)/,
  /^src(?:\/|$)/,
  /(?:^|\/)test(?:\/|$)/,
  /^scripts(?:\/|$)/,
  /^(?:pnpm-lock\.yaml|pnpm-workspace\.yaml|yarn\.lock)$/,
];

const violations = files.filter((file) => forbidden.some((pattern) => pattern.test(file)));
if (violations.length > 0) {
  console.error(`VSIX contains forbidden development files:\n${violations.join("\n")}`);
  process.exit(1);
}

if (!files.includes("dist/extension.js")) {
  console.error("VSIX is missing dist/extension.js");
  process.exit(1);
}

const bundledSource = readFileSync("dist/extension.js", "utf8");
const forbiddenSecrets = [
  "LEMONSQUEEZY_API_KEY",
  "LEMONSQUEEZY_STORE_ID",
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9",
];
for (const secret of forbiddenSecrets) {
  if (bundledSource.includes(secret)) {
    console.error(`Bundled extension contains forbidden privileged credential marker: ${secret}`);
    process.exit(1);
  }
}

console.log(`VSIX content audit passed: ${files.length} files.`);
