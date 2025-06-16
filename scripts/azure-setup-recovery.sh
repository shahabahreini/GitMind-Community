#!/bin/bash

# GitMind Azure Setup Completion Script
# Run this if the main setup script failed partway through

set -e

RESOURCE_GROUP="gitmind-telemetry-rg"
APP_INSIGHTS_NAME="gitmind-insights"
LOCATION="canadacentral"
WORKSPACE_NAME="gitmind-workspace"

echo "🔧 GitMind Azure Setup Recovery"
echo "=============================="

# Check if Application Insights exists
echo "Checking if Application Insights exists..."
if az monitor app-insights component show --app "$APP_INSIGHTS_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    echo "✅ Application Insights already exists!"
    
    # Get connection details
    CONNECTION_STRING=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query connectionString \
        --output tsv)
    
    INSTRUMENTATION_KEY=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query instrumentationKey \
        --output tsv)
    
else
    echo "❌ Application Insights not found. Please run the main setup script again."
    exit 1
fi

echo "✅ Azure Setup Complete!"
echo ""
echo "📋 Configuration Details:"
echo "Resource Group: $RESOURCE_GROUP"
echo "Application Insights: $APP_INSIGHTS_NAME"
echo "Location: $LOCATION"
echo ""
echo "🔑 Connection Details:"
echo "Connection String: $CONNECTION_STRING"
echo "Instrumentation Key: $INSTRUMENTATION_KEY"

# Create environment file
echo "📝 Creating environment configuration..."
cat > .env.azure << EOF
# GitMind Azure Application Insights Configuration
# Add these to your environment variables

APPLICATIONINSIGHTS_CONNECTION_STRING="$CONNECTION_STRING"
AZURE_RESOURCE_GROUP="$RESOURCE_GROUP"
AZURE_APP_INSIGHTS_NAME="$APP_INSIGHTS_NAME"
AZURE_LOCATION="$LOCATION"

# Privacy Settings
TELEMETRY_RETENTION_DAYS=30
TELEMETRY_PRIVACY_MODE=true
TELEMETRY_MINIMAL_DATA=true
EOF

# Create a simple update script for your extension
echo "📄 Creating extension update script..."
cat > update-extension-config.sh << 'EOF'
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
EOF

chmod +x update-extension-config.sh

echo ""
echo "✅ Recovery complete!"
echo ""
echo "🚀 Next Steps:"
echo "1. Update your extension configuration:"
echo "   source .env.azure"
echo "   ./update-extension-config.sh"
echo ""
echo "2. Test your telemetry:"
echo "   - Update src/services/telemetry/telemetryService.ts with the new connection string"
echo "   - Build and test your extension"
echo ""
echo "3. Access Azure Portal:"
echo "   https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME"
