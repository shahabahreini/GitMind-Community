#!/bin/bash

# GitMind Extension - Unified Azure Application Insights Setup
echo "🚀 GitMind Extension - Azure Application Insights Setup"
echo "====================================================="

# Configuration with options
RESOURCE_GROUP="${1:-GitMind-Resources}"
LOCATION="${2:-canadacentral}"
APP_INSIGHTS_NAME="${3:-gitmind-vscode-extension}"
SETUP_TYPE="${4:-standard}"  # standard, simple, or quick

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    if ! az account show &> /dev/null; then
        print_step "Please login to Azure..."
        az login
    fi
    
    print_success "Prerequisites check completed"
}

# Setup Azure providers and configurations
setup_azure_config() {
    if [[ "$SETUP_TYPE" != "quick" ]]; then
        print_step "Configuring Azure CLI extensions..."
        az config set extension.use_dynamic_install=yes_without_prompt
        az config set extension.dynamic_install_allow_preview=true
        
        print_step "Registering required resource providers..."
        az provider register --namespace Microsoft.Insights
        az provider register --namespace microsoft.operationalinsights
    fi
}

# Create resource group
create_resource_group() {
    print_step "Creating/verifying resource group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output table
    print_success "Resource group ready"
}

# Create Application Insights
create_app_insights() {
    print_step "Creating Application Insights: $APP_INSIGHTS_NAME"
    
    local app_type="other"
    if [[ "$SETUP_TYPE" == "simple" ]]; then
        app_type="web"
    fi
    
    az monitor app-insights component create \
        --app "$APP_INSIGHTS_NAME" \
        --location "$LOCATION" \
        --resource-group "$RESOURCE_GROUP" \
        --application-type "$app_type" \
        --output table
    
    print_success "Application Insights created"
}

# Get connection string
get_connection_string() {
    print_step "Retrieving connection string..."
    
    CONNECTION_STRING=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query connectionString \
        --output tsv)
    
    if [[ -n "$CONNECTION_STRING" ]]; then
        print_success "Connection string retrieved"
        echo ""
        echo "🔑 Your GitMind Application Insights Connection String:"
        echo "=================================================="
        echo "$CONNECTION_STRING"
        echo "=================================================="
        echo ""
        print_warning "Save this connection string securely!"
        echo "Add it to your VS Code settings under 'aiCommitAssistant.telemetry.connectionString'"
    else
        print_error "Failed to retrieve connection string"
        exit 1
    fi
}

# Create deployment summary
create_summary() {
    print_step "Creating deployment summary..."
    
    cat > deployment-summary.json << EOF
{
    "deployment_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "setup_type": "$SETUP_TYPE",
    "resource_group": "$RESOURCE_GROUP",
    "location": "$LOCATION",
    "app_insights_name": "$APP_INSIGHTS_NAME",
    "connection_string": "$CONNECTION_STRING"
}
EOF
    
    print_success "Deployment summary saved to deployment-summary.json"
}

# Cleanup function for failed deployments
cleanup_on_failure() {
    print_warning "Cleaning up failed deployment..."
    az monitor app-insights component delete \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --yes &> /dev/null
}

# Main execution
main() {
    echo "Setup Configuration:"
    echo "  Type: $SETUP_TYPE"
    echo "  Resource Group: $RESOURCE_GROUP"
    echo "  Location: $LOCATION"
    echo "  App Insights Name: $APP_INSIGHTS_NAME"
    echo ""
    
    # Trap errors and cleanup
    trap cleanup_on_failure ERR
    
    check_prerequisites
    setup_azure_config
    create_resource_group
    create_app_insights
    get_connection_string
    create_summary
    
    print_success "🎉 Azure Application Insights setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Copy the connection string to your VS Code settings"
    echo "2. Enable telemetry in GitMind extension settings"
    echo "3. Test the connection using the verification script"
}

# Show usage if --help is provided
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: $0 [RESOURCE_GROUP] [LOCATION] [APP_INSIGHTS_NAME] [SETUP_TYPE]"
    echo ""
    echo "Parameters:"
    echo "  RESOURCE_GROUP    - Azure resource group name (default: GitMind-Resources)"
    echo "  LOCATION          - Azure region (default: canadacentral)"
    echo "  APP_INSIGHTS_NAME - Application Insights name (default: gitmind-vscode-extension)"
    echo "  SETUP_TYPE        - Setup type: standard, simple, or quick (default: standard)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Use all defaults"
    echo "  $0 MyGroup eastus                    # Custom group and location"
    echo "  $0 MyGroup eastus my-app simple      # Simple setup"
    exit 0
fi

# Run main function
main
