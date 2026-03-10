import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneName } from '@balance-control/rules';
import { hashState } from '../hash-state';
import type { MoveMap } from '../move-module-registry';
import { computeMajority } from '../mechanics';

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

type ReplayInfluenceProjection = Readonly<{ personalSupply: number; board: number }>;
type ReplayInfluenceDelta = Readonly<{ personalSupply: number; board: number }>;
type ReplayCheckpointSummary = Readonly<{
    perPlayer: Record<string, Record<string, unknown>>;
    global: Record<string, unknown>;
}>;

function projectPlayerInfluence(G: any, playerId: string): ReplayInfluenceProjection {
    let influenceBoard = 0;
    let influenceSupply = 0;
    const zones = G?.zones ?? {};
    for (const [zoneId, zone] of Object.entries(zones) as Array<[string, { items?: string[] }]>) {
        const itemIds = Array.isArray(zone?.items) ? zone.items : [];
        for (const itemId of itemIds) {
            const obj = G?.objects?.[itemId];
            if (obj?.type !== 'Influence' || obj?.owner !== playerId) continue;
            if (zoneId === `${CoreZoneName.PersonalSupply}:${playerId}`) {
                influenceSupply += 1;
            } else {
                influenceBoard += 1;
            }
        }
    }
    return { personalSupply: influenceSupply, board: influenceBoard };
}

function computeInfluenceDelta(pre: ReplayInfluenceProjection, post: ReplayInfluenceProjection): ReplayInfluenceDelta {
    return {
        personalSupply: post.personalSupply - pre.personalSupply,
        board: post.board - pre.board,
    };
}

function assertExpectedInfluenceDelta(options: ReplayHookOptions | undefined, record: ReplayActionRecord, expectedDelta: ReplayInfluenceDelta): void {
    const influenceProjection = record.resolved.influence as undefined | {
        pre?: ReplayInfluenceProjection;
        post?: ReplayInfluenceProjection;
    };
    if (!influenceProjection?.pre || !influenceProjection?.post) {
        throw new Error('Replay invariant failed: resolveChoice expected influence delta but projection snapshot was missing.');
    }
    const observedDelta = computeInfluenceDelta(influenceProjection.pre, influenceProjection.post);
    if (observedDelta.personalSupply !== expectedDelta.personalSupply || observedDelta.board !== expectedDelta.board) {
        const invariantRecord: ReplayActionRecord = {
            ...record,
            resolved: {
                ...record.resolved,
                outcome: 'error',
                errorCode: 'RESOLVE_CHOICE_INFLUENCE_INVARIANT_FAILED',
                influence: {
                    pre: influenceProjection.pre,
                    post: influenceProjection.post,
                    expectedDelta,
                    observedDelta,
                },
            },
        };
        options?.sink?.writeRecord(invariantRecord);
        throw new Error('Deterministic replay invariant failed for resolveChoice influence projection.');
    }
}

function buildManifest(context: any): ReplayManifestRecord {
    const G = context?.G ?? {};
    const tiles: Record<string, ReplayTileRef> = {};
    const tileEntries = Object.entries((G.tiles ?? {}) as Record<string, any>).sort(([a], [b]) => a.localeCompare(b));
    for (const [tileId, tile] of tileEntries) {
        tiles[tileId] = {
            tileId,
            label: tile?.name ?? tileId,
            kind: tile?.type ?? 'Unknown',
            resort: typeof tile?.resort === 'string' ? tile.resort : undefined,
            printedValue: typeof tile?.weight === 'number' ? tile.weight : undefined,
            isStartCommittee: tile?.type === 'StartCommittee' ? true : undefined,
            grassrootsType: tile?.conversion?.typedResort,
        };
    }
    const numPlayers = Number(context?.ctx?.numPlayers ?? 0);
    const playerSeats: Record<string, string> = {};
    for (let i = 0; i < numPlayers; i += 1) playerSeats[String(i)] = `Seat ${i}`;
    const resourceTypes = Array.from(new Set(Object.values((G.objects ?? {}) as Record<string, any>).filter((o: any) => o?.type === 'Resource').map((o: any) => o.resort).filter((v: any) => typeof v === 'string'))).sort();
    return {
        recordType: 'manifest',
        tiles,
        playerSeats,
        resourceTypes,
        seed: G?.engine?.attributes?.seed,
        matchConfig: typeof context?.ctx?.numPlayers === 'number' ? { players: context.ctx.numPlayers, expansions: G?.meta?.cfg?.expansions ?? {} } : undefined,
        expansions: Object.entries(G?.meta?.cfg?.expansions ?? {}).filter(([, v]) => v === true).map(([k]) => k).sort(),
        loggingMode: 'canonical',
        matchId: typeof context?.ctx?.matchID === 'string' ? context.ctx.matchID : undefined,
    };
}

