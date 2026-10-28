# Perplexity
> Verified against GitMind `6.6.0` on October 19, 2026

Create a key in [Perplexity settings](https://www.perplexity.ai/settings/api). The default is `perplexity/sonar`; GitMind uses Perplexity's Agent API (Sonar Chat Completions support ended September 27, 2026), which takes `provider/model` IDs, and offers documented Agent API models because the API has no model-list endpoint. A saved older Sonar name such as `sonar-pro` is rejected by Perplexity; choose a current model. GitMind sends the selected diff and prompt to Perplexity, and models may use online retrieval. Review the selected model's behavior and account quota.
