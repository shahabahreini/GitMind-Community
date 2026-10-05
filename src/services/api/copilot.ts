import { RequestContext, runRequest } from "./requestContext";
import * as vscode from 'vscode';
import { debugLog, diagnosticLog } from "../debug/logger";
import { BaseAIProvider, GenerationOptions } from './base';
import { normalizeProviderError, ProviderApiError, ProviderErrorCategory } from './recovery';

/** Shown in the Copilot consent dialog so users know why GitMind asks for access. */
export const COPILOT_REQUEST_JUSTIFICATION = "GitMind uses GitHub Copilot to write commit messages from your staged changes.";

/** Extension IDs that provide Copilot chat models. Presence is only a hint; the language model API is authoritative. */
const COPILOT_EXTENSION_IDS = ['GitHub.copilot-chat', 'GitHub.copilot'];

const TEST_CONNECTION_TIMEOUT_MS = 10_000;

/** Minimal surface of the VS Code language model API, injectable for tests. */
export interface CopilotLmAccess {
    hasLanguageModelApi(): boolean;
    selectChatModels(): Thenable<readonly vscode.LanguageModelChat[]>;
    isCopilotExtensionInstalled(): boolean;
    appName(): string;
}

const defaultLmAccess: CopilotLmAccess = {
    hasLanguageModelApi: () => typeof (vscode as { lm?: typeof vscode.lm }).lm?.selectChatModels === 'function',
    selectChatModels: () => vscode.lm.selectChatModels({ vendor: 'copilot' }),
    isCopilotExtensionInstalled: () => COPILOT_EXTENSION_IDS.some(id => vscode.extensions.getExtension(id) !== undefined),
    appName: () => vscode.env.appName || 'this editor',
};

let lmAccess: CopilotLmAccess = defaultLmAccess;

/** Test seam: replaces the language model access; call with no argument to restore the default. */
export function setCopilotLmAccessForTesting(access?: CopilotLmAccess): void {
    lmAccess = access ?? defaultLmAccess;
}

export type CopilotState =
    | { kind: 'unsupported-host'; appName: string }
    | { kind: 'not-installed'; appName: string }
    | { kind: 'no-access'; appName: string }
    | { kind: 'no-models'; appName: string }
    | { kind: 'ready'; appName: string; models: readonly vscode.LanguageModelChat[] };

export type CopilotUnavailableState = Exclude<CopilotState, { kind: 'ready' }>;

/** User-facing text for each unavailable state. Never mentions API keys: Copilot uses the editor's sign-in. */
export function describeCopilotState(state: CopilotUnavailableState): string {
    switch (state.kind) {
        case 'unsupported-host':
            return `GitHub Copilot not detected: ${state.appName} does not provide the language model API that GitHub Copilot needs. Choose another provider in Model Settings.`;
        case 'not-installed':
            return `GitHub Copilot not detected in ${state.appName}. Install GitHub Copilot, sign in, and try again.`;
        case 'no-access':
            return `GitMind does not have permission to use GitHub Copilot in ${state.appName}. Run the command again and choose Allow, and make sure you are signed in to GitHub Copilot.`;
        case 'no-models':
            return `No GitHub Copilot models are available in ${state.appName}. Sign in to GitHub Copilot and check that your plan includes chat models.`;
    }
}

function copilotError(message: string, category: ProviderErrorCategory, code?: string, cause?: unknown): ProviderApiError {
    return new ProviderApiError(message, { provider: 'copilot', category, code, cause, userFacing: true });
}

/** Error raised when Copilot cannot be used; carries the detected state for callers that offer actions. */
export class CopilotUnavailableError extends ProviderApiError {
    constructor(public readonly state: CopilotUnavailableState) {
        super(describeCopilotState(state), {
            provider: 'copilot',
            category: state.kind === 'no-access' ? 'permission' : 'configuration',
            code: `copilot-${state.kind}`,
            userFacing: true,
        });
        this.name = 'CopilotUnavailableError';
    }
}

