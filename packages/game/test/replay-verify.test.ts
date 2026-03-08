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

    function hashAfterBaseAction(): string {
        return verifyReplayRecords(baseRecords()).finalStateHash;
    }

    function createMismatchingHash(): string {
        // Create a fake hash that is guaranteed to mismatch the real one
        // by returning a known 64-char hex string that won't naturally occur
        return '0'.repeat(64);
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

    /** @rule CORE-01-07-03 */
    it('verifies regular settlement stateHash checkpoints when includeStateHash is present', () => {
        const records = baseRecords();
        const footerIdx = records.findIndex(r => r.recordType === 'footer');
        records.splice(footerIdx, 0, {
            recordType: 'system.roundSettlement',
            roundNumber: 1,
            settlementKind: 'regular',
            resortTileOrder: ['tile-1'],
            stateHash: hashAfterBaseAction(),
        });

        const result = verifyReplayRecords(records, { verifyCheckpoints: true });
        expect(result.totalActions).toBe(1);
    });

    /** @rule CORE-01-07-03 */
    it('rejects settlement checkpoint hashes when they do not match current verifier state', () => {
        const records = baseRecords();
        const footerIdx = records.findIndex(r => r.recordType === 'footer');
        records.splice(footerIdx, 0, {
            recordType: 'system.roundSettlement',
            roundNumber: 1,
            settlementKind: 'regular',
            resortTileOrder: ['tile-1'],
            stateHash: createMismatchingHash(),
        });

        expect(() => verifyReplayRecords(records, { verifyCheckpoints: true })).toThrow(/system\.roundSettlement hash mismatch/);
    });

    /** @rule CORE-01-09-01A */
    it('verifies settlement checkpoint hashing for settlementKind="final" records', () => {
        const records = baseRecords();
        const footerIdx = records.findIndex(r => r.recordType === 'footer');
        records.splice(footerIdx, 0, {
            recordType: 'system.roundSettlement',
            roundNumber: 1,
            settlementKind: 'final',
            resortTileOrder: ['tile-1'],
            stateHash: hashAfterBaseAction(),
        });

        const result = verifyReplayRecords(records, { verifyCheckpoints: true });
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

    it('accepts action typedFields metadata when values are known domain types', () => {
        const records = baseRecords();
        records[1] = {
            recordType: 'action',
            seq: 1,
            player: '0',
            moveType: 'placeTile',
            args: [{ targetCoord: '1,0' }],
            typedFields: {
                '0.targetCoord': 'tileId'
            }
        };

        const result = verifyReplayRecords(records);
        expect(result.totalActions).toBe(1);
    });

    it('accepts deterministic action stateDelta/stateSnapshot payload objects', () => {
        const records = baseRecords();
        records[1] = {
            recordType: 'action',
            seq: 1,
            player: '0',
            moveType: 'placeTile',
            args: [{ targetCoord: '1,0' }],
            stateDelta: {
                changedZones: {
                    board: ['tile-1'],
                },
            },
            stateSnapshot: {
                zones: {},
                resources: {},
                metaMarkers: {},
            },
        };

        const result = verifyReplayRecords(records);
        expect(result.totalActions).toBe(1);
    });

    it('rejects unknown action typedFields domain type labels', () => {
        const records = baseRecords();
        records[1] = {
            recordType: 'action',
            seq: 1,
            player: '0',
            moveType: 'placeTile',
            args: [{ targetCoord: '1,0' }],
            typedFields: {
                '0.targetCoord': 'ui-only'
            }
        };

        expect(() => verifyReplayRecords(records)).toThrow(/invalid action.typedFields/);
    });

    it('rejects non-object action stateDelta payload', () => {
        const records = baseRecords();
        records[1] = {
            recordType: 'action',
            seq: 1,
            player: '0',
            moveType: 'placeTile',
            args: [{ targetCoord: '1,0' }],
            stateDelta: [] as any,
        };

        expect(() => verifyReplayRecords(records)).toThrow(/invalid action.stateDelta/);
    });

    it('verifies checkpoint stateSnapshot payload against replayed state when enabled', () => {
        const expected = verifyReplayRecords(baseRecords());
        const records = baseRecords();
        records.splice(2, 0, {
            recordType: 'checkpoint',
            afterSeq: 1,
            stateHash: expected.finalStateHash,
            stateSnapshot: {
                zones: {
                    board: ['tile-bureaucracy'],
                    drawPile: [
                        '__drawpile_marker__',
                    ],
                },
                resources: {},
                metaMarkers: {},
            },
        });

        expect(() => verifyReplayRecords(records, { verifyCheckpoints: true })).toThrow(/stateSnapshot mismatch/);
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
    it('rejects empty footer finalStateHash when verifyFinalHash is enabled', () => {
        const records = baseRecords();
        const footerIndex = records.findIndex((record) => record.recordType === 'footer');
        records[footerIndex] = {
            recordType: 'footer',
            totalActions: 1,
            finalStateHash: '',
        };

        expect(() => verifyReplayRecords(records, { verifyFinalHash: true })).toThrow(/final hash missing or empty/);
    });

    it('accepts matching footer finalStateHash when verifyFinalHash is enabled', () => {
        const records = baseRecords();
        const expectedFinalHash = verifyReplayRecords(records).finalStateHash;
        const footerIndex = records.findIndex((record) => record.recordType === 'footer');
        records[footerIndex] = {
            recordType: 'footer',
            totalActions: 1,
            finalStateHash: expectedFinalHash,
        };

        const result = verifyReplayRecords(records, { verifyFinalHash: true });
        expect(result.finalStateHash).toBe(expectedFinalHash);
    });

});
