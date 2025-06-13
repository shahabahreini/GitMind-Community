#!/usr/bin/env node

// GitMind Extension - Final Telemetry Test
// Tests the actual telemetry implementation with real Azure connection

const {
  TelemetryService,
} = require("./out/services/telemetry/telemetryService.js");

async function testTelemetry() {
  console.log("🧪 GitMind Extension - Final Telemetry Test");
  console.log("============================================");
  console.log("");

  try {
    // Create mock VS Code context
    const mockContext = {
      globalState: {
        get: () => true, // Telemetry enabled
        update: () => Promise.resolve(),
      },
      extensionPath: __dirname,
      subscriptions: [],
    };

    // Mock VS Code workspace configuration
    global.vscode = {
      workspace: {
        getConfiguration: () => ({
          get: (key) => (key === "telemetry.telemetryLevel" ? "all" : true),
        }),
      },
    };

    console.log("📊 Initializing TelemetryService...");
    const telemetryService = new TelemetryService(mockContext);
    await telemetryService.initialize();

    console.log("✅ TelemetryService initialized successfully");
    console.log("");

    // Test events
    console.log("🔍 Testing telemetry events...");

    await telemetryService.trackEvent("extension.activated", {
      version: "3.4.3",
      test: true,
    });

    await telemetryService.trackEvent("commit.generated", {
      provider: "test",
      messageLength: 50,
      test: true,
    });

    await telemetryService.trackException(
      new Error("Test error for telemetry"),
      {
        test: true,
      }
    );

    console.log("✅ Test events sent successfully");
    console.log("");
    console.log("🎉 Telemetry implementation is working correctly!");
    console.log(
      "📈 Data will appear in Azure Application Insights within 5-10 minutes"
    );
    console.log("");
    console.log("🌐 View your data at:");
    console.log(
      "   https://portal.azure.com/#@/resource/subscriptions/f27befa2-9826-4d07-8029-5ce8746040ba/resourceGroups/GitMind-Resources/providers/Microsoft.Insights/components/gitmind-vscode-extension/overview"
    );
  } catch (error) {
    console.error("❌ Telemetry test failed:", error.message);
    console.log("");
    console.log("🔧 Check your Azure Application Insights configuration");
  }
}

testTelemetry().catch(console.error);
