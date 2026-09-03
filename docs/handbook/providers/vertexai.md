# Vertex AI

> Verified against GitMind `6.1.1` on September 3, 2026

Vertex AI uses the Google Gen AI SDK in Vertex mode and Application Default Credentials. Authenticate with your normal Google Cloud workflow before generating a message.

- `gitmind.vertexai.project` is the Google Cloud project ID.
- `gitmind.vertexai.location` is the Vertex AI location.
- `gitmind.vertexai.model` is a model ID available to that project and location.

GitMind does not bundle a model list because access is project- and location-specific. Follow the official [Vertex AI quickstart](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstart).
