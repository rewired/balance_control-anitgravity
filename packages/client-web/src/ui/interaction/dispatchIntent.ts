import type { LegalIntent } from '@balance-control/game';
import { INVALID_MOVE } from 'boardgame.io/core';
import type { DispatchTripwireInfo } from './types';

export type DispatchIntentResult =
    | { ok: true }
    | { ok: false; reason: 'missingMove' | 'invalidMove' | 'exception' | 'unknown' };

export type DispatchIntentOptions = {
    renderStateKey?: string | null;
    getDispatchStateKey?: (() => string | null) | undefined;
    onTripwireMismatch?: ((info: DispatchTripwireInfo) => void) | undefined;
};

/**
 * Dispatches a legal intent to the engine via boardgame.io moves.
 * @remarks Presentation-only.
 * @pure
 */
export function dispatchIntent(moves: any, intent: LegalIntent, options?: DispatchIntentOptions): DispatchIntentResult {
    const moveFn = moves[intent.moveType];
    if (typeof moveFn !== 'function') {
        console.error(`[dispatchIntent] Move "${intent.moveType}" not found in moves object.`);
        return { ok: false, reason: 'missingMove' };
    }

    if (import.meta.env.DEV && options?.renderStateKey && options.getDispatchStateKey) {
        const dispatchStateKey = options.getDispatchStateKey();
        if (dispatchStateKey && dispatchStateKey !== options.renderStateKey) {
            options.onTripwireMismatch?.({
                moveType: intent.moveType,
                renderStateKey: options.renderStateKey,
                dispatchStateKey,
            });
            console.warn(
                `[dispatchIntent] Tripwire mismatch for "${intent.moveType}": render=${options.renderStateKey} dispatch=${dispatchStateKey}`
            );
        }
    }

    try {
        const result = intent.payload !== undefined ? moveFn(intent.payload) : moveFn();
        if (result === INVALID_MOVE) {
            return { ok: false, reason: 'invalidMove' };
        }
        return { ok: true };
    } catch (err) {
        console.error(`[dispatchIntent] Exception while dispatching "${intent.moveType}":`, err);
        return { ok: false, reason: 'exception' };
    }
}
