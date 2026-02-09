import * as vscode from "vscode";
import { debugLog } from "../debug/logger";
import { validateGeminiAPIKey } from "./gemini";
import { validateDeepSeekAPIKey } from "./deepseek";
import { validateGrokAPIKey } from "./grok";
import { validatePerplexityAPIKey } from "./perplexity";
import { validateMiniMaxAPIKey } from "./minimax";
import { getApiConfig } from "../../config/settings";
import { ApiConfig, MistralRateLimit, ApiProvider, CustomApiConfig } from "../../config/types";
import { RequestManager } from "../../utils/requestManager";
import { isCopilotAvailable, validateCopilotAccess } from "./copilot";
import { validateCustomAPI } from "./custom";
import { loggedFetch } from "./loggedFetch";

interface ApiCheckResult {
    success: boolean;
    provider: string;
    model?: string;
    responseTime?: number;
    details?: string;
    error?: string;
    warning?: string;
    troubleshooting?: string;
}

interface RateLimitsCheckResult {
    success: boolean;
    limits?: {
        reset: number;
        limit: number;
        remaining: number;
        queryCost: number;
    };
    notes?: string;
    error?: string;
}

interface ValidatorConfig {
    requiresApiKey: boolean;
    validator?: (apiKey: string) => Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }>;
    defaultModel: string;
    responseTime: number;
    rateLimits?: {
        limit: number;
        remaining: number;
        notes: string;
    };
}

async function validateOllamaSetup(
    baseUrl: string,
    configuredModel: string
): Promise<{ success: boolean; error?: string; warning?: string; troubleshooting?: string; details?: string }> {
    const trimmedUrl = baseUrl.trim();
    const model = configuredModel.trim();

    if (!trimmedUrl) {
        return {
            success: false,
            error: "Ollama URL not configured",
            troubleshooting: "Please set the Ollama URL in settings (e.g., http://localhost:11434).",
        };
    }

    try {
        const versionResponse = await loggedFetch(
            `${trimmedUrl}/api/version`,
            {
                method: "GET",
                signal: AbortSignal.timeout(2000),
            },
            { provider: "ollama", operation: "version" }
        );

        if (!versionResponse.ok) {
            return {
                success: false,
                error: `Ollama version check failed: ${versionResponse.status} ${versionResponse.statusText}`,
                troubleshooting: "Ensure Ollama is running and reachable at the configured URL.",
            };
        }

        const versionJson = (await versionResponse.json()) as { version?: string };
        const version = versionJson.version;
        const versionDetails = version ? `Detected Ollama version: ${version}` : undefined;

        const tagsResponse = await loggedFetch(
            `${trimmedUrl}/api/tags`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                signal: AbortSignal.timeout(3000),
            },
            { provider: "ollama", operation: "tags" }
        );

        if (!tagsResponse.ok) {
            const text = await tagsResponse.text();
            return {
                success: false,
                error: `Ollama models check failed: ${tagsResponse.status} ${tagsResponse.statusText}`,
                troubleshooting: `Ensure Ollama is running and reachable at the configured URL. Response: ${text}`,
                details: versionDetails,
            };
        }

        const tagsJson = (await tagsResponse.json()) as { models?: Array<{ name?: string }> };
        const modelNames = (tagsJson.models ?? [])
            .map(m => m.name)
            .filter((name): name is string => typeof name === "string" && name.trim().length > 0);

        if (modelNames.length === 0) {
            return {
                success: true,
                warning: "No Ollama models are installed",
                troubleshooting:
                    "Install a model first, for example: ollama pull llama3.2\n" +
                    "(You can pick any model supported by Ollama.)\n\n" +
                    "Browse models: https://ollama.com/library",
                details: versionDetails,
            };
        }

        if (!model) {
            return {
                success: true,
                warning: "Ollama is reachable but no model is configured",
                troubleshooting: "Select an Ollama model in settings, then try again.",
                details: versionDetails,
            };
        }

        const isConfiguredModelInstalled = modelNames.includes(model);
        if (!isConfiguredModelInstalled) {
            return {
                success: true,
                warning: `Configured Ollama model is not installed: ${model}`,
                troubleshooting: `Install it with: ollama pull ${model}`,
                details: versionDetails,
            };
        }

        return {
            success: true,
            details: versionDetails,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            troubleshooting: "Ensure Ollama is running and reachable at the configured URL.",
        };
    }
}

