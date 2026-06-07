# Troubleshooting And FAQ

> Verified against GitMind `5.0.0` on June 7, 2026.

## Provider And Model Problems

- **Invalid/missing key:** re-enter the key, save, then run **Check API Setup**.
- **Rate limit or quota:** use **Check Rate Limits**, inspect the provider dashboard, wait for reset, or choose another eligible model/provider.
- **Timeout:** retry manually; Pro Automatic Recovery can retry one eligible timeout.
- **Model not found/access denied:** load current models and select one available to your account.
- **Models will not load:** verify the key and provider network access; some providers may fall back to a known model list.
- **Ollama unavailable:** start Ollama, verify `http://localhost:11434`, pull the selected model, and load models again.
- **Copilot unavailable:** install GitHub Copilot, sign in, confirm the subscription, and detect models again.

## Git And Generation

- Stage changes, or enable Capture All Changes.
- In a multi-repository workspace, select the intended repository.
- For large changes, split the work into focused commits or use Pro large-diff processing.
- If generation appears stuck, use **Cancel Generation**, inspect Output/debug logs, and retry.

## Activation

- Verify receipt details exactly, refresh status, and restart VS Code.
- Deactivate an old device before activating a new one.
- If the old device is unavailable or all slots are used, request private license support.
- Use the activation repair control when an existing key is valid but the local instance is missing.

## Collect Diagnostics Safely

1. Record GitMind version, VS Code version, OS, provider, model, and reproducible steps.
2. Run **Check API Setup** and note the sanitized error.
3. Enable diagnostics or debug only long enough to reproduce.
4. Remove source code, diffs, prompts, repository names/paths, emails, IDs, and credentials before sharing.

## FAQ

**Does GitMind commit automatically?** No. It fills the SCM input; you review and commit.

**Can GitMind run locally?** Yes, with a local Ollama server/model.

**Are API keys encrypted?** Pro can store provider keys in VS Code SecretStorage when encryption is enabled.

**Why is a style visible but locked?** Only Basic is Free; the other 11 styles require Pro.

**Will recovery retry rate limits?** General account rate limits and quota exhaustion are excluded.
