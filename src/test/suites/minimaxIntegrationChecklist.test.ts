import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { DEFAULT_MODELS, PROVIDER_DEFAULTS } from '../../webview/settings/scripts/constants';
import { ProviderConfig } from '../../webview/settings/components/config/ProviderConfig';

function readRepoFile(relativePath: string): string {
    const absolutePath = path.join(process.cwd(), relativePath);
    return fs.readFileSync(absolutePath, { encoding: 'utf8' });
}

suite('MiniMax Integration Checklist', () => {
    test('Settings schema exposes MiniMax keys and provider enum', () => {
        const packageJsonRaw = readRepoFile('package.json');
        const pkg = JSON.parse(packageJsonRaw) as any;

        const apiProviderEnum: unknown = pkg?.contributes?.configuration?.properties?.['gitmind.apiProvider']?.enum;
        assert.ok(Array.isArray(apiProviderEnum), 'gitmind.apiProvider.enum should be an array');
        assert.ok((apiProviderEnum as unknown[]).includes('minimax'), 'gitmind.apiProvider enum should include minimax');

        const props = pkg?.contributes?.configuration?.properties;
        assert.ok(props?.['gitmind.minimax.apiKey'], 'gitmind.minimax.apiKey should exist in configuration schema');
        assert.ok(props?.['gitmind.minimax.model'], 'gitmind.minimax.model should exist in configuration schema');

        const minimaxModelEnum: unknown = props?.['gitmind.minimax.model']?.enum;
        assert.deepStrictEqual(
            minimaxModelEnum,
            ['MiniMax-M1', 'MiniMax-M2', 'MiniMax-M2.1', 'MiniMax-M2.5', 'MiniMax-Text-01'],
            'MiniMax model enum should be restricted to text-generation models'
        );
    });

    test('Backend provider registry and validation are wired', () => {
        const apiIndex = readRepoFile('src/services/api/index.ts');
        assert.ok(apiIndex.includes("case 'minimax':"), 'API lazy loader should include minimax case');
        assert.ok(apiIndex.includes('minimax:'), 'API provider registry should include minimax entry');
        assert.ok(apiIndex.includes('MiniMax'), 'API provider registry should include MiniMax display name');

        const validation = readRepoFile('src/services/api/validation.ts');
        assert.ok(validation.includes('validateMiniMaxAPIKey'), 'Validation should reference validateMiniMaxAPIKey');
        assert.ok(validation.includes('minimax:'), 'VALIDATOR_CONFIGS should include minimax entry');
    });

    test('Command wiring for model loading exists', () => {
        const extensionTs = readRepoFile('src/extension.ts');
        assert.ok(
            extensionTs.includes('gitmind.loadMiniMaxModels'),
            'Extension should register gitmind.loadMiniMaxModels'
        );
    });

    test('Settings webview wiring exists (UI + defaults + model list)', () => {
        assert.ok(PROVIDER_DEFAULTS.minimax, 'Webview PROVIDER_DEFAULTS should include minimax');
        assert.strictEqual(
            PROVIDER_DEFAULTS.minimax.model,
            'MiniMax-M2.5',
            'Webview default model for minimax should be MiniMax-M2.5'
        );

        assert.deepStrictEqual(
            DEFAULT_MODELS.minimax,
            ['MiniMax-M1', 'MiniMax-M2', 'MiniMax-M2.1', 'MiniMax-M2.5', 'MiniMax-Text-01'],
            'Webview DEFAULT_MODELS.minimax should include text-generation models only'
        );

        const minimaxProvider = ProviderConfig.getProvider('minimax');
        assert.ok(minimaxProvider, 'ProviderConfig should include minimax provider');

        const fieldIds = new Set((minimaxProvider?.fields ?? []).map(f => f.id));
        assert.ok(fieldIds.has('minimaxApiKey'), 'MiniMax provider should have minimaxApiKey field');
        assert.ok(fieldIds.has('minimaxModel'), 'MiniMax provider should have minimaxModel field');

        const modelField = minimaxProvider?.fields.find(f => f.id === 'minimaxModel');
        assert.strictEqual(modelField?.loadButtonId, 'loadMiniMaxModels', 'MiniMax model field should use loadMiniMaxModels button id');
        assert.strictEqual((modelField as any)?.loadButtonDisabled, true, 'MiniMax model load button should be disabled');
        assert.strictEqual(
            (modelField as any)?.loadButtonDisabledTooltip,
            "MiniMax won't support model fetch yet!",
            'MiniMax model load tooltip should explain model fetch is not supported'
        );
    });

    test('Settings persistence allowlists include MiniMax', () => {
        const settingsManager = readRepoFile('src/webview/settings/SettingsManager.ts');

        assert.ok(
            settingsManager.includes('minimax: { model: "MiniMax-M2.5" }'),
            'SettingsManager PROVIDER_DEFAULTS should include minimax'
        );

        assert.ok(
            settingsManager.includes("'minimax'"),
            'SettingsManager API_KEY_PROVIDERS should include minimax'
        );
    });
});
