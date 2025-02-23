import * as vscode from "vscode";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

let debugChannel: vscode.OutputChannel;
let statusBarItem: vscode.StatusBarItem;

// Interfaces
interface ApiConfig {
  type: "gemini" | "huggingface" | "ollama";
  apiKey?: string;
  model?: string;
  ollamaUrl?: string;
}

interface HuggingFaceResponse {
  generated_text: string;
}

interface OllamaResponse {
  response: string;
  done: boolean;
}

interface CommitMessage {
  summary: string;
  description: string;
}

function debugLog(message: string, data?: any) {
  const config = vscode.workspace.getConfiguration("aiCommitAssistant");
  const isDebugMode = config.get<boolean>("debug") || false;

  if (isDebugMode) {
    const timestamp = new Date().toISOString();
    debugChannel.appendLine(`[${timestamp}] ${message}`);
    if (data) {
      debugChannel.appendLine(JSON.stringify(data, null, 2));
    }
    debugChannel.show(true);
  }
}

async function callOllamaAPI(
  baseUrl: string,
  model: string,
  diff: string
): Promise<string> {
  const prompt = `Generate a detailed commit message for the following changes:

${diff}

Requirements:
1. First line must:
   - Start with one of: feat|fix|docs|style|refactor|test|chore
   - Be under 72 characters
   - Use imperative mood
   - Be technical and to the point

2. Leave one blank line after the first line

3. Write a CONCISE description with optimal bullet points that explains:
   - What and where changes were made
   - Impact of the changes (if neccessary)
   - Avoid buzzwords and jargons, be technical and concise

Format your response EXACTLY as:
<type>: <short description>

- <point 1>
- <point 2 and more if needed>`;

  debugLog("Calling Ollama API", { baseUrl, model });
  debugLog("Prompt:", prompt);

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        // temperature: 0.1,
        // top_p: 0.95,
        system:
          "You are a Git commit message generator that creates clear, concise, and informative Git commit messages based on Git diff output.",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    debugLog("Ollama API Error:", error);
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const result = (await response.json()) as OllamaResponse;
  let cleanedResponse = model.toLowerCase().includes("deepseek")
    ? cleanDeepSeekResponse(result.response)
    : result.response;

  debugLog("Ollama Response (after cleaning):", cleanedResponse);
  return cleanedResponse;
}

async function callHuggingFaceAPI(
  apiKey: string,
  model: string,
  diff: string
): Promise<string> {
  const prompt = `Analyze the following git diff and generate a commit message. The commit message should follow conventional commits format and accurately reflect the type of changes made:

Git Diff:
${diff}

Guidelines:
1. Choose the most appropriate type based on the changes:
   - feat: New features or significant enhancements
   - fix: Bug fixes
   - docs: Documentation changes
   - style: Code style changes (formatting, semicolons, etc)
   - refactor: Code changes that neither fix bugs nor add features
   - test: Adding or modifying tests
   - chore: Changes to build process or auxiliary tools

2. Format:
# Commit Summary
<type>: brief description (max 72 chars)

# Detailed Description
- Point 1
- Point 2
- Point 3 (if needed)`;

  debugLog("Calling Hugging Face API", { model });
  debugLog("Prompt:", prompt);

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 1024,
          //temperature: 0.1,
          top_p: 0.95,
          return_full_text: false,
          do_sample: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    debugLog("Hugging Face API Error:", error);
    throw new Error(`Hugging Face API error: ${response.statusText}`);
  }

  const result = (await response.json()) as
    | HuggingFaceResponse
    | HuggingFaceResponse[];
  const generatedText = Array.isArray(result)
    ? result[0].generated_text
    : result.generated_text;
  debugLog("Hugging Face Response:", generatedText);
  return generatedText;
}

