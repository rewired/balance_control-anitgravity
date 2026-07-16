import { beforeEach, describe, expect, it } from 'vitest';
import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { SetupGame } from '../src/setup';
import { CoreMoves } from '../src/moves';
import { registerTestPacks } from './_helpers/registerPacks';

function createCtx() {
    return {
        currentPlayer: '0',
        numPlayers: 2,
        activePlayers: { '0': 'politicalAction' },
        random: { Shuffle: (items: string[]) => items }
    } as any;
}

function prepareGameWithBoardGrassroots() {
    const ctx = createCtx();
    const G = SetupGame({ ctx });
    const drawPile = G.zones[CoreZoneName.DrawPile];
    // Use Typed Grassroots (2:1) for this test
    const grassrootsTileId = drawPile.items.find(
        (tileId) => G.tiles[tileId]?.type === TileType.Grassroots && (G.tiles[tileId]?.conversion?.inputSlots === 2 || G.tiles[tileId]?.resort)
    );

    if (!grassrootsTileId) {
        throw new Error('Expected SetupGame to generate at least one Grassroots tile.');
    }

    drawPile.items = drawPile.items.filter((tileId) => tileId !== grassrootsTileId);
    G.zones[CoreZoneName.Board].items.push(grassrootsTileId);

    return { G, ctx, grassrootsTileId };
}

function addPlayerResource(G: any, playerId: string, resourceId: string, resort: string): void {
    G.objects[resourceId] = {
        id: resourceId,
        type: 'Resource',
        owner: playerId,
        resort
    };
    G.zones[`${CoreZoneName.PersonalSupply}:${playerId}`].items.push(resourceId);
}

describe('ConvertResources with real setup-generated Grassroots tiles', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('should succeed on a SetupGame Grassroots tile with valid input and output', () => {
        const { G, ctx, grassrootsTileId } = prepareGameWithBoardGrassroots();
        const events = { endTurn: () => { } };
        const pid = ctx.currentPlayer;
        const supply = G.zones[`${CoreZoneName.PersonalSupply}:${pid}`];

        const tile = G.tiles[grassrootsTileId];
        const typedResort = (tile.conversion?.typedResort ?? tile.resort) || 'DOM';

        // Variant A: 2 inputs -> output fixed to T. 
        // Use resorts for inputs that are NOT the typed resort to avoid ID collision if the bank is used.
        const coreResorts = ['DOM', 'FOR', 'INF'];
        const inputResorts = coreResorts.filter(r => r !== typedResort);

        addPlayerResource(G, pid, 'res_in_1', inputResorts[0]);
        addPlayerResource(G, pid, 'res_in_2', inputResorts[1]);

        const influenceId = supply.items.find((itemId: string) => G.objects[itemId]?.type === 'Influence') as string;
        supply.items = supply.items.filter((itemId: string) => itemId !== influenceId);
        G.zones[grassrootsTileId].items.push(influenceId);

        const result = CoreMoves.convertResources(
            { G, ctx, events },
            {
                grassrootsTileId,
                inputResourceIds: ['res_in_1', 'res_in_2'],
                outputResort: typedResort
            }
        );

        expect(result).not.toBe(INVALID_MOVE);
        expect(supply.items).not.toContain('res_in_1');
        expect(supply.items).not.toContain('res_in_2');

        const granted = supply.items
            .map((id: string) => G.objects[id])
            .filter((obj: any) => obj?.type === 'Resource' && !['res_in_1', 'res_in_2'].includes(obj.id));

        expect(granted).toHaveLength(1);
        expect(granted[0].owner).toBe(pid);
        expect(granted[0].resort).toBe(typedResort);
    });

    it('should fail atomically on invalid conversion input count', () => {
        const { G, ctx, grassrootsTileId } = prepareGameWithBoardGrassroots();
        const events = { endTurn: () => { } };
        const pid = ctx.currentPlayer;

        addPlayerResource(G, pid, 'res_dom_input', 'DOM');
        const before = JSON.stringify(G);

        const result = CoreMoves.convertResources(
            { G, ctx, events },
            {
                grassrootsTileId,
                inputResourceIds: ['res_dom_input'],
                outputResort: 'INF'
            }
        );

        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });
});
