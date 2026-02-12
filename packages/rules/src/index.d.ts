export type ResourceType = 'DOM' | 'FOR' | 'INF' | string;
export declare enum CoreResources {
    DOM = "DOM",
    FOR = "FOR",
    INF = "INF",
    ECO = "ECO",
    SEC = "SEC"
}
export type ZoneId = string;
export declare enum CoreZoneNames {
    DrawPile = "DrawPile",
    DiscardFaceUp = "DiscardFaceUp",
    Board = "Board",
    Bank = "Bank",
    Noise = "Noise",
    PersonalSupply = "PersonalSupply",
    MeasureDrawPile = "MeasureDrawPile",
    OpenMeasures = "OpenMeasures",
    MeasureRecyclePile = "MeasureRecyclePile",
    MeasureFinalDiscard = "MeasureFinalDiscard",
    RegulationSupply = "RegulationSupply",
    BoardAttached = "BoardAttached",
    EXP02_MeasureDrawPile = "EXP02_MeasureDrawPile",
    EXP02_OpenMeasures = "EXP02_OpenMeasures",
    EXP02_MeasureRecyclePile = "EXP02_MeasureRecyclePile",
    EXP02_MeasureFinalDiscard = "EXP02_MeasureFinalDiscard"
}
export declare enum TileType {
    Resort = "Resort",
    Committee = "Committee",
    Grassroots = "Grassroots",
    Lobbyist = "Lobbyist",
    Hotspot = "Hotspot",
    StartCommittee = "StartCommittee",
    SystemTile = "SystemTile"
}
export interface Tile {
    id: string;
    type: TileType;
    resort?: ResourceType;
    weight?: number;
    name?: string;
    isHotspot?: boolean;
}
export type RegulationType = 'SecurityLevel' | 'Control' | 'Administration' | 'Blockade';
export interface GameObject {
    id: string;
    type: 'Influence' | 'Resource' | 'Measure' | 'Regulation';
    owner?: string;
    resort?: ResourceType;
    isStarting?: boolean;
    measureId?: string;
    playCount?: number;
    regType?: RegulationType;
    targetTileId?: string;
}
export interface Zone {
    id: ZoneId;
    name: string;
    items: string[];
}
export interface GameState {
    zones: Record<ZoneId, Zone>;
    tiles: Record<string, Tile>;
    objects: Record<string, GameObject>;
    adjacency: Record<string, string[]>;
    grid: Record<string, string>;
    secret?: any;
    roundNumber?: number;
    roundSettlementDone?: boolean;
    startCommitteeUsed?: Record<string, boolean>;
    playedMeasureThisRound?: Record<string, boolean>;
}
export interface ExpansionDefinition {
    name: string;
    resources?: ResourceType[];
    zones?: string[];
    onSetup?: (G: GameState, ctx: any) => void;
    modifiers?: {
        production?: (tileId: string, G: GameState, baseAmount: number) => number;
        cost?: (effect: any, G: GameState, baseCost: any) => any;
    };
    effectHandlers?: Record<string, (G: GameState, ctx: any, effect: any, utils: any) => void>;
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
