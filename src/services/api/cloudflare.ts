import { OpenAICompatibleProvider } from "./openaiCompatible";
import { UNKNOWN_LIMIT_OUTPUT_TOKENS } from "./capabilities";

export class CloudflareProvider extends OpenAICompatibleProvider {
    /** Older Workers AI models default max_tokens to 256 when it is omitted. */
    protected override unknownLimitOutputTokens(): number { return UNKNOWN_LIMIT_OUTPUT_TOKENS; }

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
