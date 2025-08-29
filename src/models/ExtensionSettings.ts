// src/models/ExtensionSettings.ts
export interface ExtensionSettings {
    apiProvider: string;
    debug?: boolean;
    showDiagnostics?: boolean;
    // Privacy and Analytics Settings
    telemetry?: {
        enabled: boolean;
    };
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
    deepseek: {
        apiKey: string;
        model: string;
    };
    grok: {
        apiKey: string;
        model: string;
    };
    perplexity: {
        apiKey: string;
        model: string;
    };
    custom: {
        baseUrl: string;
        endpoint: string;
        authType: "bearer" | "apikey" | "basic" | "none";
        authToken: string;
        headerKey?: string;
        requestFormat: string;
        responseFormat: string;
        model: string;
        enabled: boolean;
    };
    promptCustomization: {
        enabled: boolean;
        saveLastPrompt: boolean;
        lastPrompt: string;
    };
    commit?: {
        verbose: boolean;
    };
    commitStyle?: {
        style: string;  // 'basic' | 'conventional' | 'angular' | 'ember' | 'emojigit' | 'gitmoji' | 'semantic' | 'commitizen' | 'karma' | 'linux' | 'jquery'
    };
    // Pro Features Settings
    pro?: {
        encryptionEnabled?: boolean;
        licenseKey?: string;
        orderId?: string;
        instanceId?: string;
        validationStatus?: 'valid' | 'invalid' | 'expired' | 'error';
        lastValidation?: string;
        largeDiffHandling?: {
            enabled: boolean;
            chunkSize: number;  // Size of each chunk in lines
            maxChunks: number;  // Maximum number of chunks to process
        };
        commitBodyOptions?: {
            enabled: boolean;
            maxLines: number;  // Maximum number of lines in commit message body
        };
        commitLengthOptions?: {
            enabled: boolean;
            maxLength: number;  // Maximum length of commit message summary line
        };
        learnFromCommitHistory?: {
            enabled: boolean;
            maxCommits: number;  // Maximum number of commits to analyze
            includeAuthorInfo: boolean;  // Whether to include author info in the analysis
        };
    };
    // Subscription Settings (Lemon Squeezy)
    subscription?: {
        email?: string;
        plan?: string;
        status?: string;
        lastChecked?: string;
        isActive?: boolean;
        isPaused?: boolean;
        isExpired?: boolean;
    };
}
