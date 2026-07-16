import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CoreZoneName } from '@balance-control/rules';
import { EnginePackRegistry } from '@balance-control/game';
import { SetupGame } from '../src/setup';
import { computeMajority } from '../src/mechanics';
import { EffectResolver } from '@balance-control/game';
import { registerTestPacks } from './_helpers/registerPacks';
import type { EnginePackDefinition } from '@balance-control/game';

describe('EXP-02 controller grants with no controller', () => {
    // Minimal dummy pack to satisfy registry
    const DummyExp02Pack: EnginePackDefinition = {
        id: 'exp02',
        name: 'Dummy Exp 02',
        manifest: { id: 'exp02', packVersion: '0.0.0', rulesetAnchor: 'EXP-02', required: false }
    };

    beforeEach(() => {
        registerTestPacks([DummyExp02Pack]);
    });

    afterEach(() => {
        EnginePackRegistry.clear();
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

        const hotspotId = 'tile_inner_order';

        // Since the dummy pack is empty, the tile won't be created by SetupGame.
        // We manually add it.
        G.tiles[hotspotId] = { id: hotspotId, type: 'Resort', resort: 'SEC' };
        G.zones[hotspotId] = { id: hotspotId, name: 'Inner Order', items: [] };
        G.zones[CoreZoneName.Board].items.push(hotspotId);

        expect(G.tiles[hotspotId]).toBeTruthy();
        expect(G.zones[hotspotId]).toBeTruthy();

        const pid = ctx.currentPlayer;
        const supply = G.zones[`${CoreZoneName.PersonalSupply}:${pid}`];
        const noise = G.zones[CoreZoneName.Noise];
        const bank = G.zones[CoreZoneName.Bank];

        expect(computeMajority(hotspotId, G).controller).toBeNull();

        // Manually construct the atom
        const grantAtom = {
            kind: 'resource.grant',
            playerId: 'CONTROLLER',
            amount: 1,
            resorts: ['SEC'],
            missingController: 'SKIP',
            targetTileId: hotspotId,
            context: { source: 'exp02:M03', tileId: hotspotId }
        };

        const supplyBefore = [...supply.items];
        const noiseBefore = [...noise.items];
        const bankBefore = [...bank.items];

        G.engine.effectQueue.push(grantAtom);

        expect(() => EffectResolver.resolve(G, ctx)).not.toThrow();
        expect(computeMajority(hotspotId, G).controller).toBeNull();
        expect(supply.items).toEqual(supplyBefore);
        expect(noise.items).toEqual(noiseBefore);
        expect(bank.items).toEqual(bankBefore);
    });
});
