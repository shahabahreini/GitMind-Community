// src/utils/ollamaHelper.ts
import { debugLog } from "../services/debug/logger";

interface PlatformInstructions {
    name: string;
    install: string[];
    start: string[];
    notes?: string;
}

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
    const platformInstructions = getPlatformInstructions(platform);

    return formatInstructions(platformInstructions);
}

function getPlatformInstructions(platform: string): PlatformInstructions {
    const instructionsMap: Record<string, PlatformInstructions> = {
        darwin: {
            name: 'macOS',
            install: ['curl https://ollama.ai/install.sh | sh'],
            start: [
                'Open the Ollama application from your Applications folder',
                'OR run in terminal: open -a Ollama'
            ],
            notes: 'Wait for Ollama to initialize (this may take a few seconds)'
        },
        win32: {
            name: 'Windows',
            install: ['Visit: https://ollama.ai/download/windows'],
            start: [
                'Run the downloaded installer',
                'Launch Ollama from the Start menu',
                'Look for the Ollama icon in the system tray'
            ],
            notes: 'Wait for initialization (first start may take longer)'
        },
        linux: {
            name: 'Linux',
            install: ['curl https://ollama.ai/install.sh | sh'],
            start: [
                'Run: ollama serve',
                'OR set up systemd service: sudo systemctl start ollama'
            ],
            notes: 'Wait for Ollama to initialize'
        }
    };

    return instructionsMap[platform] || {
        name: 'General',
        install: ['Visit https://ollama.ai/download for platform-specific installation instructions'],
        start: ['Follow platform-specific startup instructions']
    };
}

function formatInstructions(instructions: PlatformInstructions): string {
    const { name, install, start, notes } = instructions;
    const separator = "=".repeat(50);
    const subSeparator = "-".repeat(name.length + 13);

    let output = `Ollama Setup Required\n${separator}\n\n`;
    output += `Ollama is not running or not installed. Please follow the steps below:\n\n`;

    output += `${name} Instructions:\n${subSeparator}\n`;

    output += `1. Install Ollama (if not already installed):\n`;
    install.forEach(step => output += `   ${step}\n`);

    output += `\n2. Start Ollama:\n`;
    start.forEach(step => output += `   • ${step}\n`);

    if (notes) {
        output += `\n3. ${notes}\n`;
    }

    output += `\n${separator}\n`;
    output += `Next Steps:\n`;
    output += `Once Ollama is running, please try generating the commit message again.\n`;
    output += `If you continue to experience issues, ensure Ollama is accessible at the configured URL.`;

    return output;
}