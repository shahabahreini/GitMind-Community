#!/bin/bash

# GitMind Pro Features Development Testing Script

echo "🔐 GitMind Pro Features Development Testing"
echo "==========================================="

echo ""
echo "🚀 Step 1: Enable Development Mode"
echo "Set environment variable:"
echo "export GITMIND_ENCRYPTION_DEV_MODE=true"

echo ""
echo "🎯 Step 2: Launch Extension Development Host"
echo "1. Open VS Code in GitMind project"
echo "2. Press F5 or use 'Run Extension (Dev Mode)' launch configuration"
echo "3. New VS Code window opens with your extension loaded"

echo ""
echo "⚙️ Step 3: Test Pro Features"
echo "1. In the development host window:"
echo "   - Open Command Palette (Cmd/Ctrl + Shift + P)"
echo "   - Run 'GitMind: Open Settings'"
echo "   - Scroll to 'Pro Features' section"

echo ""
echo "✅ Step 4: Verify Development Mode Active"
echo "You should see:"
echo "   ✓ Development Mode notice at bottom"
echo "   ✓ Encryption toggle enabled (not greyed out)"
echo "   ✓ Migration and Status buttons available"
echo "   ✓ Pro features accessible without license key"

echo ""
echo "🔧 Step 5: Test Encryption Features"
echo "1. Add some API keys in regular provider settings"
echo "2. Click '🔄 Migrate Keys' button"
echo "3. Click '📊 Check Status' button"
echo "4. Verify keys are moved to encrypted storage"

echo ""
echo "🔐 Test with Real License Key"
echo "Instead of mock mode, you should:"
echo "1. Enter a valid license key in 'License Key' field"
echo "2. Pro features will activate with real API validation"
echo "3. Test encryption functionality"

echo ""
echo "🔍 Debug Information:"
echo "- Check VS Code Developer Tools (Help > Toggle Developer Tools)"
echo "- Look for GitMind debug logs in console"
echo "- Check encrypted keys in VS Code secrets storage"

echo ""
echo "🎉 Happy Testing!"
