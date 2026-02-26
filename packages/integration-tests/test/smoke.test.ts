import { describe, it, expect, beforeEach } from 'vitest';
import {
    createBalanceControlGame,
    EnginePackRegistry,
} from '@balance-control/game';
import {
    registerCanonicalPacks
} from '@balance-control/packs';
import { CoreZoneName } from '@balance-control/rules';

const EXP01_ZONES = ['MeasureDrawPile', 'MeasureRecyclePile', 'MeasureFinalDiscard', 'OpenMeasures'] as const;
const EXP02_ZONES = [
    'RegulationSupply',
    'BoardAttached',
    'EXP02_MeasureDrawPile',
    'EXP02_MeasureRecyclePile',
    'EXP02_MeasureFinalDiscard',
    'EXP02_OpenMeasures',
] as const;
const EXP03_ZONES = [
    'CountdownSupply',
    'EXP03_MeasureDrawPile',
    'EXP03_MeasureRecyclePile',
    'EXP03_MeasureFinalDiscard',
    'EXP03_OpenMeasures',
] as const;

const setupCtx = {
    numPlayers: 2,
    playOrder: ['0', '1'],
    random: {
        Shuffle: <T>(arr: T[]) => [...arr],
        Die: () => 1,
    },
    events: {},
};

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
        // Setup with all expansions enabled
        const state = game.setup(setupCtx as any, {
            packs: { enabledPacks: ['core', 'exp01', 'exp02', 'exp03'] }
        });

        expect(state).toBeDefined();

        // Verify configuration matches
        expect(state.meta?.cfg?.packs?.enabledPacks).toEqual(['exp01', 'exp02', 'exp03']);

        // Verify Core zones exist
        expect(state.zones[CoreZoneName.DrawPile]).toBeDefined();
        expect(state.zones[CoreZoneName.Board]).toBeDefined();

        for (const zoneId of [...EXP01_ZONES, ...EXP02_ZONES, ...EXP03_ZONES]) {
            expect(state.zones[zoneId], `expected expansion zone ${zoneId} to exist`).toBeDefined();
        }
    });

    it('dispatches measures correctly across expansions', () => {
         // Register all packs
         registerCanonicalPacks();

         const game = createBalanceControlGame();
         const state = game.setup(setupCtx as any, {
             packs: { enabledPacks: ['core', 'exp01', 'exp02', 'exp03'] }
         });

         const decks = EnginePackRegistry.getMeasureDeckDescriptors(state);
         const stableProjection = decks.map(({ expansionId, deck }) => ({
             expansionId,
             deckId: deck.id,
             objectIdPrefix: deck.objectIdPrefix,
             zones: deck.zones,
         }));

         expect(stableProjection.length).toBeGreaterThan(0);
         expect(stableProjection).toEqual([
             {
                 expansionId: 'exp01',
                 deckId: 'measures',
                 objectIdPrefix: 'exp01_measure_',
                 zones: {
                     drawPileId: 'MeasureDrawPile',
                     openZoneId: 'OpenMeasures',
                     recyclePileId: 'MeasureRecyclePile',
                     finalDiscardId: 'MeasureFinalDiscard',
                 },
             },
             {
                 expansionId: 'exp02',
                 deckId: 'measures',
                 objectIdPrefix: 'exp02_measure_',
                 zones: {
                     drawPileId: 'EXP02_MeasureDrawPile',
                     openZoneId: 'EXP02_OpenMeasures',
                     recyclePileId: 'EXP02_MeasureRecyclePile',
                     finalDiscardId: 'EXP02_MeasureFinalDiscard',
                 },
             },
             {
                 expansionId: 'exp03',
                 deckId: 'measures',
                 objectIdPrefix: 'exp03_measure_',
                 zones: {
                     drawPileId: 'EXP03_MeasureDrawPile',
                     openZoneId: 'EXP03_OpenMeasures',
                     recyclePileId: 'EXP03_MeasureRecyclePile',
                     finalDiscardId: 'EXP03_MeasureFinalDiscard',
                 },
             },
         ]);

         const secondCallProjection = EnginePackRegistry.getMeasureDeckDescriptors(state).map(({ expansionId, deck }) => ({
             expansionId,
             deckId: deck.id,
             objectIdPrefix: deck.objectIdPrefix,
             zones: deck.zones,
         }));

         expect(secondCallProjection).toEqual(stableProjection);
    });

    it('omits deck descriptors and zones for disabled packs', () => {
         registerCanonicalPacks();

         const game = createBalanceControlGame();
         const state = game.setup(setupCtx as any, {
             packs: { enabledPacks: ['core', 'exp02'] }
         });

         const descriptors = EnginePackRegistry.getMeasureDeckDescriptors(state).map(({ expansionId, deck }) => ({
             expansionId,
             deckId: deck.id,
             objectIdPrefix: deck.objectIdPrefix,
         }));

         expect(descriptors).toEqual([
             {
                 expansionId: 'exp02',
                 deckId: 'measures',
                 objectIdPrefix: 'exp02_measure_',
             },
         ]);

         for (const zoneId of EXP02_ZONES) {
             expect(state.zones[zoneId], `expected enabled zone ${zoneId} to exist`).toBeDefined();
         }

         for (const zoneId of [...EXP01_ZONES, ...EXP03_ZONES]) {
             expect(state.zones[zoneId], `expected disabled zone ${zoneId} to be absent`).toBeUndefined();
         }

         expect(descriptors.some((entry) => entry.expansionId === 'exp01')).toBe(false);
         expect(descriptors.some((entry) => entry.expansionId === 'exp03')).toBe(false);
    });
});
