import type { ExpansionId } from './ids';
import type { ResourceType } from './resources';
import type { GameState } from './state';

export interface MeasureDeckDescriptor {
    /** Stable identifier within an expansion (e.g. "measures"). */
    id: string;
    /** Deterministic object-id routing key (e.g. "exp02_measure_"). */
    objectIdPrefix: string;
    zones: {
        drawPileId: string;
        openZoneId: string;
        recyclePileId: string;
        finalDiscardId: string;
    };
}

export interface ExpansionDefinition {
    /** Canonical id (stable; used for enablement + deterministic registry ordering). */
    id: ExpansionId;
    name: string;
    resources?: ResourceType[];
    zones?: string[];
    /**
     * Optional measure deck descriptors contributed by this expansion.
     *
     * Engine uses these to route measure.take / measure.play / measure.recycle
     * without hardcoding object id prefix switches in core logic.
     */
    measureDecks?: MeasureDeckDescriptor[];

    // Hooks
    onSetup?: (G: GameState, ctx: any) => void;

    // Modifiers
    modifiers?: {
        production?: (tileId: string, G: GameState, baseAmount: number) => number;
        cost?: (effect: any, G: GameState, baseCost: any) => any;
    };

    // Effect Handlers
    effectHandlers?: Record<string, (G: GameState, ctx: any, effect: any, utils: any) => void>;
    getMeasureAtoms?: (G: GameState, measureId: string, payload: any) => any[] | null;
    moves?: Record<string, (arg0: any, arg1: any) => any>;
}

export interface EffectContext {
    player: string;
    contextTileId?: string;
}

export interface EffectDescriptor {
    type: 'PLACE_INFLUENCE' | 'MOVE_INFLUENCE' | 'FORMALIZE' | 'CONVERT' | 'PRODUCTION' | 'HOTSPOT_RESOLUTION' | 'TAKE_MEASURE' | 'PLAY_MEASURE';
    payload: any;
    sourceTileId?: string;
}

export function allocId(G: GameState, prefix: string): string {
    if (!G.engine) {
        throw new Error('Game state engine is required for deterministic ID allocation.');
    }

    if (typeof G.engine.idSeq !== 'number' || !Number.isFinite(G.engine.idSeq) || G.engine.idSeq < 0) {
        G.engine.idSeq = 0;
    }

    G.engine.idSeq += 1;
    return `${prefix}_${G.engine.idSeq}`;
}
