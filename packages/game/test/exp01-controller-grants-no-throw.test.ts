import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { Expansion01 } from '../../expansion-01/src/index';
import { Exp01Pack } from '../src';
import { EnginePackRegistry } from '../src/expansion-registry';
import { SetupGame } from '../src/setup';
import { EffectResolver } from '../src/engine/resolver';
import { registerTestPacks } from './_helpers/registerPacks';

describe('EXP-01 controller grants with no controller', () => {
    beforeEach(() => {
        registerTestPacks([Exp01Pack]);
    });

    afterEach(() => {
        EnginePackRegistry.clear();
    });

    it('should not throw and should SKIP grant when controller is missing', () => {
        const ctx: any = {
            currentPlayer: '0',
            numPlayers: 2,
            random: { Shuffle: (items: string[]) => items }
        };

        const G = SetupGame({
            ctx,
            setupData: { expansions: { ex01: true, ex02: false, ex03: false } }
        }) as any;

        const pid = '0';
        const drawPile = G.zones[CoreZoneName.DrawPile];
        const board = G.zones[CoreZoneName.Board];
        const supply = G.zones[`${CoreZoneName.PersonalSupply}:${pid}`];
        const noise = G.zones[CoreZoneName.Noise];
        const bank = G.zones[CoreZoneName.Bank];

        const resortTileId = drawPile.items.find((tileId: string) => G.tiles[tileId]?.type === TileType.Resort);
        expect(resortTileId).toBeTruthy();

        drawPile.items = drawPile.items.filter((tileId: string) => tileId !== resortTileId);
        board.items.push(resortTileId);

        const ecoResourceId = 'res_eco_tripwire';
        G.objects[ecoResourceId] = {
            id: ecoResourceId,
            type: 'Resource',
            owner: pid,
            resort: 'ECO'
        };
        supply.items.push(ecoResourceId);

        const atoms = Expansion01.getMeasureAtoms(G, 'M02', {
            playerId: pid,
            targetTileId: resortTileId
        });
        expect(atoms).toBeTruthy();
        G.engine.effectQueue.push(...(atoms || []));
        expect(EffectResolver.resolve(G, ctx)).toBe(true);

        const supplyBefore = [...supply.items];
        const noiseBefore = [...noise.items];
        const bankBefore = [...bank.items];

        G.engine.effectQueue.push({ kind: 'production.resolve', tileId: resortTileId });
        expect(() => EffectResolver.resolve(G, ctx)).not.toThrow();

        expect(supply.items).toEqual(supplyBefore);
        expect(noise.items).toEqual(noiseBefore);
        expect(bank.items).toEqual(bankBefore);
    });
});