function hasLanguageModelErrorCode(error: unknown, factory: (message?: string) => vscode.LanguageModelError): boolean {
    return error instanceof vscode.LanguageModelError && error.code === factory().code;
}

/**
 * Maps a language model failure to a Copilot-specific, user-facing error.
 * Uses LanguageModelError.code, as documented; constructor names are not stable after bundling.
 */
export function mapCopilotRequestError(error: unknown, modelId?: string): ProviderApiError {
    if (error instanceof ProviderApiError) {
        return error;
    }
    if (error instanceof Error && (error.message === 'Request was cancelled' || error.name === 'AbortError' || error.name === 'Canceled')) {
        return new ProviderApiError('Request was cancelled', { provider: 'copilot', category: 'cancelled', cause: error });
    }
    if (hasLanguageModelErrorCode(error, vscode.LanguageModelError.NoPermissions)) {
        return copilotError(
            "GitMind needs permission to use GitHub Copilot models. Run the command again and choose Allow, and make sure you are signed in to GitHub Copilot.",
            'permission', 'NoPermissions', error
        );
    }
    if (hasLanguageModelErrorCode(error, vscode.LanguageModelError.Blocked)) {
        return copilotError(
            "GitHub Copilot blocked this request (content filter or request limit). Review the staged changes or try again later.",
            'content-filter', 'Blocked', error
        );
    }
    if (hasLanguageModelErrorCode(error, vscode.LanguageModelError.NotFound)) {
        return copilotError(
            `The GitHub Copilot model${modelId ? ` "${modelId}"` : ''} is not available to your account. Choose another model in Model Settings or select "auto".`,
            'configuration', 'NotFound', error
        );
    }
    if (error instanceof vscode.LanguageModelError) {
        // Code is typically "Unknown"; details live in `cause` and are never echoed to the user.
        debugLog(`Copilot language model error code: ${error.code}`, error.cause);
        return copilotError(
            "GitHub Copilot could not complete the request. Try again, or choose another Copilot model in Model Settings.",
            'temporary-service', error.code, error
        );
    }
    const normalized = normalizeProviderError(error, "copilot");
    if (normalized.category !== "unknown") { return normalized; }
    return copilotError(
        "GitHub Copilot could not complete the request. Try again, or choose another Copilot model in Model Settings.",
        'unknown', undefined, error
    );
}

/**
 * Detects whether Copilot chat models are usable in this editor.
 * Call only from user-initiated actions: selecting models can show a consent dialog.
 */
export async function detectCopilot(): Promise<CopilotState> {
    const appName = lmAccess.appName();
    let state: CopilotState;

    if (!lmAccess.hasLanguageModelApi()) {
        state = { kind: 'unsupported-host', appName };
    } else {
        try {
            const models = await lmAccess.selectChatModels();
            if (models.length > 0) {
                state = { kind: 'ready', appName, models };
            } else {
                state = lmAccess.isCopilotExtensionInstalled()
                    ? { kind: 'no-models', appName }
                    : { kind: 'not-installed', appName };
            }
        } catch (error) {
            debugLog("Copilot model selection failed:", error);
            state = hasLanguageModelErrorCode(error, vscode.LanguageModelError.NoPermissions)
                ? { kind: 'no-access', appName }
                : { kind: lmAccess.isCopilotExtensionInstalled() ? 'no-models' : 'not-installed', appName };
        }
    }

    diagnosticLog({
        subsystem: "provider",
        event: "provider.copilot_state",
        functionName: "detectCopilot",
        provider: "copilot",
        outcome: state.kind === 'ready' ? "success" : "failure",
        data: { kind: state.kind, appName, modelCount: state.kind === 'ready' ? state.models.length : 0 },
    });
    return state;
}

