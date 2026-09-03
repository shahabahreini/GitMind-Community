# Cloudflare Workers AI

> Verified against GitMind `6.1.2` on September 3, 2026

Cloudflare Workers AI can be called directly or through an optional AI Gateway. GitMind uses the OpenAI-compatible Chat Completions route and does not bundle an account-independent model list.

- `gitmind.cloudflare.apiKey` is a Cloudflare API token with Workers AI permission.
- `gitmind.cloudflare.accountId` identifies the Cloudflare account.
- `gitmind.cloudflare.gatewayId` optionally selects an AI Gateway; leave it blank for direct Workers AI.
- `gitmind.cloudflare.model` is an account-available Workers AI model ID.

See the [Cloudflare Workers AI OpenAI compatibility guide](https://developers.cloudflare.com/workers-ai/configuration/openai-compatibility/).
