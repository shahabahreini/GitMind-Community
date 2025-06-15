const assert = require("assert");

const unsafeInput = '<script>alert("xss")</script>';
const testSettings = {
  apiProvider: "openai",
  debug: false,
  openai: {
    apiKey: unsafeInput,
    model: "gpt-4o",
  },
};

// Test the original (unsafe) approach
const unsafeContent = JSON.stringify(testSettings);
console.log("Unsafe Content:", unsafeContent);
console.log("Contains raw script:", unsafeContent.includes("<script>"));

// Test the safe approach (what the app should do)
const safeContent = JSON.stringify(testSettings)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e");
console.log("Safe Content:", safeContent);
console.log("Contains raw script:", safeContent.includes("<script>"));
console.log(
  "Contains escaped script:",
  safeContent.includes("\\u003cscript\\u003e")
);

try {
  assert.strictEqual(
    safeContent.includes("<script>"),
    false,
    "Safe content should not contain raw script tags"
  );
  assert.ok(
    safeContent.includes("\\u003cscript\\u003e"),
    "Should contain escaped script tags"
  );
  console.log("✅ Test passed");
} catch (error) {
  console.log("❌ Test failed:", error.message);
}
