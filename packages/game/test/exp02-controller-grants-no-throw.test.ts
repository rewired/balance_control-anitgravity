import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CoreZoneNames, TileType } from '@balance-control/rules';
import { Expansion02 } from '../../expansion-02/src/index';
import { ExpansionRegistry } from '../src/expansion-registry';
import { SetupGame } from '../src/setup';
import { computeMajority } from '../src/mechanics';

const EXP02_MEASURE_IDS = [
    'M01', 'M02', 'M03', 'M04', 'M05',
    'M06', 'M07', 'M08', 'M09', 'M10',
    'M11', 'M12', 'M13', 'M14', 'M15'
];

function collectControllerGrants(value: unknown, out: any[] = []): any[] {
    if (Array.isArray(value)) {
        for (const item of value) {
            collectControllerGrants(item, out);
        }
        return out;
    }

    if (!value || typeof value !== 'object') {
        return out;
    }

    const atom = value as Record<string, any>;
    if (atom.kind === 'resource.grant' && atom.playerId === 'CONTROLLER') {
        out.push(atom);
    }

    if (atom.modifier?.effect) {
        collectControllerGrants(atom.modifier.effect, out);
    }

    return out;
}

describe('EXP-02 controller grants with no controller', () => {
    beforeEach(() => {
        ExpansionRegistry.clear();
        ExpansionRegistry.register(Expansion02 as any);
    });

    afterEach(() => {
        ExpansionRegistry.clear();
    });

    it('should require explicit SKIP policy on all EXP-02 CONTROLLER grants', () => {
        const ctx: any = {
            currentPlayer: '0',
            numPlayers: 2,
            random: { Shuffle: (items: string[]) => items }
        };

        const G = SetupGame({
            ctx,
            setupData: { expansions: { ex01: false, ex02: true, ex03: false } }
        }) as any;

        const targetTileId = G.zones[CoreZoneNames.DrawPile].items.find(
            (tileId: string) => G.tiles[tileId]?.type === TileType.Resort
        ) ?? 'tile_authority_apparatus';

        const payload = {
            playerId: '0',
            targetTileId,
            regType: 'Administration',
            regulationId: 'reg_Administration_0',
            newTargetTileId: targetTileId,
            targetPlayerId: '1'
        };

        const controllerGrants: any[] = [];
        for (const measureId of EXP02_MEASURE_IDS) {
            const atoms = Expansion02.getMeasureAtoms?.(G, measureId, payload);
            collectControllerGrants(atoms, controllerGrants);
        }

        const invalid = controllerGrants.filter((atom) => atom.missingController !== 'SKIP');
        expect(invalid).toEqual([]);
    });

    it('should not throw and should not grant to Noise for uncontrolled EXP-02 effect path', () => {
        const ctx: any = {
            currentPlayer: '0',
            numPlayers: 2,
            random: { Shuffle: (items: string[]) => items }
        };

        const G = SetupGame({
            ctx,
            setupData: { expansions: { ex01: false, ex02: true, ex03: false } }
        }) as any;

        const hotspotId = 'tile_innere_ordnung';
        G.tiles[hotspotId] = { id: hotspotId, type: TileType.Hotspot, name: 'Inner Order' };
        G.zones[hotspotId] = { id: hotspotId, name: 'Inner Order', items: [] };

        const pid = ctx.currentPlayer;
        const supply = G.zones[`${CoreZoneNames.PersonalSupply}:${pid}`];
        const noise = G.zones[CoreZoneNames.Noise];

        const supplyBefore = [...supply.items];
        const noiseBefore = [...noise.items];
        const queueBefore = [...G.engine.effectQueue];

        expect(() => {
            Expansion02.effectHandlers?.HOTSPOT_RESOLUTION?.(
                G,
                ctx,
                {
                    payload: {
                        tileId: hotspotId,
                        action: 'place',
                        regType: 'Administration',
                        targetTileId: hotspotId
                    }
                },
                { computeMajority }
            );
        }).not.toThrow();

        expect(computeMajority(hotspotId, G).controller).toBeNull();
        expect(supply.items).toEqual(supplyBefore);
        expect(noise.items).toEqual(noiseBefore);
        expect(G.engine.effectQueue).toEqual(queueBefore);
    });
});
