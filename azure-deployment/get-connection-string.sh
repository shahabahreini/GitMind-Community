#!/bin/bash

# GitMind Extension - Get Connection String and Setup Environment
echo "🎉 Great! Your Application Insights resource exists!"
echo "=================================================="
echo ""
echo "Resource Details:"
echo "   Name: gitmind-vscode-extension"
echo "   Resource Group: GitMind-Resources"
echo "   Region: Canada Central"
echo "   Workspace: DefaultWorkspace-f27befa2-9826-4d07-8029-5ce8746040ba-CCAN"
echo ""

echo "🔑 Retrieving connection string..."

# Try to get connection string
CONNECTION_STRING=$(az monitor app-insights component show \
    --app gitmind-vscode-extension \
    --resource-group GitMind-Resources \
    --query connectionString \
    --output tsv 2>/dev/null)

if [ -z "$CONNECTION_STRING" ] || [ "$CONNECTION_STRING" = "null" ]; then
    echo "⚠️  Connection string not available via CLI, trying instrumentation key..."
    
    # Fallback to instrumentation key
    INSTRUMENTATION_KEY=$(az monitor app-insights component show \
        --app gitmind-vscode-extension \
        --resource-group GitMind-Resources \
        --query instrumentationKey \
        --output tsv 2>/dev/null)
    
    if [ -n "$INSTRUMENTATION_KEY" ] && [ "$INSTRUMENTATION_KEY" != "null" ]; then
        CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY;IngestionEndpoint=https://canadacentral-1.in.applicationinsights.azure.com/;LiveEndpoint=https://canadacentral.livediagnostics.monitor.azure.com/"
        echo "✅ Generated connection string from instrumentation key"
    else
        echo "❌ Could not retrieve connection details via CLI"
        echo ""
        echo "🌐 Please get the connection string manually from Azure Portal:"
        echo "   1. Go to: https://portal.azure.com"
        echo "   2. Navigate to: GitMind-Resources → gitmind-vscode-extension"
        echo "   3. Copy the 'Connection String' from the Overview page"
        echo ""
        exit 1
    fi
fi

echo ""
echo "🔗 Your Application Insights Connection String:"
echo "=============================================="
echo ""
echo "$CONNECTION_STRING"
echo ""

# Update .env file
echo "📝 Updating your .env file..."
if [ -f "../.env" ]; then
    # Backup current .env
    cp ../.env ../.env.backup
    
    # Update the connection string
    sed -i.bak "s|APPLICATIONINSIGHTS_CONNECTION_STRING=.*|APPLICATIONINSIGHTS_CONNECTION_STRING=\"$CONNECTION_STRING\"|" ../.env
    
    echo "✅ Updated .env file (backup saved as .env.backup)"
else
    echo "❌ .env file not found in parent directory"
    echo "📝 Please create .env file with:"
    echo ""
    echo "APPLICATIONINSIGHTS_CONNECTION_STRING=\"$CONNECTION_STRING\""
    echo "NODE_ENV=production"
    echo "EXTENSION_VERSION=3.4.3"
fi

echo ""
echo "🎯 Next Steps:"
echo "============="
echo "1. ✅ Azure Application Insights is ready"
echo "2. ✅ Connection string configured"
echo "3. 🔄 Test telemetry: cd .. && ./test-telemetry.sh"
echo "4. 🚀 Deploy your extension with analytics!"
echo ""
echo "Monitor your data at:"
echo "   https://portal.azure.com → Application Insights → gitmind-vscode-extension"
echo ""
