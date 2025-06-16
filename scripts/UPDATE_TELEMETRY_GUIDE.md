# How to Update GitMind Extension with Azure Connection String

## 🚀 Quick Setup Guide

### Step 1: Get Your Connection String

Choose one of these methods:

#### Method A: Using Azure CLI

```bash
cd /path/to/GitMind
bash scripts/get-connection-string.sh
```

#### Method B: Using Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to: Application Insights → gitmind-insights → Overview
3. Copy the "Connection String" value

#### Method C: Manual Azure CLI

```bash
az monitor app-insights component show \
  --app gitmind-insights \
  --resource-group gitmind-telemetry-rg \
  --query connectionString \
  --output tsv
```

### Step 2: Update Your Extension

Choose your preferred method:

## 🔧 Method 1: Environment Variable (Recommended)

Update your `.env` file:

```env
# Replace with your actual connection string
APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=YOUR_KEY;IngestionEndpoint=https://canadacentral-1.in.applicationinsights.azure.com/;LiveEndpoint=https://canadacentral.livediagnostics.monitor.azure.com/"
```

**Your telemetry service is already configured to use this environment variable!**

## 🔧 Method 2: Direct Code Update

Update `src/services/telemetry/telemetryService.ts`:

```typescript
constructor() {
    // Replace the fallback connection string with your Azure one
    this.instrumentationKey = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
        'YOUR_NEW_CONNECTION_STRING_HERE';

    // ...rest of constructor
}
```

## 🔧 Method 3: VS Code Launch Configuration

Update `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "${workspaceFolder}/npm: watch",
      "env": {
        "APPLICATIONINSIGHTS_CONNECTION_STRING": "YOUR_CONNECTION_STRING_HERE"
      }
    }
  ]
}
```

### Step 3: Test Your Setup

1. **Build your extension:**

   ```bash
   npm run compile
   # or
   npm run watch
   ```

2. **Test in VS Code:**

   - Press F5 to launch Extension Development Host
   - Use the extension to generate commits
   - Check Azure Portal for incoming telemetry data

3. **Verify telemetry is working:**
   ```bash
   # Run the privacy validator to ensure everything is working
   node scripts/privacy-validator.js
   ```

### Step 4: Monitor Your Data

1. **Azure Portal Dashboard:**

   - Go to Application Insights → gitmind-insights
   - Use the KQL queries from `scripts/telemetry-queries.json`

2. **Key Queries to Test:**

   ```kusto
   // Check if data is coming in
   customEvents
   | where name startswith "gitmind."
   | order by timestamp desc
   | limit 10

   // Daily active users
   customEvents
   | where name == "gitmind.daily_active_user"
   | summarize UniqueUsers = dcount(tostring(customDimensions.user_id)) by bin(timestamp, 1d)
   ```

## 🔍 Troubleshooting

### Connection String Format

Your connection string should look like:

```
InstrumentationKey=12345678-1234-1234-1234-123456789012;IngestionEndpoint=https://canadacentral-1.in.applicationinsights.azure.com/;LiveEndpoint=https://canadacentral.livediagnostics.monitor.azure.com/
```

### Common Issues

1. **No data in Azure Portal:**

   - Check connection string is correct
   - Verify telemetry is enabled in VS Code settings
   - Check browser developer tools for any errors

2. **Extension not loading:**

   - Run `npm run compile` first
   - Check for TypeScript compilation errors

3. **Environment variable not working:**
   - Restart VS Code after updating .env
   - Verify .env file is in the root directory

### Verification Commands

```bash
# Check if Azure resources exist
az resource list --resource-group gitmind-telemetry-rg --output table

# Test telemetry service compilation
npm run compile

# Validate privacy compliance
node scripts/privacy-validator.js
```

## 📊 Expected Results

After setup, you should see:

- ✅ Daily active user events in Azure
- ✅ Commit generation events with success/failure
- ✅ Error events when issues occur
- ✅ All data anonymized and privacy-compliant

Your GitMind extension is now ready with professional, privacy-first telemetry! 🎉
