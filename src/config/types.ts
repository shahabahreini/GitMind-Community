// types.ts

import * as vscode from "vscode";

// Provider types
export type ApiProvider = "gemini" | "huggingface" | "ollama" | "mistral" | "cohere" | "openai" | "together" | "openrouter" | "anthropic" | "copilot";
export type CommitStyle = "conventional" | "gitmoji" | "basic";

// Base configurations
export interface ProviderConfig {
    enabled: boolean;
    apiKey?: string;
    model?: string;
    customModel?: string;
    temperature?: number;
    url?: string;
}

export interface CommitConfig {
    style: CommitStyle;
    maxLength: number;
    includeScope: boolean;
    addBulletPoints: boolean;
    verbose: boolean;
}

// Extension configuration
export interface ExtensionConfig {
    provider: ApiProvider;
    debug: boolean;
    gemini: ProviderConfig;
    huggingface: ProviderConfig & {
        temperature: number;
    };
    ollama: ProviderConfig;
    commit: CommitConfig;
    mistral: {
        enabled: boolean;
        apiKey?: string;
        model: string;
    };
    cohere: {
        enabled: boolean;
        apiKey?: string;
        model: string;
    };
    openai: {
        enabled: boolean;
        apiKey?: string;
        model: string;
    };
    together: {
        enabled: boolean;
        apiKey?: string;
        model: string;
    };
    openrouter: {
        enabled: boolean;
        apiKey?: string;
        model: string;
    };
    anthropic: {
        enabled: boolean;
        apiKey?: string;
        model: string;
    };
    copilot: {
        enabled: boolean;
        model: string;
    };
    promptCustomization: {
        enabled: boolean;
    };
}

// API responses
export interface HuggingFaceResponse {
    generated_text: string;
}

export interface OllamaResponse {
    response: string;
    done: boolean;
}

export interface MistralApiConfig extends BaseApiConfig {
    type: "mistral";
    apiKey: string;
    model: string;
}

export interface CohereApiConfig extends BaseApiConfig {
    type: "cohere";
    apiKey: string;
    model: string;
}

export interface AnthropicApiConfig extends BaseApiConfig {
    type: "anthropic";
    apiKey: string;
    model: AnthropicModel;
}

export interface CopilotApiConfig extends BaseApiConfig {
    type: "copilot";
    model: CopilotModel;
}

export interface CopilotApiConfig extends BaseApiConfig {
    type: "copilot";
    model: CopilotModel;
}

// Commit related types
export interface CommitMessage {
    summary: string;
    description: string;
}

// Extension state
export interface ExtensionState {
    debugChannel: vscode.OutputChannel;
    statusBarItem: vscode.StatusBarItem;
    context?: vscode.ExtensionContext;
}

// API configurations
export interface BaseApiConfig {
    type: ApiProvider;
}

export interface GeminiApiConfig extends BaseApiConfig {
    type: "gemini";
    apiKey?: string;
    model: GeminiModel;
}

export interface GeminiProviderConfig {
    enabled: boolean;
    apiKey?: string;
    model: GeminiModel;
}

export type GeminiModel =
    // Latest Models (Recommended)
    | "gemini-2.5-pro"
    | "gemini-2.5-flash"
    | "gemini-2.5-flash-preview-05-20"
    // Gemini 2.0 Series
    | "gemini-2.0-flash"
    | "gemini-2.0-flash-lite"
    // Gemini 1.5 Series
    | "gemini-1.5-flash"
    | "gemini-1.5-flash-8b"
    | "gemini-1.5-pro"
    // Legacy/Preview Models
    | "gemini-2.5-flash-preview-04-17"
    | "gemini-2.5-pro-exp-03-25";

export type AnthropicModel =
    // Claude 4 Series (Latest)
    | "claude-opus-4"
    | "claude-sonnet-4"
    // Claude 3.7 Series  
    | "claude-sonnet-3.7"
    // Claude 3.5 Series
    | "claude-3-5-sonnet-20241022"
    | "claude-3-5-sonnet-20240620"
    | "claude-3-5-haiku-20241022"
    // Claude 3 Series
    | "claude-3-opus-20240229"
    | "claude-3-sonnet-20240229"
    | "claude-3-haiku-20240307";

export type CopilotModel =
    // GPT-4 Series (GitHub Copilot)
    | "gpt-4o"
    | "gpt-4o-mini"
    | "gpt-4"
    | "gpt-4-turbo"
    // GPT-3.5 Series
    | "gpt-3.5-turbo";


export interface HuggingFaceApiConfig extends BaseApiConfig {
    type: "huggingface";
    apiKey: string;
    model: string;
    temperature: number;
}

export interface OllamaApiConfig extends BaseApiConfig {
    type: "ollama";
    url: string;
    model: string;
}

export interface OpenAIApiConfig extends BaseApiConfig {
    type: "openai";
    apiKey: string;
    model: string;
}

export interface TogetherApiConfig extends BaseApiConfig {
    type: "together";
    apiKey: string;
    model: string;
}

export interface OpenRouterApiConfig extends BaseApiConfig {
    type: "openrouter";
    apiKey: string;
    model: string;
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


export type ApiConfig =
    | GeminiApiConfig
    | HuggingFaceApiConfig
    | OllamaApiConfig
    | MistralApiConfig
    | CohereApiConfig
    | OpenAIApiConfig
    | TogetherApiConfig
    | OpenRouterApiConfig
    | AnthropicApiConfig
    | CopilotApiConfig;