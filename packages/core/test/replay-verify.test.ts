import { beforeEach, describe, expect, it } from 'vitest';
import { verifyReplayRecords, type ReplayNdjsonRecord } from '../src/replay-verify';
import { registerTestPacks } from './_helpers/registerPacks';

describe('Replay NDJSON verifier v2', () => {
    beforeEach(() => registerTestPacks());

    function baseRecords(): ReplayNdjsonRecord[] {
        return [
            { recordType: 'header', schemaVersion: '2', seed: 'replay-verify-seed', matchConfig: { players: 3, expansions: { ex01: false, ex02: false, ex03: false } } },
            { recordType: 'manifest' },
            { recordType: 'action', seq: 1, player: '0', moveType: 'placeTile', intent: { targetCoord: '1,0' }, resolved: { outcome: 'applied' } },
            { recordType: 'footer', totalActions: 1 },
        ];
    }

    it('replays strict action sequence and returns deterministic final hash', () => {
        const result = verifyReplayRecords(baseRecords(), { verifyCheckpoints: false });
        expect(result.totalActions).toBe(1);
    });

    it('rejects resolveChoice without preceding choiceOpened', () => {
        const records = baseRecords();
        records[2] = { recordType: 'action', seq: 1, player: '0', moveType: 'resolveChoice', intent: { choiceId: 'c1', selection: 'OK' }, resolved: { outcome: 'applied' } };
        expect(() => verifyReplayRecords(records, { verifyCheckpoints: false })).toThrow(/preceded by system.choiceOpened/);
    });

    it('fails fast when action intent target tile does not resolve to Board zone tile', () => {
        const records: ReplayNdjsonRecord[] = [
            { recordType: 'header', schemaVersion: '2', seed: 'replay-verify-intent-target-tile', matchConfig: { players: 3, expansions: { ex01: false, ex02: false, ex03: false } } },
            { recordType: 'manifest' },
            { recordType: 'action', seq: 1, player: '0', moveType: 'moveInfluence', intent: { sourceId: 'StartCommittee', targetId: '__not_on_board__' }, resolved: { outcome: 'applied' } },
            { recordType: 'footer', totalActions: 1 },
        ];
        expect(() => verifyReplayRecords(records, { verifyCheckpoints: false })).toThrow(/intent\.(sourceId|targetId) must resolve to a tile currently in Board zone/);
    });

    it('accepts roundSettlement perTile when authoritative boardTileCount is positive', () => {
        const records: ReplayNdjsonRecord[] = [
            { recordType: 'header', schemaVersion: '2', seed: 'replay-verify-round-settlement', matchConfig: { players: 3, expansions: { ex01: false, ex02: false, ex03: false } } },
            { recordType: 'manifest' },
            {
                recordType: 'system.roundSettlement',
                round: 1,
                perTile: [{ tileId: 'tile_1_0' }],
                postSettlementStateHash: 'x',
            },
            { recordType: 'footer', totalActions: 0 },
        ];
        expect(() => verifyReplayRecords(records, { verifyCheckpoints: false })).not.toThrow();
    });

    it('rejects stale checkpoint projection when summary does not match canonical state', () => {
        const records: ReplayNdjsonRecord[] = [
            { recordType: 'header', schemaVersion: '2', seed: 'replay-verify-checkpoint', matchConfig: { players: 3, expansions: { ex01: false, ex02: false, ex03: false } } },
            { recordType: 'manifest' },
            { recordType: 'action', seq: 1, player: '0', moveType: 'placeTile', intent: { targetCoord: '1,0' }, resolved: { outcome: 'applied' } },
            { recordType: 'checkpoint.turnEnd', perPlayer: {}, global: {}, stateHash: 'x' },
            { recordType: 'footer', totalActions: 1 },
        ];
        expect(() => verifyReplayRecords(records, { verifyCheckpoints: true })).toThrow(/checkpoint hash mismatch|checkpoint .* projection mismatch/);
    });
});
