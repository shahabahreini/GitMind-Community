import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import {
    recordSupportEvent,
    SupportEventInput,
    SupportOperation,
    SupportProvider,
} from "../support/SupportSessionService";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";
export type DiagnosticSubsystem =
    | "activation" | "command" | "configuration" | "git" | "provider"
    | "recovery" | "subscription" | "support" | "webview";
export type DiagnosticOutcome = "success" | "failure" | "cancelled" | "skipped";

export interface DiagnosticEvent {
    level?: LogLevel;
    subsystem: DiagnosticSubsystem;
    event: string;
    functionName?: string;
    operationId?: string;
    outcome?: DiagnosticOutcome;
    durationMs?: number;
    provider?: SupportProvider;
    /** Metadata must be operational measurements or enums, never customer content. */
    data?: Record<string, unknown>;
    /** Optional, allowlisted production-support projection of this event. */
    support?: Omit<SupportEventInput, "name" | "operation" | "provider" | "durationMs"> & {
        name: SupportEventInput["name"];
        operation: SupportOperation;
    };
}

export interface DiagnosticOperation {
    id: string;
    startedAt: number;
    subsystem: DiagnosticSubsystem;
    name: string;
}

const MAX_LOG_LINE_CHARS = 20_000;
const MAX_STRING_VALUE_CHARS = 4_000;
const MAX_OBJECT_KEYS = 80;
const MAX_ARRAY_LENGTH = 80;
const MAX_DEPTH = 8;
const REDACTED = "[REDACTED]";
const SENSITIVE_KEY = /^(?:authorization|api[_-]?key|apikey|x-api-key|x-auth-token|access[_-]?token|refresh[_-]?token|auth[_-]?token|cookie|set-cookie|password|secret|client[_-]?secret|private[_-]?key|license[_-]?key|prompt|diff|response|history|url|uri|endpoint|path|email)$/i;
const SENSITIVE_MESSAGE = /\b(?:prompt|response|diff|commit history|configuration|api key|auth token|license key|request body|response body|url|endpoint)\b/i;

class Logger {
    private static instance: Logger;
    private debugChannel?: vscode.OutputChannel;
    private fileStream: fs.WriteStream | null = null;
    private logFilePath: string | null = null;
    private developmentMode = false;

    private constructor() { }

    static getInstance(): Logger {
        if (!Logger.instance) { Logger.instance = new Logger(); }
        return Logger.instance;
    }

    async initialize(channel: vscode.OutputChannel | undefined, context: vscode.ExtensionContext): Promise<void> {
        this.developmentMode = context.extensionMode === vscode.ExtensionMode.Development;
        this.debugChannel = channel ?? (this.developmentMode ? vscode.window.createOutputChannel("GitMind Diagnostics") : undefined);

        // Raw logs are intentionally unavailable in production. Production diagnostics
        // are only recorded through the allowlisted, user-started support session.
        if (!this.developmentMode) { return; }

        const logDirUri = context.logUri ?? context.globalStorageUri;
        const logDir = logDirUri.fsPath;
        const logFilePath = path.join(logDir, `gitmind-debug-${new Date().toISOString().slice(0, 10)}.log`);
        try {
            await fs.promises.mkdir(logDir, { recursive: true });
            this.fileStream = fs.createWriteStream(logFilePath, { flags: "a" });
            this.logFilePath = logFilePath;
        } catch (error) {
            this.fileStream = null;
            this.logFilePath = null;
            this.logInternal("WARN", "debug_logger.initialization_failed", { error });
        }
        this.logInternal("INFO", "debug_logger.initialized", { developmentMode: true, fileEnabled: Boolean(this.logFilePath) });
    }

    event(event: DiagnosticEvent): void {
        const durationMs = event.durationMs === undefined ? undefined : Math.max(0, Math.round(event.durationMs));
        this.logInternal(event.level ?? (event.outcome === "failure" ? "ERROR" : "INFO"), event.event, {
            subsystem: event.subsystem,
            function: event.functionName,
            operationId: event.operationId,
            outcome: event.outcome,
            durationMs,
            provider: event.provider,
            ...event.data,
        });
        if (event.support) {
            recordSupportEvent({
                ...event.support,
                ...(event.provider ? { provider: event.provider } : {}),
                ...(durationMs === undefined ? {} : { durationMs }),
                ...(event.operationId ? { correlationId: event.operationId } : {}),
                subsystem: event.subsystem,
            });
        }
    }

