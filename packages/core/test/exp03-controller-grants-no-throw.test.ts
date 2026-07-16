import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CoreZoneName, TileType } from '@balance-control/rules';
import { EnginePackRegistry } from '@balance-control/game';
import { SetupGame } from '../src/setup';
import { computeMajority } from '../src/mechanics';
import { EffectResolver } from '@balance-control/game';
import { registerTestPacks } from './_helpers/registerPacks';
import type { EnginePackDefinition } from '@balance-control/game';

describe('EXP-03-00 controller grants with no controller', () => {
    // Minimal dummy pack to satisfy registry
    const DummyExp03Pack: EnginePackDefinition = {
        id: 'exp03',
        name: 'Dummy Exp 03',
        manifest: { id: 'exp03', packVersion: '0.0.0', rulesetAnchor: 'EXP-03-00', required: false }
    };

    beforeEach(() => {
        registerTestPacks([DummyExp03Pack]);
    });

    afterEach(() => {
        EnginePackRegistry.clear();
    });

    it('should not throw and should not grant to Noise for uncontrolled EXP-03-00 effect path', () => {
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
        const drawPile = G.zones[CoreZoneName.DrawPile];
        const board = G.zones[CoreZoneName.Board];
        const supply = G.zones[`${CoreZoneName.PersonalSupply}:${pid}`];
        const noise = G.zones[CoreZoneName.Noise];
        const bank = G.zones[CoreZoneName.Bank];

        const targetTileId = drawPile.items.find((tileId: string) => G.tiles[tileId]?.type === TileType.Resort);
        expect(targetTileId).toBeTruthy();
        if (!targetTileId) {
            throw new Error('Expected setup to include at least one resort tile');
        }

        drawPile.items = drawPile.items.filter((tileId: string) => tileId !== targetTileId);
        board.items.push(targetTileId);
        expect(computeMajority(targetTileId, G).controller).toBeNull();

        // Manually construct the atom that would be produced by EXP-03-00 M03
        const grantAtom = {
            kind: 'resource.grant',
            playerId: 'CONTROLLER',
            amount: 1,
            resorts: ['CLM'],
            missingController: 'SKIP',
            targetTileId: targetTileId,
            context: { source: 'exp03:M03', tileId: targetTileId }
        };

        const supplyBefore = [...supply.items];
        const noiseBefore = [...noise.items];
        const bankBefore = [...bank.items];

        G.engine.effectQueue.push(grantAtom);

        expect(() => EffectResolver.resolve(G, ctx)).not.toThrow();
        expect(computeMajority(targetTileId, G).controller).toBeNull();
        expect(supply.items).toEqual(supplyBefore);
        expect(noise.items).toEqual(noiseBefore);
        expect(bank.items).toEqual(bankBefore);
    });
});
