#!/bin/bash

# Check if resource providers are ready and retry Application Insights creation
echo "🔍 Checking Azure resource provider status..."

INSIGHTS_STATUS=$(az provider show --namespace Microsoft.Insights --query registrationState -o tsv 2>/dev/null)
LOGS_STATUS=$(az provider show --namespace microsoft.operationalinsights --query registrationState -o tsv 2>/dev/null)

echo "Microsoft.Insights: $INSIGHTS_STATUS"
echo "microsoft.operationalinsights: $LOGS_STATUS"

if [ "$INSIGHTS_STATUS" = "Registered" ] && [ "$LOGS_STATUS" = "Registered" ]; then
    echo "✅ Resource providers are ready! Attempting Application Insights creation..."
    
    RESOURCE_GROUP="GitMind-Resources"
    LOCATION="canadacentral"
    APP_INSIGHTS_NAME="gitmind-vscode-extension"
    
    # Try creating Application Insights again
    az monitor app-insights component create \
        --app "$APP_INSIGHTS_NAME" \
        --location "$LOCATION" \
        --resource-group "$RESOURCE_GROUP" \
        --application-type Node.JS \
        --output table
    
    # Get connection string
    CONNECTION_STRING=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query connectionString \
        --output tsv)
    
    echo ""
    echo "🎉 Success! Your connection string:"
    echo "$CONNECTION_STRING"
    echo ""
    echo "📝 Copy this to your .env file"
else
    echo "⏳ Resource providers still registering. Please wait 5-10 minutes and try again."
    echo "🌐 Or use the Azure Portal method from PORTAL_SETUP_GUIDE.md"
fi
