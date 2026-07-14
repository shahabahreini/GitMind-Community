import { debugLog } from "../services/debug/logger";
import { classifyGenerationFailure, normalizeProviderError, ProviderApiError } from "../services/api/recovery";

export interface ErrorInfo {
    provider: string;
    statusCode?: number;
    errorType?: string;
    originalMessage: string;
    userMessage: string;
    suggestions?: string[];
    technicalDetails?: {
        diffSize?: number;
        estimatedTokens?: number;
        modelLimit?: number;
        filesChanged?: number;
    };
}

interface ErrorPattern {
    type: string;
    patterns: string[];
    handler: (error: Error, errorInfo: ErrorInfo, provider: string, context?: any) => ErrorInfo;
}

export class APIErrorHandler {
    private static readonly ERROR_PATTERNS: ErrorPattern[] = [
        {
            type: 'token_limit',
            patterns: ['token', 'exceed', 'too large', 'context_length', 'max_tokens', 'Input validation error'],
            handler: APIErrorHandler.handleTokenLimitError
        },
        {
            type: 'rate_limit',
            patterns: ['rate limit', '429', 'too many requests'],
            handler: APIErrorHandler.handleRateLimitError
        },
        {
            type: 'auth',
            patterns: ['API key', '401', 'unauthorized', 'invalid key', 'authentication'],
            handler: APIErrorHandler.handleAuthenticationError
        },
        {
            type: 'quota',
            patterns: ['quota', 'billing', 'insufficient_quota', 'payment'],
            handler: APIErrorHandler.handleQuotaExceededError
        },
        {
            type: 'network',
            patterns: ['network', 'timeout', 'connection', 'ECONNREFUSED', 'ETIMEDOUT', 'fetch failed'],
            handler: APIErrorHandler.handleNetworkError
        },
        {
            type: 'config',
            patterns: ['configuration', 'not configured', 'missing', 'invalid request'],
            handler: APIErrorHandler.handleContentFilterError
        }
    ];

    private static readonly PROVIDER_SUGGESTIONS: Record<string, string> = {
        default: 'Select an available model with a larger context window'
    };

    static handleAPIError(error: Error, provider: string, context?: {
        diffSize?: number;
        estimatedTokens?: number;
        filesChanged?: number;
    }): ErrorInfo {
        debugLog(`Handling ${provider} API error:`, {
            message: error.message,
            name: error.name,
            context: context
        });

        const errorInfo: ErrorInfo = {
            provider,
            originalMessage: error.message,
            userMessage: error.message,
            suggestions: [],
            technicalDetails: context
        };

        // Prefer structured status metadata. Message parsing is retained only for
        // legacy providers and is never echoed to the user.
        const statusMatch = error.message.match(/(?:http|api error|error|status)?\s*[:( -]?\s*([45]\d{2})(?:\b|\))/i);
        if (error instanceof ProviderApiError && error.status) {
            errorInfo.statusCode = error.status;
        } else if (statusMatch) {
            errorInfo.statusCode = parseInt(statusMatch[1]);
        }

        const failure = classifyGenerationFailure(error, provider);
        switch (failure) {
            case "input-limit": return this.handleTokenLimitError(error, errorInfo, provider, context);
            case "model-limit":
            case "rate-limit": return this.handleRateLimitError(error, errorInfo, provider);
            case "authentication": return this.handleAuthenticationError(error, errorInfo, provider);
            case "account-limit": return this.handleQuotaExceededError(error, errorInfo, provider);
            case "timeout":
            case "network": return this.handleNetworkError(error, errorInfo, provider);
            case "permission":
                errorInfo.userMessage = `${provider} denied access to this model or operation.`;
                errorInfo.suggestions = ["Check the API key permissions", "Verify that your plan includes the selected model", "Select a model available to this account"];
                return errorInfo;
            case "configuration": return this.handleContentFilterError(error, errorInfo, provider);
            case "content-filter":
                errorInfo.userMessage = `${provider} blocked the request because of its content policy.`;
                errorInfo.suggestions = ["Review the staged content", "Remove generated or sensitive content that may trigger the provider policy", "Try again with a smaller change"];
                return errorInfo;
            case "temporary-service":
                errorInfo.userMessage = `${provider} is temporarily unavailable.`;
                errorInfo.suggestions = ["Try again in a few minutes", "Check the provider status page", "Select another provider temporarily"];
                return errorInfo;
        }

        // Find matching error pattern
        for (const pattern of this.ERROR_PATTERNS) {
            if (this.matchesPattern(error.message, pattern.patterns)) {
                return pattern.handler(error, errorInfo, provider, context);
            }
        }

        // No pattern matched - return default error info
        return this.handleGenericError(error, errorInfo, provider);
    }

