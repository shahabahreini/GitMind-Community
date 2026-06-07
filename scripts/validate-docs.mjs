#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const handbook = path.join(root, "docs/handbook");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "docs/reference/gitmind-user-surface.json"), "utf8"));
const errors = [];
const files = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (![".vitepress", "public"].includes(entry.name)) walk(target);
    } else if (entry.name.endsWith(".md")) files.push(target);
  }
}
walk(handbook);
const text = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const fail = (message) => errors.push(message);

if (!manifest.product.version || !manifest.product.auditDate) fail("Manifest lacks required version/audit date metadata.");
for (const file of files) {
  const pageText = fs.readFileSync(file, "utf8");
  if (!pageText.includes(`Verified against GitMind \`${manifest.product.version}\` on June 7, 2026`)) {
    fail(`Handbook page lacks required verification metadata: ${path.relative(root, file)}`);
  }
}
for (const [label, value] of [["provider choices", manifest.counts.providerChoices], ["settings", manifest.counts.settingsRegistered], ["registered commands", manifest.counts.commandsRegistered], ["commit styles", manifest.counts.commitStyles]]) {
  if (!text.includes(String(value))) fail(`Handbook does not state the verified ${label} count (${value}).`);
}
for (const provider of manifest.providers) {
  if (!text.includes(provider.name) || !fs.existsSync(path.join(handbook, `providers/${provider.id}.md`))) fail(`Provider lacks a detailed page: ${provider.id}`);
}
for (const style of manifest.commitStyles) if (!text.includes(`\`${style.id}\``)) fail(`Commit style is undocumented: ${style.id}`);
for (const section of manifest.uiSections) if (!text.toLowerCase().includes(section.toLowerCase())) fail(`UI section is undocumented: ${section}`);
for (const setting of manifest.settings) if (!text.includes(setting.id)) fail(`Public setting is undocumented: ${setting.id}`);
for (const command of manifest.commands) if (!text.includes(command.id)) fail(`Public command is undocumented: ${command.id}`);

const sensitivePatterns = [
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{20,}\b/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /\bGITMIND-PRO-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2,}\b/g,
  /gitmind\.environment\./g,
  /gitmind\.telemetry\.connectionString/g,
];
for (const pattern of sensitivePatterns) if (pattern.test(text)) fail(`Sensitive or internal-only content matched ${pattern}.`);

const sync = spawnSync(process.execPath, ["scripts/sync-wiki.mjs", "--check"], { cwd: root, encoding: "utf8" });
if (sync.status !== 0) fail(sync.stderr.trim() || sync.stdout.trim());

const wiki = path.join(root, "wiki");
const wikiPages = fs.readdirSync(wiki).filter((name) => name.endsWith(".md"));
const wikiNames = new Set(wikiPages.map((name) => name.slice(0, -3)));
const referencedPages = new Set(["Home", "_Sidebar", "_Footer"]);
const wikiAssets = new Set(fs.readdirSync(path.join(wiki, "assets")));
const referencedAssets = new Set();
for (const page of wikiPages) {
  const pageText = fs.readFileSync(path.join(wiki, page), "utf8");
  for (const match of pageText.matchAll(/!?\[[^\]]*]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (target.startsWith("assets/")) {
      const asset = target.slice("assets/".length);
      referencedAssets.add(asset);
      if (!wikiAssets.has(asset)) fail(`Missing Wiki asset '${target}' referenced by ${page}.`);
      continue;
    }
    const normalized = target.replace(/\.md$/, "");
    referencedPages.add(normalized);
    if (!wikiNames.has(normalized)) fail(`Missing Wiki page '${target}' referenced by ${page}.`);
  }
}
for (const page of wikiNames) if (!referencedPages.has(page)) fail(`Orphaned Wiki page: ${page}.md`);
for (const asset of wikiAssets) if (!referencedAssets.has(asset)) fail(`Orphaned Wiki asset: assets/${asset}`);

if (errors.length) {
  console.error(`Documentation validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Documentation validation passed: ${files.length} handbook pages; ${manifest.counts.providerChoices} providers; ${manifest.counts.settingsDocumented} public settings; ${manifest.counts.publicCommands} public commands.`);
