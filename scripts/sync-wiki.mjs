#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const handbook = path.join(root, "docs/handbook");
const wiki = path.join(root, "wiki");
const check = process.argv.includes("--check");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "docs/reference/gitmind-user-surface.json"), "utf8"));
const generated = new Map();

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === ".vitepress" || entry.name === "public" ? [] : walk(target);
    return entry.name.endsWith(".md") ? [target] : [];
  });
}

function wikiName(file) {
  const relative = path.relative(handbook, file);
  if (relative === "index.md") return "Home.md";
  return relative.replaceAll(path.sep, "-");
}

function transform(text) {
  return text
    .replace(/^---\n[\s\S]*?\n---\n+/u, "")
    .replace(/\]\(\/AI-Commit-Assistant\/assets\//g, "](assets/")
    .replace(/\]\(\/assets\//g, "](assets/")
    .replace(/\]\(providers\/([^)#]+)\)/g, "](providers-$1)")
    .replace(/\]\(\.\.\/([^)#]+)\)/g, "]($1)")
    .replace(/\]\(\.\/([^)#]+)\)/g, "]($1)");
}

for (const file of walk(handbook)) generated.set(wikiName(file), transform(fs.readFileSync(file, "utf8")));
const links = [...generated.keys()]
  .filter((name) => !["Home.md", "Coverage-Audit.md", "Commands-And-Shortcuts.md"].includes(name))
  .sort()
  .map((name) => `- [${name.slice(0, -3).replaceAll("-", " ")}](${name.slice(0, -3)})`)
  .join("\n");
generated.set("_Sidebar.md", `**GitMind 5.x Handbook**\n\nVerified against GitMind \`${manifest.product.version}\` on June 7, 2026.\n\n- [Home](Home)\n${links}\n- [Commands And Shortcuts](Commands-And-Shortcuts)\n- [Coverage Audit](Coverage-Audit)\n`);
generated.set("_Footer.md", `GitMind Wiki | Generated from \`docs/handbook/\` | Verified against GitMind \`${manifest.product.version}\` on June 7, 2026 | [Pages handbook](https://shahabahreini.github.io/AI-Commit-Assistant/) | [Support](https://github.com/shahabahreini/AI-Commit-Assistant/issues)\n`);

const assetSource = path.join(handbook, "public/assets");
for (const name of fs.readdirSync(assetSource)) generated.set(`assets/${name}`, fs.readFileSync(path.join(assetSource, name)));

if (check) {
  const actual = new Map();
  function readExisting(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) readExisting(target);
      else actual.set(path.relative(wiki, target), fs.readFileSync(target));
    }
  }
  readExisting(wiki);
  const mismatches = [...new Set([...generated.keys(), ...actual.keys()])].filter((name) => {
    if (!generated.has(name) || !actual.has(name)) return true;
    return !Buffer.from(generated.get(name)).equals(actual.get(name));
  });
  if (mismatches.length) {
    console.error(`Wiki mirror is stale: ${mismatches.join(", ")}`);
    process.exit(1);
  }
  console.log(`Wiki mirror is current: ${generated.size} files.`);
  process.exit(0);
}

fs.rmSync(wiki, { recursive: true, force: true });
for (const [name, content] of generated) {
  const destination = path.join(wiki, name);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
}
console.log(`Generated Wiki mirror: ${generated.size} files.`);
