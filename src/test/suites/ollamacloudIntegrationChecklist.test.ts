import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { API_KEY_PROVIDER_IDS, PROVIDER_CATALOG } from '../../config/providerCatalog';
import { DEFAULT_MODELS, PROVIDER_DEFAULTS } from '../../webview/settings/scripts/constants';
import { ProviderConfig } from '../../webview/settings/components/config/ProviderConfig';
import { ProviderIcon } from '../../webview/settings/components/ProviderIcon';

function readRepoFile(relativePath: string): string {
    const absolutePath = path.join(process.cwd(), relativePath);
    return fs.readFileSync(absolutePath, { encoding: 'utf8' });
}

suite('Ollama Cloud Integration Checklist', () => {
    test('Settings schema exposes Ollama Cloud keys and provider enum', () => {
        const packageJsonRaw = readRepoFile('package.json');
        const pkg = JSON.parse(packageJsonRaw) as any;

        const apiProviderEnum: unknown = pkg?.contributes?.configuration?.properties?.['gitmind.apiProvider']?.enum;
        assert.ok(Array.isArray(apiProviderEnum), 'gitmind.apiProvider.enum should be an array');
        assert.ok((apiProviderEnum as unknown[]).includes('ollamacloud'), 'gitmind.apiProvider enum should include ollamacloud');

        const props = pkg?.contributes?.configuration?.properties;
        assert.ok(props?.['gitmind.ollamacloud.apiKey'], 'gitmind.ollamacloud.apiKey should exist in configuration schema');
        assert.ok(props?.['gitmind.ollamacloud.model'], 'gitmind.ollamacloud.model should exist in configuration schema');

        assert.strictEqual(
            props?.['gitmind.ollamacloud.model']?.enum,
            undefined,
            'Ollama Cloud must not duplicate the centralized model list in the editable VS Code settings schema'
        );
    });

    test('Backend provider registry and validation are wired', () => {
        const apiIndex = readRepoFile('src/services/api/index.ts');
        assert.ok(apiIndex.includes("case 'ollamacloud':"), 'API lazy loader should include ollamacloud case');
        assert.ok(PROVIDER_CATALOG.ollamacloud, 'Provider catalog should include ollamacloud entry');
        assert.strictEqual(PROVIDER_CATALOG.ollamacloud.name, 'Ollama Cloud', 'Provider catalog should name Ollama Cloud');

        const validation = readRepoFile('src/services/api/validation.ts');
        assert.ok(validation.includes('validateOllamaCloudAPIKey'), 'Validation should reference validateOllamaCloudAPIKey');
        assert.ok(validation.includes('ollamacloud:'), 'VALIDATOR_CONFIGS should include ollamacloud entry');

        const context = readRepoFile('src/commit-intelligence/context.ts');
        assert.ok(context.includes('ollamacloud: "ollama.com"'), 'Context destination mapping should map ollamacloud to ollama.com');

        const migration = readRepoFile('src/services/migration/SettingsMigrationService.ts');
        assert.ok(migration.includes("'ollamacloud.apiKey'"), 'SettingsMigrationService should know ollamacloud apiKey');
        assert.ok(migration.includes("'ollamacloud.model'"), 'SettingsMigrationService should know ollamacloud model');
    });

    test('Command wiring for model loading exists', () => {
        const commandsTs = readRepoFile('src/commands/index.ts');
        assert.ok(
            commandsTs.includes('gitmind.loadOllamaCloudModels'),
            'Extension should register gitmind.loadOllamaCloudModels'
        );
        assert.ok(
            commandsTs.includes("handleLoadModels('ollamacloud'"),
            'handleLoadModels should handle ollamacloud'
        );
    });

    test('Settings webview wiring exists (UI + defaults + model list + icon)', () => {
        assert.ok(PROVIDER_DEFAULTS.ollamacloud, 'Webview PROVIDER_DEFAULTS should include ollamacloud');
        assert.strictEqual(
            PROVIDER_DEFAULTS.ollamacloud.model,
            PROVIDER_CATALOG.ollamacloud.defaultModel,
            'Webview default model for ollamacloud should come from the provider catalog'
        );

        assert.deepStrictEqual(
            DEFAULT_MODELS.ollamacloud,
            [...(PROVIDER_CATALOG.ollamacloud.curatedModels ?? [])],
            'Webview DEFAULT_MODELS.ollamacloud should match the curated current models'
        );

        const ollamaCloudProvider = ProviderConfig.getProvider('ollamacloud');
        assert.ok(ollamaCloudProvider, 'ProviderConfig should include ollamacloud provider');

        const fieldIds = new Set((ollamaCloudProvider?.fields ?? []).map(f => f.id));
        assert.ok(fieldIds.has('ollamacloudApiKey'), 'Ollama Cloud provider should have ollamacloudApiKey field');
        assert.ok(fieldIds.has('ollamacloudModel'), 'Ollama Cloud provider should have ollamacloudModel field');

        const modelField = ollamaCloudProvider?.fields.find(f => f.id === 'ollamacloudModel');
        assert.strictEqual(modelField?.loadButtonId, 'loadOllamaCloudModels', 'Ollama Cloud model field should use loadOllamaCloudModels button id');
        assert.strictEqual(Boolean((modelField as any)?.loadButtonDisabled), false, 'Ollama Cloud supports live model discovery');

        const icon = ProviderIcon.renderIcon('ollamacloud');
        assert.match(icon, /provider-icon ollamacloud/, 'ProviderIcon should render dedicated ollamacloud icon');
        assert.doesNotMatch(icon, /provider-icon-placeholder/, 'Ollama Cloud icon must not be a placeholder');
    });

    test('Settings persistence allowlists include Ollama Cloud', () => {
        assert.ok(
            (API_KEY_PROVIDER_IDS as readonly string[]).includes('ollamacloud'),
            'The catalog API-key provider list (used by SettingsManager) should include ollamacloud'
        );
    });

    test('Ollama Cloud limits come from /api/show, not a bundled table', () => {
        const { modelCapabilities } = require('../../services/api/capabilities');
        // A bundled reservation would cap thinking models; every Ollama Cloud model is sized from its reported context.
        assert.strictEqual(modelCapabilities('gpt-oss:120b-cloud').isUnknown, true);
        assert.strictEqual(modelCapabilities('glm-5.3:cloud').isUnknown, true);
    });
});
