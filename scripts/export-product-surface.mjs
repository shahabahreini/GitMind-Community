#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const input = process.argv[2] || process.env.GITMIND_PRODUCT_SOURCE || "ai-commit-assistant-5.0.2.vsix";
const output = path.join(root, "docs/reference/gitmind-user-surface.json");
const auditDate = process.env.GITMIND_AUDIT_DATE || "2026-06-07";

function loadPackage(source) {
  const absolute = path.resolve(root, source);
  if (!fs.existsSync(absolute)) throw new Error(`Product source does not exist: ${source}`);
  if (absolute.endsWith(".vsix")) {
    return JSON.parse(execFileSync("unzip", ["-p", absolute, "extension/package.json"], { encoding: "utf8" }));
  }
  const packagePath = fs.statSync(absolute).isDirectory() ? path.join(absolute, "package.json") : absolute;
  return JSON.parse(fs.readFileSync(packagePath, "utf8"));
}

const pkg = loadPackage(input);
const properties = pkg.contributes?.configuration?.properties || {};
const providerSetting = properties["gitmind.apiProvider"];
const styleSetting = properties["gitmind.commitStyle.style"];
if (!providerSetting || !styleSetting) throw new Error("Source does not expose the GitMind 5.x user surface.");

const internalSettings = [
  /^gitmind\.telemetry\.connectionString$/,
  /^gitmind\.promptCustomization\.lastPrompt$/,
  /^gitmind\.pro\.(licenseKey|validationStatus|lastValidation|instanceId)$/,
  /^gitmind\.subscription\./,
  /^gitmind\.environment\./,
];
const internalCommands = /^(Internal:|Debug:)|gitmind\.(acceptInput|loadingIndicator|loadingIndicatorPro|handleUserStatusChange|cleanupLegacySettings|forceDeactivatePro|checkApiConfig)$/;
const providerNames = {
  gemini: "Google Gemini", huggingface: "Hugging Face", ollama: "Ollama", mistral: "Mistral AI",
  cohere: "Cohere", openai: "OpenAI", together: "Together AI", openrouter: "OpenRouter",
  anthropic: "Anthropic", minimax: "MiniMax", copilot: "GitHub Copilot", deepseek: "DeepSeek",
  grok: "xAI Grok", groq: "Groq", perplexity: "Perplexity", zai: "Z.ai", nvidia: "NVIDIA hosted NIM",
  custom: "Custom API",
};
const setupLinks = {
  gemini: "https://aistudio.google.com/app/apikey", huggingface: "https://huggingface.co/settings/tokens",
  ollama: "https://ollama.com/library", mistral: "https://console.mistral.ai/", cohere: "https://dashboard.cohere.com/api-keys",
  openai: "https://platform.openai.com/api-keys", together: "https://api.together.xyz/settings/api-keys",
  openrouter: "https://openrouter.ai/keys", anthropic: "https://console.anthropic.com/", minimax: "https://platform.minimax.io/",
  deepseek: "https://platform.deepseek.com/api_keys", grok: "https://console.x.ai/", groq: "https://console.groq.com/keys",
  perplexity: "https://www.perplexity.ai/settings/api", zai: "https://z.ai/", nvidia: "https://build.nvidia.com/models",
};

function settingRecord([id, setting]) {
  const record = {
    id,
    type: setting.type,
    default: setting.default ?? null,
    availability: id.includes(".pro.") || id.startsWith("gitmind.custom.") || id.startsWith("gitmind.commitStyle.gitmoji.") ? "Pro" : "Free",
    description: setting.description || setting.markdownDescription || "",
  };
  if (setting.enum) record.values = setting.enum;
  if (setting.minimum !== undefined) record.minimum = setting.minimum;
  if (setting.maximum !== undefined) record.maximum = setting.maximum;
  return record;
}

const settings = Object.entries(properties)
  .filter(([id]) => !internalSettings.some((pattern) => pattern.test(id)))
  .map(settingRecord);
const providers = providerSetting.enum.map((id) => ({
  id,
  name: providerNames[id],
  availability: id === "custom" ? "Pro" : "Free",
  authentication: id === "ollama" ? "Local server" : id === "copilot" ? "GitHub Copilot sign-in" : id === "custom" ? "Configurable" : "API key",
  setupUrl: setupLinks[id] || null,
  defaultModel: properties[`gitmind.${id}.model`]?.default ?? null,
  fields: settings.filter((setting) => setting.id.startsWith(`gitmind.${id}.`)).map((setting) => setting.id),
  modelDiscovery: id !== "custom",
}));
const registeredCommands = pkg.contributes?.commands || [];
const commands = registeredCommands.map((command) => ({
  id: command.command,
  title: command.title,
  public: !internalCommands.test(`${command.title}|${command.command}`),
  shortcut: (pkg.contributes?.keybindings || []).find((binding) => binding.command === command.command) || null,
})).filter((command) => command.public).map(({ public: isPublic, ...command }) => command);

const manifest = {
  schemaVersion: 1,
  product: { name: "GitMind", version: pkg.version, auditDate, source: path.basename(input), minimumVSCode: pkg.engines?.vscode || null },
  counts: {
    providerChoices: providers.length,
    builtInProviders: providers.filter((provider) => provider.id !== "custom").length,
    settingsRegistered: Object.keys(properties).length,
    settingsDocumented: settings.length,
    commandsRegistered: registeredCommands.length,
    publicCommands: commands.length,
    commitStyles: styleSetting.enum.length,
    primarySettingsTabs: 5,
  },
  providers,
  settings,
  commands,
  commitStyles: styleSetting.enum.map((id, index) => ({
    id,
    description: styleSetting.enumDescriptions?.[index] || "",
    availability: id === "basic" ? "Free" : "Pro",
  })),
  uiSections: ["Status dashboard", "Model Settings", "Free Features", "Commit Styles", "Pro Features", "Pro Activation", "Diagnostics", "Onboarding"],
  workflows: ["Staged changes", "Capture All Changes", "Untracked files", "Multi-repository workspaces", "Custom context", "Saved prompts", "Cancellation", "Generated-message review"],
  limits: settings.filter((setting) => setting.minimum !== undefined || setting.maximum !== undefined),
  excluded: {
    settings: ["transport credentials", "managed prompt state", "managed license state", "subscription state", "developer environment settings"],
    commands: `${registeredCommands.length - commands.length} internal or implementation-only commands omitted`,
  },
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Exported GitMind ${pkg.version}: ${providers.length} providers, ${settings.length}/${Object.keys(properties).length} settings, ${registeredCommands.length} registered/${commands.length} public commands, ${styleSetting.enum.length} styles.`);
