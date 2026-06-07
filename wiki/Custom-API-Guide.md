# Custom API Guide

> Verified against GitMind `5.0.0` on June 7, 2026.

Custom API is a GitMind Pro provider for compatible private or third-party text-generation endpoints.

## Configure

1. Select **Custom API** and enable it.
2. Set the base URL, endpoint path, and model.
3. Choose authentication: Bearer token, API key header, Basic authentication, or none.
4. For API key auth, set the custom header name.
5. Choose OpenAI-compatible, Anthropic-compatible, or Custom request and response formats.
6. Use **Test Connection**, then generate with a non-sensitive test repository.

Use HTTPS except for explicitly trusted local endpoints.

## Compatible Formats

OpenAI-compatible endpoints normally accept a model plus a `messages` array and return text at `choices[0].message.content`. Anthropic-compatible endpoints normally accept a model plus messages and return content blocks. Select the matching built-in format where possible.

For custom JSON, use the UI's request template and response path. Supported placeholders include `{{model}}` and `{{prompt}}`. Example request:

```json
{
  "model": "{{model}}",
  "input": "{{prompt}}"
}
```

Example response path: `result.generated_text`.

## Troubleshooting

- Connection failure: verify base URL, path, TLS, VPN, and firewall access.
- 401/403: verify auth type, token, and custom header name.
- Invalid JSON: validate the request template.
- Empty output: make the response path point to a text value.
- Provider rejects request: compare the selected compatibility mode with endpoint documentation.

Tokens are credentials. Never publish request examples containing real tokens, private URLs, source code, or response data.
