import { describe, expect, it, vi } from 'vitest';
import { INVALID_MOVE } from 'boardgame.io/core';
import { emitReplaySystemRecord, withReplaySink, type ReplayRecord } from '../src/engine/replay-sink';

describe('withReplaySink v2', () => {
    const makeContext = () => ({
        G: { engine: { attributes: { seed: 'seed-from-attributes' } }, zones: { staging_0: { items: [] }, drawPile: { items: [] }, discardFaceUp: { items: [] }, board: { items: [] } }, objects: {}, tiles: {} },
        ctx: { currentPlayer: '0', turn: 1, phase: 'politicalAction', numPlayers: 2 },
    });

    it('writes manifest once and successful action records with monotone seq', () => {
        const records: ReplayRecord[] = [];
        const wrapped = withReplaySink({ okMove: () => undefined, invalidMove: () => INVALID_MOVE }, { sink: { writeRecord: (record) => records.push(record) } });
        wrapped.invalidMove(makeContext() as any, { id: 'a' });
        wrapped.okMove(makeContext() as any, { id: 'b' });
        wrapped.okMove(makeContext() as any, { id: 'c' });
        expect(records[0].recordType).toBe('manifest');
        const actions = records.filter((r) => r.recordType === 'action');
        expect(actions).toHaveLength(2);
        expect((actions[0] as any).seq).toBe(1);
        expect((actions[1] as any).seq).toBe(2);
        expect(records.filter((r) => r.recordType === 'checkpoint.turnEnd')).toHaveLength(2);
    });

    it('is best-effort and emits sink failures into the error channel', () => {
        const onError = vi.fn();
        const wrapped = withReplaySink({ okMove: () => undefined }, { sink: { writeRecord: () => { throw new Error('sink failure'); } }, onError });
        expect(() => wrapped.okMove(makeContext() as any, { id: 'x' })).not.toThrow();
        expect(onError).toHaveBeenCalledTimes(1);
    });
});

describe('emitReplaySystemRecord v2', () => {
    it('emits round settlement and round checkpoint records', () => {
        const records: ReplayRecord[] = [];
        emitReplaySystemRecord({ sink: { writeRecord: (record) => records.push(record) } }, { G: { tiles: { 'tile-a': { type: 'Resort', name: 'A', weight: 1 } }, influence: { byTile: { 'tile-a': { '0': 1 } } }, zones: { drawPile: { items: [] }, discardFaceUp: { items: [] }, board: { items: ['tile-a'] } }, objects: {} }, ctx: { matchID: 'match-1', numPlayers: 2 } }, { roundNumber: 2, settlementKind: 'regular', resortTileOrder: ['tile-a'] });
        expect(records.map((r) => r.recordType)).toEqual(['system.roundSettlement', 'checkpoint.roundEnd']);
    });
});
