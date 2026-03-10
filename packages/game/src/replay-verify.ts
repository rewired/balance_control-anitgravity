import { Client } from 'boardgame.io/client';
import { createBalanceControlGame } from './index';
import { SetupGame } from './setup';
import { hashState } from './hash-state';
import { EnginePackRegistry } from './expansion-registry';
import { CorePack } from './packs/core';
import { CoreMoves } from './moves';
import { canonicalJsonStringify } from './hash-state';
import { projectReplayCheckpointSummary } from './engine/replay-sink';
import { CoreZoneName } from '@balance-control/rules';

type ReplayHeaderRecord = Readonly<{ recordType: 'header'; schemaVersion: '2' | string; seed: string; matchConfig: Record<string, unknown>; }>;
type ReplayManifestRecord = Readonly<{ recordType: 'manifest' }>;
type ReplayActionRecord = Readonly<{ recordType: 'action'; seq: number; round?: number; turn?: number; player: string; moveType: string; intent?: unknown; resolved?: Record<string, unknown>; }>;
type ReplayChoiceOpenedRecord = Readonly<{ recordType: 'system.choiceOpened'; choiceId: string }>;
type ReplayRoundSettlementRecord = Readonly<{ recordType: 'system.roundSettlement'; round?: number; perTile?: ReadonlyArray<Record<string, unknown>>; postSettlementStateHash?: string }>;
type ReplayCheckpointRecord = Readonly<{ recordType: 'checkpoint.turnEnd' | 'checkpoint.roundEnd'; perPlayer: Record<string, Record<string, unknown>>; global: Record<string, unknown>; stateHash: string }>;
type ReplayFooterRecord = Readonly<{ recordType: 'footer'; finalStateHash?: string; totalActions?: number }>;
export type ReplayNdjsonRecord = ReplayHeaderRecord | ReplayManifestRecord | ReplayActionRecord | ReplayChoiceOpenedRecord | ReplayRoundSettlementRecord | ReplayCheckpointRecord | ReplayFooterRecord;
export type ReplayVerifyOptions = Readonly<{ verifyCheckpoints?: boolean; verifyFinalHash?: boolean }>;

function getNumPlayers(matchConfig: Record<string, unknown>): number { const p = (matchConfig.players ?? matchConfig.numPlayers) as number; if (Number.isInteger(p) && p >= 2) return p; throw new Error('Replay header mismatch at seq 0: matchConfig must include integer players/numPlayers >= 2.'); }
type ReplayFailureContext = Readonly<{ recordIndex: number; seq?: number; turn?: number; round?: number; tileId?: string; player?: string }>;

function fail(context: ReplayFailureContext, message: string): never {
    const details = [`recordIndex=${context.recordIndex}`];
    if (context.seq !== undefined) details.push(`seq=${context.seq}`);
    if (context.turn !== undefined) details.push(`turn=${context.turn}`);
    if (context.round !== undefined) details.push(`round=${context.round}`);
    if (context.tileId !== undefined) details.push(`tileId=${context.tileId}`);
    if (context.player !== undefined) details.push(`player=${context.player}`);
    throw new Error(`Replay divergence (${details.join(' ')}): ${message}`);
}
function ensureCorePackForReplayVerifier(): void { const corePack = EnginePackRegistry.getRegisteredPacks().find((pack) => pack.id === 'core'); if (corePack && Object.keys(corePack.moves ?? {}).length > 0) return; EnginePackRegistry.registerPack({ ...CorePack, moves: CoreMoves }); }

function readIntent(intent: unknown): Record<string, unknown> | undefined {
    if (!intent || typeof intent !== 'object' || Array.isArray(intent)) return undefined;
    return intent as Record<string, unknown>;
}

function countInfluenceInBoard(G: any): number {
    let total = 0;
    const boardTiles = Array.isArray(G?.zones?.[CoreZoneName.Board]?.items) ? G.zones[CoreZoneName.Board].items : [];
    for (const tileId of boardTiles) {
        const zoneItems = Array.isArray(G?.zones?.[tileId]?.items) ? G.zones[tileId].items : [];
        for (const itemId of zoneItems) {
            if (G?.objects?.[itemId]?.type === 'Influence') total += 1;
        }
    }
    return total;
}

function countTileInfluence(G: any, tileId: string): number {
    const zoneItems = Array.isArray(G?.zones?.[tileId]?.items) ? G.zones[tileId].items : [];
    return zoneItems.reduce((acc: number, itemId: string) => acc + (G?.objects?.[itemId]?.type === 'Influence' ? 1 : 0), 0);
}

