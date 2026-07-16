import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnginePackRegistry } from '@balance-control/game';
import { SetupGame } from '../src/setup';
import { lookupMeasureDeckForObjectId } from '@balance-control/game';
import { registerTestPacks } from './_helpers/registerPacks';
import { makeDummyExpansionPack } from './_helpers/dummyPacks';

describe('Measure deck provider lookup', () => {
    const Exp01Pack = makeDummyExpansionPack({
        id: 'exp01',
        measureDecks: [{
            id: 'measures',
            objectIdPrefix: 'exp01_measure_',
            zones: {
                drawPileId: 'MeasureDrawPile',
                openZoneId: 'OpenMeasures',
                recyclePileId: 'MeasureRecyclePile',
                finalDiscardId: 'MeasureFinalDiscard'
            }
        }]
    });

    const Exp02Pack = makeDummyExpansionPack({
        id: 'exp02',
        measureDecks: [{
            id: 'measures',
            objectIdPrefix: 'exp02_measure_',
            zones: {
                drawPileId: 'EXP02_MeasureDrawPile',
                openZoneId: 'EXP02_OpenMeasures',
                recyclePileId: 'EXP02_MeasureRecyclePile',
                finalDiscardId: 'EXP02_MeasureFinalDiscard'
            }
        }]
    });

    const Exp03Pack = makeDummyExpansionPack({
        id: 'exp03',
        measureDecks: [{
            id: 'measures',
            objectIdPrefix: 'exp03_measure_',
            zones: {
                drawPileId: 'EXP03_MeasureDrawPile',
                openZoneId: 'EXP03_OpenMeasures',
                recyclePileId: 'EXP03_MeasureRecyclePile',
                finalDiscardId: 'EXP03_MeasureFinalDiscard'
            }
        }]
    });

    beforeEach(() => {
        registerTestPacks([Exp01Pack, Exp02Pack, Exp03Pack]);
    });

    afterEach(() => {
        EnginePackRegistry.clear();
    });

    it('routes EXP-01 measure object ids to the EXP-01 measure zones', () => {
        const G = SetupGame({
            ctx: { numPlayers: 2, random: { Shuffle: (items: string[]) => items } } as any,
            setupData: { expansions: { ex01: true, ex02: false, ex03: false } }
        }) as any;

        const deck = lookupMeasureDeckForObjectId(G, 'exp01_measure_M01');
        expect(deck).toEqual({
            expansionId: 'exp01',
            deckId: 'measures',
            objectIdPrefix: 'exp01_measure_',
            drawPileId: 'MeasureDrawPile',
            openZoneId: 'OpenMeasures',
            recyclePileId: 'MeasureRecyclePile',
            finalDiscardId: 'MeasureFinalDiscard'
        });
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
        registerTestPacks([
            makeDummyExpansionPack({
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
            }),
            Exp02Pack
        ]);

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
