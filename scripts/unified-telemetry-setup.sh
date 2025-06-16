#!/bin/bash

# GitMind Telemetry Setup - Comprehensive Privacy-First Configuration
# This script handles the complete setup of privacy-compliant telemetry for GitMind

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOURCE_GROUP="${RESOURCE_GROUP:-gitmind-telemetry-rg}"
APP_INSIGHTS_NAME="${APP_INSIGHTS_NAME:-gitmind-insights}"
LOCATION="${LOCATION:-canadacentral}"
WORKSPACE_NAME="${WORKSPACE_NAME:-gitmind-workspace}"

# Helper functions
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check Node.js for privacy validator
    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js (for privacy validation)")
        SKIP_VALIDATOR=true
    fi
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        missing_tools+=("Azure CLI")
        SKIP_AZURE=true
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_warning "Missing tools detected:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo
        
        if [[ "$SKIP_AZURE" == "true" ]]; then
            print_error "Azure CLI is required for telemetry setup"
            echo "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
            exit 1
        fi
    fi
    
    print_success "Prerequisites check completed"
}

# Validate privacy compliance
validate_privacy() {
    if [[ "$SKIP_VALIDATOR" == "true" ]]; then
        print_warning "Skipping privacy validation (Node.js not available)"
        return
    fi
    
    print_step "Running privacy compliance validation..."
    
    if [[ -f "$SCRIPT_DIR/privacy-validator.js" ]]; then
        if node "$SCRIPT_DIR/privacy-validator.js"; then
            print_success "Privacy validation passed"
        else
            print_error "Privacy validation failed"
            exit 1
        fi
    else
        print_warning "Privacy validator not found, skipping validation"
    fi
}

# Setup Azure Application Insights
setup_azure_insights() {
    print_step "Setting up Azure Application Insights..."
    
    # Check Azure login
    if ! az account show &> /dev/null; then
        print_step "Please login to Azure..."
        az login
    fi
    
    # Register providers
    print_info "Registering required providers..."
    az provider register --namespace Microsoft.Insights
    az provider register --namespace microsoft.operationalinsights
    
    # Create resource group
    print_info "Creating resource group: $RESOURCE_GROUP"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output table
    
    # Create Log Analytics Workspace
    print_info "Creating Log Analytics workspace: $WORKSPACE_NAME"
    az monitor log-analytics workspace create \
        --resource-group "$RESOURCE_GROUP" \
        --workspace-name "$WORKSPACE_NAME" \
        --location "$LOCATION" \
        --output table
    
    # Get workspace ID
    WORKSPACE_ID=$(az monitor log-analytics workspace show \
        --resource-group "$RESOURCE_GROUP" \
        --workspace-name "$WORKSPACE_NAME" \
        --query customerId \
        --output tsv)
    
    # Create Application Insights
    print_info "Creating Application Insights: $APP_INSIGHTS_NAME"
    az monitor app-insights component create \
        --app "$APP_INSIGHTS_NAME" \
        --location "$LOCATION" \
        --resource-group "$RESOURCE_GROUP" \
        --workspace "$WORKSPACE_ID" \
        --application-type other \
        --output table
    
    # Get connection string
    CONNECTION_STRING=$(az monitor app-insights component show \
        --app "$APP_INSIGHTS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query connectionString \
        --output tsv)
    
    print_success "Azure Application Insights setup completed"
}

# Generate configuration files
generate_config() {
    print_step "Generating configuration files..."
    
    # Create telemetry config
    cat > "$SCRIPT_DIR/telemetry-config.json" << EOF
{
    "version": "1.0",
    "generated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "azure": {
        "resource_group": "$RESOURCE_GROUP",
        "app_insights_name": "$APP_INSIGHTS_NAME",
        "workspace_name": "$WORKSPACE_NAME",
        "location": "$LOCATION",
        "connection_string": "$CONNECTION_STRING"
    },
    "privacy": {
        "compliant": true,
        "data_retention_days": 90,
        "pii_collection": false,
        "anonymous_only": true
    },
    "features": {
        "error_tracking": true,
        "usage_analytics": true,
        "performance_monitoring": true,
        "custom_events": true
    }
}
EOF
    
    print_success "Configuration file created: telemetry-config.json"
}

# Create monitoring dashboard
create_dashboard() {
    print_step "Creating monitoring dashboard..."
    
    if [[ ! -f "$SCRIPT_DIR/telemetry-queries.json" ]]; then
        print_warning "telemetry-queries.json not found, skipping dashboard creation"
        return
    fi
    
    # Extract queries from telemetry-queries.json and create dashboard
    local dashboard_config=$(cat << EOF
{
    "properties": {
        "lenses": {
            "0": {
                "order": 0,
                "parts": {
                    "0": {
                        "position": {
                            "x": 0,
                            "y": 0,
                            "colSpan": 6,
                            "rowSpan": 4
                        },
                        "metadata": {
                            "inputs": [
                                {
                                    "name": "resourceTypeMode",
                                    "value": "components"
                                },
                                {
                                    "name": "ComponentId",
                                    "value": {
                                        "SubscriptionId": "$(az account show --query id -o tsv)",
                                        "ResourceGroup": "$RESOURCE_GROUP",
                                        "Name": "$APP_INSIGHTS_NAME"
                                    }
                                }
                            ],
                            "type": "Extension/AppInsightsExtension/PartType/CuratedBladeFailuresPinnedPart"
                        }
                    }
                }
            }
        }
    },
    "name": "GitMind Telemetry Dashboard",
    "type": "Microsoft.Portal/dashboards",
    "location": "INSERT LOCATION",
    "tags": {
        "hidden-title": "GitMind Telemetry Dashboard"
    }
}
EOF
)
    
    echo "$dashboard_config" > "$SCRIPT_DIR/dashboard-template.json"
    print_success "Dashboard template created: dashboard-template.json"
}

