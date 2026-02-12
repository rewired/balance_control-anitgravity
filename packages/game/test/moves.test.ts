import { describe, it, expect, beforeEach } from 'vitest';
import { CoreMoves } from '../src/moves';
import { GameState, TileType, CoreZoneNames } from '@balance-control/rules';
import { INVALID_MOVE } from 'boardgame.io/core';

describe('Moves', () => {
    let G: GameState;
    let ctx: any;
    let events: any;

    const seedPlayerInfluenceAtCap = () => {
        for (let i = 2; i <= 7; i++) {
            const infId = `inf_cap_${i}`;
            G.objects[infId] = { id: infId, type: 'Influence', owner: 'p1' } as any;
            G.zones.board_t1.items.push(infId);
        }
    };

    const countOwnedInfluence = () =>
        Object.values(G.objects).filter((obj: any) => obj.type === 'Influence' && obj.owner === 'p1').length;

    beforeEach(() => {
        events = { endTurn: () => { }, endStage: () => { } };
        G = {
            zones: {
                [CoreZoneNames.Board]: { id: CoreZoneNames.Board, name: 'Board', items: ['board_t1', 'board_t2', 'board_gr', 'board_start'] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS', items: ['inf_1', 'res_dom', 'res_dom_2', 'res_for', 'res_inf'] },
                board_t1: { id: 'board_t1', name: 'T1', items: [] },
                board_t2: { id: 'board_t2', name: 'T2', items: [] },
                board_gr: { id: 'board_gr', name: 'GR', items: [] },
                board_start: { id: 'board_start', name: 'Start', items: [] },
                offboard_t: { id: 'offboard_t', name: 'Offboard', items: [] },
                Bank: { id: 'Bank', name: 'Bank', items: ['res_inf_bank'] }
            },
            tiles: {
                board_t1: { id: 'board_t1', type: TileType.Resort, resort: 'DOM', weight: 1 },
                board_t2: { id: 'board_t2', type: TileType.Committee },
                board_gr: {
                    id: 'board_gr',
                    type: TileType.Grassroots,
                    conversion: {
                        inputSlots: 2,
                        outputSlots: 1
                    }
                } as any,
                board_start: { id: 'board_start', type: TileType.StartCommittee },
                offboard_t: { id: 'offboard_t', type: TileType.Lobbyist }
            },
            objects: {
                inf_1: { id: 'inf_1', type: 'Influence', owner: 'p1' },
                res_dom: { id: 'res_dom', type: 'Resource', owner: 'p1', resort: 'DOM' },
                res_dom_2: { id: 'res_dom_2', type: 'Resource', owner: 'p1', resort: 'DOM' },
                res_for: { id: 'res_for', type: 'Resource', owner: 'p1', resort: 'FOR' },
                res_inf: { id: 'res_inf', type: 'Resource', owner: 'p1', resort: 'INF' },
                res_inf_bank: { id: 'res_inf_bank', type: 'Resource', resort: 'INF' }
            },
            adjacency: {},
            grid: {},
            engine: {
                idSeq: 0,
                effectQueue: [],
                activeModifiers: [],
                history: [],
                attributes: {
                    limits: { startCommittee: 1 },
                    usage: {},
                    prohibitions: {},
                    tileExtraCosts: {},
                    playerExtraCosts: {},
                    climateCostRules: [],
                }
            }
        } as any;

        ctx = {
            currentPlayer: 'p1',
            numPlayers: 2,
            activePlayers: { p1: 'politicalAction' }
        };
    });

    it('placeInfluence should work on a non-Lobbyist board tile', () => {
        CoreMoves.placeInfluence({ G, ctx, events }, { targetTileId: 'board_t2' });

        expect(G.zones['PersonalSupply:p1'].items.includes('inf_1')).toBe(false);
        expect(G.zones.board_t2.items).toContain('inf_1');
    });

    it('placeInfluence should reject non-board targets without mutation', () => {
        const before = JSON.stringify(G);
        const result = CoreMoves.placeInfluence({ G, ctx, events }, { targetTileId: 'offboard_t' });
        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('moveInfluence should reject non-board targets without mutation', () => {
        G.zones['PersonalSupply:p1'].items = G.zones['PersonalSupply:p1'].items.filter((id: string) => id !== 'inf_1');
        G.zones.board_t1.items.push('inf_1');

        const before = JSON.stringify(G);
        const result = CoreMoves.moveInfluence({ G, ctx, events }, { sourceId: 'board_t1', targetId: 'offboard_t' });
        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('moveInfluence should remain legal at cap because it only relocates markers', () => {
        seedPlayerInfluenceAtCap();
        const beforeCount = countOwnedInfluence();

        const result = CoreMoves.moveInfluence({ G, ctx, events }, { sourceId: 'board_t1', targetId: 'board_t2' });

        expect(result).not.toBe(INVALID_MOVE);
        expect(G.zones.board_t1.items.length).toBe(5);
        expect(G.zones.board_t2.items.length).toBe(1);
        expect(countOwnedInfluence()).toBe(beforeCount);
    });

    it('placeInfluence should remain legal at cap because it uses existing supply marker', () => {
        seedPlayerInfluenceAtCap();
        const beforeCount = countOwnedInfluence();

        const result = CoreMoves.placeInfluence({ G, ctx, events }, { targetTileId: 'board_t2' });

        expect(result).not.toBe(INVALID_MOVE);
        expect(G.zones['PersonalSupply:p1'].items.includes('inf_1')).toBe(false);
        expect(G.zones.board_t2.items).toContain('inf_1');
        expect(countOwnedInfluence()).toBe(beforeCount);
    });

    it('formalizeInfluence should enforce different-resort cost on standard Committee', () => {
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_dom_2'];

        const before = JSON.stringify(G);
        const result = CoreMoves.formalizeInfluence(
            { G, ctx, events },
            { committeeTileId: 'board_t2', paymentResourceIds: ['res_dom', 'res_dom_2'] }
        );

        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('formalizeInfluence should be rejected at cap without partial mutation', () => {
        seedPlayerInfluenceAtCap();
        const before = JSON.stringify(G);

        const result = CoreMoves.formalizeInfluence(
            { G, ctx, events },
            { committeeTileId: 'board_t2', paymentResourceIds: ['res_dom', 'res_for'] }
        );

        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });

    it('formalizeInfluence should enforce Start Committee special cost', () => {
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for', 'res_inf', 'res_dom_2'];

        const beforeFail = JSON.stringify(G);
        const fail = CoreMoves.formalizeInfluence(
            { G, ctx, events },
            { committeeTileId: 'board_start', paymentResourceIds: ['res_dom', 'res_for', 'res_dom_2'] }
        );
        expect(fail).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(beforeFail);

        CoreMoves.formalizeInfluence(
            { G, ctx, events },
            { committeeTileId: 'board_start', paymentResourceIds: ['res_dom', 'res_for', 'res_inf', 'res_dom_2'] }
        );

        expect(G.zones.Bank.items).toContain('res_dom');
        expect(G.zones.Bank.items).toContain('res_for');
        expect(G.zones.Bank.items).toContain('res_inf');
        expect(G.zones.Bank.items).toContain('res_dom_2');
        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(1);
        const newInfId = G.zones['PersonalSupply:p1'].items[0];
        expect(G.objects[newInfId].type).toBe('Influence');
    });

    it('convertResources should follow grassroots conversion spec without formalizing influence', () => {
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for'];

        CoreMoves.convertResources(
            { G, ctx, events },
            { grassrootsTileId: 'board_gr', inputResourceIds: ['res_dom', 'res_for'], outputResort: 'INF' }
        );

        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(1);
        const grantedId = G.zones['PersonalSupply:p1'].items[0];
        expect(G.objects[grantedId].type).toBe('Resource');
        expect(G.objects[grantedId].resort).toBe('INF');
    });

    it('placeInfluence should reject malformed payload without mutation', () => {
        const before = JSON.stringify(G);
        const result = CoreMoves.placeInfluence({ G, ctx, events }, 'board_t1' as any);
        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });
});
