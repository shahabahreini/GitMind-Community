import * as assert from 'assert';
import * as vscode from 'vscode';

import { checkApiSetup } from '../../services/api/validation';

interface MockHeaders {
    get(name: string): string | null;
}

interface MockResponse {
    ok: boolean;
    status: number;
    text(): Promise<string>;
    headers: MockHeaders;
}

function createMockResponse(params: {
    ok: boolean;
    status: number;
    bodyText?: string;
    headers?: Record<string, string>;
}): MockResponse {
    const headerMap = new Map<string, string>();
    for (const [k, v] of Object.entries(params.headers ?? {})) {
        headerMap.set(k.toLowerCase(), v);
    }

    return {
        ok: params.ok,
        status: params.status,
        headers: {
            get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
        },
        text: async () => params.bodyText ?? '',
    };
}

suite('MiniMax API Setup Error Handling', () => {
    let originalGetConfiguration: typeof vscode.workspace.getConfiguration;
    let originalFetch: typeof globalThis.fetch | undefined;

    setup(() => {
        originalGetConfiguration = vscode.workspace.getConfiguration;
        originalFetch = globalThis.fetch;
    });

    teardown(() => {
        vscode.workspace.getConfiguration = originalGetConfiguration;
        globalThis.fetch = originalFetch as typeof globalThis.fetch;
    });

    function setMiniMaxConfig(apiKey: string): void {
        const mockConfig: vscode.WorkspaceConfiguration = {
            get: (key: string, defaultValue?: unknown) => {
                if (key === 'apiProvider') {
                    return 'minimax';
                }
                if (key === 'minimax.apiKey') {
                    return apiKey;
                }
                if (key === 'minimax.model') {
                    return 'MiniMax-M2';
                }
                return defaultValue;
            },
            update: async () => Promise.resolve(),
            inspect: () => ({ key: '', defaultValue: undefined } as any),
            has: () => true,
        } as unknown as vscode.WorkspaceConfiguration;

        (vscode.workspace as any).getConfiguration = () => mockConfig;
    }

    test('checkApiSetup should return actionable invalid-key troubleshooting for MiniMax (401)', async () => {
        setMiniMaxConfig('bad-key');

        globalThis.fetch = (async () =>
            createMockResponse({
                ok: false,
                status: 401,
                bodyText: '{"error":{"message":"invalid_api_key"}}',
            })
        ) as unknown as typeof globalThis.fetch;

        const result = await checkApiSetup();
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.provider, 'minimax');
        assert.strictEqual(result.error, 'Invalid API key');
        assert.ok(result.troubleshooting?.includes('MiniMax'), 'Troubleshooting should mention MiniMax');
        assert.ok(
            result.troubleshooting?.includes('https://platform.minimax.io/docs/api-reference/text-anthropic-api'),
            'Troubleshooting should include MiniMax docs link'
        );
    });

    test('checkApiSetup should return rate-limit troubleshooting for MiniMax (429)', async () => {
        setMiniMaxConfig('some-key');

        globalThis.fetch = (async () =>
            createMockResponse({
                ok: false,
                status: 429,
                bodyText: 'rate_limited',
                headers: { 'retry-after': '12' },
            })
        ) as unknown as typeof globalThis.fetch;

        const result = await checkApiSetup();
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.provider, 'minimax');
        assert.strictEqual(result.error, 'Rate limit exceeded');
        assert.ok(result.troubleshooting?.includes('12'), 'Troubleshooting should include retry-after when provided');
    });

    test('checkApiSetup should surface insufficient balance errors for MiniMax (1008)', async () => {
        setMiniMaxConfig('some-key');

        globalThis.fetch = (async () =>
            createMockResponse({
                ok: false,
                status: 402,
                bodyText:
                    '{"type":"error","error":{"type":"api_error","message":"insufficient balance (1008)"},"request_id":"req"}',
            })
        ) as unknown as typeof globalThis.fetch;

        const result = await checkApiSetup();
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.provider, 'minimax');
        assert.strictEqual(result.error, 'Insufficient balance');
        assert.ok(
            result.troubleshooting?.toLowerCase().includes('top up'),
            'Troubleshooting should instruct user to top up balance'
        );
    });

    test('checkApiSetup should return timeout troubleshooting for MiniMax when fetch throws AbortError', async () => {
        setMiniMaxConfig('some-key');

        globalThis.fetch = (async () => {
            const err = new Error('The operation was aborted');
            (err as any).name = 'AbortError';
            throw err;
        }) as unknown as typeof globalThis.fetch;

        const result = await checkApiSetup();
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.provider, 'minimax');
        assert.strictEqual(result.error, 'Request timed out');
        assert.ok(
            result.troubleshooting?.toLowerCase().includes('timed out'),
            'Troubleshooting should mention timeout'
        );
    });
});
