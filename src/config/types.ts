import * as vscode from "vscode";

// Core types
export type ApiProvider = "gemini" | "huggingface" | "ollama" | "mistral" | "cohere" | "openai" | "together" | "openrouter" | "anthropic" | "minimax" | "copilot" | "deepseek" | "grok" | "groq" | "perplexity" | "zai" | "nvidia" | "custom";
export type CommitStyle =
    | 'basic'
    | 'conventional'
    | 'conventional-no-scope'
    | 'angular'
    | 'ember'
    | 'emojigit'
    | 'gitmoji'
    | 'semantic'
    | 'commitizen'
    | 'karma'
    | 'linux'
    | 'jquery';

export type TargetCommitLanguage =
    | 'english'
    | 'spanish'
    | 'french'
    | 'german'
    | 'italian'
    | 'portuguese'
    | 'russian'
    | 'chinese'
    | 'japanese'
    | 'korean'
    | 'arabic'
    | 'hindi'
    | 'bengali'
    | 'urdu'
    | 'marathi'
    | 'telugu'
    | 'tamil'
    | 'javanese'
    | 'tagalog'
    | 'punjabi'
    | 'kannada'
    | 'gujarati'
    | 'bhojpuri'
    | 'turkish'
    | 'dutch'
    | 'polish'
    | 'vietnamese'
    | 'thai'
    | 'swedish'
    | 'danish'
    | 'norwegian'
    | 'finnish'
    | 'greek'
    | 'hebrew'
    | 'persian'
    | 'ukrainian'
    | 'czech'
    | 'romanian'
    | 'hungarian'
    | 'indonesian'
    | 'malay'
    | 'hausa'
    | 'amharic'
    | 'yoruba'
    | 'igbo'
    | 'oromo'
    | 'somali'
    | 'bulgarian'
    | 'croatian'
    | 'slovak'
    | 'lithuanian'
    | 'latvian'
    | 'estonian'
    | 'albanian'
    | 'armenian'
    | 'georgian'
    | 'kazakh'
    | 'uzbek'
    | 'azerbaijani';

// Model types
export type GeminiModel =
    | "gemini-3.1-pro" | "gemini-3.1-flash" | "gemini-3-flash" | "gemini-3.1-flash-lite"
    | "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-lite";

export type AnthropicModel =
    | "claude-opus-4.7" | "claude-sonnet-4.6" | "claude-haiku-4.5";

export type MiniMaxModel = "MiniMax-M2.7" | "MiniMax-M2.5" | "MiniMax-M2" | "MiniMax-Text-01";

export type KnownCopilotModel =
    | "auto"
    // OpenAI Models
    | "gpt-5.5" | "gpt-5.4" | "o3-pro"
    // Other Models
    | "raptor-mini"
    // Anthropic Models
    | "claude-opus-4.7" | "claude-sonnet-4.6"
    // Google Models
    | "gemini-3.1-pro" | "gemini-3-flash";

export type CopilotModel = KnownCopilotModel | string;

export type DeepSeekModel = "deepseek-v4-pro" | "deepseek-v4-flash";

export type GrokModel =
    | "grok-4.3" | "grok-4.20-0309-reasoning" | "grok-4.20-0309-non-reasoning" | "grok-4.20-multi-agent-0309";

export type GroqModel =
    | "llama-3.1-8b-instant" | "llama-3.3-70b-versatile"
    | "meta-llama/llama-4-scout-17b-16e-instruct";

export type PerplexityModel =
    | "gpt-5.5-computer" | "gpt-5.4-thinking" | "sonar-pro" | "sonar-reasoning-pro";

export type ZaiModel =
    | "glm-5.1" | "glm-5" | "glm-5-turbo"
    | "glm-4.7" | "glm-4.7-flashx" | "glm-4.6" | "glm-4.5"
    | "glm-4.5-x" | "glm-4.5-air" | "glm-4.5-airx"
    | "glm-4-32b-0414-128k" | "glm-4.7-flash" | "glm-4.5-flash";

// Configuration interfaces
export interface BaseProviderConfig {
    enabled: boolean;
    model: string;
}

export interface ApiKeyProviderConfig extends BaseProviderConfig {
    apiKey?: string;
}

export interface CommitConfig {
    style: CommitStyle;
    maxLength: number;
    includeScope: boolean;
    addBulletPoints: boolean;
    verbose: boolean;
    captureAllChanges?: boolean;
    targetLanguage?: TargetCommitLanguage;
    gitmoji?: GitmojiConfig;
}

export interface GitmojiConfig {
    enabled: boolean;
    placement: 'summary' | 'body' | 'both';
    customEmojis?: { [key: string]: string }; // type -> emoji mapping
}

