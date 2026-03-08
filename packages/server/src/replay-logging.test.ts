import { describe, expect, it } from 'vitest';
import { createReplayFilename } from './replay-logging';

describe('createReplayFilename', () => {
    it('includes replay seed from record in generated filename', () => {
        const fileName = createReplayFilename(
            {
                recordType: 'action',
                seq: 0,
                player: '0',
                moveType: 'placeInfluence',
                args: [],
                matchId: 'match-seed',
                seed: 'seed-abc-123',
            },
            new Date('2026-03-08T12:34:56.000Z')
        );

        expect(fileName).toContain('match-seed-seed-abc-123-');
        expect(fileName).toBe('match-seed-seed-abc-123-20260308T123456Z.replay.ndjson');
    });
});
