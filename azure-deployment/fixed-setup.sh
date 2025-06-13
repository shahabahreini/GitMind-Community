#!/bin/bash

# GitMind Extension - Fixed Azure Application Insights Setup
echo "🚀 GitMind Extension - Azure Application Insights Setup (Fixed)"
echo "============================================================"

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

echo "🔧 Setting up required configurations..."

# Enable dynamic install for extensions
az config set extension.use_dynamic_install=yes_without_prompt
az config set extension.dynamic_install_allow_preview=true

echo "📋 Registering required resource providers..."
# Register required resource providers
az provider register --namespace Microsoft.Insights
az provider register --namespace microsoft.operationalinsights

echo "⏳ Waiting for resource providers to register (this may take 2-3 minutes)..."
echo "   Checking Microsoft.Insights..."
while [ "$(az provider show --namespace Microsoft.Insights --query registrationState -o tsv)" != "Registered" ]; do
    echo "   Still registering Microsoft.Insights..."
    sleep 30
done

echo "   Checking microsoft.operationalinsights..."
while [ "$(az provider show --namespace microsoft.operationalinsights --query registrationState -o tsv)" != "Registered" ]; do
    echo "   Still registering microsoft.operationalinsights..."
    sleep 30
done

echo "✅ Resource providers registered successfully!"

# Register the AI Workspace Preview feature
echo "🧪 Registering AI Workspace Preview feature..."
az feature register --name AIWorkspacePreview --namespace microsoft.insights

echo "📁 Creating resource group..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output table

echo "📊 Creating Application Insights (attempt 1 - workspace-based)..."
# Try with workspace first (modern approach)
if az monitor app-insights component create \
    --app "$APP_INSIGHTS_NAME" \
    --location "$LOCATION" \
    --resource-group "$RESOURCE_GROUP" \
    --application-type Node.JS \
    --kind web \
    --tags environment=production project=gitmind purpose=vscode-extension-telemetry \
    --output table; then
    
    echo "✅ Application Insights created successfully!"
else
    echo "⚠️  Workspace-based creation failed, trying classic mode..."
    
    # Fallback to classic mode (without workspace)
    az monitor app-insights component create \
        --app "$APP_INSIGHTS_NAME-classic" \
        --location "$LOCATION" \
        --resource-group "$RESOURCE_GROUP" \
        --application-type Node.JS \
        --kind web \
        --tags environment=production project=gitmind purpose=vscode-extension-telemetry \
        --output table
    
    APP_INSIGHTS_NAME="$APP_INSIGHTS_NAME-classic"
    echo "✅ Application Insights created in classic mode!"
fi

echo "🔑 Getting connection string..."
CONNECTION_STRING=$(az monitor app-insights component show \
    --app "$APP_INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
    --output tsv)

echo ""
echo "🎉 Setup completed successfully!"
echo "================================================"
echo ""
echo "🔗 Your Application Insights Connection String:"
echo ""
echo "$CONNECTION_STRING"
echo ""
echo "📝 Next steps:"
echo "1. Copy the connection string above"
echo "2. Update your .env file:"
echo "   APPLICATIONINSIGHTS_CONNECTION_STRING=\"$CONNECTION_STRING\""
echo "3. Test the telemetry: cd .. && ./test-telemetry.sh"
echo ""
echo "🌐 Azure Resources Created:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Application Insights: $APP_INSIGHTS_NAME"
echo "   Location: $LOCATION"
echo ""
