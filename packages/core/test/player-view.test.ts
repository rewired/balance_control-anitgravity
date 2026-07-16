import { beforeEach, describe, it, expect } from 'vitest';
import { createBalanceControlGame } from '@balance-control/game';
import { SetupGame } from '../src/setup';
import { CoreZoneName } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';

describe('playerView', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('hides private zones (hand, staging) but shows PersonalSupply', () => {
        const game = createBalanceControlGame();
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        // Manually add a hand for player 1 to test privacy
        const otherHandId = `${CoreZoneName.PlayerHand}:1`;
        G.zones[otherHandId] = { id: otherHandId, items: ['secret_card'] };
        G.objects['secret_card'] = { id: 'secret_card', type: 'Card' };

        const view = game.playerView?.({ G, ctx, playerID: '0' }) as any;

        const otherSupplyId = `${CoreZoneName.PersonalSupply}:1`;
        // Task 0207: PersonalSupply is now public
        expect(view.zones[otherSupplyId]).toBeDefined();
        
        // Hand should still be hidden
        expect(view.zones[otherHandId]).toBeUndefined();
        expect(view.objects['secret_card']).toBeUndefined();
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

        const originalDrawPileItems = G.zones[CoreZoneName.DrawPile].items.slice();
        expect(originalDrawPileItems.length).toBeGreaterThan(0);

        const view = game.playerView?.({ G, ctx, playerID: '0' }) as any;
        const viewDrawPile = view.zones[CoreZoneName.DrawPile];

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
