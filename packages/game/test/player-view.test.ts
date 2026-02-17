import { beforeEach, describe, it, expect } from 'vitest';
import { createBalanceControlGame } from '../src/index';
import { SetupGame } from '../src/setup';
import { CoreZoneNames } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';

describe('playerView', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('hides other players private zones and objects', () => {
        const game = createBalanceControlGame();
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });
        const view = game.playerView?.({ G, ctx, playerID: '0' }) as any;

        const otherSupplyId = `${CoreZoneNames.PersonalSupply}:1`;
        const otherSupplyItems = G.zones[otherSupplyId].items;

        expect(view.zones[otherSupplyId]).toBeUndefined();
        expect(view.zones[`${CoreZoneNames.PersonalSupply}:0`]).toBeDefined();

        for (const itemId of otherSupplyItems) {
            expect(view.objects[itemId]).toBeUndefined();
        }
    });

    it('hides pendingChoice for other players', () => {
        const game = createBalanceControlGame();
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });
        G.engine.pendingChoice = { player: '1', kind: 'yesNo' } as any;

        const view = game.playerView?.({ G, ctx, playerID: '0' }) as any;
        const ownerView = game.playerView?.({ G, ctx, playerID: '1' }) as any;

        expect(view.engine.pendingChoice).toBeUndefined();
        expect(ownerView.engine.pendingChoice).toEqual(G.engine.pendingChoice);
    });

    it('masks DrawPile items and filters hidden tile defs', () => {
        const game = createBalanceControlGame();
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        const originalDrawPileItems = G.zones[CoreZoneNames.DrawPile].items.slice();
        expect(originalDrawPileItems.length).toBeGreaterThan(0);

        const view = game.playerView?.({ G, ctx, playerID: '0' }) as any;
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
