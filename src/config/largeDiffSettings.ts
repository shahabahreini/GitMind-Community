export interface LargeDiffSettings {
    enabled: boolean;
    chunkSize: number;
    batchSize: number;
    concurrency: number;
    /** Most calls multi-request analysis may plan before falling back to the condensed single request. */
    maxCalls: number;
    perFileLines: number;
    /** Estimated-token ceiling for one prompt; 0 chooses a default for the provider. */
    maxPromptTokens: number;
}
function integer(value: unknown, fallback: number, min: number, max: number): number {
    return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}
export function resolveLargeDiffSettings(value: unknown): LargeDiffSettings {
    const settings = value && typeof value === "object" ? value as Record<string, unknown> : {};
    return {
        enabled: settings.enabled === true,
        chunkSize: integer(settings.chunkSize, 1000, 10, 10000),
        batchSize: integer(settings.batchSize ?? settings.maxChunks, 5, 1, 100),
        concurrency: integer(settings.concurrency, 3, 1, 8),
        maxCalls: integer(settings.maxCalls, 6, 2, 50),
        perFileLines: integer(settings.perFileLines, 400, 20, 5000),
        maxPromptTokens: settings.maxPromptTokens === 0 ? 0 : integer(settings.maxPromptTokens, 0, 2000, 1000000),
    };
}

/** Registration must not hide an explicitly configured legacy batch size. */
export function readLargeDiffSettings(config: {
    get<T>(key: string, fallback?: T): T | undefined;
    inspect<T>(key: string): { globalValue?: T; workspaceValue?: T; workspaceFolderValue?: T } | undefined;
}): LargeDiffSettings {
    const value = { ...(config.get<Record<string, unknown>>("pro.largeDiffHandling") ?? {}) };
    const batch = config.inspect<number>("pro.largeDiffHandling.batchSize");
    if (batch && batch.globalValue === undefined && batch.workspaceValue === undefined && batch.workspaceFolderValue === undefined) {
        delete value.batchSize;
    }
    return resolveLargeDiffSettings(value);
}
