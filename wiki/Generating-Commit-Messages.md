# Generating Commit Messages

> Verified against GitMind `5.0.0` on June 7, 2026.

## Generate

Use the Source Control GitMind button, **GitMind: Generate GitMind Commit Message** in the Command Palette, or `Ctrl+Alt+G` / `Cmd+Alt+G`. GitMind analyzes the chosen repository's staged diff by default and writes the result to its SCM input box.

Enable `gitmind.commit.captureAllChanges` to include staged, unstaged, and untracked changes. With multiple repositories, select the intended repository when prompted.

## Shape The Result

- `gitmind.commit.verbose`: include a detailed body; disable for summary only.
- `gitmind.commitStyle.style`: choose the output convention.
- `gitmind.promptCustomization.enabled`: ask for extra context before generation.
- `gitmind.promptCustomization.saveLastPrompt`: prefill the last custom context.
- **View Last Custom Prompt** and **Clear Last Custom Prompt** manage saved context.
- `gitmind.showDiagnostics`: show model and token information before sending.

Custom context should explain intent that is not obvious from the diff, such as a ticket goal or compatibility constraint. Do not paste secrets or unrelated private data.

## During Generation

The Source Control button changes to a progress indicator. Use the adjacent cancel button or run **GitMind: Cancel Generation**. Cancellation stops the active GitMind request when supported; always verify the SCM input before committing.

## Common Workflows

| Goal | Configuration |
| --- | --- |
| Short commit | Disable verbose output |
| Conventional Commit | Select Conventional Commits style |
| Include working tree | Enable Capture All Changes |
| Explain intent | Enable Prompt Customization |
| Keep changes local | Select Ollama |
| Diagnose model size | Enable diagnostics |
| Match team history | Run Pro **Learn from Commit History** |

See [Commit Styles And Emoji](Commit-Styles-And-Emoji), [Automatic Recovery](Automatic-Recovery), and [Security And Privacy](Security-And-Privacy).
