import { describe, it, expect, beforeEach } from 'vitest';
import { SetupGame } from '../src/setup';
import { EnginePackRegistry } from '../src/expansion-registry';
import { registerTestPacks } from './_helpers/registerPacks';
import { CoreZoneName, RULESET_MANIFEST, TileType } from '@balance-control/rules';
import { makeTestPack } from './_helpers/makeTestPack';

function createSeededRandom(seed: number) {
    let state = seed >>> 0;

    const next = (): number => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 0x100000000;
    };

    return {
        Shuffle<T>(items: T[]): T[] {
            const shuffled = [...items];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(next() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
            },
            Die(n: number): number {
                return Math.floor(next() * n) + 1;
        }
    };
}


describe('SetupGame', () => {
    const resetRegistry = () => {
        registerTestPacks();
    };

    beforeEach(() => {
        resetRegistry();
    });

    const withTemporaryRulesetManifest = (
        overrides: Partial<Pick<typeof RULESET_MANIFEST, 'coreVersion' | 'specAnchorHash'>>,
        run: () => void,
    ) => {
        const previousCoreVersion = RULESET_MANIFEST.coreVersion;
        const previousSpecAnchorHash = RULESET_MANIFEST.specAnchorHash;

        try {
            if (overrides.coreVersion !== undefined) {
                RULESET_MANIFEST.coreVersion = overrides.coreVersion;
            }
            if (overrides.specAnchorHash !== undefined) {
                RULESET_MANIFEST.specAnchorHash = overrides.specAnchorHash;
            }
            run();
        } finally {
            RULESET_MANIFEST.coreVersion = previousCoreVersion;
            RULESET_MANIFEST.specAnchorHash = previousSpecAnchorHash;
        }
    };

    /** @rule CORE-01-02-04 */
    it('should generate correct number of core tiles', () => {
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        const drawPile = G.zones[CoreZoneName.DrawPile].items;

        // Resorts: 3 types * 12 = 36
        // Committees: 10
        // Grassroots: 8
        // Lobbyists: 9
        // Hotspots: 8
        // Total = 71
        expect(drawPile.length).toBe(71);

        const tiles = drawPile.map(id => G.tiles[id]);

        const resorts = tiles.filter(t => t.type === TileType.Resort);
        expect(resorts.length).toBe(36);

        const committees = tiles.filter(t => t.type === TileType.Committee);
        expect(committees.length).toBe(10);

        const hotspots = tiles.filter(t => t.type === TileType.Hotspot);
        expect(hotspots.length).toBe(8);
    });

    /** @rule CORE-01-02-04 */
    it('should add ADD56 tiles when 5-6 players', () => {
        const ctx: any = { numPlayers: 5, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        const drawPile = G.zones[CoreZoneName.DrawPile].items;
        // Core 71 + ADD56 5-6 Player Add-On: 9 Resort(W2-4) + 2 Committee + 3 Lobbyist + 2 Grassroots + 2 Hotspot = 89
        expect(drawPile.length).toBe(89);

        const tiles = drawPile.map(id => G.tiles[id]);
        const resorts = tiles.filter(t => t.type === TileType.Resort);
        expect(resorts.length).toBe(45); // 36 + 9
        const committees = tiles.filter(t => t.type === TileType.Committee);
        expect(committees.length).toBe(12); // 10 + 2
        const lobbyists = tiles.filter(t => t.type === TileType.Lobbyist);
        expect(lobbyists.length).toBe(12); // 9 + 3
        const grassroots = tiles.filter(t => t.type === TileType.Grassroots);
        expect(grassroots.length).toBe(10); // 8 + 2
        const hotspots = tiles.filter(t => t.type === TileType.Hotspot);
        expect(hotspots.length).toBe(10); // 8 + 2
    });

    /** @rule CORE-01-03-01 */
    it('should place Start Committee on Board', () => {
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        const board = G.zones[CoreZoneName.Board].items;
        expect(board.length).toBe(1);
        expect(G.tiles[board[0]].type).toBe(TileType.StartCommittee);
    });

    /** @rule CORE-01-02-17A */
    it('should create one meta-marker per player in personal supply', () => {
        const ctx: any = { numPlayers: 3, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });

        const markers = Object.values(G.objects).filter(obj => obj.type === 'MetaMarker');
        expect(markers.length).toBe(3);

        for (const marker of markers) {
            const supplyId = `${CoreZoneName.PersonalSupply}:${marker.owner}`;
            expect(G.zones[supplyId].items).toContain(marker.id);
        }
    });

    it('should stamp ruleset manifest in game state meta', () => {
        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx });
        expect(G.meta?.ruleset).toEqual({
            coreVersion: RULESET_MANIFEST.coreVersion,
            expansions: {},
            specAnchorHash: RULESET_MANIFEST.specAnchorHash,
        });
    });


    it('should persist effective boardgame.io match seed into engine attributes', () => {
        const ctx: any = {
            numPlayers: 2,
            random: {
                _private: { state: { seed: 'setup-seed-123' } },
                Shuffle: (arr: any[]) => arr,
                Die: () => 1,
            },
        };

        const G = SetupGame({ ctx });
        expect(G.engine.attributes.seed).toBe('setup-seed-123');
    });

    it('should keep ruleset manifest stable for identical setup data', () => {
        const ctxA: any = { numPlayers: 2, random: createSeededRandom(42) };
        const ctxB: any = { numPlayers: 2, random: createSeededRandom(42) };
        const G1 = SetupGame({ ctx: ctxA });
        const G2 = SetupGame({ ctx: ctxB });
        expect(G1.meta?.ruleset).toEqual(G2.meta?.ruleset);
    });

    it('should source ruleset metadata from central manifest export (no local literals)', () => {
        const overriddenCoreVersion = 'v-test-core-version';
        const overriddenSpecAnchorHash = 'v-test-spec-anchor-hash';

        withTemporaryRulesetManifest(
            {
                coreVersion: overriddenCoreVersion,
                specAnchorHash: overriddenSpecAnchorHash,
            },
            () => {
            const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
            const G = SetupGame({ ctx });

            expect(G.meta.ruleset.coreVersion).toBe(overriddenCoreVersion);
            expect(G.meta.ruleset.specAnchorHash).toBe(overriddenSpecAnchorHash);
            },
        );
    });

    it('should not apply ex01 setup when ex01 flag is disabled', () => {
        resetRegistry();
        const mockPack = makeTestPack({
            id: 'exp01',
            name: 'EXP-01 Economy & Labor',
            setup: {
                preShuffle: (G) => {
                    G.tiles.tile_ex01_mock = { id: 'tile_ex01_mock', type: TileType.Resort, resort: 'ECO', weight: 1 };
                    G.zones[CoreZoneName.DrawPile].items.push('tile_ex01_mock');
                    G.zones.tile_ex01_mock = { id: 'tile_ex01_mock', name: 'EX01 Mock', items: [] };
                }
            }
        });
        EnginePackRegistry.registerPack(mockPack);

        const ctx: any = { numPlayers: 2, random: { Shuffle: (arr: any[]) => arr } };
        const G = SetupGame({ ctx, setupData: { expansions: { ex01: false } } });

        expect(G.zones[CoreZoneName.DrawPile].items.includes('tile_ex01_mock')).toBe(false);
        expect(G.tiles.tile_ex01_mock).toBeUndefined();
    });

    it('should apply ex01 setup when enabled and keep deterministic deck composition', () => {
        resetRegistry();
        const mockPack = makeTestPack({
            id: 'exp01',
            name: 'EXP-01 Economy & Labor',
            setup: {
                preShuffle: (G) => {
                    G.tiles.tile_ex01_mock = { id: 'tile_ex01_mock', type: TileType.Resort, resort: 'ECO', weight: 1 };
                    G.zones[CoreZoneName.DrawPile].items.push('tile_ex01_mock');
                    G.zones.tile_ex01_mock = { id: 'tile_ex01_mock', name: 'EX01 Mock', items: [] };
                }
            }
        });
        EnginePackRegistry.registerPack(mockPack);

        const enabledA = SetupGame({
            ctx: { numPlayers: 2, random: createSeededRandom(2028) } as any,
            setupData: { expansions: { ex01: true } }
        });
        const enabledB = SetupGame({
            ctx: { numPlayers: 2, random: createSeededRandom(2028) } as any,
            setupData: { expansions: { ex01: true } }
        });
        const disabled = SetupGame({
            ctx: { numPlayers: 2, random: createSeededRandom(2028) } as any,
            setupData: { expansions: { ex01: false } }
        });

        expect(enabledA.zones[CoreZoneName.DrawPile].items.includes('tile_ex01_mock')).toBe(true);
        expect(enabledB.zones[CoreZoneName.DrawPile].items.includes('tile_ex01_mock')).toBe(true);
        expect(disabled.zones[CoreZoneName.DrawPile].items.includes('tile_ex01_mock')).toBe(false);
        expect(enabledA.zones[CoreZoneName.DrawPile].items).toEqual(enabledB.zones[CoreZoneName.DrawPile].items);
        expect(enabledA.zones[CoreZoneName.DrawPile].items).not.toEqual(disabled.zones[CoreZoneName.DrawPile].items);
    });

    /** @rule CORE-01-03-03 */
    /** @rule CORE-01-03-02A.2 */
    it('should determine starting player via canonical RNG and apply handicap (CORE-01-03-02A.2, VAR-01-02-02)', () => {
        // We need a seeded random that we can predict
        // Seed 42 for 2 players:
        // shuffleFisherYates will consume RNG based on draw pile size (71 items)
        // Then one Die(2) call for starting player.
        const ctx: any = {
            numPlayers: 2,
            random: createSeededRandom(42)
        };

        const G = SetupGame({ ctx, setupData: { firstPlayerHandicap: true } });

        const startingPlayerIndex = G.engine.attributes.startingPlayerIndex;
        expect(startingPlayerIndex).toBeGreaterThanOrEqual(0);
        expect(startingPlayerIndex).toBeLessThan(2);

        // Verify handicap: starting player should have 3 influence, other should have 4 (for 2 players)
        for (let i = 0; i < 2; i++) {
            const pid = i.toString();
            const supplyId = `${CoreZoneName.PersonalSupply}:${pid}`;
            const influence = G.zones[supplyId].items.filter(id => G.objects[id].type === 'Influence');

            if (i === startingPlayerIndex) {
                expect(influence.length).toBe(3);
            } else {
                expect(influence.length).toBe(4);
            }
        }
    });
});
