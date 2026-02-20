import type { LegalIntent } from '@balance-control/game';

/**
 * Dispatches a legal intent to the engine via boardgame.io moves.
 * @remarks Presentation-only.
 * @pure
 */
export function dispatchIntent(moves: any, intent: LegalIntent): boolean {
    const moveFn = moves[intent.moveType];
    if (typeof moveFn !== 'function') {
        console.error(`[dispatchIntent] Move "${intent.moveType}" not found in moves object.`);
        return false;
    }

    if (intent.payload !== undefined) {
        moveFn(intent.payload);
    } else {
        moveFn();
    }

    return true;
}
