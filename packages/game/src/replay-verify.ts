import { Client } from 'boardgame.io/client';
import { createBalanceControlGame } from './index';
import { SetupGame } from './setup';
import { hashState } from './hash-state';
import { EnginePackRegistry } from './expansion-registry';
import { CorePack } from './packs/core';
import { CoreMoves } from './moves';

type ReplayHeaderRecord = Readonly<{
    recordType: 'header';
    schemaVersion: '1' | string;
    seed: string;
    matchConfig: Record<string, unknown>;
}>;

type ReplayActionRecord = Readonly<{
    recordType: 'action';
    seq: number;
    player: string;
    moveType: string;
    args?: unknown;
    typedFields?: Record<string, unknown>;
}>;

type ReplaySystemRoundSettlementRecord = Readonly<{
    recordType: 'system.roundSettlement';
    roundNumber: number;
    settlementKind: 'regular' | 'final';
    resortTileOrder: readonly string[];
    stateHash?: string;
}>;

type ReplayCheckpointRecord = Readonly<{
    recordType: 'checkpoint';
    afterSeq?: number;
    stateHash: string;
}>;

type ReplayFooterRecord = Readonly<{
    recordType: 'footer';
    finalStateHash?: string;
    totalActions?: number;
}>;

export type ReplayNdjsonRecord = ReplayHeaderRecord | ReplayActionRecord | ReplaySystemRoundSettlementRecord | ReplayCheckpointRecord | ReplayFooterRecord;

export type ReplayVerifyOptions = Readonly<{
    verifyCheckpoints?: boolean;
    verifyFinalHash?: boolean;
}>;

function toArgs(args: unknown): unknown[] {
    if (args === undefined) return [];
    return Array.isArray(args) ? args : [args];
}

function resolveMoveArgs(G: any, move: string, args: unknown[]): unknown[] {
    if (!args || args.length === 0) return args;
    return args.map((arg) => {
        if (!arg || typeof arg !== 'object') return arg;
        if (move === 'moveInfluence') {
            const payload = arg as Record<string, unknown>;
            const { sourceCoord, targetCoord, ...rest } = payload;
            const sourceId = typeof sourceCoord === 'string' ? G.grid[sourceCoord] : rest.sourceId;
            const targetId = typeof targetCoord === 'string' ? G.grid[targetCoord] : rest.targetId;
            return { ...rest, sourceId, targetId };
        }
        if (move === 'placeInfluence') {
            const payload = arg as Record<string, unknown>;
            const { targetCoord, ...rest } = payload;
            const targetTileId = typeof targetCoord === 'string' ? G.grid[targetCoord] : rest.targetTileId;
            return { ...rest, targetTileId };
        }
        if (move === 'convertResources') {
            const payload = arg as Record<string, unknown>;
            const { grassrootsCoord, ...rest } = payload;
            const grassrootsTileId = typeof grassrootsCoord === 'string' ? G.grid[grassrootsCoord] : rest.grassrootsTileId;
            return { ...rest, grassrootsTileId };
        }
        if (move === 'formalizeInfluence') {
            const payload = arg as Record<string, unknown>;
            const { committeeCoord, ...rest } = payload;
            const committeeTileId = typeof committeeCoord === 'string' ? G.grid[committeeCoord] : rest.committeeTileId;
            return { ...rest, committeeTileId };
        }
        return arg;
    });
}

function getNumPlayers(matchConfig: Record<string, unknown>): number {
    const direct = matchConfig.numPlayers;
    if (typeof direct === 'number' && Number.isInteger(direct) && direct >= 2) return direct;

    const players = matchConfig.players;
    if (typeof players === 'number' && Number.isInteger(players) && players >= 2) return players;

    throw new Error('Replay header mismatch at seq 0: matchConfig must include integer players/numPlayers >= 2.');
}

function fail(seq: number, message: string): never {
    throw new Error(`Replay divergence at seq ${seq}: ${message}`);
}

function ensureCorePackForReplayVerifier(): void {
    const corePack = EnginePackRegistry.getRegisteredPacks().find((pack) => pack.id === 'core');
    if (corePack && Object.keys(corePack.moves ?? {}).length > 0) return;
    EnginePackRegistry.registerPack({ ...CorePack, moves: CoreMoves });
}

function validateRoundSettlementRecord(record: ReplaySystemRoundSettlementRecord, seq: number): void {
    if (!Number.isInteger(record.roundNumber) || record.roundNumber < 1) {
        fail(seq, `invalid system.roundSettlement.roundNumber ${record.roundNumber}.`);
    }
    if (record.settlementKind !== 'regular' && record.settlementKind !== 'final') {
        fail(seq, `invalid system.roundSettlement.settlementKind "${record.settlementKind}".`);
    }
    if (!Array.isArray(record.resortTileOrder) || record.resortTileOrder.some((tileId) => typeof tileId !== 'string')) {
        fail(seq, 'invalid system.roundSettlement.resortTileOrder (expected string[]).');
    }
    if (record.stateHash !== undefined && typeof record.stateHash !== 'string') {
        fail(seq, 'invalid system.roundSettlement.stateHash (expected string when present).');
    }
}

