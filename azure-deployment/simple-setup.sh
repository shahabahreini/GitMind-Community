#!/bin/bash

# GitMind Extension - Simple Application Insights Setup
echo "🚀 Simple Azure Application Insights Setup for GitMind"
echo "======================================================"

# Configuration
RESOURCE_GROUP="GitMind-Resources"
LOCATION="canadacentral"
APP_INSIGHTS_NAME="gitmind-vscode-simple"

echo "🔧 Registering required resource providers..."
az provider register --namespace Microsoft.Insights
az provider register --namespace microsoft.operationalinsights

echo "📁 Using existing resource group: $RESOURCE_GROUP"

echo "📊 Creating Application Insights with simplified configuration..."
az monitor app-insights component create \
    --app "$APP_INSIGHTS_NAME" \
    --location "$LOCATION" \
    --resource-group "$RESOURCE_GROUP" \
    --application-type other \
    --output table

echo "🔑 Getting connection string..."
CONNECTION_STRING=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
    --output tsv)

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Failed to get connection string. Trying instrumentation key method..."
    INSTRUMENTATION_KEY=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query instrumentationKey \
        --output tsv)
    
    if [ -n "$INSTRUMENTATION_KEY" ]; then
        CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY;IngestionEndpoint=https://canadacentral-1.in.applicationinsights.azure.com/"
        echo "✅ Generated connection string from instrumentation key"
    else
        echo "❌ Could not retrieve connection information"
        exit 1
    fi
fi

echo ""
echo "🎉 Simple setup completed!"
echo "========================="
echo ""
echo "🔗 Your Application Insights Connection String:"
echo ""
echo "$CONNECTION_STRING"
echo ""
echo "📝 Copy this to your .env file and replace the placeholder"
echo ""
