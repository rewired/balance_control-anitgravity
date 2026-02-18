import type { GameState } from '@balance-control/rules';
import type { EngineState } from '../types';

/**
 * Capitalizes the first letter of a string.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Allocates a new deterministic ID.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function allocId(G: GameState & { engine: EngineState }, prefix: string): string {
    if (typeof G.engine.idSeq !== 'number' || !Number.isFinite(G.engine.idSeq) || G.engine.idSeq < 0) {
        G.engine.idSeq = 0;
    }

    G.engine.idSeq += 1;
    return `${prefix}_${G.engine.idSeq}`;
}

