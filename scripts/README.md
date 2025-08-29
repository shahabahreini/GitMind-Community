# GitMind Telemetry Scripts

This directory contains scripts for setting up and managing privacy-compliant telemetry for the GitMind VS Code extension.

## 🚀 Quick Start

Run the unified setup script to configure everything:

```bash
./scripts/unified-telemetry-setup.sh
```

## 📁 Scripts Overview

### Main Setup Scripts

- **`unified-telemetry-setup.sh`** - Comprehensive setup script with privacy validation
- **`get-connection-string.sh`** - Retrieve Azure connection string

### Configuration Files

- **`telemetry-queries.json`** - Complete KQL queries and privacy settings for Azure
- **`privacy-validator.js`** - Node.js script to validate privacy compliance

### Testing & Validation

- **`test-validator.js`** - Test telemetry connection and validation
- **`test-status.js`** - Check extension test status

### Documentation

- **`COMPREHENSIVE_TELEMETRY_GUIDE.md`** - Complete telemetry setup and privacy guide
- **`privacy-compliance-certificate.md`** - Privacy compliance documentation

## 🔐 Privacy Features

All scripts implement privacy-first principles:

- ✅ **Anonymous Data Collection** - Only machine IDs, no personal information
- ✅ **30-Day Data Retention** - Automatic data purging
- ✅ **User Opt-Out** - Respects VS Code telemetry settings
- ✅ **GDPR/CCPA Compliant** - Meets international privacy standards
- ✅ **Minimal Data Principle** - Only essential metrics collected
- ✅ **Encrypted Transmission** - All data encrypted in transit and at rest

## 📊 Metrics Tracked

The telemetry system focuses on three key metrics:

1. **Daily Active Users** - Anonymous count of extension users
2. **Commit Generation** - Success rates and provider performance
3. **Extension Errors** - Error tracking for debugging and improvements

## 🛠 Usage Instructions

### 1. Azure Setup (Required)

Set up Azure Application Insights:

```bash
# For macOS/Linux
./scripts/azure-insights-setup.sh

# For Windows (PowerShell)
./scripts/azure-insights-setup.ps1
```

### 2. Privacy Validation (Recommended)

Validate privacy compliance:

```bash
node scripts/privacy-validator.js
```

### 3. Monitor Compliance

Run privacy validation regularly to ensure ongoing compliance:

```bash
# Add to CI/CD pipeline
npm run validate-privacy
```

## 📋 Prerequisites

- **Azure CLI** - For Azure setup scripts
- **Node.js** - For privacy validation (optional)
- **Bash/PowerShell** - For running setup scripts

### Installing Azure CLI

**macOS:**

```bash
brew install azure-cli
```

**Windows:**

```powershell
winget install Microsoft.AzureCLI
```

**Linux:**

```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

## 🔧 Configuration

### Environment Variables

After running the setup, add these to your environment:

```env
APPLICATIONINSIGHTS_CONNECTION_STRING="your-connection-string"
AZURE_RESOURCE_GROUP="gitmind-telemetry-rg"
AZURE_APP_INSIGHTS_NAME="gitmind-insights"
```

### Extension Settings

Update your extension's telemetry service with the new connection string.

## 📈 Monitoring

### Azure Portal

Access your telemetry dashboard:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Application Insights > gitmind-insights
3. Use the provided KQL queries for custom dashboards

### Key Queries

```kusto
// Daily Active Users
customEvents
| where name == 'gitmind.daily_active_user'
| summarize UniqueUsers = dcount(tostring(customDimensions.user_id)) by bin(timestamp, 1d)

// Commit Success Rate
customEvents
| where name == 'gitmind.commit_generated'
| summarize SuccessRate = 100.0 * countif(tostring(customDimensions.success) == 'true') / count()
```

## 🚨 Alerts

The setup includes automated alerts for:

- High error rates (>10 errors in 15 minutes)
- Low success rates (<80% commit success)
- No activity (no telemetry for 2 hours)

## 📜 Compliance Documentation

Generated documentation:

- `PRIVACY_POLICY.md` - User-facing privacy policy
- `TELEMETRY_USER_GUIDE.md` - User guide for telemetry settings
- `privacy-compliance.md` - Technical compliance documentation
- `privacy-compliance-certificate.md` - Validation certificate

## 🔄 Regular Maintenance

### Monthly Tasks

- Review telemetry data for insights
- Validate privacy compliance
- Update retention policies if needed

### Quarterly Tasks

- Review Azure costs and usage
- Update privacy documentation
- Assess new privacy regulations

## 🆘 Troubleshooting

### Common Issues

**Azure CLI not authenticated:**

```bash
az login
az account set --subscription "your-subscription-id"
```

**Permission denied on scripts:**

```bash
chmod +x scripts/*.sh
```

**Node.js not found:**

```bash
# Install Node.js from https://nodejs.org/
# Or use package manager:
brew install node  # macOS
```

### Support

For issues with the telemetry setup:

1. Check the Azure portal for connection status
2. Validate privacy compliance with the validator script
3. Review extension logs for telemetry errors
4. Open an issue in the GitMind repository

## 📚 Additional Resources

- [Azure Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [VS Code Telemetry Documentation](https://code.visualstudio.com/docs/getstarted/telemetry)
- [Privacy by Design Principles](https://www.ipc.on.ca/privacy-by-design/)

---

**Last Updated**: $(date +"%Y-%m-%d")
**Version**: 1.0.0
**Compliance**: GDPR/CCPA Ready ✅
