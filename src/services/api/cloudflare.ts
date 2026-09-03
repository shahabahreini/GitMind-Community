import { OpenAICompatibleProvider } from "./openaiCompatible";

export class CloudflareProvider extends OpenAICompatibleProvider {
    constructor(apiKey: string, model: string, accountId: string, gatewayId = "") {
        if (!apiKey.trim()) {
            throw new Error("Cloudflare API token is required.");
        }
        if (!accountId.trim()) {
            throw new Error("Cloudflare account ID is required.");
        }
        const baseUrl = gatewayId.trim()
            ? `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/compat`
            : `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`;
        super(apiKey, model, baseUrl, "cloudflare", { Authorization: `Bearer ${apiKey}` });
    }
}
