export interface LargeDiffSettings {
    enabled: boolean;
    chunkSize: number;
    batchSize: number;
    concurrency: number;
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
