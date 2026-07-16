import { beforeEach, describe, expect, it } from 'vitest';
import { CoreMoves } from '../src/moves';
import { CoreZoneName, GameState, TileType } from '@balance-control/rules';
import { INVALID_MOVE } from 'boardgame.io/core';
import { EffectResolver } from '@balance-control/game';
import { registerTestPacks } from './_helpers/registerPacks';

describe('CORE production and resolver obligations', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    /** @rule CORE-01-06-16 */
    it('splits tied production evenly and sends remainder to Noise [CORE-01-06-16]', () => {
        const G: any = {
            zones: {
                Bank: { id: 'Bank', name: 'Bank', items: ['res_1', 'res_2', 'res_3', 'res_4', 'res_5'] },
                Noise: { id: 'Noise', name: 'Noise', items: [] },
                'PersonalSupply:p2': { id: 'PersonalSupply:p2', name: 'PS2', items: [] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS1', items: [] },
                tile_dom: { id: 'tile_dom', name: 'DOM', items: ['inf_p1', 'inf_p2'] }
            },
            tiles: {
                tile_dom: { id: 'tile_dom', type: TileType.Resort, resort: 'DOM', weight: 5 }
            },
            objects: {
                inf_p1: { id: 'inf_p1', type: 'Influence', owner: 'p1' },
                inf_p2: { id: 'inf_p2', type: 'Influence', owner: 'p2' },
                res_1: { id: 'res_1', type: 'Resource', resort: 'DOM' },
                res_2: { id: 'res_2', type: 'Resource', resort: 'DOM' },
                res_3: { id: 'res_3', type: 'Resource', resort: 'DOM' },
                res_4: { id: 'res_4', type: 'Resource', resort: 'DOM' },
                res_5: { id: 'res_5', type: 'Resource', resort: 'DOM' }
            },
            adjacency: { tile_dom: [] },
            grid: {},
            engine: { idSeq: 0, effectQueue: [{ kind: 'production.resolve', tileId: 'tile_dom' }], activeModifiers: [], history: [], attributes: {} }
        };

        expect(EffectResolver.resolve(G, {})).toBe(true);
        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(2);
        expect(G.zones['PersonalSupply:p2'].items).toHaveLength(2);
        expect(G.zones.Noise.items).toHaveLength(1);
        expect(G.engine.history.map((h: any) => h.atom)).toEqual(['production.resolve', 'resource.grant', 'resource.grant', 'resource.grant']);
    });

    /** @rule CORE-01-08-04 */
    /** @rule CORE-01-04-14 */
    /** @rule CORE-01-04-15 */
    it('applies Start Committee immunity against prohibitions and extra costs in formalize flow [CORE-01-08-04, CORE-01-04-14, CORE-01-04-15]', () => {
        const G: GameState = {
            zones: {
                [CoreZoneName.Board]: { id: CoreZoneName.Board, name: 'Board', items: ['board_start'] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS1', items: ['meta_p1', 'res_dom', 'res_for', 'res_inf', 'res_dom_2'] },
                board_start: { id: 'board_start', name: 'Start', items: [] },
                Bank: { id: 'Bank', name: 'Bank', items: [] },
            },
            tiles: { board_start: { id: 'board_start', type: TileType.StartCommittee } },
            objects: {
                meta_p1: { id: 'meta_p1', type: 'MetaMarker', owner: 'p1' },
                res_dom: { id: 'res_dom', type: 'Resource', owner: 'p1', resort: 'DOM' },
                res_for: { id: 'res_for', type: 'Resource', owner: 'p1', resort: 'FOR' },
                res_inf: { id: 'res_inf', type: 'Resource', owner: 'p1', resort: 'INF' },
                res_dom_2: { id: 'res_dom_2', type: 'Resource', owner: 'p1', resort: 'DOM' },
            },
            adjacency: { board_start: [] },
            grid: {},
            engine: {
                idSeq: 0,
                effectQueue: [],
                activeModifiers: [],
                history: [],
                attributes: {
                    limits: { startCommittee: 1 },
                    usage: {},
                    prohibitions: { 'influence.formalize': true },
                    tileExtraCosts: { board_start: { 'influence.formalize': [{ amount: 99, resorts: ['DOM'] }] } },
                }
            }
        } as any;

        const ctx = { currentPlayer: 'p1', numPlayers: 2, activePlayers: { p1: 'politicalAction' } };
        const events = { endTurn: () => { }, endStage: () => { } };
        const result = CoreMoves.formalizeInfluence(
            { G: G as any, ctx, events } as any,
            { committeeTileId: 'board_start', paymentResourceIds: ['res_dom', 'res_for', 'res_inf', 'res_dom_2'] }
        );

        expect(result).not.toBe(INVALID_MOVE);
        expect((G as any).zones.Bank.items).toEqual(expect.arrayContaining(['res_dom', 'res_for', 'res_inf', 'res_dom_2']));
    });
});