function validateActionTypedFields(record: ReplayActionRecord): void {
    if (record.typedFields === undefined) return;
    if (!record.typedFields || typeof record.typedFields !== 'object' || Array.isArray(record.typedFields)) {
        fail(record.seq, 'invalid action.typedFields (expected object when present).');
    }

    const allowedTypes = new Set(['tileId', 'resourceType', 'resourceCount', 'resourceId[]']);
    for (const [fieldPath, fieldType] of Object.entries(record.typedFields)) {
        if (typeof fieldPath !== 'string' || fieldPath.length === 0) {
            fail(record.seq, 'invalid action.typedFields key (expected non-empty string path).');
        }
        if (typeof fieldType !== 'string' || !allowedTypes.has(fieldType)) {
            fail(record.seq, `invalid action.typedFields["${fieldPath}"] type "${String(fieldType)}".`);
        }
    }
}

/**
 * Verifies Replay Format v1 NDJSON records against deterministic engine execution.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function verifyReplayRecords(records: readonly ReplayNdjsonRecord[], options: ReplayVerifyOptions = {}): {
    totalActions: number;
    finalStateHash: string;
} {
    if (records.length < 2) {
        throw new Error('Replay input invalid: expected at least header and footer records.');
    }

    const header = records[0];
    if (header.recordType !== 'header') {
        throw new Error('Replay input invalid: first record must be header.');
    }

    const footer = records[records.length - 1];
    if (footer.recordType !== 'footer') {
        throw new Error('Replay input invalid: last record must be footer.');
    }

    const numPlayers = getNumPlayers(header.matchConfig);
    ensureCorePackForReplayVerifier();
    const baseGame = createBalanceControlGame();
    const game = {
        ...baseGame,
        seed: header.seed,
        playerView: ({ G }: any) => G,
        setup: (ctx: any) => SetupGame({ ctx, setupData: header.matchConfig })
    };

    const client = Client({ game, numPlayers });
    client.start();

    let expectedSeq = 1;
    let actionCount = 0;

    for (let i = 1; i < records.length - 1; i += 1) {
        const record = records[i];

        if (record.recordType === 'action') {
            validateActionTypedFields(record);
            if (record.seq !== expectedSeq) {
                fail(expectedSeq, `expected action seq ${expectedSeq}, got ${record.seq}.`);
            }

            const moveFn = (client.moves as any)[record.moveType];
            if (typeof moveFn !== 'function') {
                fail(record.seq, `unknown moveType "${record.moveType}".`);
            }

            (client as any).updatePlayerID(record.player);
            const before = client.getState();
            const beforeStateId = before?._stateID;
            const resolvedArgs = resolveMoveArgs(before?.G, record.moveType, toArgs(record.args));
            moveFn(...resolvedArgs);
            const after = client.getState();

            if (!after || after._stateID === beforeStateId) {
                fail(record.seq, `move "${record.moveType}" by player ${record.player} was rejected or produced no state transition.`);
            }

            expectedSeq += 1;
            actionCount += 1;
            continue;
        }

        if (record.recordType === 'system.roundSettlement') {
            validateRoundSettlementRecord(record, expectedSeq - 1);
            if (options.verifyCheckpoints && typeof record.stateHash === 'string') {
                const state = client.getState();
                if (!state) {
                    fail(expectedSeq - 1, 'engine produced no state for system.roundSettlement hash verification.');
                }
                const actualHash = hashState(state.G as any);
                if (actualHash !== record.stateHash) {
                    fail(expectedSeq - 1, `system.roundSettlement hash mismatch (expected ${record.stateHash}, got ${actualHash}).`);
                }
            }
            continue;
        }

        if (record.recordType === 'checkpoint') {
            if (!options.verifyCheckpoints) continue;

            const state = client.getState();
            if (!state) {
                fail(record.afterSeq ?? expectedSeq - 1, 'engine produced no state for checkpoint verification.');
            }
            const actualHash = hashState(state.G as any);
            if (actualHash !== record.stateHash) {
                fail(record.afterSeq ?? expectedSeq - 1, `checkpoint hash mismatch (expected ${record.stateHash}, got ${actualHash}).`);
            }
            continue;
        }

        fail(expectedSeq - 1, `unexpected recordType "${(record as any).recordType}" in body.`);
    }

    if (typeof footer.totalActions === 'number' && footer.totalActions !== actionCount) {
        fail(actionCount, `footer totalActions mismatch (expected ${footer.totalActions}, got ${actionCount}).`);
    }

    const finalState = client.getState();
    if (!finalState) {
        fail(actionCount, 'engine produced no final state.');
    }
    const finalStateHash = hashState(finalState.G as any);

    if (options.verifyFinalHash && typeof footer.finalStateHash === 'string' && footer.finalStateHash.length > 0) {
        if (footer.finalStateHash !== finalStateHash) {
            fail(actionCount, `final hash mismatch (expected ${footer.finalStateHash}, got ${finalStateHash}).`);
        }
    }

    return { totalActions: actionCount, finalStateHash };
}
