import * as assert from "assert";
import * as vscode from "vscode";
import { SettingsTemplateGenerator } from "../../webview/settings/SettingsTemplateGenerator";
import vm from "node:vm";

function extractInlineScripts(html: string): string[] {
    const scripts: string[] = [];

    const scriptTagRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    while ((match = scriptTagRegex.exec(html)) !== null) {
        const content = match[1] ?? "";
        if (content.trim().length > 0) {
            scripts.push(content);
        }
    }

    return scripts;
}

suite("Webview Script Compilation", () => {
    test("Settings webview inline scripts should be syntactically valid", () => {
        const mockSettings = {
            apiProvider: "gemini",
            debug: false,
            telemetry: { enabled: false },
            commit: { verbose: true, captureAllChanges: false },
            promptCustomization: { enabled: false },
            gemini: { apiKey: "", model: "gemini-2.5-flash" },
            openai: { apiKey: "", model: "gpt-4o" },
            anthropic: { apiKey: "", model: "claude-3-5-sonnet-20241022" },
            minimax: { apiKey: "", model: "MiniMax-M2" },
            copilot: { model: "auto" },
            ollama: { url: "http://localhost:11434", model: "phi4" },
        } as any;

        const mockWebview = {
            cspSource: "vscode-webview://test",
        } as unknown as vscode.Webview;

        const generator = new SettingsTemplateGenerator(
            mockSettings,
            "nonce",
            mockWebview,
            "0.0.0"
        );

        const html = generator.generateHtml();
        const scripts = extractInlineScripts(html);

        assert.ok(scripts.length > 0, "Expected at least one inline <script> tag in settings HTML");

        for (const [index, scriptContent] of scripts.entries()) {
            try {
                // vm.Script provides better syntax error locations than new Function
                new vm.Script(scriptContent, { filename: `settings-webview-inline-script-${index}.js` });
            } catch (error) {
                const snippet = scriptContent
                    .slice(0, 600)
                    .replace(/\s+/g, " ")
                    .trim();
                const start = scriptContent
                    .slice(0, 120)
                    .replace(/\s+/g, " ")
                    .trim();
                assert.fail(
                    `Inline webview script #${index} is not valid JS: ${error instanceof Error ? error.message : String(error)}\n` +
                    `Start: ${start}\n` +
                    `Snippet: ${snippet}\n` +
                    `Stack: ${error instanceof Error ? error.stack : ''}`
                );
            }
        }
    });
});
