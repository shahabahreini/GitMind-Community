// src/models/ExtensionSettings.ts
export interface ExtensionSettings {
    apiProvider: string;
    debug?: boolean;
    showDiagnostics?: boolean;
    gemini: {
        apiKey: string;
        model: string;
    };
    huggingface: {
        apiKey: string;
        model: string;
    };
    ollama: {
        url: string;
        model: string;
    };
    mistral: {
        apiKey: string;
        model: string;
    };
    cohere: {
        apiKey: string;
        model: string;
    };
    openai: {
        apiKey: string;
        model: string;
    };
    together: {
        apiKey: string;
        model: string;
    };
    openrouter: {
        apiKey: string;
        model: string;
    };
    anthropic: {
        apiKey: string;
        model: string;
    };
    copilot: {
        model: string;
    };
    promptCustomization?: {
        enabled: boolean;
    };
    commit?: {
        verbose: boolean;
    };
}
