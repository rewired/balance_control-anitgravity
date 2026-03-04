import { describe, it, expect, beforeEach } from 'vitest';
import { CoreZoneName, TileType, GameState } from '@balance-control/rules';
import { SetupGame } from '../src/setup';
import { CoreMoves } from '../src/moves';
import { registerTestPacks } from './_helpers/registerPacks';
import { INVALID_MOVE } from 'boardgame.io/core';

describe('Grassroots Repro', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('reproduces 3-to-1 availability on Typed Grassroots', () => {
        const ctx = {
            numPlayers: 2,
            currentPlayer: '0',
            activePlayers: { '0': 'politicalAction' }
        } as any;
        const G = SetupGame({ ctx });

        const tileId = 'tile_grassroots_dom_repro';
        G.tiles[tileId] = {
            id: tileId,
            type: TileType.Grassroots,
            resort: 'DOM',
            conversion: { inputSlots: 2, outputSlots: 1, typedResort: 'DOM' }
        } as any;
        G.zones[CoreZoneName.Board].items.push(tileId);
        G.grid['0,0'] = tileId;
        G.zones[tileId] = { id: tileId, items: ['inf_0'] } as any;
        G.objects['inf_0'] = { id: 'inf_0', type: 'Influence', owner: '0' } as any;

        // Give player enough resources
        const supplyId = 'PersonalSupply:0';
        G.zones[supplyId] = { id: supplyId, items: ['r1', 'r2', 'r3'] } as any;
        G.objects['r1'] = { id: 'r1', type: 'Resource', owner: '0', resort: 'DOM' } as any;
        G.objects['r2'] = { id: 'r2', type: 'Resource', owner: '0', resort: 'DOM' } as any;
        G.objects['r3'] = { id: 'r3', type: 'Resource', owner: '0', resort: 'DOM' } as any;

        const { enumerateLegalIntents } = require('../src/engine/legal-intents');
        const intents = enumerateLegalIntents(G, ctx, '0');
        const convertIntents = intents.filter(i => i.moveType === 'convertResources' && i.payload.grassrootsTileId === tileId);

        console.log('Intents for Grassroots DOM:', convertIntents.map(i => `${i.payload.inputCount} -> ${i.payload.outputResort}`));

        const hasThreeInputVariant = convertIntents.some(i => i.payload.inputCount === 3);
        expect(hasThreeInputVariant).toBe(true); // Current behavior
    });

    it('verifies that conversion grants resources correctly', () => {
        const ctx = {
            numPlayers: 2,
            currentPlayer: '0',
            activePlayers: { '0': 'politicalAction' }
        } as any;
        const G = SetupGame({ ctx });

        const tileId = 'tile_grassroots_dom_credit';
        G.tiles[tileId] = {
            id: tileId,
            type: TileType.Grassroots,
            resort: 'DOM',
            conversion: { inputSlots: 2, outputSlots: 1, typedResort: 'DOM' }
        } as any;
        G.zones[CoreZoneName.Board].items.push(tileId);
        G.grid['0,0'] = tileId;
        G.zones[tileId] = { id: tileId, items: ['inf_0'] } as any;
        G.objects['inf_0'] = { id: 'inf_0', type: 'Influence', owner: '0' } as any;

        const supplyId = 'PersonalSupply:0';
        G.zones[supplyId].items = ['r1', 'r2'];
        G.objects['r1'] = { id: 'r1', type: 'Resource', owner: '0', resort: 'DOM' } as any;
        G.objects['r2'] = { id: 'r2', type: 'Resource', owner: '0', resort: 'DOM' } as any;

        const resBefore = G.zones[supplyId].items.length;

        const events = { endTurn: () => { } };
        const result = CoreMoves.convertResources({ G, ctx, events } as any, {
            grassrootsTileId: tileId,
            inputCount: 2,
            outputResort: 'DOM'
        });

        expect(result).not.toBe(INVALID_MOVE);

        const resAfter = G.zones[supplyId].items.length;
        console.log('Resources before:', resBefore, 'after:', resAfter);

        // Should have 1 resource now (2 paid, 1 granted)
        expect(resAfter).toBe(1);
        const grantedId = G.zones[supplyId].items[0];
        expect(G.objects[grantedId].resort).toBe('DOM');
        expect(G.objects[grantedId].owner).toBe('0');
    });
});
