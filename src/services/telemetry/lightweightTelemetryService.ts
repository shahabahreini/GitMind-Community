import * as vscode from 'vscode';
import * as https from 'https';
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

/**
 * Lightweight telemetry service that sends data directly to Application Insights
 * without the heavy applicationinsights SDK
 */
class LightweightTelemetryService {
    private isEnabled: boolean = false;
    private extensionInfo: ExtensionInfo;
    private readonly instrumentationKey: string;
    private readonly ingestionEndpoint: string;
    private dailyUserTracked: boolean = false;
    private lastActiveDate: string = '';
    private sessionId: string;
    private persistentUserId: string;

    constructor() {
        // Extract connection string components
        const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
            'InstrumentationKey=***REMOVED***;IngestionEndpoint=https://canadacentral-1.in.applicationinsights.azure.com/;LiveEndpoint=https://canadacentral.livediagnostics.monitor.azure.com/;ApplicationId=***REMOVED***';

        // Parse connection string
        const parts = connectionString.split(';');
        this.instrumentationKey = parts.find(p => p.startsWith('InstrumentationKey='))?.split('=')[1] || '';
        this.ingestionEndpoint = parts.find(p => p.startsWith('IngestionEndpoint='))?.split('=')[1] || '';

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

            this.isEnabled = globalTelemetryLevel !== 'off' && extensionTelemetryEnabled;

            if (!this.isEnabled) {
                debugLog('Telemetry disabled by user settings');
                return;
            }

            if (!this.instrumentationKey || !this.ingestionEndpoint) {
                debugLog('Application Insights connection string not configured properly');
                this.isEnabled = false;
                return;
            }

            debugLog('Lightweight telemetry initialized successfully');
            // Track extension activation immediately
            this.trackExtensionActivation();

        } catch (error) {
            debugLog('Failed to initialize telemetry:', error);
            this.isEnabled = false;
        }
    }

    private getPersistentUserId(): string {
        return `${vscode.env.machineId}-${vscode.env.sessionId || 'default'}`;
    }

    private async sendTelemetryEvent(eventName: string, properties: Record<string, string>): Promise<void> {
        if (!this.isEnabled || !this.instrumentationKey || !this.ingestionEndpoint) {
            return;
        }

        try {
            const event = {
                name: "Microsoft.ApplicationInsights.Event",
                time: new Date().toISOString(),
                iKey: this.instrumentationKey,
                tags: {
                    "ai.internal.sdkVersion": "gitmind-lightweight:1.0.0"
                },
                data: {
                    baseType: "EventData",
                    baseData: {
                        ver: 2,
                        name: eventName,
                        properties: {
                            ...properties,
                            'extension.name': 'gitmind',
                            'extension.version': this.extensionInfo.version,
                            'user.id': this.persistentUserId,
                            'session.id': this.sessionId
                        }
                    }
                }
            };

            const postData = JSON.stringify(event);
            const url = new URL(`${this.ingestionEndpoint}/v2/track`);

            const options = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                if (res.statusCode !== 200) {
                    debugLog(`Telemetry send failed with status: ${res.statusCode}`);
                }
            });

            req.on('error', (error) => {
                debugLog('Telemetry send error:', error);
            });

            req.write(postData);
            req.end();

        } catch (error) {
            debugLog('Failed to send telemetry event:', error);
        }
    }

    private trackExtensionActivation(): void {
        if (!this.isEnabled) {
            return;
        }

        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            this.sendTelemetryEvent('gitmind.extension_activation', {
                'user_id': this.persistentUserId,
                'session_id': this.sessionId,
                'date': today,
                'timestamp': now.toISOString(),
                'extension_version': this.extensionInfo.version,
                'vscode_version': this.extensionInfo.vsCodeVersion,
                'platform': this.extensionInfo.platform
            });

            debugLog('Extension activation tracked');
        } catch (error) {
            debugLog('Failed to track extension activation:', error);
        }
    }

    private isTelemetryCurrentlyEnabled(): boolean {
        try {
            const config = vscode.workspace.getConfiguration();
            const globalTelemetryLevel = config.get<string>('telemetry.telemetryLevel', 'all');
            const extensionTelemetryEnabled = config.get<boolean>('gitmind.telemetry.enabled', false);

            return globalTelemetryLevel !== 'off' && extensionTelemetryEnabled;
        } catch {
            return false;
        }
    }

    public trackDailyActiveUser(): void {
        if (!this.isEnabled || !this.isTelemetryCurrentlyEnabled()) {
            return;
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Only track once per day per user session
        if (this.dailyUserTracked && this.lastActiveDate === today) {
            return;
        }

        try {
            this.sendTelemetryEvent('gitmind.daily_active_user', {
                'user_id': this.persistentUserId,
                'session_id': this.sessionId,
                'date': today,
                'timestamp': now.toISOString(),
                'extension_version': this.extensionInfo.version
            });

            this.dailyUserTracked = true;
            this.lastActiveDate = today;
            debugLog('Daily active user tracked');
        } catch (error) {
            debugLog('Failed to track daily active user:', error);
        }
    }

    public trackMessageGenerationFailure(provider: string, errorMessage: string): void {
        if (!this.isEnabled || !this.isTelemetryCurrentlyEnabled()) {
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

            this.sendTelemetryEvent('gitmind.message_generation_failure', {
                'user_id': this.persistentUserId,
                'session_id': this.sessionId,
                'date': today,
                'provider': provider,
                'error_type': errorType,
                'error_message': errorMessage.substring(0, 200)
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
        const providers = ['openai', 'anthropic', 'gemini', 'cohere', 'ollama', 'huggingface', 'mistral', 'grok', 'deepseek', 'perplexity', 'together', 'openrouter', 'copilot'];

        for (const provider of providers) {
            if (context.toLowerCase().includes(provider) || errorMessage.toLowerCase().includes(provider)) {
                return provider;
            }
        }

        return 'unknown';
    }

    public flush(): void {
        // No-op for lightweight implementation - events are sent immediately
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
        return this.isEnabled;
    }

    public getUserOptIn(): boolean {
        return this.isEnabled;
    }
}

// Export singleton instance
export const telemetryService = new LightweightTelemetryService();
