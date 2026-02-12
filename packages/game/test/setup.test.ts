import { describe, it, expect } from 'vitest';
import { SetupGame } from '../src/setup';
import { CoreZoneNames, TileType } from '@balance-control/rules';

describe('SetupGame', () => {
    it('should generate correct number of core tiles', () => {
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        const drawPile = G.zones[CoreZoneNames.DrawPile].items;

        // Resorts: 3 types * 12 = 36
        // Committees: 10
        // Grassroots: 8
        // Lobbyists: 9
        // Hotspots: 8
        // Total = 71
        expect(drawPile.length).toBe(71);

        const tiles = drawPile.map(id => G.tiles[id]);

        const resorts = tiles.filter(t => t.type === TileType.Resort);
        expect(resorts.length).toBe(36);

        const committees = tiles.filter(t => t.type === TileType.Committee);
        expect(committees.length).toBe(10);

        const hotspots = tiles.filter(t => t.type === TileType.Hotspot);
        expect(hotspots.length).toBe(8);
    });

    it('should place Start Committee on Board', () => {
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        const board = G.zones[CoreZoneNames.Board].items;
        expect(board.length).toBe(1);
        expect(G.tiles[board[0]].type).toBe(TileType.StartCommittee);
    });
});
