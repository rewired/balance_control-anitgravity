import { PlayerID, ResourceType, TileType, GameObject } from '@balance-control/rules';

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

/**
 * EFFECT ATOMS: The atomic instructions of the engine
 */
export type EffectAtom =
    // --- Resource Actions ---
    | { kind: 'resource.pay'; playerId: PlayerID; amount: number; resorts: ResourceType[] | 'ANY'; reason?: string }
    | { kind: 'resource.grant'; playerId: PlayerID; amount: number; resort: ResourceType; reason?: string }

    // --- Influence Actions ---
    | { kind: 'influence.place'; playerId: PlayerID; targetTileId: string; isStarting?: boolean }
    | { kind: 'influence.move'; playerId: PlayerID; sourceTileId: string; targetTileId: string }
    | { kind: 'influence.formalize'; playerId: PlayerID; resourceIds: string[] }
    | { kind: 'influence.suppress'; playerId: PlayerID; window: ExpiryTrigger }

    // --- Map/Tile Actions ---
    | { kind: 'tile.place'; playerId: PlayerID; tileId: string; coord: string }
    | { kind: 'hotspot.resolve'; tileId: string }
    | { kind: 'hotspot.prohibit'; tileId: string; window: ExpiryTrigger }

    // --- Regulation Actions (EXP-02) ---
    | { kind: 'regulation.place'; regType: string; targetTileId: string; costPaid?: boolean }
    | { kind: 'regulation.remove'; regulationId: string }

    // --- Climate/Countdown (EXP-03) ---
    | { kind: 'countdown.place'; targetTileId: string; amount: number }

    // --- Choice/Interaction ---
    | { kind: 'choice.request'; choice: Omit<PendingChoice, 'resumeToken'> }

    // --- Meta/Rule Modifiers ---
    | { kind: 'modifier.add'; modifier: ActiveModifier }
    | { kind: 'modifier.remove'; sourceId: string };

/**
 * CHOICE SYSTEM: Multi-stage interaction
 */
export type ChoiceKind =
    | 'selectOption'
    | 'selectTile'
    | 'selectResource'
    | 'selectPlayer'
    | 'yesNo';

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
    | 'onMajority';

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
}

/**
 * RESOLVER STATE: To be integrated into GameState
 */
export interface EngineState {
    effectQueue: EffectAtom[];
    activeModifiers: ActiveModifier[];
    pendingChoice?: PendingChoice;
    history: any[]; // For RuleLog
}