async function processResponse(response: string): Promise<CommitMessage> {
  debugLog("Processing Response:", response);
  try {
    // Clean the response first
    response = response
      .replace(/\*\*/g, "") // Remove all ** markers
      .replace(/`/g, ""); // Remove all ` markers

    const lines = response
      .trim()
      .split("\n")
      .filter((line) => line.trim());

    const summaryPattern =
      /^(feat|fix|docs|style|refactor|test|chore)(\([^)]+\))?:\s+[^\n]+$/i;
    let summary = "";
    let description = "";
    let bulletPoints: string[] = [];
    let foundSummary = false;

    // First pass: find the summary line
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!foundSummary && summaryPattern.test(cleanLine)) {
        // Remove any duplicate type prefixes that might have been added
        summary = cleanLine.replace(/(feat|fix|docs|style|refactor|test|chore):\s*(feat|fix|docs|style|refactor|test|chore):/, '$1:');
        foundSummary = true;
        continue;
      }

      // Collect bullet points after finding summary
      if (foundSummary && cleanLine) {
        if (cleanLine.startsWith("-")) {
          // Clean up bullet points by removing any commit type prefixes
          const cleanedPoint = cleanLine.replace(/^-\s*(feat|fix|docs|style|refactor|test|chore):\s*/, '- ');
          bulletPoints.push(cleanedPoint);
        } else if (!cleanLine.startsWith("#") && !cleanLine.startsWith("*")) {
          bulletPoints.push(`- ${cleanLine}`);
        }
      }
    }

    // If no valid summary was found, try to extract it from the first line
    if (!summary) {
      const firstLine = lines[0]?.trim();
      if (firstLine) {
        // Try to extract type and description
        const typeMatch = firstLine.match(/(feat|fix|docs|style|refactor|test|chore):/i);
        const type = typeMatch ? typeMatch[1].toLowerCase() : "refactor";

        // Clean up the description
        const description = firstLine
          .replace(/(feat|fix|docs|style|refactor|test|chore):/ig, '')
          .replace(/^[-:\s]+/, '')
          .trim();

        summary = `${type}: ${description}`;
      } else {
        summary = "refactor: update code implementation";
      }
    }

    // Clean up summary
    summary = summary
      .replace(/\[.*?\]/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Ensure summary is not longer than 72 characters
    if (summary.length > 72) {
      summary = summary.substring(0, 69) + "...";
    }

    // Build description from bullet points
    if (bulletPoints.length > 0) {
      description = bulletPoints.join("\n");
    } else {
      description = "- Update implementation with necessary changes";
    }

    debugLog("Processed Commit Message:", { summary, description });
    return { summary, description };
  } catch (error) {
    debugLog("Error Processing Response:", error);
    return {
      summary: "refactor: update code structure",
      description: "- Update implementation with necessary changes",
    };
  }
}

