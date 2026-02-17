import { describe, it, expect, beforeEach } from 'vitest';
import { EnginePackRegistry, packFromExpansionDefinition } from '../src/expansion-registry';
import { EffectResolver } from '../src/engine/resolver';
import { ExpansionDefinition, GameState, TileType } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';

describe('Expansion System', () => {

    beforeEach(() => {
        registerTestPacks();
    });

    it('should register an expansion', () => {
        const mockExp: ExpansionDefinition = { id: 'exp01', name: 'TestExp' };
        EnginePackRegistry.registerPack(packFromExpansionDefinition(mockExp));
        const all = EnginePackRegistry.getRegisteredPacks().map((pack) => pack.id);
        expect(all).toContain('exp01');
    });

    it('should return expansions in deterministic canonical order', () => {
        EnginePackRegistry.registerPack(packFromExpansionDefinition({ id: 'exp03', name: 'E3' } as ExpansionDefinition));
        EnginePackRegistry.registerPack(packFromExpansionDefinition({ id: 'exp01', name: 'E1' } as ExpansionDefinition));
        EnginePackRegistry.registerPack(packFromExpansionDefinition({ id: 'exp02', name: 'E2' } as ExpansionDefinition));

        expect(EnginePackRegistry.getRegisteredPacks().map((e) => e.id)).toEqual(['core', 'exp01', 'exp02', 'exp03']);
    });

    it('should apply production modifiers', () => {
        // Setup State
        const G: GameState & { engine: any } = {
            zones: {
                'Bank': { id: 'Bank', name: 'Bank', items: [] },
                'PersonalSupply:p1': { id: 'PersonalSupply:p1', name: 'PS', items: [] }
            },
            tiles: {
                'r1': { id: 'r1', type: TileType.Resort, resort: 'DOM', weight: 1 }
            },
            objects: {
                'inf_p1': { id: 'inf_p1', type: 'Influence', owner: 'p1' }
            },
            adjacency: {},
            grid: {},
            meta: {
                cfg: { expansions: { ex01: true, ex02: false, ex03: false } }
            },
            engine: {
                effectQueue: [],
                activeModifiers: [],
                history: [],
                attributes: {}
            }
        };
        // Place influence (Simple Majority)
        G.zones['r1'] = { id: 'r1', name: 'R1', items: ['inf_p1'] };

        // Register Modifier
        const modExp: ExpansionDefinition = {
            id: 'exp01',
            name: 'ModExp',
            modifiers: {
                production: (tileId, G, base) => base + 10
            }
        };
        EnginePackRegistry.registerPack(packFromExpansionDefinition(modExp));

        // Resolve
        G.engine.effectQueue.push({ kind: 'production.resolve', tileId: 'r1' });
        EffectResolver.resolve(G, null);

        // Check result
        // Should produce 1 + 10 = 11 resources
        const supply = G.zones['PersonalSupply:p1'];
        expect(supply.items.length).toBe(11);
    });
});
