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
        expect(result.hash).toBe('1e8d6446911ed062cb1ad16fd82eaf01c9d8738eebc1faff24840d30188f1466');
    });
});
