# Commands And Shortcuts

> Verified against GitMind `6.0.0` on July 14, 2026.

GitMind registers public commands through the Command Palette, Source Control actions, settings UI, onboarding, and activation workflows. Internal status, migration, loading-indicator, and developer diagnostics commands are intentionally excluded.

| Area | Public command IDs |
| --- | --- |
| Generate | `gitmind.generateCommitMessage`, `gitmind.generateCommitMessagePro`, `gitmind.cancelGeneration` |
| Commit intelligence | `gitmind.advancedCommitActions`, `gitmind.openCommitWorkspace`, `gitmind.commitComposer`, `gitmind.reviewChanges`, `gitmind.draftChoices` |
| Adjacent drafts | `gitmind.draftSquashMessage`, `gitmind.draftPullRequest`, `gitmind.draftStashMessage`, `gitmind.draftReleaseNotes`, `gitmind.explainCommit` |
| Settings and checks | `gitmind.openSettings`, `gitmind.openSettingsPro`, `gitmind.checkApiSetup`, `gitmind.checkRateLimits` |
| Model discovery | `gitmind.loadMistralModels`, `gitmind.loadHuggingFaceModels`, `gitmind.loadZaiModels`, `gitmind.loadNvidiaModels`, `gitmind.loadGroqModels`, `gitmind.loadCopilotModels` |
| Prompt and style | `gitmind.clearLastPrompt`, `gitmind.viewLastPrompt`, `gitmind.changeCommitStyle` |
| Onboarding | `gitmind.openOnboarding`, `gitmind.completeOnboarding`, `gitmind.skipOnboarding`, `gitmind.resetOnboarding`, `gitmind.reEnableOnboarding` |
| Pro workflows | `gitmind.learnFromCommitHistory`, `gitmind.generateChangelog`, `gitmind.updateChangelog` |
| Pro support report | `gitmind.startSupportSession`, `gitmind.stopSupportSession`, `gitmind.saveSupportReport`, `gitmind.deleteSupportSession` |
| Purchase and activation | `gitmind.subscribe`, `gitmind.activateWithLicenseKey`, `gitmind.showActivationQuickPick`, `gitmind.validateExistingLicense`, `gitmind.deactivatePro`, `gitmind.fixLicenseActivation` |

## Keyboard Shortcut

| Action | Windows / Linux | macOS | Requirement |
| --- | --- | --- | --- |
| Generate GitMind Commit Message | `Ctrl+Alt+G` | `Cmd+Alt+G` | Active Git Source Control provider |

VS Code's **Preferences: Open Keyboard Shortcuts** command can assign or change shortcuts for any public command.

Commit Intelligence is disabled by default. After opting in, **GitMind: Advanced Commit Actions…** is the consolidated entry point. The compatible command IDs remain available for automation only while the preview is enabled. These actions do not create stashes, pull requests, releases, or remote objects. Commit Composer applies a local series only after its separate final confirmation and never pushes.