function parseMarkdownContent(content: string): CommitMessage {
  const summaryMatch = content.match(/# Commit Summary\s*\n([^\n#]*)/);
  const descriptionMatch = content.match(
    /# Detailed Description\s*\n([\s\S]*?)(?:\n#|$)/
  );

  const summary = summaryMatch ? summaryMatch[1].trim() : "chore: update code";
  const description = descriptionMatch
    ? descriptionMatch[1].trim()
    : "Update implementation";

  return { summary, description };
}

function cleanDeepSeekResponse(response: string): string {
  // Remove any leading colons that DeepSeek sometimes adds
  response = response.replace(/^:\s*/, '');

  // If the response contains multiple lines with bullet points in the first line,
  // restructure it to match our expected format
  const lines = response.split('\n');

  if (lines[0].includes('-')) {
    // Extract the commit type and description from the first line
    const firstLine = lines[0];
    const match = firstLine.match(/(feat|fix|docs|style|refactor|test|chore):\s*([^-]+)/);

    if (match) {
      const [_, type, description] = match;
      // Reconstruct the response in the correct format
      return `${type}: ${description.trim()}\n\n${lines.join('\n')}`;
    }
  }

  // If the response is already in the correct format, just clean it up
  response = response
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return response;
}

function cleanGeminiResponse(response: string): string {
  // Remove any markdown headers and formatting
  response = response
    .replace(/^#\s.*$/gm, '')        // Remove markdown headers
    .replace(/```.*?```/gs, '')      // Remove code blocks
    .replace(/\*\*/g, '')            // Remove bold formatting
    .replace(/`/g, '');              // Remove inline code formatting

  const lines = response.split('\n').filter(line => line.trim());
  let summary = '';
  let bulletPoints: string[] = [];
  let foundSummary = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and section headers
    if (!trimmedLine || trimmedLine.toLowerCase().includes('detailed description')) {
      continue;
    }

    // Look for conventional commit format line
    if (!foundSummary && trimmedLine.match(/^(feat|fix|docs|style|refactor|test|chore)(\([^)]+\))?:/i)) {
      summary = trimmedLine
        .replace(/^([^:]+):\s*(.*)$/, (_, type, desc) => `${type.toLowerCase()}: ${desc}`)
        .trim();
      foundSummary = true;
      continue;
    }

    // Collect bullet points
    if (trimmedLine.startsWith('-')) {
      // Clean up bullet points by removing any commit type prefixes
      const cleanedPoint = trimmedLine
        .replace(/^-\s*(feat|fix|docs|style|refactor|test|chore):\s*/i, '- ')
        .replace(/^-\s*/, '')  // Remove leading dash and space
        .trim();

      if (cleanedPoint) {
        bulletPoints.push(`- ${cleanedPoint}`);
      }
    }
  }

  // If no proper summary was found, try to extract one from the first non-empty line
  if (!summary && lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine) {
      const typeMatch = firstLine.match(/(feat|fix|docs|style|refactor|test|chore):/i);
      const type = typeMatch ? typeMatch[1].toLowerCase() : 'refactor';

      const description = firstLine
        .replace(/^[^a-zA-Z]+/, '')
        .replace(/^(feat|fix|docs|style|refactor|test|chore):\s*/i, '')
        .trim();

      summary = `${type}: ${description}`;
    } else {
      summary = 'refactor: update code implementation';
    }
  }

  // Ensure summary is not longer than 72 characters
  if (summary.length > 72) {
    summary = summary.substring(0, 69) + '...';
  }

  // If no bullet points were found, create a default one
  if (bulletPoints.length === 0) {
    bulletPoints = ['- Update implementation with necessary changes'];
  }

  // Construct the final response
  return `${summary}\n\n${bulletPoints.join('\n')}`;
}


export async function activate(context: vscode.ExtensionContext) {
  debugChannel = vscode.window.createOutputChannel("AI Commit Assistant Debug");
  context.subscriptions.push(debugChannel);

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  context.subscriptions.push(statusBarItem);

  let toggleDebugCommand = vscode.commands.registerCommand(
    "ai-commit-assistant.toggleDebug",
    async () => {
      const config = vscode.workspace.getConfiguration("aiCommitAssistant");
      const currentDebug = config.get<boolean>("debug") || false;
      await config.update("debug", !currentDebug, true);
      vscode.window.showInformationMessage(
        `Debug mode ${!currentDebug ? "enabled" : "disabled"}`
      );
    }
  );

  context.subscriptions.push(toggleDebugCommand);

  let disposable = vscode.commands.registerCommand(
    "ai-commit-assistant.generateCommitMessage",
    async () => {
      try {
        debugLog("Command Started: generateCommitMessage");

        // Set generating state and show loading indicator
        await vscode.commands.executeCommand(
          "setContext",
          "ai-commit-assistant.isGenerating",
          true
        );
        statusBarItem.text = "$(sync~spin) Generating commit message...";
        statusBarItem.show();

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          throw new Error("No workspace folder found");
        }

        try {
          await execAsync("git rev-parse --is-inside-work-tree", {
            cwd: workspaceFolder.uri.fsPath,
          });
        } catch (error) {
          throw new Error("Not a git repository");
        }

        const { stdout: diff } = await execAsync("git diff --staged", {
          cwd: workspaceFolder.uri.fsPath,
        });

        if (!diff) {
          const { stdout: unstagesDiff } = await execAsync("git diff", {
            cwd: workspaceFolder.uri.fsPath,
          });

          if (!unstagesDiff) {
            throw new Error("No changes detected");
          } else {
            const answer = await vscode.window.showWarningMessage(
              "No staged changes found. Would you like to generate a commit message for unstaged changes?",
              "Yes",
              "No"
            );
            if (answer !== "Yes") {
              return;
            }
          }
        }

        const config = vscode.workspace.getConfiguration("aiCommitAssistant");
        const apiProvider = config.get<string>("apiProvider") || "gemini";
        const geminiApiKey =
          config.get<string>("geminiApiKey") || process.env.GEMINI_API_KEY;
        const huggingfaceApiKey =
          config.get<string>("huggingfaceApiKey") ||
          process.env.HUGGINGFACE_API_KEY;
        const huggingfaceModel =
          config.get<string>("huggingfaceModel") ||
          "mistralai/Mistral-7B-Instruct-v0.3";
        const ollamaUrl =
          config.get<string>("ollamaUrl") || "http://localhost:11434";
        const ollamaModel = config.get<string>("ollamaModel") || "mistral";

        let apiConfig: ApiConfig;
        let commitMessage: CommitMessage;

        if (apiProvider === "gemini" && geminiApiKey) {
          debugLog("Using Gemini API");
          apiConfig = { type: "gemini", apiKey: geminiApiKey };
          const genAI = new GoogleGenerativeAI(apiConfig.apiKey!);
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });

          const promptText = `Analyze the following git diff and generate a commit message. The commit message should follow conventional commits format and accurately reflect the type of changes made:
        
        Git Diff:
        ${diff}
        
        Guidelines:
        1. Choose the most appropriate type based on the changes:
           - feat: New features or significant enhancements
           - fix: Bug fixes
           - docs: Documentation changes
           - style: Code style changes (formatting, semicolons, etc)
           - refactor: Code changes that neither fix bugs nor add features
           - test: Adding or modifying tests
           - chore: Changes to build process or auxiliary tools
        
        2. Format:
        <type>: brief description (max 72 chars)
        
        - Point 1
        - Point 2
        - Point 3 (if needed)`;

          debugLog("Prompt:", promptText);

          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
          });

          const response = await result.response;
          debugLog("Gemini Response:", response.text());

          // Clean the Gemini response and convert it to commit message format
          const cleanedResponse = cleanGeminiResponse(response.text());
          commitMessage = await processResponse(cleanedResponse);
        }
        else if (apiProvider === "huggingface" && huggingfaceApiKey) {
          apiConfig = {
            type: "huggingface",
            apiKey: huggingfaceApiKey,
            model: huggingfaceModel,
          };
          const rawResponse = await callHuggingFaceAPI(
            apiConfig.apiKey!,
            apiConfig.model!,
            diff
          );
          commitMessage = await processResponse(rawResponse);
        } else if (apiProvider === "ollama") {
          apiConfig = {
            type: "ollama",
            ollamaUrl: ollamaUrl,
            model: ollamaModel,
          };
          const rawResponse = await callOllamaAPI(
            apiConfig.ollamaUrl!,
            apiConfig.model!,
            diff
          );
          commitMessage = await processResponse(rawResponse);
        } else {
          const setKeyAction = "Configure API";
          const result = await vscode.window.showErrorMessage(
            `API configuration not found for ${apiProvider}. Please configure your API settings.`,
            setKeyAction
          );
          if (result === setKeyAction) {
            await vscode.commands.executeCommand(
              "workbench.action.openSettings",
              "aiCommitAssistant"
            );
          }
          return;
        }

        const gitExtension = vscode.extensions.getExtension("vscode.git");
        if (!gitExtension) {
          throw new Error("Git extension not found");
        }

        try {
          const git = gitExtension.exports.getAPI(1);
          if (!git) {
            throw new Error("Git API not available");
          }

          const repositories = git.repositories;
          if (!repositories || repositories.length === 0) {
            throw new Error("No Git repositories found");
          }

          const repository = repositories[0];
          if (repository) {
            repository.inputBox.value = `${commitMessage.summary}\n\n${commitMessage.description}`;
          }
        } catch (err: unknown) {
          console.error("Error accessing Git repository:", err);
          const errorMessage =
            err instanceof Error ? err.message : "An unknown error occurred";
          debugLog("Git Repository Error:", err);
          vscode.window.showErrorMessage(
            `Failed to set commit message in Source Control: ${errorMessage}`
          );
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        debugLog("Command Error:", error);
        vscode.window.showErrorMessage(`Error: ${errorMessage}`);
      } finally {
        // Reset generating state and hide status bar in all cases
        await vscode.commands.executeCommand(
          "setContext",
          "ai-commit-assistant.isGenerating",
          false
        );
        statusBarItem.hide();
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  if (statusBarItem) {
    statusBarItem.dispose();
  }
}
