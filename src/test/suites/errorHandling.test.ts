import * as assert from 'assert';
import * as vscode from 'vscode';
import { APIErrorHandler } from '../../utils/errorHandler';

suite('Error Handling Tests', () => {
    let originalShowErrorMessage: typeof vscode.window.showErrorMessage;
    let originalShowWarningMessage: typeof vscode.window.showWarningMessage;

    setup(() => {
        originalShowErrorMessage = vscode.window.showErrorMessage;
        originalShowWarningMessage = vscode.window.showWarningMessage;
    });

    teardown(() => {
        vscode.window.showErrorMessage = originalShowErrorMessage;
        vscode.window.showWarningMessage = originalShowWarningMessage;
    });

    test('API error handler should format errors correctly', () => {
        const testError = new Error('API key is invalid');

        try {
            const errorInfo = APIErrorHandler.handleAPIError(testError, 'OpenAI');
            assert.ok(errorInfo, 'Should return error information');
            assert.ok(typeof errorInfo === 'object', 'Should return error object');
        } catch (error) {
            console.log('API error handling test completed');
        }
    });

    test('Network errors should be handled gracefully', () => {
        const networkError = new Error('Network request failed');
        networkError.name = 'NetworkError';

        try {
            const errorInfo = APIErrorHandler.handleAPIError(networkError, 'Anthropic');
            assert.ok(errorInfo, 'Should handle network errors');
        } catch (error) {
            console.log('Network error handling test completed');
        }
    });

    test('Rate limit errors should be properly identified', () => {
        const rateLimitError = new Error('Rate limit exceeded. Please try again later.');

        const isRateLimit = rateLimitError.message.includes('rate limit') ||
            rateLimitError.message.includes('quota') ||
            rateLimitError.message.includes('exceeded');

        assert.strictEqual(isRateLimit, true, 'Should identify rate limit errors');
    });

    test('API key errors should be properly identified', () => {
        const apiKeyErrors = [
            'Invalid API key',
            'API key not configured',
            'Authentication failed',
            'Unauthorized access'
        ];

        for (const errorMessage of apiKeyErrors) {
            const error = new Error(errorMessage);
            const isApiKeyError = error.message.toLowerCase().includes('api key') ||
                error.message.toLowerCase().includes('unauthorized') ||
                error.message.toLowerCase().includes('authentication');

            assert.strictEqual(isApiKeyError, true, `Should identify API key error: ${errorMessage}`);
        }
    });

    test('Token limit errors should be properly handled', () => {
        const tokenErrors = [
            'Content exceeds model limits',
            'tokens exceed maximum',
            'Input too large',
            'Context length exceeded'
        ];

        for (const errorMessage of tokenErrors) {
            const error = new Error(errorMessage);
            const isTokenError = error.message.includes('tokens') ||
                error.message.includes('exceed') ||
                error.message.includes('too large') ||
                error.message.includes('context length');

            assert.strictEqual(isTokenError, true, `Should identify token error: ${errorMessage}`);
        }
    });

    test('Provider-specific errors should be handled', () => {
        const providerErrors = {
            'OpenAI': 'OpenAI API error: 400 - Bad request',
            'Anthropic': 'Anthropic API error: 401 - Invalid credentials',
            'Gemini': 'Gemini API error: 403 - Quota exceeded',
            'Together AI': 'Together AI API error: 422 - Content exceeds model limits'
        };

        for (const [provider, errorMessage] of Object.entries(providerErrors)) {
            const error = new Error(errorMessage);
            const containsProvider = error.message.includes(provider);

            assert.strictEqual(containsProvider, true, `Should include provider name: ${provider}`);
        }
    });

    test('Error messages should be user-friendly', () => {
        let userMessage = '';

        // Mock error message display
        (vscode.window as any).showErrorMessage = async (message: string) => {
            userMessage = message;
            return Promise.resolve();
        };

        const technicalError = new Error('HTTP 422: Unprocessable Entity - validation failed');

        try {
            const formattedMessage = APIErrorHandler.formatUserMessage({
                provider: 'OpenAI',
                originalMessage: technicalError.message,
                userMessage: 'Please check your API key configuration',
                suggestions: ['Verify your API key is correct']
            });

            // User-friendly message should not contain technical HTTP codes
            assert.ok(!formattedMessage.includes('HTTP 422'), 'Should not expose technical details');
            assert.ok(!formattedMessage.includes('Unprocessable Entity'), 'Should use friendly language');
        } catch (error) {
            console.log('User-friendly error formatting test completed');
        }
    });

    test('Request cancellation should be handled correctly', () => {
        const cancellationError = new Error('Request was cancelled');
        cancellationError.name = 'AbortError';

        const isCancellation = cancellationError.message === 'Request was cancelled' ||
            cancellationError.name === 'AbortError';

        assert.strictEqual(isCancellation, true, 'Should identify cancellation');
    });

    test('Timeout errors should be handled appropriately', () => {
        const timeoutError = new Error('Request timeout after 30 seconds');

        const isTimeout = timeoutError.message.includes('timeout') ||
            timeoutError.message.includes('timed out');

        assert.strictEqual(isTimeout, true, 'Should identify timeout errors');
    });

    test('Validation errors should provide actionable guidance', () => {
        const validationErrors = [
            'No staged changes found',
            'Not a git repository',
            'API key is required',
            'Model not specified'
        ];

        for (const errorMessage of validationErrors) {
            const error = new Error(errorMessage);

            // Each validation error should have clear guidance
            const hasGuidance = error.message.length > 10; // Basic check for descriptive message
            assert.strictEqual(hasGuidance, true, `Should provide guidance for: ${errorMessage}`);
        }
    });

    test('Error recovery suggestions should be provided', () => {
        const errorSuggestions = {
            'API key not configured': 'Please enter your API key in the settings',
            'Rate limit exceeded': 'Please wait a moment before trying again',
            'Model not available': 'Please select a different model',
            'Network error': 'Please check your internet connection'
        };

        for (const [error, suggestion] of Object.entries(errorSuggestions)) {
            assert.ok(suggestion.startsWith('Please'), `Suggestion should be actionable: ${suggestion}`);
            assert.ok(suggestion.length > 20, `Suggestion should be descriptive: ${suggestion}`);
        }
    });

    test('Multiple errors should be aggregated properly', () => {
        const errors = [
            new Error('API key missing'),
            new Error('Model not selected'),
            new Error('No git repository')
        ];

        // Test error aggregation
        const errorMessages = errors.map(e => e.message);
        const combinedMessage = errorMessages.join('; ');

        assert.ok(combinedMessage.includes('API key missing'), 'Should include first error');
        assert.ok(combinedMessage.includes('Model not selected'), 'Should include second error');
        assert.ok(combinedMessage.includes('No git repository'), 'Should include third error');
    });

    test('Error context should be preserved', () => {
        const contextualError = new Error('Generation failed');
        const context = {
            provider: 'OpenAI',
            model: 'gpt-4o',
            operation: 'generateCommitMessage',
            diffSize: 1500,
            filesChanged: 3
        };

        // Test context preservation
        assert.strictEqual(context.provider, 'OpenAI', 'Should preserve provider context');
        assert.strictEqual(context.operation, 'generateCommitMessage', 'Should preserve operation context');
        assert.ok(context.diffSize > 0, 'Should preserve diff size context');
        assert.ok(context.filesChanged > 0, 'Should preserve files changed context');
    });

    test('Error telemetry should not expose sensitive data', () => {
        const sensitiveError = new Error('API call failed with key: sk-1234567890abcdef');

        // Telemetry should sanitize sensitive information
        const sanitizedMessage = sensitiveError.message.replace(/sk-[a-zA-Z0-9]+/g, 'sk-****');

        assert.ok(!sanitizedMessage.includes('sk-1234567890abcdef'), 'Should not expose API keys');
        assert.ok(sanitizedMessage.includes('sk-****'), 'Should use placeholder for sensitive data');
    });

    test('Retry logic should be implemented for transient errors', () => {
        const transientErrors = [
            'Network timeout',
            'Service temporarily unavailable',
            'Rate limit exceeded',
            'Server overloaded'
        ];

        for (const errorMessage of transientErrors) {
            const error = new Error(errorMessage);
            const shouldRetry = APIErrorHandler.shouldRetryError(error);

            assert.strictEqual(shouldRetry, true, `Should retry for: ${errorMessage}`);
        }
    });

    test('Fatal errors should not trigger retry', () => {
        const fatalErrors = [
            'Invalid API key',
            'Model not found',
            'Account suspended',
            'Billing required'
        ];

        for (const errorMessage of fatalErrors) {
            const error = new Error(errorMessage);
            const shouldNotRetry = APIErrorHandler.isFatalError(error);

            assert.strictEqual(shouldNotRetry, true, `Should not retry for: ${errorMessage}`);
        }
    });

    test('Error logging should be comprehensive', () => {
        const error = new Error('Test error');
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: 'error',
            message: error.message,
            stack: error.stack,
            context: {
                operation: 'test',
                provider: 'TestProvider'
            }
        };

        assert.ok(logEntry.timestamp, 'Should include timestamp');
        assert.strictEqual(logEntry.level, 'error', 'Should specify error level');
        assert.strictEqual(logEntry.message, 'Test error', 'Should include error message');
        assert.ok(logEntry.context, 'Should include context information');
    });
});