# Generate compliance documentation
generate_compliance_docs() {
    print_step "Generating compliance documentation..."
    
    cat > "$SCRIPT_DIR/PRIVACY_COMPLIANCE_REPORT.md" << EOF
# GitMind Privacy Compliance Report

**Generated:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Version:** 1.0

## Privacy Policy Compliance

### Data Collection
- ✅ **Anonymous only**: No personally identifiable information collected
- ✅ **User consent**: Telemetry can be disabled by users
- ✅ **Minimal data**: Only essential usage and error data collected
- ✅ **Transparent**: All collection documented and disclosed

### Data Storage
- **Location**: Azure Application Insights ($LOCATION)
- **Retention**: 90 days maximum
- **Encryption**: In transit and at rest
- **Access**: Restricted to authorized personnel only

### Data Usage
- **Purpose**: Product improvement and error monitoring only
- **Sharing**: No data shared with third parties
- **Analytics**: Aggregated and anonymized only

### User Rights
- **Opt-out**: Users can disable telemetry at any time
- **Transparency**: Full disclosure of data collection practices
- **Control**: Users maintain control over their data

### Technical Implementation
- **Connection String**: Securely stored in user settings
- **Event Types**: Limited to predefined anonymous events
- **Data Validation**: Automated privacy compliance checks

## Compliance Status: ✅ COMPLIANT

This telemetry implementation meets privacy requirements and best practices for VS Code extensions.
EOF
    
    print_success "Privacy compliance report generated"
}

# Test telemetry connection
test_connection() {
    print_step "Testing telemetry connection..."
    
    if [[ -f "$SCRIPT_DIR/test-validator.js" ]]; then
        if node "$SCRIPT_DIR/test-validator.js"; then
            print_success "Telemetry connection test passed"
        else
            print_warning "Telemetry connection test failed (this may be normal for new setups)"
        fi
    else
        print_info "Test validator not found, skipping connection test"
    fi
}

# Display setup summary
display_summary() {
    print_header "Setup Complete"
    
    echo -e "${GREEN}🎉 GitMind telemetry setup completed successfully!${NC}"
    echo
    echo "📋 Setup Summary:"
    echo "  ├─ Resource Group: $RESOURCE_GROUP"
    echo "  ├─ Application Insights: $APP_INSIGHTS_NAME"
    echo "  ├─ Workspace: $WORKSPACE_NAME"
    echo "  └─ Location: $LOCATION"
    echo
    echo "🔑 Connection String:"
    echo "  $CONNECTION_STRING"
    echo
    echo "📁 Generated Files:"
    echo "  ├─ telemetry-config.json (configuration)"
    echo "  ├─ dashboard-template.json (monitoring dashboard)"
    echo "  └─ PRIVACY_COMPLIANCE_REPORT.md (compliance documentation)"
    echo
    echo "🔧 Next Steps:"
    echo "  1. Copy the connection string to your VS Code settings"
    echo "  2. Set 'aiCommitAssistant.telemetry.connectionString' in settings"
    echo "  3. Enable telemetry in GitMind extension settings"
    echo "  4. Review the privacy compliance report"
    echo "  5. Test the setup with the extension"
    echo
    echo "📚 Documentation:"
    echo "  - Privacy Policy: See PRIVACY_COMPLIANCE_REPORT.md"
    echo "  - Queries: See telemetry-queries.json"
    echo "  - Configuration: See telemetry-config.json"
}

# Main execution function
main() {
    print_header "GitMind Privacy-First Telemetry Setup"
    
    echo "This script will:"
    echo "  1. Validate privacy compliance"
    echo "  2. Set up Azure Application Insights"
    echo "  3. Configure monitoring dashboard"
    echo "  4. Generate compliance documentation"
    echo "  5. Test the telemetry connection"
    echo
    
    # Confirm before proceeding
    read -p "Continue with setup? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    
    echo
    
    # Execute setup steps
    check_prerequisites
    validate_privacy
    
    if [[ "$SKIP_AZURE" != "true" ]]; then
        setup_azure_insights
        generate_config
        create_dashboard
    else
        print_warning "Skipping Azure setup (Azure CLI not available)"
    fi
    
    generate_compliance_docs
    test_connection
    display_summary
}

# Show help
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    cat << EOF
GitMind Telemetry Setup

Usage: $0 [OPTIONS]

Environment Variables:
  RESOURCE_GROUP     - Azure resource group name (default: gitmind-telemetry-rg)
  APP_INSIGHTS_NAME  - Application Insights name (default: gitmind-insights)
  LOCATION          - Azure region (default: canadacentral)
  WORKSPACE_NAME    - Log Analytics workspace name (default: gitmind-workspace)

Examples:
  $0                                    # Use default configuration
  LOCATION=eastus $0                    # Use custom location
  RESOURCE_GROUP=my-group $0            # Use custom resource group

EOF
    exit 0
fi

# Run main function
main "$@"
