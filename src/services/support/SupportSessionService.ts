import { randomUUID } from "crypto";

export const SUPPORT_REPORT_SCHEMA_VERSION = 2;
export const SUPPORT_SESSION_DURATION_MS = 30 * 60 * 1000;
export const SUPPORT_REPORT_MAX_BYTES = 512 * 1024;
export const SUPPORT_REPORT_MAX_EVENTS = 1000;

const PROVIDERS = [
  "anthropic", "cohere", "copilot", "custom", "deepseek", "gemini",
  "grok", "groq", "huggingface", "minimax", "mistral", "nvidia",
  "ollama", "openai", "openrouter", "perplexity", "together", "zai"
] as const;

const OPERATIONS = [
  "api_validation", "generate_changelog", "generate_commit", "learn_history",
  "model_discovery", "settings", "support_session", "extension_activation",
  "git_operation", "provider_request", "recovery", "subscription", "webview"
] as const;

const EVENT_NAMES = [
  "operation_completed", "operation_failed", "operation_started",
  "operation_progress", "recovery_attempted", "recovery_completed", "session_started", "session_stopped"
] as const;

const ERROR_CATEGORIES = [
  "authentication", "billing_quota", "cancellation", "configuration",
  "content_filter", "input_limit", "invalid_response", "model_quota",
  "network", "permission", "provider_rate_limit", "temporary_service",
  "timeout", "unknown"
] as const;

const OUTCOMES = ["cancelled", "failure", "success"] as const;
const RECOVERY_ACTIONS = ["fallback_model", "retry_same_model"] as const;
const MODEL_KINDS = ["built_in", "custom", "unknown"] as const;
const SUBSYSTEMS = [
  "activation", "command", "configuration", "git", "provider", "recovery",
  "subscription", "support", "webview"
] as const;
const STOP_REASONS = ["deleted", "expired", "exported", "user"] as const;
const SAFE_PLATFORMS: readonly NodeJS.Platform[] = [
  "aix", "android", "darwin", "freebsd", "haiku", "linux", "openbsd", "sunos", "win32", "cygwin", "netbsd"
];
const SAFE_ARCHITECTURES = [
  "arm", "arm64", "ia32", "loong64", "mips", "mipsel", "ppc", "ppc64", "riscv64", "s390", "s390x", "x64", "unknown"
] as const;
const EVENT_KEYS = [
  "correlationId", "durationMs", "elapsedMs", "errorCategory", "httpStatus", "modelKind", "name",
  "operation", "outcome", "provider", "recoveryAction", "sequence", "subsystem"
] as const;

export type SupportProvider = typeof PROVIDERS[number];
export type SupportOperation = typeof OPERATIONS[number];
export type SupportEventName = typeof EVENT_NAMES[number];
export type SupportErrorCategory = typeof ERROR_CATEGORIES[number];
export type SupportOutcome = typeof OUTCOMES[number];
export type SupportRecoveryAction = typeof RECOVERY_ACTIONS[number];
export type SupportModelKind = typeof MODEL_KINDS[number];
export type SupportSubsystem = typeof SUBSYSTEMS[number];
export type SupportStopReason = typeof STOP_REASONS[number];

export interface SupportEnvironment {
  extensionVersion: string;
  vscodeVersion: string;
  platform: NodeJS.Platform;
  architecture: string;
}

export interface SupportEventInput {
  name: SupportEventName;
  operation: SupportOperation;
  provider?: SupportProvider;
  modelKind?: SupportModelKind;
  outcome?: SupportOutcome;
  errorCategory?: SupportErrorCategory;
  httpStatus?: number;
  durationMs?: number;
  recoveryAction?: SupportRecoveryAction;
  /** Ephemeral UUID allowing one user operation to be followed in a report. */
  correlationId?: string;
  subsystem?: SupportSubsystem;
}

interface SupportEvent extends SupportEventInput {
  sequence: number;
  elapsedMs: number;
}

export interface SupportReport {
  schemaVersion: typeof SUPPORT_REPORT_SCHEMA_VERSION;
  session: {
    id: string;
    startedAt: string;
    stoppedAt: string;
    stopReason: Exclude<SupportStopReason, "deleted">;
  };
  environment: SupportEnvironment;
  privacy: {
    included: readonly string[];
    excluded: readonly string[];
  };
  events: readonly SupportEvent[];
  droppedEvents: number;
}

