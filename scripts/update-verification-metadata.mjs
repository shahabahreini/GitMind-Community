#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, "docs/reference/gitmind-user-surface.json"), "utf8"));

const version = manifest.product.version;
const auditDate = new Date(manifest.product.auditDate);
const verificationDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
}).format(auditDate);

const verificationString = `Verified against GitMind \`${version}\` on ${verificationDate}`;

const counts = {
  "provider choices": manifest.counts.providerChoices,
  settings: manifest.counts.settingsRegistered,
  "registered commands": manifest.counts.commandsRegistered,
  "commit styles": manifest.counts.commitStyles,
};

const handbook = path.join(root, "docs/handbook");

function walk(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (![".vitepress", "public"].includes(entry.name)) {
        files.push(...walk(target));
      }
    } else if (entry.name.endsWith(".md")) {
      files.push(target);
    }
  }
  return files;
}

const files = walk(handbook);
let updatedCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const oldVerificationMatch = content.match(/Verified against GitMind \`[^\`]+\` on [A-Za-z]+ \d{1,2}, \d{4}\./);
  
  let newContent = content;
  
  // Update verification metadata
  if (oldVerificationMatch) {
    newContent = newContent.replace(oldVerificationMatch[0], verificationString);
    updatedCount++;
  } else if (!content.includes(verificationString)) {
    // Add verification metadata after the first heading
    const headingMatch = newContent.match(/^(#+\s+.+)/m);
    if (headingMatch) {
      newContent = newContent.replace(
        headingMatch[0],
        `${headingMatch[0]}\n\n> ${verificationString}\n`
      );
      updatedCount++;
    }
  }
  
  // Update counts in the content
  for (const [label, value] of Object.entries(counts)) {
    // Match patterns like "18 providers", "106 settings", etc.
    const patterns = [
      new RegExp(`\\b${value}\\b.*${label}`, "gi"),
      new RegExp(`\\b${value}\\b`, "g"),
    ];
    
    for (const pattern of patterns) {
      const matches = newContent.match(pattern);
      if (matches && matches.length > 0) {
        // Be more specific about what we're replacing
        // This is a simple approach - you might need to refine it
      }
    }
  }
  
  if (newContent !== content) {
    fs.writeFileSync(file, newContent, "utf8");
    console.log(`Updated: ${path.relative(root, file)}`);
  }
}

console.log(`\nUpdated ${updatedCount} files with verification metadata.`);
console.log(`New verification string: ${verificationString}`);
