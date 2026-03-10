import { describe, expect, it, vi } from 'vitest';
import { INVALID_MOVE } from 'boardgame.io/core';
import { emitReplaySystemRecord, withReplaySink, type ReplayRecord } from '../src/engine/replay-sink';

describe('withReplaySink v2', () => {
    const makeContext = () => ({
        G: { engine: { attributes: { seed: 'seed-from-attributes' } }, zones: { staging_0: { items: [] }, DrawPile: { items: [] }, DiscardFaceUp: { items: [] }, Board: { items: [] } }, objects: {}, tiles: {} },
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

    it('emits deterministic placeInfluence deltas when action applies', () => {
        const records: ReplayRecord[] = [];
        const wrapped = withReplaySink({
            placeInfluence: ({ G }: any) => {
                G.zones['PersonalSupply:0'].items = [];
                G.zones['tile-a'].items = ['i_supply'];
            },
        }, { sink: { writeRecord: (record) => records.push(record) } });

        const context = makeContext();
        context.G.zones['PersonalSupply:0'] = { items: ['i_supply'] } as any;
        context.G.zones['tile-a'] = { items: [] } as any;
        context.G.objects = {
            i_supply: { id: 'i_supply', type: 'Influence', owner: '0' },
        };

        wrapped.placeInfluence(context as any, { targetTileId: 'tile-a' });

        const action = records.find((record) => record.recordType === 'action') as any;
        expect(action.resolved.outcome).toBe('applied');
        expect(action.resolved.influence).toEqual({
            pre: { personalSupply: 1, board: 0 },
            post: { personalSupply: 0, board: 1 },
            expectedDelta: { personalSupply: -1, board: 1 },
            observedDelta: { personalSupply: -1, board: 1 },
        });
    });


    it('captures resolveChoice influence gain and same-turn checkpoint projection from authoritative zones', () => {
        const records: ReplayRecord[] = [];
        const wrapped = withReplaySink({
            resolveChoice: ({ G }: any) => {
                const supplyZone = G.zones['PersonalSupply:0'];
                const boardZone = G.zones['tile-a'];
                const movedId = supplyZone.items.shift();
                boardZone.items.push(movedId);
            },
        }, { sink: { writeRecord: (record) => records.push(record) } });

        const context = makeContext();
        context.G.zones['PersonalSupply:0'] = { items: ['i_supply'] } as any;
        context.G.zones['tile-a'] = { items: [] } as any;
        context.G.objects = { i_supply: { id: 'i_supply', type: 'Influence', owner: '0' } };

        wrapped.resolveChoice(context as any, { choiceId: 'choice_1', selection: 'Receive 1 Influence' });

        const action = records.find((record) => record.recordType === 'action') as any;
        expect(action.moveType).toBe('resolveChoice');
        expect(action.resolved.outcome).toBe('applied');
        expect(action.resolved.influence).toEqual({
            pre: { personalSupply: 1, board: 0 },
            post: { personalSupply: 0, board: 1 },
            observedDelta: { personalSupply: -1, board: 1 },
        });

        const checkpoint = records.find((record) => record.recordType === 'checkpoint.turnEnd') as any;
        expect(checkpoint.perPlayer['0'].influence).toEqual({ personalSupply: 0, board: 1, total: 1 });
    });

    it('does not emit replay records when resolveChoice selection is invalid', () => {
        const records: ReplayRecord[] = [];
        const wrapped = withReplaySink({ resolveChoice: () => INVALID_MOVE }, { sink: { writeRecord: (record) => records.push(record) } });

        wrapped.resolveChoice(makeContext() as any, { choiceId: 'choice_1', selection: 'Invalid Option' });

        expect(records).toHaveLength(0);
    });

    it('does not emit action records for failed/illegal moves', () => {
        const records: ReplayRecord[] = [];
        const wrapped = withReplaySink({ placeInfluence: () => INVALID_MOVE }, { sink: { writeRecord: (record) => records.push(record) } });
        wrapped.placeInfluence(makeContext() as any, { targetTileId: 'tile-a' });
        expect(records).toHaveLength(0);
    });

    it('emits deterministic error record when placeInfluence projection mismatches authoritative delta', () => {
        const records: ReplayRecord[] = [];
        const onError = vi.fn();
        const wrapped = withReplaySink({
            placeInfluence: ({ G }: any) => {
                G.zones['PersonalSupply:0'].items = [];
                G.zones['tile-a'].items = ['i_supply'];
                G.zones['tile-b'].items = ['i_extra'];
                G.objects.i_extra = { id: 'i_extra', type: 'Influence', owner: '0' };
            },
        }, { sink: { writeRecord: (record) => records.push(record) }, onError });

        const context = makeContext();
        context.G.zones['PersonalSupply:0'] = { items: ['i_supply'] } as any;
        context.G.zones['tile-a'] = { items: [] } as any;
        context.G.zones['tile-b'] = { items: [] } as any;
        context.G.objects = {
            i_supply: { id: 'i_supply', type: 'Influence', owner: '0' },
        };

        wrapped.placeInfluence(context as any, { targetTileId: 'tile-a' });

        expect(onError).toHaveBeenCalledTimes(1);
        const actionRecords = records.filter((record) => record.recordType === 'action') as any[];
        expect(actionRecords).toHaveLength(1);
        expect(actionRecords[0].resolved.outcome).toBe('error');
        expect(actionRecords[0].resolved.errorCode).toBe('PLACE_INFLUENCE_INVARIANT_FAILED');
        expect(records.some((record) => record.recordType === 'checkpoint.turnEnd')).toBe(false);
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
        emitReplaySystemRecord({ sink: { writeRecord: (record) => records.push(record) } }, { G: { tiles: { 'tile-a': { type: 'Resort', name: 'A', weight: 1 } }, influence: { byTile: { 'tile-a': { '0': 1 } } }, zones: { DrawPile: { items: [] }, DiscardFaceUp: { items: [] }, Board: { items: ['tile-a'] } }, objects: {} }, ctx: { matchID: 'match-1', numPlayers: 2 } }, { roundNumber: 2, settlementKind: 'regular', resortTileOrder: ['tile-a'] });
        expect(records.map((r) => r.recordType)).toEqual(['system.roundSettlement', 'checkpoint.roundEnd']);
        expect((records[1] as any).global.boardTileCount).toBe(1);
    });

    it('enforces settlement/board invariant and referential consistency with checkpoint metrics', () => {
        const records: ReplayRecord[] = [];
        const sink = { writeRecord: (record: ReplayRecord) => records.push(record) };
        const context: any = {
            G: {
                engine: { attributes: { seed: 'seed' } },
                roundNumber: 2,
                zones: {
                    staging_0: { items: [] },
                    DrawPile: { items: [] },
                    DiscardFaceUp: { items: [] },
                    Board: { items: ['tile-a'] },
                },
                objects: {
                    i_supply: { id: 'i_supply', type: 'Influence', owner: '0' },
                },
                tiles: {
                    'tile-a': { id: 'tile-a', type: 'Resort', name: 'A', weight: 1 },
                },
            },
            ctx: { currentPlayer: '0', turn: 1, phase: 'politicalAction', numPlayers: 2, matchID: 'match-1' },
        };

        const wrapped = withReplaySink({
            placeInfluence: ({ G }: any, intent: any) => {
                G.objects.i_supply.tileId = intent.targetTileId;
            },
        }, { sink });

        wrapped.placeInfluence(context, { targetTileId: 'tile-a' });
        emitReplaySystemRecord({ sink }, context, { roundNumber: 2, settlementKind: 'regular', resortTileOrder: ['tile-a'] });

        const action = records.find((r) => r.recordType === 'action') as any;
        const settlement = records.find((r) => r.recordType === 'system.roundSettlement') as any;
        const checkpoint = records.find((r) => r.recordType === 'checkpoint.roundEnd') as any;

        const settlementTileSet = new Set(settlement.perTile.map((entry: any) => entry.tileId));
        expect(settlementTileSet.has(action.intent.targetTileId)).toBe(true);
        expect(checkpoint.global.boardTileCount).toBe(context.G.zones.Board.items.length);
    });

    it('throws when settlement has perTile entries but authoritative boardTileCount is zero', () => {
        const records: ReplayRecord[] = [];
        const context: any = {
            G: {
                tiles: { 'tile-a': { id: 'tile-a', type: 'Resort', name: 'A', weight: 1 } },
                influence: { byTile: { 'tile-a': { '0': 1 } } },
                zones: { DrawPile: { items: [] }, DiscardFaceUp: { items: [] }, Board: { items: [] } },
                objects: {},
            },
            ctx: { matchID: 'match-1', numPlayers: 2 },
        };

        expect(() => emitReplaySystemRecord({ sink: { writeRecord: (record) => records.push(record) } }, context, { roundNumber: 2, settlementKind: 'regular', resortTileOrder: ['tile-a'] })).toThrow(/boardTileCount is 0/);
        expect(records.map((r) => r.recordType)).toEqual(['system.roundSettlement']);
    });
});