interface ActiveSession {
  id: string;
  startedAtMs: number;
  stoppedAtMs?: number;
  stopReason?: Exclude<SupportStopReason, "deleted">;
  environment: SupportEnvironment;
  events: SupportEvent[];
  droppedEvents: number;
}

export interface SupportSessionStatus {
  active: boolean;
  eventCount: number;
  droppedEvents: number;
  remainingMs: number;
}

const INCLUDED_FIELDS = Object.freeze([
  "Extension, VS Code, operating-system family, and architecture versions",
  "Operation, subsystem, provider, model classification, result, and recovery enums",
  "Ephemeral operation correlation IDs, HTTP status codes, and relative timing"
]);

const EXCLUDED_FIELDS = Object.freeze([
  "Prompts, diffs, source code, commit messages, and repository history",
  "File names, repository names, paths, URLs, hosts, and environment variables",
  "API keys, credentials, headers, request or response bodies, and raw errors",
  "Emails, license, order, customer, device, and persistent identity data"
]);

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function isSafeVersion(value: unknown): value is string {
  return typeof value === "string" && /^(?:\d+(?:\.\d+){0,3}(?:[-+][a-z0-9.-]+)?|unknown)$/i.test(value);
}

function sanitizeEnvironment(environment: SupportEnvironment): SupportEnvironment {
  return {
    extensionVersion: isSafeVersion(environment.extensionVersion) ? environment.extensionVersion : "unknown",
    vscodeVersion: isSafeVersion(environment.vscodeVersion) ? environment.vscodeVersion : "unknown",
    platform: SAFE_PLATFORMS.includes(environment.platform) ? environment.platform : "linux",
    architecture: SAFE_ARCHITECTURES.includes(environment.architecture as typeof SAFE_ARCHITECTURES[number])
      ? environment.architecture
      : "unknown"
  };
}

function sanitizeEvent(input: SupportEventInput, sequence: number, elapsedMs: number): SupportEvent | undefined {
  if (!input || typeof input !== "object" ||
      !hasSafeRecordPrototype(input) || !hasExactKeys(input, EVENT_KEYS) ||
      !isOneOf(input.name, EVENT_NAMES) ||
      !isOneOf(input.operation, OPERATIONS)) {
    return undefined;
  }

  const event: SupportEvent = {
    sequence,
    elapsedMs: Math.max(0, Math.min(Math.round(elapsedMs), SUPPORT_SESSION_DURATION_MS)),
    name: input.name,
    operation: input.operation
  };

  if (input.provider !== undefined) {
    if (!isOneOf(input.provider, PROVIDERS)) { return undefined; }
    event.provider = input.provider;
  }
  if (input.modelKind !== undefined) {
    if (!isOneOf(input.modelKind, MODEL_KINDS)) { return undefined; }
    event.modelKind = input.modelKind;
  }
  if (input.outcome !== undefined) {
    if (!isOneOf(input.outcome, OUTCOMES)) { return undefined; }
    event.outcome = input.outcome;
  }
  if (input.errorCategory !== undefined) {
    if (!isOneOf(input.errorCategory, ERROR_CATEGORIES)) { return undefined; }
    event.errorCategory = input.errorCategory;
  }
  if (input.recoveryAction !== undefined) {
    if (!isOneOf(input.recoveryAction, RECOVERY_ACTIONS)) { return undefined; }
    event.recoveryAction = input.recoveryAction;
  }
  if (input.httpStatus !== undefined) {
    if (!Number.isInteger(input.httpStatus) || input.httpStatus < 100 || input.httpStatus > 599) { return undefined; }
    event.httpStatus = input.httpStatus;
  }
  if (input.durationMs !== undefined) {
    if (!Number.isFinite(input.durationMs) || input.durationMs < 0) { return undefined; }
    event.durationMs = Math.min(Math.round(input.durationMs), 24 * 60 * 60 * 1000);
  }
  if (input.correlationId !== undefined) {
    if (typeof input.correlationId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.correlationId)) { return undefined; }
    event.correlationId = input.correlationId;
  }
  if (input.subsystem !== undefined) {
    if (!isOneOf(input.subsystem, SUBSYSTEMS)) { return undefined; }
    event.subsystem = input.subsystem;
  }

  return event;
}

