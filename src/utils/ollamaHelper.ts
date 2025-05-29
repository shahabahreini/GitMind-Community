// src/utils/ollamaHelper.ts
import { debugLog } from "../services/debug/logger";

export async function checkOllamaAvailability(ollamaUrl: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`${ollamaUrl}/api/version`, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        debugLog("Ollama availability check failed:", error);
        return false;
    }
}

export function getOllamaInstallInstructions(): string {
    const platform = process.platform;
    let instructions = "Ollama Setup Required\n";
    instructions += "=".repeat(50) + "\n\n";
    instructions += "Ollama is not running or not installed. Please follow the steps below:\n\n";

    switch (platform) {
        case 'darwin': // macOS
            instructions += `macOS Instructions:\n`;
            instructions += `${"-".repeat(20)}\n`;
            instructions += `1. Install Ollama (if not already installed):\n`;
            instructions += `   curl https://ollama.ai/install.sh | sh\n\n`;
            instructions += `2. Start Ollama:\n`;
            instructions += `   • Open the Ollama application from your Applications folder\n`;
            instructions += `   • OR run in terminal: open -a Ollama\n\n`;
            instructions += `3. Wait for Ollama to initialize (this may take a few seconds)\n`;
            break;
        case 'win32': // Windows
            instructions += `Windows Instructions:\n`;
            instructions += `${"-".repeat(21)}\n`;
            instructions += `1. Download Ollama (if not already installed):\n`;
            instructions += `   Visit: https://ollama.ai/download/windows\n\n`;
            instructions += `2. Install and start Ollama:\n`;
            instructions += `   • Run the downloaded installer\n`;
            instructions += `   • Launch Ollama from the Start menu\n`;
            instructions += `   • Look for the Ollama icon in the system tray\n\n`;
            instructions += `3. Wait for initialization (first start may take longer)\n`;
            break;
        case 'linux':
            instructions += `Linux Instructions:\n`;
            instructions += `${"-".repeat(19)}\n`;
            instructions += `1. Install Ollama (if not already installed):\n`;
            instructions += `   curl https://ollama.ai/install.sh | sh\n\n`;
            instructions += `2. Start Ollama:\n`;
            instructions += `   • Run: ollama serve\n`;
            instructions += `   • OR set up systemd service: sudo systemctl start ollama\n\n`;
            instructions += `3. Wait for Ollama to initialize\n`;
            break;
        default:
            instructions += `General Instructions:\n`;
            instructions += `${"-".repeat(21)}\n`;
            instructions += `Visit https://ollama.ai/download for platform-specific installation instructions.\n`;
    }

    instructions += `\n${"=".repeat(50)}\n`;
    instructions += `Next Steps:\n`;
    instructions += `Once Ollama is running, please try generating the commit message again.\n`;
    instructions += `If you continue to experience issues, ensure Ollama is accessible at the configured URL.`;

    return instructions;
}
