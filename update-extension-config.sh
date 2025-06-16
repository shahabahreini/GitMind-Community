#!/bin/bash

# Update your extension's telemetry configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

if [ -f "$SCRIPT_DIR/.env.azure" ]; then
    source "$SCRIPT_DIR/.env.azure"
    echo "🔧 Updating extension configuration..."
    echo ""
    echo "Add this to your extension's environment:"
    echo "APPLICATIONINSIGHTS_CONNECTION_STRING=\"$APPLICATIONINSIGHTS_CONNECTION_STRING\""
    echo ""
    echo "Or update the telemetryService.ts file with the new connection string."
else
    echo "❌ .env.azure file not found. Please run the Azure setup first."
fi
