# Hugging Face
> Verified against GitMind `6.4.0` on October 5, 2026

Use a [Hugging Face access token](https://huggingface.co/settings/tokens) with the *Make calls to Inference Providers* permission. The default model is `meta-llama/Llama-3.3-70B-Instruct`; **Load Hugging Face Models** lists chat models served by Hugging Face Inference Providers, and model IDs use the `organization/model` form. GitMind sends the selected diff and prompt through the Inference Providers router to the serving provider. Confirm the token can access the selected model when setup checks fail.
