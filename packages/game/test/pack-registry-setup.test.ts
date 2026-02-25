import { afterEach, describe, expect, it, beforeEach } from 'vitest';
import { EnginePackRegistry } from '../src/expansion-registry';
import { assemblePacks } from '../src/move-assembly';

describe('Pack Registry Setup Hooks', () => {
    const resetRegistry = () => {
        EnginePackRegistry.clear();
    };

    beforeEach(() => {
        resetRegistry();
    });

    afterEach(() => {
        resetRegistry();
    });

    it('invokes core preShuffle via registry (proves no direct CorePack import)', () => {
        resetRegistry();
        let sentinelTriggered = false;

        EnginePackRegistry.registerPack({
            id: 'core',
            name: 'Mock Core',
            manifest: {
                id: 'core',
                packVersion: '1.0.0',
                rulesetAnchor: 'MOCK-CORE v1.0.0',
                required: true,
            },
            moves: {
                'core.mockMove': () => {}
            },
            setup: {
                preShuffle: (G: any) => {
                    sentinelTriggered = true;
                    G.sentinel = true;
                }
            }
        } as any);

        const G: any = {
            zones: {},
            tiles: {},
            objects: {},
            meta: { cfg: { expansions: { ex01: false, ex02: false, ex03: false } } },
            engine: { attributes: { enabledExpansions: {} } }
        };

        const assembly = assemblePacks({ mode: 'enabled' });
        assembly.applySetupPreShuffle(G, {});

        expect(sentinelTriggered).toBe(true);
        expect(G.sentinel).toBe(true);
    });

    it('invokes core postShuffle via registry', () => {
        resetRegistry();
        let sentinelTriggered = false;

        EnginePackRegistry.registerPack({
            id: 'core',
            name: 'Mock Core',
            manifest: {
                id: 'core',
                packVersion: '1.0.0',
                rulesetAnchor: 'MOCK-CORE v1.0.0',
                required: true,
            },
            moves: {
                'core.mockMove': () => {}
            },
            setup: {
                postShuffle: (G: any) => {
                    sentinelTriggered = true;
                    G.postSentinel = true;
                }
            }
        } as any);

        const G: any = {
            zones: {},
            tiles: {},
            objects: {},
            meta: { cfg: { expansions: { ex01: false, ex02: false, ex03: false } } },
            engine: { attributes: { enabledExpansions: {} } }
        };

        const assembly = assemblePacks({ mode: 'enabled' });
        assembly.applySetupPostShuffle(G, {});

        expect(sentinelTriggered).toBe(true);
        expect(G.postSentinel).toBe(true);
    });
});
