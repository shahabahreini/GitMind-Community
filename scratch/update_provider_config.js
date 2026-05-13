const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/webview/settings/components/config/ProviderConfig.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Gemini options
content = content.replace(/options:\s*\[[\s\S]*?group: 'Gemini 2\.5 Series' \}\s*\]/m, `options: [
                        { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro' },
                        { value: 'gemini-3.1-flash', label: 'Gemini 3.1 Flash' },
                        { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' }
                    ]`);

// Replace OpenAI options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*'gpt-5\.1'[\s\S]*?group:\s*'Legacy Models'\s*\}\s*\]/m, `options: [
                        { value: 'gpt-5.5', label: 'GPT-5.5' },
                        { value: 'gpt-5.5-instant', label: 'GPT-5.5 Instant' },
                        { value: 'o3-mini', label: 'o3-mini' },
                        { value: 'gpt-4o', label: 'GPT-4o' },
                        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                        { value: 'o1', label: 'o1' }
                    ]`);

// Replace Anthropic options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*'claude-3-5-sonnet-20241022'[\s\S]*?label:\s*'Claude Instant 1\.2'\s*\}\s*\]/m, `options: [
                        { value: 'claude-opus-4.7', label: 'Claude Opus 4.7' },
                        { value: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
                        { value: 'claude-haiku-4.5', label: 'Claude Haiku 4.5' }
                    ]`);

// Replace MiniMax options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*"MiniMax-M2\.7"[\s\S]*?label:\s*'MiniMax Text-01'\s*\}\s*\]/m, `options: [
                        { value: 'MiniMax-M2.7', label: 'MiniMax M2.7' },
                        { value: 'MiniMax-M2.5', label: 'MiniMax M2.5' },
                        { value: 'MiniMax-M2', label: 'MiniMax M2' },
                        { value: 'MiniMax-Text-01', label: 'MiniMax Text-01' }
                    ]`);

// Replace Copilot options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*'auto'[\s\S]*?label:\s*'Raptor mini'[\s\S]*?\}\s*\]/m, `options: [
                        { value: 'auto', label: 'Auto (Let Copilot choose)' },
                        { value: 'gpt-5.5', label: 'GPT-5.5' },
                        { value: 'gpt-5.5-instant', label: 'GPT-5.5 Instant' },
                        { value: 'o3-mini', label: 'o3-mini' },
                        { value: 'claude-opus-4.7', label: 'Claude Opus 4.7' },
                        { value: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6' },
                        { value: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro' },
                        { value: 'gemini-3.1-flash', label: 'Gemini 3.1 Flash' }
                    ]`);

// Replace Mistral options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*"mistral-small-4"[\s\S]*?label:\s*'Open Mixtral 8x22B'\s*\}\s*\]/m, `options: [
                        { value: 'mistral-large-3', label: 'Mistral Large 3' },
                        { value: 'mistral-medium-3.5', label: 'Mistral Medium 3.5' },
                        { value: 'mistral-small-4', label: 'Mistral Small 4' },
                        { value: 'devstral-2', label: 'Devstral 2' },
                        { value: 'ministral-3', label: 'Ministral 3' }
                    ]`);

// Replace Cohere options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*'command-a-03-2025'[\s\S]*?label:\s*'Command Light'\s*\}\s*\]/m, `options: [
                        { value: 'command-a', label: 'Command A' },
                        { value: 'command-a-reasoning', label: 'Command A Reasoning' },
                        { value: 'command-r-plus-08-2024', label: 'Command R+ (08-2024)' },
                        { value: 'command-r-08-2024', label: 'Command R (08-2024)' }
                    ]`);

// Replace Together options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*'meta-llama\/Llama-3\.3-70B-Instruct-Turbo'[\s\S]*?label:\s*'Nous Hermes 2 Mixtral 8x7B DPO'\s*\}\s*\]/m, `options: [
                        { value: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Instruct Turbo' },
                        { value: 'meta-llama/Llama-3.1-8B-Instruct-Turbo', label: 'Llama 3.1 8B Instruct Turbo' },
                        { value: 'meta-llama/Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B Instruct Turbo' },
                        { value: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free', label: 'DeepSeek R1 Distill 70B' },
                        { value: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen 2.5 72B Instruct Turbo' }
                    ]`);

// Replace OpenRouter options
content = content.replace(/defaultOptions:\s*\[\s*'google\/gemma-3-27b-it:free'[\s\S]*?'qwen\/qwen-2-7b-instruct:free'\s*\]/m, `defaultOptions: [
                        'google/gemma-3-27b-it:free',
                        'openai/gpt-5.5-instant',
                        'openai/o3-mini',
                        'anthropic/claude-sonnet-4.6',
                        'meta-llama/llama-3.3-70b-instruct'
                    ]`);

// Replace DeepSeek options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*"deepseek-v4-flash"[\s\S]*?label:\s*'DeepSeek Reasoner'\s*\}\s*\]/m, `options: [
                        { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
                        { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' }
                    ]`);

// Replace Grok options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*"grok-4\.4"[\s\S]*?label:\s*'Grok-1\.5'\s*\}\s*\]/m, `options: [
                        { value: 'grok-4.3', label: 'Grok 4.3' },
                        { value: 'grok-4.4', label: 'Grok 4.4' },
                        { value: 'grok-4.5', label: 'Grok 4.5' }
                    ]`);

// Replace Groq options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*"meta-llama\/llama-4-scout-17b-16e-instruct"[\s\S]*?label:\s*'GPT-OSS 20B'\s*\}\s*\]/m, `options: [
                        { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
                        { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
                        { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B 16E' }
                    ]`);

// Replace Perplexity options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*'llama-3\.1-sonar-large-128k-online'[\s\S]*?label:\s*'Sonar Small \(Chat\)'\s*\}\s*\]/m, `options: [
                        { value: 'gpt-5.5-computer', label: 'GPT-5.5 Computer' },
                        { value: 'gpt-5.4-thinking', label: 'GPT-5.4 Thinking' },
                        { value: 'sonar-pro', label: 'Sonar Pro' },
                        { value: 'sonar-reasoning-pro', label: 'Sonar Reasoning Pro' }
                    ]`);

// Replace Zai options
content = content.replace(/options:\s*\[\s*\{\s*value:\s*'glm-5'[\s\S]*?label:\s*'GLM-4-32B'\s*\}\s*\]/m, `options: [
                        { value: 'glm-5.1', label: 'GLM 5.1' },
                        { value: 'glm-5v-turbo', label: 'GLM 5V Turbo' },
                        { value: 'glm-5', label: 'GLM 5' },
                        { value: 'glm-5-turbo', label: 'GLM 5 Turbo' }
                    ]`);

fs.writeFileSync(filePath, content);