export interface ExtensionConfig {
    provider: ApiProvider;
    debug: boolean;
    commit: CommitConfig;
    promptCustomization: {
        enabled: boolean;
        saveLastPrompt: boolean;
        lastPrompt: string;
    };
    // Dynamic provider configs
    [key: string]: any;
}

// API Configuration interfaces
export interface BaseApiConfig {
    type: ApiProvider;
    model: string;
}

export interface ApiKeyConfig extends BaseApiConfig {
    apiKey: string;
}

export interface GeminiApiConfig extends BaseApiConfig {
    type: "gemini";
    apiKey?: string;
    model: GeminiModel;
}

export interface HuggingFaceApiConfig extends ApiKeyConfig {
    type: "huggingface";
    temperature: number;
}

export interface OllamaApiConfig extends BaseApiConfig {
    type: "ollama";
    url: string;
}

export interface MistralApiConfig extends ApiKeyConfig {
    type: "mistral";
}

export interface CohereApiConfig extends ApiKeyConfig {
    type: "cohere";
}

export interface OpenAIApiConfig extends ApiKeyConfig {
    type: "openai";
}

export interface TogetherApiConfig extends ApiKeyConfig {
    type: "together";
}

export interface OpenRouterApiConfig extends ApiKeyConfig {
    type: "openrouter";
}

export interface AnthropicApiConfig extends ApiKeyConfig {
    type: "anthropic";
    model: AnthropicModel;
}

export interface MiniMaxApiConfig extends ApiKeyConfig {
    type: "minimax";
    model: MiniMaxModel;
}

export interface CopilotApiConfig extends BaseApiConfig {
    type: "copilot";
    model: CopilotModel;
}

export interface DeepSeekApiConfig extends ApiKeyConfig {
    type: "deepseek";
    model: DeepSeekModel;
}

export interface GrokApiConfig extends ApiKeyConfig {
    type: "grok";
    model: GrokModel;
}

export interface GroqApiConfig extends ApiKeyConfig {
    type: "groq";
    model: GroqModel;
}

export interface PerplexityApiConfig extends ApiKeyConfig {
    type: "perplexity";
    model: PerplexityModel;
}

export interface ZaiApiConfig extends ApiKeyConfig {
    type: "zai";
    model: ZaiModel;
    endpoint?: 'regular' | 'coding';
}

export interface NvidiaApiConfig extends ApiKeyConfig {
    type: "nvidia";
}

export interface CustomApiConfig extends BaseApiConfig {
    type: "custom";
    baseUrl: string;  // IP:Port format
    endpoint: string; // API endpoint path
    authType: "bearer" | "apikey" | "basic" | "none"; // Authentication type
    authToken: string; // Token or key for authentication
    headerKey?: string; // Custom header key for API key auth
    requestFormat: string; // JSON template for request
    responseFormat: string; // Path to extract response from
}

export type ApiConfig =
    | GeminiApiConfig | HuggingFaceApiConfig | OllamaApiConfig | MistralApiConfig
    | CohereApiConfig | OpenAIApiConfig | TogetherApiConfig | OpenRouterApiConfig
    | AnthropicApiConfig | MiniMaxApiConfig | CopilotApiConfig | DeepSeekApiConfig | GrokApiConfig
    | GroqApiConfig | PerplexityApiConfig | ZaiApiConfig | NvidiaApiConfig | CustomApiConfig;

// Response types
export interface HuggingFaceResponse {
    generated_text: string;
}

export interface OllamaResponse {
    response: string;
    done: boolean;
}

export interface MistralResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
        index: number;
        message: {
            role: string;
            tool_calls: null | any;
            content: string;
        };
        finish_reason: string;
    }[];
    usage: {
        prompt_tokens: number;
        total_tokens: number;
        completion_tokens: number;
    };
}

export interface MistralRateLimit {
    reset: number;
    limit: number;
    remaining: number;
    queryCost: number;
    monthlyLimit: number;
    monthlyRemaining: number;
    minuteLimit: number;
    minuteRemaining: number;
    timestamp: number;
}

// Utility types
export interface CommitMessage {
    summary: string;
    description: string;
}

export interface ExtensionState {
    debugChannel: vscode.OutputChannel;
    statusBarItem: vscode.StatusBarItem;
    context?: vscode.ExtensionContext;
}

// Legacy compatibility
export interface ProviderConfig extends BaseProviderConfig {
    apiKey?: string;
    customModel?: string;
    temperature?: number;
    url?: string;
    [key: string]: string | number | boolean | undefined;
}
