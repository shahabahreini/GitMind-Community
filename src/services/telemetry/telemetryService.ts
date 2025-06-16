import * as vscode from 'vscode';
import * as appInsights from 'applicationinsights';
import { debugLog } from '../debug/logger';

interface TelemetryProperties {
    [key: string]: string;
}

interface TelemetryMeasurements {
    [key: string]: number;
}

interface ExtensionInfo {
    version: string;
    vsCodeVersion: string;
    platform: string;
    machineId: string;
}

interface DailyActiveUser {
    userId: string;
    date: string;
    sessionId: string;
}

interface CommitGeneration {
    userId: string;
    date: string;
    success: boolean;
    provider: string;
}

interface ExtensionError {
    userId: string;
    date: string;
    errorType: string;
    errorMessage: string;
    context: string;
}

class TelemetryService {
    private client: appInsights.TelemetryClient | null = null;
    private isEnabled: boolean = false;
    private extensionInfo: ExtensionInfo;
    private readonly instrumentationKey: string;
    private dailyUserTracked: boolean = false;
    private lastActiveDate: string = '';

    constructor() {
        // Application Insights connection string for GitMind VSCode Extension
        // Production deployment with Azure Canada Central
        this.instrumentationKey = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
            'InstrumentationKey=d65ed410-ce22-4010-8e4d-075016e2f9b3;IngestionEndpoint=https://canadacentral-1.in.applicationinsights.azure.com/;LiveEndpoint=https://canadacentral.livediagnostics.monitor.azure.com/';

        this.extensionInfo = {
            version: this.getExtensionVersion(),
            vsCodeVersion: vscode.version,
            platform: process.platform,
            machineId: vscode.env.machineId
        };

        // Track daily active user on startup
        this.trackDailyActiveUser();
    }

    public async initialize(context: vscode.ExtensionContext): Promise<void> {
        try {
            // Respect user's telemetry settings - check both VS Code global and extension-specific settings
            const config = vscode.workspace.getConfiguration();
            const globalTelemetryLevel = config.get<string>('telemetry.telemetryLevel', 'all');
            const extensionTelemetryEnabled = config.get<boolean>('aiCommitAssistant.telemetry.enabled', true);

            // Telemetry is enabled only if both global VS Code setting allows it AND extension setting is enabled
            this.isEnabled = globalTelemetryLevel !== 'off' && extensionTelemetryEnabled;

            if (!this.isEnabled) {
                if (globalTelemetryLevel === 'off') {
                    debugLog('Telemetry disabled by VS Code global settings');
                } else if (!extensionTelemetryEnabled) {
                    debugLog('Telemetry disabled by GitMind extension settings');
                }
                return;
            }

            // Try to get instrumentation key from secrets first
            let instrumentationKey = await context.secrets.get('applicationinsights-key');
            if (!instrumentationKey) {
                instrumentationKey = this.instrumentationKey;
            }

            if (!instrumentationKey || instrumentationKey.includes('YOUR_INSTRUMENTATION_KEY_HERE')) {
                debugLog('Application Insights instrumentation key not configured');
                this.isEnabled = false;
                return;
            }

            // Configure Application Insights
            appInsights.setup(instrumentationKey)
                .setAutoDependencyCorrelation(false)
                .setAutoCollectRequests(false)
                .setAutoCollectPerformance(false, false)
                .setAutoCollectExceptions(true)
                .setAutoCollectDependencies(false)
                .setAutoCollectConsole(false)
                .setUseDiskRetryCaching(true)
                .setSendLiveMetrics(false)
                .start();

            this.client = appInsights.defaultClient;

            // Set common properties for all telemetry
            this.client.commonProperties = {
                'extension.name': 'ai-commit-assistant',
                'extension.version': this.extensionInfo.version,
                'vscode.version': this.extensionInfo.vsCodeVersion,
                'os.platform': this.extensionInfo.platform,
                'user.id': this.extensionInfo.machineId,
                'session.id': context.globalState.get('telemetry.sessionId', this.generateSessionId())
            };

            // Store session ID for this session
            await context.globalState.update('telemetry.sessionId', this.client.commonProperties['session.id']);

            debugLog('Application Insights telemetry initialized successfully');
            this.trackDailyActiveUser();

        } catch (error) {
            debugLog('Failed to initialize telemetry:', error);
            this.isEnabled = false;
        }
    }

