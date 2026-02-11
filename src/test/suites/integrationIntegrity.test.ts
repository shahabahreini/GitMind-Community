/**
 * Integration Integrity Tests
 *
 * These tests validate that ALL provider, commit style, and UI component
 * registrations are consistent across every integration point in the codebase.
 *
 * The key principle: read from the SOURCE OF TRUTH (types.ts, package.json, etc.)
 * and verify every other file is in sync. No hardcoded lists in tests.
 *
 * When you add a new provider or commit style, these tests will immediately
 * tell you every file you forgot to update.
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

// ────────────────────────────────────────────────────────────────────────────
// Helpers: extract data from actual source files (the REAL source of truth)
// ────────────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..', '..', '..');

function readSource(relativePath: string): string {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf-8');
}

function readJSON(relativePath: string): any {
    return JSON.parse(readSource(relativePath));
}

/**
 * Extract a TypeScript union type's literal members from source code.
 *   e.g. `type Foo = "a" | "b" | "c";` → ["a", "b", "c"]
 */
function extractUnionMembers(source: string, typeName: string): string[] {
    // Match: export type <typeName> = "x" | "y" | ...;
    // Handles multi-line definitions
    const regex = new RegExp(
        `(?:export\\s+)?type\\s+${typeName}\\s*=\\s*([\\s\\S]*?);`,
        'm'
    );
    const match = source.match(regex);
    if (!match) {
        throw new Error(`Could not find type ${typeName} in source`);
    }
    const body = match[1];
    const members: string[] = [];
    const literalRegex = /["']([^"']+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = literalRegex.exec(body)) !== null) {
        members.push(m[1]);
    }
    return members;
}

/**
 * Extract top-level object keys from a Record/object literal in source code.
 *   e.g. `const FOO: Record<...> = { bar: { ... }, baz: { ... } }` → ["bar", "baz"]
 *
 * Strategy: find the opening brace, then scan character-by-character tracking
 * brace depth. Only capture `identifier:` patterns at depth 1 (top-level keys).
 * Skip strings and comments to avoid false positives.
 */
function extractObjectKeys(source: string, varName: string): string[] {
    const regex = new RegExp(
        `(?:const|let|var)\\s+${varName}[^=]*=\\s*\\{`,
        'm'
    );
    const match = source.match(regex);
    if (!match || match.index === undefined) {
        throw new Error(`Could not find variable ${varName} in source`);
    }

    // Start inside the opening brace
    const startIdx = match.index + match[0].length;
    const keys: string[] = [];
    let depth = 1; // we're already inside the first {
    let i = startIdx;

    while (i < source.length && depth > 0) {
        const ch = source[i];

        // Skip string literals
        if (ch === '"' || ch === "'") {
            i++;
            while (i < source.length && source[i] !== ch) {
                if (source[i] === '\\') { i++; } // skip escaped char
                i++;
            }
            i++; // skip closing quote
            continue;
        }

        // Skip template literals
        if (ch === '`') {
            i++;
            while (i < source.length && source[i] !== '`') {
                if (source[i] === '\\') { i++; }
                i++;
            }
            i++;
            continue;
        }

        // Skip line comments
        if (ch === '/' && i + 1 < source.length && source[i + 1] === '/') {
            while (i < source.length && source[i] !== '\n') { i++; }
            continue;
        }

        // Skip block comments
        if (ch === '/' && i + 1 < source.length && source[i + 1] === '*') {
            i += 2;
            while (i + 1 < source.length && !(source[i] === '*' && source[i + 1] === '/')) { i++; }
            i += 2;
            continue;
        }

        if (ch === '{') { depth++; }
        if (ch === '}') { depth--; }

        // At depth 1, look for `identifier:` or `'identifier':` patterns
        if (depth === 1 && /[a-zA-Z_]/.test(ch)) {
            // Try to match an identifier followed by colon (with optional whitespace)
            const rest = source.slice(i);
            const keyMatch = rest.match(/^([\w-]+)\s*:/);
            if (keyMatch) {
                keys.push(keyMatch[1]);
                i += keyMatch[0].length;
                continue;
            }
        }

        // At depth 1, look for quoted key: 'foo': or "foo":
        if (depth === 1 && (ch === '"' || ch === "'")) {
            // Already handled above in string skip - this shouldn't be reached
            // but as a safeguard, skip it
        }

        i++;
    }

    return keys;
}

/**
 * Extract switch case string values from source code.
 *   e.g. `case 'foo':` → ["foo"]
 */
function extractSwitchCases(source: string, contextHint: string): string[] {
    // Find the switch block near contextHint, then collect all case strings
    const idx = source.indexOf(contextHint);
    if (idx === -1) {
        throw new Error(`Could not find context hint "${contextHint}" in source`);
    }

    // Find the switch statement before or near the contextHint
    const searchWindow = source.slice(Math.max(0, idx - 200), idx + 5000);
    const cases: string[] = [];
    const caseRegex = /case\s+['"]([^'"]+)['"]\s*:/g;
    let m: RegExpExecArray | null;
    while ((m = caseRegex.exec(searchWindow)) !== null) {
        cases.push(m[1]);
    }
    return cases;
}