const VALIDATOR_CONFIGS: Record<string, ValidatorConfig> = {
    gemini: {
        requiresApiKey: true,
        validator: validateGeminiAPIKey,
        defaultModel: "gemini-2.5-flash-preview-04-17",
        responseTime: 500,
        rateLimits: {
            limit: 60,
            remaining: 50,
            notes: "Gemini provides quota-based rate limits rather than time-based limits"
        }
    },
    huggingface: {
        requiresApiKey: true,
        validator: validateHuggingFaceApiKey,
        defaultModel: "microsoft/DialoGPT-medium",
        responseTime: 600,
        rateLimits: {
            limit: 30000,
            remaining: 29000,
            notes: "Hugging Face rate limits depend on your account tier"
        }
    },
    ollama: {
        requiresApiKey: false,
        validator: async (url: string) => checkOllamaAvailability(url || "http://localhost:11434"),
        defaultModel: "",
        responseTime: 200,
        rateLimits: { limit: 0, remaining: 0, notes: "Ollama is a local service with no API rate limits" }
    },
    mistral: {
        requiresApiKey: true,
        validator: async (apiKey: string) => !!(await checkMistralRateLimits(apiKey)),
        defaultModel: "mistral-large-latest",
        responseTime: 500
    },
    cohere: {
        requiresApiKey: true,
        validator: validateCohereApiKey,
        defaultModel: "command",
        responseTime: 550,
        rateLimits: {
            limit: 100,
            remaining: 90,
            notes: "Cohere rate limits depend on your account tier and model"
        }
    },
    openai: {
        requiresApiKey: true,
        validator: validateOpenAIApiKey,
        defaultModel: "gpt-4o",
        responseTime: 550,
        rateLimits: {
            limit: 200,
            remaining: 180,
            notes: "OpenAI rate limits depend on your account tier and model"
        }
    },
    together: {
        requiresApiKey: true,
        validator: validateTogetherApiKey,
        defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        responseTime: 550,
        rateLimits: {
            limit: 100,
            remaining: 90,
            notes: "Together AI rate limits depend on your account tier and model"
        }
    },
    openrouter: {
        requiresApiKey: true,
        validator: validateOpenRouterApiKey,
        defaultModel: "google/gemma-3-27b-it:free",
        responseTime: 550,
        rateLimits: {
            limit: 100,
            remaining: 90,
            notes: "OpenRouter rate limits depend on your account tier and selected model"
        }
    },
    anthropic: {
        requiresApiKey: true,
        validator: validateAnthropicApiKey,
        defaultModel: "claude-sonnet-4",
        responseTime: 800,
        rateLimits: {
            limit: 1000,
            remaining: 950,
            notes: "Rate limits depend on your account tier and model usage"
        }
    },
    minimax: {
        requiresApiKey: true,
        validator: validateMiniMaxAPIKey,
        defaultModel: "MiniMax-M2",
        responseTime: 800,
        rateLimits: {
            limit: 0,
            remaining: 0,
            notes: "Rate limits depend on your MiniMax plan and model usage"
        }
    },
    copilot: {
        requiresApiKey: false,
        validator: async () => {
            const available = await isCopilotAvailable();
            return available ? await validateCopilotAccess() : { success: false, error: "GitHub Copilot not available" };
        },
        defaultModel: "gpt-4o",
        responseTime: 400,
        rateLimits: { limit: 0, remaining: 0, notes: "GitHub Copilot uses VS Code's built-in rate limiting" }
    },
    deepseek: {
        requiresApiKey: true,
        validator: validateDeepSeekAPIKey,
        defaultModel: "deepseek-chat",
        responseTime: 600,
        rateLimits: {
            limit: 10000,
            remaining: 9500,
            notes: "DeepSeek rate limits depend on your account tier and model usage"
        }
    },
    grok: {
        requiresApiKey: true,
        validator: validateGrokAPIKey,
        defaultModel: "grok-3",
        responseTime: 550,
        rateLimits: {
            limit: 5000,
            remaining: 4800,
            notes: "Grok rate limits depend on your account tier and model usage"
        }
    },
    perplexity: {
        requiresApiKey: true,
        validator: validatePerplexityAPIKey,
        defaultModel: "sonar-pro",
        responseTime: 400,
        rateLimits: {
            limit: 20,
            remaining: 18,
            notes: "Perplexity has 20 requests per minute for free tier users. Pro users have higher limits."
        }
    },
    custom: {
        requiresApiKey: false,
        validator: async () => {
            // Custom API validation is handled separately in checkApiSetup
            // because it requires multiple config parameters
            return { success: true };
        },
        defaultModel: "",
        responseTime: 500,
        rateLimits: {
            limit: 0,
            remaining: 0,
            notes: "Rate limits depend on your custom API provider configuration"
        }
    }
};

