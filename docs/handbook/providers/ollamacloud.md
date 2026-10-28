# Ollama Cloud
> Verified against GitMind `6.7.0` on October 27, 2026

Create an API key in the [Ollama settings](https://ollama.com/settings/keys). The default model is `gpt-oss:120b-cloud`; **Load Available Models** refreshes the searchable catalog with active cloud-hosted models that can write text. GitMind reads each model's context window and thinking levels from Ollama, keeps thinking at the lowest level the model allows, and lets the answer use the model's real output maximum. GitMind sends the selected diff and prompt to Ollama Cloud over HTTPS with your API key. Confirm model availability and account limits after errors.
