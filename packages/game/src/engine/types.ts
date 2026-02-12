import { PlayerID, ResourceType, TileType, GameState, RegulationType } from '@balance-control/rules';

/** 
 * SELECTORS: JSON-AST for filtering game objects 
 */
export type TileSelector =
    | { op: 'and'; args: TileSelector[] }
    | { op: 'or'; args: TileSelector[] }
    | { op: 'not'; arg: TileSelector }
    | { op: 'eq'; key: 'tileType' | 'id' | 'resort' | 'isHotspot'; value: any }
    | { op: 'in'; key: 'tileType' | 'tags'; values: any[] };

export type PlayerSelector =
    | { op: 'eq'; key: 'id'; value: PlayerID | 'currentPlayer' | 'opponent' }
    | { op: 'all' };

export type MissingControllerPolicy = 'ERROR' | 'NOISE' | 'SKIP';

/**
 * EFFECT ATOMS: The atomic instructions of the engine
 */
export type EffectAtom =
    // --- Resource Actions ---
    | { kind: 'resource.pay'; playerId: PlayerID | 'CONTROLLER'; amount: number; resorts: ResourceType[] | 'ANY'; resourceIds?: string[]; reason?: string; context?: any }
    | {
        kind: 'resource.grant';
        playerId: PlayerID | 'CONTROLLER';
        amount: number;
        resort: ResourceType;
        missingController?: MissingControllerPolicy;
        reason?: string;
        context?: any;
    }
    | { kind: 'production.resolve'; tileId: string; context?: any }

    // --- Influence Actions ---
    | { kind: 'influence.place'; playerId: PlayerID | 'CONTROLLER'; targetTileId: string; isStarting?: boolean; context?: any }
    | { kind: 'influence.move'; playerId: PlayerID | 'CONTROLLER'; sourceTileId: string; targetTileId: string; context?: any }
    | { kind: 'influence.formalize'; playerId: PlayerID; resourceIds: string[]; context?: any }
    | { kind: 'influence.suppress'; playerId: PlayerID; window: ExpiryTrigger; context?: any }

    // --- Map/Tile Actions ---
    | { kind: 'tile.place'; playerId: PlayerID; tileId: string; coord: string; context?: any }
    | { kind: 'hotspot.resolve'; tileId: string; context?: any }
    | { kind: 'hotspot.prohibit'; tileId: string; window: ExpiryTrigger; context?: any }

    // --- Regulation Actions (EXP-02) ---
    | { kind: 'regulation.place'; regType: RegulationType; targetTileId: string; context?: any }
    | { kind: 'regulation.move'; regulationId: string; targetTileId: string; context?: any }
    | { kind: 'regulation.remove'; regulationId: string; context?: any }

    // --- Climate/Countdown (EXP-03) ---
    | { kind: 'countdown.place'; targetTileId: string; amount: number; context?: any }

    // --- Measure Actions ---
    | { kind: 'measure.take'; playerId: PlayerID; measureObjectId: string; context?: any }
    | { kind: 'measure.play'; playerId: PlayerID; measureObjectId: string;[key: string]: any }
    | { kind: 'measure.recycle'; drawPileId: string; recyclePileId: string; context?: any }

    // --- Choice/Interaction ---
    | { kind: 'choice.request'; choice: ChoiceRequest; context?: any }
    | { kind: 'choice.apply'; choiceId: string; selection: any; context?: any }

    // --- Meta/Rule Modifiers ---
    | { kind: 'modifier.add'; modifier: ActiveModifier; context?: any }
    | { kind: 'modifier.remove'; sourceId: string; context?: any }
    | { kind: 'rule.prohibit'; actionType: string; playerId?: PlayerID; context?: any }
    | { kind: 'rule.attribute'; attribute: string; value: any; playerId?: PlayerID; targetTileId?: string; context?: any }
    | { kind: 'hook.trigger'; hook: HookPoint; payload?: any; context?: any };

/**
 * CHOICE SYSTEM: Multi-stage interaction
 */
export type ChoiceKind =
    | 'selectOption'
    | 'selectTile'
    | 'selectResource'
    | 'selectPlayer'
    | 'yesNo';

export interface ChoiceRequest {
    sourceId: string;
    player: PlayerID;
    kind: ChoiceKind;
    spec: any;
    choiceId?: string;
}

export interface PendingChoice {
    choiceId: string;      // Deterministic ID
    sourceId: string;      // Instance ID of the card/effect trigger
    player: PlayerID;
    kind: ChoiceKind;
    spec: any;             // Data for UI (options, filters, etc.)
    resumeToken: string;   // Internal state for continuing the resolver
}

/**
 * MODIFIER SYSTEM: Reactive rules
 */
export type HookPoint =
    | 'beforePayCost'
    | 'afterPayCost'
    | 'beforeAction'
    | 'afterAction'
    | 'onProduction'
    | 'onSettlement'
    | 'onMajority'
    | 'onTurnBegin'
    | 'onTurnEnd'
    | 'onRoundEnd';

export type ExpiryTrigger =
    | 'thisTurn'           // End of current player turn
    | 'nextTurn'           // Beginning of owning player's next turn
    | 'thisRound'          // End of current round settlement
    | 'nextRound'          // End of next round settlement
    | 'thisSettlement'     // End of current resolution cycle
    | 'immediate'
    | 'consumed';          // Manual removal

export interface ActiveModifier {
    id: string;
    sourceId: string;      // What created this (e.g. Measure ID)
    hook: HookPoint;
    effect: EffectAtom;
    expiry: ExpiryTrigger;

    // Scoping
    playerId?: PlayerID;
    targetTileId?: string;
    selector?: TileSelector;

    // Status
    consumeRule?: 'once' | 'turn' | 'round';
    priority?: number; // Higher runs first
}

/**
 * RESOLVER STATE: To be integrated into GameState
 */
export interface EngineState {
    idSeq: number;
    effectQueue: EffectAtom[];
    activeModifiers: ActiveModifier[];
    pendingChoice?: PendingChoice;
    history: any[]; // For RuleLog
    attributes: Record<string, any>; // Pervasive flags/values
}