    private static matchesPattern(message: string, patterns: string[]): boolean {
        return patterns.some(pattern => message.toLowerCase().includes(pattern.toLowerCase()));
    }

    private static handleTokenLimitError(_error: Error, errorInfo: ErrorInfo, provider: string, context?: any): ErrorInfo {
        // Prioritize context data over parsing error message
        const estimatedTokens = context?.estimatedTokens || 'Unknown';
        const diffSize = context?.diffSize;
        const filesChanged = context?.filesChanged;

        // Don't try to parse token limits from error messages for now
        // as this often leads to incorrect very low limits being extracted
        let maxTokens: number | undefined;

        errorInfo.userMessage = `Content is too large for the selected model.`;
        errorInfo.technicalDetails = {
            diffSize,
            estimatedTokens,
            modelLimit: maxTokens,
            filesChanged
        };

        const limitText = maxTokens ? ` (limit: ${maxTokens.toLocaleString()})` : '';
        const modelSuggestion = (this.PROVIDER_SUGGESTIONS && this.PROVIDER_SUGGESTIONS[provider]) || this.PROVIDER_SUGGESTIONS?.default || 'Check available models with larger limits';

        errorInfo.suggestions = [
            "Technical Details:",
            ...(diffSize ? [`• Diff size: ${(diffSize / 1024).toFixed(1)} KB`] : []),
            ...(estimatedTokens !== 'Unknown' ? [`• Estimated tokens: ${typeof estimatedTokens === 'number' ? estimatedTokens.toLocaleString() : estimatedTokens}`] : []),
            ...(filesChanged ? [`• Files changed: ${filesChanged}`] : []),
            "",
            `Current: ~${typeof estimatedTokens === 'number' ? estimatedTokens.toLocaleString() : estimatedTokens} tokens`,
            "Solutions:",
            `• Stage fewer files${filesChanged ? ` (currently: ${filesChanged} files)` : ''}`,
            "• Use 'git add -p' to stage specific chunks",
            "• Commit changes in smaller, logical groups",
            `• Switch to a model with larger context window: ${modelSuggestion}`,
            "• Remove unnecessary whitespace/formatting changes"
        ];

        return errorInfo;
    }

    private static handleRateLimitError(_error: Error, errorInfo: ErrorInfo, provider: string): ErrorInfo {
        errorInfo.userMessage = `${provider} rate limit exceeded.`;
        errorInfo.suggestions = [
            "Wait a few minutes before trying again",
            "Check your API usage dashboard",
            "Consider upgrading your plan for higher limits",
            `Current provider: ${provider} - Consider switching to a different provider temporarily`
        ];
        return errorInfo;
    }

    private static handleAuthenticationError(_error: Error, errorInfo: ErrorInfo, provider: string): ErrorInfo {
        errorInfo.userMessage = `${provider} API key is invalid or missing.`;
        errorInfo.suggestions = [
            "Check your API key in extension settings",
            "Verify the key has correct permissions",
            "Generate a new API key if needed",
            "Ensure the key is for the correct service/provider"
        ];
        return errorInfo;
    }

    private static handleQuotaExceededError(_error: Error, errorInfo: ErrorInfo, provider: string): ErrorInfo {
        errorInfo.userMessage = `${provider} quota exceeded or billing issue.`;
        errorInfo.suggestions = [
            "Check your billing status",
            "Review your usage limits",
            "Consider upgrading your plan",
            "Try a different provider with free tier"
        ];
        return errorInfo;
    }

    private static handleNetworkError(_error: Error, errorInfo: ErrorInfo, provider: string): ErrorInfo {
        errorInfo.userMessage = `Network connection issue with ${provider}.`;
        errorInfo.suggestions = [
            "Check your internet connection",
            "Verify firewall/proxy settings",
            "Try again in a few moments",
            "Check if the service is experiencing downtime"
        ];
        return errorInfo;
    }

    private static handleContentFilterError(_error: Error, errorInfo: ErrorInfo, provider: string): ErrorInfo {
        errorInfo.userMessage = `${provider} configuration issue.`;
        errorInfo.suggestions = [
            "Check your provider settings",
            "Verify the model name is correct",
            "Ensure the API endpoint URL is valid",
            "Review the extension settings"
        ];
        return errorInfo;
    }

