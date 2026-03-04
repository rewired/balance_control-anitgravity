import { INVALID_MOVE } from 'boardgame.io/core';
import { hashState } from '../hash-state';
import type { MoveMap } from '../move-module-registry';

export type ReplayActionRecord = Readonly<{
    seq: number;
    player: string;
    moveType: string;
    args: unknown[];
    turn?: number;
    phase?: string;
    stateHash?: string;
    matchId?: string;
    seed?: string;
}>;

export interface ReplaySink {
    writeAction(record: ReplayActionRecord): void;
}

export type ReplaySinkErrorRecord = Readonly<{
    error: unknown;
    record: ReplayActionRecord;
}>;

export type ReplaySinkErrorChannel = (event: ReplaySinkErrorRecord) => void;

export type ReplayHookOptions = Readonly<{
    sink?: ReplaySink;
    onError?: ReplaySinkErrorChannel;
    includeStateHash?: boolean;
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
                seq,
                player: playerId,
                moveType,
                args,
                turn: context?.ctx?.turn,
                phase: context?.ctx?.phase,
                stateHash: options.includeStateHash ? hashState(context.G) : undefined,
                matchId: typeof context?.ctx?.matchID === 'string' ? context.ctx.matchID : undefined,
                seed: resolveReplaySeed(context),
            };

            seq += 1;

            try {
                options.sink?.writeAction(record);
            } catch (error) {
                options.onError?.({ error, record });
            }

            return result;
        }) as any;
    }

    return wrapped;
}
