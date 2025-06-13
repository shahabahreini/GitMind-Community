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

class TelemetryService {
    private client: appInsights.TelemetryClient | null = null;
    private isEnabled: boolean = false;
    private extensionInfo: ExtensionInfo;
    private readonly instrumentationKey: string;

    constructor() {
        // Store instrumentation key securely - replace with your actual key
        this.instrumentationKey = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
            'InstrumentationKey=YOUR_INSTRUMENTATION_KEY_HERE';

        this.extensionInfo = {
            version: this.getExtensionVersion(),
            vsCodeVersion: vscode.version,
            platform: process.platform,
            machineId: vscode.env.machineId
        };
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
            this.trackEvent('extension.telemetry.initialized');

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

    public trackEvent(eventName: string, properties?: TelemetryProperties, measurements?: TelemetryMeasurements): void {
        if (!this.isEnabled || !this.client || !this.isTelemetryCurrentlyEnabled()) {
            return;
        }

        try {
            const eventProperties = {
                ...properties,
                'timestamp': new Date().toISOString()
            };

            this.client.trackEvent({
                name: `gitmind.${eventName}`,
                properties: eventProperties,
                measurements: measurements
            });

            debugLog(`Telemetry event tracked: ${eventName}`, { properties: eventProperties, measurements });
        } catch (error) {
            debugLog('Failed to track telemetry event:', error);
        }
    }

    public trackCommitGeneration(provider: string, success: boolean, duration: number, tokenCount?: number, errorType?: string): void {
        const properties: TelemetryProperties = {
            'provider': provider,
            'success': success.toString(),
            'error.type': errorType || 'none'
        };

        const measurements: TelemetryMeasurements = {
            'duration.ms': duration,
            'token.count': tokenCount || 0
        };

        this.trackEvent('commit.generated', properties, measurements);
    }

    public trackProviderUsage(provider: string, model: string, success: boolean): void {
        this.trackEvent('provider.used', {
            'provider': provider,
            'model': model,
            'success': success.toString()
        });
    }

    public trackSettingsChanged(setting: string, oldValue: string, newValue: string): void {
        this.trackEvent('settings.changed', {
            'setting': setting,
            'old.value': oldValue,
            'new.value': newValue
        });
    }

    public trackAPIValidation(provider: string, success: boolean, responseTime?: number): void {
        const measurements: TelemetryMeasurements = {};
        if (responseTime !== undefined) {
            measurements['response.time.ms'] = responseTime;
        }

        this.trackEvent('api.validation', {
            'provider': provider,
            'success': success.toString()
        }, measurements);
    }

    public trackException(error: Error, properties?: TelemetryProperties): void {
        if (!this.isEnabled || !this.client || !this.isTelemetryCurrentlyEnabled()) {
            return;
        }

        try {
            const errorProperties = {
                ...properties,
                'error.name': error.name,
                'error.stack': error.stack || 'No stack trace available',
                'timestamp': new Date().toISOString()
            };

            this.client.trackException({
                exception: error,
                properties: errorProperties
            });

            debugLog('Telemetry exception tracked:', error);
        } catch (telemetryError) {
            debugLog('Failed to track telemetry exception:', telemetryError);
        }
    }

    public trackUserFlow(flowName: string, step: string, success: boolean, duration?: number): void {
        const properties: TelemetryProperties = {
            'flow': flowName,
            'step': step,
            'success': success.toString()
        };

        const measurements: TelemetryMeasurements = {};
        if (duration !== undefined) {
            measurements['duration.ms'] = duration;
        }

        this.trackEvent('user.flow', properties, measurements);
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
