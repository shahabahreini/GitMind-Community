# Security And Privacy

> Verified against GitMind `5.0.6` on July 13, 2026.

## Data Flow

GitMind reads the selected repository diff and builds a prompt. For cloud providers, it sends that prompt and diff to the provider you selected. Review that provider's privacy, retention, and training policies before sending private code.

Ollama can keep generation local when its server and model run on your machine. A remotely hosted Ollama URL is not local processing.

## Credentials

- Free users' provider keys are stored in VS Code settings.
- Pro users can enable `gitmind.pro.encryptionEnabled` to migrate provider keys into VS Code SecretStorage.
- Custom API tokens are credentials and must be protected.
- Never commit keys in workspace settings or paste them into issues, screenshots, logs, or prompts.

## Diagnostics And Support Reports

`gitmind.showDiagnostics` shows model/token estimates before generation. Production builds do not expose raw debug logging. Pro users can opt into a 30-minute sanitized support session from **GitMind Settings > Pro > Support Report**. The report stays in memory until the user reviews and saves it; GitMind never uploads it automatically.

The report uses a fixed allowlist: extension/VS Code versions, platform family, operation/provider categories, HTTP status, relative timing, and recovery outcomes. It rejects source code, diffs, prompts, commit content, repository/file paths, URLs, credentials, API bodies, raw errors, email, and license/customer identifiers. Review the JSON before attaching it to an issue.

## Product Telemetry

GitMind does not collect or transmit product telemetry. Provider requests still send the selected prompt and diff to the provider configured by the user, as described above; those functional requests are not analytics.

## Privacy Boundary

GitMind cannot control what a configured provider stores after a request. It also cannot make a cloud endpoint local. For sensitive repositories, use an approved provider, Ollama, or a private Custom API and follow your organization's policy.
