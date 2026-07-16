
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EnginePackRegistry } from '@balance-control/game';
import { EngineModuleRegistry } from '@balance-control/game';
import { makeTestPack } from './_helpers/makeTestPack';
import type { GameState, GameConfig } from '@balance-control/rules';
import { coreMeasureAtoms } from '../src/engine/atoms/measure';

describe('Measure Dispatch Collision', () => {
    let G: GameState;
    let effectQueue: any[];

    const resetRegistry = () => {
        EnginePackRegistry.clear();
    };

    beforeEach(() => {
        resetRegistry();

        // Register minimal Core pack
        const corePack = makeTestPack({
            id: 'core',
            manifest: {
                id: 'core',
                required: true,
                packVersion: '0.0.0',
                rulesetAnchor: 'CORE-01 v0.0.0'
            }
        });
        EnginePackRegistry.registerPack(corePack);

        effectQueue = [];
        G = {
            objects: {},
            zones: {
                'PlayerHand:p1': { items: [] },
                'TestDeckA_Draw': { items: [] },
                'TestDeckA_Open': { items: [] },
                'TestDeckA_Recycle': { items: [] },
                'TestDeckA_Discard': { items: [] },
                'TestDeckB_Draw': { items: [] },
                'TestDeckB_Open': { items: [] },
                'TestDeckB_Recycle': { items: [] },
                'TestDeckB_Discard': { items: [] },
            },
            engine: {
                effectQueue
            },
            meta: {
                cfg: {
                    expansions: { ex01: true, ex02: true, ex03: false }
                }
            }
        } as unknown as GameState;
    });

    afterEach(() => {
        resetRegistry();
    });

    it('should dispatch M01 to the correct expansion based on object ID prefix', () => {
        resetRegistry();

        const corePack = makeTestPack({
            id: 'core',
            manifest: {
                id: 'core',
                required: true,
                packVersion: '0.0.0',
                rulesetAnchor: 'CORE-01 v0.0.0'
            }
        });
        EnginePackRegistry.registerPack(corePack);

        // Register Pack A (simulating EXP-01-00)
        const packA = makeTestPack({
            id: 'exp01',
            measureDecks: [{
                id: 'TestDeckA',
                objectIdPrefix: 'obj_A_',
                zones: {
                    drawPileId: 'TestDeckA_Draw',
                    openZoneId: 'TestDeckA_Open',
                    recyclePileId: 'TestDeckA_Recycle',
                    finalDiscardId: 'TestDeckA_Discard'
                }
            }],
            getMeasureAtoms: (G, measureId, payload) => {
                if (measureId === 'M01') {
                    return [{ kind: 'test.effect', source: 'EXP-01-00' }];
                }
                return null;
            }
        });
        EnginePackRegistry.registerPack(packA);

        // Register Pack B (simulating EXP-02-00)
        const packB = makeTestPack({
            id: 'exp02',
            measureDecks: [{
                id: 'TestDeckB',
                objectIdPrefix: 'obj_B_',
                zones: {
                    drawPileId: 'TestDeckB_Draw',
                    openZoneId: 'TestDeckB_Open',
                    recyclePileId: 'TestDeckB_Recycle',
                    finalDiscardId: 'TestDeckB_Discard'
                }
            }],
            getMeasureAtoms: (G, measureId, payload) => {
                if (measureId === 'M01') {
                    return [{ kind: 'test.effect', source: 'EXP-02-00' }];
                }
                return null;
            }
        });
        EnginePackRegistry.registerPack(packB);

        // Create objects
        G.objects['obj_A_100'] = { id: 'obj_A_100', type: 'Measure', measureId: 'M01' };
        G.objects['obj_B_200'] = { id: 'obj_B_200', type: 'Measure', measureId: 'M01' };

        // Test Dispatch for A
        const handler = coreMeasureAtoms.find(a => a.kind === 'measure.play')!.handler;

        // Play A
        handler(G, {}, { kind: 'measure.play', playerId: 'p1', measureObjectId: 'obj_A_100' });

        expect(effectQueue.length).toBe(1);
        expect(effectQueue[0]).toEqual({ kind: 'test.effect', source: 'EXP-01-00' });

        // Clear queue
        effectQueue.length = 0;

        // Play B
        handler(G, {}, { kind: 'measure.play', playerId: 'p1', measureObjectId: 'obj_B_200' });

        expect(effectQueue.length).toBe(1);
        expect(effectQueue[0]).toEqual({ kind: 'test.effect', source: 'EXP-02-00' });
    });

    it('should throw deterministic error if measure ID is unknown to the target expansion', () => {
        resetRegistry();

        const corePack = makeTestPack({
            id: 'core',
            manifest: {
                id: 'core',
                required: true,
                packVersion: '0.0.0',
                rulesetAnchor: 'CORE-01 v0.0.0'
            }
        });
        EnginePackRegistry.registerPack(corePack);

        effectQueue = [];
        G.engine = { effectQueue } as any;

        // Disable exp02 for this test to avoid "pack not registered" error
        G.meta.cfg!.expansions!.ex02 = false;

        // Register Pack A
        const packA = makeTestPack({
            id: 'exp01',
            measureDecks: [{
                id: 'TestDeckA',
                objectIdPrefix: 'obj_A_',
                zones: {
                    drawPileId: 'TestDeckA_Draw',
                    openZoneId: 'TestDeckA_Open',
                    recyclePileId: 'TestDeckA_Recycle',
                    finalDiscardId: 'TestDeckA_Discard'
                }
            }],
            getMeasureAtoms: (G, measureId, payload) => {
                // Only knows M01
                if (measureId === 'M01') return [];
                return null;
            }
        });
        EnginePackRegistry.registerPack(packA);

        // Create object with unknown measure ID M99
        G.objects['obj_A_999'] = { id: 'obj_A_999', type: 'Measure', measureId: 'M99' };

        const handler = coreMeasureAtoms.find(a => a.kind === 'measure.play')!.handler;

        expect(() => {
            handler(G, {}, { kind: 'measure.play', playerId: 'p1', measureObjectId: 'obj_A_999' });
        }).toThrow('Engine: measure "M99" not defined in expansion "exp01".');
    });

    it('should throw if expansion is not enabled/found', () => {
        resetRegistry();

        const corePack = makeTestPack({
            id: 'core',
            manifest: {
                id: 'core',
                required: true,
                packVersion: '0.0.0',
                rulesetAnchor: 'CORE-01 v0.0.0'
            }
        });
        EnginePackRegistry.registerPack(corePack);

        effectQueue = [];
        G.engine = { effectQueue } as any;

        // Disable exp02
        G.meta.cfg!.expansions!.ex02 = false;

        // Only register exp01, but object belongs to exp02 prefix (which isn't registered/enabled)
        // So this tests lookupMeasureDeckForObjectId behavior mostly, but let's confirm.

        const packA = makeTestPack({
            id: 'exp01',
            measureDecks: [{
                id: 'TestDeckA',
                objectIdPrefix: 'obj_A_',
                zones: {
                    drawPileId: 'TestDeckA_Draw',
                    openZoneId: 'TestDeckA_Open',
                    recyclePileId: 'TestDeckA_Recycle',
                    finalDiscardId: 'TestDeckA_Discard'
                }
            }],
            getMeasureAtoms: (G, measureId) => []
        });
        EnginePackRegistry.registerPack(packA);

        G.objects['obj_B_100'] = { id: 'obj_B_100', type: 'Measure', measureId: 'M01' };

        const handler = coreMeasureAtoms.find(a => a.kind === 'measure.play')!.handler;

        expect(() => {
            handler(G, {}, { kind: 'measure.play', playerId: 'p1', measureObjectId: 'obj_B_100' });
        }).toThrow('MeasureDeckLookup: no provider matches measureObjectId "obj_B_100".');
    });
});
