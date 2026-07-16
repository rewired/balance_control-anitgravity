import type { GameConfig, GameState, MeasureDeckDescriptor, ResourceType } from '@balance-control/rules';
import type { AtomRegistration } from '../engine/engine-module-registry';

export type EnginePackId = 'core' | 'exp01' | 'exp02' | 'exp03';

export type PackManifest = Readonly<{
    id: EnginePackId;
    packVersion: string;
    rulesetAnchor: string;
    required: boolean;
    requires?: { core: string };
    compatibleWith?: string[];
}>;

/**
 * Per-stage move membership for the root turn structure.
 * @remarks infrastructure; no direct SPEC binding
 */
export type TurnStageDescriptor = Readonly<{
    moves: string[];
    next?: string;
}>;

/**
 * Root turn-structure contract supplied by the single required pack.
 * Only a pack with `manifest.required === true` may populate this
 * (validated by `EnginePackRegistry.validateEnabledPacks`).
 * @remarks infrastructure; no direct SPEC binding
 */
export type RootTurnDescriptor = Readonly<{
    order: {
        first: (args: { G: GameState }) => number;
        next: (args: { ctx: any }) => number;
    };
    activePlayers: Record<string, string>;
    stages: Record<string, TurnStageDescriptor>;
    rootMoveIds: string[];
    onBegin?: (args: { G: GameState; ctx: any; events: any }) => void;
    onEnd?: (args: { G: GameState; ctx: any }) => void;
}>;

export type EnginePackDefinition = Readonly<{
    id: EnginePackId;
    name: string;
    manifest: PackManifest;
    moves?: Record<string, (...args: any[]) => any>;
    resources?: ResourceType[];
    zones?: string[];
    measureDecks?: MeasureDeckDescriptor[];
    modifiers?: {
        production?: (tileId: string, G: GameState, baseAmount: number) => number;
        cost?: (effect: any, G: GameState, baseCost: any) => any;
    };
    effectHandlers?: Record<string, (G: GameState, ctx: any, effect: any, utils: any) => void>;
    getMeasureAtoms?: (G: GameState, measureId: string, payload: any) => any[] | null;
    setup?: {
        preShuffle?: (G: GameState, ctx: any, cfg: GameConfig) => void;
        postShuffle?: (G: GameState, ctx: any, cfg: GameConfig) => void;
    };
    engine?: {
        atoms?: (args: { triggerHook: (...args: any[]) => unknown }) => AtomRegistration[];
    };
    /** Root turn-structure contract; only the required pack may populate this. */
    turn?: RootTurnDescriptor;
    /** Win/draw condition; only the required pack may populate this. */
    endIf?: (args: { G: GameState }) => { winner: string } | { draw: true } | undefined;
    /** Per-player state masking; only the required pack may populate this. */
    playerView?: (G: GameState, playerID: string | null) => GameState;
    /** Legal-intent enumeration contribution for this pack's own moves. */
    enumerateIntents?: (G: GameState, ctx: any, playerID: string, stage: string) => any[];
}>;