function hasExactKeys(value: object, allowed: readonly string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key));
}

function hasSafeRecordPrototype(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isCanonicalStringArray(value: unknown, canonical: readonly string[]): boolean {
  return Array.isArray(value) && Object.getPrototypeOf(value) === Array.prototype &&
    value.length === canonical.length && value.every((item, index) => item === canonical[index]);
}

function parseCanonicalIso(value: unknown): number | undefined {
  if (typeof value !== "string") { return undefined; }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value ? timestamp : undefined;
}

export function validateSupportReport(report: SupportReport): void {
  if (!report || typeof report !== "object" ||
      !hasSafeRecordPrototype(report) ||
      !hasExactKeys(report, ["schemaVersion", "session", "environment", "privacy", "events", "droppedEvents"]) ||
      report.schemaVersion !== SUPPORT_REPORT_SCHEMA_VERSION) {
    throw new Error("Support report failed its schema privacy check.");
  }
  if (!hasSafeRecordPrototype(report.session) ||
      !hasExactKeys(report.session, ["id", "startedAt", "stoppedAt", "stopReason"]) ||
      !/^[0-9a-f-]{36}$/i.test(report.session.id) ||
      !isOneOf(report.session.stopReason, ["expired", "exported", "user"] as const)) {
    throw new Error("Support report contains invalid session metadata.");
  }
  const startedAt = parseCanonicalIso(report.session.startedAt);
  const stoppedAt = parseCanonicalIso(report.session.stoppedAt);
  if (startedAt === undefined || stoppedAt === undefined || stoppedAt < startedAt ||
      stoppedAt - startedAt > SUPPORT_SESSION_DURATION_MS) {
    throw new Error("Support report contains an invalid session time range.");
  }
  if (!hasSafeRecordPrototype(report.environment) ||
      !hasExactKeys(report.environment, ["extensionVersion", "vscodeVersion", "platform", "architecture"]) ||
      !isSafeVersion(report.environment.extensionVersion) || !isSafeVersion(report.environment.vscodeVersion) ||
      !SAFE_PLATFORMS.includes(report.environment.platform) ||
      !SAFE_ARCHITECTURES.includes(report.environment.architecture as typeof SAFE_ARCHITECTURES[number])) {
    throw new Error("Support report contains invalid environment metadata.");
  }
  if (!hasSafeRecordPrototype(report.privacy) ||
      !hasExactKeys(report.privacy, ["included", "excluded"]) ||
      !isCanonicalStringArray(report.privacy.included, INCLUDED_FIELDS) ||
      !isCanonicalStringArray(report.privacy.excluded, EXCLUDED_FIELDS)) {
    throw new Error("Support report contains invalid privacy metadata.");
  }
  if (!Array.isArray(report.events) || Object.getPrototypeOf(report.events) !== Array.prototype ||
      report.events.length > SUPPORT_REPORT_MAX_EVENTS ||
      !Number.isInteger(report.droppedEvents) || report.droppedEvents < 0) {
    throw new Error("Support report contains invalid event metadata.");
  }
  for (const event of report.events) {
    if (!hasSafeRecordPrototype(event) || !hasExactKeys(event, EVENT_KEYS)) {
      throw new Error("Support report contains a non-allowlisted event.");
    }
    const sanitized = sanitizeEvent(event, event.sequence, event.elapsedMs);
    if (!sanitized || JSON.stringify(sanitized) !== JSON.stringify(event) ||
        !Number.isInteger(event.sequence) || event.sequence < 1) {
      throw new Error("Support report contains a non-allowlisted event.");
    }
  }

  const serialized = JSON.stringify(report);
  const forbiddenPatterns = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:https?|file):\/\//i,
    /(?:^|["\s])(?:\/Users\/|\/home\/|[A-Z]:\\|\\\\)/i,
    /\b(?:api[_-]?key|authorization|password|secret|token|license[_-]?key)\s*[:=]/i,
    /-----BEGIN [A-Z ]+PRIVATE KEY-----/
  ];
  if (forbiddenPatterns.some(pattern => pattern.test(serialized)) ||
      Buffer.byteLength(serialized, "utf8") > SUPPORT_REPORT_MAX_BYTES) {
    throw new Error("Support report privacy validation failed; nothing was saved.");
  }
}

export class SupportSessionService {
  private session: ActiveSession | undefined;
  private expirationTimer: ReturnType<typeof setTimeout> | undefined;

  public start(environment: SupportEnvironment): SupportSessionStatus {
    this.delete();
    const startedAtMs = Date.now();
    this.session = {
      id: randomUUID(),
      startedAtMs,
      environment: sanitizeEnvironment(environment),
      events: [],
      droppedEvents: 0
    };
    this.expirationTimer = setTimeout(() => this.stop("expired"), SUPPORT_SESSION_DURATION_MS);
    this.record({ name: "session_started", operation: "support_session", outcome: "success" });
    return this.getStatus();
  }

  public record(input: SupportEventInput): void {
    const session = this.session;
    if (!session || session.stoppedAtMs !== undefined) { return; }
    if (session.events.length >= SUPPORT_REPORT_MAX_EVENTS) {
      session.droppedEvents += 1;
      return;
    }
    const event = sanitizeEvent(input, session.events.length + 1, Date.now() - session.startedAtMs);
    if (!event) {
      session.droppedEvents += 1;
      return;
    }
    const candidateBytes = Buffer.byteLength(JSON.stringify([...session.events, event]), "utf8");
    if (candidateBytes > SUPPORT_REPORT_MAX_BYTES / 2) {
      session.droppedEvents += 1;
      return;
    }
    session.events.push(event);
  }

  public stop(reason: Exclude<SupportStopReason, "deleted"> = "user"): SupportSessionStatus {
    if (this.session && this.session.stoppedAtMs === undefined) {
      this.record({ name: "session_stopped", operation: "support_session", outcome: "success" });
      const now = Date.now();
      const expired = now - this.session.startedAtMs >= SUPPORT_SESSION_DURATION_MS;
      this.session.stoppedAtMs = Math.min(now, this.session.startedAtMs + SUPPORT_SESSION_DURATION_MS);
      this.session.stopReason = expired ? "expired" : reason;
    }
    this.clearExpirationTimer();
    return this.getStatus();
  }

  public buildReport(stopReason: Exclude<SupportStopReason, "deleted"> = "exported"): SupportReport {
    const session = this.session;
    if (!session) { throw new Error("No sanitized support session is available."); }
    if (session.stoppedAtMs === undefined) { this.stop(stopReason); }
    const report: SupportReport = {
      schemaVersion: SUPPORT_REPORT_SCHEMA_VERSION,
      session: {
        id: session.id,
        startedAt: new Date(session.startedAtMs).toISOString(),
        stoppedAt: new Date(session.stoppedAtMs ?? Date.now()).toISOString(),
        stopReason: session.stopReason ?? stopReason
      },
      environment: { ...session.environment },
      privacy: { included: INCLUDED_FIELDS, excluded: EXCLUDED_FIELDS },
      events: session.events.map(event => ({ ...event })),
      droppedEvents: session.droppedEvents
    };
    validateSupportReport(report);
    return report;
  }

  public serializeReport(): string {
    return `${JSON.stringify(this.buildReport("exported"), null, 2)}\n`;
  }

  public getStatus(): SupportSessionStatus {
    const session = this.session;
    if (!session) { return { active: false, eventCount: 0, droppedEvents: 0, remainingMs: 0 }; }
    return {
      active: session.stoppedAtMs === undefined,
      eventCount: session.events.length,
      droppedEvents: session.droppedEvents,
      remainingMs: session.stoppedAtMs === undefined
        ? Math.max(0, SUPPORT_SESSION_DURATION_MS - (Date.now() - session.startedAtMs))
        : 0
    };
  }

  public delete(): void {
    this.clearExpirationTimer();
    if (this.session) {
      this.session.events.length = 0;
      this.session = undefined;
    }
  }

  public dispose(): void {
    this.delete();
  }

  private clearExpirationTimer(): void {
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = undefined;
    }
  }
}

export const supportSessionService = new SupportSessionService();

/** Records a fixed-schema event only while the user has explicitly started a support session. */
export function recordSupportEvent(event: SupportEventInput): void {
  supportSessionService.record(event);
}
