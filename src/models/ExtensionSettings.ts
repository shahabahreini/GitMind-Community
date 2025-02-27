// src/models/ExtensionSettings.ts
export interface ExtensionSettings {
    apiProvider: string;
    debug: boolean;
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
    commit: {
        verbose: boolean;
    };
}
