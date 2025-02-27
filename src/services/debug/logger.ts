// src/services/debug/logger.ts
import * as vscode from "vscode";

const EXTENSION_CONFIG_KEY = "aiCommitAssistant";

class Logger {
    private static instance: Logger;
    private debugChannel?: vscode.OutputChannel;

    private constructor() { }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    initialize(channel: vscode.OutputChannel): void {
        this.debugChannel = channel;
        this.log('Debug logger initialized');
    }

    log(message: string, data?: unknown): void {
        const config = vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY);
        const isDebugMode = config.get<boolean>("debug") ?? false;

        if (!isDebugMode || !this.debugChannel) {
            return;
        }

        const timestamp = new Date().toISOString();
        this.debugChannel.appendLine(`[${timestamp}] ${message}`);

        if (data !== undefined) {
            this.logData(data);
        }

        this.debugChannel.show(true);
    }

    private logData(data: unknown): void {
        if (!this.debugChannel) {
            return;
        }

        if (typeof data === 'string') {
            this.debugChannel.appendLine(data);
            return;
        }

        try {
            const serializedData = JSON.stringify(data, null, 2);
            this.debugChannel.appendLine(serializedData);
        } catch (error) {
            this.debugChannel.appendLine(
                `[Error serializing data: ${error instanceof Error ? error.message : 'Unknown error'}]`
            );
        }
    }
}

// Export a singleton instance
const logger = Logger.getInstance();

export const initializeLogger = (channel: vscode.OutputChannel): void => {
    logger.initialize(channel);
};

export const debugLog = (message: string, data?: unknown): void => {
    logger.log(message, data);
};