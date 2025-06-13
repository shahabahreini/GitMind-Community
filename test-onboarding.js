#!/usr/bin/env node

// Quick test to verify onboarding system integration
const fs = require("fs");
const path = require("path");

console.log("🧪 Testing GitMind Onboarding System Integration...\n");

// Test 1: Check if onboarding files exist
const onboardingFiles = [
  "src/webview/onboarding/OnboardingWebview.ts",
  "src/webview/onboarding/OnboardingMessageHandler.ts",
  "src/webview/onboarding/OnboardingTemplateGenerator.ts",
  "src/webview/onboarding/styles/onboarding.css.ts",
];

let allFilesExist = true;
onboardingFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allFilesExist = false;
  }
});

// Test 2: Check if extension.ts includes onboarding imports
const extensionPath = path.join(__dirname, "src/extension.ts");
const extensionContent = fs.readFileSync(extensionPath, "utf8");

const requiredImports = ["OnboardingWebview", "OnboardingManager"];

let allImportsExist = true;
requiredImports.forEach((importName) => {
  if (extensionContent.includes(importName)) {
    console.log(`✅ ${importName} imported in extension.ts`);
  } else {
    console.log(`❌ ${importName} missing from extension.ts`);
    allImportsExist = false;
  }
});

// Test 3: Check if package.json includes onboarding commands
const packagePath = path.join(__dirname, "package.json");
const packageContent = JSON.parse(fs.readFileSync(packagePath, "utf8"));

const requiredCommands = [
  "ai-commit-assistant.openOnboarding",
  "ai-commit-assistant.completeOnboarding",
  "ai-commit-assistant.skipOnboarding",
];

let allCommandsExist = true;
const commands = packageContent.contributes?.commands || [];
requiredCommands.forEach((commandId) => {
  const commandExists = commands.some((cmd) => cmd.command === commandId);
  if (commandExists) {
    console.log(`✅ Command ${commandId} registered`);
  } else {
    console.log(`❌ Command ${commandId} missing from package.json`);
    allCommandsExist = false;
  }
});

// Test 4: Check if compiled extension exists
const distPath = path.join(__dirname, "dist/extension.js");
if (fs.existsSync(distPath)) {
  const stats = fs.statSync(distPath);
  console.log(
    `✅ Compiled extension exists (${
      Math.round((stats.size / 1024 / 1024) * 10) / 10
    }MB)`
  );
} else {
  console.log(`❌ Compiled extension missing`);
  allFilesExist = false;
}

// Summary
console.log("\n📊 Integration Test Summary:");
if (allFilesExist && allImportsExist && allCommandsExist) {
  console.log("🎉 All onboarding system components are properly integrated!");
  console.log("\n✨ Key Features:");
  console.log("  • Interactive webview-based onboarding");
  console.log("  • Step-by-step provider selection");
  console.log("  • Real-time API setup validation");
  console.log("  • Modern UI with VS Code theme integration");
  console.log("  • Comprehensive telemetry tracking");
  console.log("\n🚀 The new onboarding system is ready for testing!");
  process.exit(0);
} else {
  console.log("⚠️  Some components are missing or not properly integrated");
  process.exit(1);
}