    log(message: string, data?: unknown): void {
        // Legacy call sites remain usable, but cannot leak high-risk request content.
        const sensitive = SENSITIVE_MESSAGE.test(message) || message.length > 500 || message.includes("\n");
        this.logInternal("DEBUG", sensitive ? "legacy_log.sensitive_payload_suppressed" : message, sensitive
            ? { originalMessageClass: "sensitive_or_multiline" }
            : data);
    }

    dispose(): void {
        try { this.fileStream?.end(); } catch { /* best effort */ }
        this.fileStream = null;
        this.logFilePath = null;
        this.debugChannel?.dispose();
        this.debugChannel = undefined;
    }

    private logInternal(level: LogLevel, message: string, data?: unknown): void {
        if (!this.developmentMode || !this.debugChannel) { return; }
        const entry = { timestamp: new Date().toISOString(), level, event: message, ...(data === undefined ? {} : { data }) };
        const formatted = this.formatEntry(entry);
        this.debugChannel.appendLine(formatted);
        try { this.fileStream?.write(`${formatted}\n`); } catch { /* best effort */ }
    }

    private formatEntry(entry: { timestamp: string; level: LogLevel; event: string; data?: unknown }): string {
        return this.safeStringify(entry) ?? `[${entry.timestamp}] [${entry.level}] ${entry.event}`;
    }

    private safeStringify(value: unknown): string | null {
        try {
            const seen = new WeakSet<object>();
            const sanitize = (input: unknown, depth: number, key?: string): unknown => {
                if (key && SENSITIVE_KEY.test(key.replace(/([a-z])([A-Z])/g, "$1_$2"))) { return REDACTED; }
                if (depth > MAX_DEPTH) { return "[MaxDepth]"; }
                if (input === null || input === undefined || typeof input === "number" || typeof input === "boolean") { return input; }
                if (typeof input === "string") {
                    const safe = input.length <= MAX_STRING_VALUE_CHARS ? input : `${input.slice(0, MAX_STRING_VALUE_CHARS)}... (truncated, total ${input.length} chars)`;
                    return safe;
                }
                if (input instanceof Error) {
                    return { name: input.name, message: input.message, stack: input.stack };
                }
                if (Array.isArray(input)) {
                    const items = input.slice(0, MAX_ARRAY_LENGTH).map(item => sanitize(item, depth + 1));
                    return input.length <= MAX_ARRAY_LENGTH ? items : { items, truncated: true, totalLength: input.length };
                }
                if (typeof input === "object") {
                    const obj = input as Record<string, unknown>;
                    if (seen.has(obj)) { return "[Circular]"; }
                    seen.add(obj);
                    const entries = Object.entries(obj);
                    const out: Record<string, unknown> = {};
                    for (const [entryKey, entryValue] of entries.slice(0, MAX_OBJECT_KEYS)) {
                        out[entryKey] = sanitize(entryValue, depth + 1, entryKey);
                    }
                    if (entries.length > MAX_OBJECT_KEYS) { out.__truncated__ = { keys: true, totalKeys: entries.length }; }
                    return out;
                }
                return String(input);
            };
            const serialized = JSON.stringify(sanitize(value, 0));
            return serialized.length <= MAX_LOG_LINE_CHARS ? serialized : `${serialized.slice(0, MAX_LOG_LINE_CHARS)}... (truncated, total ${serialized.length} chars)`;
        } catch (error) {
            return JSON.stringify({ error: error instanceof Error ? error.message : "Unknown logger error" });
        }
    }
}

const logger = Logger.getInstance();

export const initializeLogger = async (channel: vscode.OutputChannel | undefined, context: vscode.ExtensionContext): Promise<vscode.Disposable> => {
    await logger.initialize(channel, context);
    return { dispose: () => logger.dispose() };
};

export const debugLog = (message: string, data?: unknown): void => logger.log(message, data);
export const diagnosticLog = (event: DiagnosticEvent): void => logger.event(event);
export const startDiagnosticOperation = (subsystem: DiagnosticSubsystem, name: string): DiagnosticOperation => ({
    id: randomUUID(), startedAt: Date.now(), subsystem, name,
});
export const elapsedDiagnosticOperation = (operation: DiagnosticOperation): number => Date.now() - operation.startedAt;
