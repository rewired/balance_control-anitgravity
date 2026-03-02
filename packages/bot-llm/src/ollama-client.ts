import type { LegalMoveOption } from './adapter';

export interface OllamaRequestConfig {
    endpoint: string;
    model: string;
    timeoutMs: number;
    httpClient?: typeof fetch;
}

interface OllamaGenerateResponse {
    response: string;
}

/**
 * Sends deterministic index-only move options to Ollama and returns raw model text.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects performs HTTP I/O
 */
export async function requestOllamaSelection(params: {
    config: OllamaRequestConfig;
    legalMoves: LegalMoveOption[];
}): Promise<string> {
    const { config, legalMoves } = params;
    const httpClient = config.httpClient ?? fetch;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
        const prompt = buildSelectionPrompt(legalMoves);
        const response = await httpClient(config.endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                model: config.model,
                prompt,
                stream: false,
                format: {
                    type: 'object',
                    properties: {
                        selectedIndex: { type: 'integer', minimum: 0 }
                    },
                    required: ['selectedIndex'],
                    additionalProperties: false
                }
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`ollama-http-${response.status}`);
        }

        const payload = (await response.json()) as OllamaGenerateResponse;
        if (typeof payload.response !== 'string') {
            throw new Error('ollama-response-not-string');
        }

        return payload.response;
    } finally {
        clearTimeout(timeout);
    }
}

function buildSelectionPrompt(legalMoves: LegalMoveOption[]): string {
    const options = legalMoves
        .map((option) => `${option.index}: ${JSON.stringify(option.intent)}`)
        .join('\n');

    return [
        'Choose exactly one legal move by index.',
        'Return strict JSON only: {"selectedIndex": <integer>}.',
        'Do not invent moves, payload fields, or any extra keys.',
        'Legal options:',
        options
    ].join('\n');
}
