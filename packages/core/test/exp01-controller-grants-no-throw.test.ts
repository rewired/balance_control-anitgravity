import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { EnginePackRegistry } from '@balance-control/game';
import { SetupGame } from '../src/setup';
import { EffectResolver } from '@balance-control/game';
import { registerTestPacks } from './_helpers/registerPacks';
import { makeDummyExpansionPack } from './_helpers/dummyPacks';

describe('EXP-01 controller grants with no controller', () => {
    const DummyExp01Pack = makeDummyExpansionPack({ id: 'exp01' });

    beforeEach(() => {
        registerTestPacks([DummyExp01Pack]);
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

        // Manual atom instead of Expansion01.getMeasureAtoms
        const atom = {
            kind: 'resource.grant',
            playerId: 'CONTROLLER',
            amount: 1,
            resorts: ['ECO'],
            missingController: 'SKIP',
            targetTileId: resortTileId,
            context: { source: 'exp01:M02', tileId: resortTileId }
        };

        const supplyBefore = [...supply.items];
        const noiseBefore = [...noise.items];
        const bankBefore = [...bank.items];

        G.engine.effectQueue.push(atom);
        expect(EffectResolver.resolve(G, ctx)).toBe(true);

        expect(supply.items).toEqual(supplyBefore);
        expect(noise.items).toEqual(noiseBefore);
        expect(bank.items).toEqual(bankBefore);
    });
});
