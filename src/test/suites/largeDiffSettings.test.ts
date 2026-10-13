import * as assert from "node:assert";
import * as vscode from "vscode";
import { SettingsManager } from "../../webview/settings/SettingsManager";
import { readLargeDiffSettings } from "../../config/largeDiffSettings";
import { generateSettingsCollection } from "../../webview/settings/scripts/formGenerators";
import { getSettingsScript } from "../../webview/settings/scripts/settingsManager";

suite("Large diff settings round trip", () => {
    test("legacy values survive initialization, save, and reload; malformed values use validated defaults", async () => {
        const values = new Map<string, unknown>([
            ["apiProvider", "ollama"],
            ["pro.largeDiffHandling.maxChunks", 9],
            ["pro.largeDiffHandling.chunkSize", 1200],
            ["pro.largeDiffHandling.enabled", true],
        ]);
        const original = vscode.workspace.getConfiguration;
        const config: any = {
            get: (key: string, fallback: unknown) => {
                if (key === "pro.largeDiffHandling") {
                    return Object.fromEntries([...values].filter(([name]) => name.startsWith(key + ".")).map(([name, value]) => [name.slice(key.length + 1), value]));
                }
                return values.get(key) ?? fallback;
            },
            inspect: (key: string) => ({ globalValue: values.get(key) }),
            update: async (key: string, value: unknown) => { values.set(key, value); },
        };
        (vscode.workspace as any).getConfiguration = () => config;
        try {
            const before = await SettingsManager.getCurrentSettings();
            assert.strictEqual(before.pro?.largeDiffHandling?.batchSize, 9);
            await (SettingsManager as any).updateConfigurationSettings(config, before);
            assert.strictEqual(values.get("pro.largeDiffHandling.batchSize"), 9);
            const after = await SettingsManager.getCurrentSettings();
            assert.deepStrictEqual(after.pro?.largeDiffHandling, before.pro?.largeDiffHandling);
            after.pro!.largeDiffHandling = { enabled: true, chunkSize: NaN, batchSize: -2, concurrency: 1000 };
            await (SettingsManager as any).updateConfigurationSettings(config, after);
            assert.deepStrictEqual(readLargeDiffSettings(config), { enabled: true, chunkSize: 1000, batchSize: 5, concurrency: 3, maxCalls: 6, perFileLines: 400, maxPromptTokens: 0 });
            const form = generateSettingsCollection();
            const script = getSettingsScript(after, "test-nonce");
            for (const id of ["largeDiffEnabled", "chunkSize", "batchSize", "largeDiffConcurrency"]) {
                assert.ok(form.includes(id));
                assert.ok(script.includes(id));
            }
        } finally { (vscode.workspace as any).getConfiguration = original; }
    });
});
