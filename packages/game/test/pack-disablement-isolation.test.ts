import { describe, it, expect, beforeEach } from 'vitest';
import { EnginePackRegistry } from '../src/expansion-registry';
import { makeTestPack } from './_helpers/makeTestPack';
import type { GameConfig, GameState } from '@balance-control/rules';

describe('Pack Disablement Isolation', () => {
    beforeEach(() => {
        EnginePackRegistry.clear();
    });

    it('should not leak moves from disabled packs', () => {
        const pack = makeTestPack({
            id: 'exp01',
            moves: {
                testMove: (G: any) => G,
            },
        });
        EnginePackRegistry.registerPack(pack);

        const core = makeTestPack({
            id: 'core',
            manifest: {
                id: 'core',
                required: true,
                packVersion: '1.1.0',
                rulesetAnchor: 'CORE-01 v1.1.0'
            }
        });
        EnginePackRegistry.registerPack(core);

        const config: GameConfig = {
            expansions: { ex01: false, ex02: false, ex03: false },
        };

        const enabledMoveModules = EnginePackRegistry.getEnabledMoveModules(config);
        const hasExp01 = enabledMoveModules.some(m => m.moduleId === 'exp01');
        expect(hasExp01).toBe(false);
    });

    it('should not leak deck descriptors from disabled packs', () => {
        const pack = makeTestPack({
            id: 'exp01',
            measureDecks: [{ id: 'test-deck', name: 'Test Deck' } as any],
        });
        EnginePackRegistry.registerPack(pack);

        const core = makeTestPack({
            id: 'core',
            manifest: {
                id: 'core',
                required: true,
                packVersion: '1.1.0',
                rulesetAnchor: 'CORE-01 v1.1.0'
            }
        });
        EnginePackRegistry.registerPack(core);

        const G: Partial<GameState> = {
            meta: {
                cfg: {
                    expansions: { ex01: false, ex02: false, ex03: false }
                } as GameConfig
            } as any
        };

        const decks = EnginePackRegistry.getMeasureDeckDescriptors(G as GameState);
        const hasTestDeck = decks.some(d => d.deck.id === 'test-deck');
        expect(hasTestDeck).toBe(false);
    });

    it('should not leak production modifiers from disabled packs', () => {
        let modifierCalled = false;
        const pack = makeTestPack({
            id: 'exp01',
            modifiers: {
                production: (tileId: string, G: any, amount: number) => {
                    modifierCalled = true;
                    return amount + 10;
                }
            }
        });
        EnginePackRegistry.registerPack(pack);

        const core = makeTestPack({
            id: 'core',
            manifest: {
                id: 'core',
                required: true,
                packVersion: '1.1.0',
                rulesetAnchor: 'CORE-01 v1.1.0'
            }
        });
        EnginePackRegistry.registerPack(core);

        const config: GameConfig = { expansions: { ex01: false, ex02: false, ex03: false } };
        const G: Partial<GameState> = { meta: { cfg: config } as any };

        const result = EnginePackRegistry.applyProductionModifiers(G as GameState, 'tile1', 5, config);
        expect(result).toBe(5);
        expect(modifierCalled).toBe(false);
    });

    it('should not leak effects from disabled packs', () => {
        let effectCalled = false;
        const pack = makeTestPack({
            id: 'exp01',
            effectHandlers: {
                TEST_EFFECT: (G: any, ctx: any, effect: any, utils: any) => {
                    effectCalled = true;
                }
            }
        });
        EnginePackRegistry.registerPack(pack);

        const core = makeTestPack({
            id: 'core',
            manifest: {
                id: 'core',
                required: true,
                packVersion: '1.1.0',
                rulesetAnchor: 'CORE-01 v1.1.0'
            }
        });
        EnginePackRegistry.registerPack(core);

        const config: GameConfig = { expansions: { ex01: false, ex02: false, ex03: false } };
        const G: Partial<GameState> = { meta: { cfg: config } as any };

        EnginePackRegistry.applyEffect(G as GameState, {}, { type: 'TEST_EFFECT' }, undefined, {}, config);
        expect(effectCalled).toBe(false);
    });

    it('should not leak measure atoms from disabled packs', () => {
        const pack = makeTestPack({
            id: 'exp01',
            getMeasureAtoms: (G: any, measureId: string, payload: any) => {
                return [{ type: 'LEAK' }];
            }
        });
        EnginePackRegistry.registerPack(pack);

        const core = makeTestPack({
            id: 'core',
            manifest: {
                id: 'core',
                required: true,
                packVersion: '1.1.0',
                rulesetAnchor: 'CORE-01 v1.1.0'
            }
        });
        EnginePackRegistry.registerPack(core);

        const config: GameConfig = { expansions: { ex01: false, ex02: false, ex03: false } };
        const G: Partial<GameState> = { meta: { cfg: config } as any };

        const atoms = EnginePackRegistry.getMeasureAtoms(G as GameState, 'm1', {});
        expect(atoms).toBeNull();

        // Also verify the new API throws for disabled pack
        expect(() => {
            EnginePackRegistry.getMeasureAtomsForExpansion(G as GameState, 'exp01', 'm1', {});
        }).toThrow('EnginePackRegistry: expansion "exp01" not found or not enabled.');
    });
});
