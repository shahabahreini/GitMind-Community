import { debugLog } from "../debug/logger";
import { generateCommitPrompt, getPromptConfig } from "./prompts";
import { RequestManager } from "../../utils/requestManager";
import type { MiniMaxModel } from "../../config/types";
import { BaseAIProvider, GenerationOptions } from "./base";
import { loggedFetch } from "./loggedFetch";

const MINIMAX_ANTHROPIC_BASE_URL = "https://api.minimax.io/anthropic";

interface GenerationConfig {
    max_tokens: number;
    temperature: number;
    top_p: number;
}

const MODEL_CONFIGS: Record<MiniMaxModel, GenerationConfig> = {
    "MiniMax-M2": {
        max_tokens: 350,
        temperature: 0.2,
        top_p: 0.8,
    },
    "MiniMax-M2-Stable": {
        max_tokens: 350,
        temperature: 0.2,
        top_p: 0.8,
    },
};

function extractTextFromAnthropicContent(content: unknown): string {
    if (!Array.isArray(content)) {
        return "";
    }

    let fullText = "";
    for (const block of content) {
        if (
            typeof block === "object" &&
            block !== null &&
            "type" in block &&
            (block as { type?: unknown }).type === "text" &&
            "text" in block &&
            typeof (block as { text?: unknown }).text === "string"
        ) {
            fullText += (block as { text: string }).text;
        }
    }

    return fullText;
}

export class MiniMaxProvider extends BaseAIProvider {
    constructor(apiKey: string, model: string) {
        super(apiKey, model);
    }

    protected async generateResponse(prompt: string, options?: GenerationOptions): Promise<string> {
        const requestManager = RequestManager.getInstance();
        const controller = requestManager.getController();

        if (!this.apiKey || this.apiKey.trim() === "") {
            debugLog("Error: MiniMax API key is missing or empty");
            throw new Error("MiniMax API key is required but not configured");
        }

        const selectedModel = this.model as MiniMaxModel;
        const validModels: MiniMaxModel[] = ["MiniMax-M2", "MiniMax-M2-Stable"];
        if (!validModels.includes(selectedModel)) {
            debugLog("Error: Invalid MiniMax model specified", { model: this.model });
            throw new Error(`Invalid MiniMax model specified: ${this.model}`);
        }

        const config = MODEL_CONFIGS[selectedModel];

        try {
            debugLog(`Calling MiniMax (Anthropic-compatible) API with model: ${selectedModel}`);

            const response = await loggedFetch(`${MINIMAX_ANTHROPIC_BASE_URL}/v1/messages`, {
                method: "POST",
                headers: {
                    "x-api-key": this.apiKey,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: selectedModel,
                    max_tokens: options?.maxTokens ?? config.max_tokens,
                    temperature: options?.temperature ?? config.temperature,
                    top_p: options?.topP ?? config.top_p,
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                }),
                signal: controller.signal,
            }, { provider: "minimax", operation: "messages.create" });

            if (!response.ok) {
                const errorText = await response.text();
                debugLog(`MiniMax API error: ${response.status} ${errorText}`);

                let errorMessage = `MiniMax API error: ${response.status}`;
                try {
                    const errorData: unknown = JSON.parse(errorText);
                    if (
                        typeof errorData === "object" &&
                        errorData !== null &&
                        "error" in errorData &&
                        typeof (errorData as { error?: unknown }).error === "object" &&
                        (errorData as { error?: unknown }).error !== null &&
                        "message" in ((errorData as { error: Record<string, unknown> }).error as Record<string, unknown>)
                    ) {
                        const msg = ((errorData as { error: Record<string, unknown> }).error as Record<string, unknown>)[
                            "message"
                        ];
                        if (typeof msg === "string") {
                            errorMessage = msg;
                        }
                    } else if (typeof (errorData as { message?: unknown }).message === "string") {
                        errorMessage = (errorData as { message: string }).message;
                    }
                } catch {
                    errorMessage = errorText || errorMessage;
                }

                if (response.status === 429) {
                    const retryAfter = response.headers.get("retry-after");
                    throw new Error(
                        retryAfter
                            ? `Rate limit exceeded. Please wait ${retryAfter} seconds before retrying.`
                            : "Rate limit exceeded. Please try again later."
                    );
                }

                throw new Error(errorMessage);
            }

            const data: unknown = await response.json();
            debugLog("MiniMax API response received");

            const content = (data as { content?: unknown }).content;
            const text = extractTextFromAnthropicContent(content);

            if (!text) {
                throw new Error("No text content found in MiniMax API response");
            }

            debugLog("MiniMax API Response:", text);
            return text;
        } catch (error) {
            debugLog("MiniMax API Call Failed:", error);

            if (error instanceof Error && (error.message === "Request was cancelled" || error.name === "AbortError")) {
                throw new Error("Request was cancelled");
            }

            if (error instanceof Error) {
                throw new Error(`MiniMax API call failed: ${error.message}`);
            }

            throw new Error(`Unexpected error during MiniMax API call: ${String(error)}`);
        }
    }

    async getModels(): Promise<string[]> {
        // MiniMax docs list supported Anthropic-compatible text models explicitly.
        // There is no public models endpoint documented for the Anthropic-compatible gateway.
        return ["MiniMax-M2", "MiniMax-M2-Stable"];
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
        return validateMiniMaxAPIKey(this.apiKey);
    }
}

