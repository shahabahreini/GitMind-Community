const fs = require('fs');
const path = require('path');

const openaiPath = path.join(process.cwd(), 'src/services/api/openai.ts');
let openaiContent = fs.readFileSync(openaiPath, 'utf8');

const newConfigs = `{
    "gpt-5.5": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.5-pro": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.4": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.4-pro": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.4-mini": { maxTokens: 2000, temperature: 0.2 },
    "gpt-5.4-nano": { maxTokens: 1000, temperature: 0.2 },
    "gpt-5-mini": { maxTokens: 2000, temperature: 0.2 },
    "gpt-5-nano": { maxTokens: 1000, temperature: 0.2 },
    "gpt-5": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5-pro": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.1": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.2": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.2-pro": { maxTokens: 4000, temperature: 0.2 },
    "gpt-4.1": { maxTokens: 2000, temperature: 0.2 },
    "gpt-4.1-mini": { maxTokens: 1500, temperature: 0.2 },
    "gpt-5.3-codex": { maxTokens: 4000, temperature: 0.2 },
    "gpt-oss-120b": { maxTokens: 2000, temperature: 0.2 },
    "gpt-oss-20b": { maxTokens: 2000, temperature: 0.2 },
    "o3-pro": { maxTokens: 4000, temperature: 0.1, supportsReasoning: true },
    "o3": { maxTokens: 2000, temperature: 0.1, supportsReasoning: true },
    "gpt-4o": { maxTokens: 2000, temperature: 0.2 },
    "gpt-4o-mini": { maxTokens: 1500, temperature: 0.2 },
    "gpt-4": { maxTokens: 2000, temperature: 0.2 },
    "gpt-5.3-chat-latest": { maxTokens: 4000, temperature: 0.2 },
    "gpt-5.2-chat-latest": { maxTokens: 4000, temperature: 0.2 },
    "chat-latest": { maxTokens: 2000, temperature: 0.2 }
};`;

