# GitMind Custom API Integration Guide

## Overview

GitMind now supports integration with custom API endpoints for AI-powered commit message generation. This **Pro feature** allows you to connect GitMind to your private cloud AI models or other compatible LLM APIs.

## Features

- Connect to any REST API endpoint that provides text generation capabilities
- Support for multiple authentication methods (Bearer token, API Key, Basic Auth, or none)
- Configurable request and response formats to match your API's requirements
- Simple UI for managing your custom API settings
- Pro feature with secure token storage

## Requirements

- GitMind Pro subscription
- A compatible AI service endpoint that accepts text prompts and returns generated text

## Setup Instructions

### 1. Enable the Custom API Provider

1. Open VS Code settings
2. Navigate to GitMind Settings
3. Under API Provider, select "Custom API"
4. Toggle "Enable Custom API" to activate the feature

### 2. Configure Your Endpoint

Configure the following settings:

- **Base URL**: The base URL of your API (e.g., `https://api.example.com`)
- **Endpoint Path**: The path to the API endpoint (e.g., `/v1/completions`)
- **Authentication Type**: Choose from:
  - Bearer Token
  - API Key
  - Basic Auth
  - No Authentication
- **Authentication Token**: Your API key or token
- **Header Key Name** (for API Key auth): The name of the header for API key authentication (e.g., `X-API-Key`)

### 3. Configure Request & Response Formats

- **Request Format**: JSON template for constructing the request body. Use placeholders:
  - `{{model}}`: Will be replaced with the model identifier
  - `{{prompt}}`: Will be replaced with the commit message prompt
  
  Example:
  ```json
  {
    "model": "{{model}}",
    "prompt": "{{prompt}}",
    "max_tokens": 500,
    "temperature": 0.7
  }
  ```

- **Response Format**: JSON path to extract the response text
  - Examples: `choices[0].message.content` or `response.text`
  
- **Model Identifier**: The model identifier to use with your API

### 4. Test Your Connection

Click the "Test Connection" button to verify your configuration.

## Examples

### OpenAI-compatible API

```
Base URL: https://your-private-openai-api.com
Endpoint: /v1/chat/completions
Auth Type: Bearer
Auth Token: your_token_here
Request Format:
{
  "model": "{{model}}",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant that writes clear, concise git commit messages."},
    {"role": "user", "content": "{{prompt}}"}
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
Response Format: choices[0].message.content
Model: your-custom-gpt-4
```

### Custom LLM API

```
Base URL: https://llm.internal-company.com
Endpoint: /api/generate
Auth Type: API Key
Auth Token: your_api_key_here
Header Key: X-API-Token
Request Format:
{
  "input": "{{prompt}}",
  "parameters": {
    "model": "{{model}}",
    "max_length": 500
  }
}
Response Format: result.generated_text
Model: company-llm-v2
```

## Troubleshooting

- **Connection Issues**: Verify that your custom API endpoint is accessible from your development environment
- **Authentication Errors**: Ensure your token/key is valid and the authentication type is correctly set
- **Response Format Errors**: Double-check that the response format path correctly matches your API's response structure
- **Request Format Errors**: Validate your request format JSON template for syntax errors

## Security Notes

- Your authentication credentials are stored securely using VS Code's secure storage
- Pro users can enable encryption for additional security
- Always use secure (HTTPS) endpoints for your API connections

## Limitations

- The custom API must return text in a format that can be parsed as JSON
- The API endpoint must be accessible from your development environment
- Response times may vary based on your custom API's performance
- This feature is only available to GitMind Pro subscribers
