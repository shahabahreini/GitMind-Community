import * as vscode from "vscode";

// Core types
export type ApiProvider = "gemini" | "huggingface" | "ollama" | "mistral" | "cohere" | "openai" | "together" | "openrouter" | "anthropic" | "copilot" | "deepseek" | "grok" | "perplexity" | "custom";
export type CommitStyle =
    | 'basic'
    | 'conventional'
    | 'angular'
    | 'ember'
    | 'emojigit'
    | 'gitmoji'
    | 'semantic'
    | 'commitizen'
    | 'karma'
    | 'linux'
    | 'jquery';

// Model types
export type GeminiModel =
    | "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-2.5-flash-preview" | "gemini-2.5-flash-lite" | "gemini-2.5-flash-lite-preview"
    | "gemini-2.0-flash" | "gemini-2.0-flash-lite";

export type AnthropicModel =
    | "claude-opus-4" | "claude-sonnet-4" | "claude-sonnet-3.7"
    | "claude-3-5-sonnet-20241022" | "claude-3-5-sonnet-20240620" | "claude-3-5-haiku-20241022"
    | "claude-3-opus-20240229" | "claude-3-sonnet-20240229" | "claude-3-haiku-20240307";

export type CopilotModel =
    | "auto"
    // OpenAI Models
    | "gpt-3.5-turbo" | "gpt-4" | "gpt-4-turbo" | "gpt-4o" | "gpt-4o-mini"
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
    | AnthropicApiConfig | CopilotApiConfig | DeepSeekApiConfig | GrokApiConfig
    | PerplexityApiConfig | CustomApiConfig;

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
}