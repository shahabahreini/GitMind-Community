# GitHub Copilot
> Verified against GitMind `6.2.1` on September 22, 2026

GitHub Copilot uses your editor's GitHub Copilot sign-in through the VS Code language model API. **It needs no API key.** The default is `auto`; **Load GitHub Copilot Models** lists the models your Copilot plan offers in this editor. The first request asks you to allow GitMind to use Copilot models. The dialog explains that GitMind writes commit messages from your staged changes. Data handling follows the active Copilot account and organization policy.

GitMind sends one request to the selected model. It never switches to another Copilot model on its own; with GitMind Pro, **Automatic Recovery** can use a fallback model you configure. **Test Connection** sends a single short request to the selected model.

## When Copilot is not available

| Message | Meaning | What to do |
| --- | --- | --- |
| `GitHub Copilot not detected: <editor> does not provide the language model API that GitHub Copilot needs.` | The editor (for example some VS Code forks) has no language model API. | Choose another provider. |
| `GitHub Copilot not detected in <editor>. Install GitHub Copilot, sign in, and try again.` | GitHub Copilot is not installed or is disabled. | Select **Find GitHub Copilot**, install it, and sign in. |
| `GitMind does not have permission to use GitHub Copilot in <editor>.` | The consent dialog was dismissed or access was denied. | Select **Retry** and choose **Allow**; make sure you are signed in. |
| `No GitHub Copilot models are available in <editor>.` | Copilot is installed but offers no chat models (signed out, or the plan has no chat models). | Sign in to GitHub Copilot and check your plan. |
| `The GitHub Copilot model "<id>" is not available to your account.` | The saved model is not offered to this account. | Choose another model, or select `auto`. |
