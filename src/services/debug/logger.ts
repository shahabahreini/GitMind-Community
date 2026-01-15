// src/services/debug/logger.ts
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const EXTENSION_CONFIG_KEY = "gitmind";

type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const MAX_LOG_LINE_CHARS = 20_000;
const MAX_STRING_VALUE_CHARS = 4_000;
const MAX_OBJECT_KEYS = 80;
const MAX_ARRAY_LENGTH = 80;
const MAX_DEPTH = 8;

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

        const shouldInlinePrimitive =
            (typeof data === "string" || typeof data === "number" || typeof data === "boolean") &&
            (message.trimEnd().endsWith(":") || message.trimEnd().endsWith(","));

        const finalMessage = shouldInlinePrimitive ? `${message} ${String(data)}` : message;
        const finalData = shouldInlinePrimitive ? undefined : data;

        const entry = {
            timestamp,
            level,
            message: finalMessage,
            ...(finalData === undefined ? {} : { data: finalData }),
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

    private safeStringify(value: unknown): string | null {
        try {
            const redactedKeys = new Set([
                "authorization",
                "api_key",
                "apikey",
                "api-key",
                "x-api-key",
                "x-auth-token",
                "token",
                "access_token",
                "refresh_token",
                "cookie",
                "set-cookie",
                "password",
                "secret",
                "client_secret",
                "private_key",
            ]);

            const seen = new WeakSet<object>();

            const sanitize = (input: unknown, depth: number): unknown => {
                if (depth > MAX_DEPTH) {
                    return "[MaxDepth]";
                }

                if (input === null || input === undefined) {
                    return input;
                }

                if (typeof input === "string") {
                    if (input.length <= MAX_STRING_VALUE_CHARS) {
                        return input;
                    }
                    return `${input.slice(0, MAX_STRING_VALUE_CHARS)}... (truncated, total ${input.length} chars)`;
                }

                if (typeof input === "number" || typeof input === "boolean") {
                    return input;
                }

                if (input instanceof Error) {
                    return {
                        name: input.name,
                        message: input.message,
                        stack: input.stack,
                    };
                }

                if (Array.isArray(input)) {
                    const head = input.slice(0, MAX_ARRAY_LENGTH).map((item) => sanitize(item, depth + 1));
                    if (input.length <= MAX_ARRAY_LENGTH) {
                        return head;
                    }
                    return {
                        items: head,
                        truncated: true,
                        totalLength: input.length,
                    };
                }

                if (typeof input === "object") {
                    const obj = input as Record<string, unknown>;
                    if (seen.has(obj)) {
                        return "[Circular]";
                    }
                    seen.add(obj);

                    const entries = Object.entries(obj);
                    const limitedEntries = entries.slice(0, MAX_OBJECT_KEYS);
                    const out: Record<string, unknown> = {};

                    for (const [k, v] of limitedEntries) {
                        if (redactedKeys.has(k.toLowerCase())) {
                            out[k] = "[REDACTED]";
                            continue;
                        }
                        out[k] = sanitize(v, depth + 1);
                    }

                    if (entries.length > MAX_OBJECT_KEYS) {
                        out["__truncated__"] = {
                            keys: true,
                            totalKeys: entries.length,
                        };
                    }

                    return out;
                }

                return String(input);
            };

            const sanitizedValue = sanitize(value, 0);
            const serialized = JSON.stringify(sanitizedValue);
            if (serialized.length <= MAX_LOG_LINE_CHARS) {
                return serialized;
            }

            return `${serialized.slice(0, MAX_LOG_LINE_CHARS)}... (truncated, total ${serialized.length} chars)`;
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