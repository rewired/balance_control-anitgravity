import { Client } from 'boardgame.io/client';
import { createBalanceControlGame } from './index';
import { SetupGame } from './setup';
import { hashState } from './hash-state';
import { EnginePackRegistry } from './expansion-registry';
import { CorePack } from './packs/core';
import { CoreMoves } from './moves';
import { canonicalJsonStringify } from './hash-state';
import { projectReplayCheckpointSummary } from './engine/replay-sink';

type ReplayHeaderRecord = Readonly<{ recordType: 'header'; schemaVersion: '2' | string; seed: string; matchConfig: Record<string, unknown>; }>;
type ReplayManifestRecord = Readonly<{ recordType: 'manifest' }>;
type ReplayActionRecord = Readonly<{ recordType: 'action'; seq: number; player: string; moveType: string; intent?: unknown; }>;
type ReplayChoiceOpenedRecord = Readonly<{ recordType: 'system.choiceOpened'; choiceId: string }>;
type ReplayRoundSettlementRecord = Readonly<{ recordType: 'system.roundSettlement'; postSettlementStateHash?: string }>;
type ReplayCheckpointRecord = Readonly<{ recordType: 'checkpoint.turnEnd' | 'checkpoint.roundEnd'; perPlayer: Record<string, Record<string, unknown>>; global: Record<string, unknown>; stateHash: string }>;
type ReplayFooterRecord = Readonly<{ recordType: 'footer'; finalStateHash?: string; totalActions?: number }>;
export type ReplayNdjsonRecord = ReplayHeaderRecord | ReplayManifestRecord | ReplayActionRecord | ReplayChoiceOpenedRecord | ReplayRoundSettlementRecord | ReplayCheckpointRecord | ReplayFooterRecord;
export type ReplayVerifyOptions = Readonly<{ verifyCheckpoints?: boolean; verifyFinalHash?: boolean }>;

function getNumPlayers(matchConfig: Record<string, unknown>): number { const p = (matchConfig.players ?? matchConfig.numPlayers) as number; if (Number.isInteger(p) && p >= 2) return p; throw new Error('Replay header mismatch at seq 0: matchConfig must include integer players/numPlayers >= 2.'); }
function fail(seq: number, message: string): never { throw new Error(`Replay divergence at seq ${seq}: ${message}`); }
function ensureCorePackForReplayVerifier(): void { const corePack = EnginePackRegistry.getRegisteredPacks().find((pack) => pack.id === 'core'); if (corePack && Object.keys(corePack.moves ?? {}).length > 0) return; EnginePackRegistry.registerPack({ ...CorePack, moves: CoreMoves }); }

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
    for (let i = 2; i < records.length - 1; i += 1) {
        const record = records[i];
        if (record.recordType === 'system.choiceOpened') { lastWasChoiceOpened = true; continue; }
        if (record.recordType === 'action') {
            if (record.moveType === 'resolveChoice' && !lastWasChoiceOpened) fail(record.seq, 'resolveChoice must be preceded by system.choiceOpened.');
            lastWasChoiceOpened = false;
            if (record.seq !== expectedSeq) fail(expectedSeq, `expected action seq ${expectedSeq}, got ${record.seq}.`);
            const moveFn = (client.moves as any)[record.moveType]; if (typeof moveFn !== 'function') fail(record.seq, `unknown moveType "${record.moveType}".`);
            (client as any).updatePlayerID(record.player);
            const before = client.getState();
            moveFn(...(record.intent === undefined ? [] : [record.intent]));
            const after = client.getState();
            if (!after || after._stateID === before?._stateID) fail(record.seq, `move "${record.moveType}" by player ${record.player} was rejected or produced no state transition.`);
            expectedSeq += 1; actionCount += 1; continue;
        }
        if (record.recordType === 'checkpoint.turnEnd' || record.recordType === 'checkpoint.roundEnd') {
            if (options.verifyCheckpoints) {
                const currentState = client.getState();
                const currentHash = hashState(client.getState()?.G as any);
                if (currentHash !== record.stateHash) fail(expectedSeq - 1, `checkpoint hash mismatch (expected ${record.stateHash}, got ${currentHash}).`);
                const projected = projectReplayCheckpointSummary(currentState?.G, currentState?.ctx);
                if (canonicalJsonStringify(projected.perPlayer as any) !== canonicalJsonStringify(record.perPlayer as any)) {
                    fail(expectedSeq - 1, `checkpoint perPlayer projection mismatch for ${record.recordType}.`);
                }
                if (canonicalJsonStringify(projected.global as any) !== canonicalJsonStringify(record.global as any)) {
                    fail(expectedSeq - 1, `checkpoint global projection mismatch for ${record.recordType}.`);
                }
            }
            continue;
        }
        if (record.recordType === 'system.roundSettlement') continue;
        fail(expectedSeq - 1, `unexpected recordType "${(record as any).recordType}" in body.`);
    }
    if (typeof footer.totalActions === 'number' && footer.totalActions !== actionCount) fail(actionCount, `footer totalActions mismatch (expected ${footer.totalActions}, got ${actionCount}).`);
    const finalStateHash = hashState(client.getState()?.G as any);
    if (options.verifyFinalHash) {
        if (!footer.finalStateHash) fail(actionCount, 'final hash missing or empty while verifyFinalHash is enabled.');
        if (footer.finalStateHash !== finalStateHash) fail(actionCount, `final hash mismatch (expected ${footer.finalStateHash}, got ${finalStateHash}).`);
    }
    return { totalActions: actionCount, finalStateHash };
}
