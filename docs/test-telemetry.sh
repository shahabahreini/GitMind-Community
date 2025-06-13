#!/bin/bash

# GitMind Extension - Telemetry Testing Script
# Run this to test telemetry in development mode

echo "🧪 Testing GitMind Extension Telemetry"
echo "======================================"

# Check if .env has connection string
if grep -q "YOUR_INSTRUMENTATION_KEY_HERE" .env; then
    echo "❌ Please update your .env file with the real Azure connection string first!"
    echo "📝 Get it from: https://portal.azure.com → Application Insights → Overview → Connection String"
    echo ""
    exit 1
fi

echo "✅ Environment file configured"
echo ""

# Start development mode
echo "🚀 Starting development mode..."
echo "📊 Telemetry will be active in the Extension Development Host"
echo ""
echo "🔍 To monitor telemetry:"
echo "1. Open Debug Console in VS Code"
echo "2. Look for 'Application Insights telemetry initialized successfully'"
echo "3. Generate commit messages to see telemetry events"
echo "4. Check Azure portal for real-time data"
echo ""

# Start watch mode for development
npm run watch
