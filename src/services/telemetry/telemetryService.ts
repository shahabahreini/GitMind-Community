import * as vscode from 'vscode';
import * as appInsights from 'applicationinsights';
import { debugLog } from '../debug/logger';

interface ExtensionInfo {
    version: string;
    vsCodeVersion: string;
    platform: string;
    machineId: string;
    sessionId: string;
}

interface DailyActiveUser {
    userId: string;
    sessionId: string;
    date: string;
    timestamp: string;
}

interface MessageGenerationError {
    userId: string;
    sessionId: string;
    date: string;
    provider: string;
    errorType: string;
    errorMessage: string;
}

class TelemetryService {
    private client: appInsights.TelemetryClient | null = null;
    private isEnabled: boolean = false;
    private extensionInfo: ExtensionInfo;
    private readonly instrumentationKey: string;
    private dailyUserTracked: boolean = false;
    private lastActiveDate: string = '';
    private sessionId: string;
    private persistentUserId: string;

    constructor() {
        // Application Insights connection string for GitMind VSCode Extension
        this.instrumentationKey = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
            'InstrumentationKey=***REMOVED***;IngestionEndpoint=https://canadacentral-1.in.applicationinsights.azure.com/;LiveEndpoint=https://canadacentral.livediagnostics.monitor.azure.com/;ApplicationId=***REMOVED***';

        // Generate a unique session ID for this extension activation
        this.sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create a persistent user ID that survives VS Code restarts
        this.persistentUserId = this.getPersistentUserId();

        this.extensionInfo = {
            version: this.getExtensionVersion(),
            vsCodeVersion: vscode.version,
            platform: process.platform,
            machineId: vscode.env.machineId,
            sessionId: this.sessionId
        };
    }

    public async initialize(context: vscode.ExtensionContext): Promise<void> {
        try {
            // Respect user's telemetry settings
            const config = vscode.workspace.getConfiguration();
            const globalTelemetryLevel = config.get<string>('telemetry.telemetryLevel', 'all');
            const extensionTelemetryEnabled = config.get<boolean>('gitmind.telemetry.enabled', false);
            const customConnectionString = config.get<string>('gitmind.telemetry.connectionString', '');

            this.isEnabled = globalTelemetryLevel !== 'off' && extensionTelemetryEnabled;

            if (!this.isEnabled) {
                debugLog('Telemetry disabled by user settings');
                return;
            }

            // Use custom connection string if provided
            let connectionString = customConnectionString || this.instrumentationKey;

            // Try to get connection string from VS Code secrets if available
            try {
                if (context.secrets) {
                    const secretConnectionString = await context.secrets.get('applicationinsights-key');
                    if (secretConnectionString) {
                        connectionString = secretConnectionString;
                        debugLog('Using connection string from VS Code secrets');
                    }
                }
            } catch (error) {
                debugLog('Secrets API not available, using fallback connection string');
            }

            if (!connectionString || connectionString.includes('YOUR_INSTRUMENTATION_KEY_HERE')) {
                debugLog('Application Insights connection string not configured');
                this.isEnabled = false;
                return;
            }

            // Configure Application Insights with MINIMAL auto-collection
            appInsights.setup(connectionString)
                .setAutoDependencyCorrelation(false)
                .setAutoCollectRequests(false)
                .setAutoCollectPerformance(false, false)
                .setAutoCollectExceptions(false) // DISABLED: No auto exception collection
                .setAutoCollectDependencies(false)
                .setAutoCollectConsole(false)
                .setUseDiskRetryCaching(true)
                .setSendLiveMetrics(false)
                .start();

            this.client = appInsights.defaultClient;

            // Set minimal common properties
            this.client.commonProperties = {
                'extension.name': 'gitmind',
                'extension.version': this.extensionInfo.version,
                'user.id': this.persistentUserId,
                'session.id': this.sessionId
            };

            debugLog('Minimal telemetry initialized successfully');
            // Track extension activation immediately
            this.trackExtensionActivation();

        } catch (error) {
            debugLog('Failed to initialize telemetry:', error);
            this.isEnabled = false;
        }
    }

    /**
     * Get or create a persistent user ID that survives VS Code restarts
     */
    private getPersistentUserId(): string {
        // Use machineId + sessionId as fallback if no storage
        return `${vscode.env.machineId}-${vscode.env.sessionId || 'default'}`;
    }

