# Azure OpenAI

> Verified against GitMind `6.1.2` on September 3, 2026

Azure OpenAI uses the current v1 Chat Completions endpoint. Deployments are unique to an Azure resource, so GitMind intentionally requires an explicit deployment name rather than showing a stale public model list.

- `gitmind.azureopenai.endpoint` is the Azure OpenAI resource endpoint.
- `gitmind.azureopenai.model` is the deployment name.
- `gitmind.azureopenai.authMode` selects `apiKey` or `entra`.
- `gitmind.azureopenai.apiKey` is required for API-key mode; Entra mode uses the signed-in Microsoft account in VS Code and never saves its access token.

See the official [Azure OpenAI v1 Chat Completions reference](https://learn.microsoft.com/en-us/rest/api/microsoft-foundry/azureopenai/chat).
