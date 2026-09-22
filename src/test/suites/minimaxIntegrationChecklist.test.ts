import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { API_KEY_PROVIDER_IDS, PROVIDER_CATALOG } from '../../config/providerCatalog';

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

        assert.strictEqual(
            props?.['gitmind.minimax.model']?.enum,
            undefined,
            'MiniMax must not duplicate the centralized model list in the editable VS Code settings schema'
        );
    });

    test('Backend provider registry and validation are wired', () => {
        const apiIndex = readRepoFile('src/services/api/index.ts');
        assert.ok(apiIndex.includes("case 'minimax':"), 'API lazy loader should include minimax case');
        assert.ok(PROVIDER_CATALOG.minimax, 'Provider catalog should include minimax entry');
        assert.strictEqual(PROVIDER_CATALOG.minimax.name, 'MiniMax', 'Provider catalog should name MiniMax');

        const validation = readRepoFile('src/services/api/validation.ts');
        assert.ok(validation.includes('validateMiniMaxAPIKey'), 'Validation should reference validateMiniMaxAPIKey');
        assert.ok(validation.includes('minimax:'), 'VALIDATOR_CONFIGS should include minimax entry');
    });

    test('Command wiring for model loading exists', () => {
        // Commands are registered in commands/index.ts via registerCommands(), not extension.ts directly
        const commandsTs = readRepoFile('src/commands/index.ts');
        assert.ok(
            commandsTs.includes('gitmind.loadMiniMaxModels'),
            'Extension should register gitmind.loadMiniMaxModels'
        );
    });

    test('Settings webview wiring exists (UI + defaults + model list)', () => {
        assert.ok(PROVIDER_DEFAULTS.minimax, 'Webview PROVIDER_DEFAULTS should include minimax');
        assert.strictEqual(
            PROVIDER_DEFAULTS.minimax.model,
            PROVIDER_CATALOG.minimax.defaultModel,
            'Webview default model for minimax should come from the provider catalog'
        );

        assert.deepStrictEqual(
            DEFAULT_MODELS.minimax,
            [...PROVIDER_CATALOG.minimax.curatedModels],
            'Webview DEFAULT_MODELS.minimax should match the curated current models'
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
            settingsManager.includes('getProviderDefaultModel(id)') && settingsManager.includes('PROVIDER_IDS'),
            'SettingsManager defaults should be derived from the centralized provider catalog'
        );

        assert.ok(
            (API_KEY_PROVIDER_IDS as readonly string[]).includes('minimax'),
            'The catalog API-key provider list (used by SettingsManager) should include minimax'
        );
    });
});
