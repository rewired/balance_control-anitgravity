import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { LegalIntent } from '@balance-control/game';
import {
    enumerateDeterministicLegalMoves,
    parseLLMSelection,
    requestOllamaSelection,
    selectIntentFromLLMResponse,
    selectIntentWithOllama,
    type OllamaRequestConfig
} from '../src';

let mockedIntents: LegalIntent[] = [];

vi.mock('@balance-control/game', async () => {
    const actual = await vi.importActual<typeof import('@balance-control/game')>('@balance-control/game');
    return {
        ...actual,
        enumerateLegalIntents: vi.fn(() => mockedIntents)
    };
});

function intent(moveType: string, payload: Record<string, unknown>): LegalIntent {
    return { moveType, payload };
}

function configWithHttpClient(httpClient: typeof fetch): OllamaRequestConfig {
    return {
        endpoint: 'http://localhost:11434/api/generate',
        model: 'llama3.1:8b',
        timeoutMs: 100,
        httpClient
    };
}

describe('bot adapter LLM contract', () => {
    beforeEach(() => {
        mockedIntents = [
            intent('placeTile', { targetCoord: [0, 0] }),
            intent('moveInfluence', { sourceTileId: 'A', targetTileId: 'B', influenceId: 'inf_0' })
        ];
    });

    it('handles invalid JSON with deterministic fallback', () => {
        const parsed = parseLLMSelection('{invalid-json');
        expect(parsed).toEqual({ ok: false, reason: 'invalid-json' });

        const result = selectIntentFromLLMResponse({
            G: {} as any,
            ctx: {} as any,
            playerID: '0',
            rawResponse: '{invalid-json'
        });

        expect(result.usedFallback).toBe(true);
        expect(result.reason).toBe('invalid-json');
        expect(result.selectedIndex).toBe(0);
        expect(result.selectedIntent).toEqual(mockedIntents[0]);
    });

    it('rejects schema violations with deterministic fallback', () => {
        const parsed = parseLLMSelection(JSON.stringify({ selectedIndex: '1' }));
        expect(parsed).toEqual({ ok: false, reason: 'schema-violation' });

        const result = selectIntentFromLLMResponse({
            G: {} as any,
            ctx: {} as any,
            playerID: '0',
            rawResponse: JSON.stringify({ selectedIndex: '1' })
        });

        expect(result.usedFallback).toBe(true);
        expect(result.reason).toBe('schema-violation');
        expect(result.selectedIntent).toEqual(mockedIntents[0]);
    });

    it('rejects out-of-range index with deterministic fallback', () => {
        const result = selectIntentFromLLMResponse({
            G: {} as any,
            ctx: {} as any,
            playerID: '0',
            rawResponse: JSON.stringify({ selectedIndex: 99 })
        });

        expect(result.usedFallback).toBe(true);
        expect(result.reason).toBe('out-of-range');
        expect(result.selectedIntent).toEqual(mockedIntents[0]);
    });

    it('uses deterministic fallback for stale legal-move verification', () => {
        const expected = enumerateDeterministicLegalMoves({} as any, {} as any, '0');
        mockedIntents = [
            intent('formalizeInfluence', { committeeTileId: 'C', paymentResourceIds: ['res_1', 'res_2'] }),
            intent('placeTile', { targetCoord: [1, 0] })
        ];

        const staleResult = selectIntentFromLLMResponse({
            G: {} as any,
            ctx: {} as any,
            playerID: '0',
            rawResponse: JSON.stringify({ selectedIndex: 1 }),
            expectedLegalMoves: expected
        });

        expect(staleResult.usedFallback).toBe(true);
        expect(staleResult.reason).toBe('stale-selection');
        expect(staleResult.selectedIndex).toBe(0);
        expect(staleResult.selectedIntent).toEqual(mockedIntents[0]);

        const repeatResult = selectIntentFromLLMResponse({
            G: {} as any,
            ctx: {} as any,
            playerID: '0',
            rawResponse: JSON.stringify({ selectedIndex: 1 }),
            expectedLegalMoves: expected
        });

        expect(repeatResult).toEqual(staleResult);
    });

    it('accepts a valid Ollama response string and resolves selected intent', async () => {
        const httpClient = vi.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            json: async () => ({ response: JSON.stringify({ selectedIndex: 1 }) })
        } as Response);

        const result = await selectIntentWithOllama({
            G: {} as any,
            ctx: {} as any,
            playerID: '0',
            config: configWithHttpClient(httpClient)
        });

        expect(result.usedFallback).toBe(false);
        expect(result.reason).toBe('ok');
        expect(result.selectedIndex).toBe(1);
        expect(result.selectedIntent).toEqual(mockedIntents[1]);
    });

    it('uses deterministic fallback for transport invalid JSON', async () => {
        const httpClient = vi.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            json: async () => ({ response: '{invalid-json' })
        } as Response);

        const result = await selectIntentWithOllama({
            G: {} as any,
            ctx: {} as any,
            playerID: '0',
            config: configWithHttpClient(httpClient)
        });

        expect(result.usedFallback).toBe(true);
        expect(result.reason).toBe('invalid-json');
        expect(result.selectedIntent).toEqual(mockedIntents[0]);
    });

    it('uses deterministic fallback for transport schema violation', async () => {
        const httpClient = vi.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            json: async () => ({ response: JSON.stringify({ selectedIndex: '1' }) })
        } as Response);

        const result = await selectIntentWithOllama({
            G: {} as any,
            ctx: {} as any,
            playerID: '0',
            config: configWithHttpClient(httpClient)
        });

        expect(result.usedFallback).toBe(true);
        expect(result.reason).toBe('schema-violation');
        expect(result.selectedIntent).toEqual(mockedIntents[0]);
    });

    it('uses deterministic fallback for transport out-of-range index', async () => {
        const httpClient = vi.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            json: async () => ({ response: JSON.stringify({ selectedIndex: 99 }) })
        } as Response);

        const result = await selectIntentWithOllama({
            G: {} as any,
            ctx: {} as any,
            playerID: '0',
            config: configWithHttpClient(httpClient)
        });

        expect(result.usedFallback).toBe(true);
        expect(result.reason).toBe('out-of-range');
        expect(result.selectedIntent).toEqual(mockedIntents[0]);
    });

    it('uses deterministic fallback on timeout/network failure', async () => {
        const httpClient = vi.fn<typeof fetch>().mockRejectedValue(new Error('network down'));

        const result = await selectIntentWithOllama({
            G: {} as any,
            ctx: {} as any,
            playerID: '0',
            config: configWithHttpClient(httpClient)
        });

        expect(result.usedFallback).toBe(true);
        expect(result.reason).toBe('transport-error');
        expect(result.selectedIntent).toEqual(mockedIntents[0]);
    });

    it('requestOllamaSelection sends index-only prompt options', async () => {
        const httpClient = vi.fn<typeof fetch>().mockResolvedValue({
            ok: true,
            json: async () => ({ response: JSON.stringify({ selectedIndex: 0 }) })
        } as Response);

        const legalMoves = enumerateDeterministicLegalMoves({} as any, {} as any, '0');
        const raw = await requestOllamaSelection({
            config: configWithHttpClient(httpClient),
            legalMoves
        });

        expect(raw).toBe(JSON.stringify({ selectedIndex: 0 }));
        const [requestUrl, init] = httpClient.mock.calls[0] ?? [];
        expect(requestUrl).toBe('http://localhost:11434/api/generate');
        expect((init as RequestInit).method).toBe('POST');
        const body = JSON.parse((init as RequestInit).body as string) as { prompt: string };
        expect(body.prompt).toContain('0:');
        expect(body.prompt).toContain('1:');
        expect(body.prompt).toContain('Return strict JSON only');
    });
});
