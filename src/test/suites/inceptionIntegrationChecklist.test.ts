import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { API_KEY_PROVIDER_IDS, PROVIDER_CATALOG } from '../../config/providerCatalog';
import { DEFAULT_MODELS, PROVIDER_DEFAULTS } from '../../webview/settings/scripts/constants';
import { ProviderConfig } from '../../webview/settings/components/config/ProviderConfig';
import { ProviderIcon } from '../../webview/settings/components/ProviderIcon';
import { modelCapabilities } from '../../services/api/capabilities';
import { filterInceptionModels, InceptionProvider } from '../../services/api/inception';

function readRepoFile(relativePath: string): string {
    const absolutePath = path.join(process.cwd(), relativePath);
    return fs.readFileSync(absolutePath, { encoding: 'utf8' });
}

suite('Inception Labs Integration Checklist', () => {
    test('Settings schema exposes Inception keys and provider enum', () => {
        const packageJsonRaw = readRepoFile('package.json');
        const pkg = JSON.parse(packageJsonRaw) as any;

        const apiProviderEnum: unknown = pkg?.contributes?.configuration?.properties?.['gitmind.apiProvider']?.enum;
        assert.ok(Array.isArray(apiProviderEnum), 'gitmind.apiProvider.enum should be an array');
        assert.ok((apiProviderEnum as unknown[]).includes('inception'), 'gitmind.apiProvider enum should include inception');

        const props = pkg?.contributes?.configuration?.properties;
        assert.ok(props?.['gitmind.inception.apiKey'], 'gitmind.inception.apiKey should exist in configuration schema');
        assert.ok(props?.['gitmind.inception.model'], 'gitmind.inception.model should exist in configuration schema');

        assert.strictEqual(
            props?.['gitmind.inception.model']?.enum,
            undefined,
            'Inception Labs must not duplicate the centralized model list in the editable VS Code settings schema'
        );
    });

    test('Backend provider registry and validation are wired', () => {
        const apiIndex = readRepoFile('src/services/api/index.ts');
        assert.ok(apiIndex.includes("case 'inception':"), 'API lazy loader should include inception case');
        assert.ok(PROVIDER_CATALOG.inception, 'Provider catalog should include inception entry');
        assert.strictEqual(PROVIDER_CATALOG.inception.name, 'Inception', 'Provider catalog should name Inception');

        const validation = readRepoFile('src/services/api/validation.ts');
        assert.ok(validation.includes('validateInceptionAPIKey'), 'Validation should reference validateInceptionAPIKey');
        assert.ok(validation.includes('inception:'), 'VALIDATOR_CONFIGS should include inception entry');

        const context = readRepoFile('src/commit-intelligence/context.ts');
        assert.ok(context.includes('inception: "api.inceptionlabs.ai"'), 'Context destination mapping should map inception to api.inceptionlabs.ai');

        const migration = readRepoFile('src/services/migration/SettingsMigrationService.ts');
        assert.ok(migration.includes("'inception.apiKey'"), 'SettingsMigrationService should know inception apiKey');
        assert.ok(migration.includes("'inception.model'"), 'SettingsMigrationService should know inception model');
    });

    test('Command wiring for model loading exists', () => {
        const commandsTs = readRepoFile('src/commands/index.ts');
        assert.ok(
            commandsTs.includes('gitmind.loadInceptionModels'),
            'Extension should register gitmind.loadInceptionModels'
        );
        assert.ok(
            commandsTs.includes("handleLoadModels('inception'"),
            'handleLoadModels should handle inception'
        );
    });

    test('Settings webview wiring exists (UI + defaults + model list + icon)', () => {
        assert.ok(PROVIDER_DEFAULTS.inception, 'Webview PROVIDER_DEFAULTS should include inception');
        assert.strictEqual(
            PROVIDER_DEFAULTS.inception.model,
            PROVIDER_CATALOG.inception.defaultModel,
            'Webview default model for inception should come from the provider catalog'
        );

        assert.deepStrictEqual(
            DEFAULT_MODELS.inception,
            [...(PROVIDER_CATALOG.inception.curatedModels ?? [])],
            'Webview DEFAULT_MODELS.inception should match the curated current models'
        );

        const inceptionProvider = ProviderConfig.getProvider('inception');
        assert.ok(inceptionProvider, 'ProviderConfig should include inception provider');

        const fieldIds = new Set((inceptionProvider?.fields ?? []).map(f => f.id));
        assert.ok(fieldIds.has('inceptionApiKey'), 'Inception provider should have inceptionApiKey field');
        assert.ok(fieldIds.has('inceptionModel'), 'Inception provider should have inceptionModel field');

        const modelField = inceptionProvider?.fields.find(f => f.id === 'inceptionModel');
        assert.strictEqual(modelField?.loadButtonId, 'loadInceptionModels', 'Inception model field should use loadInceptionModels button id');
        assert.strictEqual(Boolean((modelField as any)?.loadButtonDisabled), false, 'Inception supports live model discovery');

        const icon = ProviderIcon.renderIcon('inception');
        assert.match(icon, /provider-icon inception/, 'ProviderIcon should render dedicated inception icon');
        assert.doesNotMatch(icon, /provider-icon-placeholder/, 'Inception icon must not be a placeholder');
    });

    test('Settings persistence allowlists include Inception', () => {
        assert.ok(
            (API_KEY_PROVIDER_IDS as readonly string[]).includes('inception'),
            'The catalog API-key provider list (used by SettingsManager) should include inception'
        );
    });

    test('Inception provider catalog includes mercury-3 in curated models', () => {
        const curated = PROVIDER_CATALOG.inception.curatedModels;
        assert.ok(curated, 'Inception should have curated models');
        assert.ok(curated.includes('mercury-3'), 'Curated models should include mercury-3');
        assert.strictEqual(curated[0], 'mercury-3', 'mercury-3 should be the first curated model');
    });

    test('Mercury 3 capabilities are registered with 1M context window', () => {
        const caps = modelCapabilities('mercury-3');
        assert.strictEqual(caps.contextTokens, 1000000, 'Mercury 3 contextTokens should be 1,000,000');
        assert.strictEqual(caps.maxOutputTokens, 131072, 'Mercury 3 documented maximum output is 131,072');
        assert.strictEqual(caps.isUnknown, false, 'Mercury 3 should be a known model');
    });

    test('FilterInceptionModels includes mercury-3 and excludes non-chat models', () => {
        const raw = {
            data: [
                { id: 'mercury-3', supported_endpoints: ['chat.completions'] },
                { id: 'mercury-2.5' },
                { id: 'mercury-decide' },
                { id: 'mercury-edit-2' },
            ]
        };
        const models = filterInceptionModels(raw);
        assert.ok(models.includes('mercury-3'), 'filterInceptionModels should include mercury-3');
        assert.ok(models.includes('mercury-2.5'), 'filterInceptionModels should include mercury-2.5');
        assert.ok(!models.includes('mercury-decide'), 'filterInceptionModels should exclude mercury-decide');
        assert.ok(!models.includes('mercury-edit-2'), 'filterInceptionModels should exclude mercury-edit-2');
    });

    test('Inception fallback models include mercury-3 when API returns error', async () => {
        const originalFetch = globalThis.fetch;
        try {
            globalThis.fetch = (async () => new Response('error', { status: 500 })) as typeof globalThis.fetch;
            const provider = new InceptionProvider('test-key', '');
            const models = await provider.getModels();
            assert.ok(models.includes('mercury-3'), 'Fallback models should include mercury-3');
            assert.strictEqual(models[0], 'mercury-3', 'Fallback models should order mercury-3 first');
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
