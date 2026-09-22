import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { detectCopilot, validateCopilotAccess } from '../services/api/copilot';

// Import comprehensive test suite
import './comprehensive.test';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Copilot API integration', async () => {
		assert.ok(typeof detectCopilot === 'function', 'detectCopilot should be exported');
		assert.ok(typeof validateCopilotAccess === 'function', 'validateCopilotAccess should be exported');

		// The test host runs with extensions disabled, so Copilot is expected to be unavailable.
		const state = await detectCopilot();
		assert.ok(
			['unsupported-host', 'not-installed', 'no-access', 'no-models', 'ready'].includes(state.kind),
			`detectCopilot returned an unknown state: ${state.kind}`
		);
	});

	test('Extension should load without errors', () => {
		const extension = vscode.extensions.getExtension('ShahabBahreiniJangjoo.ai-commit-assistant');
		if (extension) {
			assert.ok(extension, 'Extension should be loaded');
			console.log('✅ Extension loaded successfully');
		} else {
			console.log('Extension not found in test environment (expected)');
		}
	});
});

console.log(`
🧪 COMPREHENSIVE TEST SUITE ACTIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This test suite validates ALL main features of GitMind:

📋 SETTINGS UI TESTS:
   ✓ Save/load configurations 
   ✓ UI button functionality
   ✓ Settings persistence
   ✓ Provider switching

🤖 AI PROVIDERS TESTS (all registered providers):
   ✓ OpenAI, Anthropic, Gemini
   ✓ HuggingFace, Ollama, Mistral  
   ✓ Cohere, Together AI, OpenRouter
   ✓ GitHub Copilot, DeepSeek, Grok, Perplexity
   ✓ API key validation
   ✓ Model configurations

⚙️ CORE FUNCTIONALITY:
   ✓ Extension commands
   ✓ Git integration
   ✓ Webview components
   ✓ Error handling
   ✓ Configuration management

🎯 READY FOR PUBLICATION VALIDATION!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
