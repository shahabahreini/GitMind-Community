import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { API_KEY_PROVIDER_IDS, KEYLESS_PROVIDER_IDS, PROVIDER_CATALOG, PROVIDER_IDS } from "../../config/providerCatalog";

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

// ── Registry parity guard: provider knowledge lives only in src/config/providerCatalog.ts ──

const PROVIDER_NAMES = Object.values(PROVIDER_CATALOG).map(entry => entry.name);
const PROVIDER_TOKENS = new Set<string>([...PROVIDER_IDS, ...PROVIDER_NAMES]);

/** Files allowed to hold arrays of provider tokens, with the reason. */
const ARRAY_ALLOWLIST: Record<string, string> = {
  "src/webview/settings/components/config/ProviderConfig.ts": "request/response format options ('openai', 'anthropic', 'custom') are wire formats, not provider lists",
  "src/webview/settings/components/managers/ScriptManager.ts": "Load Models button wiring keyed by DOM ids; every id is a catalog id",
  "src/webview/onboarding/OnboardingTemplateGenerator.ts": "onboarding card copy typed by ProviderCatalogId; names come from the catalog",
};

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { return entry.name === "test" ? [] : listSourceFiles(full); }
    return full.endsWith(".ts") ? [full] : [];
  });
}

function productionSources(): Array<{ file: string; source: string }> {
  const root = process.cwd();
  return listSourceFiles(path.join(root, "src"))
    .map(full => ({ file: path.relative(root, full).split(path.sep).join("/"), source: fs.readFileSync(full, "utf8") }))
    .filter(({ file }) => file !== "src/config/providerCatalog.ts");
}

/** Array literals holding 3+ distinct provider ids or names. */
function findProviderListLiterals(source: string): number[] {
  const lines: number[] = [];
  const arrayPattern = /\[([^[\]]*)\]/gs;
  let match: RegExpExecArray | null;
  while ((match = arrayPattern.exec(source)) !== null) {
    const tokens = new Set([...match[1].matchAll(/['"`]([^'"`]+)['"`]/g)].map(m => m[1]).filter(t => PROVIDER_TOKENS.has(t)));
    if (tokens.size >= 3) {
      lines.push(source.slice(0, match.index).split("\n").length);
    }
  }
  return lines;
}

suite("Provider registry parity guard", () => {
  test("no provider id/name lists outside the catalog (except allowlisted wiring)", () => {
    const offenders = productionSources()
      .filter(({ file }) => !ARRAY_ALLOWLIST[file])
      .flatMap(({ file, source }) => findProviderListLiterals(source).map(line => `${file}:${line}`));
    assert.deepStrictEqual(offenders, [], `Derive these lists from PROVIDER_IDS / catalog helpers:\n${offenders.join("\n")}`);
  });

  test("the guard detects a re-added duplicate list", () => {
    const scratch = "const providers = ['ollama', 'copilot', 'lmstudio'];";
    assert.deepStrictEqual(findProviderListLiterals(scratch), [1]);
  });

  test("no requiresApiKey flags, display-name literals, or default-model fallbacks outside the catalog", () => {
    const defaults = Object.values(PROVIDER_CATALOG).map(entry => entry.defaultModel).filter(model => model && model !== "auto");
    const escaped = defaults.map(model => model.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"));
    const fallback = new RegExp(`(\\|\\||\\?\\?|[^=!<>]=)\\s*["'\`](${escaped.join("|")})["'\`]`);
    const offenders = productionSources().flatMap(({ file, source }) => source.split("\n")
      .map((line, index) => ({ line, index }))
      // Known-model type unions and enum members describe capabilities, not defaults.
      .filter(({ line }) => !/^\s*(export\s+)?type\s/.test(line) && !/^\s*[A-Z][A-Z0-9_]*\s*=\s*["']/.test(line))
      .filter(({ line }) => /requiresApiKey:\s*(true|false)/.test(line) || /displayName:\s*["']/.test(line) || /defaultModel:\s*["'][^"']+["']/.test(line) || fallback.test(line))
      .map(({ index }) => `${file}:${index + 1}`));
    assert.deepStrictEqual(offenders, [], `Use the provider catalog instead:\n${offenders.join("\n")}`);
  });

  test("keyless and API-key providers are disjoint, and settings.ts has no inline keyless checks", () => {
    const overlap = KEYLESS_PROVIDER_IDS.filter(id => (API_KEY_PROVIDER_IDS as readonly string[]).includes(id));
    assert.deepStrictEqual(overlap, []);
    const settingsSource = fs.readFileSync(path.join(process.cwd(), "src/config/settings.ts"), "utf8");
    assert.ok(!/provider\s*!==\s*['"][a-z]+['"]/.test(settingsSource), "settings.ts must use catalog helpers for provider checks");
  });

  test("package.json apiProvider enum equals the catalog provider set", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
    const enumValues: string[] = pkg.contributes.configuration.properties["gitmind.apiProvider"].enum;
    assert.deepStrictEqual([...enumValues].sort(), [...PROVIDER_IDS].sort());
  });

  test("onboarding offers every catalog provider", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/webview/onboarding/OnboardingTemplateGenerator.ts"), "utf8");
    const missing = PROVIDER_IDS.filter(id => !source.includes(`{ id: '${id}'`));
    assert.deepStrictEqual(missing, []);
  });

  test("every catalog entry is complete", () => {
    assert.strictEqual(PROVIDER_IDS.length, 25);
    for (const id of PROVIDER_IDS) {
      const entry = PROVIDER_CATALOG[id];
      assert.ok(entry.name && entry.displayName, `${id} needs names`);
      assert.ok(entry.auth && entry.auth.credentialLabel, `${id} needs auth metadata`);
      assert.strictEqual(typeof entry.docsUrl, "string", `${id} needs docsUrl`);
      assert.strictEqual(typeof entry.settingPath, "string", `${id} needs settingPath`);
      if (entry.auth.kind === "apiKey") {
        assert.ok(entry.settingPath.endsWith(".apiKey"), `${id} API key setting path`);
        assert.ok(entry.docsUrl.startsWith("https://"), `${id} needs a credential page`);
      }
    }
  });
});
