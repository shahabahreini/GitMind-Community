import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { isCopilotAvailable, validateCopilotAccess } from '../services/api/copilot';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Copilot API integration', async () => {
		// Test that the Copilot API functions are properly exported
		assert.ok(typeof isCopilotAvailable === 'function', 'isCopilotAvailable should be exported');
		assert.ok(typeof validateCopilotAccess === 'function', 'validateCopilotAccess should be exported');

		// Test that the functions can be called (though actual functionality depends on VS Code environment)
		try {
			const isAvailable = await isCopilotAvailable();
			assert.ok(typeof isAvailable === 'boolean', 'isCopilotAvailable should return a boolean');
		} catch (error) {
			// Expected in test environment where language models may not be available
			console.log('Copilot availability check failed in test environment (expected)', error);
		}
	});
});
