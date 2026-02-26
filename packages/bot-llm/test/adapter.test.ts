import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { LegalIntent } from '@balance-control/game';
import { enumerateDeterministicLegalMoves, parseLLMSelection, selectIntentFromLLMResponse } from '../src/adapter';

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
});
