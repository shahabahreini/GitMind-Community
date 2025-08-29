#!/bin/bash

# GitMind Extension - Minimal Analytics Dashboard Setup
echo "📊 Creating Minimal Analytics Dashboard for GitMind Extension"
echo "============================================================"

RESOURCE_GROUP="GitMind-Resources"
APP_INSIGHTS_NAME="gitmind-vscode-extension"
DASHBOARD_NAME="GitMind-Minimal-Analytics"

# Get Application Insights resource ID
APP_INSIGHTS_RESOURCE_ID="/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$APP_INSIGHTS_NAME"

echo "🧹 Creating minimal dashboard with only essential metrics..."

# Create the minimal dashboard JSON
cat > gitmind-minimal-dashboard.json << EOF
{
  "lenses": {
    "0": {
      "order": 0,
      "parts": {
        "0": {
          "position": {
            "x": 0,
            "y": 0,
            "colSpan": 8,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "ComponentId",
                "value": {
                  "SubscriptionId": "$(az account show --query id -o tsv)",
                  "ResourceGroup": "$RESOURCE_GROUP",
                  "Name": "$APP_INSIGHTS_NAME"
                }
              },
              {
                "name": "Query",
                "value": "customEvents\\n| where name == 'gitmind.daily_active_user'\\n| where timestamp > ago(30d)\\n| summarize UniqueUsers = dcount(tostring(customDimensions.user_id)) by bin(timestamp, 1d)\\n| order by timestamp desc"
              },
              {
                "name": "PartTitle",
                "value": "Daily Active Users (30 Days)"
              }
            ],
            "type": "Extension/AppInsightsExtension/PartType/AnalyticsLineChartPart"
          }
        },
        "1": {
          "position": {
            "x": 8,
            "y": 0,
            "colSpan": 4,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [
              {
                "name": "ComponentId",
                "value": {
                  "SubscriptionId": "$(az account show --query id -o tsv)",
                  "ResourceGroup": "$RESOURCE_GROUP",
                  "Name": "$APP_INSIGHTS_NAME"
                }
              },
              {
                "name": "Query",
                "value": "customEvents\\n| where name == 'gitmind.daily_active_user'\\n| where timestamp > ago(1d)\\n| summarize TodayUsers = dcount(tostring(customDimensions.user_id))\\n| extend Metric = 'Today Active Users'"
              },
              {
                "name": "PartTitle",
                "value": "Today's Active Users"
              }
            ],
            "type": "Extension/AppInsightsExtension/PartType/AnalyticsGridPart"
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
                "name": "ComponentId",
                "value": {
                  "SubscriptionId": "$(az account show --query id -o tsv)",
                  "ResourceGroup": "$RESOURCE_GROUP",
                  "Name": "$APP_INSIGHTS_NAME"
                }
              },
              {
                "name": "Query",
                "value": "customEvents\\n| where name == 'gitmind.message_generation_failure'\\n| where timestamp > ago(7d)\\n| summarize\\n    ErrorCount = count(),\\n    UniqueUsers = dcount(tostring(customDimensions.user_id))\\nby\\n    Provider = tostring(customDimensions.provider),\\n    ErrorType = tostring(customDimensions.error_type)\\n| order by ErrorCount desc"
              },
              {
                "name": "PartTitle",
                "value": "Message Generation Failures (7 Days)"
              }
            ],
            "type": "Extension/AppInsightsExtension/PartType/AnalyticsGridPart"
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
                "name": "ComponentId",
                "value": {
                  "SubscriptionId": "$(az account show --query id -o tsv)",
                  "ResourceGroup": "$RESOURCE_GROUP",
                  "Name": "$APP_INSIGHTS_NAME"
                }
              },
              {
                "name": "Query",
                "value": "customEvents\\n| where name == 'gitmind.message_generation_failure'\\n| where timestamp > ago(7d)\\n| summarize Count = count() by ErrorType = tostring(customDimensions.error_type)\\n| order by Count desc"
              },
              {
                "name": "PartTitle",
                "value": "Error Types Distribution"
              }
            ],
            "type": "Extension/AppInsightsExtension/PartType/AnalyticsPieChartPart"
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
            "duration": 7,
            "timeUnit": 1
          }
        }
      }
    }
  }
}
EOF

