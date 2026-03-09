import { beforeEach, describe, expect, it } from 'vitest';
import { verifyReplayRecords, type ReplayNdjsonRecord } from '../src/replay-verify';
import { registerTestPacks } from './_helpers/registerPacks';

describe('Replay NDJSON verifier v2', () => {
    beforeEach(() => registerTestPacks());

    function baseRecords(): ReplayNdjsonRecord[] {
        return [
            { recordType: 'header', schemaVersion: '2', seed: 'replay-verify-seed', matchConfig: { players: 3, expansions: { ex01: false, ex02: false, ex03: false } } },
            { recordType: 'manifest' },
            { recordType: 'action', seq: 1, player: '0', moveType: 'placeTile', intent: { targetCoord: '1,0' } },
            { recordType: 'checkpoint.turnEnd', perPlayer: {}, global: {}, stateHash: 'x' as any },
            { recordType: 'footer', totalActions: 1 },
        ];
    }

    it('replays strict action sequence and returns deterministic final hash', () => {
        const records = baseRecords();
        records[3] = { ...(records[3] as any), stateHash: verifyReplayRecords([records[0], records[1], records[2], { recordType: 'footer', totalActions: 1 }]).finalStateHash } as any;
        const result = verifyReplayRecords(records);
        expect(result.totalActions).toBe(1);
    });

    it('rejects resolveChoice without preceding choiceOpened', () => {
        const records = baseRecords();
        records[2] = { recordType: 'action', seq: 1, player: '0', moveType: 'resolveChoice', intent: { choiceId: 'c1', selection: 'OK' } };
        expect(() => verifyReplayRecords(records)).toThrow(/preceded by system.choiceOpened/);
    });

    it('rejects stale checkpoint projection when summary does not match canonical state', () => {
        const records = baseRecords();
        records[3] = { ...(records[3] as any), stateHash: verifyReplayRecords([records[0], records[1], records[2], { recordType: 'footer', totalActions: 1 }]).finalStateHash } as any;
        records[3] = {
            ...(records[3] as any),
            global: { ...(records[3] as any).global, boardTileCount: 999 },
        } as any;
        expect(() => verifyReplayRecords(records, { verifyCheckpoints: true })).toThrow(/checkpoint (global|perPlayer) projection mismatch/);
    });
});
