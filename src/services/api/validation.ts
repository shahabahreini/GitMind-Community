import * as vscode from "vscode";
import { ApiConfig, MistralRateLimit } from "../../config/types";
import { debugLog } from "../debug/logger";
import { validateGeminiAPIKey } from "./gemini";
import { getApiConfig } from "../../config/settings";

export async function checkApiSetup(): Promise<void> {
    const config = getApiConfig();
    let status = "API Setup Check Results:\n\n";

    try {
        switch (config.type) {
            case "gemini":
                if (!config.apiKey) {
                    status += "❌ Gemini: API key not configured\n";
                } else {
                    const isValid = await validateGeminiAPIKey(config.apiKey);
                    status += isValid
                        ? "✅ Gemini: API key valid\n"
                        : "❌ Gemini: Invalid API key\n";
                }
                break;

            case "mistral":
                if (!config.apiKey) {
                    status += "❌ Mistral: API key not configured\n";
                } else {
                    const rateLimits = await checkMistralRateLimits(config.apiKey);
                    if (rateLimits) {
                        status += "✅ Mistral: API key valid\n";
                        status += `   Remaining requests: ${rateLimits.remaining}\n`;
                        status += `   Reset time: ${new Date(rateLimits.reset * 1000).toLocaleString()}\n`;
                    } else {
                        status += "❌ Mistral: Invalid API key\n";
                    }
                }
                break;

            case "huggingface":
                if (!config.apiKey) {
                    status += "❌ Hugging Face: API key not configured\n";
                } else {
                    const isValid = await validateHuggingFaceApiKey(config.apiKey);
                    status += isValid
                        ? "✅ Hugging Face: API key valid\n"
                        : "❌ Hugging Face: Invalid API key\n";
                }
                break;

            case "ollama":
                const isAvailable = await checkOllamaAvailability(config.url || "http://localhost:11434");
                status += isAvailable
                    ? "✅ Ollama: Service available\n"
                    : "❌ Ollama: Service not available\n";
                break;
        }
    } catch (error) {
        status += `❌ Error during check: ${error instanceof Error ? error.message : String(error)}\n`;
    }

    // Show results in information message
    await vscode.window.showInformationMessage(status, { modal: true });
}

export async function checkRateLimits(): Promise<void> {
    const config = getApiConfig();
    let status = "Rate Limits Status:\n\n";

    try {
        switch (config.type) {
            case "mistral":
                if (!config.apiKey) {
                    status += "❌ Mistral: API key not configured\n";
                } else {
                    const rateLimits = await checkMistralRateLimits(config.apiKey);
                    if (rateLimits) {
                        status += "Mistral API:\n";
                        status += `- Remaining requests: ${rateLimits.remaining}\n`;
                        status += `- Rate limit: ${rateLimits.limit}\n`;
                        status += `- Reset time: ${new Date(rateLimits.reset * 1000).toLocaleString()}\n`;
                        status += `- Query cost: ${rateLimits.queryCost}\n`;
                    }
                }
                break;

            default:
                status += `${config.type}: Rate limits not available for this provider\n`;
                break;
        }
    } catch (error) {
        status += `Error checking rate limits: ${error instanceof Error ? error.message : String(error)}\n`;
    }

    await vscode.window.showInformationMessage(status, { modal: true });
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