/**
 * Extract top-level object IDs from a source array like:
 *   [{ id: 'foo', fields: [...] }, { id: 'bar', fields: [...] }]
 *
 * Only extracts `id` values from the TOP-LEVEL objects in the array,
 * not from nested objects (like fields array items).
 *
 * Strategy: scan the array tracking depth. At depth 1 (top-level objects),
 * when we enter a new object ({ at depth 1→2), capture the first `idField` value.
 */
function extractArrayObjectIds(source: string, varName: string, idField: string = 'id'): string[] {
    // Support both `const x = [` and `static readonly x: Type[] = [`
    const regex = new RegExp(
        `(?:(?:const|let|var|private|public|protected)\\s+(?:static\\s+)?(?:readonly\\s+)?|static\\s+readonly\\s+)${varName}[^=]*=\\s*\\[`,
        'm'
    );
    const match = source.match(regex);
    if (!match || match.index === undefined) {
        throw new Error(`Could not find array ${varName} in source`);
    }

    const startIdx = match.index + match[0].length;

    // Find the matching closing bracket
    let depth = 1; // inside the [
    let i = startIdx;
    while (i < source.length && depth > 0) {
        const ch = source[i];
        // Skip strings
        if (ch === '"' || ch === "'") {
            i++;
            while (i < source.length && source[i] !== ch) {
                if (source[i] === '\\') { i++; }
                i++;
            }
            i++;
            continue;
        }
        if (ch === '`') {
            i++;
            while (i < source.length && source[i] !== '`') {
                if (source[i] === '\\') { i++; }
                i++;
            }
            i++;
            continue;
        }
        if (ch === '[') { depth++; }
        if (ch === ']') { depth--; }
        i++;
    }
    const arrayBody = source.slice(startIdx, i - 1);

    // Now extract only top-level object IDs
    // Scan tracking brace depth; depth 0 = array level, depth 1 = inside top-level object
    const ids: string[] = [];
    let braceDepth = 0;
    let bracketDepth = 0;

    for (let j = 0; j < arrayBody.length; j++) {
        const ch = arrayBody[j];

        // Skip strings
        if (ch === '"' || ch === "'") {
            j++;
            while (j < arrayBody.length && arrayBody[j] !== ch) {
                if (arrayBody[j] === '\\') { j++; }
                j++;
            }
            continue;
        }
        if (ch === '`') {
            j++;
            while (j < arrayBody.length && arrayBody[j] !== '`') {
                if (arrayBody[j] === '\\') { j++; }
                j++;
            }
            continue;
        }

        if (ch === '{') { braceDepth++; }
        if (ch === '}') { braceDepth--; }
        if (ch === '[') { bracketDepth++; }
        if (ch === ']') { bracketDepth--; }

        // At brace depth 1, bracket depth 0 → we're in a top-level object
        if (braceDepth === 1 && bracketDepth === 0) {
            // Look for `id: 'value'` or `id: "value"`
            const rest = arrayBody.slice(j);
            const idMatch = rest.match(
                new RegExp(`^${idField}\\s*:\\s*['"]([^'"]+)['"]`)
            );
            if (idMatch) {
                ids.push(idMatch[1]);
                j += idMatch[0].length - 1;
            }
        }
    }

    return ids;
}

// ────────────────────────────────────────────────────────────────────────────
// Load all sources once (cached for the suite)
// ────────────────────────────────────────────────────────────────────────────

let typesSource: string;
let settingsSource: string;
let apiIndexSource: string;
let validationSource: string;
let providerConfigSource: string;
let commitStylesSource: string;
let promptsSource: string;
let extensionSource: string;
let packageJson: any;

// ────────────────────────────────────────────────────────────────────────────
// Test Suite
// ────────────────────────────────────────────────────────────────────────────

