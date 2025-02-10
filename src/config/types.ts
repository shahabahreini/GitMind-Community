// types.ts

import * as vscode from "vscode";

// Provider types
export type ApiProvider = "gemini" | "huggingface" | "ollama";
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
}

// API responses
export interface HuggingFaceResponse {
    generated_text: string;
}

export interface OllamaResponse {
    response: string;
    done: boolean;
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
    apiKey: string;
}

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

export type ApiConfig = GeminiApiConfig | HuggingFaceApiConfig | OllamaApiConfig;
