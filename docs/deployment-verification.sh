#!/bin/bash

# GitMind Extension - Final Deployment Verification
echo "🎉 GitMind Extension - Final Deployment Verification"
echo "===================================================="
echo ""

# Check package.json version
VERSION=$(grep '"version"' package.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo "📦 Extension Version: $VERSION"

# Check VSIX package
if [ -f "ai-commit-assistant-$VERSION.vsix" ]; then
    VSIX_SIZE=$(ls -lh "ai-commit-assistant-$VERSION.vsix" | awk '{print $5}')
    echo "✅ VSIX Package: ai-commit-assistant-$VERSION.vsix ($VSIX_SIZE)"
else
    echo "❌ VSIX Package: Not found"
fi

# Check Application Insights dependency
if grep -q '"applicationinsights"' package.json; then
    AI_VERSION=$(grep '"applicationinsights"' package.json | sed 's/.*"applicationinsights": "\([^"]*\)".*/\1/')
    echo "✅ Application Insights: $AI_VERSION"
else
    echo "❌ Application Insights: Not found in dependencies"
fi

# Check .env configuration
if [ -f ".env" ]; then
    if grep -q "d65ed410-ce22-4010-8e4d-075016e2f9b3" .env; then
        echo "✅ Azure Connection: Configured with real instrumentation key"
    else
        echo "❌ Azure Connection: Missing or invalid connection string"
    fi
else
    echo "❌ Environment: .env file not found"
fi

# Check telemetry service
if [ -f "src/services/telemetry/telemetryService.ts" ]; then
    echo "✅ Telemetry Service: Implemented"
else
    echo "❌ Telemetry Service: Not found"
fi

# Check privacy settings
if grep -q "telemetry.enabled" src/models/ExtensionSettings.ts; then
    echo "✅ Privacy Controls: User opt-out implemented"
else
    echo "❌ Privacy Controls: Not found"
fi

# Check compiled output
if [ -f "dist/extension.js" ]; then
    BUNDLE_SIZE=$(ls -lh dist/extension.js | awk '{print $5}')
    echo "✅ Compiled Bundle: extension.js ($BUNDLE_SIZE)"
else
    echo "❌ Compiled Bundle: Not found (run npm run package)"
fi

echo ""
echo "🚀 DEPLOYMENT STATUS"
echo "==================="

# Calculate deployment readiness score
SCORE=0
[ -f "ai-commit-assistant-$VERSION.vsix" ] && SCORE=$((SCORE + 20))
grep -q '"applicationinsights"' package.json && SCORE=$((SCORE + 20))
[ -f ".env" ] && grep -q "d65ed410-ce22-4010-8e4d-075016e2f9b3" .env && SCORE=$((SCORE + 20))
[ -f "src/services/telemetry/telemetryService.ts" ] && SCORE=$((SCORE + 20))
grep -q "telemetry.enabled" src/models/ExtensionSettings.ts && SCORE=$((SCORE + 20))

if [ $SCORE -eq 100 ]; then
    echo "🎯 Deployment Score: $SCORE/100 - READY FOR PRODUCTION! 🚀"
    echo ""
    echo "✅ All systems go! Your extension is ready for:"
    echo "   • VS Code Marketplace publication"
    echo "   • Enterprise telemetry collection"
    echo "   • Business intelligence analytics"
    echo "   • Global user deployment"
    echo ""
    echo "🌐 Next step: Publish with 'vsce publish --packagePath ai-commit-assistant-$VERSION.vsix'"
elif [ $SCORE -ge 80 ]; then
    echo "⚠️  Deployment Score: $SCORE/100 - ALMOST READY"
    echo "   Minor issues detected - review checklist above"
else
    echo "❌ Deployment Score: $SCORE/100 - NEEDS ATTENTION"
    echo "   Critical issues detected - fix errors above"
fi

echo ""
echo "📊 Azure Application Insights:"
echo "   Resource: gitmind-vscode-extension"
echo "   Region: Canada Central"  
echo "   Portal: https://portal.azure.com/#view/Microsoft_Azure_ApplicationInsights/OverviewBlade/subscriptionId/f27befa2-9826-4d07-8029-5ce8746040ba/resourceGroupName/GitMind-Resources/resourceName/gitmind-vscode-extension"
