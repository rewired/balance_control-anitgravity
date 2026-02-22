
import { describe, it, expect, beforeEach } from 'vitest';
import { createBalanceControlGame } from '../src/index';
import { SetupGame } from '../src/setup';
import { CoreZoneName } from '@balance-control/rules';
import { registerTestPacks } from './_helpers/registerPacks';

describe('Player View Visibility (Task 0207)', () => {
    beforeEach(() => {
        registerTestPacks();
    });

    it('PersonalSupply zones are visible to all players', () => {
        const game = createBalanceControlGame();
        // Setup a 2-player game
        const G = SetupGame({ ctx: { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } } });

        // Populate player 1's supply with some dummy items if empty (SetupGame might already do this)
        // Check initial state
        const p1SupplyId = `${CoreZoneName.PersonalSupply}:1`;
        expect(G.zones[p1SupplyId]).toBeDefined();

        // View as Player 0
        // @ts-ignore
        const view = game.playerView({ G, playerID: '0', ctx: {} });

        // Assert: Player 1's supply should be visible to Player 0
        expect(view.zones[p1SupplyId]).toBeDefined();
        expect(view.zones[p1SupplyId].items).toEqual(G.zones[p1SupplyId].items);
    });

    it('DrawPile remains masked', () => {
        const game = createBalanceControlGame();
        const G = SetupGame({ ctx: { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } } });

        // @ts-ignore
        const view = game.playerView({ G, playerID: '0', ctx: {} });

        const drawPileId = CoreZoneName.DrawPile;
        const realItems = G.zones[drawPileId].items;
        const viewItems = view.zones[drawPileId].items;

        expect(viewItems.length).toBe(realItems.length);
        // Should not be the same IDs (placeholders)
        if (realItems.length > 0) {
            expect(viewItems[0]).not.toEqual(realItems[0]);
            expect(viewItems[0]).toMatch(/^__drawpile_/);
        }
    });

    it('Staging and PlayerHand remain private', () => {
        const game = createBalanceControlGame();
        const G = SetupGame({ ctx: { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } } });

        const p1HandId = `${CoreZoneName.PlayerHand}:1`;
        const p1StagingId = `staging_1`;

        // Ensure zones exist in G
        if (!G.zones[p1HandId]) G.zones[p1HandId] = { id: p1HandId, items: [], type: 'zone' };
        if (!G.zones[p1StagingId]) G.zones[p1StagingId] = { id: p1StagingId, items: [], type: 'zone' };

        // View as Player 0
        // @ts-ignore
        const view = game.playerView({ G, playerID: '0', ctx: {} });

        // Assert: Player 1's hand and staging should NOT be visible
        expect(view.zones[p1HandId]).toBeUndefined();
        expect(view.zones[p1StagingId]).toBeUndefined();
    });
});
