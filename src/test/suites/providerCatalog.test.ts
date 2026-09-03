import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { PROVIDER_CATALOG } from "../../config/providerCatalog";

suite("Provider catalog consistency", () => {
  test("package model defaults match the centralized provider catalog", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    const properties = pkg.contributes.configuration.properties as Record<string, { default?: string }>;

    for (const [provider, entry] of Object.entries(PROVIDER_CATALOG)) {
      const setting = properties[`gitmind.${provider}.model`];
      if (!setting || entry.defaultModel.length === 0) { continue; }
      assert.strictEqual(
        setting.default,
        entry.defaultModel,
        `${provider} package default must match the provider catalog`
      );
    }
  });

  test("VS Code settings do not ship a second static model list", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    const properties = pkg.contributes.configuration.properties as Record<string, { enum?: string[]; enumDescriptions?: string[]; examples?: string[] }>;

    for (const [settingKey, setting] of Object.entries(properties)) {
      if (!settingKey.endsWith(".model")) { continue; }
      assert.strictEqual(setting.enum, undefined, `${settingKey} must use the centralized selector or free-form model ID`);
      assert.strictEqual(setting.enumDescriptions, undefined, `${settingKey} must not carry stale model descriptions`);
      assert.strictEqual(setting.examples, undefined, `${settingKey} must not carry stale model suggestions`);
    }
  });
});