    private static handleCopilotError(error: Error, errorInfo: ErrorInfo, provider: string, _context?: any): ErrorInfo {
        const message = error.message.toLowerCase();

        if (message.includes("service") || message.includes("502") || message.includes("503")) {
            errorInfo.userMessage = `${provider} service is temporarily unavailable.`;
            errorInfo.suggestions = [
                "The service may be experiencing issues",
                "Try again in a few minutes",
                "Check the service status page",
                "Consider using a different provider temporarily"
            ];
        } else if (message.includes("model") && message.includes("not found")) {
            errorInfo.userMessage = `Selected model is not available in ${provider}.`;
            errorInfo.suggestions = [
                "Check if the model name is correct",
                "Select a different model from the settings",
                "Verify the model is supported by your plan"
            ];
        } else {
            errorInfo.userMessage = `${provider} API error occurred.`;
            errorInfo.suggestions = [
                "Check your configuration and try again",
                "Create a sanitized Support Report from Pro Settings if the issue persists",
                "Verify your API key and permissions",
                "Consider trying a different provider"
            ];
        }

        return errorInfo;
    }

    private static handleGenericError(error: Error, errorInfo: ErrorInfo, provider: string): ErrorInfo {
        const message = error.message.toLowerCase();

        // Check for specific error patterns that weren't caught by main patterns
        if (message.includes("404") || message.includes("not found")) {
            errorInfo.userMessage = `${provider} resource not found.`;
            errorInfo.suggestions = [
                "The requested model or endpoint may not exist",
                "Check if the model name is correct in settings",
                "Verify you have access to this model",
                "Try selecting a different model from the available options"
            ];
        } else if (message.includes("500") || message.includes("502") || message.includes("503") || message.includes("504")) {
            errorInfo.userMessage = `${provider} service error.`;
            errorInfo.suggestions = [
                "The service is experiencing issues",
                "Try again in a few minutes",
                "Check the provider's status page",
                "Consider using a different provider temporarily"
            ];
        } else {
            errorInfo.userMessage = `${provider} could not complete the request.`;
            errorInfo.suggestions = [
                "Check your configuration and API key",
                "Verify your internet connection",
                "Try again or select a different provider"
            ];
        }

        return errorInfo;
    }

    static formatUserMessage(errorInfo: ErrorInfo): string {
        let message = `${errorInfo.provider}: ${errorInfo.userMessage}`;

        if (errorInfo.technicalDetails) {
            const details = errorInfo.technicalDetails;
            const technicalInfo = [];

            if (details.diffSize) { technicalInfo.push(`Diff size: ${this.formatBytes(details.diffSize)}`); }
            if (details.estimatedTokens) { technicalInfo.push(`Estimated tokens: ${details.estimatedTokens.toLocaleString()}`); }
            if (details.modelLimit) { technicalInfo.push(`Model limit: ${details.modelLimit.toLocaleString()} tokens`); }
            if (details.filesChanged) { technicalInfo.push(`Files changed: ${details.filesChanged}`); }

            if (technicalInfo.length > 0) {
                message += "\n\nTechnical Details:\n• " + technicalInfo.join("\n• ");
            }
        }

        if (errorInfo.suggestions?.length) {
            message += "\n\n" + errorInfo.suggestions.join("\n");
        }

        return message;
    }

    private static formatBytes(bytes: number): string {
        if (bytes === 0) { return '0 B'; }
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    static getErrorSeverity(errorInfo: ErrorInfo): 'error' | 'warning' | 'info' {
        if (!errorInfo.statusCode) { return 'error'; }
        if (errorInfo.statusCode >= 500) { return 'error'; }
        if (errorInfo.statusCode === 429 || errorInfo.statusCode === 422) { return 'warning'; }
        return errorInfo.statusCode >= 400 ? 'error' : 'info';
    }

    static shouldRetryError(error: Error): boolean {
        const retryablePatterns = ['timeout', 'temporarily', 'rate limit', 'overloaded', 'service unavailable', 'network'];
        return retryablePatterns.some(pattern => error.message.toLowerCase().includes(pattern));
    }

    static isFatalError(error: Error): boolean {
        const fatalPatterns = ['invalid', 'not found', 'suspended', 'billing', 'unauthorized', 'forbidden'];
        return fatalPatterns.some(pattern => error.message.toLowerCase().includes(pattern));
    }
}

/** Converts any provider failure into an actionable message without echoing raw response data. */
export function formatSafeProviderError(
    error: unknown,
    provider: string,
    context?: { diffSize?: number; estimatedTokens?: number; filesChanged?: number }
): string {
    const normalized = normalizeProviderError(error, provider);
    return APIErrorHandler.formatUserMessage(APIErrorHandler.handleAPIError(normalized, provider, context));
}