function countPlayerInfluenceProjection(G: any, player: string): { personalSupply: number; board: number } {
    let personalSupply = 0;
    let board = 0;
    for (const [zoneId, zone] of Object.entries(G?.zones ?? {}) as Array<[string, { items?: string[] }]>) {
        for (const itemId of zone.items ?? []) {
            const obj = G?.objects?.[itemId];
            if (obj?.type !== 'Influence' || obj?.owner !== player) continue;
            if (zoneId === `${CoreZoneName.PersonalSupply}:${player}`) personalSupply += 1;
            else board += 1;
        }
    }
    return { personalSupply, board };
}

function tileOnBoard(G: any, tileId: string): boolean {
    const boardTiles = Array.isArray(G?.zones?.[CoreZoneName.Board]?.items) ? G.zones[CoreZoneName.Board].items : [];
    return boardTiles.includes(tileId);
}

/**
 * Verifies Replay v2 NDJSON records against deterministic engine execution.
 * @remarks infrastructure; no direct SPEC binding
 * @deterministic
 * @sideEffects
 */
export function verifyReplayRecords(records: readonly ReplayNdjsonRecord[], options: ReplayVerifyOptions = {}): { totalActions: number; finalStateHash: string } {
    if (records.length < 4) throw new Error('Replay input invalid: expected at least header, manifest, body and footer records.');
    const header = records[0]; if (header.recordType !== 'header') throw new Error('Replay input invalid: first record must be header.');
    if (records[1].recordType !== 'manifest') throw new Error('Replay input invalid: second record must be manifest.');
    const footer = records[records.length - 1]; if (footer.recordType !== 'footer') throw new Error('Replay input invalid: last record must be footer.');

    ensureCorePackForReplayVerifier();
    const client = Client({ game: { ...createBalanceControlGame(), seed: header.seed, playerView: ({ G }: any) => G, setup: (ctx: any) => SetupGame({ ctx, setupData: header.matchConfig }) }, numPlayers: getNumPlayers(header.matchConfig) });
    client.start();

    let expectedSeq = 1; let actionCount = 0; let lastWasChoiceOpened = false;
    const verifyCheckpoints = options.verifyCheckpoints ?? true;
    for (let i = 2; i < records.length - 1; i += 1) {
        const record = records[i];
        if (record.recordType === 'system.choiceOpened') { lastWasChoiceOpened = true; continue; }
        if (record.recordType === 'action') {
            if (record.moveType === 'resolveChoice' && !lastWasChoiceOpened) fail({ recordIndex: i, seq: record.seq, turn: record.turn, round: record.round, player: record.player }, 'resolveChoice must be preceded by system.choiceOpened.');
            lastWasChoiceOpened = false;
            if (record.seq !== expectedSeq) fail({ recordIndex: i, seq: record.seq, turn: record.turn, round: record.round, player: record.player }, `expected action seq ${expectedSeq}, got ${record.seq}.`);
            const moveFn = (client.moves as any)[record.moveType]; if (typeof moveFn !== 'function') fail({ recordIndex: i, seq: record.seq, turn: record.turn, round: record.round, player: record.player }, `unknown moveType \"${record.moveType}\".`);
            (client as any).updatePlayerID(record.player);
            const before = client.getState();
            const intent = readIntent(record.intent);
            const tileBindingRequirements: Record<string, readonly string[]> = {
                placeInfluence: ['targetTileId'],
                moveInfluence: ['sourceId', 'targetId'],
                formalizeInfluence: ['committeeTileId'],
                convertResources: ['grassrootsTileId'],
            };
            for (const tileKey of tileBindingRequirements[record.moveType] ?? []) {
                const tileId = typeof intent?.[tileKey] === 'string' ? String(intent[tileKey]) : undefined;
                if (!tileId || !tileOnBoard(before?.G, tileId)) {
                    fail({ recordIndex: i, seq: record.seq, turn: record.turn, round: record.round, tileId, player: record.player }, `intent.${tileKey} must resolve to a tile currently in Board zone for moveType "${record.moveType}".`);
                }
            }
            const beforeProjection = countPlayerInfluenceProjection(before?.G, record.player);
            const beforeBoardInfluenceTotal = countInfluenceInBoard(before?.G);
            const sourceTileId = typeof intent?.sourceId === 'string' ? intent.sourceId : undefined;
            const targetTileId = typeof intent?.targetId === 'string' ? intent.targetId : undefined;
            const beforeSourceCount = sourceTileId ? countTileInfluence(before?.G, sourceTileId) : undefined;
            const beforeTargetCount = targetTileId ? countTileInfluence(before?.G, targetTileId) : undefined;
            moveFn(...(record.intent === undefined ? [] : [record.intent]));
            const after = client.getState();
            if (!after || after._stateID === before?._stateID) fail({ recordIndex: i, seq: record.seq, turn: record.turn, round: record.round, player: record.player }, `move "${record.moveType}" by player ${record.player} was rejected or produced no state transition.`);

            if (record.moveType === 'placeInfluence' && record.resolved?.outcome === 'applied') {
                const afterProjection = countPlayerInfluenceProjection(after.G, record.player);
                if (afterProjection.personalSupply !== beforeProjection.personalSupply - 1 || afterProjection.board !== beforeProjection.board + 1) {
                    fail({ recordIndex: i, seq: record.seq, turn: record.turn, round: record.round, tileId: typeof intent?.targetTileId === 'string' ? intent.targetTileId : undefined, player: record.player }, 'placeInfluence(applied) must produce influence delta personalSupply=-1 and board=+1.');
                }
            }

            if (record.moveType === 'moveInfluence' && record.resolved?.outcome === 'applied') {
                const afterBoardInfluenceTotal = countInfluenceInBoard(after.G);
                if (afterBoardInfluenceTotal !== beforeBoardInfluenceTotal) {
                    fail({ recordIndex: i, seq: record.seq, turn: record.turn, round: record.round, tileId: targetTileId, player: record.player }, 'moveInfluence(applied) must keep total board influence unchanged.');
                }
                if (!sourceTileId || !targetTileId || beforeSourceCount === undefined || beforeTargetCount === undefined) {
                    fail({ recordIndex: i, seq: record.seq, turn: record.turn, round: record.round, player: record.player }, 'moveInfluence(applied) requires sourceId and targetId for tile binding validation.');
                }
                const afterSourceCount = countTileInfluence(after.G, sourceTileId);
                const afterTargetCount = countTileInfluence(after.G, targetTileId);
                if (afterSourceCount !== beforeSourceCount - 1 || afterTargetCount !== beforeTargetCount + 1) {
                    fail({ recordIndex: i, seq: record.seq, turn: record.turn, round: record.round, tileId: targetTileId, player: record.player }, 'moveInfluence(applied) must update source/target tile influence bindings by -1/+1.');
                }
            }

            expectedSeq += 1; actionCount += 1; continue;
        }
        if (record.recordType === 'checkpoint.turnEnd' || record.recordType === 'checkpoint.roundEnd') {
            if (verifyCheckpoints) {
                const currentState = client.getState();
                const currentHash = hashState(client.getState()?.G as any);
                if (currentHash !== record.stateHash) fail({ recordIndex: i, seq: expectedSeq - 1 }, `checkpoint hash mismatch (expected ${record.stateHash}, got ${currentHash}).`);
                const projected = projectReplayCheckpointSummary(currentState?.G, currentState?.ctx);
                if (canonicalJsonStringify(projected.perPlayer as any) !== canonicalJsonStringify(record.perPlayer as any)) {
                    fail({ recordIndex: i, seq: expectedSeq - 1 }, `checkpoint perPlayer projection mismatch for ${record.recordType}.`);
                }
                if (canonicalJsonStringify(projected.global as any) !== canonicalJsonStringify(record.global as any)) {
                    fail({ recordIndex: i, seq: expectedSeq - 1 }, `checkpoint global projection mismatch for ${record.recordType}.`);
                }
            }
            continue;
        }
        if (record.recordType === 'system.roundSettlement') {
            const currentState = client.getState();
            const boardTileCount = Number(projectReplayCheckpointSummary(currentState?.G, currentState?.ctx).global.boardTileCount ?? 0);
            if ((record.perTile?.length ?? 0) > 0 && boardTileCount <= 0) {
                fail({ recordIndex: i, seq: expectedSeq - 1, round: record.round }, 'system.roundSettlement with non-empty perTile requires boardTileCount > 0.');
            }
            continue;
        }
        fail({ recordIndex: i, seq: expectedSeq - 1 }, `unexpected recordType "${(record as any).recordType}" in body.`);
    }
    if (typeof footer.totalActions === 'number' && footer.totalActions !== actionCount) fail({ recordIndex: records.length - 1, seq: actionCount }, `footer totalActions mismatch (expected ${footer.totalActions}, got ${actionCount}).`);
    const finalStateHash = hashState(client.getState()?.G as any);
    if (options.verifyFinalHash) {
        if (!footer.finalStateHash) fail({ recordIndex: records.length - 1, seq: actionCount }, 'final hash missing or empty while verifyFinalHash is enabled.');
        if (footer.finalStateHash !== finalStateHash) fail({ recordIndex: records.length - 1, seq: actionCount }, `final hash mismatch (expected ${footer.finalStateHash}, got ${finalStateHash}).`);
    }
    return { totalActions: actionCount, finalStateHash };
}
