#!/bin/bash

# Script to get your Azure Application Insights connection string
echo "🔍 Getting your Azure Application Insights connection string..."

# Try to get the connection string
CONNECTION_STRING=$(az monitor app-insights component show \
    --app gitmind-insights \
    --resource-group gitmind-telemetry-rg \
    --query connectionString \
    --output tsv 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$CONNECTION_STRING" ]; then
    echo "✅ Found your connection string:"
    echo "CONNECTION_STRING=\"$CONNECTION_STRING\""
    echo ""
    echo "📝 Copy this connection string and use it in the next steps."
else
    echo "❌ Could not retrieve connection string."
    echo "💡 Try running this command manually:"
    echo "   az monitor app-insights component show --app gitmind-insights --resource-group gitmind-telemetry-rg --query connectionString --output tsv"
    echo ""
    echo "Or check the Azure Portal:"
    echo "   https://portal.azure.com > Application Insights > gitmind-insights > Overview"
fi

echo ""
echo "🔗 Azure Portal Link:"
echo "https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv 2>/dev/null || echo 'YOUR_SUBSCRIPTION')/resourceGroups/gitmind-telemetry-rg/providers/Microsoft.Insights/components/gitmind-insights"