openaiContent = openaiContent.replace(/const MODEL_CONFIGS:\s*Record<string, ModelConfig>\s*=\s*\{[\s\S]*?\};\n/, \`const MODEL_CONFIGS: Record<string, ModelConfig> = \${newConfigs}\\n\`);

// Fix the default fallback in generateResponse if "gpt-5.5-instant" is not present
openaiContent = openaiContent.replace(/MODEL_CONFIGS\["gpt-5.5-instant"\]/g, 'MODEL_CONFIGS["gpt-5.5"]');

fs.writeFileSync(openaiPath, openaiContent);


const constantsPath = path.join(process.cwd(), 'src/webview/settings/scripts/constants.ts');
let constantsContent = fs.readFileSync(constantsPath, 'utf8');

// Update openai provider default
constantsContent = constantsContent.replace(/openai: \{ model: "gpt-5.5-instant" \},/, 'openai: { model: "gpt-5.5" },');

// Update DEFAULT_MODELS for openai
constantsContent = constantsContent.replace(/openai:\s*\[[\s\S]*?\],/m, \`openai: [
    'gpt-5.5',
    'gpt-5.5-pro',
    'gpt-5.4',
    'gpt-5.4-pro',
    'gpt-5.4-mini',
    'gpt-5.4-nano',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-5',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-5.3-codex',
    'gpt-oss-120b',
    'gpt-oss-20b',
    'gpt-5.2',
    'gpt-5.1',
    'gpt-5.2-pro',
    'gpt-5-pro',
    'o3-pro',
    'o3',
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4',
    'gpt-5.3-chat-latest',
    'gpt-5.2-chat-latest',
    'chat-latest'
  ],\`);

// Update copilot
constantsContent = constantsContent.replace(/copilot:\s*\[[\s\S]*?\],/m, \`copilot: [
    'auto',
    'gpt-5.5',
    'gpt-5.4',
    'o3-pro',
    'claude-opus-4.7',
    'claude-sonnet-4.6',
    'gemini-3.1-pro',
    'gemini-3.1-flash'
  ],\`);

fs.writeFileSync(constantsPath, constantsContent);


const typesPath = path.join(process.cwd(), 'src/config/types.ts');
let typesContent = fs.readFileSync(typesPath, 'utf8');
typesContent = typesContent.replace(/\| "gpt-5\.5" \| "gpt-5\.5-instant"\n\s*\| "o3-mini"/m, '| "gpt-5.5" | "gpt-5.4" | "o3-pro"');
fs.writeFileSync(typesPath, typesContent);


const providerConfigPath = path.join(process.cwd(), 'src/webview/settings/components/config/ProviderConfig.ts');
let providerContent = fs.readFileSync(providerConfigPath, 'utf8');

providerContent = providerContent.replace(/options:\s*\[[\s\S]*?label:\s*'o1'\s*\}\s*\]/m, \`options: [
                        { value: 'gpt-5.5', label: 'GPT-5.5' },
                        { value: 'gpt-5.5-pro', label: 'GPT-5.5 Pro' },
                        { value: 'gpt-5.4', label: 'GPT-5.4' },
                        { value: 'gpt-5.4-pro', label: 'GPT-5.4 Pro' },
                        { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini' },
                        { value: 'gpt-5.4-nano', label: 'GPT-5.4 Nano' },
                        { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
                        { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
                        { value: 'gpt-5', label: 'GPT-5' },
                        { value: 'gpt-4.1', label: 'GPT-4.1' },
                        { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
                        { value: 'gpt-5.3-codex', label: 'GPT-5.3 Codex' },
                        { value: 'gpt-oss-120b', label: 'GPT-OSS 120B' },
                        { value: 'gpt-oss-20b', label: 'GPT-OSS 20B' },
                        { value: 'gpt-5.2', label: 'GPT-5.2' },
                        { value: 'gpt-5.1', label: 'GPT-5.1' },
                        { value: 'gpt-5.2-pro', label: 'GPT-5.2 Pro' },
                        { value: 'gpt-5-pro', label: 'GPT-5 Pro' },
                        { value: 'o3-pro', label: 'o3 Pro' },
                        { value: 'o3', label: 'o3' },
                        { value: 'gpt-4o', label: 'GPT-4o' },
                        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                        { value: 'gpt-4', label: 'GPT-4' },
                        { value: 'gpt-5.3-chat-latest', label: 'GPT-5.3 Chat Latest' },
                        { value: 'gpt-5.2-chat-latest', label: 'GPT-5.2 Chat Latest' },
                        { value: 'chat-latest', label: 'Chat Latest' }
                    ]\`);

// And for Copilot in ProviderConfig
providerContent = providerContent.replace(/options:\s*\[[\s\S]*?label:\s*'Auto \(Let Copilot choose\)' \},[\s\S]*?\{ value: 'gpt-5.5-instant'[\s\S]*?label:\s*'Gemini 3.1 Flash' \}\s*\]/m, \`options: [
                        { value: 'auto', label: 'Auto (Let Copilot choose)' },
                        { value: 'gpt-5.5', label: 'GPT-5.5' },
                        { value: 'gpt-5.4', label: 'GPT-5.4' },
                        { value: 'o3-pro', label: 'o3 Pro' },
                        { value: 'claude-opus-4.7', label: 'Claude Opus 4.7' },
                        { value: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
                        { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro' },
                        { value: 'gemini-3.1-flash', label: 'Gemini 3.1 Flash' }
                    ]\`);
fs.writeFileSync(providerConfigPath, providerContent);

// And update OpenRouter Settings to replace gpt-5.5-instant with gpt-5.5
const openRouterPath = path.join(process.cwd(), 'src/webview/settings/components/OpenRouterSettings.ts');
let openRouterContent = fs.readFileSync(openRouterPath, 'utf8');
openRouterContent = openRouterContent.replace(/gpt-5\.5-instant/g, 'gpt-5.5');
fs.writeFileSync(openRouterPath, openRouterContent);

// And OpenRouter array in ProviderConfig
providerContent = fs.readFileSync(providerConfigPath, 'utf8');
providerContent = providerContent.replace(/gpt-5\.5-instant/g, 'gpt-5.5');
fs.writeFileSync(providerConfigPath, providerContent);
