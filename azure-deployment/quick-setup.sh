#!/bin/bash

# Quick Azure Application Insights Setup for GitMind Extension
echo "🚀 Quick Azure Application Insights Setup for GitMind"

# Configuration
RESOURCE_GROUP="GitMind-Resources"
LOCATION="canadacentral"
APP_INSIGHTS_NAME="gitmind-vscode-extension"

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login check
if ! az account show &> /dev/null; then
    echo "🔐 Please login to Azure..."
    az login
fi

echo "📁 Creating resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

echo "📊 Creating Application Insights..."
az monitor app-insights component create \
    --app "$APP_INSIGHTS_NAME" \
    --location "$LOCATION" \
    --resource-group "$RESOURCE_GROUP" \
    --application-type Node.JS \
    --tags environment=production project=gitmind purpose=vscode-extension-telemetry

echo "🔑 Getting connection string..."
CONNECTION_STRING=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
    --output tsv)

echo ""
echo "✅ Setup complete!"
echo "🔗 Your Application Insights Connection String:"
echo ""
echo "$CONNECTION_STRING"
echo ""
echo "📝 Copy this connection string to your .env file"
