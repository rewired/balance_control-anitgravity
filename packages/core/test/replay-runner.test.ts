import { beforeEach, describe, it, expect } from 'vitest';
import { RULESET_MANIFEST } from '@balance-control/rules';
import { runReplay, type ReplaySpec } from '../src/replay';
import { registerTestPacks } from './_helpers/registerPacks';


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
        expect(result.hash).toBe('f492031461e99df5e6456fbbc44d908fe2c1dd5f9bf9adb7572ccb146fae6c88');
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
                coreVersion: RULESET_MANIFEST.coreVersion,
                expansions: {},
                specAnchorHash: RULESET_MANIFEST.specAnchorHash
            },
            moves: [
                { move: 'placeTile', payload: { targetCoord: '1,0' } },
                { move: 'placeInfluence', payload: { targetCoord: '1,0' } }
            ]
        };

        const result = runReplay(replay);
        expect(result.state.G.meta?.ruleset?.coreVersion).toBe(RULESET_MANIFEST.coreVersion);
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
