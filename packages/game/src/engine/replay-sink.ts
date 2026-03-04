import { INVALID_MOVE } from 'boardgame.io/core';
import { hashState } from '../hash-state';
import type { MoveMap } from '../move-module-registry';
import { deriveReplayTypedFields, type ReplayTypedFields } from './replay-typed-fields';

export type ReplayActionRecord = Readonly<{
    recordType: 'action';
    seq: number;
    player: string;
    moveType: string;
    args: unknown[];
    typedFields?: ReplayTypedFields;
    turn?: number;
    phase?: string;
    stateHash?: string;
    matchId?: string;
    seed?: string;
}>;

export type ReplaySystemRoundSettlementRecord = Readonly<{
    recordType: 'system.roundSettlement';
    roundNumber: number;
    settlementKind: 'regular' | 'final';
    resortTileOrder: readonly string[];
    stateHash?: string;
    matchId?: string;
    seed?: string;
}>;

export type ReplayRecord = ReplayActionRecord | ReplaySystemRoundSettlementRecord;

export interface ReplaySink {
    writeRecord(record: ReplayRecord): void;
}

export type ReplaySinkErrorRecord = Readonly<{
    error: unknown;
    record: ReplayRecord;
}>;

export type ReplaySinkErrorChannel = (event: ReplaySinkErrorRecord) => void;

export type ReplayHookOptions = Readonly<{
    sink?: ReplaySink;
    onError?: ReplaySinkErrorChannel;
    includeStateHash?: boolean;
}>;

export type ReplaySystemRoundSettlementPayload = Readonly<{
    roundNumber: number;
    settlementKind: 'regular' | 'final';
    resortTileOrder: readonly string[];
}>;


function resolveReplaySeed(context: any): string | undefined {
    const seedCandidate = context?.G?.engine?.seed ?? context?.G?.engine?.attributes?.seed;
    return typeof seedCandidate === 'string' ? seedCandidate : undefined;
}

/**
 * Wraps move handlers with a best-effort post-success replay hook.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function withReplaySink(moves: MoveMap, options?: ReplayHookOptions): MoveMap {
    if (!options?.sink) return moves;

    let seq = 0;
    const wrapped: MoveMap = {};

    for (const [moveType, moveFn] of Object.entries(moves)) {
        wrapped[moveType] = ((context: any, ...args: unknown[]) => {
            const isClientOptimistic = Boolean((context?.G as any)?._isPlayerView);
            const result = moveFn(context, ...args);
            if (result === INVALID_MOVE) return result;

            if (isClientOptimistic) {
                return result;
            }

            const playerId = context?.ctx?.currentPlayer;
            if (typeof playerId !== 'string') return result;

            const record: ReplayActionRecord = {
                recordType: 'action',
                seq,
                player: playerId,
                moveType,
                args,
                typedFields: deriveReplayTypedFields(moveType, args),
                turn: context?.ctx?.turn,
                phase: context?.ctx?.phase,
                stateHash: options.includeStateHash ? hashState(context.G) : undefined,
                matchId: typeof context?.ctx?.matchID === 'string' ? context.ctx.matchID : undefined,
                seed: resolveReplaySeed(context),
            };

            seq += 1;

            try {
                options.sink?.writeRecord(record);
            } catch (error) {
                options.onError?.({ error, record });
            }

            return result;
        }) as any;
    }

    return wrapped;
}

/**
 * Emits deterministic replay system records for engine-driven transitions without direct player moves.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function emitReplaySystemRecord(
    options: ReplayHookOptions | undefined,
    context: any,
    payload: ReplaySystemRoundSettlementPayload
): void {
    if (!options?.sink) return;

    const record: ReplaySystemRoundSettlementRecord = {
        recordType: 'system.roundSettlement',
        roundNumber: payload.roundNumber,
        settlementKind: payload.settlementKind,
        resortTileOrder: [...payload.resortTileOrder],
        stateHash: options.includeStateHash ? hashState(context.G) : undefined,
        matchId: typeof context?.ctx?.matchID === 'string' ? context.ctx.matchID : undefined,
        seed: resolveReplaySeed(context),
    };

    try {
        options.sink.writeRecord(record);
    } catch (error) {
        options.onError?.({ error, record });
    }
}