/** Returns the usable Copilot models, or throws CopilotUnavailableError describing why there are none. */
async function requireCopilotModels(): Promise<readonly vscode.LanguageModelChat[]> {
    const state = await detectCopilot();
    if (state.kind !== 'ready') {
        throw new CopilotUnavailableError(state);
    }
    return state.models;
}

function getPreferredCopilotModelIds(model: string): string[] {
    switch (model) {
        case 'raptor-mini':
            return ['oswe-vscode-secondary', 'oswe-vscode-prime'];
        default:
            return [];
    }
}

/**
 * Resolves the configured model to an available Copilot model.
 * "auto" uses a model with id "auto" when the editor offers one, else the first available model.
 * An explicit model that is not available is an error: GitMind never switches models silently.
 */
export function resolveCopilotChatModel(
    configuredModel: string,
    available: readonly vscode.LanguageModelChat[]
): vscode.LanguageModelChat {
    if (available.length === 0) {
        throw new CopilotUnavailableError({ kind: 'no-models', appName: lmAccess.appName() });
    }

    const requested = configuredModel.trim() || 'auto';
    if (requested === 'auto') {
        return available.find(m => m.id === 'auto') ?? available[0];
    }

    const preferredIds = getPreferredCopilotModelIds(requested);
    const preferred = available.find(m => preferredIds.includes(m.id));
    if (preferred) {
        return preferred;
    }

    const exact = available.find(m => m.id === requested || m.family === requested);
    if (exact) {
        return exact;
    }

    // Tolerate case and separator differences between saved names and editor IDs (e.g. "claude-sonnet-4.6" vs "claude-sonnet-4-6").
    const normalize = (value: string) => value.toLowerCase().replace(/[\s._]+/g, '-');
    const wanted = normalize(requested);
    const normalized = available.find(m => [m.id, m.family, m.name].some(v => v && normalize(v) === wanted));
    if (normalized) {
        return normalized;
    }

    throw copilotError(
        `The GitHub Copilot model "${requested}" is not available to your account. Choose another model in Model Settings or select "auto".`,
        'configuration', 'NotFound'
    );
}

export class CopilotProvider extends BaseAIProvider {
    override async prepareCapabilities(context?: RequestContext): Promise<void> {
        await runRequest(context, async () => {
            const model = resolveCopilotChatModel(this.model, await requireCopilotModels());
            this.rememberModelLimits(this.model, model.maxInputTokens, 1024);
        });
    }

    constructor(_apiKey: string, model: string) {
        // Copilot does not use API key, so we pass empty string
        super("", model);
    }

    protected async generateResponse(prompt: string, _options?: GenerationOptions): Promise<string> {
        const controller = this.getAbortController();
        const token = new vscode.CancellationTokenSource();
        const onAbort = () => token.cancel();
        controller.signal.addEventListener('abort', onAbort);
        if (controller.signal.aborted) { token.cancel(); }
        let resolvedModelId: string | undefined;

        try {
            debugLog(`Calling GitHub Copilot with model: ${this.model}`);

            const models = await requireCopilotModels();
            const resolvedModel = resolveCopilotChatModel(this.model, models);
            resolvedModelId = resolvedModel.id;
            debugLog(`Selected Copilot model: ${resolvedModel.id}`);

            this.rememberModelLimits(this.model, resolvedModel.maxInputTokens, 1024);
            controller.signal.throwIfAborted();
            const message = vscode.LanguageModelChatMessage.User(prompt);

            const inputTokens = await resolvedModel.countTokens(message, token.token);
            if (resolvedModel.maxInputTokens > 0 && inputTokens > resolvedModel.maxInputTokens) {
                throw new ProviderApiError(
                    `Content is too large for the GitHub Copilot model "${resolvedModel.name || resolvedModel.id}" (${inputTokens.toLocaleString()} of ${resolvedModel.maxInputTokens.toLocaleString()} input tokens).`,
                    { provider: 'copilot', category: 'input-limit', code: 'input-limit' }
                );
            }

            // One request to the selected model only. Model fallback is the Pro modelFallback policy's job.
            const response = await resolvedModel.sendRequest(
                [message],
                { justification: COPILOT_REQUEST_JUSTIFICATION },
                token.token
            );

            let fullText = "";
            for await (const fragment of response.text) {
                if (token.token.isCancellationRequested) {
                    throw new Error('Request was cancelled');
                }
                fullText += fragment;
            }

            const formattedMessage = this.enforceCommitMessageFormat(fullText);
            debugLog("Copilot response received");
            return formattedMessage;
        } catch (error) {
            debugLog("Copilot request failed:", error);
            throw mapCopilotRequestError(error, resolvedModelId);
        } finally {
            controller.signal.removeEventListener('abort', onAbort);
            token.dispose();
        }
    }

