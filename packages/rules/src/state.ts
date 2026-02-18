import type { ZoneId } from './ids';
import type { Zone } from './zones';
import type { Tile } from './tiles';
import type { GameObject } from './objects';
import type { GameMeta } from './config';

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
