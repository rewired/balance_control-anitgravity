import { describe, it, expect, beforeEach } from 'vitest';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { SetupGame } from '../src/setup';
import { enumerateLegalIntents } from '@balance-control/game';
import { registerTestPacks } from './_helpers/registerPacks';

describe('Legal Intents: ConvertResources Resource Limits', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('should NOT enumerate 3-input variants if player only has 2 resources', () => {
        const ctx = {
            numPlayers: 2,
            currentPlayer: '0',
            activePlayers: { '0': 'politicalAction' }
        } as any;
        const G = SetupGame({ ctx });

        const tileId = 'tile_grassroots_dom';
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

        // Give player exactly TWO resources
        const supplyId = 'PersonalSupply:0';
        G.zones[supplyId] = { id: supplyId, items: ['r1', 'r2'] } as any;
        G.objects['r1'] = { id: 'r1', type: 'Resource', owner: '0', resort: 'DOM' } as any;
        G.objects['r2'] = { id: 'r2', type: 'Resource', owner: '0', resort: 'DOM' } as any;

        const intents = enumerateLegalIntents(G, ctx, '0');
        const convertIntents = intents.filter(i => i.moveType === 'convertResources' && i.payload.grassrootsTileId === tileId);

        console.log('Intents generated with 2 resources:', convertIntents.map(i => `${i.payload.inputCount} -> ${i.payload.outputResort}`));

        const hasTwoInputVariant = convertIntents.some(i => i.payload.inputCount === 2);
        const hasThreeInputVariant = convertIntents.some(i => i.payload.inputCount === 3);

        expect(hasTwoInputVariant).toBe(true);
        expect(hasThreeInputVariant).toBe(false); // Should not be generated!
    });
});
