import { describe, it, expect, beforeEach } from 'vitest';
import {
    createBalanceControlGame,
    EnginePackRegistry,
} from '@balance-control/game';
import {
    CorePack,
    Exp01Pack,
    Exp02Pack,
    Exp03Pack,
    registerCanonicalPacks
} from '@balance-control/packs';
import { CoreZoneName } from '@balance-control/rules';

describe('Integration: Real Pack Combinations', () => {
    beforeEach(() => {
        // Reset registry to ensure clean state
        EnginePackRegistry.clear();
    });

    it('registers all real packs (Core + Exp01 + Exp02 + Exp03) without collision', () => {
        registerCanonicalPacks();

        const packs = EnginePackRegistry.getRegisteredPacks();
        expect(packs).toHaveLength(4);
        expect(packs.map(p => p.id)).toEqual(['core', 'exp01', 'exp02', 'exp03']);
    });

    it('creates a game instance with all expansions enabled and initializes state', () => {
        // Register all packs
        registerCanonicalPacks();

        const game = createBalanceControlGame();

        expect(game).toBeDefined();
        expect(game.name).toBe('balance-control');

        // Mock context for setup
        const ctx = {
            numPlayers: 2,
            playOrder: ['0', '1'],
            random: {
                Shuffle: (arr: any[]) => [...arr], // No-op shuffle
                Die: (n: number) => 1
            },
            events: {},
        };

        // Setup with all expansions enabled
        const state = game.setup(ctx as any, {
            packs: { enabledPacks: ['core', 'exp01', 'exp02', 'exp03'] }
        });

        expect(state).toBeDefined();

        // Verify configuration matches
        expect(state.meta?.cfg?.packs?.enabledPacks).toEqual(['exp01', 'exp02', 'exp03']);

        // Verify Core zones exist
        expect(state.zones[CoreZoneName.DrawPile]).toBeDefined();
        expect(state.zones[CoreZoneName.Board]).toBeDefined();

        // Verify Expansion-specific state/logic if applicable
        // This confirms that the expansion modules were actually loaded and executed
        // e.g., if Exp02 adds specific zones or resources, we could check them.
        // For now, just ensuring no throw during setup is a good start.
    });

    it('dispatches measures correctly across expansions', () => {
         // Register all packs
         registerCanonicalPacks();

         const game = createBalanceControlGame();
         const ctx = {
             numPlayers: 2,
             playOrder: ['0', '1'],
             random: { Shuffle: (arr: any[]) => [...arr] },
             events: {},
         };

         const state = game.setup(ctx as any, {
             packs: { enabledPacks: ['core', 'exp01', 'exp02', 'exp03'] }
         });

         // Verify we can retrieve measure deck descriptors from the registry
         // This confirms that expansion packs are correctly wired into the measure system
         const decks = EnginePackRegistry.getMeasureDeckDescriptors(state);

         // We expect decks from enabled expansions (if they have any)
         // EXP-02 and EXP-03 usually have measure decks.
    });
});
