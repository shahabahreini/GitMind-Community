# GitMind Telemetry Configuration Guide

## Overview

GitMind now uses focused telemetry to track only three essential metrics:

## Metrics Tracked

### 1. Daily Active Users

- **Event Name**: `gitmind.daily_active_user`
- **Purpose**: Count unique users who use the extension each day
- **Data Collected**:
  - `user_id`: Anonymous machine ID
  - `date`: Date in YYYY-MM-DD format
  - `session_id`: Unique session identifier
  - `extension_version`: Version of the extension

### 2. Commit Generation

- **Event Name**: `gitmind.commit_generated`
- **Purpose**: Track when users generate commits and success rates
- **Data Collected**:
  - `user_id`: Anonymous machine ID
  - `date`: Date in YYYY-MM-DD format
  - `success`: Boolean indicating if commit generation succeeded
  - `provider`: AI provider used (e.g., "openai", "anthropic")
  - `error_message`: Error details if generation failed
  - `commits_count`: Always 1 (for aggregation)

### 3. Extension Errors

- **Event Name**: `gitmind.extension_error`
- **Purpose**: Track errors users encounter while using the extension
- **Data Collected**:
  - `user_id`: Anonymous machine ID
  - `date`: Date in YYYY-MM-DD format
  - `error_type`: Category of error (e.g., "APIConnectionError", "ConfigurationError")
  - `error_message`: Error message
  - `context`: Where the error occurred
  - `extension_version`: Version of the extension
  - `error_count`: Always 1 (for aggregation)

## Azure Application Insights Configuration

### Current Setup

- **Instrumentation Key**: `d65ed410-ce22-4010-8e4d-075016e2f9b3`
- **Region**: Canada Central
- **Ingestion Endpoint**: `https://canadacentral-1.in.applicationinsights.azure.com/`

### Privacy Compliance

- No PII (Personally Identifiable Information) is collected
- Machine ID is used as anonymous user identifier
- Users can disable telemetry via VS Code settings or extension settings

### Data Retention

- Data is retained according to Azure Application Insights default policies
- Recommend setting appropriate retention policies in Azure portal

## Azure Portal Setup Recommendations

### 1. Dashboard Configuration

Create custom queries in Application Insights:

```kusto
// Daily Active Users
customEvents
| where name == "gitmind.daily_active_user"
| summarize UniqueUsers = dcount(tostring(customDimensions.user_id)) by bin(timestamp, 1d)
| order by timestamp desc

// Daily Commit Generation
customEvents
| where name == "gitmind.commit_generated"
| summarize
    TotalCommits = count(),
    SuccessfulCommits = countif(tostring(customDimensions.success) == "true"),
    SuccessRate = round(100.0 * countif(tostring(customDimensions.success) == "true") / count(), 2)
by bin(timestamp, 1d)
| order by timestamp desc

// Error Analysis
customEvents
| where name == "gitmind.extension_error"
| summarize ErrorCount = count() by tostring(customDimensions.error_type), bin(timestamp, 1d)
| order by timestamp desc, ErrorCount desc
```

### 2. Alerts Setup

Configure alerts for:

- High error rates (>10% of commit generations failing)
- Specific error types becoming frequent
- Sudden drops in daily active users

### 3. Export Configuration

If you need raw data export:

- Set up continuous export to Azure Storage
- Configure data retention policies
- Set up automated reporting

## Testing Telemetry

You can test the telemetry by:

1. Installing the extension in development mode
2. Generating commits to test commit tracking
3. Triggering errors to test error tracking
4. Checking Application Insights Live Metrics in Azure portal
