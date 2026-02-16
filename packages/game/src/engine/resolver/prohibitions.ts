import type { GameState } from '@balance-control/rules';
import type { EngineState } from '../types';

export function isProhibited(
    G: GameState & { engine: EngineState },
    actionType: string,
    playerId: string,
    tileId?: string
): boolean {
    const prohibitions = G.engine.attributes.prohibitions || {};

    // Global prohibition for this action
    if (prohibitions[actionType] === true) return true;

    // Player-specific prohibition
    if (prohibitions[playerId]?.[actionType] === true) return true;

    // Tile-specific prohibition (if applicable)
    if (tileId && prohibitions[tileId]?.[actionType] === true) return true;

    return false;
}

