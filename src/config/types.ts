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
    | "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-preview" | "gemini-2.5-flash-lite" | "gemini-2.5-flash-lite-preview";

export type AnthropicModel =
    | "claude-opus-4" | "claude-sonnet-4"
    | "claude-3-5-sonnet-20241022" | "claude-3-5-haiku-20241022";

export type MiniMaxModel = "MiniMax-M2" | "MiniMax-M2-Stable";

export type CopilotModel =
    | "auto"
    // OpenAI Models
    | "gpt-4o" | "gpt-4o-mini"
    | "gpt-4.1" | "gpt-5" | "gpt-5-mini" | "gpt-5-codex" | "gpt-5.1" | "gpt-5.1-codex" | "gpt-5.1-codex-mini"
    // Anthropic Models
    | "claude-haiku-4.5" | "claude-opus-4.1" | "claude-sonnet-4" | "claude-sonnet-4.5"
    // Google Models
    | "gemini-2.5-pro" | "gemini-3-pro"
    // Other Models
    | "grok-code-fast-1" | "raptor-mini";

export type DeepSeekModel = "deepseek-chat" | "deepseek-reasoner";

export type GrokModel =
    | "grok-3" | "grok-3-latest" | "grok-3-fast" | "grok-3-fast-latest"
    | "grok-3-mini" | "grok-3-mini-latest" | "grok-3-mini-fast" | "grok-3-mini-fast-latest"
    | "grok-2-vision-1212" | "grok-2-vision" | "grok-2-vision-latest"
    | "grok-2-image-1212" | "grok-2-image" | "grok-2-image-latest"
    | "grok-2-1212" | "grok-2" | "grok-2-latest";

export type PerplexityModel =
    | "sonar-pro" | "sonar-reasoning" | "sonar"
    | "llama-3.1-sonar-small-128k-chat" | "llama-3.1-sonar-large-128k-chat" | "llama-3.1-sonar-huge-128k-online"
    | "llama-3.1-sonar-small-128k-online" | "llama-3.1-sonar-large-128k-online";

export type ZaiModel =
    | "glm-4.7" | "glm-4.6"
    | "glm-4.6v" | "glm-4.6v-flash" | "glm-4.6v-flashx"
    | "glm-4.5" | "glm-4.5v" | "glm-4.5-x"
    | "glm-4.5-flash" | "glm-4.5-air" | "glm-4.5-airx"
    | "glm-4-32b-0414-128k";

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