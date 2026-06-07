# Commands And Shortcuts

> Verified against GitMind `5.0.2` on June 7, 2026.

GitMind 5.0.2 registers **43 commands**. The 34 supported public commands below are available from the Command Palette, Source Control actions, settings UI, onboarding, or activation workflows. Internal status, migration, loading-indicator, and developer diagnostics commands are intentionally excluded.

| Area | Public command IDs |
| --- | --- |
| Generate | `gitmind.generateCommitMessage`, `gitmind.generateCommitMessagePro`, `gitmind.cancelGeneration` |
| Settings and checks | `gitmind.openSettings`, `gitmind.openSettingsPro`, `gitmind.toggleDebug`, `gitmind.checkApiSetup`, `gitmind.checkRateLimits` |
| Model discovery | `gitmind.loadMistralModels`, `gitmind.loadHuggingFaceModels`, `gitmind.loadZaiModels`, `gitmind.loadNvidiaModels`, `gitmind.loadGroqModels`, `gitmind.loadCopilotModels` |
| Prompt and style | `gitmind.clearLastPrompt`, `gitmind.viewLastPrompt`, `gitmind.changeCommitStyle` |
| Onboarding | `gitmind.openOnboarding`, `gitmind.completeOnboarding`, `gitmind.skipOnboarding`, `gitmind.resetOnboarding`, `gitmind.reEnableOnboarding` |
| Pro workflows | `gitmind.learnFromCommitHistory`, `gitmind.generateChangelog`, `gitmind.updateChangelog` |
| Purchase and activation | `gitmind.subscribe`, `gitmind.manageSubscription`, `gitmind.refreshSubscription`, `gitmind.activateWithLicenseKey`, `gitmind.activateWithOrderId`, `gitmind.showActivationQuickPick`, `gitmind.validateExistingLicense`, `gitmind.deactivatePro`, `gitmind.fixLicenseActivation` |

## Keyboard Shortcut

| Action | Windows / Linux | macOS | Requirement |
| --- | --- | --- | --- |
| Generate GitMind Commit Message | `Ctrl+Alt+G` | `Cmd+Alt+G` | Active Git Source Control provider |

VS Code's **Preferences: Open Keyboard Shortcuts** command can assign or change shortcuts for any public command.
