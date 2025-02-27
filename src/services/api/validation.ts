import * as vscode from "vscode";
import { ApiConfig, MistralRateLimit } from "../../config/types";
import { debugLog } from "../debug/logger";
import { validateGeminiAPIKey } from "./gemini";
import { getApiConfig } from "../../config/settings";

interface ApiCheckResult {
    success: boolean;
    provider: string;
    model?: string;
    responseTime?: number;
    details?: string;
    error?: string;
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


export async function checkApiSetup(): Promise<ApiCheckResult> {
    const config = getApiConfig();
    let result: ApiCheckResult = {
        success: false,
        provider: config.type,
        details: '',
    };

    try {
        switch (config.type) {
            case "gemini":
                if (!config.apiKey) {
                    result.error = "API key not configured";
                } else {
                    const isValid = await validateGeminiAPIKey(config.apiKey);
                    result.success = isValid;
                    if (!isValid) {
                        result.error = "Invalid API key";
                        result.troubleshooting = "Please check your Gemini API key configuration";
                    }
                }
                break;

            case "mistral":
                if (!config.apiKey) {
                    result.error = "API key not configured";
                } else {
                    const rateLimits = await checkMistralRateLimits(config.apiKey);
                    result.success = !!rateLimits;
                    if (rateLimits) {
                        result.details = `Remaining requests: ${rateLimits.remaining}`;
                    } else {
                        result.error = "Invalid API key";
                        result.troubleshooting = "Please check your Mistral API key configuration";
                    }
                }
                break;

            case "huggingface":
                if (!config.apiKey) {
                    result.error = "API key not configured";
                } else {
                    const isValid = await validateHuggingFaceApiKey(config.apiKey);
                    result.success = isValid;
                    if (!isValid) {
                        result.error = "Invalid API key";
                        result.troubleshooting = "Please check your Hugging Face API key configuration";
                    }
                }
                break;

            case "ollama":
                const isAvailable = await checkOllamaAvailability(config.url || "http://localhost:11434");
                result.success = isAvailable;
                if (!isAvailable) {
                    result.error = "Service not available";
                    result.troubleshooting = "Please check if Ollama is running and accessible";
                }
                break;
        }
    } catch (error) {
        result.success = false;
        result.error = error instanceof Error ? error.message : String(error);
        result.troubleshooting = "An unexpected error occurred during the API check";
    }

    // Still show results in information message
    const status = `API Setup Check Results:\n\n${result.success ? '✅' : '❌'} ${result.provider}: ${result.success ? 'Success' : result.error}`;
    await vscode.window.showInformationMessage(status, { modal: true });

    return result;
}

export async function checkRateLimits(): Promise<RateLimitsCheckResult> {
    const config = getApiConfig();
    let result: RateLimitsCheckResult = {
        success: false
    };

    try {
        switch (config.type) {
            case "mistral":
                if (!config.apiKey) {
                    result.success = false;
                    result.error = "API key not configured";
                    result.notes = "Please configure your Mistral API key";
                } else {
                    const rateLimits = await checkMistralRateLimits(config.apiKey);
                    if (rateLimits) {
                        result.success = true;
                        result.limits = rateLimits;
                        result.notes = `Rate limits retrieved successfully for Mistral API`;
                    } else {
                        result.success = false;
                        result.error = "Failed to retrieve rate limits";
                        result.notes = "Please check your API key and try again";
                    }
                }
                break;

            default:
                result.success = false;
                result.notes = `${config.type}: Rate limits not available for this provider`;
                break;
        }
    } catch (error) {
        result.success = false;
        result.error = error instanceof Error ? error.message : String(error);
        result.notes = "An unexpected error occurred while checking rate limits";
    }

    // Still show results in information message
    const status = `Rate Limits Status:\n\n${result.success ? '✅' : '❌'} ${result.notes}`;
    await vscode.window.showInformationMessage(status, { modal: true });

    return result;
}

async function validateHuggingFaceApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch("https://api-inference.huggingface.co/status", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
        return response.ok;
    } catch (error) {
        debugLog("Hugging Face API validation error:", error);
        return false;
    }
}

async function checkMistralRateLimits(apiKey: string): Promise<MistralRateLimit | null> {
    try {
        const response = await fetch("https://api.mistral.ai/v1/models", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            return null;
        }

        return {
            reset: parseInt(response.headers.get('ratelimitbysize-reset') || '0'),
            limit: parseInt(response.headers.get('ratelimitbysize-limit') || '0'),
            remaining: parseInt(response.headers.get('ratelimitbysize-remaining') || '0'),
            queryCost: parseInt(response.headers.get('ratelimitbysize-query-cost') || '0')
        };
    } catch (error) {
        debugLog("Mistral rate limit check error:", error);
        return null;
    }
}

async function checkOllamaAvailability(url: string): Promise<boolean> {
    try {
        const response = await fetch(`${url}/api/version`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000) // 2 second timeout
        });
        return response.ok;
    } catch (error) {
        debugLog("Ollama availability check error:", error);
        return false;
    }
}
