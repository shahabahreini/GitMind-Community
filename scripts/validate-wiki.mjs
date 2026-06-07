#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const wikiDir = path.join(root, "wiki");
const errors = [];

const fail = (message) => errors.push(message);
const files = fs.readdirSync(wikiDir, { withFileTypes: true });
const pages = files
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .map((entry) => entry.name);
const pageNames = new Set(pages.map((name) => name.slice(0, -3)));
const assetDir = path.join(wikiDir, "assets");
const assets = fs.existsSync(assetDir)
  ? fs.readdirSync(assetDir).filter((name) => fs.statSync(path.join(assetDir, name)).isFile())
  : [];
const referencedPages = new Set(["Home", "_Sidebar", "_Footer"]);
const referencedAssets = new Set();
const allWikiText = pages
  .map((name) => fs.readFileSync(path.join(wikiDir, name), "utf8"))
  .join("\n");

for (const page of pages) {
  if (!/^(_Sidebar|_Footer|Home|[A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*)\.md$/.test(page)) {
    fail(`Invalid Wiki filename: ${page}`);
  }

  const text = fs.readFileSync(path.join(wikiDir, page), "utf8");
  if (!text.includes("Verified against GitMind `5.0.0` on June 7, 2026")) {
    fail(`Missing verification statement: ${page}`);
  }

  for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (target.startsWith("assets/")) {
      const asset = target.slice("assets/".length);
      referencedAssets.add(asset);
      if (!assets.includes(asset)) fail(`Missing asset '${target}' referenced by ${page}`);
      continue;
    }
    const normalized = target.replace(/\.md$/, "");
    referencedPages.add(normalized);
    if (!pageNames.has(normalized)) fail(`Missing page '${target}' referenced by ${page}`);
  }

  for (const match of text.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)) {
    const asset = match[1].slice("assets/".length);
    referencedAssets.add(asset);
    if (!assets.includes(asset)) fail(`Missing asset '${match[1]}' referenced by ${page}`);
  }
}

for (const page of pageNames) {
  if (!referencedPages.has(page)) fail(`Orphaned Wiki page: ${page}.md`);
}
for (const asset of assets) {
  if (!referencedAssets.has(asset)) fail(`Orphaned Wiki asset: assets/${asset}`);
}

const sensitivePatterns = [
  ["GitHub token", /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g],
  ["OpenAI-style key", /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["GitMind license key", /\bGITMIND-PRO-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2,}\b/g],
];
for (const [label, pattern] of sensitivePatterns) {
  if (pattern.test(allWikiText)) fail(`Possible ${label} found in Wiki content`);
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const settings = Object.keys(pkg.contributes.configuration.properties);
const intentionallyExcluded = [
  /^gitmind\.telemetry\.connectionString$/,
  /^gitmind\.promptCustomization\.lastPrompt$/,
  /^gitmind\.pro\.(licenseKey|validationStatus|lastValidation|instanceId)$/,
  /^gitmind\.subscription\./,
  /^gitmind\.environment\./,
];
for (const setting of settings) {
  const documentedSetting = setting.replace(/^aiCommitAssistant\./, "gitmind.");
  if (intentionallyExcluded.some((pattern) => pattern.test(documentedSetting))) continue;
  if (!allWikiText.includes(documentedSetting)) {
    fail(`Public setting is not documented: ${documentedSetting}`);
  }
}

if (errors.length) {
  console.error(`Wiki validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Wiki validation passed: ${pages.length} pages, ${assets.length} assets, ${settings.length} settings audited.`);
