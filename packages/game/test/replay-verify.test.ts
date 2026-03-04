import { beforeEach, describe, expect, it } from 'vitest';
import { verifyReplayRecords, type ReplayNdjsonRecord } from '../src/replay-verify';
import { registerTestPacks } from './_helpers/registerPacks';

describe('Replay NDJSON verifier', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    function baseRecords(): ReplayNdjsonRecord[] {
        return [
            {
                recordType: 'header',
                schemaVersion: '1',
                seed: 'replay-verify-seed',
                matchConfig: {
                    players: 3,
                    expansions: {
                        ex01: false,
                        ex02: false,
                        ex03: false
                    }
                }
            },
            {
                recordType: 'action',
                seq: 1,
                player: '0',
                moveType: 'placeTile',
                args: [{ targetCoord: '1,0' }]
            },
            {
                recordType: 'footer',
                totalActions: 1
            }
        ];
    }

    it('replays strict action sequence and returns deterministic final hash', () => {
        const result = verifyReplayRecords(baseRecords());
        expect(result.totalActions).toBe(1);
        expect(result.finalStateHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('accepts deterministic system.roundSettlement records in replay body', () => {
        const records = baseRecords();
        records.splice(2, 0, {
            recordType: 'system.roundSettlement',
            roundNumber: 1,
            settlementKind: 'regular',
            resortTileOrder: ['tile-1', 'tile-2']
        });

        const result = verifyReplayRecords(records);
        expect(result.totalActions).toBe(1);
    });

    it('fails fast on first action-seq divergence with diagnostic', () => {
        const records = baseRecords();
        records[1] = {
            recordType: 'action',
            seq: 2,
            player: '0',
            moveType: 'placeTile',
            args: [{ targetCoord: '1,0' }]
        };

        expect(() => verifyReplayRecords(records)).toThrow(/Replay divergence at seq 1: expected action seq 1, got 2/);
    });

    it('fails on invalid system.roundSettlement payload shape', () => {
        const records = baseRecords();
        records.splice(2, 0, {
            recordType: 'system.roundSettlement',
            roundNumber: 0,
            settlementKind: 'regular',
            resortTileOrder: []
        });

        expect(() => verifyReplayRecords(records)).toThrow(/invalid system.roundSettlement.roundNumber/);
    });
});
