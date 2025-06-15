const assert = require("assert");

// Mock the settings manager behavior
const PROVIDER_DEFAULTS = {
  openai: { model: "gpt-4o" },
};

// Mock config that returns undefined (simulating no config)
const mockConfig = {
  get: (key, defaultValue) => {
    console.log(`Getting config for ${key}, default: ${defaultValue}`);
    return defaultValue; // This returns undefined when no default is passed
  },
};

// Simulate the logic from buildSettingsFromConfig
const openaiModel =
  mockConfig.get("openai.model") || PROVIDER_DEFAULTS.openai.model;

console.log("OpenAI model from config:", openaiModel);
console.log("Expected: gpt-4o");
console.log("Match:", openaiModel === "gpt-4o");

// Test strict equality
try {
  assert.strictEqual(openaiModel, "gpt-4o");
  console.log("✅ Test passed");
} catch (error) {
  console.log("❌ Test failed:", error.message);
  console.log("Actual type:", typeof openaiModel);
  console.log("Expected type:", typeof "gpt-4o");
  console.log("Actual length:", openaiModel?.length);
  console.log("Expected length:", "gpt-4o".length);
}
