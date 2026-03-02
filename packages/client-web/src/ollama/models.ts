const OLLAMA_TAGS_URL = import.meta.env.VITE_OLLAMA_TAGS_URL ?? 'http://localhost:11434/api/tags';
const OLLAMA_TIMEOUT_MS = 5000;

export class OllamaModelsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OllamaModelsError';
    }
}

export async function fetchOllamaModels(timeoutMs = OLLAMA_TIMEOUT_MS): Promise<string[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(OLLAMA_TAGS_URL, {
            method: 'GET',
            signal: controller.signal,
            headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
            throw new OllamaModelsError(`Model query failed (${response.status}).`);
        }

        const payload = (await response.json()) as { models?: Array<{ name?: unknown }> };
        if (!Array.isArray(payload.models)) {
            throw new OllamaModelsError('Invalid Ollama response payload.');
        }

        const names = payload.models
            .map((model) => (typeof model.name === 'string' ? model.name.trim() : ''))
            .filter((name): name is string => name.length > 0);

        return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    } catch (error) {
        if (error instanceof OllamaModelsError) {
            throw error;
        }
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new OllamaModelsError(`Model query timed out after ${timeoutMs}ms.`);
        }
        const message = error instanceof Error ? error.message : String(error);
        throw new OllamaModelsError(`Model query failed: ${message}`);
    } finally {
        clearTimeout(timeout);
    }
}
