import type { ZoneId } from './ids';
import type { Zone } from './zones';
import type { Tile } from './tiles';
import type { GameObject } from './objects';
import type { GameMeta } from './config';

/**
 * Root game state implementing the declarative state model.
 * @rule CORE-01-00-01
 * @rule CORE-01-00-06
 * @rule CORE-01-00-07
 * @rule CORE-01-00-08
 * @rule CORE-01-00-10
 * @rule CORE-01-00-11
 * @rule CORE-01-00-12
 */
export interface GameState {
    zones: Record<ZoneId, Zone>;
    tiles: Record<string, Tile>;
    objects: Record<string, GameObject>;
    adjacency: Record<string, string[]>;
    grid: Record<string, string>; // coordString (q,r) -> tileId
    secret?: any;
    meta?: GameMeta;
    // Tracking flags
    roundNumber?: number;
    roundSettlementDone?: boolean;

    // Modular Engine State
    engine: {
        idSeq: number;
        effectQueue: any[];
        activeModifiers: any[];
        pendingChoice?: any;
        history: any[];
        attributes: Record<string, any>;
    };
}
