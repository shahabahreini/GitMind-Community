import { defineConfig } from "@vscode/test-cli";
import os from "os";
import path from "path";

export default defineConfig({
  files: "out/test/**/*.test.js",
  workspaceFolder: "./test-workspace",
  extensionDevelopmentPath: "./",
  extensionTestsPath: "./out/test",
  downloadVersion: "stable",
  launchArgs: [
    "--disable-extensions",
    "--skip-welcome",
    "--skip-release-notes",
    "--disable-workspace-trust",
    `--user-data-dir=${path.join(os.tmpdir(), "vsc-test-ud")}`
  ],
  mocha: {
    ui: "tdd",
    timeout: 25000,
    slow: 10000,
    bail: false
  },
});
