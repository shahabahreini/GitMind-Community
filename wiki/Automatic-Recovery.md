# Automatic Recovery

> Verified against GitMind `5.0.0` on June 7, 2026.

GitMind Pro Automatic Recovery provides bounded recovery without retry loops.

## Behavior

- **Automatic Retry** retries once after a timeout or an eligible temporary Gemini service failure.
- **Model Fallback** tries one configured fallback model when the provider explicitly reports a model-specific limit.
- The fallback picker is searchable and scoped to the selected provider.
- A fallback must differ from the primary model.
- A generation performs no more than the initial request plus one recovery request.
- GitMind shows notifications explaining the failure, recovery action, and result.

## Excluded Failures

GitMind does not automatically recover from invalid or missing API keys, permission/access failures, account quota exhaustion, general provider rate limits, billing problems, malformed requests, or unrelated errors.

## Configure

1. Open **GitMind Setting > Model Settings**.
2. Enable `gitmind.pro.automaticRetry.enabled` and/or `gitmind.pro.modelFallback.enabled`.
3. Select a fallback model for the current provider.
4. Save settings and generate normally.

Recovery does not hide persistent provider failures. Check [Troubleshooting And FAQ](Troubleshooting-And-FAQ) when the recovery request also fails.
