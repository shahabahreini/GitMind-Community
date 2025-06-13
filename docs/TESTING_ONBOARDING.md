# 🧪 Testing GitMind Onboarding - Quick Guide

## 🚀 How to Test the New Onboarding System

### **Option 1: Automatic Onboarding (Easiest)**

I've temporarily modified the extension to always show onboarding:

1. **Press F5** in VS Code to launch Extension Development Host
2. **The onboarding should automatically appear** in a new tab
3. **Navigate through the 4 steps:**
   - Welcome & Overview
   - AI Provider Selection
   - Configuration Setup
   - First Commit Walkthrough

### **Option 2: Manual Onboarding Command**

1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Type: `AI Commit: Open Onboarding`
3. Press Enter
4. The interactive onboarding webview will open

### **Option 3: Reset State Manually**

If you want to test the "first-time user" experience naturally:

1. Open Command Palette (`Cmd+Shift+P`)
2. Type: `Developer: Open User Data Directory`
3. Navigate to `User/globalStorage/`
4. Find the extension folder and delete the onboarding flag
5. Restart VS Code - onboarding will show for "new" users

## 🎯 What to Test

### **Visual Elements:**

- [ ] Modern, clean interface loads
- [ ] Provider cards display with badges (Free, Premium, Local, etc.)
- [ ] Navigation buttons work (Next, Back, Skip)
- [ ] VS Code theme integration (try switching themes)

### **Functionality:**

- [ ] Provider selection updates your settings
- [ ] "Configure Settings" opens the settings webview
- [ ] "Skip" and "Complete" buttons work
- [ ] Real-time API testing (if you have keys)

### **Flow Testing:**

- [ ] Step 1: Welcome screen appears
- [ ] Step 2: Provider selection works
- [ ] Step 3: Configuration guidance
- [ ] Step 4: Commit walkthrough

## 🔧 Development Testing

### **Extension Development Mode:**

```bash
# In VS Code, press F5 to start Extension Development Host
# The onboarding will auto-appear in the new window
```

### **Check Console:**

- Open Developer Tools (`Help > Toggle Developer Tools`)
- Look for onboarding telemetry events in console
- Check for any JavaScript errors

## 🎨 Theme Testing

Test with different VS Code themes:

- Light theme
- Dark theme
- High contrast themes
- Custom themes

## ⚠️ After Testing

**Remember to remove the test line!**

In `src/extension.ts`, remove this line after testing:

```typescript
context.globalState.update("aiCommitAssistant.onboardingShown", false);
```

This ensures onboarding only shows for actual new users in production.

## 🐛 Troubleshooting

If onboarding doesn't appear:

1. Check VS Code Developer Console for errors
2. Try running the manual command: `AI Commit: Open Onboarding`
3. Verify extension compiled successfully (check terminal output)
4. Make sure you're in Extension Development Host (F5 mode)

---

**Happy testing! The new onboarding should provide a much better first-time user experience! 🎉**
