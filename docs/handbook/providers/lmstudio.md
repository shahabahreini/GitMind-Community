# LM Studio

> Verified against GitMind `6.1.2` on September 3, 2026

LM Studio is a local, OpenAI-compatible provider. GitMind accepts only a loopback server URL for this provider, so model prompts and diffs remain on the local machine.

- `gitmind.lmstudio.url` defaults to `http://127.0.0.1:1234/v1`.
- `gitmind.lmstudio.model` is the model ID that LM Studio exposes after you load it.

Start LM Studio's local server, load a chat model, then enter its model ID in GitMind. GitMind uses `/v1/models` for discovery and `/v1/chat/completions` for generation. Use [LM Studio's server documentation](https://lmstudio.ai/docs/developer/core/server) for setup.
