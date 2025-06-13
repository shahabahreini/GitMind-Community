# 🚀 GitMind Telemetry Setup Guide

## Step 1: Create Azure Application Insights Resource

### Option A: Using Azure Portal (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" > "Application Insights"
3. Fill in the details:
   - **Resource Name**: `gitmind-vscode-extension`
   - **Application Type**: `Node.js Application`
   - **Resource Group**: Create new or use existing
   - **Location**: Choose closest to your users (e.g., East US, West Europe)
4. Click "Review + Create" then "Create"
5. Once created, go to the resource and copy the **Connection String** from the Overview page

### Option B: Using Azure CLI

```bash
# Install Azure CLI if not already installed
# brew install azure-cli  # macOS

# Login to Azure
az login

# Create resource group (if needed)
az group create --name gitmind-rg --location eastus

# Create Application Insights resource
az monitor app-insights component create \
  --app gitmind-vscode-extension \
  --location eastus \
  --resource-group gitmind-rg \
  --application-type Node.JS

# Get the connection string
az monitor app-insights component show \
  --app gitmind-vscode-extension \
  --resource-group gitmind-rg \
  --query connectionString -o tsv
```

## Step 2: Configure Environment Variables

1. **Create `.env` file:**

```bash
cp .env.example .env
```

2. **Edit `.env` file with your connection string:**

```env
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=YOUR_ACTUAL_KEY;IngestionEndpoint=https://YOUR_REGION.in.applicationinsights.azure.com/;LiveEndpoint=https://YOUR_REGION.livediagnostics.monitor.azure.com/
NODE_ENV=production
EXTENSION_VERSION=3.4.2
```

## Step 3: Test the Implementation

1. **Start development mode:**

```bash
npm run watch
```

2. **Open VS Code and test the extension:**

   - Press F5 to launch Extension Development Host
   - Enable debug mode in extension settings
   - Generate a commit message
   - Check Debug Console for telemetry events

3. **Verify telemetry in Azure:**
   - Go to Azure Portal > Your Application Insights resource
   - Click "Live Metrics" for real-time data
   - Check "Logs" section for custom events

## Step 4: Production Deployment

1. **Update package.json version** (if needed)
2. **Build the extension:**

```bash
npm run package
```

3. **Publish to VS Code Marketplace:**

```bash
# Install vsce if not already installed
npm install -g vsce

# Package the extension
vsce package

# Publish (you'll need a publisher account)
vsce publish
```

## Step 5: Monitor & Analyze

### Key Queries for Application Insights

**Daily Active Users:**

```kusto
customEvents
| where timestamp > ago(30d)
| where name == "gitmind.extension.activated"
| summarize dcount(user_Id) by bin(timestamp, 1d)
| render timechart
```

**Popular AI Providers:**

```kusto
customEvents
| where name == "gitmind.provider.used"
| extend provider = tostring(customDimensions.provider)
| summarize count() by provider
| render piechart
```

**Error Rate:**

```kusto
exceptions
| where timestamp > ago(7d)
| summarize count() by bin(timestamp, 1h)
| render timechart
```

## 🎉 You're All Set!

Your GitMind extension now has enterprise-grade analytics that will help you:

- Understand user behavior and preferences
- Identify and fix issues proactively
- Optimize performance based on real usage data
- Make data-driven decisions for new features
