import { OpenAICompatibleProvider } from "./openaiCompatible";

function assertLoopback(url: string): void {
    const parsed = new URL(url);
    if (!["localhost", "127.0.0.1", "::1"].includes(parsed.hostname)) {
        throw new Error("LM Studio must use a loopback server URL. Use Custom API for a remote compatible endpoint.");
    }
}

export class LMStudioProvider extends OpenAICompatibleProvider {
    constructor(url: string, model: string) {
        assertLoopback(url);
        super("", model, url, "lmstudio", {});
    }
}

export async function fetchLMStudioModels(url = "http://127.0.0.1:1234/v1"): Promise<string[]> {
    return new LMStudioProvider(url, "").getModels();
}