/**
 * Validates a MiniMax API key
 */
export async function validateMiniMaxAPIKey(
    apiKey: string
): Promise<
    boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }
> {
    try {
        if (!apiKey || apiKey.trim() === "") {
            return false;
        }

        const parseErrorResponse = (raw: string): { message?: string; requestId?: string } => {
            const trimmed = raw.trim();
            if (trimmed.length === 0) {
                return {};
            }

            try {
                const parsed: unknown = JSON.parse(trimmed);
                if (typeof parsed !== "object" || parsed === null) {
                    return { message: trimmed };
                }

                const requestIdRaw = (parsed as { request_id?: unknown }).request_id;
                const requestId = typeof requestIdRaw === "string" && requestIdRaw.trim().length > 0
                    ? requestIdRaw
                    : undefined;

                if (
                    "error" in parsed &&
                    typeof (parsed as { error?: unknown }).error === "object" &&
                    (parsed as { error?: unknown }).error !== null
                ) {
                    const err = (parsed as { error: Record<string, unknown> }).error;
                    const msg = err["message"];
                    if (typeof msg === "string" && msg.trim().length > 0) {
                        return { message: msg, requestId };
                    }
                }

                if (typeof (parsed as { message?: unknown }).message === "string") {
                    const msg = (parsed as { message: string }).message;
                    if (msg.trim().length > 0) {
                        return { message: msg, requestId };
                    }
                }

                return { message: trimmed, requestId };
            } catch {
                return { message: trimmed };
            }
        };

        const cleanMiniMaxMessage = (message: string): string => message.replace(/\s*\(\d+\)\s*$/, "").trim();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await loggedFetch(`${MINIMAX_ANTHROPIC_BASE_URL}/v1/messages`, {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "MiniMax-M2",
                max_tokens: 10,
                messages: [{ role: "user", content: "Test" }],
            }),
            signal: controller.signal,
        }, { provider: "minimax", operation: "validate" });

        clearTimeout(timeoutId);
        if (response.ok) {
            return true;
        }

        const status = response.status;
        const bodyText = await response.text().catch(() => "");
        const parsed = parseErrorResponse(bodyText);
        const parsedMessage = typeof parsed.message === "string" ? cleanMiniMaxMessage(parsed.message) : undefined;
        const requestId = parsed.requestId;
        debugLog("MiniMax API key validation failed", { status, bodyText, parsedMessage });

        if (status === 401 || status === 403) {
            return {
                success: false,
                error: "Invalid API key",
                troubleshooting:
                    "Your MiniMax API key was rejected. Verify you copied it correctly and that it is active in your MiniMax account.\n\n" +
                    "MiniMax Anthropic-compatible API docs: https://platform.minimax.io/docs/api-reference/text-anthropic-api",
            };
        }

        if (status === 429) {
            const retryAfter = response.headers.get("retry-after");
            return {
                success: false,
                error: "Rate limit exceeded",
                troubleshooting: retryAfter
                    ? `MiniMax rate limit exceeded. Please wait ${retryAfter} seconds and try again.`
                    : "MiniMax rate limit exceeded. Please try again later.",
            };
        }

        if (parsedMessage && /insufficient\s+balance/i.test(parsedMessage)) {
            const requestIdLine = requestId ? `Request ID: ${requestId}\n` : "";
            return {
                success: true,
                warning: "Insufficient balance",
                troubleshooting:
                    "Your MiniMax account balance is insufficient to run API requests. Please top up your balance and try again.\n" +
                    requestIdLine +
                    "\nMiniMax Anthropic-compatible API docs:\nhttps://platform.minimax.io/docs/api-reference/text-anthropic-api",
            };
        }

        const errorSummary = parsedMessage ?? `HTTP ${status}`;
        return {
            success: false,
            error: `MiniMax API error: ${errorSummary}`,
            troubleshooting:
                "MiniMax API request failed. Please review the error details above and confirm your MiniMax account is active and properly funded.\n\n" +
                "MiniMax Anthropic-compatible API docs: https://platform.minimax.io/docs/api-reference/text-anthropic-api",
        };
    } catch (error) {
        debugLog("MiniMax API Key Validation Failed:", error);
        const isAbort = error instanceof Error && (error.name === "AbortError" || error.message.toLowerCase().includes("abort"));
        return {
            success: false,
            error: isAbort ? "Request timed out" : (error instanceof Error ? error.message : String(error)),
            troubleshooting: isAbort
                ? "The connection test timed out. Check your network connection and try again."
                : "An unexpected error occurred during the MiniMax API key check. Please try again.",
        };
    }
}

/**
 * Backward compatibility functions
 */
export async function callMiniMaxAPI(
    apiKey: string,
    model: string,
    diff: string,
    customContext: string = ""
): Promise<string> {
    const provider = new MiniMaxProvider(apiKey, model);
    return provider.generateCommitMessage(diff, customContext);
}

export async function fetchMiniMaxModels(_apiKey: string): Promise<string[]> {
    return ["MiniMax-M2", "MiniMax-M2-Stable"];
}
