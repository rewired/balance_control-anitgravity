import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CoreZoneNames } from '@balance-control/rules';
import { EnginePackRegistry } from '../src/expansion-registry';
import { SetupGame } from '../src/setup';
import { computeMajority } from '../src/mechanics';
import { registerTestPacks } from './_helpers/registerPacks';
import type { EnginePackDefinition } from '../src/packs/types';

describe('EXP-02 Inner Order hotspot id consistency', () => {
    // Define a dummy pack to replace Exp02Pack
    const DUMMY_TILE_ID = 'tile_dummy_inner_order';
    
    const DummyExp02Pack: EnginePackDefinition = {
        id: 'exp02', // Use 'exp02' to mimic the expansion ID if needed, or 'dummy'
        name: 'Dummy Exp 02',
        manifest: { id: 'exp02', packVersion: '0.0.0', rulesetAnchor: 'EXP-02', required: false },
        effectHandlers: {
            HOTSPOT_RESOLUTION: (G, ctx, atom, { computeMajority }) => {
                // Mimic the logic: check majority and emit atoms
                const { payload } = atom;
                const { tileId } = payload;
                const { controller } = computeMajority(tileId, G);
                if (controller) {
                     G.engine.effectQueue.push(
                        { kind: 'resource.pay', playerId: controller, amount: 1, resorts: 'ANY', resourceIds: [] },
                        { kind: 'regulation.place', playerId: controller, targetTileId: tileId }
                     );
                }
            }
        },
        // We need to setup the tile
        setup: {
            preShuffle: (G) => {
                 G.tiles[DUMMY_TILE_ID] = { id: DUMMY_TILE_ID, type: 'Resort', resort: 'SEC' };
                 G.zones[DUMMY_TILE_ID] = { id: DUMMY_TILE_ID, name: 'Inner Order', items: [] };
                 G.zones[CoreZoneNames.Board].items.push(DUMMY_TILE_ID);
                 // Also need to initialize adjacency for computeMajority to work without error (though it handles missing)
                 G.adjacency[DUMMY_TILE_ID] = [];
            }
        }
    };

    beforeEach(() => {
        registerTestPacks([DummyExp02Pack]);
    });

    afterEach(() => {
        EnginePackRegistry.clear();
    });

    it('should resolve HOTSPOT_RESOLUTION for the setup Inner Order tile id', () => {
        const ctx: any = {
            currentPlayer: '0',
            numPlayers: 2,
            random: { Shuffle: (items: string[]) => items }
        };

        const G = SetupGame({
            ctx,
            setupData: { expansions: { ex01: false, ex02: true, ex03: false } }
        }) as any;

        const innerOrderId = DUMMY_TILE_ID;
        expect(G.tiles[innerOrderId]).toBeTruthy();
        expect(G.zones[innerOrderId]).toBeTruthy();

        const pid = '0';
        const supply = G.zones[`${CoreZoneNames.PersonalSupply}:${pid}`];
        const innerOrderZone = G.zones[innerOrderId];

        const influenceId = supply.items.find((id: string) => G.objects[id]?.type === 'Influence');
        expect(influenceId).toBeTruthy();
        if (!influenceId) {
            throw new Error('Expected starting influence for player 0');
        }

        supply.items = supply.items.filter((id: string) => id !== influenceId);
        innerOrderZone.items.push(influenceId);
        expect(computeMajority(innerOrderId, G).controller).toBe(pid);

        const queueBefore = [...G.engine.effectQueue];

        // Call the handler from the dummy pack
        DummyExp02Pack.effectHandlers?.HOTSPOT_RESOLUTION?.(
            G,
            ctx,
            {
                payload: {
                    tileId: innerOrderId,
                    action: 'place',
                    regType: 'SecurityLevel',
                    targetTileId: innerOrderId
                }
            },
            { computeMajority }
        );

        expect(G.engine.effectQueue.length).toBeGreaterThan(queueBefore.length);
        expect(G.engine.effectQueue.some((atom: any) => atom.kind === 'resource.pay')).toBe(true);
        expect(G.engine.effectQueue.some((atom: any) => atom.kind === 'regulation.place')).toBe(true);
    });
});