export async function checkApiSetup(): Promise<ApiCheckResult> {
    const config: ApiConfig = await getApiConfig();
    const validatorConfig = VALIDATOR_CONFIGS[config.type];

    const result: ApiCheckResult = {
        success: false,
        provider: config.type,
        details: '',
    };

    if (!validatorConfig) {
        result.error = "Unknown provider";
        result.troubleshooting = "Provider not supported";
        return result;
    }

    try {
        // Special handling for custom API provider
        if (config.type === "custom") {
            const customConfig = config as CustomApiConfig;
            const validation = await validateCustomAPI(
                customConfig.baseUrl,
                customConfig.endpoint,
                customConfig.authType,
                customConfig.authToken || '',
                customConfig.headerKey || '',
                customConfig.requestFormat || 'openai',
                customConfig.model
            );

            result.success = validation.success;
            if (validation.success) {
                result.model = customConfig.model;
                result.responseTime = validatorConfig.responseTime;
                result.details = "Connection test successful";
            } else {
                result.error = validation.error || "Connection test failed";
                result.troubleshooting = validation.troubleshooting || "Please check your custom API configuration";
            }
            return result;
        }

        if (config.type === "ollama") {
            const setup = await validateOllamaSetup(
                'url' in config ? (config.url || "") : "",
                config.model || ""
            );

            result.success = setup.success;
            if (setup.success) {
                const shouldHideModel =
                    setup.warning === "No Ollama models are installed" ||
                    setup.warning === "Ollama is reachable but no model is configured";

                if (!shouldHideModel) {
                    result.model = config.model;
                }
                result.responseTime = validatorConfig.responseTime;
                result.details = setup.details ? `Connection test successful (${setup.details})` : "Connection test successful";
                result.warning = setup.warning;
                result.troubleshooting = setup.troubleshooting;
            } else {
                result.error = setup.error || "Connection test failed";
                result.troubleshooting = setup.troubleshooting || "Please check your Ollama configuration";
                result.details = setup.details;
            }
            return result;
        }

        if (validatorConfig.requiresApiKey && !('apiKey' in config && config.apiKey)) {
            result.error = "API key not configured";
            result.troubleshooting = `Please enter your ${config.type} API key in the settings`;
            return result;
        }

        const apiKeyOrUrlRaw = validatorConfig.requiresApiKey
            ? ('apiKey' in config ? config.apiKey : '')
            : ('url' in config ? config.url : '');

        const apiKeyOrUrl = typeof apiKeyOrUrlRaw === "string" ? apiKeyOrUrlRaw : "";

        const validation =
            config.type === "gemini"
                ? await validateGeminiAPIKey(apiKeyOrUrl, config.model)
                : await validatorConfig.validator!(apiKeyOrUrl);

        if (typeof validation === 'boolean') {
            result.success = validation;
            if (validation) {
                result.model = config.model || validatorConfig.defaultModel;
                result.responseTime = validatorConfig.responseTime;
                result.details = "Connection test successful";
            } else {
                result.error = "Connection test failed";
                result.troubleshooting = `Please check your ${config.type} API key and your network connection, then try again.`;
            }
        } else {
            result.success = validation.success;
            if (validation.success) {
                result.model = config.model || validatorConfig.defaultModel;
                result.responseTime = validatorConfig.responseTime;
                result.details = validation.warning ? "API key is valid but has billing issues" : "Connection test successful";
                result.warning = validation.warning;
                result.troubleshooting = validation.troubleshooting;
            } else {
                result.error = validation.error || "Invalid API key";
                result.troubleshooting = validation.troubleshooting || `Please check your ${config.type} configuration`;
            }
        }

        // Special handling for Mistral rate limits in success case
        if (config.type === "mistral" && result.success && config.apiKey) {
            const rateLimits = await checkMistralRateLimits(config.apiKey);
            if (rateLimits) {
                result.details = `Remaining requests: ${rateLimits.current.remaining}`;
            }
        }

        return result;
    } catch (error) {
        debugLog("API setup check error:", error);
        result.success = false;
        result.error = error instanceof Error ? error.message : String(error);
        result.troubleshooting = "An unexpected error occurred during the API check";
        return result;
    }
}

