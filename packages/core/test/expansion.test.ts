import { describe, it, expect, beforeEach } from 'vitest';
import { EnginePackRegistry } from '@balance-control/game';
import { EffectResolver } from '@balance-control/game';
import { GameState, TileType } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';
import { makeTestPack } from './_helpers/makeTestPack';

describe('Expansion System', () => {

    const resetRegistry = () => {
        registerTestPacks();
    };

    beforeEach(() => {
        resetRegistry();
    });

    it('should register an expansion', () => {
        resetRegistry();
        const mockPack = makeTestPack({ id: 'exp01', name: 'TestPack' });
        EnginePackRegistry.registerPack(mockPack);
        const all = EnginePackRegistry.getRegisteredPacks().map((pack) => pack.id);
        expect(all).toContain('exp01');
    });

    it('should return expansions in deterministic canonical order', () => {
        resetRegistry();
        EnginePackRegistry.registerPack(makeTestPack({ id: 'exp03', name: 'E3' }));
        EnginePackRegistry.registerPack(makeTestPack({ id: 'exp01', name: 'E1' }));
        EnginePackRegistry.registerPack(makeTestPack({ id: 'exp02', name: 'E2' }));

        expect(EnginePackRegistry.getRegisteredPacks().map((e) => e.id)).toEqual(['core', 'exp01', 'exp02', 'exp03']);
    });

    it('should apply production modifiers', () => {
        resetRegistry();
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
        const modPack = makeTestPack({
            id: 'exp01',
            name: 'ModPack',
            modifiers: {
                production: (tileId, G, base) => base + 10
            }
        });
        EnginePackRegistry.registerPack(modPack);

        // Resolve
        G.engine.effectQueue.push({ kind: 'production.resolve', tileId: 'r1' });
        EffectResolver.resolve(G, { numPlayers: 2 } as any);

        // Check result
        // Should produce 1 + 10 = 11 resources
        const supply = G.zones['PersonalSupply:p1'];
        expect(supply.items.length).toBe(11);
    });
});
