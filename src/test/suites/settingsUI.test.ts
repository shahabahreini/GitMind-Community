import * as assert from 'assert';
import * as vscode from 'vscode';
import { SettingsWebview } from '../../webview/settings/SettingsWebview';
import { SettingsManager } from '../../webview/settings/SettingsManager';
import { MessageHandler } from '../../webview/settings/MessageHandler';

suite('Settings UI Tests', () => {
    let mockContext: vscode.ExtensionContext;
    let mockWebviewPanel: vscode.WebviewPanel;

    setup(() => {
        // Mock extension context
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                keys: () => []
            },
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                keys: () => [],
                setKeysForSync: () => { }
            },
            extensionPath: '/mock/path',
            extensionUri: vscode.Uri.file('/mock/path'),
            storagePath: '/mock/storage',
            globalStoragePath: '/mock/global-storage',
            logPath: '/mock/log',
            extensionMode: vscode.ExtensionMode.Test,
            asAbsolutePath: (relativePath: string) => `/mock/path/${relativePath}`,
            storageUri: vscode.Uri.file('/mock/storage'),
            globalStorageUri: vscode.Uri.file('/mock/global-storage'),
            logUri: vscode.Uri.file('/mock/log'),
            secrets: {
                get: () => Promise.resolve(undefined),
                store: () => Promise.resolve(),
                delete: () => Promise.resolve()
            } as any,
            environmentVariableCollection: {} as any,
            extension: {} as any,
            languageModelAccessInformation: {} as any
        };

        // Mock webview panel
        mockWebviewPanel = {
            webview: {
                html: '',
                options: {},
                cspSource: 'mock-csp',
                onDidReceiveMessage: () => ({ dispose: () => { } }),
                postMessage: () => Promise.resolve(true),
                asWebviewUri: (uri: vscode.Uri) => uri
            },
            viewType: 'mock-view',
            title: 'Mock Panel',
            iconPath: undefined,
            onDidDispose: () => ({ dispose: () => { } }),
            onDidChangeViewState: () => ({ dispose: () => { } }),
            reveal: () => { },
            dispose: () => { },
            visible: true,
            active: true,
            viewColumn: vscode.ViewColumn.One
        } as any;
    });

    test('SettingsManager should load current settings correctly', async () => {
        // Mock VS Code configuration
        const mockConfig = {
            get: (key: string, defaultValue?: any) => {
                switch (key) {
                    case 'apiProvider':
                        return 'openai';
                    case 'debug':
                        return false;
                    case 'openai.apiKey':
                        return 'test-api-key';
                    case 'openai.model':
                        return 'gpt-4o';
                    default:
                        return defaultValue;
                }
            },
            update: async () => Promise.resolve(),
            inspect: () => ({ key: '', defaultValue: undefined }),
            has: () => true
        };

        const originalGetConfiguration = vscode.workspace.getConfiguration;
        (vscode.workspace as any).getConfiguration = () => mockConfig;

        try {
            const settingsManager = new SettingsManager();
            const settings = settingsManager.getSettings();

            assert.strictEqual(settings.apiProvider, 'openai');
            assert.strictEqual(settings.debug, false);
            assert.strictEqual(settings.openai.apiKey, 'test-api-key');
            assert.strictEqual(settings.openai.model, 'gpt-4o');
        } finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });

    test('SettingsManager should save settings correctly', async () => {
        let savedSettings: { [key: string]: any } = {};
        const mockConfig = {
            get: (key: string, defaultValue?: any) => savedSettings[key] || defaultValue,
            update: async (key: string, value: any) => {
                savedSettings[key] = value;
                return Promise.resolve();
            },
            inspect: () => ({ key: '', defaultValue: undefined }),
            has: () => true
        };

        const originalGetConfiguration = vscode.workspace.getConfiguration;
        (vscode.workspace as any).getConfiguration = () => mockConfig;

        try {
            const settingsManager = new SettingsManager();
            const testSettings = {
                apiProvider: 'gemini',
                debug: true,
                gemini: {
                    apiKey: 'new-gemini-key',
                    model: 'gemini-2.5-pro'
                },
                openai: {
                    apiKey: '',
                    model: 'gpt-4o'
                },
                // Include all required provider settings
                huggingface: { apiKey: '', model: '' },
                ollama: { url: '', model: '' },
                mistral: { apiKey: '', model: '' },
                cohere: { apiKey: '', model: '' },
                together: { apiKey: '', model: '' },
                openrouter: { apiKey: '', model: '' },
                anthropic: { apiKey: '', model: '' },
                copilot: { model: '' },
                deepseek: { apiKey: '', model: '' },
                grok: { apiKey: '', model: '' },
                perplexity: { apiKey: '', model: '' },
                promptCustomization: {
                    enabled: false,
                    saveLastPrompt: false,
                    lastPrompt: ''
                },
                commit: {
                    verbose: true
                },
                showDiagnostics: false,
                telemetry: {
                    enabled: true
                }
            };

            await SettingsManager.saveSettings(testSettings);

            assert.strictEqual(savedSettings['apiProvider'], 'gemini');
            assert.strictEqual(savedSettings['debug'], true);
            assert.strictEqual(savedSettings['gemini.apiKey'], 'new-gemini-key');
            assert.strictEqual(savedSettings['gemini.model'], 'gemini-2.5-pro');
        } finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });

    test('MessageHandler should handle updateSetting messages', async () => {
        const settingsManager = new SettingsManager();
        const messageHandler = new MessageHandler(settingsManager);

        let updateCalled = false;
        const mockConfig = {
            get: () => 'test-value',
            update: async () => {
                updateCalled = true;
                return Promise.resolve();
            },
            inspect: () => ({ key: '', defaultValue: undefined }),
            has: () => true
        };

        const originalGetConfiguration = vscode.workspace.getConfiguration;
        (vscode.workspace as any).getConfiguration = () => mockConfig;

        try {
            const message = {
                command: 'updateSetting',
                key: 'apiProvider',
                value: 'claude'
            };

            await messageHandler.handleMessage(message);
            assert.strictEqual(updateCalled, true, 'Settings update should be called');
        } finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });

    test('Settings webview should initialize without errors', () => {
        const extensionUri = vscode.Uri.file('/mock/extension/path');

        // This should not throw any errors
        assert.doesNotThrow(() => {
            SettingsWebview.createOrShow(extensionUri);
        });
    });

    test('Settings persistence should work across sessions', async () => {
        const persistentStorage: { [key: string]: any } = {};

        const mockConfig = {
            get: (key: string, defaultValue?: any) => persistentStorage[key] || defaultValue,
            update: async (key: string, value: any) => {
                persistentStorage[key] = value;
                return Promise.resolve();
            },
            inspect: () => ({ key: '', defaultValue: undefined }),
            has: () => true
        };

        const originalGetConfiguration = vscode.workspace.getConfiguration;
        (vscode.workspace as any).getConfiguration = () => mockConfig;

        try {
            // First session - save settings
            const settingsManager1 = new SettingsManager();
            const testSettings = {
                apiProvider: 'anthropic',
                debug: true,
                anthropic: {
                    apiKey: 'test-anthropic-key',
                    model: 'claude-3-5-sonnet-20241022'
                },
                // Include required fields
                gemini: { apiKey: '', model: '' },
                openai: { apiKey: '', model: '' },
                huggingface: { apiKey: '', model: '' },
                ollama: { url: '', model: '' },
                mistral: { apiKey: '', model: '' },
                cohere: { apiKey: '', model: '' },
                together: { apiKey: '', model: '' },
                openrouter: { apiKey: '', model: '' },
                copilot: { model: '' },
                deepseek: { apiKey: '', model: '' },
                grok: { apiKey: '', model: '' },
                perplexity: { apiKey: '', model: '' },
                promptCustomization: {
                    enabled: false,
                    saveLastPrompt: false,
                    lastPrompt: ''
                },
                commit: {
                    verbose: true
                },
                showDiagnostics: false,
                telemetry: {
                    enabled: true
                }
            };

            await SettingsManager.saveSettings(testSettings);

            // Second session - load settings
            const settingsManager2 = new SettingsManager();
            const loadedSettings = settingsManager2.getSettings();

            assert.strictEqual(loadedSettings.apiProvider, 'anthropic');
            assert.strictEqual(loadedSettings.debug, true);
            assert.strictEqual(loadedSettings.anthropic.apiKey, 'test-anthropic-key');
            assert.strictEqual(loadedSettings.anthropic.model, 'claude-3-5-sonnet-20241022');
        } finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });

    test('Settings should validate provider switching', async () => {
        const mockConfig = {
            get: (key: string, defaultValue?: any) => {
                switch (key) {
                    case 'apiProvider':
                        return 'openai';
                    case 'openai.apiKey':
                        return 'openai-key';
                    case 'gemini.apiKey':
                        return 'gemini-key';
                    default:
                        return defaultValue;
                }
            },
            update: async () => Promise.resolve(),
            inspect: () => ({ key: '', defaultValue: undefined }),
            has: () => true
        };

        const originalGetConfiguration = vscode.workspace.getConfiguration;
        (vscode.workspace as any).getConfiguration = () => mockConfig;

        try {
            const settingsManager = new SettingsManager();
            const settings = settingsManager.getSettings();

            // Should load OpenAI as current provider
            assert.strictEqual(settings.apiProvider, 'openai');
            assert.strictEqual(settings.openai.apiKey, 'openai-key');

            // Should also have access to other provider settings
            assert.strictEqual(settings.gemini.apiKey, 'gemini-key');
        } finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });

    test('Settings should handle default values correctly', async () => {
        const mockConfig = {
            get: (key: string, defaultValue?: any) => defaultValue, // Always return default
            update: async () => Promise.resolve(),
            inspect: () => ({ key: '', defaultValue: undefined }),
            has: () => true
        };

        const originalGetConfiguration = vscode.workspace.getConfiguration;
        (vscode.workspace as any).getConfiguration = () => mockConfig;

        try {
            const settingsManager = new SettingsManager();
            const settings = settingsManager.getSettings();

            // Should use default values when no configuration exists
            assert.strictEqual(settings.apiProvider, 'huggingface'); // Default provider
            assert.strictEqual(settings.debug, false);
            assert.strictEqual(settings.gemini.model, 'gemini-2.5-flash-preview-04-17');
            assert.strictEqual(settings.openai.model, 'gpt-4o');
        } finally {
            vscode.workspace.getConfiguration = originalGetConfiguration;
        }
    });
});
