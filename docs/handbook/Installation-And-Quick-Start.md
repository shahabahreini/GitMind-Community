# Installation And Quick Start

> Verified against GitMind `5.0.2` on June 7, 2026.

## Install

- Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=ShahabBahreiniJangjoo.ai-commit-assistant).
- Install from [Open VSX](https://open-vsx.org/extension/ShahabBahreiniJangjoo/ai-commit-assistant).
- In VS Code, run `Extensions: Install from VSIX...` to install a downloaded `.vsix`.
- From a shell with the VS Code CLI: `code --install-extension ShahabBahreiniJangjoo.ai-commit-assistant`.

GitMind requires VS Code 1.96 or newer, the built-in Git extension, and an open Git repository.

## First Run

1. Follow the onboarding walkthrough or run **GitMind: Open Onboarding**.
2. Open **GitMind Setting** from Source Control or the Command Palette.
3. Select a provider. Add its API key when required, then choose or load a model.
4. Run **GitMind: Check API Setup**.
5. Stage changes and click the GitMind icon in Source Control.

The generated message is placed in the selected repository's Source Control input box. Review it before committing.

## Which Changes Are Used?

By default GitMind analyzes staged changes. If nothing is staged, it can prompt you to stage changes.

Enable **Capture All Changes** (`gitmind.commit.captureAllChanges`) to analyze staged, unstaged, and untracked changes without a staging prompt. This does not stage or commit files.

## Multiple Repositories

When a workspace contains multiple Git repositories, GitMind asks which repository to use. The generated message goes to that repository's Source Control input.

## Other Ways To Generate

- Command Palette: **GitMind: Generate GitMind Commit Message**
- Keyboard: `Ctrl+Alt+G` on Windows/Linux or `Cmd+Alt+G` on macOS
- Source Control title bar: GitMind generate icon

See [Generating Commit Messages](Generating-Commit-Messages) for custom context, diagnostics, cancellation, and common workflows.
