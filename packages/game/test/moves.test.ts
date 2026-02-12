import { describe, it, expect, beforeEach } from 'vitest';
import { CoreMoves } from '../src/moves';
import { GameState, TileType, CoreZoneNames, GameObject } from '@balance-control/rules';
import { INVALID_MOVE } from 'boardgame.io/core';

describe('Moves', () => {
    let G: GameState;
    let ctx: any;
    let events: any;

    beforeEach(() => {
        events = { endTurn: () => { }, endStage: () => { } };
        G = {
            zones: {
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS', items: ['inf_1'] },
                'board_t1': { id: 'board_t1', name: 'T1', items: [] },
                'board_t2': { id: 'board_t2', name: 'T2', items: [] },
                'Bank': { id: 'Bank', name: 'Bank', items: [] }
            },
            tiles: {
                'board_t1': { id: 'board_t1', type: TileType.Resort },
                'board_t2': { id: 'board_t2', type: TileType.Committee }
            },
            objects: {
                'inf_1': { id: 'inf_1', type: 'Influence', owner: 'p1' },
                'res_dom': { id: 'res_dom', type: 'Resource', owner: 'p1', resort: 'DOM' },
                'res_for': { id: 'res_for', type: 'Resource', owner: 'p1', resort: 'FOR' }
            },
            adjacency: {},
            grid: {},
        } as any;
        ctx = { currentPlayer: 'p1', numPlayers: 2 };
    });

    it('placeInfluence should move influence to target', () => {
        CoreMoves.placeInfluence({ G, ctx, events }, 'board_t1');

        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(0);
        expect(G.zones['board_t1'].items).toHaveLength(1);
    });

    it('placeInfluence should fail if no supply', () => {
        G.zones['PersonalSupply:p1'].items = [];
        const result = CoreMoves.placeInfluence({ G, ctx, events }, 'board_t1');
        expect(result).toBe(INVALID_MOVE);
    });

    it('formalizeInfluence should cost resources and grant influence', () => {
        // Give resources to player
        G.zones['PersonalSupply:p1'].items = ['res_dom', 'res_for'];

        CoreMoves.formalizeInfluence({ G, ctx, events }, 'board_t2', ['res_dom', 'res_for']);

        // Resources moved to Bank
        expect(G.zones['Bank'].items).toContain('res_dom');
        expect(G.zones['Bank'].items).toContain('res_for');
        expect(G.zones['PersonalSupply:p1'].items).toHaveLength(1); // The new influence

        // Check new influence object
        const newInfId = G.zones['PersonalSupply:p1'].items[0];
        expect(G.objects[newInfId].type).toBe('Influence');
    });
});
