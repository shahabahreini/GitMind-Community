#!/bin/bash

# GitMind Extension - Azure Application Insights Deployment Script
# This script deploys Application Insights for telemetry collection

set -e

echo "🚀 Deploying GitMind Application Insights..."

# Configuration
RESOURCE_GROUP="GitMind-Resources"
LOCATION="canadacentral"
APP_INSIGHTS_NAME="gitmind-vscode-extension"
SUBSCRIPTION_ID="f27befa2-9826-4d07-8029-5ce8746040ba"

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please run: az login"
    exit 1
fi

# Set subscription
echo "📋 Setting Azure subscription..."
az account set --subscription "$SUBSCRIPTION_ID"

# Create resource group if it doesn't exist
echo "📁 Creating resource group..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output table

# Deploy Application Insights using the template
echo "📊 Deploying Application Insights..."
az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file deployment-template.json \
    --parameters \
        name="$APP_INSIGHTS_NAME" \
        type="Node.JS" \
        regionId="$LOCATION" \
        tagsArray='{"environment":"production","project":"gitmind","purpose":"vscode-extension-telemetry"}' \
        requestSource="IbizaWebApplicationInsightsCreate" \
        workspaceResourceId="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/DefaultResourceGroup-CCAN/providers/Microsoft.OperationalInsights/workspaces/DefaultWorkspace-$SUBSCRIPTION_ID-CCAN" \
    --output table

# Get the connection string
echo "🔑 Retrieving connection string..."
CONNECTION_STRING=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
    --output tsv)

echo ""
echo "✅ Application Insights deployed successfully!"
echo ""
echo "🔗 Connection String:"
echo "$CONNECTION_STRING"
echo ""
echo "📝 Next steps:"
echo "1. Copy the connection string above"
echo "2. Update your .env file with this connection string"
echo "3. Test the telemetry in development mode"
echo ""