export async function checkRateLimits(): Promise<RateLimitsCheckResult> {
    const config: ApiConfig = await getApiConfig();
    const validatorConfig = VALIDATOR_CONFIGS[config.type];

    const result: RateLimitsCheckResult = { success: false };

    if (!validatorConfig) {
        result.error = "Unknown provider";
        result.notes = "Rate limits not available for this provider";
        return result;
    }

    try {
        if (config.type === "mistral") {
            if (!config.apiKey) {
                result.error = "API key not configured";
                result.notes = "Please configure your Mistral API key";
            } else {
                const rateLimits = await checkMistralRateLimits(config.apiKey);
                if (rateLimits) {
                    result.success = true;
                    result.limits = {
                        reset: rateLimits.current.reset,
                        limit: rateLimits.current.limit,
                        remaining: rateLimits.current.remaining,
                        queryCost: rateLimits.current.queryCost
                    };
                    result.notes = `Rate limits retrieved successfully. Note: Checking rate limits consumes API tokens (${rateLimits.current.queryCost} tokens for this request).`;
                } else {
                    result.error = "Failed to retrieve rate limits";
                    result.notes = "Please check your API key and try again";
                }
            }
        } else {
            result.success = true;
            if (validatorConfig.rateLimits) {
                const resetTime = Math.floor(Date.now() / 1000) + 3600;
                result.limits = {
                    reset: resetTime,
                    limit: validatorConfig.rateLimits.limit,
                    remaining: validatorConfig.rateLimits.remaining,
                    queryCost: 1
                };
            }
            result.notes = validatorConfig.rateLimits?.notes || "Rate limits information not available";
        }
    } catch (error) {
        debugLog("Rate limits check error:", error);
        result.success = false;
        result.error = error instanceof Error ? error.message : String(error);
        result.notes = "An unexpected error occurred while checking rate limits";
    }

    return result;
}

// Helper functions
async function validateHuggingFaceApiKey(apiKey: string): Promise<boolean> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    try {
        const response = await loggedFetch("https://huggingface.co/api/models?limit=1", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            signal: controller.signal
        }, { provider: "huggingface", operation: "validate" });
        return response.ok;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') { return false; }
        debugLog("Hugging Face API validation error:", error);
        return false;
    }
}

async function validateOpenAIApiKey(apiKey: string): Promise<boolean> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    try {
        const response = await loggedFetch("https://api.openai.com/v1/models", {
            headers: { "Authorization": `Bearer ${apiKey}` },
            signal: controller.signal
        }, { provider: "openai", operation: "validate" });
        return response.ok;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') { return false; }
        debugLog("OpenAI API validation error:", error);
        return false;
    }
}

interface RateLimitComparison {
    current: MistralRateLimit;
    previous?: MistralRateLimit;
    anomalies: string[];
}

let lastRateLimit: MistralRateLimit | null = null;

async function checkMistralRateLimits(apiKey: string): Promise<RateLimitComparison | null> {
    const requestManager = RequestManager.getInstance();
    const controller = requestManager.getController();

    try {
        const response = await loggedFetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "mistral-small-latest",
                messages: [{ role: "user", content: "Hi" }],
                max_tokens: 1
            }),
            signal: controller.signal
        }, { provider: "mistral", operation: "rate_limits" });

        const headers = response.headers;
        const currentRateLimit: MistralRateLimit = {
            reset: parseInt(headers.get('ratelimitbysize-reset') || '0'),
            limit: parseInt(headers.get('ratelimitbysize-limit') || '0'),
            remaining: parseInt(headers.get('ratelimitbysize-remaining') || '0'),
            queryCost: parseInt(headers.get('ratelimitbysize-query-cost') || '0'),
            monthlyLimit: parseInt(headers.get('x-ratelimitbysize-limit-month') || '0'),
            monthlyRemaining: parseInt(headers.get('x-ratelimitbysize-remaining-month') || '0'),
            minuteLimit: parseInt(headers.get('x-ratelimitbysize-limit-minute') || '0'),
            minuteRemaining: parseInt(headers.get('x-ratelimitbysize-remaining-minute') || '0'),
            timestamp: Date.now()
        };

        const anomalies: string[] = [];
        if (lastRateLimit) {
            const expectedRemaining = lastRateLimit.remaining - currentRateLimit.queryCost;
            if (currentRateLimit.remaining > expectedRemaining) {
                anomalies.push(`Remaining tokens higher than expected: ${currentRateLimit.remaining} vs expected ${expectedRemaining}`);
            }

            if (currentRateLimit.monthlyRemaining > lastRateLimit.monthlyRemaining) {
                const increase = currentRateLimit.monthlyRemaining - lastRateLimit.monthlyRemaining;
                anomalies.push(`Monthly remaining increased by ${increase} tokens`);
            }

            const timeDiff = (currentRateLimit.timestamp - lastRateLimit.timestamp) / 1000;
            const resetDiff = lastRateLimit.reset - currentRateLimit.reset;
            if (Math.abs(resetDiff - timeDiff) > 5) {
                anomalies.push(`Reset timer inconsistency: expected ~${Math.round(timeDiff)}s, got ${resetDiff}s`);
            }
        }

        const result: RateLimitComparison = {
            current: currentRateLimit,
            previous: lastRateLimit || undefined,
            anomalies
        };

        lastRateLimit = currentRateLimit;
        return result;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') { return null; }
        debugLog("Mistral rate limit check error:", error);
        return null;
    }
}