    async getModels(): Promise<string[]> {
        return fetchCopilotModels();
    }

    async validateApiKey(): Promise<boolean | { success: boolean; error?: string; warning?: string; troubleshooting?: string }> {
        return validateCopilotAccess(this.model);
    }
}

/**
 * Test Connection: detects Copilot, then sends one minimal request to the selected model only,
 * so it never spends requests on models the user did not choose.
 */
export async function validateCopilotAccess(model = 'auto'): Promise<{ success: boolean; error?: string; troubleshooting?: string }> {
    const state = await detectCopilot();
    if (state.kind !== 'ready') {
        return { success: false, error: describeCopilotState(state) };
    }

    const token = new vscode.CancellationTokenSource();
    const timer = setTimeout(() => token.cancel(), TEST_CONNECTION_TIMEOUT_MS);
    let modelId: string | undefined;
    try {
        const selected = resolveCopilotChatModel(model, state.models);
        modelId = selected.id;
        const response = await selected.sendRequest(
            [vscode.LanguageModelChatMessage.User("ping")],
            { justification: COPILOT_REQUEST_JUSTIFICATION },
            token.token
        );
        for await (const fragment of response.text) {
            void fragment;
            break;
        }
        return { success: true };
    } catch (error) {
        debugLog(`Copilot test request failed for model: ${modelId ?? model}`, error);
        return { success: false, error: mapCopilotRequestError(error, modelId).message };
    } finally {
        clearTimeout(timer);
        token.cancel();
        token.dispose();
    }
}

/** Details of a detected Copilot model, for the settings UI. */
export interface CopilotModelInfo {
    id: string;
    name: string;
    family: string;
    maxInputTokens: number;
}

/** Detects Copilot and returns its state with model details; never throws for unavailable states. */
export async function discoverCopilotModels(): Promise<{ state: CopilotState['kind']; message?: string; models: CopilotModelInfo[] }> {
    const state = await detectCopilot();
    if (state.kind !== 'ready') {
        return { state: state.kind, message: describeCopilotState(state), models: [] };
    }
    return {
        state: state.kind,
        models: state.models.map(m => ({ id: m.id, name: m.name, family: m.family, maxInputTokens: m.maxInputTokens })),
    };
}

/**
 * Fetches available GitHub Copilot model IDs, with "auto" first.
 * Throws CopilotUnavailableError when Copilot cannot be used.
 */
export async function fetchCopilotModels(): Promise<string[]> {
    debugLog("Fetching available Copilot models");
    const models = await requireCopilotModels();

    const detectedModels = new Set<string>();
    for (const model of models) {
        debugLog("Detected Copilot model:", {
            id: model.id,
            name: model.name,
            family: model.family,
            vendor: model.vendor,
            version: model.version
        });
        detectedModels.add(model.id);

        // Friendly alias so users can pick the user-facing name
        if (model.id === 'oswe-vscode-secondary' || model.id === 'oswe-vscode-prime') {
            detectedModels.add('raptor-mini');
        }
    }

    const modelsList = Array.from(detectedModels).filter(id => id !== 'auto');
    modelsList.sort((a, b) => a.localeCompare(b));
    return ['auto', ...modelsList];
}
