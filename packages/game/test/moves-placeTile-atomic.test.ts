import { describe, it, expect, beforeEach } from 'vitest';
import { CoreMoves } from '../src/moves';
import { GameState, TileType, CoreZoneName } from '@balance-control/rules';
import { INVALID_MOVE } from 'boardgame.io/core';
import { registerTestPacks } from './_helpers/registerPacks';

describe('placeTile Atomicity', () => {
    let G: GameState;
    let ctx: any;
    let events: any;

    beforeEach(() => {
        registerTestPacks();
        events = { endTurn: () => { }, endStage: () => { }, setStage: () => { } };
        G = {
            zones: {
                [CoreZoneName.Board]: { id: CoreZoneName.Board, name: 'Board', items: ['board_start'] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS', items: ['res_1'] },
                'staging_p1': { id: 'staging_p1', name: 'Staging', items: ['tile_1'] },
                Bank: { id: 'Bank', name: 'Bank', items: [] }
            },
            tiles: {
                board_start: { id: 'board_start', type: TileType.StartCommittee },
                tile_1: { id: 'tile_1', type: TileType.Resort, resort: 'DOM' }
            },
            objects: {
                res_1: { id: 'res_1', type: 'Resource', owner: 'p1', resort: 'DOM' }
            },
            grid: {
                '0,0': 'board_start'
            },
            adjacency: {
                board_start: []
            },
            engine: {
                idSeq: 0,
                effectQueue: [],
                activeModifiers: [],
                history: [],
                attributes: {
                    playerExtraCosts: { p1: 1 } // p1 must pay 1 resource to place a tile
                }
            }
        } as any;

        ctx = {
            currentPlayer: 'p1',
            activePlayers: { p1: 'drawAndPlace' }
        };
    });

    it('should not pay costs if placement is occupied', () => {
        const payload = { targetCoord: '0,0', extraResourceIds: ['res_1'] };
        const result = CoreMoves.placeTile({ G, ctx, events }, payload);

        expect(result).toBe(INVALID_MOVE);
        expect(G.zones['PersonalSupply:p1'].items).toContain('res_1');
        expect(G.zones['Bank'].items).not.toContain('res_1');
        expect(G.engine.attributes.playerExtraCosts.p1).toBe(1);
    });

    it('should not pay costs if placement is not adjacent', () => {
        const payload = { targetCoord: '2,0', extraResourceIds: ['res_1'] };
        const result = CoreMoves.placeTile({ G, ctx, events }, payload);

        expect(result).toBe(INVALID_MOVE);
        expect(G.zones['PersonalSupply:p1'].items).toContain('res_1');
        expect(G.zones['Bank'].items).not.toContain('res_1');
        expect(G.engine.attributes.playerExtraCosts.p1).toBe(1);
    });
});
