export type ReplayTileRef = Readonly<{
    tileId: string;
    label: string;
    kind: string;
    resort?: string;
    printedValue?: number;
    isStartCommittee?: boolean;
    grassrootsType?: string;
}>;

export type ReplayManifestRecord = Readonly<{
    recordType: 'manifest';
    tiles: Record<string, ReplayTileRef>;
    playerSeats: Record<string, string>;
    resourceTypes: readonly string[];
    seed?: string;
    matchConfig?: Record<string, unknown>;
    expansions?: readonly string[];
    loggingMode?: 'canonical';
    matchId?: string;
}>;

export type ReplayActionRecord = Readonly<{
    recordType: 'action';
    seq: number;
    round: number;
    turn: number;
    stage: string;
    player: string;
    moveType: string;
    intent: unknown;
    resolved: Record<string, unknown>;
    postActionStateHash?: string;
    matchId?: string;
}>;

export type ReplaySystemChoiceOpenedRecord = Readonly<{
    recordType: 'system.choiceOpened';
    choiceId: string;
    player: string;
    sourceTileId?: string;
    reason: string;
    options: readonly unknown[];
    matchId?: string;
}>;

export type ReplaySystemHotspotResolvedRecord = Readonly<{
    recordType: 'system.hotspotResolved';
    tileId: string;
    totals: Record<string, number>;
    placementAttempted: boolean;
    placementSucceeded: boolean;
    resolvedMark: boolean;
    matchId?: string;
}>;

export type ReplaySystemRoundSettlementRecord = Readonly<{
    recordType: 'system.roundSettlement';
    round: number;
    settlementKind: 'regular' | 'final';
    perTile: ReadonlyArray<Record<string, unknown>>;
    postSettlementStateHash?: string;
    matchId?: string;
}>;

export type ReplayCheckpointTurnEndRecord = Readonly<{
    recordType: 'checkpoint.turnEnd';
    turn: number;
    perPlayer: Record<string, Record<string, unknown>>;
    global: Record<string, unknown>;
    stateHash: string;
    matchId?: string;
}>;

export type ReplayCheckpointRoundEndRecord = Readonly<{
    recordType: 'checkpoint.roundEnd';
    round: number;
    perPlayer: Record<string, Record<string, unknown>>;
    global: Record<string, unknown>;
    stateHash: string;
    matchId?: string;
}>;

export type ReplayRecord = ReplayManifestRecord | ReplayActionRecord | ReplaySystemChoiceOpenedRecord | ReplaySystemHotspotResolvedRecord | ReplaySystemRoundSettlementRecord | ReplayCheckpointTurnEndRecord | ReplayCheckpointRoundEndRecord;

export interface ReplaySink { writeRecord(record: ReplayRecord): void; close?(): void | Promise<void>; }
export type ReplaySinkErrorRecord = Readonly<{ error: unknown; record: ReplayRecord }>;
export type ReplaySinkErrorChannel = (event: ReplaySinkErrorRecord) => void;
export type ReplayHookOptions = Readonly<{ sink?: ReplaySink; onError?: ReplaySinkErrorChannel; includeStateHash?: boolean }>;
export type ReplaySystemRoundSettlementPayload = Readonly<{ roundNumber: number; settlementKind: 'regular' | 'final'; resortTileOrder: readonly string[] }>;

/**
 * Compatibility projection helper retained for verifier imports.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function projectReplayStateSnapshot(_G: any): any { return { zones: {}, resources: {}, metaMarkers: {} }; }
