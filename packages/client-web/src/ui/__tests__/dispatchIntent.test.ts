import { describe, expect, it, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import type { LegalIntent } from '@balance-control/game';

let dispatchIntent: typeof import('../interaction/dispatchIntent').dispatchIntent;

function createIntent(moveType: string, payload?: unknown): LegalIntent {
    return payload === undefined ? ({ moveType } as LegalIntent) : ({ moveType, payload } as LegalIntent);
}

describe('dispatchIntent', () => {
    beforeAll(async () => {
        ({ dispatchIntent } = await import('../interaction/dispatchIntent'));
    });

    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    it('returns missingMove when moves[intent.moveType] is missing', () => {
        const moves = {};

        const result = dispatchIntent(moves, createIntent('placeInfluence'));

        expect(result).toEqual({ ok: false, reason: 'missingMove' });
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain('Move "placeInfluence" not found');
    });

    it('returns exception when move function throws', () => {
        const moveFn = vi.fn(() => {
            throw new Error('boom');
        });
        const moveRegistry = { placeInfluence: moveFn };

        const result = dispatchIntent(moveRegistry, createIntent('placeInfluence', { tileId: 't1' }));

        expect(result).toEqual({ ok: false, reason: 'exception' });
        expect(moveFn).toHaveBeenCalledWith({ tileId: 't1' });
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        expect(String(consoleErrorSpy.mock.calls[0]?.[0])).toContain('Exception while dispatching "placeInfluence"');
    });

    it('returns ok=true when move function returns a normal value', () => {
        const moveFn = vi.fn(() => 'applied');
        const moveRegistry = { placeInfluence: moveFn };

        const result = dispatchIntent(moveRegistry, createIntent('placeInfluence', { tileId: 't1' }));

        expect(result).toEqual({ ok: true });
        expect(moveFn).toHaveBeenCalledWith({ tileId: 't1' });
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('triggers DEV tripwire callback when renderStateKey and dispatchStateKey mismatch', () => {
        const onTripwireMismatch = vi.fn();
        const moveFn = vi.fn(() => 'applied');
        const moveRegistry = { placeInfluence: moveFn };

        const result = dispatchIntent(moveRegistry, createIntent('placeInfluence', { tileId: 't1' }), {
            renderStateKey: 'state-A',
            getDispatchStateKey: () => 'state-B',
            onTripwireMismatch,
        });

        expect(result).toEqual({ ok: true });
        if (import.meta.env.DEV) {
            expect(onTripwireMismatch).toHaveBeenCalledTimes(1);
            expect(onTripwireMismatch).toHaveBeenCalledWith({
                moveType: 'placeInfluence',
                renderStateKey: 'state-A',
                dispatchStateKey: 'state-B',
            });
            expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
            expect(String(consoleWarnSpy.mock.calls[0]?.[0])).toContain('Tripwire mismatch for "placeInfluence"');
        } else {
            expect(onTripwireMismatch).not.toHaveBeenCalled();
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        }
    });

    it('does not trigger DEV tripwire callback when renderStateKey and dispatchStateKey match', () => {
        const onTripwireMismatch = vi.fn();
        const moveFn = vi.fn(() => 'applied');
        const moveRegistry = { placeInfluence: moveFn };

        const result = dispatchIntent(moveRegistry, createIntent('placeInfluence', { tileId: 't1' }), {
            renderStateKey: 'state-A',
            getDispatchStateKey: () => 'state-A',
            onTripwireMismatch,
        });

        expect(result).toEqual({ ok: true });
        expect(onTripwireMismatch).not.toHaveBeenCalled();
        expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
});
