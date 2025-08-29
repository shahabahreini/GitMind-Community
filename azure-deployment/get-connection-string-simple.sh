#!/bin/bash

echo "🔑 Getting GitMind Application Insights Connection String..."

# Get the connection string
CONNECTION_STRING=$(az monitor app-insights component show \
    --app "gitmind-vscode-extension" \
    --resource-group "GitMind-Resources" \
    --query connectionString \
    --output tsv 2>/dev/null)

if [ -n "$CONNECTION_STRING" ]; then
    echo ""
    echo "✅ Connection String Retrieved:"
    echo "================================"
    echo "$CONNECTION_STRING"
    echo "================================"
    echo ""
    
    # Save to file
    echo "$CONNECTION_STRING" > connection-string.txt
    echo "📁 Connection string saved to: connection-string.txt"
    echo ""
    echo "Next steps:"
    echo "1. Copy this connection string"
    echo "2. Add it to your VS Code settings:"
    echo "   'aiCommitAssistant.telemetry.connectionString': 'YOUR_CONNECTION_STRING'"
    echo "3. Enable telemetry in extension settings"
else
    echo "❌ Failed to retrieve connection string"
    echo "Please check if the Application Insights component exists"
    exit 1
fi
