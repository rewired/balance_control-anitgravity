import { describe, it, expect } from 'vitest';
import { BalanceControl } from '../src/index';
import { SetupGame } from '../src/setup';
import { CoreZoneNames } from '@balance-control/rules';

describe('playerView', () => {
    it('hides other players private zones and objects', () => {
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });
        const view = BalanceControl.playerView?.({ G, ctx, playerID: '0' }) as any;

        const otherSupplyId = `${CoreZoneNames.PersonalSupply}:1`;
        const otherSupplyItems = G.zones[otherSupplyId].items;

        expect(view.zones[otherSupplyId]).toBeUndefined();
        expect(view.zones[`${CoreZoneNames.PersonalSupply}:0`]).toBeDefined();

        for (const itemId of otherSupplyItems) {
            expect(view.objects[itemId]).toBeUndefined();
        }
    });

    it('hides pendingChoice for other players', () => {
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });
        G.engine.pendingChoice = { player: '1', kind: 'yesNo' } as any;

        const view = BalanceControl.playerView?.({ G, ctx, playerID: '0' }) as any;
        const ownerView = BalanceControl.playerView?.({ G, ctx, playerID: '1' }) as any;

        expect(view.engine.pendingChoice).toBeUndefined();
        expect(ownerView.engine.pendingChoice).toEqual(G.engine.pendingChoice);
    });
});
