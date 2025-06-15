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

export class APIErrorHandler {
    /**
     * Analyzes and formats API errors into user-friendly messages
     */
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

        // Extract status code if present
        const statusMatch = error.message.match(/(\d{3})/);
        if (statusMatch) {
            errorInfo.statusCode = parseInt(statusMatch[1]);
        }

        // Handle specific error patterns with enhanced detection
        if (this.isTokenLimitError(error.message)) {
            return this.handleTokenLimitError(error, errorInfo, context);
        } else if (this.isRateLimitError(error.message)) {
            return this.handleRateLimitError(error, errorInfo, provider);
        } else if (this.isAuthError(error.message)) {
            return this.handleAuthError(error, errorInfo, provider);
        } else if (this.isQuotaError(error.message)) {
            return this.handleQuotaError(error, errorInfo, provider);
        } else if (this.isNetworkError(error.message)) {
            return this.handleNetworkError(error, errorInfo, provider);
        } else if (this.isConfigError(error.message)) {
            return this.handleConfigError(error, errorInfo, provider);
        } else {
            // Generic error handling with context
            return this.handleGenericError(error, errorInfo, provider, context);
        }
    }

    private static isTokenLimitError(message: string): boolean {
        return message.includes("token") && (
            message.includes("exceed") ||
            message.includes("too large") ||
            message.includes("context_length") ||
            message.includes("max_tokens") ||
            message.includes("Input validation error")
        );
    }

    private static isRateLimitError(message: string): boolean {
        return message.includes("rate limit") ||
            message.includes("429") ||
            message.includes("too many requests");
    }

    private static isAuthError(message: string): boolean {
        return message.includes("API key") ||
            message.includes("401") ||
            message.includes("unauthorized") ||
            message.includes("invalid key") ||
            message.includes("authentication");
    }

    private static isQuotaError(message: string): boolean {
        return message.includes("quota") ||
            message.includes("billing") ||
            message.includes("insufficient_quota") ||
            message.includes("payment");
    }

    private static isNetworkError(message: string): boolean {
        return message.includes("network") ||
            message.includes("timeout") ||
            message.includes("connection") ||
            message.includes("ECONNREFUSED") ||
            message.includes("ETIMEDOUT") ||
            message.includes("fetch failed");
    }

    private static isConfigError(message: string): boolean {
        return message.includes("configuration") ||
            message.includes("not configured") ||
            message.includes("missing") ||
            message.includes("invalid request");
    }

    private static handleTokenLimitError(error: Error, errorInfo: ErrorInfo, context?: any): ErrorInfo {
        const tokenMatch = error.message.match(/(\d+)/g);
        let inputTokens = 0;
        let maxTokens = 0;

        if (tokenMatch && tokenMatch.length >= 2) {
            inputTokens = parseInt(tokenMatch[0]);
            maxTokens = parseInt(tokenMatch[1]);
        }

        errorInfo.userMessage = `Content is too large for the selected model.`;
        errorInfo.technicalDetails = {
            ...context,
            estimatedTokens: inputTokens || context?.estimatedTokens,
            modelLimit: maxTokens
        };

        errorInfo.suggestions = [
            `Current: ~${inputTokens || context?.estimatedTokens || 'Unknown'} tokens${maxTokens ? ` (limit: ${maxTokens.toLocaleString()})` : ''}`,
            "Solutions:",
            `• Stage fewer files (currently: ${context?.filesChanged || 'multiple'} files)`,
            "• Use 'git add -p' to stage specific chunks",
            "• Commit changes in smaller, logical groups",
            "• Switch to a model with larger context window:",
            `  - ${errorInfo.provider === 'Together AI' ? 'Try meta-llama/Llama-3.3-70B-Instruct-Turbo (128k)' : 'Check available models with larger limits'}`,
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
        // Try to extract useful information from the error message
        if (error.message.includes("service") || error.message.includes("502") || error.message.includes("503")) {
            errorInfo.userMessage = `${provider} service is temporarily unavailable.`;
            errorInfo.suggestions = [
                "The service may be experiencing issues",
                "Try again in a few minutes",
                "Check the service status page",
                "Consider using a different provider temporarily"
            ];
        } else if (error.message.includes("model") && error.message.includes("not found")) {
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

    /**
     * Formats error information for display to users with enhanced details
     */
    static formatUserMessage(errorInfo: ErrorInfo): string {
        let message = `${errorInfo.provider}: ${errorInfo.userMessage}`;

        // Add technical details if available
        if (errorInfo.technicalDetails) {
            const details = errorInfo.technicalDetails;
            if (details.diffSize || details.estimatedTokens) {
                message += "\n\nTechnical Details:";
                if (details.diffSize) {
                    message += `\n• Diff size: ${this.formatBytes(details.diffSize)}`;
                }
                if (details.estimatedTokens) {
                    message += `\n• Estimated tokens: ${details.estimatedTokens.toLocaleString()}`;
                }
                if (details.modelLimit) {
                    message += `\n• Model limit: ${details.modelLimit.toLocaleString()} tokens`;
                }
                if (details.filesChanged) {
                    message += `\n• Files changed: ${details.filesChanged}`;
                }
            }
        }

        if (errorInfo.suggestions && errorInfo.suggestions.length > 0) {
            message += "\n\n" + errorInfo.suggestions.join("\n");
        }

        return message;
    }

    /**
     * Helper function to format bytes in human-readable format
     */
    private static formatBytes(bytes: number): string {
        if (bytes === 0) { return '0 B'; }
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Estimates the severity of the error for UI display
     */
    static getErrorSeverity(errorInfo: ErrorInfo): 'error' | 'warning' | 'info' {
        if (errorInfo.statusCode) {
            if (errorInfo.statusCode >= 500) { return 'error'; }
            if (errorInfo.statusCode === 429 || errorInfo.statusCode === 422) { return 'warning'; }
            if (errorInfo.statusCode >= 400) { return 'error'; }
        }
        return 'error';
    }

    /**
     * Determines if an error should trigger a retry attempt
     */
    static shouldRetryError(error: Error): boolean {
        const message = error.message.toLowerCase();

        // Transient errors that should be retried
        const retryablePatterns = [
            'timeout',
            'temporarily',
            'rate limit',
            'overloaded',
            'service unavailable',
            'network'
        ];

        return retryablePatterns.some(pattern => message.includes(pattern));
    }

    /**
     * Determines if an error is fatal and should not be retried
     */
    static isFatalError(error: Error): boolean {
        const message = error.message.toLowerCase();

        // Fatal errors that should not be retried
        const fatalPatterns = [
            'invalid',
            'not found',
            'suspended',
            'billing',
            'unauthorized',
            'forbidden'
        ];

        return fatalPatterns.some(pattern => message.includes(pattern));
    }
}