echo "✅ Minimal dashboard JSON created"

# Create the dashboard using Azure CLI
echo "📋 Creating minimal Azure dashboard..."

az portal dashboard create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$DASHBOARD_NAME" \
  --input-path gitmind-minimal-dashboard.json \
  --location "canadacentral" 2>/dev/null || echo "⚠️  Dashboard creation may require manual setup in Azure Portal"

# Create minimal KQL queries file
cat > minimal-telemetry-queries.json << 'EOF'
{
  "name": "GitMind Extension - Minimal Telemetry Queries",
  "description": "Essential queries for minimal telemetry tracking",
  "queries": [
    {
      "name": "Daily Active Users - Last 30 Days",
      "category": "Usage Analytics",
      "query": "customEvents\n| where name == 'gitmind.daily_active_user'\n| where timestamp > ago(30d)\n| summarize UniqueUsers = dcount(tostring(customDimensions.user_id)) by bin(timestamp, 1d)\n| order by timestamp desc"
    },
    {
      "name": "Message Generation Failures by Provider",
      "category": "Error Monitoring", 
      "query": "customEvents\n| where name == 'gitmind.message_generation_failure'\n| where timestamp > ago(7d)\n| summarize\n    ErrorCount = count(),\n    UniqueUsers = dcount(tostring(customDimensions.user_id))\nby\n    Provider = tostring(customDimensions.provider),\n    ErrorType = tostring(customDimensions.error_type)\n| order by ErrorCount desc"
    },
    {
      "name": "Error Types Summary",
      "category": "Error Monitoring",
      "query": "customEvents\n| where name == 'gitmind.message_generation_failure'\n| where timestamp > ago(7d)\n| summarize\n    Count = count(),\n    AffectedUsers = dcount(tostring(customDimensions.user_id))\nby ErrorType = tostring(customDimensions.error_type)\n| order by Count desc"
    },
    {
      "name": "Today's Active Users",
      "category": "Usage Analytics",
      "query": "customEvents\n| where name == 'gitmind.daily_active_user'\n| where timestamp > ago(1d)\n| summarize TodayUsers = dcount(tostring(customDimensions.user_id))"
    },
    {
      "name": "Failure Trend by Day",
      "category": "Error Monitoring",
      "query": "customEvents\n| where name == 'gitmind.message_generation_failure'\n| where timestamp > ago(7d)\n| summarize FailureCount = count() by bin(timestamp, 1d)\n| order by timestamp desc"
    }
  ]
}
EOF

# Get subscription and create portal URL
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
DASHBOARD_URL="https://portal.azure.com/#@/dashboard/arm/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Portal/dashboards/$DASHBOARD_NAME"

echo ""
echo "🎉 Minimal Dashboard Setup Complete!"
echo "===================================="
echo ""
echo "📊 Dashboard Name: $DASHBOARD_NAME"
echo "🔗 Dashboard URL: $DASHBOARD_URL"
echo ""
echo "📝 What Changed:"
echo "  ✅ Disabled auto-collection of exceptions"
echo "  ✅ Only tracking daily active users"
echo "  ✅ Only tracking message generation failures"
echo "  ❌ Removed commit success tracking"
echo "  ❌ Removed general extension error tracking"
echo "  ❌ Removed session tracking"
echo "  ❌ Removed settings change tracking"
echo ""
echo "📈 Available Metrics:"
echo "  • Daily Active Users (usage analytics)"
echo "  • Message Generation Failures (error monitoring)"
echo "  • Error Types Distribution"
echo "  • Provider-specific Failure Rates"
echo ""
echo "🔧 Manual Setup Instructions:"
echo "1. Go to Azure Portal: https://portal.azure.com"
echo "2. Navigate to Application Insights: $APP_INSIGHTS_NAME"
echo "3. Click 'Logs' to run custom queries"
echo "4. Use queries from minimal-telemetry-queries.json"
echo ""
echo "📄 Files Created:"
echo "  • gitmind-minimal-dashboard.json"
echo "  • minimal-telemetry-queries.json"
echo ""
echo "✨ Your dashboard will now show ONLY relevant data!"
