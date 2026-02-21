import { beforeEach, describe, it, expect } from 'vitest';
import { runReplay, type ReplaySpec } from '../src/replay';
import { registerTestPacks } from './_helpers/registerPacks';

const EXPECTED_CORE_VERSION = 'v1.1.0';
const EXPECTED_SPEC_ANCHOR_HASH = '5F563AFF09ADCAF45B62E5CBBB97C5DC5D722EE2B56E3AB67B7B71BEA2F9FEF3';

describe('Replay runner', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('replays a small sequence and matches the expected hash', () => {
        const replay: ReplaySpec = {
            gameName: 'BalanceControl',
            gameVersion: 'dev',
            seed: 'replay-test-core-3p',
            numPlayers: 3,
            config: {
                expansions: {
                    ex01: false,
                    ex02: false,
                    ex03: false
                }
            },
            moves: [
                { move: 'placeTile', payload: { targetCoord: '1,0' } },
                { move: 'placeInfluence', payload: { targetCoord: '1,0' } }
            ]
        };

        const result = runReplay(replay);
        expect(result.hash).toBe('8a43a0641238a08fef4be1e48d545105e5ecd4c2db8df517d8e0b54110305b23');
        expect(result.state.G.meta?.ruleset).toBeTruthy();
    });

    it('accepts replay manifests and remains backward compatible', () => {
        const replay: ReplaySpec = {
            gameName: 'BalanceControl',
            gameVersion: 'dev',
            seed: 'replay-test-core-2p',
            numPlayers: 2,
            config: {
                expansions: {
                    ex01: false,
                    ex02: false,
                    ex03: false
                }
            },
            rulesetManifest: {
                coreVersion: EXPECTED_CORE_VERSION,
                expansions: {},
                specAnchorHash: EXPECTED_SPEC_ANCHOR_HASH
            },
            moves: [
                { move: 'placeTile', payload: { targetCoord: '1,0' } },
                { move: 'placeInfluence', payload: { targetCoord: '1,0' } }
            ]
        };

        const result = runReplay(replay);
        expect(result.state.G.meta?.ruleset?.coreVersion).toBe(EXPECTED_CORE_VERSION);
    });

    it('includes ruleset manifest in exported replay payload', () => {
        const replay: ReplaySpec = {
            gameName: 'BalanceControl',
            gameVersion: 'dev',
            seed: 'replay-test-export',
            numPlayers: 2,
            config: {
                expansions: {
                    ex01: false,
                    ex02: false,
                    ex03: false
                }
            },
            moves: [
                { move: 'placeTile', payload: { targetCoord: '1,0' } },
                { move: 'placeInfluence', payload: { targetCoord: '1,0' } }
            ]
        };

        const result = runReplay(replay);
        const exportedReplay = {
            ...replay,
            rulesetManifest: result.state.G.meta?.ruleset
        };
        expect(exportedReplay.rulesetManifest).toBeTruthy();
    });

    it('rejects replays when the public surface hash mismatches', () => {
        const replay: ReplaySpec = {
            gameName: 'BalanceControl',
            gameVersion: 'dev',
            seed: 'replay-test-core-2p',
            numPlayers: 2,
            config: {
                expansions: {
                    ex01: false,
                    ex02: false,
                    ex03: false
                }
            },
            publicSurfaceHash: 'invalid-hash',
            moves: [
                { move: 'placeTile', payload: { targetCoord: '1,0' } },
                { move: 'placeInfluence', payload: { targetCoord: '1,0' } }
            ]
        };

        expect(() => runReplay(replay)).toThrow(/Replay surface hash mismatch/);
    });
});
