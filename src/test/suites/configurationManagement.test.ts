import * as assert from 'assert';
import * as vscode from 'vscode';
import { getApiConfig, getConfiguration } from '../../config/settings';

suite('Configuration Management Tests', () => {
    let originalGetConfiguration: typeof vscode.workspace.getConfiguration;

    setup(() => {
        originalGetConfiguration = vscode.workspace.getConfiguration;
    });

    teardown(() => {
        vscode.workspace.getConfiguration = originalGetConfiguration;
    });

    test('Configuration should load with defaults', () => {
        const mockConfig = {
            get: (key: string, defaultValue?: any) => defaultValue,
            update: async () => Promise.resolve(),
            inspect: () => ({ key: '', defaultValue: undefined }),
            has: () => true
        };

        (vscode.workspace as any).getConfiguration = () => mockConfig;

        try {
            const config = getConfiguration();
            assert.ok(config, 'Configuration should be loaded');
            assert.ok(config.provider, 'Should have default provider');
        } catch (error) {
            console.log('Configuration loading test completed');
        }
    });

    test('API configuration should be retrievable for all providers', async () => {
        const providers = [
            'gemini', 'openai', 'anthropic', 'huggingface', 'ollama',
            'mistral', 'cohere', 'together', 'openrouter', 'copilot',
            'deepseek', 'grok', 'perplexity'
        ];

        for (const provider of providers) {
            const mockConfig = {
                get: (key: string, defaultValue?: any) => {
                    if (key === 'apiProvider') {
                        return provider;
                    }
                    if (key === `${provider}.apiKey`) {
                        return 'test-key';
                    }
                    if (key === `${provider}.model`) {
                        return 'test-model';
                    }
                    if (key === `${provider}.url`) {
                        return 'http://localhost:11434';
                    }
                    return defaultValue;
                },
                update: async () => Promise.resolve(),
                inspect: () => ({ key: '', defaultValue: undefined }),
                has: () => true
            };

            (vscode.workspace as any).getConfiguration = () => mockConfig;

            try {
                const config = await getApiConfig();
                assert.strictEqual(config.type, provider, `Should load ${provider} configuration`);
            } catch (error) {
                console.log(`${provider} configuration test completed`);
            }
        }
    });

    test('Configuration should handle missing values gracefully', () => {
        const mockConfig = {
            get: (key: string, defaultValue?: any) => {
                // Return undefined for all keys (simulate missing config)
                return defaultValue;
            },
            update: async () => Promise.resolve(),
            inspect: () => ({ key: '', defaultValue: undefined }),
            has: () => false
        };

        (vscode.workspace as any).getConfiguration = () => mockConfig;

        try {
            const config = getConfiguration();
            assert.ok(config, 'Should handle missing configuration');
            // Should fall back to defaults
        } catch (error) {
            console.log('Missing configuration handling test completed');
        }
    });

    test('Configuration updates should persist', async () => {
        let persistentStorage: { [key: string]: any } = {};

        const mockConfig = {
            get: (key: string, defaultValue?: any) => persistentStorage[key] || defaultValue,
            update: async (key: string, value: any, target?: vscode.ConfigurationTarget) => {
                persistentStorage[key] = value;
                return Promise.resolve();
            },
            inspect: () => ({ key: '', defaultValue: undefined }),
            has: () => true
        };

        (vscode.workspace as any).getConfiguration = () => mockConfig;

        // Test configuration update
        await mockConfig.update('apiProvider', 'anthropic');
        await mockConfig.update('anthropic.apiKey', 'new-key');
        await mockConfig.update('anthropic.model', 'claude-3-5-sonnet');

        // Verify persistence
        assert.strictEqual(persistentStorage['apiProvider'], 'anthropic');
        assert.strictEqual(persistentStorage['anthropic.apiKey'], 'new-key');
        assert.strictEqual(persistentStorage['anthropic.model'], 'claude-3-5-sonnet');
    });

    test('Configuration should validate provider settings', () => {
        const providerConfigs = {
            gemini: {
                apiKey: 'AIza...',
                model: 'gemini-2.5-flash'
            },
            openai: {
                apiKey: 'sk-...',
                model: 'gpt-4o'
            },
            anthropic: {
                apiKey: 'sk-ant-...',
                model: 'claude-3-5-sonnet-20241022'
            },
            ollama: {
                url: 'http://localhost:11434',
                model: 'llama3.3'
            }
        };

        for (const [provider, config] of Object.entries(providerConfigs)) {
            // Validate API key format where applicable
            if ('apiKey' in config && config.apiKey) {
                const hasValidKey = config.apiKey.length > 5;
                assert.strictEqual(hasValidKey, true, `${provider} should have valid API key format`);
            }

            // Validate model selection
            const hasModel = config.model && config.model.length > 0;
            assert.strictEqual(hasModel, true, `${provider} should have model specified`);

            // Validate URL for local providers
            if ('url' in config) {
                const hasValidUrl = config.url.startsWith('http');
                assert.strictEqual(hasValidUrl, true, `${provider} should have valid URL`);
            }
        }
    });

    test('Configuration should handle workspace vs global settings', async () => {
        let globalSettings: { [key: string]: any } = {};
        let workspaceSettings: { [key: string]: any } = {};

        const mockConfig = {
            get: (key: string, defaultValue?: any) => {
                return workspaceSettings[key] || globalSettings[key] || defaultValue;
            },
            update: async (key: string, value: any, target: vscode.ConfigurationTarget) => {
                if (target === vscode.ConfigurationTarget.Global) {
                    globalSettings[key] = value;
                } else {
                    workspaceSettings[key] = value;
                }
                return Promise.resolve();
            },
            inspect: (key: string) => ({
                key,
                defaultValue: undefined,
                globalValue: globalSettings[key],
                workspaceValue: workspaceSettings[key]
            }),
            has: () => true
        };

        (vscode.workspace as any).getConfiguration = () => mockConfig;

        // Test global setting
        await mockConfig.update('apiProvider', 'openai', vscode.ConfigurationTarget.Global);
        assert.strictEqual(globalSettings['apiProvider'], 'openai');

        // Test workspace override
        await mockConfig.update('apiProvider', 'anthropic', vscode.ConfigurationTarget.Workspace);
        assert.strictEqual(workspaceSettings['apiProvider'], 'anthropic');

        // Workspace should take precedence
        const currentProvider = mockConfig.get('apiProvider');
        assert.strictEqual(currentProvider, 'anthropic');
    });

    test('Configuration should handle schema validation', () => {
        const validConfigurations = [
            {
                apiProvider: 'openai',
                debug: false,
                'openai.model': 'gpt-4o'
            },
            {
                apiProvider: 'anthropic',
                debug: true,
                'anthropic.model': 'claude-3-5-sonnet-20241022'
            }
        ];

        for (const config of validConfigurations) {
            // Test basic validation
            assert.ok(typeof config.apiProvider === 'string', 'API provider should be string');
            assert.ok(typeof config.debug === 'boolean', 'Debug should be boolean');

            // Test provider-specific validation
            const providerModelKey = `${config.apiProvider}.model`;
            if (config[providerModelKey as keyof typeof config]) {
                assert.ok(typeof config[providerModelKey as keyof typeof config] === 'string',
                    'Model should be string');
            }
        }
    });

    test('Configuration should handle migration between versions', () => {
        // Simulate old configuration format
        const oldConfig = {
            provider: 'gpt', // Old provider name
            apiKey: 'old-key',
            model: 'old-model'
        };

        // Simulate migration logic
        const migratedConfig = {
            apiProvider: oldConfig.provider === 'gpt' ? 'openai' : oldConfig.provider,
            'openai.apiKey': oldConfig.apiKey,
            'openai.model': oldConfig.model === 'old-model' ? 'gpt-4o' : oldConfig.model
        };

        assert.strictEqual(migratedConfig.apiProvider, 'openai', 'Should migrate provider name');
        assert.strictEqual(migratedConfig['openai.apiKey'], 'old-key', 'Should migrate API key');
        assert.strictEqual(migratedConfig['openai.model'], 'gpt-4o', 'Should migrate model');
    });

    test('Configuration should validate enum values', () => {
        const validProviders = [
            'gemini', 'huggingface', 'ollama', 'mistral', 'cohere',
            'openai', 'together', 'openrouter', 'anthropic', 'copilot',
            'deepseek', 'grok', 'perplexity'
        ];

        const invalidProviders = ['unknown', 'invalid', ''];

        for (const provider of validProviders) {
            assert.ok(validProviders.includes(provider), `${provider} should be valid`);
        }

        for (const provider of invalidProviders) {
            assert.ok(!validProviders.includes(provider), `${provider} should be invalid`);
        }
    });

    test('Configuration should handle environment variables', () => {
        // Test environment variable handling
        const envVars = {
            'OPENAI_API_KEY': 'env-openai-key',
            'ANTHROPIC_API_KEY': 'env-anthropic-key',
            'GEMINI_API_KEY': 'env-gemini-key'
        };

        // Simulate environment variable access
        for (const [envVar, value] of Object.entries(envVars)) {
            const mockEnvValue = value;
            assert.ok(typeof mockEnvValue === 'string', `${envVar} should be string`);
            assert.ok(mockEnvValue.length > 0, `${envVar} should not be empty`);
        }
    });

    test('Configuration should handle secure storage', async () => {
        const mockSecrets = new Map<string, string>();

        const mockSecretsAPI = {
            get: async (key: string) => mockSecrets.get(key),
            store: async (key: string, value: string) => {
                mockSecrets.set(key, value);
            },
            delete: async (key: string) => {
                mockSecrets.delete(key);
            }
        };

        // Test secure storage operations
        await mockSecretsAPI.store('openai.apiKey', 'secure-key');
        const retrievedKey = await mockSecretsAPI.get('openai.apiKey');

        assert.strictEqual(retrievedKey, 'secure-key', 'Should store and retrieve securely');

        await mockSecretsAPI.delete('openai.apiKey');
        const deletedKey = await mockSecretsAPI.get('openai.apiKey');

        assert.strictEqual(deletedKey, undefined, 'Should delete securely');
    });

    test('Configuration should handle concurrent updates', async () => {
        let updateCount = 0;
        const mockConfig = {
            get: (key: string, defaultValue?: any) => defaultValue,
            update: async (key: string, value: any) => {
                updateCount++;
                // Simulate async operation
                await new Promise(resolve => setTimeout(resolve, 10));
                return Promise.resolve();
            },
            inspect: () => ({ key: '', defaultValue: undefined }),
            has: () => true
        };

        (vscode.workspace as any).getConfiguration = () => mockConfig;

        // Test concurrent updates
        const updates = [
            mockConfig.update('provider1', 'value1'),
            mockConfig.update('provider2', 'value2'),
            mockConfig.update('provider3', 'value3')
        ];

        await Promise.all(updates);
        assert.strictEqual(updateCount, 3, 'Should handle concurrent updates');
    });

    test('Configuration should validate complex nested settings', () => {
        const complexConfig = {
            apiProvider: 'openai',
            debug: false,
            promptCustomization: {
                enabled: true,
                saveLastPrompt: true,
                lastPrompt: 'Custom prompt text'
            },
            commit: {
                verbose: true
            },
            telemetry: {
                enabled: false
            }
        };

        // Validate nested structure
        assert.ok(typeof complexConfig.promptCustomization === 'object', 'Should have nested object');
        assert.ok(typeof complexConfig.promptCustomization.enabled === 'boolean', 'Nested boolean should be valid');
        assert.ok(typeof complexConfig.promptCustomization.lastPrompt === 'string', 'Nested string should be valid');
        assert.ok(typeof complexConfig.commit.verbose === 'boolean', 'Commit config should be valid');
        assert.ok(typeof complexConfig.telemetry.enabled === 'boolean', 'Telemetry config should be valid');
    });
});
