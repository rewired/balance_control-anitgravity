import { describe, it, expect } from 'vitest';
import { runReplay, type ReplaySpec } from '../src/replay';

describe('Replay runner', () => {
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
                { move: 'pass', payload: {} }
            ]
        };

        const result = runReplay(replay);
        expect(result.hash).toBe('5d6caf1bf159cc64b4b00f5ed3ac1f741f9b6196809e6792d1d86cce7ad78599');
    });
});
