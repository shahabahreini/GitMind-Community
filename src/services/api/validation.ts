import * as vscode from "vscode";
import { debugLog } from "../debug/logger";
import { validateGeminiAPIKey } from "./gemini";
import { validateDeepSeekAPIKey } from "./deepseek";
import { validateGrokAPIKey } from "./grok";
import { validatePerplexityAPIKey } from "./perplexity";
import { getApiConfig } from "../../config/settings";
import { ApiConfig, MistralRateLimit, ApiProvider } from "../../config/types";
import { RequestManager } from "../../utils/requestManager";
import { isCopilotAvailable, validateCopilotAccess } from "./copilot";

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
        defaultModel: "",
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
        defaultModel: "claude-3-5-sonnet-20241022",
        responseTime: 800,
        rateLimits: {
            limit: 1000,
            remaining: 950,
            notes: "Rate limits depend on your account tier and model usage"
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
    }
};

export async function checkApiSetup(): Promise<ApiCheckResult> {
    const config: ApiConfig = getApiConfig();
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
        if (validatorConfig.requiresApiKey && !('apiKey' in config && config.apiKey)) {
            result.error = "API key not configured";
            result.troubleshooting = `Please enter your ${config.type} API key in the settings`;
            return result;
        }

        const apiKeyOrUrl = validatorConfig.requiresApiKey
            ? ('apiKey' in config ? config.apiKey : '')
            : ('url' in config ? config.url : '');
        const validation = await validatorConfig.validator!(apiKeyOrUrl!);

        if (typeof validation === 'boolean') {
            result.success = validation;
            if (validation) {
                result.model = config.model || validatorConfig.defaultModel;
                result.responseTime = validatorConfig.responseTime;
                result.details = "Connection test successful";
            } else {
                result.error = "Invalid API key";
                result.troubleshooting = `Please check your ${config.type} configuration`;
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
    const config: ApiConfig = getApiConfig();
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
        const response = await fetch("https://huggingface.co/api/models?limit=1", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            signal: controller.signal
        });
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
        const response = await fetch("https://api.openai.com/v1/models", {
            headers: { "Authorization": `Bearer ${apiKey}` },
            signal: controller.signal
        });
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
        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
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
        });

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
        const response = await fetch(`${url}/api/version`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });
        return response.ok;
    } catch (error) {
        debugLog("Ollama availability check error:", error);
        return false;
    }
}

async function validateCohereApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch("https://api.cohere.ai/v1/tokenize", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: "test" })
        });
        return response.ok;
    } catch (error) {
        debugLog("Cohere API validation error:", error);
        return false;
    }
}

async function validateTogetherApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch("https://api.together.xyz/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        });
        return response.ok;
    } catch (error) {
        debugLog("Together API validation error:", error);
        return false;
    }
}

async function validateOpenRouterApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://github.com/shahabahreini/AI-Commit-Assistant",
                "X-Title": "GitMind: AI Commit Assistant"
            }
        });
        return response.ok;
    } catch (error) {
        debugLog("OpenRouter API validation error:", error);
        return false;
    }
}

async function validateAnthropicApiKey(apiKey: string): Promise<{ success: boolean; error?: string; troubleshooting?: string }> {
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
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
        });

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

        if (response.status === 401) {
            troubleshooting = "Please check that your Anthropic API key is correct and active";
        } else if (response.status === 403) {
            troubleshooting = errorMessage.toLowerCase().includes('credit')
                ? "Your Anthropic account has insufficient credits. Please add credits to your account"
                : "Your API key may not have the required permissions. Please check your Anthropic account settings";
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