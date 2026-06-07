# Security And Privacy

> Verified against GitMind `5.0.0` on June 7, 2026.

## Data Flow

GitMind reads the selected repository diff and builds a prompt. For cloud providers, it sends that prompt and diff to the provider you selected. Review that provider's privacy, retention, and training policies before sending private code.

Ollama can keep generation local when its server and model run on your machine. A remotely hosted Ollama URL is not local processing.

## Credentials

- Free users' provider keys are stored in VS Code settings.
- Pro users can enable `gitmind.pro.encryptionEnabled` to migrate provider keys into VS Code SecretStorage.
- Custom API tokens are credentials and must be protected.
- Never commit keys in workspace settings or paste them into issues, screenshots, logs, or prompts.

## Diagnostics And Debug Logging

`gitmind.showDiagnostics` shows model/token information before generation. `gitmind.debug` adds detailed API interaction logs for troubleshooting. Sensitive values are redacted, but debug output can still reveal provider names, models, errors, and repository context; inspect it before sharing.

## Telemetry

`gitmind.telemetry.enabled` defaults to `false` and also respects VS Code's global telemetry setting. GitMind telemetry is intended to contain anonymous usage/error categories, not source code, diffs, prompts, commit messages, API keys, or personal information.

## Privacy Boundary

GitMind cannot control what a configured provider stores after a request. It also cannot make a cloud endpoint local. For sensitive repositories, use an approved provider, Ollama, or a private Custom API and follow your organization's policy.
