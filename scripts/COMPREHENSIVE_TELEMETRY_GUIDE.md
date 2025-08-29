# GitMind Telemetry & Privacy Guide

## 📊 Overview

GitMind implements privacy-first telemetry to improve the extension while respecting user privacy. This guide covers setup, configuration, and privacy compliance.

## 🚀 Quick Setup

### Prerequisites

- Azure CLI installed and configured
- Node.js (for validation scripts)
- GitMind extension installed

### Automated Setup

```bash
# Clone the project and navigate to scripts
cd /path/to/GitMind/scripts

# Run the unified setup script
bash unified-telemetry-setup.sh
```

### Manual Setup

1. **Azure Portal Method**:

   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to: Application Insights → your-app-insights → Overview
   - Copy the "Connection String" value

2. **Azure CLI Method**:

   ```bash
   # Get existing connection string
   bash get-connection-string.sh
   ```

3. **Configure VS Code**:
   - Open VS Code Settings (Cmd/Ctrl + ,)
   - Search for "GitMind"
   - Set `aiCommitAssistant.telemetry.connectionString` to your connection string
   - Enable `aiCommitAssistant.telemetry.enabled`

## 🔒 Privacy & Compliance

### What Data is Collected

GitMind tracks only three essential, anonymous metrics:

#### 1. Daily Active Users

- **Event**: `gitmind.daily_active_user`
- **Purpose**: Count unique daily users
- **Data**:
  - `user_id`: Anonymous machine ID (no PII)
  - `date`: Date in YYYY-MM-DD format
  - `session_id`: Unique session identifier
  - `extension_version`: Extension version

#### 2. Commit Generation

- **Event**: `gitmind.commit_generated`
- **Purpose**: Track usage and success rates
- **Data**:
  - `provider`: AI provider used (e.g., "openai", "anthropic")
  - `success`: Boolean success status
  - `language`: Programming language detected
  - `commit_type`: Type of commit (conventional, standard)
  - `response_time_ms`: API response time
  - `token_count`: Approximate tokens used

#### 3. Extension Errors

- **Event**: `gitmind.extension_error`
- **Purpose**: Monitor and fix issues
- **Data**:
  - `error_type`: Error category
  - `context`: Where error occurred
  - `provider`: AI provider (if relevant)
  - `extension_version`: Extension version

### What is NOT Collected

❌ **Never collected**:

- Code content or file names
- Git repository names or URLs
- User names or email addresses
- API keys or sensitive credentials
- File paths or directory structures
- Commit messages or code changes

### Privacy Guarantees

- ✅ **Anonymous only**: No PII collection
- ✅ **User control**: Can be disabled anytime
- ✅ **Transparent**: All collection documented
- ✅ **Minimal**: Only essential data collected
- ✅ **Secure**: Encrypted in transit and at rest
- ✅ **Retention**: 90-day maximum data retention

## 📈 Monitoring & Analytics

### Available Queries

The following KQL queries are available in `telemetry-queries.json`:

1. **Daily Active Users**

   ```kql
   customEvents
   | where name == 'gitmind.daily_active_user'
   | summarize UniqueUsers = dcount(tostring(customDimensions.user_id)) by bin(timestamp, 1d)
   | order by timestamp desc
   ```

2. **Provider Success Rates**

   ```kql
   customEvents
   | where name == 'gitmind.commit_generated'
   | summarize SuccessRate = round(100.0 * countif(tostring(customDimensions.success) == 'true') / count(), 2)
     by Provider = tostring(customDimensions.provider)
   | order by SuccessRate desc
   ```

3. **Error Analysis**
   ```kql
   customEvents
   | where name == 'gitmind.extension_error'
   | summarize ErrorCount = count()
     by tostring(customDimensions.error_type), bin(timestamp, 1d)
   | order by timestamp desc, ErrorCount desc
   ```

### Dashboard Creation

After setup, create a monitoring dashboard:

1. Open Azure Portal
2. Navigate to your Application Insights resource
3. Go to Dashboards → New Dashboard
4. Add tiles using the queries from `telemetry-queries.json`

## 🛠️ Configuration Options

### Extension Settings

```json
{
  "aiCommitAssistant.telemetry.enabled": true,
  "aiCommitAssistant.telemetry.connectionString": "your-connection-string",
  "aiCommitAssistant.telemetry.level": "minimal"
}
```

### Environment Variables

For automated setups:

```bash
export RESOURCE_GROUP="gitmind-telemetry-rg"
export APP_INSIGHTS_NAME="gitmind-insights"
export LOCATION="canadacentral"
export WORKSPACE_NAME="gitmind-workspace"
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection Failed**

   - Verify connection string is correct
   - Check Azure resource exists
   - Ensure proper permissions

2. **No Data Appearing**

   - Allow 5-10 minutes for initial data
   - Check telemetry is enabled in settings
   - Verify extension is active

3. **Privacy Concerns**
   - Review what data is collected (above)
   - Disable telemetry if desired
   - Contact support for questions

### Validation Scripts

```bash
# Validate privacy compliance
node privacy-validator.js

# Test telemetry connection
node test-validator.js

# Check extension status
node test-status.js
```

## 📝 Development & Testing

### Local Testing

1. Set up development environment
2. Configure test Application Insights instance
3. Use test connection string
4. Validate events are sent correctly

### Privacy Validation

Run privacy compliance checks:

```bash
# Full privacy audit
node scripts/privacy-validator.js

# Generate compliance report
bash scripts/unified-telemetry-setup.sh
```

## 🔄 Updates & Maintenance

### Updating Configuration

1. Modify settings in VS Code
2. Restart extension
3. Verify new configuration

### Data Retention

- **Default**: 90 days
- **Maximum**: 2 years (Azure limit)
- **Recommended**: 90 days for privacy

### Regular Tasks

- Monthly: Review privacy compliance
- Quarterly: Analyze usage patterns
- Annually: Update privacy documentation

## 📞 Support

### Issues & Questions

- **Privacy concerns**: Contact support immediately
- **Technical issues**: Check troubleshooting section
- **Feature requests**: Submit via GitHub issues

### Compliance

This telemetry implementation is designed to comply with:

- ✅ GDPR (General Data Protection Regulation)
- ✅ CCPA (California Consumer Privacy Act)
- ✅ VS Code Marketplace policies
- ✅ Microsoft Privacy Principles

For privacy policy updates or concerns, please contact the development team.

---

_Last updated: Generated automatically by unified-telemetry-setup.sh_
