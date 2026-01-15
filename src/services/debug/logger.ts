// src/services/debug/logger.ts
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const EXTENSION_CONFIG_KEY = "gitmind";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

class Logger {
    private static instance: Logger;
    private debugChannel?: vscode.OutputChannel;
    private fileStream: fs.WriteStream | null = null;
    private logFilePath: string | null = null;

    private constructor() { }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    async initialize(channel: vscode.OutputChannel, context: vscode.ExtensionContext): Promise<void> {
        this.debugChannel = channel;

        const logDirUri = context.logUri ?? context.globalStorageUri;
        const logDir = logDirUri.fsPath;
        const date = new Date().toISOString().slice(0, 10);
        const logFileName = `gitmind-debug-${date}.log`;
        const logFilePath = path.join(logDir, logFileName);

        try {
            await fs.promises.mkdir(logDir, { recursive: true });
            this.fileStream = fs.createWriteStream(logFilePath, { flags: "a" });
            this.logFilePath = logFilePath;
        } catch (error) {
            this.fileStream = null;
            this.logFilePath = null;
            this.logInternal("WARN", "Failed to initialize debug log file", {
                error: error instanceof Error ? error.message : String(error),
                logDir,
                logFilePath,
            });
        }

        this.logInternal("INFO", "Debug logger initialized", { logFilePath: this.logFilePath });
    }

    log(message: string, data?: unknown): void {
        this.logInternal("DEBUG", message, data);
    }

    dispose(): void {
        if (this.fileStream) {
            try {
                this.fileStream.end();
            } catch {
            }
        }
        this.fileStream = null;
        this.logFilePath = null;
    }

    private isDebugEnabled(): boolean {
        const config = vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY);
        return config.get<boolean>("debug") ?? false;
    }

    private logInternal(level: LogLevel, message: string, data?: unknown): void {
        if (!this.isDebugEnabled() || !this.debugChannel) {
            return;
        }

        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            level,
            message,
            ...(data === undefined ? {} : { data }),
        };

        this.debugChannel.appendLine(this.formatEntry(entry));

        if (this.fileStream) {
            try {
                this.fileStream.write(`${this.formatEntry(entry)}\n`);
            } catch {
            }
        }

        this.debugChannel.show(true);
    }

    private formatEntry(entry: { timestamp: string; level: LogLevel; message: string; data?: unknown }): string {
        const serialized = this.safeStringify(entry);
        return serialized ?? `[${entry.timestamp}] [${entry.level}] ${entry.message}`;
    }

    private logData(data: unknown): void {
        if (!this.debugChannel) {
            return;
        }

        if (typeof data === 'string') {
            this.debugChannel.appendLine(data);
            return;
        }

        const serializedData = this.safeStringify(data);
        if (serializedData !== null) {
            this.debugChannel.appendLine(serializedData);
            return;
        }

        this.debugChannel.appendLine(`[Error serializing data]`);
    }

    private safeStringify(value: unknown): string | null {
        try {
            const redactedKeys = new Set([
                "authorization",
                "api_key",
                "apikey",
                "api-key",
                "x-api-key",
                "token",
                "access_token",
                "refresh_token",
                "cookie",
                "set-cookie",
                "password",
                "secret",
            ]);

            return JSON.stringify(
                value,
                (key: string, v: unknown) => {
                    if (redactedKeys.has(key.toLowerCase())) {
                        return "[REDACTED]";
                    }
                    return v;
                },
            );
        } catch (error) {
            return JSON.stringify(
                { error: error instanceof Error ? error.message : "Unknown error" },
            );
        }
    }
}

// Export a singleton instance
const logger = Logger.getInstance();

export const initializeLogger = async (
    channel: vscode.OutputChannel,
    context: vscode.ExtensionContext,
): Promise<vscode.Disposable> => {
    await logger.initialize(channel, context);
    return { dispose: () => logger.dispose() };
};

export const debugLog = (message: string, data?: unknown): void => {
    logger.log(message, data);
};