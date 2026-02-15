export type ResourceType = 'DOM' | 'FOR' | 'INF' | string;
export type PlayerID = string;

export enum CoreResources {
    DOM = 'DOM',
    FOR = 'FOR',
    INF = 'INF',
    ECO = 'ECO',
    CLM = 'CLM',
    SEC = 'SEC',
}

export type ZoneId = string;

export enum CoreZoneNames {
    DrawPile = 'DrawPile',
    DiscardFaceUp = 'DiscardFaceUp',
    Board = 'Board',
    Bank = 'Bank',
    Noise = 'Noise',
    PersonalSupply = 'PersonalSupply', // Use with :pid
    PlayerHand = 'PlayerHand',     // Use with :pid
    SelectionStaging = 'SelectionStaging',
    // Expansion 01 Zones
    MeasureDrawPile = 'MeasureDrawPile',
    OpenMeasures = 'OpenMeasures',
    MeasureRecyclePile = 'MeasureRecyclePile',
    MeasureFinalDiscard = 'MeasureFinalDiscard',
    // Expansion 02 Zones
    RegulationSupply = 'RegulationSupply',
    BoardAttached = 'BoardAttached',
    EXP02_MeasureDrawPile = 'EXP02_MeasureDrawPile',
    EXP02_OpenMeasures = 'EXP02_OpenMeasures',
    EXP02_MeasureRecyclePile = 'EXP02_MeasureRecyclePile',
    EXP02_MeasureFinalDiscard = 'EXP02_MeasureFinalDiscard',
    // Expansion 03 Zones
    CountdownSupply = 'CountdownSupply',
    EXP03_MeasureDrawPile = 'EXP03_MeasureDrawPile',
    EXP03_OpenMeasures = 'EXP03_OpenMeasures',
    EXP03_MeasureRecyclePile = 'EXP03_MeasureRecyclePile',
    EXP03_MeasureFinalDiscard = 'EXP03_MeasureFinalDiscard'
}

export enum TileType {
    Resort = 'Resort',
    Committee = 'Committee',
    Grassroots = 'Grassroots',
    Lobbyist = 'Lobbyist',
    Hotspot = 'Hotspot',
    StartCommittee = 'StartCommittee',
    SystemTile = 'SystemTile',
}

export interface GrassrootsConversionMetadata {
    inputSlots: number;
    outputSlots: number;
    /** CORE-01-04-22L: Typed Grassroots have resort T; Variant B allows 3:1 with output ≠ T */
    typedResort?: ResourceType;
}

export interface Tile {
    id: string;
    type: TileType;
    resort?: ResourceType;
    weight?: number;
    name?: string;
    conversion?: GrassrootsConversionMetadata;
    // EXP-01 attributes
    isHotspot?: boolean;
}

export type RegulationType = 'SecurityLevel' | 'Control' | 'Administration' | 'Blockade';

export interface GameObject {
    id: string;
    type: 'Influence' | 'Resource' | 'Measure' | 'Regulation' | 'CountdownMarker' | 'MetaMarker';
    owner?: string;
    resort?: ResourceType;
    isStarting?: boolean;
    // Expansion attributes
    measureId?: string;
    playCount?: number;
    // EXP-02 attributes
    regType?: RegulationType;
    targetTileId?: string;
    mode?: 'PingPong' | 'Shift' | 'Convert';
    expiresRound?: number;
}

export interface Zone {
    id: ZoneId;
    name: string;
    items: string[];
}

export interface RulesetManifest {
    coreVersion: string;
    expansions: {
        exp01Version?: string;
        exp02Version?: string;
        exp03Version?: string;
    };
    specAnchorHash?: string;
}

export const RULESET_MANIFEST: RulesetManifest = {
    coreVersion: 'v1.1.0',
    expansions: {
        exp01Version: 'v1.3',
        exp02Version: 'v1.0',
        exp03Version: 'v1.0',
    },
    specAnchorHash: '5F563AFF09ADCAF45B62E5CBBB97C5DC5D722EE2B56E3AB67B7B71BEA2F9FEF3',
};

export interface GameMeta {
    ruleset?: RulesetManifest;
}

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

export interface ExpansionDefinition {
    name: string;
    resources?: ResourceType[];
    zones?: string[];

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
