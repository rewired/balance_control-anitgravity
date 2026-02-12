import { describe, it, expect } from 'vitest';
import { computeMajority } from '../src/mechanics';
import { GameState, TileType, CoreZoneNames, GameObject } from '@balance-control/rules';

describe('computeMajority', () => {
    // Stub G
    const stubG = (): GameState => ({
        zones: {
            'tile_1': { id: 'tile_1', name: 'T1', items: [] },
            'tile_2': { id: 'tile_2', name: 'T2', items: [] }
        },
        tiles: {
            'tile_1': { id: 'tile_1', type: TileType.Resort },
            'tile_2': { id: 'tile_2', type: TileType.Lobbyist }
        },
        objects: {},
        adjacency: {},
    });

    it('should return null if no influence', () => {
        const G = stubG();
        const result = computeMajority('tile_1', G);
        expect(result.controller).toBeNull();
    });

    it('should return winner if strict majority', () => {
        const G = stubG();
        G.objects['inf_p1'] = { id: 'inf_p1', type: 'Influence', owner: 'p1' };
        G.zones['tile_1'].items.push('inf_p1');

        const result = computeMajority('tile_1', G);
        expect(result.controller).toBe('p1');
    });

    it('should return null if tie', () => {
        const G = stubG();
        G.objects['inf_p1'] = { id: 'inf_p1', type: 'Influence', owner: 'p1' };
        G.objects['inf_p2'] = { id: 'inf_p2', type: 'Influence', owner: 'p2' };
        G.zones['tile_1'].items.push('inf_p1');
        G.zones['tile_1'].items.push('inf_p2');

        const result = computeMajority('tile_1', G);
        expect(result.controller).toBeNull();
        expect(result.winners).toContain('p1');
        expect(result.winners).toContain('p2');
    });

    it('should handle Lobbyist influence', () => {
        const G = stubG();
        // Tile 1 has P1
        G.objects['inf_p1'] = { id: 'inf_p1', type: 'Influence', owner: 'p1' };
        G.zones['tile_1'].items.push('inf_p1'); // P1 = 1

        // Lobbyist (Tile 2) adjacent to Tile 1
        G.adjacency['tile_1'] = ['tile_2'];

        // P2 controls Lobbyist
        G.objects['inf_p2_lob'] = { id: 'inf_p2_lob', type: 'Influence', owner: 'p2' };
        G.zones['tile_2'].items.push('inf_p2_lob');

        // Calculate Majority on T1
        // P1 has 1 (raw)
        // P2 controls Lobbyist -> +1 (virtual)
        // Total: P1=1, P2=1 -> Tie.

        let result = computeMajority('tile_1', G);
        expect(result.controller).toBeNull();
        expect(result.winners).toContain('p1');
        expect(result.winners).toContain('p2');

        // Add another influence for P2 on T1
        G.objects['inf_p2_t1'] = { id: 'inf_p2_t1', type: 'Influence', owner: 'p2' };
        G.zones['tile_1'].items.push('inf_p2_t1');

        // Total: P1=1, P2=2 (1 raw + 1 virtual)
        result = computeMajority('tile_1', G);
        expect(result.controller).toBe('p2');
    });
});
