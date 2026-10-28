import { OpenAICompatibleHeaders, OpenAICompatibleProvider } from "./openaiCompatible";

export class AzureOpenAIProvider extends OpenAICompatibleProvider {
    /** Azure deprecated max_tokens; reasoning deployments accept only max_completion_tokens (Azure OpenAI reasoning docs, 2026-10-28). */
    protected override outputTokensField(): "max_completion_tokens" { return "max_completion_tokens"; }

    constructor(apiKey: string, model: string, endpoint: string, authMode: "apiKey" | "entra", accessToken = "") {
        const credential = authMode === "entra" ? accessToken : apiKey;
        if (!credential.trim()) {
            throw new Error(authMode === "entra"
                ? "A Microsoft Entra token is required. Sign in to the Microsoft account in VS Code first."
                : "Azure OpenAI API key is required.");
        }
        const headers: OpenAICompatibleHeaders = authMode === "entra"
            ? { Authorization: `Bearer ${credential}` }
            : { "api-key": credential };
        super(credential, model, `${endpoint.replace(/\/+$/, "")}/openai/v1`, "azureopenai", headers);
    }
}
