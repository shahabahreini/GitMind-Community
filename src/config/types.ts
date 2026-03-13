import * as vscode from "vscode";

// Core types
export type ApiProvider = "gemini" | "huggingface" | "ollama" | "mistral" | "cohere" | "openai" | "together" | "openrouter" | "anthropic" | "minimax" | "copilot" | "deepseek" | "grok" | "perplexity" | "zai" | "custom";
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
    | "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-lite" | "gemini-2.0-flash";

export type AnthropicModel =
    | "claude-opus-4.6" | "claude-sonnet-4.6" | "claude-haiku-4.5";

export type MiniMaxModel = "MiniMax-M1" | "MiniMax-M2" | "MiniMax-M2.1" | "MiniMax-M2.5" | "MiniMax-Text-01";

export type CopilotModel =
    | "auto"
    // OpenAI Models
    | "gpt-4o" | "gpt-4o-mini"
    | "o3-mini" | "o4-mini"
    // Anthropic Models
    | "claude-3.5-sonnet" | "claude-3.7-sonnet" | "claude-sonnet-4"
    // Google Models
    | "gemini-2.5-pro" | "gemini-2.0-flash";

export type DeepSeekModel = "deepseek-chat" | "deepseek-reasoner";

export type GrokModel =
    | "grok-4" | "grok-4-fast-reasoning" | "grok-4-fast-non-reasoning" | "grok-code-fast-1"
    | "grok-3" | "grok-3-mini"
    | "grok-2-1212" | "grok-2-vision-1212";

export type PerplexityModel =
    | "sonar" | "sonar-pro" | "sonar-reasoning" | "sonar-reasoning-pro" | "sonar-deep-research";

export type ZaiModel =
    | "glm-4-plus" | "glm-4-air" | "glm-4-flash"
    | "glm-4.5" | "glm-4.5-air"
    | "glm-4.6" | "glm-4.7" | "glm-5";

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

export interface PerplexityApiConfig extends ApiKeyConfig {
    type: "perplexity";
    model: PerplexityModel;
}

export interface ZaiApiConfig extends ApiKeyConfig {
    type: "zai";
    model: ZaiModel;
    endpoint?: 'regular' | 'coding';
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
    | PerplexityApiConfig | ZaiApiConfig | CustomApiConfig;

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