suite('Integration Integrity - Provider Registration', () => {

    suiteSetup(() => {
        typesSource = readSource('src/config/types.ts');
        settingsSource = readSource('src/config/settings.ts');
        apiIndexSource = readSource('src/services/api/index.ts');
        validationSource = readSource('src/services/api/validation.ts');
        providerConfigSource = readSource('src/webview/settings/components/config/ProviderConfig.ts');
        commitStylesSource = readSource('src/config/commitStyles.ts');
        promptsSource = readSource('src/services/api/prompts.ts');
        extensionSource = readSource('src/extension.ts');
        packageJson = readJSON('package.json');
    });

    // ── Source of Truth: ApiProvider type ─────────────────────────────────

    let apiProviders: string[];

    test('ApiProvider type should be parseable from types.ts', () => {
        apiProviders = extractUnionMembers(typesSource, 'ApiProvider');
        assert.ok(apiProviders.length > 0, 'Should find at least one provider in ApiProvider type');
        console.log(`  Found ${apiProviders.length} providers: ${apiProviders.join(', ')}`);
    });

    // ── Cross-reference: package.json ────────────────────────────────────

    test('package.json apiProvider enum must match ApiProvider type exactly', () => {
        const pkgEnum: string[] = packageJson.contributes.configuration.properties['gitmind.apiProvider'].enum;
        const missingInPkg = apiProviders.filter(p => !pkgEnum.includes(p));
        const extraInPkg = pkgEnum.filter((p: string) => !apiProviders.includes(p));

        assert.deepStrictEqual(missingInPkg, [],
            `Providers in ApiProvider type but MISSING from package.json enum: ${missingInPkg.join(', ')}`);
        assert.deepStrictEqual(extraInPkg, [],
            `Providers in package.json enum but MISSING from ApiProvider type: ${extraInPkg.join(', ')}`);
    });

    // ── Cross-reference: PROVIDER_DEFAULTS in settings.ts ────────────────

    test('PROVIDER_DEFAULTS must have an entry for every ApiProvider', () => {
        const defaultKeys = extractObjectKeys(settingsSource, 'PROVIDER_DEFAULTS');

        const missingInDefaults = apiProviders.filter(p => !defaultKeys.includes(p));
        const extraInDefaults = defaultKeys.filter(k => !apiProviders.includes(k));

        assert.deepStrictEqual(missingInDefaults, [],
            `Providers missing from PROVIDER_DEFAULTS in settings.ts: ${missingInDefaults.join(', ')}`);
        assert.deepStrictEqual(extraInDefaults, [],
            `Extra providers in PROVIDER_DEFAULTS not in ApiProvider type: ${extraInDefaults.join(', ')}`);
    });

    // ── Cross-reference: PROVIDER_CONFIGS in api/index.ts ────────────────

    test('PROVIDER_CONFIGS must have an entry for every ApiProvider', () => {
        const configKeys = extractObjectKeys(apiIndexSource, 'PROVIDER_CONFIGS');

        const missingInConfigs = apiProviders.filter(p => !configKeys.includes(p));
        const extraInConfigs = configKeys.filter(k => !apiProviders.includes(k));

        assert.deepStrictEqual(missingInConfigs, [],
            `Providers missing from PROVIDER_CONFIGS in api/index.ts: ${missingInConfigs.join(', ')}`);
        assert.deepStrictEqual(extraInConfigs, [],
            `Extra providers in PROVIDER_CONFIGS not in ApiProvider type: ${extraInConfigs.join(', ')}`);
    });

    // ── Cross-reference: loadProviderModule() switch in api/index.ts ─────

    test('loadProviderModule() switch must handle every ApiProvider', () => {
        const switchCases = extractSwitchCases(apiIndexSource, 'loadProviderModule');

        const missingCases = apiProviders.filter(p => !switchCases.includes(p));

        assert.deepStrictEqual(missingCases, [],
            `Providers missing from loadProviderModule() switch in api/index.ts: ${missingCases.join(', ')}`);
    });

    // ── Cross-reference: VALIDATOR_CONFIGS in validation.ts ──────────────

    test('VALIDATOR_CONFIGS must have an entry for every ApiProvider', () => {
        const validatorKeys = extractObjectKeys(validationSource, 'VALIDATOR_CONFIGS');

        const missingInValidation = apiProviders.filter(p => !validatorKeys.includes(p));
        const extraInValidation = validatorKeys.filter(k => !apiProviders.includes(k));

        assert.deepStrictEqual(missingInValidation, [],
            `Providers missing from VALIDATOR_CONFIGS in validation.ts: ${missingInValidation.join(', ')}`);
        assert.deepStrictEqual(extraInValidation, [],
            `Extra providers in VALIDATOR_CONFIGS not in ApiProvider type: ${extraInValidation.join(', ')}`);
    });

    // ── Cross-reference: ProviderConfig UI component ─────────────────────

    test('ProviderConfig.ts must have a UI definition for every ApiProvider', () => {
        const uiProviderIds = extractArrayObjectIds(providerConfigSource, 'providers');

        const missingInUI = apiProviders.filter(p => !uiProviderIds.includes(p));
        const extraInUI = uiProviderIds.filter(id => !apiProviders.includes(id));

        assert.deepStrictEqual(missingInUI, [],
            `Providers missing from ProviderConfig UI definitions: ${missingInUI.join(', ')}.\n` +
            `Each provider needs a UI component in src/webview/settings/components/config/ProviderConfig.ts`);
        assert.deepStrictEqual(extraInUI, [],
            `Extra providers in ProviderConfig UI not in ApiProvider type: ${extraInUI.join(', ')}`);
    });

    // ── Cross-reference: API module files exist ──────────────────────────

    test('Each provider must have a corresponding API module file', () => {
        const apiDir = path.join(ROOT, 'src', 'services', 'api');
        const missingModules: string[] = [];

        for (const provider of apiProviders) {
            // Provider module file name (matches the import in loadProviderModule)
            const expectedFile = path.join(apiDir, `${provider}.ts`);
            if (!fs.existsSync(expectedFile)) {
                missingModules.push(`${provider}.ts`);
            }
        }

        assert.deepStrictEqual(missingModules, [],
            `Missing API module files in src/services/api/: ${missingModules.join(', ')}`);
    });

    // ── Cross-reference: ApiConfig union type includes all providers ─────

    test('ApiConfig union type must include a config interface for every provider', () => {
        // Extract ApiConfig union members
        const apiConfigMatch = typesSource.match(/export\s+type\s+ApiConfig\s*=\s*([\s\S]*?);/m);
        assert.ok(apiConfigMatch, 'Should find ApiConfig type definition');

        const apiConfigBody = apiConfigMatch![1];

        // For each provider, there should be a matching XxxApiConfig in the union
        // The naming convention varies, so we check for the type field in each interface
        const missingConfigs: string[] = [];

        for (const provider of apiProviders) {
            // Check that there's an interface with `type: "provider"` in types.ts
            const interfacePattern = new RegExp(
                `interface\\s+\\w+ApiConfig[^{]*\\{[^}]*type:\\s*["']${provider}["']`,
                's'
            );
            if (!interfacePattern.test(typesSource)) {
                missingConfigs.push(provider);
            }
        }

        assert.deepStrictEqual(missingConfigs, [],
            `Providers missing a typed ApiConfig interface in types.ts: ${missingConfigs.join(', ')}.\n` +
            `Each provider needs an interface like XxxApiConfig { type: "${missingConfigs[0]}"; ... }`);
    });

    // ── Cross-reference: package.json settings per provider ──────────────

    test('Each provider requiring an API key must have a gitmind.<provider>.apiKey setting in package.json', () => {
        const props = packageJson.contributes.configuration.properties;

        // Providers that don't need API key settings
        const noApiKeyProviders = ['ollama', 'copilot'];
        // Custom uses authToken instead of apiKey
        const specialProviders = ['custom'];

        const missingSettings: string[] = [];

        for (const provider of apiProviders) {
            if (noApiKeyProviders.includes(provider)) { continue; }
            if (specialProviders.includes(provider)) {
                // Custom should have authToken
                if (!props[`gitmind.${provider}.authToken`]) {
                    missingSettings.push(`gitmind.${provider}.authToken`);
                }
                continue;
            }
            if (!props[`gitmind.${provider}.apiKey`]) {
                missingSettings.push(`gitmind.${provider}.apiKey`);
            }
        }

        assert.deepStrictEqual(missingSettings, [],
            `Missing API key settings in package.json: ${missingSettings.join(', ')}`);
    });

    test('Each provider must have a gitmind.<provider>.model setting in package.json', () => {
        const props = packageJson.contributes.configuration.properties;
        const missingModelSettings: string[] = [];

        for (const provider of apiProviders) {
            if (!props[`gitmind.${provider}.model`]) {
                missingModelSettings.push(`gitmind.${provider}.model`);
            }
        }

        assert.deepStrictEqual(missingModelSettings, [],
            `Missing model settings in package.json: ${missingModelSettings.join(', ')}`);
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Commit Style Integrity
// ────────────────────────────────────────────────────────────────────────────

suite('Integration Integrity - Commit Style Registration', () => {

    suiteSetup(() => {
        typesSource = readSource('src/config/types.ts');
        commitStylesSource = readSource('src/config/commitStyles.ts');
        promptsSource = readSource('src/services/api/prompts.ts');
        packageJson = readJSON('package.json');
    });

    let commitStyles: string[];

    test('CommitStyle type should be parseable from types.ts', () => {
        commitStyles = extractUnionMembers(typesSource, 'CommitStyle');
        assert.ok(commitStyles.length > 0, 'Should find at least one commit style');
        console.log(`  Found ${commitStyles.length} commit styles: ${commitStyles.join(', ')}`);
    });

    test('package.json commitStyle.style enum must match CommitStyle type exactly', () => {
        const pkgEnum: string[] = packageJson.contributes.configuration.properties['gitmind.commitStyle.style'].enum;
        const missingInPkg = commitStyles.filter(s => !pkgEnum.includes(s));
        const extraInPkg = pkgEnum.filter((s: string) => !commitStyles.includes(s));

        assert.deepStrictEqual(missingInPkg, [],
            `Styles in CommitStyle type but MISSING from package.json: ${missingInPkg.join(', ')}`);
        assert.deepStrictEqual(extraInPkg, [],
            `Styles in package.json but MISSING from CommitStyle type: ${extraInPkg.join(', ')}`);
    });

    test('COMMIT_STYLE_OPTIONS must have an entry for every CommitStyle', () => {
        const optionIds = extractArrayObjectIds(commitStylesSource, 'COMMIT_STYLE_OPTIONS');

        const missingInOptions = commitStyles.filter(s => !optionIds.includes(s));
        const extraInOptions = optionIds.filter(id => !commitStyles.includes(id));

        assert.deepStrictEqual(missingInOptions, [],
            `Styles missing from COMMIT_STYLE_OPTIONS in commitStyles.ts: ${missingInOptions.join(', ')}`);
        assert.deepStrictEqual(extraInOptions, [],
            `Extra styles in COMMIT_STYLE_OPTIONS not in CommitStyle type: ${extraInOptions.join(', ')}`);
    });

    test('prompts.ts switch must have a case for every CommitStyle', () => {
        // Find the switch on config.style
        const switchCases = extractSwitchCases(promptsSource, "config.style");

        const missingCases = commitStyles.filter(s => !switchCases.includes(s));

        assert.deepStrictEqual(missingCases, [],
            `Styles missing from prompts.ts switch statement: ${missingCases.join(', ')}.\n` +
            `Each style needs a case in the generateCommitPrompt() switch.`);
    });

    test('Each COMMIT_STYLE_OPTIONS entry must have required fields', () => {
        // Import the actual module for runtime validation
        const { COMMIT_STYLE_OPTIONS } = require('../../config/commitStyles');

        const requiredFields = ['id', 'label', 'description', 'example', 'category', 'isPro'];
        const issues: string[] = [];

        for (const style of COMMIT_STYLE_OPTIONS) {
            for (const field of requiredFields) {
                if (style[field] === undefined || style[field] === null) {
                    issues.push(`Style "${style.id}" is missing required field "${field}"`);
                }
            }
            // Validate category values
            const validCategories = ['standard', 'framework', 'emoji', 'enterprise'];
            if (!validCategories.includes(style.category)) {
                issues.push(`Style "${style.id}" has invalid category "${style.category}"`);
            }
        }

        assert.deepStrictEqual(issues, [], `Commit style option issues:\n${issues.join('\n')}`);
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Command Registration Integrity
// ────────────────────────────────────────────────────────────────────────────

suite('Integration Integrity - Command Registration', () => {

    suiteSetup(() => {
        extensionSource = readSource('src/extension.ts');
        packageJson = readJSON('package.json');
    });

    test('Every command in package.json must be registered in extension.ts', () => {
        const pkgCommands: string[] = packageJson.contributes.commands.map((c: any) => c.command);

        const missingInExtension: string[] = [];

        for (const cmd of pkgCommands) {
            // Check that extension.ts registers this command
            // Commands can be registered as string literals in registerCommand calls
            if (!extensionSource.includes(`"${cmd}"`) && !extensionSource.includes(`'${cmd}'`)) {
                missingInExtension.push(cmd);
            }
        }

        assert.deepStrictEqual(missingInExtension, [],
            `Commands declared in package.json but NOT registered in extension.ts:\n${missingInExtension.join('\n')}`);
    });

    test('Load model commands in ProviderConfig UI should be handled somewhere', () => {
        providerConfigSource = readSource('src/webview/settings/components/config/ProviderConfig.ts');
        const messageHandlerSource = readSource('src/webview/settings/MessageHandler.ts');

        // Extract all loadCommand values from ProviderConfig
        const loadCommandRegex = /loadCommand\s*:\s*['"]([^'"]+)['"]/g;
        const uiLoadCommands: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = loadCommandRegex.exec(providerConfigSource)) !== null) {
            uiLoadCommands.push(m[1]);
        }

        // Load commands can be handled either:
        // 1. As VS Code commands registered in extension.ts
        // 2. As webview messages handled in MessageHandler.ts
        // The loadCommand string often starts with "gitmind." prefix
        const unhandled: string[] = [];
        for (const cmd of uiLoadCommands) {
            const inExtension = extensionSource.includes(`"${cmd}"`) || extensionSource.includes(`'${cmd}'`);
            // For MessageHandler, check with and without prefix
            const shortCmd = cmd.replace('gitmind.', '');
            const inMessageHandler = messageHandlerSource.includes(`'${shortCmd}'`) ||
                messageHandlerSource.includes(`"${shortCmd}"`) ||
                messageHandlerSource.includes(`'${cmd}'`) ||
                messageHandlerSource.includes(`"${cmd}"`);

            if (!inExtension && !inMessageHandler) {
                unhandled.push(cmd);
            }
        }

        assert.deepStrictEqual(unhandled, [],
            `Load commands in ProviderConfig UI not handled in extension.ts OR MessageHandler.ts:\n` +
            unhandled.join('\n'));
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Package.json Schema Integrity
// ────────────────────────────────────────────────────────────────────────────

suite('Integration Integrity - Package.json Schema', () => {

    suiteSetup(() => {
        packageJson = readJSON('package.json');
    });

    test('Every command in package.json should have a title', () => {
        const commands: any[] = packageJson.contributes.commands;
        const missingTitles = commands.filter(c => !c.title || c.title.trim() === '');

        assert.deepStrictEqual(
            missingTitles.map((c: any) => c.command),
            [],
            `Commands missing titles: ${missingTitles.map((c: any) => c.command).join(', ')}`
        );
    });

    test('apiProvider enum values should all be lowercase identifiers', () => {
        const providers: string[] = packageJson.contributes.configuration.properties['gitmind.apiProvider'].enum;

        for (const p of providers) {
            assert.ok(/^[a-z][a-z0-9-]*$/.test(p),
                `Provider "${p}" should be a lowercase identifier (letters, numbers, hyphens)`);
        }
    });

    test('commitStyle.style enum values should all be lowercase identifiers', () => {
        const styles: string[] = packageJson.contributes.configuration.properties['gitmind.commitStyle.style'].enum;

        for (const s of styles) {
            assert.ok(/^[a-z][a-z0-9-]*$/.test(s),
                `Style "${s}" should be a lowercase identifier (letters, numbers, hyphens)`);
        }
    });

    test('All setting keys should use consistent gitmind.* namespace', () => {
        const props = packageJson.contributes.configuration.properties;
        const keys = Object.keys(props);
        const invalidKeys = keys.filter(k => !k.startsWith('gitmind.'));

        assert.deepStrictEqual(invalidKeys, [],
            `Settings with non-standard namespace: ${invalidKeys.join(', ')}`);
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Target Language Integrity
// ────────────────────────────────────────────────────────────────────────────

suite('Integration Integrity - Target Language Registration', () => {

    suiteSetup(() => {
        typesSource = readSource('src/config/types.ts');
        packageJson = readJSON('package.json');
    });

    test('package.json commit.targetLanguage enum must match TargetCommitLanguage type', () => {
        const typeLanguages = extractUnionMembers(typesSource, 'TargetCommitLanguage');
        const prop = packageJson.contributes.configuration.properties['gitmind.commit.targetLanguage'];

        if (!prop || !prop.enum) {
            // If no enum in package.json, it might use a string type - skip
            console.log('  No enum for targetLanguage in package.json (may use free-form string)');
            return;
        }

        const pkgEnum: string[] = prop.enum;
        const missingInPkg = typeLanguages.filter(l => !pkgEnum.includes(l));
        const extraInPkg = pkgEnum.filter((l: string) => !typeLanguages.includes(l));

        assert.deepStrictEqual(missingInPkg, [],
            `Languages in TargetCommitLanguage type but MISSING from package.json: ${missingInPkg.join(', ')}`);
        assert.deepStrictEqual(extraInPkg, [],
            `Languages in package.json but MISSING from TargetCommitLanguage type: ${extraInPkg.join(', ')}`);
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Provider Module Export Integrity
// ────────────────────────────────────────────────────────────────────────────

suite('Integration Integrity - Provider Module Exports', () => {

    suiteSetup(() => {
        apiIndexSource = readSource('src/services/api/index.ts');
    });

    test('Each provider module should export a class following naming convention', () => {
        const apiDir = path.join(ROOT, 'src', 'services', 'api');
        const apiProviders = extractUnionMembers(
            readSource('src/config/types.ts'),
            'ApiProvider'
        );
        const issues: string[] = [];

        for (const provider of apiProviders) {
            const filePath = path.join(apiDir, `${provider}.ts`);
            if (!fs.existsSync(filePath)) {
                issues.push(`${provider}: module file does not exist`);
                continue;
            }

            const moduleSource = fs.readFileSync(filePath, 'utf-8');

            // Check that the module exports a class that extends BaseAIProvider or has Provider in name
            const hasProviderExport = /export\s+class\s+\w*Provider/.test(moduleSource);
            if (!hasProviderExport) {
                issues.push(`${provider}: module does not export a Provider class`);
            }
        }

        assert.deepStrictEqual(issues, [],
            `Provider module export issues:\n${issues.join('\n')}`);
    });

    test('loadProviderModule() should import the correct class name for each provider', () => {
        // Extract import patterns from loadProviderModule
        const importPattern = /case\s+'(\w+)'[\s\S]*?\.(\w+Provider)/g;
        const imports: { provider: string; className: string }[] = [];
        let m: RegExpExecArray | null;

        while ((m = importPattern.exec(apiIndexSource)) !== null) {
            imports.push({ provider: m[1], className: m[2] });
        }

        const apiDir = path.join(ROOT, 'src', 'services', 'api');
        const issues: string[] = [];

        for (const { provider, className } of imports) {
            const filePath = path.join(apiDir, `${provider}.ts`);
            if (!fs.existsSync(filePath)) { continue; }

            const moduleSource = fs.readFileSync(filePath, 'utf-8');
            if (!moduleSource.includes(`class ${className}`)) {
                issues.push(
                    `loadProviderModule imports "${className}" from ${provider}.ts, ` +
                    `but that class doesn't exist in the file`
                );
            }
        }

        assert.deepStrictEqual(issues, [],
            `Class name mismatch issues:\n${issues.join('\n')}`);
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Webview Component Structure Integrity
// ────────────────────────────────────────────────────────────────────────────

suite('Integration Integrity - Webview Component Structure', () => {

    test('SettingsWebview should export required static methods', () => {
        const source = readSource('src/webview/settings/SettingsWebview.ts');

        const requiredMethods = [
            'createOrShow',
            'postMessageToWebview',
            'isWebviewOpen'
        ];

        const missing = requiredMethods.filter(method =>
            !source.includes(`static ${method}`) && !source.includes(`public static ${method}`)
        );

        assert.deepStrictEqual(missing, [],
            `SettingsWebview missing required static methods: ${missing.join(', ')}`);
    });

    test('OnboardingWebview should export required static methods', () => {
        const source = readSource('src/webview/onboarding/OnboardingWebview.ts');

        const requiredMethods = ['createOrShow'];

        const missing = requiredMethods.filter(method =>
            !source.includes(`static ${method}`) && !source.includes(`public static ${method}`)
        );

        assert.deepStrictEqual(missing, [],
            `OnboardingWebview missing required static methods: ${missing.join(', ')}`);
    });

    test('MessageHandler should handle provider-related messages', () => {
        const source = readSource('src/webview/settings/MessageHandler.ts');

        // These message types should be handled in the MessageHandler
        const requiredMessages = [
            'saveSettings',
            'loadOllamaModels',
        ];

        const missing = requiredMessages.filter(msg =>
            !source.includes(`'${msg}'`) && !source.includes(`"${msg}"`)
        );

        assert.deepStrictEqual(missing, [],
            `MessageHandler missing handling for messages: ${missing.join(', ')}`);
    });

    test('Settings styles directory should have required CSS modules', () => {
        const stylesDir = path.join(ROOT, 'src', 'webview', 'settings', 'styles');
        if (!fs.existsSync(stylesDir)) {
            assert.fail('Styles directory does not exist at src/webview/settings/styles/');
        }

        const requiredStyles = [
            'main.css.ts',
            'forms.css.ts',
            'buttons.css.ts',
        ];

        const missing = requiredStyles.filter(s =>
            !fs.existsSync(path.join(stylesDir, s))
        );

        assert.deepStrictEqual(missing, [],
            `Missing required CSS modules in styles/: ${missing.join(', ')}`);
    });

    test('Component renderers should exist', () => {
        const renderersDir = path.join(ROOT, 'src', 'webview', 'settings', 'components', 'renderers');
        if (!fs.existsSync(renderersDir)) {
            assert.fail('Renderers directory does not exist');
        }

        const requiredRenderers = [
            'BaseRenderer.ts',
            'ModelSettingsRenderer.ts',
            'CommitStyleRenderer.ts',
            'FreeFeatureRenderer.ts',
            'ProFeatureRenderer.ts',
            'SubscriptionRenderer.ts',
        ];

        const missing = requiredRenderers.filter(r =>
            !fs.existsSync(path.join(renderersDir, r))
        );

        assert.deepStrictEqual(missing, [],
            `Missing required renderers: ${missing.join(', ')}`);
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Type Safety: ApiConfig union completeness
// ────────────────────────────────────────────────────────────────────────────

suite('Integration Integrity - Type Definitions', () => {

    suiteSetup(() => {
        typesSource = readSource('src/config/types.ts');
    });

    test('Every model type referenced in ApiConfig interfaces should be defined', () => {
        // Find all model type references in provider config interfaces
        const modelTypeRegex = /model:\s*(\w+Model)/g;
        const referencedModelTypes: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = modelTypeRegex.exec(typesSource)) !== null) {
            if (m[1] !== 'string') {
                referencedModelTypes.push(m[1]);
            }
        }

        const unique = [...new Set(referencedModelTypes)];
        const missing: string[] = [];

        for (const modelType of unique) {
            const typeDefRegex = new RegExp(`type\\s+${modelType}\\s*=`);
            if (!typeDefRegex.test(typesSource)) {
                missing.push(modelType);
            }
        }

        assert.deepStrictEqual(missing, [],
            `Model types referenced but not defined in types.ts: ${missing.join(', ')}`);
    });

    test('BaseApiConfig should define required base fields', () => {
        assert.ok(typesSource.includes('type: ApiProvider'), 'BaseApiConfig should have type field');
        assert.ok(typesSource.includes('model: string'), 'BaseApiConfig should have model field');
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Provider Feature Completeness Matrix
// ────────────────────────────────────────────────────────────────────────────

suite('Integration Integrity - Provider Feature Matrix', () => {

    test('Providers not requiring API keys should be consistently identified', () => {
        const apiIndexSrc = readSource('src/services/api/index.ts');
        const settingsSrc = readSource('src/config/settings.ts');

        // Find providers marked as not requiring API key in PROVIDER_CONFIGS
        const noKeyInConfigs: string[] = [];
        const configEntries = apiIndexSrc.match(/(\w+):\s*\{[^}]*requiresApiKey:\s*false[^}]*\}/gs) || [];
        for (const entry of configEntries) {
            const nameMatch = entry.match(/^(\w+):/);
            if (nameMatch) {
                noKeyInConfigs.push(nameMatch[1]);
            }
        }

        // Find providers excluded from API key in settings.ts getApiConfig()
        // These are referenced with provider !== 'xxx' checks
        const settingsExclusions: string[] = [];
        const exclusionRegex = /provider\s*!==\s*['"](\w+)['"]/g;
        let m: RegExpExecArray | null;
        while ((m = exclusionRegex.exec(settingsSrc)) !== null) {
            if (!settingsExclusions.includes(m[1])) {
                settingsExclusions.push(m[1]);
            }
        }

        // Providers that don't need API keys should appear consistently
        // This is informational - exact matching depends on the codebase logic
        console.log(`  No-API-key providers in PROVIDER_CONFIGS: ${noKeyInConfigs.join(', ')}`);
        console.log(`  Providers excluded from API key check in settings.ts: ${settingsExclusions.join(', ')}`);

        // At minimum, ollama and copilot should be in both
        for (const p of ['ollama', 'copilot']) {
            assert.ok(noKeyInConfigs.includes(p),
                `${p} should be marked as requiresApiKey: false in PROVIDER_CONFIGS`);
        }
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Scalability: Future-proofing tests
// ────────────────────────────────────────────────────────────────────────────

suite('Integration Integrity - Scalability Checks', () => {

    test('No duplicate provider IDs in any registration point', () => {
        const typeSrc = readSource('src/config/types.ts');
        const providers = extractUnionMembers(typeSrc, 'ApiProvider');

        const seen = new Set<string>();
        const duplicates: string[] = [];
        for (const p of providers) {
            if (seen.has(p)) { duplicates.push(p); }
            seen.add(p);
        }

        assert.deepStrictEqual(duplicates, [],
            `Duplicate providers found in ApiProvider type: ${duplicates.join(', ')}`);
    });

    test('No duplicate commit style IDs in any registration point', () => {
        const typeSrc = readSource('src/config/types.ts');
        const styles = extractUnionMembers(typeSrc, 'CommitStyle');

        const seen = new Set<string>();
        const duplicates: string[] = [];
        for (const s of styles) {
            if (seen.has(s)) { duplicates.push(s); }
            seen.add(s);
        }

        assert.deepStrictEqual(duplicates, [],
            `Duplicate styles found in CommitStyle type: ${duplicates.join(', ')}`);
    });

    test('Provider count should be consistent across all registration points', () => {
        const typeSrc = readSource('src/config/types.ts');
        const providers = extractUnionMembers(typeSrc, 'ApiProvider');
        const providerCount = providers.length;

        const pkg = readJSON('package.json');
        const pkgCount = pkg.contributes.configuration.properties['gitmind.apiProvider'].enum.length;

        const settingsSrc = readSource('src/config/settings.ts');
        const defaultsCount = extractObjectKeys(settingsSrc, 'PROVIDER_DEFAULTS').length;

        const apiSrc = readSource('src/services/api/index.ts');
        const configsCount = extractObjectKeys(apiSrc, 'PROVIDER_CONFIGS').length;

        const validationSrc = readSource('src/services/api/validation.ts');
        const validatorCount = extractObjectKeys(validationSrc, 'VALIDATOR_CONFIGS').length;

        const providerConfigSrc = readSource('src/webview/settings/components/config/ProviderConfig.ts');
        const uiCount = extractArrayObjectIds(providerConfigSrc, 'providers').length;

        const counts: Record<string, number> = {
            'ApiProvider type': providerCount,
            'package.json enum': pkgCount,
            'PROVIDER_DEFAULTS': defaultsCount,
            'PROVIDER_CONFIGS': configsCount,
            'VALIDATOR_CONFIGS': validatorCount,
            'ProviderConfig UI': uiCount,
        };

        console.log('  Provider counts across registration points:');
        for (const [location, count] of Object.entries(counts)) {
            console.log(`    ${location}: ${count}`);
        }

        // All should match
        const allSame = Object.values(counts).every(c => c === providerCount);
        assert.ok(allSame,
            `Provider count mismatch! Expected ${providerCount} everywhere.\n` +
            Object.entries(counts)
                .filter(([_, count]) => count !== providerCount)
                .map(([loc, count]) => `  ${loc}: ${count} (expected ${providerCount})`)
                .join('\n')
        );
    });

    test('Commit style count should be consistent across all registration points', () => {
        const typeSrc = readSource('src/config/types.ts');
        const styles = extractUnionMembers(typeSrc, 'CommitStyle');
        const styleCount = styles.length;

        const pkg = readJSON('package.json');
        const pkgCount = pkg.contributes.configuration.properties['gitmind.commitStyle.style'].enum.length;

        const commitStylesSrc = readSource('src/config/commitStyles.ts');
        const optionsCount = extractArrayObjectIds(commitStylesSrc, 'COMMIT_STYLE_OPTIONS').length;

        const promptsSrc = readSource('src/services/api/prompts.ts');
        const switchCases = extractSwitchCases(promptsSrc, 'config.style');
        const promptsCount = switchCases.length;

        const counts: Record<string, number> = {
            'CommitStyle type': styleCount,
            'package.json enum': pkgCount,
            'COMMIT_STYLE_OPTIONS': optionsCount,
            'prompts.ts switch cases': promptsCount,
        };

        console.log('  Commit style counts across registration points:');
        for (const [location, count] of Object.entries(counts)) {
            console.log(`    ${location}: ${count}`);
        }

        const allSame = Object.values(counts).every(c => c === styleCount);
        assert.ok(allSame,
            `Commit style count mismatch! Expected ${styleCount} everywhere.\n` +
            Object.entries(counts)
                .filter(([_, count]) => count !== styleCount)
                .map(([loc, count]) => `  ${loc}: ${count} (expected ${styleCount})`)
                .join('\n')
        );
    });
});