    private isTelemetryCurrentlyEnabled(): boolean {
        if (!this.client) {
            return false;
        }

        try {
            const config = vscode.workspace.getConfiguration();
            const globalTelemetryLevel = config.get<string>('telemetry.telemetryLevel', 'all');
            const extensionTelemetryEnabled = config.get<boolean>('aiCommitAssistant.telemetry.enabled', true);

            return globalTelemetryLevel !== 'off' && extensionTelemetryEnabled;
        } catch {
            return false;
        }

    }

    /**
     * Track daily active users - Core Metric #1
     * Records unique users who use the extension each day
     */
    public trackDailyActiveUser(): void {
        if (!this.isEnabled || !this.client || !this.isTelemetryCurrentlyEnabled()) {
            return;
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

        // Only track once per day per user
        if (this.dailyUserTracked && this.lastActiveDate === today) {
            return;
        }

        try {
            const userEvent: DailyActiveUser = {
                userId: this.extensionInfo.machineId,
                date: today,
                sessionId: this.generateSessionId()
            };

            this.client.trackEvent({
                name: 'gitmind.daily_active_user',
                properties: {
                    'user_id': userEvent.userId,
                    'date': userEvent.date,
                    'session_id': userEvent.sessionId,
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
     * Track commit generation - Core Metric #2
     * Records when users generate commits and success rate
     */
    public trackCommitGeneration(provider: string, success: boolean, errorMessage?: string): void {
        if (!this.isEnabled || !this.client || !this.isTelemetryCurrentlyEnabled()) {
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];

            const commitEvent: CommitGeneration = {
                userId: this.extensionInfo.machineId,
                date: today,
                success: success,
                provider: provider
            };

            this.client.trackEvent({
                name: 'gitmind.commit_generated',
                properties: {
                    'user_id': commitEvent.userId,
                    'date': commitEvent.date,
                    'success': success.toString(),
                    'provider': provider,
                    'error_message': errorMessage || 'none'
                },
                measurements: {
                    'commits_count': 1
                }
            });

            debugLog(`Commit generation tracked: ${success ? 'success' : 'failed'} with ${provider}`);
        } catch (error) {
            debugLog('Failed to track commit generation:', error);
        }
    }

    /**
     * Track extension errors - Core Metric #3
     * Records errors users encounter while using the extension
     */
    public trackExtensionError(errorType: string, errorMessage: string, context: string): void {
        if (!this.isEnabled || !this.client || !this.isTelemetryCurrentlyEnabled()) {
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];

            const errorEvent: ExtensionError = {
                userId: this.extensionInfo.machineId,
                date: today,
                errorType: errorType,
                errorMessage: errorMessage,
                context: context
            };

            this.client.trackEvent({
                name: 'gitmind.extension_error',
                properties: {
                    'user_id': errorEvent.userId,
                    'date': errorEvent.date,
                    'error_type': errorType,
                    'error_message': errorMessage,
                    'context': context,
                    'extension_version': this.extensionInfo.version
                },
                measurements: {
                    'error_count': 1
                }
            });

            debugLog(`Extension error tracked: ${errorType} in ${context}`);
        } catch (error) {
            debugLog('Failed to track extension error:', error);
        }
    }

    /**
     * Legacy method for exception tracking - redirects to trackExtensionError
     */
    public trackException(error: Error, context?: string): void {
        this.trackExtensionError(
            error.name || 'UnknownError',
            error.message || 'No error message',
            context || 'general'
        );
    }

    public flush(): void {
        if (this.client) {
            this.client.flush();
        }
    }

    private getExtensionVersion(): string {
        try {
            const extension = vscode.extensions.getExtension('ShahabBahreiniJangjoo.ai-commit-assistant');
            return extension?.packageJSON.version || 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }

    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
