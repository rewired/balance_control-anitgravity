import { describe, it, expect, beforeEach } from 'vitest';
import { ExpansionRegistry } from '../src/expansion-registry';
import { resolveProduction } from '../src/mechanics';
import { ExpansionDefinition, GameState, TileType, CoreZoneNames } from '@balance-control/rules';

describe('Expansion System', () => {

    beforeEach(() => {
        ExpansionRegistry.clear();
    });

    it('should register an expansion', () => {
        const mockExp: ExpansionDefinition = { name: 'TestExp' };
        ExpansionRegistry.register(mockExp);
        const all = ExpansionRegistry.getAll();
        expect(all).toContain(mockExp);
    });

    it('should apply production modifiers', () => {
        // Setup State
        const G: GameState = {
            zones: {
                'ps:p1': { id: 'ps:p1', name: 'PS', items: [] },
                'bank': { id: 'bank', name: 'Bank', items: [] }
            },
            tiles: {
                'r1': { id: 'r1', type: TileType.Resort, resort: 'DOM', weight: 1 }
            },
            objects: {
                'inf_p1': { id: 'inf_p1', type: 'Influence', owner: 'p1' }
            },
            adjacency: {},
        };
        // Place influence (Simple Majority)
        G.zones['r1'] = { id: 'r1', name: 'R1', items: ['inf_p1'] };
        // Valid supply zone for production
        G.zones['PersonalSupply:p1'] = { id: 'PersonalSupply:p1', name: 'PS', items: [] };

        // Register Modifier
        const modExp: ExpansionDefinition = {
            name: 'ModExp',
            modifiers: {
                production: (tileId, G, base) => base + 10
            }
        };
        ExpansionRegistry.register(modExp);

        // Resolve
        resolveProduction('r1', G);

        // Check result
        // Should produce 1 + 10 = 11 resources
        const supply = G.zones['PersonalSupply:p1'];
        expect(supply.items.length).toBe(11);
    });
});