    /**
     * Track extension activation - this happens every time the extension starts
     */
    private trackExtensionActivation(): void {
        if (!this.isEnabled || !this.client || !this.isTelemetryCurrentlyEnabled()) {
            return;
        }

        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            this.client.trackEvent({
                name: 'gitmind.extension_activation',
                properties: {
                    'user_id': this.persistentUserId,
                    'session_id': this.sessionId,
                    'date': today,
                    'timestamp': now.toISOString(),
                    'extension_version': this.extensionInfo.version,
                    'vscode_version': this.extensionInfo.vsCodeVersion,
                    'platform': this.extensionInfo.platform
                }
            });

            debugLog('Extension activation tracked');
        } catch (error) {
            debugLog('Failed to track extension activation:', error);
        }
    }

    private isTelemetryCurrentlyEnabled(): boolean {
        if (!this.client) {
            return false;
        }

        try {
            const config = vscode.workspace.getConfiguration();
            const globalTelemetryLevel = config.get<string>('telemetry.telemetryLevel', 'all');
            const extensionTelemetryEnabled = config.get<boolean>('gitmind.telemetry.enabled', false);

            return globalTelemetryLevel !== 'off' && extensionTelemetryEnabled;
        } catch {
            return false;
        }
    }

    /**
     * Track daily active users - ONLY metric for user activity
     * This should be called whenever user interacts with the extension
     */
    public trackDailyActiveUser(): void {
        if (!this.isEnabled || !this.client || !this.isTelemetryCurrentlyEnabled()) {
            return;
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Only track once per day per user session
        if (this.dailyUserTracked && this.lastActiveDate === today) {
            return;
        }

        try {
            const userEvent: DailyActiveUser = {
                userId: this.persistentUserId,
                sessionId: this.sessionId,
                date: today,
                timestamp: now.toISOString()
            };

            this.client.trackEvent({
                name: 'gitmind.daily_active_user',
                properties: {
                    'user_id': userEvent.userId,
                    'session_id': userEvent.sessionId,
                    'date': userEvent.date,
                    'timestamp': userEvent.timestamp,
                    'extension_version': this.extensionInfo.version
                }
            });

            this.dailyUserTracked = true;
            this.lastActiveDate = today;
            debugLog('Daily active user tracked');
        } catch (error) {
            debugLog('Failed to track daily active user:', error);
        }
    }

    /**
     * Track ONLY message generation failures - NOT successes
     */
    public trackMessageGenerationFailure(provider: string, errorMessage: string): void {
        if (!this.isEnabled || !this.client || !this.isTelemetryCurrentlyEnabled()) {
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];

            // Categorize error types
            let errorType = 'unknown_error';
            if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
                errorType = 'authentication_error';
            } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
                errorType = 'rate_limit_error';
            } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
                errorType = 'network_error';
            } else if (errorMessage.includes('timeout')) {
                errorType = 'timeout_error';
            } else if (errorMessage.includes('too large') || errorMessage.includes('tokens')) {
                errorType = 'token_limit_error';
            }

            const errorEvent: MessageGenerationError = {
                userId: this.persistentUserId,
                sessionId: this.sessionId,
                date: today,
                provider: provider,
                errorType: errorType,
                errorMessage: errorMessage.substring(0, 200) // Limit message length
            };

            this.client.trackEvent({
                name: 'gitmind.message_generation_failure',
                properties: {
                    'user_id': errorEvent.userId,
                    'session_id': errorEvent.sessionId,
                    'date': errorEvent.date,
                    'provider': provider,
                    'error_type': errorType,
                    'error_message': errorEvent.errorMessage
                }
            });

            debugLog(`Message generation failure tracked: ${errorType} with ${provider}`);
        } catch (error) {
            debugLog('Failed to track message generation failure:', error);
        }
    }

    // Legacy methods - now do nothing to eliminate noise
    public trackCommitGeneration(provider: string, success: boolean, errorMessage?: string): void {
        // Only track failures, ignore successes to reduce noise
        if (!success && errorMessage) {
            this.trackMessageGenerationFailure(provider, errorMessage);
        }
    }

    public trackExtensionError(errorType: string, errorMessage: string, context: string): void {
        // Only track if it's related to message generation
        if (context.includes('generateCommit') || context.includes('api')) {
            // Extract provider from context if possible
            const provider = this.extractProviderFromContext(context, errorMessage);
            this.trackMessageGenerationFailure(provider, errorMessage);
        }
        // Ignore all other extension errors to reduce noise
    }

    public trackException(error: Error, context?: string): void {
        // Only track if it's related to message generation
        if (context?.includes('generateCommit') || context?.includes('api')) {
            const provider = this.extractProviderFromContext(context, error.message);
            this.trackMessageGenerationFailure(provider, error.message);
        }
        // Ignore all other exceptions to reduce noise
    }

    private extractProviderFromContext(context: string, errorMessage: string): string {
        // Try to extract provider from context or error message
        const providers = ['openai', 'anthropic', 'gemini', 'cohere', 'ollama', 'huggingface', 'mistral', 'grok', 'deepseek', 'perplexity', 'together', 'openrouter', 'copilot'];

        for (const provider of providers) {
            if (context.toLowerCase().includes(provider) || errorMessage.toLowerCase().includes(provider)) {
                return provider;
            }
        }

        return 'unknown';
    }

    public flush(): void {
        if (this.client) {
            this.client.flush();
        }
    }

    private getExtensionVersion(): string {
        try {
            const extension = vscode.extensions.getExtension('ShahabBahreiniJangjoo.gitmind');
            return extension?.packageJSON.version || 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    public isReady(): boolean {
        return this.isEnabled && this.client !== null;
    }

    public getUserOptIn(): boolean {
        return this.isEnabled;
    }
}

// Export singleton instance
export const telemetryService = new TelemetryService();
