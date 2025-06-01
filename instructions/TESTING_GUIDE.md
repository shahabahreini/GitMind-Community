# GitMind GitHub Copilot Integration - Testing Guide

## Overview

This guide provides instructions for testing the newly integrated GitHub Copilot support in GitMind VS Code extension.

## Prerequisites for Testing

### GitHub Copilot Requirements

1. **VS Code**: Version 1.100.0 or higher
2. **GitHub Copilot Extension**: Installed and authenticated
3. **GitHub Copilot Subscription**: Active subscription (Individual, Business, or Enterprise)
4. **GitHub Account**: Signed in to VS Code with access to Copilot

### Verify Copilot Availability

Before testing GitMind, ensure GitHub Copilot is working:

1. Open VS Code
2. Check that you're signed in to GitHub (bottom left corner)
3. Try using Copilot Chat (Ctrl+Shift+I / Cmd+Shift+I)
4. Verify you can send a simple message to Copilot

## Testing Instructions

### 1. Install GitMind Extension

```bash
# If testing locally, package and install
cd GitMind
npm run package
# Install the .vsix file generated or install from marketplace
```

### 2. Configure GitMind for Copilot

1. **Open GitMind Settings**:

   - Command Palette: `AI Commit Assistant: Open Settings`
   - Or: `Ctrl/Cmd + Shift + P` → "AI Commit Assistant: Open Settings"

2. **Select GitHub Copilot**:

   - In the "API Provider" dropdown, select "GitHub Copilot"
   - Choose your preferred model (GPT-4o is recommended)
   - No API key is required - it uses VS Code authentication

3. **Verify Configuration**:
   - The status banner should show "GitHub Copilot" as the active provider
   - API Status should show "Configured"
   - Model should display your selected model

### 3. Test Commit Message Generation

#### Test Case 1: Basic Functionality

1. Make some changes to files in your Git repository
2. Stage the changes (`git add .`)
3. Open Source Control panel (Ctrl/Cmd + Shift + G)
4. Click the ✨ (sparkle) icon in the commit message box
5. Verify that a commit message is generated using GitHub Copilot

#### Test Case 2: Model Selection

1. Try different models (GPT-4o, GPT-4o-mini, GPT-3.5-turbo)
2. Verify each model generates appropriate commit messages
3. Check that the model selection persists across VS Code sessions

#### Test Case 3: Error Handling

1. **Test without Copilot access**:

   - Sign out of GitHub in VS Code
   - Try to generate a commit message
   - Should show appropriate error message

2. **Test with rate limiting**:
   - Generate multiple commit messages quickly
   - Should handle rate limits gracefully

#### Test Case 4: Integration Features

1. **Verbose vs Concise**:

   - Toggle "Verbose Messages" setting
   - Verify it affects Copilot-generated messages

2. **Custom Context**:

   - Enable "Prompt Customization"
   - Add custom context when generating
   - Verify context is included in the prompt

3. **Diagnostics**:
   - Enable "Show Diagnostics"
   - Verify it shows model information and token estimates

## Expected Results

### Successful Integration Should Show:

- ✅ GitHub Copilot appears in provider dropdown
- ✅ No API key field (shows info about VS Code authentication)
- ✅ Model selection with 14 models across OpenAI, Anthropic, and Google providers
- ✅ Status banner shows "GitHub Copilot" and "Configured"
- ✅ Commit messages generated successfully
- ✅ Proper error messages when Copilot is unavailable

### Performance Expectations:

- **Response Time**: 2-8 seconds (depending on diff size)
- **Quality**: High-quality conventional commit messages
- **Rate Limits**: Handled by VS Code's Copilot integration
- **Memory Usage**: Minimal additional overhead

## Troubleshooting

### Common Issues:

1. **"GitHub Copilot not available"**:

   - Ensure GitHub Copilot extension is installed
   - Verify you're signed in to GitHub
   - Check your Copilot subscription is active

2. **"No permission to use GitHub Copilot"**:

   - Your account may not have Copilot access
   - Try signing out and back in to GitHub
   - Contact your organization admin if using enterprise

3. **"Model not found"**:
   - Some models may not be available in all regions
   - Try switching to GPT-4o or GPT-3.5-turbo
   - Check VS Code and Copilot extension are up to date

### Debug Information:

Enable debug mode in GitMind settings to see detailed logs:

1. Set "Debug Mode" to enabled
2. Check VS Code Developer Tools console
3. Look for "Copilot API" related log messages

## Verification Checklist

- [ ] GitHub Copilot extension installed and authenticated
- [ ] GitMind settings show Copilot as available provider
- [ ] Can select different GPT models
- [ ] Status banner shows correct configuration
- [ ] Basic commit message generation works
- [ ] Error handling works when Copilot unavailable
- [ ] Settings persist across VS Code restarts
- [ ] All conventional commit features work (verbose, scope, etc.)
- [ ] Performance is acceptable (< 10 seconds for typical diffs)

## Feedback and Issues

If you encounter any issues during testing:

1. Check the troubleshooting section above
2. Enable debug mode and gather logs
3. Note your specific VS Code, Copilot, and GitMind versions
4. Include the error message and steps to reproduce

The integration leverages VS Code's native language model API for seamless Copilot access without requiring separate API key management.