/**
 * Projects deterministic checkpoint summary fields from a single authoritative snapshot.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function projectReplayCheckpointSummary(G: any, ctx: any): ReplayCheckpointSummary {
    const perPlayer: Record<string, Record<string, unknown>> = {};
    const players = Number(ctx?.numPlayers ?? 0);
    for (let i = 0; i < players; i += 1) {
        const pid = String(i);
        const { board: influenceBoard, personalSupply: influenceSupply } = projectPlayerInfluence(G, pid);
        const resourcesByResort: Record<string, number> = {};
        for (const obj of Object.values(G.objects ?? {}) as any[]) {
            if (obj?.type === 'Resource' && obj.owner === pid && typeof obj.resort === 'string') resourcesByResort[obj.resort] = (resourcesByResort[obj.resort] ?? 0) + 1;
        }
        perPlayer[pid] = { resourcesPersonalSupplyByResort: resourcesByResort, influence: { personalSupply: influenceSupply, board: influenceBoard, total: influenceSupply + influenceBoard } };
    }
    const drawPileCount = G?.zones?.[CoreZoneName.DrawPile]?.items?.length ?? 0;
    const discardFaceUpCount = G?.zones?.[CoreZoneName.DiscardFaceUp]?.items?.length ?? 0;
    const boardTileCount = G?.zones?.[CoreZoneName.Board]?.items?.length ?? 0;
    return { perPlayer, global: { drawPileCount, discardFaceUpCount, boardTileCount } };
}

function shouldLogReplayDebug(): boolean {
    const deterministicDevMode = process.env.BC_DETERMINISTIC_DEV_MODE === '1';
    return process.env.NODE_ENV !== 'production' || deterministicDevMode;
}

/**
 * Wrap move handlers with deterministic Replay v2 event emission.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function withReplaySink(moves: MoveMap, options?: ReplayHookOptions): MoveMap {
    if (!options?.sink) return moves;
    let seq = 1;
    let manifestWritten = false;
    let lastRecordedStateVersion: number | null = null;
    let previousPendingChoiceId: string | undefined;
    const wrapped: MoveMap = {};

    const readStateVersion = (ctx: any): number | null => {
        const candidate = Number(ctx?._stateID);
        return Number.isFinite(candidate) && candidate >= 0 ? candidate : null;
    };

    for (const [moveType, moveFn] of Object.entries(moves)) {
        wrapped[moveType] = ((context: any, ...args: unknown[]) => {
            const isClientOptimistic = Boolean((context?.G as any)?._isPlayerView);
            const currentPlayer = context?.ctx?.currentPlayer;
            const placeInfluencePre = moveType === 'placeInfluence' && typeof currentPlayer === 'string'
                ? projectPlayerInfluence(context?.G, currentPlayer)
                : undefined;
            const resolveChoicePre = moveType === 'resolveChoice' && typeof currentPlayer === 'string'
                ? projectPlayerInfluence(context?.G, currentPlayer)
                : undefined;
            const preMoveStateRef = context?.G;
            const preMoveStateVersion = readStateVersion(context?.ctx);
            const result = moveFn(context, ...args);
            if (result === INVALID_MOVE) return result;
            const playerId = currentPlayer;
            if (typeof playerId !== 'string') return result;

            try {
                if (!manifestWritten) {
                    options.sink?.writeRecord(buildManifest(context));
                    manifestWritten = true;
                }

                const authoritativeG = context?.G;
                const authoritativeCtx = context?.ctx;
                const postMoveStateVersion = readStateVersion(authoritativeCtx);
                const isOptimisticNoCommitPass = isClientOptimistic
                    && preMoveStateVersion !== null
                    && postMoveStateVersion !== null
                    && preMoveStateVersion === postMoveStateVersion;
                const isDuplicateOrStalePass = postMoveStateVersion !== null
                    && lastRecordedStateVersion !== null
                    && postMoveStateVersion <= lastRecordedStateVersion;
                if (isOptimisticNoCommitPass || isDuplicateOrStalePass) {
                    return result;
                }
                if (shouldLogReplayDebug()) {
                    console.debug('[ReplayDebug] withReplaySink.moveStateSnapshot', {
                        moveType,
                        playerId,
                        preStateVersion: preMoveStateVersion,
                        postStateVersion: postMoveStateVersion,
                        sameObjectIdentity: preMoveStateRef === authoritativeG,
                    });
                }
                const drawnTileId = authoritativeG?.zones?.[`staging_${playerId}`]?.items?.[0];
                const drawnTile = drawnTileId ? authoritativeG?.tiles?.[drawnTileId] : undefined;
                const placeInfluencePost = moveType === 'placeInfluence' ? projectPlayerInfluence(authoritativeG, playerId) : undefined;
                const resolveChoicePost = moveType === 'resolveChoice' ? projectPlayerInfluence(authoritativeG, playerId) : undefined;
                const postCommitStateHash = options.includeStateHash ? hashState(authoritativeG) : undefined;
                const checkpointSummary = projectReplayCheckpointSummary(authoritativeG, authoritativeCtx);
                if (moveType === 'placeInfluence' && placeInfluencePre && placeInfluencePost) {
                    const expectedPersonalSupply = placeInfluencePre.personalSupply - 1;
                    const expectedBoard = placeInfluencePre.board + 1;
                    if (placeInfluencePost.personalSupply !== expectedPersonalSupply || placeInfluencePost.board !== expectedBoard) {
                        const invariantRecord: ReplayActionRecord = {
                            recordType: 'action',
                            seq,
                            round: Number(context?.G?.roundNumber ?? 0),
                            turn: Number(context?.ctx?.turn ?? 0),
                            stage: String(context?.ctx?.activePlayers?.[playerId] ?? context?.ctx?.phase ?? 'unknown'),
                            player: playerId,
                            moveType,
                            intent: args.length === 1 ? args[0] : args,
                            resolved: {
                                outcome: 'error',
                                errorCode: 'PLACE_INFLUENCE_INVARIANT_FAILED',
                                influence: {
                                    pre: placeInfluencePre,
                                    post: placeInfluencePost,
                                    expectedDelta: { personalSupply: -1, board: 1 },
                                    observedDelta: {
                                        personalSupply: placeInfluencePost.personalSupply - placeInfluencePre.personalSupply,
                                        board: placeInfluencePost.board - placeInfluencePre.board,
                                    },
                                },
                            },
                            postActionStateHash: postCommitStateHash,
                            matchId: typeof context?.ctx?.matchID === 'string' ? context.ctx.matchID : undefined,
                        };
                        options.sink?.writeRecord(invariantRecord);
                        throw new Error('Deterministic replay invariant failed for placeInfluence.');
                    }
                }
                const record: ReplayActionRecord = {
                    recordType: 'action',
                    seq,
                    round: Number(context?.G?.roundNumber ?? 0),
                    turn: Number(context?.ctx?.turn ?? 0),
                    stage: String(context?.ctx?.activePlayers?.[playerId] ?? context?.ctx?.phase ?? 'unknown'),
                    player: playerId,
                    moveType,
                    intent: args.length === 1 ? args[0] : args,
                    resolved: {
                        outcome: 'applied',
                        ...(moveType === 'placeInfluence' && placeInfluencePre && placeInfluencePost ? {
                            influence: {
                                pre: placeInfluencePre,
                                post: placeInfluencePost,
                                expectedDelta: { personalSupply: -1, board: 1 },
                                observedDelta: {
                                    personalSupply: placeInfluencePost.personalSupply - placeInfluencePre.personalSupply,
                                    board: placeInfluencePost.board - placeInfluencePre.board,
                                },
                            },
                        } : {}),
                        ...(moveType === 'resolveChoice' && resolveChoicePre && resolveChoicePost ? {
                            influence: {
                                pre: resolveChoicePre,
                                post: resolveChoicePost,
                                observedDelta: computeInfluenceDelta(resolveChoicePre, resolveChoicePost),
                            },
                        } : {}),
                        ...(moveType === 'placeTile' ? {
                            drawnTileId,
                            drawnTileRef: drawnTile ? { label: drawnTile.name ?? drawnTileId, kind: drawnTile.type } : undefined,
                            placementOutcome: drawnTileId ? 'placed' : 'discarded_unplaceable',
                        } : {}),
                    },
                    postActionStateHash: postCommitStateHash,
                    matchId: typeof context?.ctx?.matchID === 'string' ? context.ctx.matchID : undefined,
                };
                options.sink?.writeRecord(record);

                if (moveType === 'resolveChoice' && resolveChoicePre && resolveChoicePost) {
                    const selection = (args.length === 1 ? (args[0] as any) : undefined)?.selection;
                    if (selection === 'Receive 1 Influence' || selection === 'Receive 1 Influence (Labor Market)') {
                        assertExpectedInfluenceDelta(options, record, { personalSupply: -1, board: 1 });
                    }
                }

                const pendingChoice = context?.G?.engine?.pendingChoice;
                const pendingChoiceId = typeof pendingChoice?.choiceId === 'string' ? pendingChoice.choiceId : undefined;
                if (pendingChoiceId && pendingChoiceId !== previousPendingChoiceId) {
                    options.sink?.writeRecord({
                        recordType: 'system.choiceOpened',
                        choiceId: pendingChoiceId,
                        player: String(pendingChoice.player ?? playerId),
                        sourceTileId: typeof pendingChoice?.sourceId === 'string' ? pendingChoice.sourceId : undefined,
                        reason: String(pendingChoice?.sourceId ?? 'choice.requested'),
                        options: Array.isArray(pendingChoice?.spec?.options) ? pendingChoice.spec.options : [],
                        matchId: record.matchId,
                    });
                }
                previousPendingChoiceId = pendingChoiceId;

                options.sink?.writeRecord({
                    recordType: 'checkpoint.turnEnd',
                    turn: Number(authoritativeCtx?.turn ?? 0),
                    perPlayer: checkpointSummary.perPlayer,
                    global: checkpointSummary.global,
                    stateHash: hashState(authoritativeG),
                    matchId: record.matchId,
                });
                if (postMoveStateVersion !== null) {
                    lastRecordedStateVersion = postMoveStateVersion;
                }
            } catch (error) {
                options.onError?.({ error, record: { recordType: 'action', seq, round: 0, turn: 0, stage: 'unknown', player: playerId, moveType, intent: args, resolved: {} } });
            }
            seq += 1;
            return result;
        }) as any;
    }

    return wrapped;
}

/**
 * Emit deterministic replay records for system-driven round settlement transitions.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function emitReplaySystemRecord(options: ReplayHookOptions | undefined, context: any, payload: ReplaySystemRoundSettlementPayload): void {
    if (!options?.sink) return;
    const perTile = payload.resortTileOrder.map((tileId, index) => {
        const tile = context?.G?.tiles?.[tileId] ?? {};
        const majority = computeMajority(tileId, context?.G as any);
        const computedOutput = Number(tile?.weight ?? 0);
        return {
            tileId,
            tileRef: { label: tile?.name ?? tileId, kind: tile?.type ?? 'Unknown' },
            position: index,
            resort: tile?.resort,
            printedValue: tile?.weight,
            modifiers: [],
            computedOutput,
            majorityTotals: Object.fromEntries((majority.winners ?? []).map((winner: string) => [winner, 1])),
            winners: majority.controller ? [majority.controller] : [],
            distribution: majority.controller ? { [majority.controller]: computedOutput } : {},
            noise: majority.controller ? 0 : computedOutput,
        };
    });
    const matchId = typeof context?.ctx?.matchID === 'string' ? context.ctx.matchID : undefined;
    options.sink.writeRecord({
        recordType: 'system.roundSettlement',
        round: payload.roundNumber,
        settlementKind: payload.settlementKind,
        perTile,
        postSettlementStateHash: options.includeStateHash ? hashState(context.G) : undefined,
        matchId,
    });
    const checkpointSummary = projectReplayCheckpointSummary(context?.G, context?.ctx);
    if (perTile.length > 0 && Number(checkpointSummary.global.boardTileCount ?? 0) <= 0) {
        throw new Error('Replay invariant failed: settlement perTile is non-empty while boardTileCount is 0.');
    }
    options.sink.writeRecord({ recordType: 'checkpoint.roundEnd', round: payload.roundNumber, perPlayer: checkpointSummary.perPlayer, global: checkpointSummary.global, stateHash: hashState(context.G), matchId });
}

/**
 * Compatibility projection helper retained for verifier imports.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @pure
 */
export function projectReplayStateSnapshot(_G: any): any { return { zones: {}, resources: {}, metaMarkers: {} }; }
