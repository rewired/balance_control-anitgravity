import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnginePackRegistry, ExpansionRegistry } from '../src/expansion-registry';
import { SetupGame } from '../src/setup';
import { lookupMeasureDeckForObjectId } from '../src/engine/measure-deck-provider';
import { Expansion02 } from '../../expansion-02/src/index';
import { Expansion03 } from '../../expansion-03/src/index';
import { CorePack } from '../src/packs/core';

describe('Measure deck provider lookup', () => {
    beforeEach(() => {
        ExpansionRegistry.clear();
        EnginePackRegistry.registerPack(CorePack);
        ExpansionRegistry.register(Expansion02 as any);
        ExpansionRegistry.register(Expansion03 as any);
    });

    afterEach(() => {
        ExpansionRegistry.clear();
    });

    it('routes EXP-02 measure object ids to the EXP-02 measure zones', () => {
        const G = SetupGame({
            ctx: { numPlayers: 2, random: { Shuffle: (items: string[]) => items } } as any,
            setupData: { expansions: { ex01: false, ex02: true, ex03: false } }
        }) as any;

        const deck = lookupMeasureDeckForObjectId(G, 'exp02_measure_M01');
        expect(deck).toEqual({
            expansionId: 'exp02',
            deckId: 'measures',
            objectIdPrefix: 'exp02_measure_',
            drawPileId: 'EXP02_MeasureDrawPile',
            openZoneId: 'EXP02_OpenMeasures',
            recyclePileId: 'EXP02_MeasureRecyclePile',
            finalDiscardId: 'EXP02_MeasureFinalDiscard'
        });
    });

    it('routes EXP-03 measure object ids to the EXP-03 measure zones', () => {
        const G = SetupGame({
            ctx: { numPlayers: 2, random: { Shuffle: (items: string[]) => items } } as any,
            setupData: { expansions: { ex01: false, ex02: false, ex03: true } }
        }) as any;

        const deck = lookupMeasureDeckForObjectId(G, 'exp03_measure_M01');
        expect(deck).toEqual({
            expansionId: 'exp03',
            deckId: 'measures',
            objectIdPrefix: 'exp03_measure_',
            drawPileId: 'EXP03_MeasureDrawPile',
            openZoneId: 'EXP03_OpenMeasures',
            recyclePileId: 'EXP03_MeasureRecyclePile',
            finalDiscardId: 'EXP03_MeasureFinalDiscard'
        });
    });

    it('does not register disabled expansions as measure deck providers', () => {
        const G = SetupGame({
            ctx: { numPlayers: 2, random: { Shuffle: (items: string[]) => items } } as any,
            setupData: { expansions: { ex01: false, ex02: false, ex03: false } }
        }) as any;

        expect(() => lookupMeasureDeckForObjectId(G, 'exp02_measure_M01')).toThrowError(
            'MeasureDeckLookup: no provider matches measureObjectId "exp02_measure_M01".'
        );
        expect(() => lookupMeasureDeckForObjectId(G, 'exp03_measure_M01')).toThrowError(
            'MeasureDeckLookup: no provider matches measureObjectId "exp03_measure_M01".'
        );
    });

    it('fails deterministically when multiple enabled decks match the same object id', () => {
        ExpansionRegistry.register({
            id: 'exp01',
            name: 'Mock EXP-01',
            measureDecks: [
                {
                    id: 'conflict',
                    objectIdPrefix: 'exp02_measure_',
                    zones: {
                        drawPileId: 'X',
                        openZoneId: 'Y',
                        recyclePileId: 'Z',
                        finalDiscardId: 'W'
                    }
                }
            ]
        } as any);

        const G = SetupGame({
            ctx: { numPlayers: 2, random: { Shuffle: (items: string[]) => items } } as any,
            setupData: { expansions: { ex01: true, ex02: true, ex03: false } }
        }) as any;

        expect(() => lookupMeasureDeckForObjectId(G, 'exp02_measure_M01')).toThrowError(
            [
                'MeasureDeckLookup: multiple providers match measureObjectId "exp02_measure_M01".',
                'Matches:',
                '- exp01/conflict prefix="exp02_measure_"',
                '- exp02/measures prefix="exp02_measure_"'
            ].join('\n')
        );
    });
});
