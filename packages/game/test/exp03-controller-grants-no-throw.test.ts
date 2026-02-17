import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CoreResources, CoreZoneNames, TileType } from '@balance-control/rules';
import { Expansion03 } from '../../expansion-03/src/index';
import { EnginePackRegistry, ExpansionRegistry } from '../src/expansion-registry';
import { SetupGame } from '../src/setup';
import { computeMajority } from '../src/mechanics';
import { EffectResolver } from '../src/engine/resolver';
import { CorePack } from '../src/packs/core';

const EXP03_MEASURE_IDS = [
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

describe('EXP-03 controller grants with no controller', () => {
    beforeEach(() => {
        ExpansionRegistry.clear();
        EnginePackRegistry.registerPack(CorePack);
        ExpansionRegistry.register(Expansion03 as any);
    });

    afterEach(() => {
        ExpansionRegistry.clear();
    });

    it('should require explicit SKIP policy on all EXP-03 CONTROLLER grants', () => {
        const ctx: any = {
            currentPlayer: '0',
            numPlayers: 2,
            random: { Shuffle: (items: string[]) => items }
        };

        const G = SetupGame({
            ctx,
            setupData: { expansions: { ex01: false, ex02: false, ex03: true } }
        }) as any;

        const targetTileId = G.zones[CoreZoneNames.DrawPile].items.find(
            (tileId: string) => G.tiles[tileId]?.type === TileType.Resort
        ) ?? 'tile_transformationsdruck';

        const payload = {
            playerId: 'CONTROLLER',
            targetTileId,
            targetResort: CoreResources.CLM,
            targetPlayerId: '1'
        };

        const controllerGrants: any[] = [];
        for (const measureId of EXP03_MEASURE_IDS) {
            const atoms = Expansion03.getMeasureAtoms?.(G, measureId, payload);
            collectControllerGrants(atoms, controllerGrants);
        }

        expect(controllerGrants.length).toBeGreaterThan(0);
        const invalid = controllerGrants.filter((atom) => atom.missingController !== 'SKIP');
        expect(invalid).toEqual([]);
    });

    it('should not throw and should not grant to Noise for uncontrolled EXP-03 effect path', () => {
        const ctx: any = {
            currentPlayer: '0',
            numPlayers: 2,
            random: { Shuffle: (items: string[]) => items }
        };

        const G = SetupGame({
            ctx,
            setupData: { expansions: { ex01: false, ex02: false, ex03: true } }
        }) as any;

        const pid = ctx.currentPlayer;
        const drawPile = G.zones[CoreZoneNames.DrawPile];
        const board = G.zones[CoreZoneNames.Board];
        const supply = G.zones[`${CoreZoneNames.PersonalSupply}:${pid}`];
        const noise = G.zones[CoreZoneNames.Noise];
        const bank = G.zones[CoreZoneNames.Bank];

        const targetTileId = drawPile.items.find((tileId: string) => G.tiles[tileId]?.type === TileType.Resort);
        expect(targetTileId).toBeTruthy();
        if (!targetTileId) {
            throw new Error('Expected setup to include at least one resort tile');
        }

        drawPile.items = drawPile.items.filter((tileId: string) => tileId !== targetTileId);
        board.items.push(targetTileId);
        expect(computeMajority(targetTileId, G).controller).toBeNull();

        const atoms = Expansion03.getMeasureAtoms?.(G, 'M03', {
            playerId: 'CONTROLLER',
            targetResort: CoreResources.CLM,
            targetTileId
        });
        const grantAtom = atoms?.find((atom: any) => atom.kind === 'resource.grant');
        expect(grantAtom).toBeTruthy();
        if (!grantAtom) {
            throw new Error('Expected M03 to emit a resource.grant atom');
        }
        expect(grantAtom.missingController).toBe('SKIP');

        const supplyBefore = [...supply.items];
        const noiseBefore = [...noise.items];
        const bankBefore = [...bank.items];

        G.engine.effectQueue.push({
            ...grantAtom,
            context: { ...(grantAtom.context || {}), tileId: targetTileId, source: 'exp03:M03' }
        });

        expect(() => EffectResolver.resolve(G, ctx)).not.toThrow();
        expect(computeMajority(targetTileId, G).controller).toBeNull();
        expect(supply.items).toEqual(supplyBefore);
        expect(noise.items).toEqual(noiseBefore);
        expect(bank.items).toEqual(bankBefore);
    });
});
