import type { GameState } from '@balance-control/rules';
import { computeMajority } from './mechanics';

/**
 * Selects the controller of a tile.
 * @rule CORE-01-05-04
 * @deterministic
 * @pure
 */
export function selectTileController(tileId: string, G: GameState): string | null {
    return computeMajority(tileId, G).controller;
}

