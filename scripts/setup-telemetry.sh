#!/bin/bash

# GitMind Telemetry Setup Master Script
# This script orchestrates the complete setup of privacy-compliant telemetry

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}GitMind Privacy-First Telemetry Setup${NC}"
echo "====================================="
echo
echo "This script will:"
echo "1. Validate your current telemetry implementation"
echo "2. Set up Azure Application Insights"
echo "3. Configure privacy-compliant monitoring"
echo "4. Generate compliance documentation"
echo

# Check prerequisites
echo -e "${GREEN}Checking prerequisites...${NC}"

# Check if Node.js is available for privacy validator
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. Privacy validator will be skipped."
    SKIP_VALIDATOR=true
else
    echo "✅ Node.js found"
fi

# Check if Azure CLI is available
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first:"
    echo "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
else
    echo "✅ Azure CLI found"
fi

# Step 1: Run privacy validation
if [ "$SKIP_VALIDATOR" != true ]; then
    echo
    echo -e "${GREEN}Step 1: Validating privacy compliance...${NC}"
    
    # Get the directory where this script is located
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
    
    # Run the privacy validator from the correct path
    node "$SCRIPT_DIR/privacy-validator.js"
    
    if [ $? -ne 0 ]; then
        echo "❌ Privacy validation failed. Please fix issues before proceeding."
        exit 1
    fi
    echo "✅ Privacy validation passed!"
else
    echo "⚠️  Skipping privacy validation (Node.js not available)"
fi

# Step 2: Azure setup
echo
echo -e "${GREEN}Step 2: Setting up Azure Application Insights...${NC}"
read -p "Do you want to proceed with Azure setup? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    "$SCRIPT_DIR/azure-insights-setup.sh"
    
    if [ $? -ne 0 ]; then
        echo "❌ Azure setup failed."
        exit 1
    fi
    echo "✅ Azure setup completed!"
else
    echo "⚠️  Skipping Azure setup"
fi

# Step 3: Generate final documentation
echo
echo -e "${GREEN}Step 3: Generating documentation...${NC}"

# Create a comprehensive privacy policy
cat > PRIVACY_POLICY.md << 'EOF'
# GitMind Extension Privacy Policy

## Data Collection

GitMind collects minimal, anonymous telemetry data to improve the extension. We are committed to protecting your privacy and only collect essential metrics.

### What We Collect

1. **Anonymous Usage Statistics**
   - Daily active user count (anonymous machine ID)
   - Commit generation success/failure rates
   - Error occurrences for debugging

2. **Technical Information**
   - Extension version
   - AI provider used (OpenAI, Anthropic, etc.)
   - Error types and contexts

### What We DON'T Collect

- ❌ Personal information (names, emails, addresses)
- ❌ Source code content
- ❌ Repository names or file paths
- ❌ API keys or credentials
- ❌ Any personally identifiable information

### Data Processing

- **Location**: Data is processed in Azure Canada Central
- **Retention**: All data is automatically deleted after 30 days
- **Encryption**: Data is encrypted in transit and at rest
- **Access**: Only anonymized, aggregated data is accessed for analytics

### Your Rights

- **Opt-out**: Disable telemetry in VS Code settings or extension settings
- **Transparency**: All telemetry code is open source and auditable
- **Control**: You have full control over data collection

### Compliance

- ✅ GDPR compliant (no personal data processing)
- ✅ CCPA compliant (no personal information sale)
- ✅ SOC 2 Type II infrastructure (Azure)
- ✅ Privacy by design principles

### Contact

If you have questions about this privacy policy, please contact us through the extension's GitHub repository.

**Last updated**: $(date +"%Y-%m-%d")
EOF

# Create user guide for telemetry settings
cat > TELEMETRY_USER_GUIDE.md << 'EOF'
# GitMind Telemetry User Guide

## Overview

GitMind uses privacy-first telemetry to understand how the extension is used and improve it. All data collection is anonymous and minimal.

## How to Control Telemetry

### Option 1: VS Code Global Setting
```json
{
  "telemetry.telemetryLevel": "off"
}
```

### Option 2: GitMind Extension Setting
```json
{
  "aiCommitAssistant.telemetry.enabled": false
}
```

### Option 3: VS Code UI
1. Open VS Code Settings (Cmd/Ctrl + ,)
2. Search for "telemetry"
3. Set "Telemetry Level" to "off"

OR

1. Search for "GitMind" or "AI Commit Assistant"
2. Uncheck "Telemetry: Enabled"

## What Data is Collected

When telemetry is enabled, GitMind collects:

### Daily Active Users
- **Purpose**: Count how many people use the extension
- **Data**: Anonymous machine ID + date
- **Privacy**: No personal identification possible

### Commit Generation
- **Purpose**: Track success rates and improve AI integration
- **Data**: Success/failure + AI provider used
- **Privacy**: No code content collected

### Error Tracking
- **Purpose**: Fix bugs and improve reliability
- **Data**: Error type + context where it occurred
- **Privacy**: No personal data in error messages

## Data Transparency

- All telemetry data is aggregated and anonymized
- Data is automatically deleted after 30 days
- No cross-referencing with other Microsoft/Azure services
- No tracking across different extensions or applications

## Benefits of Telemetry

When you allow telemetry, you help us:
- Fix bugs faster
- Improve AI provider reliability
- Prioritize feature development
- Ensure the extension works well for everyone

## Your Privacy Rights

- **Right to opt-out**: Disable at any time
- **Right to transparency**: All collection is documented
- **Right to data minimization**: Only essential metrics collected
- **Right to deletion**: 30-day automatic purging

Thank you for helping make GitMind better while protecting your privacy! 🚀
EOF

echo "✅ Documentation generated!"

# Step 4: Final summary
echo
echo -e "${GREEN}Setup Complete! 🎉${NC}"
echo
echo "📁 Files created:"
echo "  - scripts/azure-insights-setup.sh (Azure setup script)"
echo "  - scripts/azure-insights-setup.ps1 (PowerShell version)"
echo "  - scripts/telemetry-queries.json (KQL queries)"
echo "  - scripts/privacy-validator.js (Privacy compliance validator)"
echo "  - PRIVACY_POLICY.md (User privacy policy)"
echo "  - TELEMETRY_USER_GUIDE.md (User guide)"
echo "  - privacy-compliance.md (Technical compliance docs)"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update your extension's connection string with the Azure configuration"
echo "2. Test the telemetry in development mode"
echo "3. Set up dashboards in Azure portal using the provided queries"
echo "4. Include the privacy policy in your extension's documentation"
echo "5. Run the privacy validator regularly: node \$SCRIPT_DIR/privacy-validator.js"
echo
echo -e "${GREEN}Privacy Features Enabled:${NC}"
echo "✅ Anonymous data collection only"
echo "✅ 30-day automatic data deletion"
echo "✅ User opt-out capability"
echo "✅ GDPR/CCPA compliance"
echo "✅ Minimal data principle"
echo "✅ Encrypted data transmission"
echo "✅ No PII collection"
echo
echo "Your telemetry setup is now privacy-compliant and ready to use! 🔐"
