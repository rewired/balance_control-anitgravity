import { describe, expect, it } from 'vitest';
import { INVALID_MOVE } from 'boardgame.io/core';
import { CoreZoneNames, CoreResources, TileType } from '@balance-control/rules';
import { SetupGame } from '../src/setup';
import { CoreMoves } from '../src/moves';

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
    const drawPile = G.zones[CoreZoneNames.DrawPile];
    // Use Typed Grassroots (2:1) for this test
    const grassrootsTileId = drawPile.items.find(
        (tileId) => G.tiles[tileId]?.type === TileType.Grassroots && (G.tiles[tileId]?.conversion?.inputSlots === 2 || G.tiles[tileId]?.resort)
    );

    if (!grassrootsTileId) {
        throw new Error('Expected SetupGame to generate at least one Grassroots tile.');
    }

    drawPile.items = drawPile.items.filter((tileId) => tileId !== grassrootsTileId);
    G.zones[CoreZoneNames.Board].items.push(grassrootsTileId);

    return { G, ctx, grassrootsTileId };
}

function addPlayerResource(G: any, playerId: string, resourceId: string, resort: string): void {
    G.objects[resourceId] = {
        id: resourceId,
        type: 'Resource',
        owner: playerId,
        resort
    };
    G.zones[`${CoreZoneNames.PersonalSupply}:${playerId}`].items.push(resourceId);
}

describe('ConvertResources with real setup-generated Grassroots tiles', () => {
    it('should succeed on a SetupGame Grassroots tile with valid input and output', () => {
        const { G, ctx, grassrootsTileId } = prepareGameWithBoardGrassroots();
        const events = { endTurn: () => { } };
        const pid = ctx.currentPlayer;
        const supply = G.zones[`${CoreZoneNames.PersonalSupply}:${pid}`];

        addPlayerResource(G, pid, 'res_dom_input', CoreResources.DOM);
        addPlayerResource(G, pid, 'res_for_input', CoreResources.FOR);
        const influenceId = supply.items.find((itemId: string) => G.objects[itemId]?.type === 'Influence') as string;
        supply.items = supply.items.filter((itemId: string) => itemId !== influenceId);
        G.zones[grassrootsTileId].items.push(influenceId);

        const result = CoreMoves.convertResources(
            { G, ctx, events },
            {
                grassrootsTileId,
                inputResourceIds: ['res_dom_input', 'res_for_input'],
                outputResort: CoreResources.INF
            }
        );

        expect(result).not.toBe(INVALID_MOVE);
        expect(supply.items).not.toContain('res_dom_input');
        expect(supply.items).not.toContain('res_for_input');
        expect(G.zones[CoreZoneNames.Bank].items).toContain('res_dom_input');
        expect(G.zones[CoreZoneNames.Bank].items).toContain('res_for_input');

        const granted = supply.items
            .map((id: string) => G.objects[id])
            .filter((obj: any) => obj?.type === 'Resource' && obj.id !== 'res_dom_input' && obj.id !== 'res_for_input');

        expect(granted).toHaveLength(1);
        expect(granted[0].owner).toBe(pid);
        expect(granted[0].resort).toBe(CoreResources.INF);
    });

    it('should fail atomically on invalid conversion input count', () => {
        const { G, ctx, grassrootsTileId } = prepareGameWithBoardGrassroots();
        const events = { endTurn: () => { } };
        const pid = ctx.currentPlayer;

        addPlayerResource(G, pid, 'res_dom_input', CoreResources.DOM);
        const before = JSON.stringify(G);

        const result = CoreMoves.convertResources(
            { G, ctx, events },
            {
                grassrootsTileId,
                inputResourceIds: ['res_dom_input'],
                outputResort: CoreResources.INF
            }
        );

        expect(result).toBe(INVALID_MOVE);
        expect(JSON.stringify(G)).toBe(before);
    });
});
