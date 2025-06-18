#!/bin/bash

# GitMind Extension - Azure Dashboard Creation Script
echo "📊 Creating Azure Dashboard for GitMind Extension Analytics"
echo "========================================================="

RESOURCE_GROUP="GitMind-Resources"
APP_INSIGHTS_NAME="gitmind-vscode-extension"
DASHBOARD_NAME="GitMind-Extension-Analytics"

# Get Application Insights resource ID
APP_INSIGHTS_RESOURCE_ID="/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME"

# Create the dashboard JSON
cat > gitmind-dashboard.json << EOF
{
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
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "value": {
                  "SubscriptionId": "$(az account show --query id -o tsv)",
                  "ResourceGroup": "$RESOURCE_GROUP",
                  "Name": "$APP_INSIGHTS_NAME"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "customEvents\\n| where name == 'gitmind.daily_active_user'\\n| where timestamp > ago(30d)\\n| summarize UniqueUsers = dcount(tostring(customDimensions.user_id)) by bin(timestamp, 1d)\\n| order by timestamp desc",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "P30D",
                "isOptional": true
              },
              {
                "name": "Dimensions",
                "value": {
                  "xAxis": {
                    "name": "timestamp",
                    "type": "datetime"
                  },
                  "yAxis": [
                    {
                      "name": "UniqueUsers",
                      "type": "long"
                    }
                  ],
                  "splitBy": [],
                  "aggregation": "Sum"
                },
                "isOptional": true
              },
              {
                "name": "Version",
                "value": "1.0",
                "isOptional": true
              },
              {
                "name": "PartId",
                "value": "1",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Daily Active Users",
                "isOptional": true
              }
            ],
            "type": "Extension/AppInsightsExtension/PartType/AnalyticsLineChartPart",
            "settings": {
              "content": {
                "chartSettings": {
                  "group": null,
                  "yAxis": {
                    "isLogarithmic": false,
                    "units": {
                      "isCustom": false,
                      "family": "None",
                      "unit": "Count"
                    }
                  }
                }
              }
            }
          }
        },
        "1": {
          "position": {
            "x": 6,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "value": {
                  "SubscriptionId": "$(az account show --query id -o tsv)",
                  "ResourceGroup": "$RESOURCE_GROUP",
                  "Name": "$APP_INSIGHTS_NAME"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "customEvents\\n| where name == 'gitmind.commit_generated'\\n| where timestamp > ago(7d)\\n| summarize \\n    TotalAttempts = count(),\\n    SuccessRate = round(100.0 * countif(tostring(customDimensions.success) == 'true') / count(), 2)\\nby Provider = tostring(customDimensions.provider)\\n| order by SuccessRate desc",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "P7D",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "AI Provider Success Rates",
                "isOptional": true
              }
            ],
            "type": "Extension/AppInsightsExtension/PartType/AnalyticsGridPart",
            "settings": {}
          }
        },
        "2": {
          "position": {
            "x": 0,
            "y": 4,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "value": {
                  "SubscriptionId": "$(az account show --query id -o tsv)",
                  "ResourceGroup": "$RESOURCE_GROUP",
                  "Name": "$APP_INSIGHTS_NAME"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "customEvents\\n| where name == 'gitmind.extension_error'\\n| where timestamp > ago(7d)\\n| summarize Count = count() by ErrorType = tostring(customDimensions.error_type)\\n| order by Count desc",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "P7D",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "Error Distribution",
                "isOptional": true
              }
            ],
            "type": "Extension/AppInsightsExtension/PartType/AnalyticsPieChartPart",
            "settings": {}
          }
        },
        "3": {
          "position": {
            "x": 6,
            "y": 4,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "resourceTypeMode",
                "isOptional": true
              },
              {
                "name": "ComponentId",
                "value": {
                  "SubscriptionId": "$(az account show --query id -o tsv)",
                  "ResourceGroup": "$RESOURCE_GROUP",
                  "Name": "$APP_INSIGHTS_NAME"
                },
                "isOptional": true
              },
              {
                "name": "Query",
                "value": "let timeRange = ago(24h);\\nlet activeUsers = customEvents\\n| where name == 'gitmind.daily_active_user' and timestamp > timeRange\\n| dcount(tostring(customDimensions.user_id));\\nlet totalCommits = customEvents\\n| where name == 'gitmind.commit_generated' and timestamp > timeRange\\n| count;\\nlet successfulCommits = customEvents\\n| where name == 'gitmind.commit_generated' and timestamp > timeRange\\n| where tostring(customDimensions.success) == 'true'\\n| count;\\nlet totalErrors = customEvents\\n| where name == 'gitmind.extension_error' and timestamp > timeRange\\n| count;\\nprint \\n    ActiveUsers = activeUsers,\\n    TotalCommits = totalCommits,\\n    SuccessfulCommits = successfulCommits,\\n    SuccessRate = round(100.0 * successfulCommits / totalCommits, 2),\\n    TotalErrors = totalErrors,\\n    ErrorRate = round(100.0 * totalErrors / (totalCommits + totalErrors), 2)",
                "isOptional": true
              },
              {
                "name": "TimeRange",
                "value": "P1D",
                "isOptional": true
              },
              {
                "name": "PartTitle",
                "value": "24h Health Overview",
                "isOptional": true
              }
            ],
            "type": "Extension/AppInsightsExtension/PartType/AnalyticsGridPart",
            "settings": {}
          }
        }
      }
    }
  },
  "metadata": {
    "model": {
      "timeRange": {
        "value": {
          "relative": {
            "duration": 24,
            "timeUnit": 1
          }
        },
        "type": "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
      },
      "filterLocale": {
        "value": "en-us"
      },
      "filters": {
        "value": {
          "MsPortalFx_TimeRange": {
            "model": {
              "format": "utc",
              "granularity": "auto",
              "relative": "24h"
            },
            "displayCache": {
              "name": "UTC Time",
              "value": "Past 24 hours"
            },
            "filteredPartIds": []
          }
        }
      }
    }
  }
}
EOF

echo "✅ Dashboard JSON created"

# Create the dashboard using Azure CLI
echo "📋 Creating Azure dashboard..."

az portal dashboard create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DASHBOARD_NAME" \
  --input-path gitmind-dashboard.json \
  --location "canadacentral" 2>/dev/null || echo "⚠️  Dashboard creation may require manual setup in Azure Portal"

# Get subscription and create portal URL
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
DASHBOARD_URL="https://portal.azure.com/#@/dashboard/arm/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Portal/dashboards/$DASHBOARD_NAME"

echo ""
echo "🎉 Dashboard Setup Complete!"
echo "=========================="
echo ""
echo "📊 Dashboard Name: $DASHBOARD_NAME"
echo "🔗 Dashboard URL: $DASHBOARD_URL"
echo ""
echo "📋 Manual Setup Instructions (if needed):"
echo "1. Go to Azure Portal: https://portal.azure.com"
echo "2. Navigate to your Application Insights: $APP_INSIGHTS_NAME"
echo "3. Click 'Workbooks' or 'Logs' to create custom dashboards"
echo "4. Use the queries from application-insights-queries.json"
echo ""
echo "📈 Available Metrics:"
echo "• Daily Active Users"
echo "• Commit Generation Success Rates by AI Provider"
echo "• Error Distribution and Analysis"
echo "• 24-hour Health Overview"
echo "• Usage Patterns and Trends"
