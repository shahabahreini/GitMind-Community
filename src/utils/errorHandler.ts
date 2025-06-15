import { debugLog } from "../services/debug/logger";

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
            handler: APIErrorHandler.handleAuthError
        },
        {
            type: 'quota',
            patterns: ['quota', 'billing', 'insufficient_quota', 'payment'],
            handler: APIErrorHandler.handleQuotaError
        },
        {
            type: 'network',
            patterns: ['network', 'timeout', 'connection', 'ECONNREFUSED', 'ETIMEDOUT', 'fetch failed'],
            handler: APIErrorHandler.handleNetworkError
        },
        {
            type: 'config',
            patterns: ['configuration', 'not configured', 'missing', 'invalid request'],
            handler: APIErrorHandler.handleConfigError
        }
    ];

    private static readonly PROVIDER_SUGGESTIONS: Record<string, string> = {
        'Together AI': 'Try meta-llama/Llama-3.3-70B-Instruct-Turbo (128k)',
        default: 'Check available models with larger limits'
    };

    static handleAPIError(error: Error, provider: string, context?: {
        diffSize?: number;
        estimatedTokens?: number;
        filesChanged?: number;
    }): ErrorInfo {
        debugLog(`Handling ${provider} API error:`, error);

        const errorInfo: ErrorInfo = {
            provider,
            originalMessage: error.message,
            userMessage: error.message,
            suggestions: [],
            technicalDetails: context
        };

        // Extract status code
        const statusMatch = error.message.match(/(\d{3})/);
        if (statusMatch) {
            errorInfo.statusCode = parseInt(statusMatch[1]);
        }

        // Find matching error pattern
        for (const pattern of this.ERROR_PATTERNS) {
            if (this.matchesPattern(error.message, pattern.patterns)) {
                return pattern.handler(error, errorInfo, provider, context);
            }
        }

        return this.handleGenericError(error, errorInfo, provider, context);
    }

    private static matchesPattern(message: string, patterns: string[]): boolean {
        return patterns.some(pattern => message.toLowerCase().includes(pattern.toLowerCase()));
    }

    private static handleTokenLimitError(error: Error, errorInfo: ErrorInfo, provider: string, context?: any): ErrorInfo {
        const tokenMatch = error.message.match(/(\d+)/g);
        const inputTokens = tokenMatch?.[0] ? parseInt(tokenMatch[0]) : 0;
        const maxTokens = tokenMatch?.[1] ? parseInt(tokenMatch[1]) : 0;

        errorInfo.userMessage = `Content is too large for the selected model.`;
        errorInfo.technicalDetails = {
            ...context,
            estimatedTokens: inputTokens || context?.estimatedTokens,
            modelLimit: maxTokens
        };

        const estimatedTokens = inputTokens || context?.estimatedTokens || 'Unknown';
        const limitText = maxTokens ? ` (limit: ${maxTokens.toLocaleString()})` : '';
        const modelSuggestion = this.PROVIDER_SUGGESTIONS[provider] || this.PROVIDER_SUGGESTIONS.default;

        errorInfo.suggestions = [
            `Current: ~${estimatedTokens} tokens${limitText}`,
            "Solutions:",
            `• Stage fewer files (currently: ${context?.filesChanged || 'multiple'} files)`,
            "• Use 'git add -p' to stage specific chunks",
            "• Commit changes in smaller, logical groups",
            `• Switch to a model with larger context window: ${modelSuggestion}`,
            "• Remove unnecessary whitespace/formatting changes"
        ];

        return errorInfo;
    }

    private static handleRateLimitError(error: Error, errorInfo: ErrorInfo, provider: string): ErrorInfo {
        errorInfo.userMessage = `${provider} rate limit exceeded.`;
        errorInfo.suggestions = [
            "Wait a few minutes before trying again",
            "Check your API usage dashboard",
            "Consider upgrading your plan for higher limits",
            `Current provider: ${provider} - Consider switching to a different provider temporarily`
        ];
        return errorInfo;
    }

    private static handleAuthError(error: Error, errorInfo: ErrorInfo, provider: string): ErrorInfo {
        errorInfo.userMessage = `${provider} API key is invalid or missing.`;
        errorInfo.suggestions = [
            "Check your API key in extension settings",
            "Verify the key has correct permissions",
            "Generate a new API key if needed",
            "Ensure the key is for the correct service/provider"
        ];
        return errorInfo;
    }

    private static handleQuotaError(error: Error, errorInfo: ErrorInfo, provider: string): ErrorInfo {
        errorInfo.userMessage = `${provider} quota exceeded or billing issue.`;
        errorInfo.suggestions = [
            "Check your billing status",
            "Review your usage limits",
            "Consider upgrading your plan",
            "Try a different provider with free tier"
        ];
        return errorInfo;
    }

    private static handleNetworkError(error: Error, errorInfo: ErrorInfo, provider: string): ErrorInfo {
        errorInfo.userMessage = `Network connection issue with ${provider}.`;
        errorInfo.suggestions = [
            "Check your internet connection",
            "Verify firewall/proxy settings",
            "Try again in a few moments",
            "Check if the service is experiencing downtime"
        ];
        return errorInfo;
    }

    private static handleConfigError(error: Error, errorInfo: ErrorInfo, provider: string): ErrorInfo {
        errorInfo.userMessage = `${provider} configuration issue.`;
        errorInfo.suggestions = [
            "Check your provider settings",
            "Verify the model name is correct",
            "Ensure the API endpoint URL is valid",
            "Review the extension settings"
        ];
        return errorInfo;
    }

    private static handleGenericError(error: Error, errorInfo: ErrorInfo, provider: string, context?: any): ErrorInfo {
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
                "Review the debug logs for more details",
                "Verify your API key and permissions",
                "Consider trying a different provider"
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