async function checkOllamaAvailability(url: string): Promise<boolean> {
    try {
        const response = await loggedFetch(`${url}/api/version`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        }, { provider: "ollama", operation: "version" });
        return response.ok;
    } catch (error) {
        debugLog("Ollama availability check error:", error);
        return false;
    }
}

async function validateCohereApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await loggedFetch("https://api.cohere.ai/v1/tokenize", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: "test" })
        }, { provider: "cohere", operation: "validate" });
        return response.ok;
    } catch (error) {
        debugLog("Cohere API validation error:", error);
        return false;
    }
}

async function validateTogetherApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await loggedFetch("https://api.together.xyz/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        }, { provider: "together", operation: "validate" });
        return response.ok;
    } catch (error) {
        debugLog("Together API validation error:", error);
        return false;
    }
}

async function validateOpenRouterApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await loggedFetch("https://openrouter.ai/api/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://github.com/shahabahreini/AI-Commit-Assistant",
                "X-Title": "GitMind"
            }
        }, { provider: "openrouter", operation: "validate" });
        return response.ok;
    } catch (error) {
        debugLog("OpenRouter API validation error:", error);
        return false;
    }
}

async function validateAnthropicApiKey(apiKey: string): Promise<{ success: boolean; error?: string; troubleshooting?: string; warning?: string }> {
    try {
        const response = await loggedFetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01",
                "anthropic-beta": "messages-2023-12-15"
            },
            body: JSON.stringify({
                model: "claude-3-5-haiku-20241022",
                max_tokens: 10,
                messages: [{ role: "user", content: "Test" }]
            })
        }, { provider: "anthropic", operation: "validate" });

        if (response.ok) { return { success: true }; }

        const errorText = await response.text();
        debugLog(`Anthropic API validation error: ${response.status} ${errorText}`);

        let errorMessage = `Anthropic API error: ${response.status}`;
        let troubleshooting = "Please check your API key configuration";

        try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
                errorMessage = errorData.error.message;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            errorMessage = errorText || errorMessage;
        }

        // Check for credit balance issues - these should be warnings, not failures
        const isCreditIssue = errorMessage.toLowerCase().includes('credit') ||
            errorMessage.toLowerCase().includes('balance') ||
            errorMessage.toLowerCase().includes('billing') ||
            errorMessage.toLowerCase().includes('insufficient') ||
            errorMessage.toLowerCase().includes('upgrade') ||
            errorMessage.toLowerCase().includes('purchase credits') ||
            (response.status === 403 && (
                errorMessage.toLowerCase().includes('low') ||
                errorMessage.toLowerCase().includes('plans')
            ));

        debugLog('Anthropic validation - checking for credit issues:', {
            errorMessage,
            responseStatus: response.status,
            isCreditIssue
        });

        if (isCreditIssue) {
            debugLog('Anthropic validation - returning warning for credit issue');
            return {
                success: true, // API key is valid, just low balance
                warning: errorMessage,
                troubleshooting: "Your Anthropic account has insufficient credits. Please go to Plans & Billing to upgrade or purchase credits."
            };
        }

        if (response.status === 401) {
            troubleshooting = "Please check that your Anthropic API key is correct and active";
        } else if (response.status === 403) {
            troubleshooting = "Your API key may not have the required permissions. Please check your Anthropic account settings";
        } else if (response.status === 429) {
            const retryAfter = response.headers.get('retry-after');
            troubleshooting = retryAfter
                ? `Rate limit exceeded. Please wait ${retryAfter} seconds before retrying`
                : "Rate limit exceeded. Please try again in a few minutes";
        }

        return { success: false, error: errorMessage, troubleshooting };
    } catch (error) {
        debugLog("Anthropic API validation network error:", error);
        return {
            success: false,
            error: "Network error while validating API key",
            troubleshooting: "Please check your internet connection and try again"
        };
    }
}