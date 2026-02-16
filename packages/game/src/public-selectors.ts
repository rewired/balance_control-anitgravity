import type { GameState } from '@balance-control/rules';
import { computeMajority } from './mechanics';

export function selectTileController(tileId: string, G: GameState): string | null {
    // CORE-01-05-04: Controller is determined by majority computation (incl. Lobbyist adjacency rules).
    return computeMajority(tileId, G).controller;
}

