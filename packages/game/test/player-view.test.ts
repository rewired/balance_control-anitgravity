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

    it('masks DrawPile items and filters hidden tile defs', () => {
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        const originalDrawPileItems = G.zones[CoreZoneNames.DrawPile].items.slice();
        expect(originalDrawPileItems.length).toBeGreaterThan(0);

        const view = BalanceControl.playerView?.({ G, ctx, playerID: '0' }) as any;
        const viewDrawPile = view.zones[CoreZoneNames.DrawPile];

        expect(viewDrawPile).toBeDefined();
        expect(viewDrawPile.items.length).toBe(originalDrawPileItems.length);

        for (const placeholderId of viewDrawPile.items) {
            expect(originalDrawPileItems).not.toContain(placeholderId);
            expect(G.tiles[placeholderId]).toBeUndefined();
            expect(G.objects[placeholderId]).toBeUndefined();
        }

        const hiddenTileId = originalDrawPileItems[0];
        expect(view.tiles[hiddenTileId]).toBeUndefined();

        expect(view.tiles['tile_start_committee']).toBeDefined();
    });
});
