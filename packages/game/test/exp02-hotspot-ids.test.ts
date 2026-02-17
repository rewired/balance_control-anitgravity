import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CoreZoneNames } from '@balance-control/rules';
import { Expansion02, EXP02_TILE_INNER_ORDER_ID } from '../../expansion-02/src/index';
import { ExpansionRegistry } from '../src/expansion-registry';
import { SetupGame } from '../src/setup';
import { computeMajority } from '../src/mechanics';
import { registerTestPacks } from './_helpers/registerPacks';

describe('EXP-02 Inner Order hotspot id consistency', () => {
    beforeEach(() => {
        registerTestPacks([Expansion02 as any]);
    });

    afterEach(() => {
        ExpansionRegistry.clear();
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

        const innerOrderId = EXP02_TILE_INNER_ORDER_ID;
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

        Expansion02.effectHandlers?.HOTSPOT_RESOLUTION?.(
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
