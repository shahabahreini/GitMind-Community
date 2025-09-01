import { defineConfig } from "@vscode/test-cli";

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
    "--disable-workspace-trust"
  ],
  mocha: {
    ui: "tdd",
    timeout: 25000,
    slow: 10000,
    bail: false
  },
});
